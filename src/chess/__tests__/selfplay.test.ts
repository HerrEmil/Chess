import { describe, it, expect } from 'vitest';
import { evaluate } from '../ai.js';
import { boardWithPieces, STARTING_BOARD } from './helpers.js';
import { runMatch } from '../../../tools/engine-lab/selfplay.js';

/*
 * Experiment #1: piece-square tables are now mirrored per color. The tables are
 * authored from White's perspective; Black's lookups use the vertically-flipped
 * index. These tests lock in the correctness property and guard against a
 * self-play strength regression.
 */

describe('per-color piece-square mirroring', () => {
  it('makes the evaluation color-symmetric on the starting position', () => {
    // A color-symmetric position must score 0 for either side (equal material,
    // mirror-image structure). This is the property the old eval violated.
    expect(evaluate(STARTING_BOARD, 'white', true)).toBe(0);
    expect(evaluate(STARTING_BOARD, 'black', true)).toBe(0);
  });

  it('legacy (non-mirrored) eval was asymmetric — the bug being fixed', () => {
    // Same symmetric position scored non-zero before the fix because Black's
    // pieces were read off White-oriented tables.
    expect(evaluate(STARTING_BOARD, 'white', false)).not.toBe(0);
  });

  it('values an advanced black pawn above a home-rank black pawn', () => {
    // Only the black pawn's square differs: e2 (near promotion) vs e7 (home).
    const kings = [
      { piece: 'k', index: 56 }, // white king a1
      { piece: 'K', index: 7 }, // black king h8
    ];
    const advanced = boardWithPieces([...kings, { piece: 'P', index: 52 }]); // e2
    const home = boardWithPieces([...kings, { piece: 'P', index: 12 }]); // e7

    // New eval: advancing the black pawn toward its promotion rank is rewarded.
    expect(evaluate(advanced, 'black', true)).toBeGreaterThan(
      evaluate(home, 'black', true),
    );
    // Legacy eval had it backwards — the home-rank pawn scored higher.
    expect(evaluate(advanced, 'black', false)).toBeLessThan(
      evaluate(home, 'black', false),
    );
  });
});

describe('self-play non-regression', () => {
  it('new engine does not regress vs the previous engine', () => {
    // Deterministic (seeded PRNG + deterministic search), so this is a stable
    // guardrail, not a flaky benchmark. The full ~700-game validation across
    // depths 2-3 is recorded in tools/engine-lab/experiments.jsonl.
    const result = runMatch({ games: 24, depth: 2, seed: 1 });
    expect(result.games).toBe(24);
    expect(result.newScore).toBeGreaterThanOrEqual(result.oldScore);
  }, 60_000);
});
