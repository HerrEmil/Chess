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

/*
 * Experiment #6: bishop-pair bonus. Two bishops are worth more together than the
 * material table (which scores each bishop in isolation) credits, so a side that
 * keeps both bishops gets a small bonus. These tests pin the correctness
 * properties: the bonus is color-symmetric, it rewards the side actually holding
 * the pair, and it is a no-op when a side has fewer than two bishops (and when
 * the flag is off, so every pre-#6 caller is unchanged).
 */
describe('bishop-pair evaluation', () => {
  it('is unchanged and color-symmetric at the full-material start', () => {
    // Both sides own both bishops => the pair bonus cancels => still 0. And with
    // the flag off the eval is byte-for-byte the pre-#6 (tapered) value.
    expect(evaluate(STARTING_BOARD, 'white', true, true, true)).toBe(0);
    expect(evaluate(STARTING_BOARD, 'black', true, true, true)).toBe(0);
    expect(evaluate(STARTING_BOARD, 'white', true, true, false)).toBe(
      evaluate(STARTING_BOARD, 'white', true, true),
    );
  });

  it('rewards the side holding the two bishops', () => {
    // White has two bishops (c1, f1); Black has one bishop + one knight, so only
    // White owns the pair. Comparing the same board with the flag on vs off
    // isolates the pair term (all material/piece-square terms are identical), so
    // the bonus must raise White's score and, by symmetry, lower Black's.
    const board = boardWithPieces([
      { piece: 'k', index: 56 }, // white king a1
      { piece: 'K', index: 7 }, // black king h8
      { piece: 'b', index: 58 }, // white bishop c1
      { piece: 'b', index: 61 }, // white bishop f1
      { piece: 'B', index: 2 }, // black bishop c8
      { piece: 'N', index: 1 }, // black knight b8 (so Black has no pair)
    ]);
    expect(evaluate(board, 'white', true, true, true)).toBeGreaterThan(
      evaluate(board, 'white', true, true, false),
    );
    expect(evaluate(board, 'black', true, true, true)).toBeLessThan(
      evaluate(board, 'black', true, true, false),
    );
  });

  it('gives no bonus to a side with a single bishop', () => {
    // One bishop each: neither side has a pair, so the flag is a no-op.
    const board = boardWithPieces([
      { piece: 'k', index: 56 }, // white king a1
      { piece: 'K', index: 7 }, // black king h8
      { piece: 'b', index: 58 }, // one white bishop
      { piece: 'B', index: 2 }, // one black bishop
    ]);
    expect(evaluate(board, 'white', true, true, true)).toBe(
      evaluate(board, 'white', true, true, false),
    );
  });
});

/*
 * Experiment #7: queen piece-square table. Every other piece already read a
 * piece-square table; the queen was scored by flat material, so the engine had
 * no positional preference for where the queen sat. A small, conservative table
 * (mild centre preference, edges/corners penalised) now gives it a gradient.
 * These tests pin the correctness properties: it is color-symmetric and a no-op
 * with the flag off (so every pre-#7 caller is unchanged), it rewards a
 * centralised queen over a cornered one, and it only touches queens.
 */
describe('queen piece-square table', () => {
  it('is unchanged and color-symmetric at the full-material start', () => {
    // Both queens sit on mirror-image squares (d1/d8) => the queen-table term
    // cancels => still 0. And with the flag off the eval is byte-for-byte the
    // pre-#7 (bishop-pair) value.
    expect(evaluate(STARTING_BOARD, 'white', true, true, true, true)).toBe(0);
    expect(evaluate(STARTING_BOARD, 'black', true, true, true, true)).toBe(0);
    expect(evaluate(STARTING_BOARD, 'white', true, true, true, false)).toBe(
      evaluate(STARTING_BOARD, 'white', true, true, true),
    );
  });

  it('rewards a centralised queen over a cornered one', () => {
    // Only the white queen's square differs: e4 (centre) vs a1 (corner). Kings
    // are identical (g1/b6) so the king terms and endgame mop-up cancel, and no
    // king is in check on either board, isolating the queen table. Neither queen
    // square lies on a line to the black king, so no check term contaminates it.
    const kings = [
      { piece: 'k', index: 62 }, // white king g1
      { piece: 'K', index: 17 }, // black king b6
    ];
    const central = boardWithPieces([...kings, { piece: 'q', index: 36 }]); // e4
    const cornered = boardWithPieces([...kings, { piece: 'q', index: 56 }]); // a1

    // Queen table on: the centralised queen is worth more to White.
    expect(evaluate(central, 'white', true, true, true, true)).toBeGreaterThan(
      evaluate(cornered, 'white', true, true, true, true),
    );
    // Queen table off: the two squares score identically (flat queen material).
    expect(evaluate(central, 'white', true, true, true, false)).toBe(
      evaluate(cornered, 'white', true, true, true, false),
    );
  });

  it('is a no-op on a position with no queen', () => {
    // A rook, not a queen: the queen-table flag must not change the score.
    const board = boardWithPieces([
      { piece: 'k', index: 62 }, // white king g1
      { piece: 'K', index: 17 }, // black king b6
      { piece: 'r', index: 56 }, // white rook a1
    ]);
    expect(evaluate(board, 'white', true, true, true, true)).toBe(
      evaluate(board, 'white', true, true, true, false),
    );
  });
});

