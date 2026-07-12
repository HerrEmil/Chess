// Regenerate the derived move + FEN cache for every encyclopedia entry.
//
// Each data/*.json file is authored with human source fields (slug, eco, name,
// line, prose, ...). `line` is a space-separated SAN main line (no move
// numbers). This script replays that line through the independent engine in
// chess.mjs and writes back `moves` ([{ san, from, to }]) and `fen` (the
// resulting standard FEN). The vitest gate then re-verifies both against the
// repo's OWN move generator, so a bug in either engine surfaces as a red test.
//
// Usage: node src/encyclopedia/scripts/derive.mjs

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { applyLine, STANDARD_START } from './chess.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, '..', 'data');

const files = readdirSync(dataDir)
  .filter((f) => f.endsWith('.json'))
  .sort();

let changed = 0;
for (const file of files) {
  const path = join(dataDir, file);
  const entry = JSON.parse(readFileSync(path, 'utf8'));
  const startFen = entry.startFen ?? STANDARD_START;
  const { moves, fen } = applyLine(startFen, entry.line);

  const next = { ...entry, startFen, moves, fen };
  const serialized = `${JSON.stringify(next, null, 2)}\n`;
  if (serialized !== readFileSync(path, 'utf8')) {
    writeFileSync(path, serialized);
    changed += 1;
  }
  process.stdout.write(
    `  ${entry.slug.padEnd(26)} ${moves.length} ply  ${fen}\n`,
  );
}

process.stdout.write(
  `\nderived ${files.length} entries (${changed} rewritten)\n`,
);
