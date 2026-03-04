// Mock jQuery and window globals before chess modules load.
// jsdom provides window/document, but we need $ and window.game.

// Build a proxy-based jQuery mock that returns itself for any method call,
// preventing errors from deep jQuery chains in module-level side effects.
const createJqueryMock = (): any => {
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      // Return primitive values for specific properties
      if (prop === 'length') return 0;
      if (prop === 'then') return undefined; // Not a promise
      if (prop === Symbol.toPrimitive) return () => '';
      if (prop === Symbol.iterator) return function* () {};
      // For 'ready', return a no-op (don't call the init function)
      // For all other properties, return a function that returns the proxy
      return (..._args: any[]) => proxy;
    },
    apply() {
      return proxy;
    },
  };

  const proxy: any = new Proxy(function () {}, handler);
  return proxy;
};

(globalThis as any).$ = createJqueryMock();
(globalThis as any).jQuery = (globalThis as any).$;