/*
 * Experiment #8: rook open/half-open-file bonus. The rook piece-square table is
 * pawn-blind, so the engine valued a rook the same on a wide-open file as behind
 * its own pawns. This term rewards a rook on a file with no friendly pawns (a
 * larger bonus when the file is fully open, a smaller one when only enemy pawns
 * remain). These tests pin the correctness properties: it is color-symmetric and
 * a no-op with the flag off (so every pre-#8 caller is unchanged), it rewards
 * the side whose rook holds an open file, open beats half-open beats closed, and
 * it only touches rooks.
 */
describe('rook open/half-open-file bonus', () => {
  it('is unchanged and color-symmetric at the full-material start', () => {
    // Every rook starts on the a/h files, which carry pawns of both colors, so
    // every file is closed => the term is 0 (and the position is symmetric). And
    // with the flag off the eval is byte-for-byte the pre-#8 (queen-PST) value.
    expect(
      evaluate(STARTING_BOARD, 'white', true, true, true, true, true),
    ).toBe(0);
    expect(
      evaluate(STARTING_BOARD, 'black', true, true, true, true, true),
    ).toBe(0);
    expect(
      evaluate(STARTING_BOARD, 'white', true, true, true, true, false),
    ).toBe(evaluate(STARTING_BOARD, 'white', true, true, true, true));
  });

  it('rewards the side whose rook holds an open file', () => {
    // White's rook (d1) sits on a fully open d-file; Black's rook (a8) is behind
    // its own a7 pawn (closed). The extra pawns (white h2, black a7) balance
    // material and keep the d-file clear, so toggling the flag isolates the
    // rook-file term: it must raise White's score and, by symmetry, lower
    // Black's.
    const board = boardWithPieces([
      { piece: 'k', index: 62 }, // white king g1
      { piece: 'K', index: 17 }, // black king b6
      { piece: 'r', index: 59 }, // white rook d1 (open file)
      { piece: 'R', index: 0 }, // black rook a8 (closed by a7)
      { piece: 'p', index: 55 }, // white pawn h2
      { piece: 'P', index: 8 }, // black pawn a7
    ]);
    expect(
      evaluate(board, 'white', true, true, true, true, true),
    ).toBeGreaterThan(evaluate(board, 'white', true, true, true, true, false));
    expect(evaluate(board, 'black', true, true, true, true, true)).toBeLessThan(
      evaluate(board, 'black', true, true, true, true, false),
    );
  });

  it('scores open above half-open above closed for the same rook', () => {
    // Toggling the flag on one board yields exactly the rook-file term (every
    // other component is identical), isolating open vs half-open vs closed for a
    // lone white rook on d1 as only the d-file pawns change.
    const base = [
      { piece: 'k', index: 62 }, // white king g1
      { piece: 'K', index: 17 }, // black king b6
      { piece: 'r', index: 59 }, // white rook d1
    ];
    const rookTerm = (extra: { piece: string; index: number }[]): number => {
      const b = boardWithPieces([...base, ...extra]);
      return (
        evaluate(b, 'white', true, true, true, true, true) -
        evaluate(b, 'white', true, true, true, true, false)
      );
    };
    const open = rookTerm([]); // no d-file pawn
    const halfOpen = rookTerm([{ piece: 'P', index: 11 }]); // black pawn d7
    const closed = rookTerm([{ piece: 'p', index: 51 }]); // white pawn d2
    expect(open).toBeGreaterThan(halfOpen);
    expect(halfOpen).toBeGreaterThan(closed);
    expect(closed).toBe(0);
  });

  it('is a no-op on a position with no rook', () => {
    // A queen on the open a-file, not a rook: the rook-file flag is a no-op.
    const board = boardWithPieces([
      { piece: 'k', index: 62 }, // white king g1
      { piece: 'K', index: 17 }, // black king b6
      { piece: 'q', index: 56 }, // white queen a1
    ]);
    expect(evaluate(board, 'white', true, true, true, true, true)).toBe(
      evaluate(board, 'white', true, true, true, true, false),
    );
  });
});

