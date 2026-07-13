import { describe, it, expect } from 'vitest';
import { evaluate, quiesce } from '../ai.js';
import { boardWithPieces, STARTING_BOARD } from './helpers.js';
import { runMatch } from '../../../tools/engine-lab/selfplay.js';

const INF = 100000;

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

/*
 * Experiment #2: quiescence search. At the search horizon the engine now
 * resolves pending captures before scoring, instead of taking the raw static
 * eval mid-exchange (the horizon effect). These tests pin the two properties
 * that matter: it declines a materially-losing capture, and it grabs a winning
 * one.
 */
describe('quiescence search', () => {
  it('declines a poisoned capture (queen takes a defended pawn)', () => {
    // White queen d5(27) can take the black pawn d6(19), but that pawn is
    // defended by the black pawn e7(12), so QxP loses the queen to the
    // recapture. A static leaf would book the won pawn; quiescence must see the
    // recapture and decline, returning exactly the stand-pat score.
    const board = boardWithPieces([
      { piece: 'k', index: 56 }, // white king a1
      { piece: 'K', index: 7 }, // black king h8
      { piece: 'q', index: 27 }, // white queen d5
      { piece: 'P', index: 19 }, // black pawn d6 (the poisoned target)
      { piece: 'P', index: 12 }, // black pawn e7 (defends d6)
    ]);
    const standPat = evaluate(board, 'white', true);
    expect(quiesce(board, 'white', -INF, INF)).toBe(standPat);
  });

  it('grabs a genuinely winning capture (undefended pawn)', () => {
    // Same position without the defender: QxP wins a clean pawn with no
    // recapture, so quiescence must score it above the stand-pat.
    const board = boardWithPieces([
      { piece: 'k', index: 56 }, // white king a1
      { piece: 'K', index: 7 }, // black king h8
      { piece: 'q', index: 27 }, // white queen d5
      { piece: 'P', index: 19 }, // black pawn d6 (undefended)
    ]);
    const standPat = evaluate(board, 'white', true);
    expect(quiesce(board, 'white', -INF, INF)).toBeGreaterThan(standPat);
  });
});

describe('self-play non-regression', () => {
  it('new engine does not regress vs the previous engine', () => {
    // Deterministic (seeded PRNG + deterministic search), so this is a stable
    // guardrail, not a flaky benchmark. The full multi-depth validation is
    // recorded in tools/engine-lab/experiments.jsonl.
    const result = runMatch({ games: 24, depth: 2, seed: 1 });
    expect(result.games).toBe(24);
    expect(result.newScore).toBeGreaterThanOrEqual(result.oldScore);
  }, 60_000);
});
