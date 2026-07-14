import { describe, it, expect } from 'vitest';
import { evaluate, negamax, quiesce, quiescentEval } from '../ai.js';
import { ALL_CASTLE, boardWithPieces, STARTING_BOARD } from './helpers.js';
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

/*
 * Experiment #4: check extensions. Quiescence resolves captures at the horizon
 * but not check evasions, so an in-check leaf is scored by a stand-pat that
 * cannot see a forced mate. The search now extends one ply while the side to
 * move is in check. This test pins the property directly: a mate-in-1 delivered
 * by a checking move is invisible to a plain depth-1 search (the mating move's
 * child sits at the depth-0 horizon, where mate is never detected) but is found
 * once the in-check horizon is extended.
 */
describe('check extensions', () => {
  it('recognises a mate-in-1 at the horizon that a plain search misses', () => {
    // Back-rank mate: white rook e1 delivers Re8#. Black king h8 is boxed in by
    // its own pawns g7/h7; the only 8th-rank flight g8 is covered by the rook.
    const board = boardWithPieces([
      { piece: 'k', index: 56 }, // white king a1
      { piece: 'K', index: 7 }, // black king h8
      { piece: 'r', index: 60 }, // white rook e1
      { piece: 'P', index: 14 }, // black pawn g7
      { piece: 'P', index: 15 }, // black pawn h7
    ]);

    const withExt = negamax(
      board,
      'white',
      1,
      -INF,
      INF,
      null,
      ALL_CASTLE,
      new Map(),
      quiescentEval,
      true,
    );
    const noExt = negamax(
      board,
      'white',
      1,
      -INF,
      INF,
      null,
      ALL_CASTLE,
      new Map(),
      quiescentEval,
      false,
    );

    // With the extension, the mate is scored as a mate and Re8 (e1->e8) is
    // played; without it, the depth-1 search only sees a static leaf score.
    expect(withExt[2]).toBeGreaterThanOrEqual(50000);
    expect([withExt[0], withExt[1]]).toEqual([60, 4]);
    expect(noExt[2]).toBeLessThan(50000);
  });
});

/*
 * Experiment #5: tapered king evaluation. The king piece-square table is blended
 * between its middlegame orientation (king tucked behind its pawns) and its
 * endgame orientation (king centralised) by game phase. With full material the
 * blend is exactly the middlegame table, so the non-tapered eval is unchanged;
 * as pieces come off, the king is rewarded for activity. These tests pin the
 * correctness property (still color-symmetric) and the behaviour (an endgame
 * king is valued for centralisation, the reverse of the middlegame table).
 */
describe('tapered king evaluation', () => {
  it('is unchanged and color-symmetric at the full-material start', () => {
    // Full material => phase weight 1 => the king reads the middlegame table, so
    // the tapered eval matches the (already color-symmetric) non-tapered eval.
    expect(evaluate(STARTING_BOARD, 'white', true, true)).toBe(0);
    expect(evaluate(STARTING_BOARD, 'black', true, true)).toBe(0);
    expect(evaluate(STARTING_BOARD, 'white', true, true)).toBe(
      evaluate(STARTING_BOARD, 'white', true, false),
    );
  });

  it('rewards a centralised king in the endgame, reversing the middlegame table', () => {
    // Bare kings (phase 0 => pure endgame table). Only the white king's square
    // differs: e4 (centralised) vs a1 (cornered). No other material, so the
    // king-safety endgame mop-up term stays off and this isolates the king PST.
    const centralised = boardWithPieces([
      { piece: 'k', index: 36 }, // white king e4
      { piece: 'K', index: 7 }, // black king h8
    ]);
    const cornered = boardWithPieces([
      { piece: 'k', index: 56 }, // white king a1
      { piece: 'K', index: 7 }, // black king h8
    ]);

    // Tapered (endgame): the centralised king is worth more to White.
    expect(evaluate(centralised, 'white', true, true)).toBeGreaterThan(
      evaluate(cornered, 'white', true, true),
    );
    // Non-tapered (middlegame table): the ranking is reversed — the cornered
    // king scores higher, which is exactly wrong for an endgame.
    expect(evaluate(centralised, 'white', true, false)).toBeLessThan(
      evaluate(cornered, 'white', true, false),
    );
  });
});

describe('self-play non-regression', () => {
  it('new engine does not regress vs the previous engine', () => {
    // Deterministic (seeded PRNG + deterministic search), so this is a stable
    // guardrail, not a flaky benchmark. The full multi-depth validation is
    // recorded in tools/engine-lab/experiments.jsonl. Experiment #5 compares the
    // tapered-king leaf (new) vs the middlegame-only leaf (old); both use the
    // quiescence leaf and shipped check extensions.
    const result = runMatch({ games: 24, depth: 2, seed: 1 });
    expect(result.games).toBe(24);
    expect(result.newScore).toBeGreaterThanOrEqual(result.oldScore);
  }, 60_000);
});