/*
 * Experiment #10: mobility. A piece's worth depends on how many squares it
 * commands, which neither the piece-square tables nor the rook-file term fully
 * captures. This term counts each side's pseudo-legal moves for its mobile
 * pieces (knights, bishops, rooks, queens — pawns and the king are excluded) and
 * rewards the more active side, scaled by a per-move weight. These tests pin the
 * correctness properties: it is color-symmetric and a no-op with the weight at 0
 * (so every pre-#10 caller is unchanged), it rewards the side with the more
 * mobile pieces, and it ignores pawns and kings entirely.
 */
describe('mobility evaluation', () => {
  const W = 3; // a positive weight activates the term

  it('is unchanged and color-symmetric at the full-material start', () => {
    // Both sides have identical mobility at the start (each knight has two
    // moves, everything else is blocked) => the delta is 0 and the position is
    // symmetric. And with the weight at 0 the eval is byte-for-byte the pre-#10
    // (rook-file) value.
    expect(
      evaluate(STARTING_BOARD, 'white', true, true, true, true, true, W),
    ).toBe(0);
    expect(
      evaluate(STARTING_BOARD, 'black', true, true, true, true, true, W),
    ).toBe(0);
    expect(
      evaluate(STARTING_BOARD, 'white', true, true, true, true, true, 0),
    ).toBe(evaluate(STARTING_BOARD, 'white', true, true, true, true, true));
  });

  it('rewards the side whose pieces command more squares', () => {
    // Equal material (one rook each), no check, no endgame mop-up. White's rook
    // sits on an open central square (d4, many moves); Black's is boxed in its
    // own corner behind the king (a8, few moves). Toggling the weight isolates
    // the mobility term: it must raise White's score and, by symmetry, lower
    // Black's.
    const board = boardWithPieces([
      { piece: 'k', index: 60 }, // white king e1
      { piece: 'K', index: 4 }, // black king e8
      { piece: 'r', index: 35 }, // white rook d4 (open)
      { piece: 'R', index: 0 }, // black rook a8 (boxed in)
    ]);
    expect(
      evaluate(board, 'white', true, true, true, true, true, W),
    ).toBeGreaterThan(
      evaluate(board, 'white', true, true, true, true, true, 0),
    );
    expect(
      evaluate(board, 'black', true, true, true, true, true, W),
    ).toBeLessThan(evaluate(board, 'black', true, true, true, true, true, 0));
  });

  it('ignores pawns and kings (no mobile pieces => a no-op)', () => {
    // Only kings and pawns, placed asymmetrically so the base eval is non-zero.
    // Neither pawns (structural, scored by the pawn table) nor kings count
    // toward mobility, so with no knight/bishop/rook/queen on the board the
    // weight must not change the score at all.
    const board = boardWithPieces([
      { piece: 'k', index: 56 }, // white king a1
      { piece: 'K', index: 7 }, // black king h8
      { piece: 'p', index: 52 }, // white pawn e2
      { piece: 'P', index: 8 }, // black pawn a7
    ]);
    expect(evaluate(board, 'white', true, true, true, true, true, W)).toBe(
      evaluate(board, 'white', true, true, true, true, true, 0),
    );
  });
});

/*
 * Experiment #12 (Ladder 2 item 2): endgame-scaled passed pawns. A passed pawn
 * (no enemy pawn ahead on its own or an adjacent file) is a promotion threat, but
 * overwhelmingly an endgame one — the earlier structure term (#3) regressed by
 * rewarding passers in the middlegame the shallow search couldn't support, so
 * this term is scaled by the endgame weight (1 - gamePhaseMg): ~0 at full
 * material, full value as the board empties. These tests pin the correctness
 * properties: it is color-symmetric and a no-op at the full-material start (so
 * every pre-#12 caller is unchanged), it rewards a side with an endgame passer
 * and is antisymmetric, it gives nothing to a pawn an enemy pawn stands ahead of,
 * and its value scales down as material returns to the board.
 */
