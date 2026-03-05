import { describe, it, expect } from 'vitest';
import { AI, negamax } from '../ai.js';
import { boardWithPieces } from './helpers.js';
import { boardAfterMove } from '../main.js';
import type { CastleState } from '../main.js';
import { isInCheck } from '../moveGen.js';

const NO_CASTLE: CastleState = {
  whiteShortCastle: false,
  whiteLongCastle: false,
  blackShortCastle: false,
  blackLongCastle: false,
};

describe('AI piece-square tables', () => {
  it('pawnTable has 64 entries', () => {
    expect(AI.pawnTable).toHaveLength(64);
  });

  it('knightTable has 64 entries', () => {
    expect(AI.knightTable).toHaveLength(64);
  });

  it('bishopTable has 64 entries', () => {
    expect(AI.bishopTable).toHaveLength(64);
  });

  it('kingTable has 64 entries', () => {
    expect(AI.kingTable).toHaveLength(64);
  });

  it('kingTableEndGame has 64 entries', () => {
    expect(AI.kingTableEndGame).toHaveLength(64);
  });

  it('pawn promotion row has high values', () => {
    for (let i = 0; i < 8; i++) {
      expect(AI.pawnTable[i]).toBeGreaterThan(800);
    }
  });

  it('knight table penalizes edges', () => {
    expect(AI.knightTable[0]).toBeLessThan(0);
    expect(AI.knightTable[7]).toBeLessThan(0);
    expect(AI.knightTable[56]).toBeLessThan(0);
    expect(AI.knightTable[63]).toBeLessThan(0);
    expect(AI.knightTable[27]).toBeGreaterThan(0);
    expect(AI.knightTable[28]).toBeGreaterThan(0);
  });

  it('bishop table penalizes corners', () => {
    expect(AI.bishopTable[0]).toBeLessThan(0);
    expect(AI.bishopTable[7]).toBeLessThan(0);
  });

  it('king table encourages castled position in middlegame', () => {
    expect(AI.kingTable[62]).toBeGreaterThan(0);
    expect(AI.kingTable[63]).toBeGreaterThan(0);
    expect(AI.kingTable[56]).toBeGreaterThan(0);
  });

  it('king endgame table encourages center', () => {
    expect(AI.kingTableEndGame[27]).toBeGreaterThan(AI.kingTableEndGame[0]);
    expect(AI.kingTableEndGame[28]).toBeGreaterThan(AI.kingTableEndGame[7]);
  });
});

describe('AI difficulty settings', () => {
  it('default ply values are -1 (unset)', () => {
    expect(AI.whitePly).toBe(-1);
    expect(AI.blackPly).toBe(-1);
  });

  it('ply can be set to valid depth levels', () => {
    const original = AI.whitePly;
    AI.whitePly = 3;
    expect(AI.whitePly).toBe(3);
    AI.whitePly = original;
  });
});

describe('negamax legality', () => {
  it('does not move a pinned piece exposing own king', () => {
    // White knight on d2 (51) is pinned by black bishop on a5 (32)
    // along the a5-e1 diagonal: a5(32)→b4(41)→c3(50)→d2(51)→e1(60)
    // Moving the knight exposes the white king on e1 to the bishop.
    // White rook on h1 (63) provides alternative legal moves.
    const board = boardWithPieces([
      { piece: 'K', index: 7 }, // black king h8
      { piece: 'B', index: 32 }, // black bishop a5 (pins knight)
      { piece: 'k', index: 60 }, // white king e1
      { piece: 'n', index: 51 }, // white knight d2 (pinned)
      { piece: 'r', index: 63 }, // white rook h1
    ]);

    const [bestStart, bestGoal] = negamax(
      board,
      'white',
      1,
      -100000,
      100000,
      null,
      NO_CASTLE,
    );

    // The chosen move must not leave white king in check
    const resultBoard = boardAfterMove(board, bestStart, bestGoal);
    expect(isInCheck(resultBoard, 'white')).toBe(false);

    // The pinned knight must not be the piece that moves
    expect(bestStart).not.toBe(51);
  });

  it('never produces a move that leaves own king in check at depth 2', () => {
    // A more complex position tested at depth 2 to verify check-filtering
    // propagates through recursive calls.
    // White: king g1 (62), rook a1 (56), pawn f2 (53), pawn g2 (54), pawn h2 (55)
    // Black: king e8 (4), queen d8 (3), rook a8 (0)
    const board = boardWithPieces([
      { piece: 'K', index: 4 }, // black king e8
      { piece: 'Q', index: 3 }, // black queen d8
      { piece: 'R', index: 0 }, // black rook a8
      { piece: 'k', index: 62 }, // white king g1
      { piece: 'r', index: 56 }, // white rook a1
      { piece: 'p', index: 53 }, // white pawn f2
      { piece: 'p', index: 54 }, // white pawn g2
      { piece: 'p', index: 55 }, // white pawn h2
    ]);

    const [bestStart, bestGoal] = negamax(
      board,
      'white',
      2,
      -100000,
      100000,
      null,
      NO_CASTLE,
    );

    expect(bestStart).toBeGreaterThanOrEqual(0);
    expect(bestGoal).toBeGreaterThanOrEqual(0);

    // Verify the move is legal: white king must not be in check after the move
    const resultBoard = boardAfterMove(board, bestStart, bestGoal);
    expect(isInCheck(resultBoard, 'white')).toBe(false);
  });
});
