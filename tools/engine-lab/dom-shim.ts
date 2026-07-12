/*
 * Minimal DOM shim so the engine modules can be imported in a plain Node
 * process. `main.ts` has top-level side effects (`window.startGame = ...`,
 * `document.addEventListener(...)`) that only need `window`/`document` to
 * exist — the engine functions the harness calls never touch the DOM.
 *
 * Imported *first* by the standalone runner so it executes before the bundled
 * engine modules' top-level code. Not needed under vitest (jsdom provides a
 * real DOM).
 */
const g = globalThis as unknown as {
  window?: unknown;
  document?: unknown;
};

g.window ??= {};
g.document ??= { addEventListener: (): void => undefined };
