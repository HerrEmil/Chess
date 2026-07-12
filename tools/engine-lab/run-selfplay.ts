/*
 * Standalone self-play runner. Bundle with esbuild and run with Node
 * (see tools/engine-lab/README.md):
 *
 *   npx esbuild tools/engine-lab/run-selfplay.ts --bundle --platform=node \
 *     --format=esm --outfile=build/selfplay.mjs && \
 *     node build/selfplay.mjs [games] [depth] [seed]
 *
 * Prints a match summary of the current engine (new eval) vs the previous
 * engine (legacy eval). Deterministic for a given seed.
 */
import './dom-shim.js';
import { runMatch } from './selfplay.js';

const games = Number(process.argv[2] ?? 100);
const depth = Number(process.argv[3] ?? 2);
const seed = Number(process.argv[4] ?? 1);

const start = Date.now();
const result = runMatch({ games, depth, seed });
const elapsed = ((Date.now() - start) / 1000).toFixed(1);

const pct = ((result.newScore / result.games) * 100).toFixed(1);

console.log(`self-play: new engine vs old engine`);
console.log(
  `  games=${result.games} depth=${depth} seed=${seed} (${elapsed}s)`,
);
console.log(
  `  new: ${result.newScore} (${result.newWins}W ${result.draws}D ${result.oldWins}L)  old: ${result.oldScore}`,
);
console.log(`  new score: ${pct}%  (>=50% = non-regression)`);
console.log(`  end reasons: ${JSON.stringify(result.reasons)}`);
