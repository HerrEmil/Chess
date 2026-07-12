# engine-lab

A DOM-free lab for iterating on the chess engine (`src/chess/ai.ts`).

## Self-play harness

`selfplay.ts` plays the current engine (new eval) against the previous engine
(legacy eval) over many seeded, reproducible games. It reuses the production
pure primitives (`negamax`, `applyMove`, `positionKey`, `isInCheck`) so headless
game mechanics are identical to the real game — only the evaluation function
handed to `negamax` differs between the two players.

The two engines are selected via the `mirror` flag on `evaluate()`:

- **new** — `evaluate(board, color, true)`: piece-square tables mirrored per color
- **legacy** — `evaluate(board, color, false)`: pre-fix single-orientation tables

### Run a match

```sh
npx esbuild tools/engine-lab/run-selfplay.ts --bundle --platform=node \
  --format=esm --outfile=build/selfplay.mjs \
  && node build/selfplay.mjs [games] [depth] [seed]
```

Defaults: `games=100 depth=2 seed=1`. Each opening is played twice with colors
swapped so first-move advantage cancels; score is win=1, draw=0.5, loss=0 for the
new engine. `>= 50%` means non-regression.

A small deterministic non-regression check also runs as part of `yarn test`
(`src/chess/__tests__/selfplay.test.ts`).

## Ledger

`experiments.jsonl` — one line per experiment: the change, self-play results,
gate status, and accept/reject decision. Read it before starting a new
experiment and append to it when one lands.