describe('passed-pawn evaluation', () => {
  const W = 3; // mobility weight, matching the production leaf
  // Toggle only the passed-pawn flag on one board => the difference is exactly
  // the passed-pawn term (every other component is identical and cancels).
  const passedTerm = (board: readonly string[], c: 'white' | 'black'): number =>
    evaluate(board, c, true, true, true, true, true, W, true) -
    evaluate(board, c, true, true, true, true, true, W, false);

  it('is unchanged and color-symmetric at the full-material start', () => {
    // No pawn is passed at the start (every file is blocked by the opposing
    // pawn), and full material means the endgame weight is 0, so the term is 0
    // and the position stays symmetric. With the flag off the eval is
    // byte-for-byte the pre-#12 (mobility) value.
    expect(
      evaluate(STARTING_BOARD, 'white', true, true, true, true, true, W, true),
    ).toBe(0);
    expect(
      evaluate(STARTING_BOARD, 'black', true, true, true, true, true, W, true),
    ).toBe(0);
    expect(
      evaluate(STARTING_BOARD, 'white', true, true, true, true, true, W, false),
    ).toBe(evaluate(STARTING_BOARD, 'white', true, true, true, true, true, W));
  });

  it('rewards a side with an endgame passed pawn and is antisymmetric', () => {
    // Kings and a lone white pawn on b5 with no black pawn anywhere: the pawn is
    // passed and, with no non-pawn material, the endgame weight is 1 (full bonus).
    const board = boardWithPieces([
      { piece: 'k', index: 56 }, // white king a1
      { piece: 'K', index: 7 }, // black king h8
      { piece: 'p', index: 25 }, // white pawn b5 (passed)
    ]);
    expect(passedTerm(board, 'white')).toBeGreaterThan(0);
    expect(passedTerm(board, 'black')).toBeLessThan(0);
  });

  it('gives nothing to a pawn an enemy pawn stands ahead of', () => {
    // White pawn d5 and black pawn d6 block each other on the d-file: neither is
    // passed, so the term must be a no-op (no passer for either side).
    const board = boardWithPieces([
      { piece: 'k', index: 56 }, // white king a1
      { piece: 'K', index: 7 }, // black king h8
      { piece: 'p', index: 27 }, // white pawn d5
      { piece: 'P', index: 19 }, // black pawn d6 (ahead of d5 on the d-file)
    ]);
    expect(passedTerm(board, 'white')).toBe(0);
  });

  it('is endgame-scaled: the same passer is worth less with more material', () => {
    // Identical passed b5 pawn on both boards. The endgame board (kings + pawn)
    // has phase 0 => full bonus; the middlegame board adds a queen and a rook per
    // side (none a pawn, so the pawn stays passed) => a higher phase weight, so
    // the same passer contributes strictly less but still more than zero.
    const kingsPawn = [
      { piece: 'k', index: 56 }, // white king a1
      { piece: 'K', index: 7 }, // black king h8
      { piece: 'p', index: 25 }, // white pawn b5 (passed)
    ];
    const endgame = boardWithPieces(kingsPawn);
    const middlegame = boardWithPieces([
      ...kingsPawn,
      { piece: 'q', index: 40 }, // white queen a3
      { piece: 'r', index: 34 }, // white rook c4
      { piece: 'Q', index: 23 }, // black queen h6
      { piece: 'R', index: 29 }, // black rook f5
    ]);
    const endgameBonus = passedTerm(endgame, 'white');
    const middlegameBonus = passedTerm(middlegame, 'white');
    expect(endgameBonus).toBeGreaterThan(0);
    expect(middlegameBonus).toBeGreaterThan(0);
    expect(middlegameBonus).toBeLessThan(endgameBonus);
  });
});

describe('self-play non-regression', () => {
  it('new engine does not regress across three disjoint opening seeds', () => {
    // Deterministic (seeded PRNG + deterministic search), so this is a stable
    // guardrail, not a flaky benchmark. Aggregated over three disjoint opening
    // seeds (the ladder's 1/41/81 blocks) to de-noise it: a single 24-game seed
    // has an SE near 10%, too coarse to reflect a real-but-modest edge — seed 1
    // alone lands a shade below even here (11.5 vs 12.5) while the aggregate and
    // the full multi-depth validation (tools/engine-lab/experiments.jsonl,
    // +56% over 480 games at depths 2/3/4) are clearly positive. Experiment #12
    // compares the passed-pawn leaf (new) vs the mobility leaf (old); both share
    // the quiescence leaf, shipped check extensions, the tapered king table, the
    // bishop-pair bonus, the queen piece-square table, the rook-file bonus, and
    // the mobility term.
    const seeds = [1, 41, 81];
    let newScore = 0;
    let oldScore = 0;
    let games = 0;
    for (const seed of seeds) {
      const result = runMatch({ games: 24, depth: 2, seed });
      newScore += result.newScore;
      oldScore += result.oldScore;
      games += result.games;
    }
    expect(games).toBe(72);
    expect(newScore).toBeGreaterThanOrEqual(oldScore);
  }, 180_000);
});
