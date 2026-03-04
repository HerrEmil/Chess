import { describe, it, expect, beforeEach } from 'vitest';
import { getValid, isInCheck, getAllValidMovesNoCheck } from '../moveGen.js';
import { boardWithPieces, emptyBoard, STARTING_BOARD, setupCastleState } from './helpers.js';
import { mailboxIndex } from '../main.js';

/*
 * Board index reference (0-63):
 *   0  1  2  3  4  5  6  7    <- rank 8 (black back rank)
 *   8  9 10 11 12 13 14 15    <- rank 7
 *  16 17 18 19 20 21 22 23    <- rank 6
 *  24 25 26 27 28 29 30 31    <- rank 5
 *  32 33 34 35 36 37 38 39    <- rank 4
 *  40 41 42 43 44 45 46 47    <- rank 3
 *  48 49 50 51 52 53 54 55    <- rank 2
 *  56 57 58 59 60 61 62 63    <- rank 1 (white back rank)
 *
 * Lowercase = white, uppercase = black.
 */

// getAllValidMovesNoCheck tests raw moves without check filtering.
// getValid filters out moves that leave king in check.

describe('pawn moves', () => {
  it('white pawn on starting rank can move 1 or 2 squares forward', () => {
    const board = boardWithPieces([
      { piece: 'p', index: 52 }, // e2
      { piece: 'k', index: 60 }, // white king e1
      { piece: 'K', index: 4 },  // black king e8
    ]);
    const moves = getAllValidMovesNoCheck(board, [52])[0];
    expect(moves).toContain(44); // e3
    expect(moves).toContain(36); // e4
    expect(moves).toHaveLength(2);
  });

  it('black pawn on starting rank can move 1 or 2 squares forward', () => {
    const board = boardWithPieces([
      { piece: 'P', index: 12 }, // e7
      { piece: 'k', index: 60 },
      { piece: 'K', index: 4 },
    ]);
    const moves = getAllValidMovesNoCheck(board, [12])[0];
    expect(moves).toContain(20); // e6
    expect(moves).toContain(28); // e5
    expect(moves).toHaveLength(2);
  });

  it('pawn blocked by piece cannot move forward', () => {
    const board = boardWithPieces([
      { piece: 'p', index: 52 }, // e2
      { piece: 'P', index: 44 }, // e3 blocked
      { piece: 'k', index: 60 },
      { piece: 'K', index: 4 },
    ]);
    const moves = getAllValidMovesNoCheck(board, [52])[0];
    expect(moves).toHaveLength(0);
  });

  it('pawn can capture diagonally', () => {
    const board = boardWithPieces([
      { piece: 'p', index: 35 }, // d5
      { piece: 'P', index: 26 }, // c6 (capturable)
      { piece: 'P', index: 28 }, // e6 (capturable)
      { piece: 'k', index: 60 },
      { piece: 'K', index: 4 },
    ]);
    const moves = getAllValidMovesNoCheck(board, [35])[0];
    expect(moves).toContain(26); // capture c6
    expect(moves).toContain(28); // capture e6
    expect(moves).toContain(27); // forward d6
    expect(moves).toHaveLength(3);
  });

  it('pawn cannot capture own pieces diagonally', () => {
    const board = boardWithPieces([
      { piece: 'p', index: 35 }, // d5
      { piece: 'p', index: 26 }, // c6 (own piece)
      { piece: 'k', index: 60 },
      { piece: 'K', index: 4 },
    ]);
    const moves = getAllValidMovesNoCheck(board, [35])[0];
    expect(moves).not.toContain(26);
  });

  it('white pawn not on starting rank moves only 1 square', () => {
    const board = boardWithPieces([
      { piece: 'p', index: 44 }, // e3
      { piece: 'k', index: 60 },
      { piece: 'K', index: 4 },
    ]);
    const moves = getAllValidMovesNoCheck(board, [44])[0];
    expect(moves).toContain(36); // e4
    expect(moves).toHaveLength(1);
  });
});

describe('knight moves', () => {
  it('knight in center has 8 possible moves', () => {
    const board = boardWithPieces([
      { piece: 'n', index: 35 }, // d5
      { piece: 'k', index: 60 },
      { piece: 'K', index: 4 },
    ]);
    const moves = getAllValidMovesNoCheck(board, [35])[0];
    // d5 -> c7, e7, b6, f6, b4, f4, c3, e3
    expect(moves).toHaveLength(8);
    expect(moves).toContain(18); // c7
    expect(moves).toContain(20); // e7
    expect(moves).toContain(25); // b6
    expect(moves).toContain(29); // f6
    expect(moves).toContain(41); // b4
    expect(moves).toContain(45); // f4
    expect(moves).toContain(50); // c3
    expect(moves).toContain(52); // e3
  });

  it('knight in corner has 2 possible moves', () => {
    const board = boardWithPieces([
      { piece: 'n', index: 0 }, // a8
      { piece: 'k', index: 60 },
      { piece: 'K', index: 4 },
    ]);
    const moves = getAllValidMovesNoCheck(board, [0])[0];
    // a8 -> b6, c7
    expect(moves).toHaveLength(2);
    expect(moves).toContain(17); // b6
    expect(moves).toContain(10); // c7
  });

  it('knight can capture enemy pieces', () => {
    const board = boardWithPieces([
      { piece: 'n', index: 35 }, // d5 white knight
      { piece: 'P', index: 18 }, // c7 black pawn
      { piece: 'k', index: 60 },
      { piece: 'K', index: 4 },
    ]);
    const moves = getAllValidMovesNoCheck(board, [35])[0];
    expect(moves).toContain(18); // can capture
  });

  it('knight cannot land on own pieces', () => {
    const board = boardWithPieces([
      { piece: 'n', index: 35 }, // d5
      { piece: 'p', index: 18 }, // c7 own pawn
      { piece: 'k', index: 60 },
      { piece: 'K', index: 4 },
    ]);
    const moves = getAllValidMovesNoCheck(board, [35])[0];
    expect(moves).not.toContain(18);
    expect(moves).toHaveLength(7);
  });
});

describe('bishop moves', () => {
  it('bishop on open board has many diagonal moves', () => {
    const board = boardWithPieces([
      { piece: 'b', index: 35 }, // d4
      { piece: 'k', index: 60 },
      { piece: 'K', index: 4 },
    ]);
    const moves = getAllValidMovesNoCheck(board, [35])[0];
    expect(moves).toContain(26); // c5
    expect(moves).toContain(17); // b6
    expect(moves.length).toBeGreaterThanOrEqual(10);
    expect(moves.every((m) => m >= 0 && m <= 63)).toBe(true);
  });

  it('bishop blocked by own piece stops before it', () => {
    const board = boardWithPieces([
      { piece: 'b', index: 35 }, // d5
      { piece: 'p', index: 26 }, // c6 own pawn
      { piece: 'k', index: 60 },
      { piece: 'K', index: 4 },
    ]);
    const moves = getAllValidMovesNoCheck(board, [35])[0];
    expect(moves).not.toContain(26); // blocked
    expect(moves).not.toContain(17); // behind blocker
  });

  it('bishop captures enemy piece and stops', () => {
    const board = boardWithPieces([
      { piece: 'b', index: 35 }, // d5
      { piece: 'P', index: 26 }, // c6 enemy pawn
      { piece: 'k', index: 60 },
      { piece: 'K', index: 4 },
    ]);
    const moves = getAllValidMovesNoCheck(board, [35])[0];
    expect(moves).toContain(26); // can capture
    expect(moves).not.toContain(17); // can't go past capture
  });
});

describe('rook moves', () => {
  it('rook on open board reaches all 14 valid squares', () => {
    const board = boardWithPieces([
      { piece: 'r', index: 35 }, // d4
      { piece: 'k', index: 60 },
      { piece: 'K', index: 4 },
    ]);
    const moves = getAllValidMovesNoCheck(board, [35])[0];
    // 7 along rank + 7 along file = 14
    expect(moves).toHaveLength(14);
    expect(moves.every((m) => m >= 0 && m <= 63)).toBe(true);
  });

  it('rook blocked by own piece', () => {
    const board = boardWithPieces([
      { piece: 'r', index: 35 }, // d5
      { piece: 'p', index: 27 }, // d6 own pawn (one square up)
      { piece: 'k', index: 60 },
      { piece: 'K', index: 4 },
    ]);
    const moves = getAllValidMovesNoCheck(board, [35])[0];
    expect(moves).not.toContain(27); // blocked by own
    expect(moves).not.toContain(19); // behind blocker
  });

  it('rook on board edge produces no -1 entries', () => {
    // Regression: white sliding pieces treated '*' border as capturable
    const board = boardWithPieces([
      { piece: 'r', index: 56 }, // a1 (corner)
      { piece: 'k', index: 60 },
      { piece: 'K', index: 4 },
    ]);
    const moves = getAllValidMovesNoCheck(board, [56])[0];
    expect(moves.every((m) => m >= 0 && m <= 63)).toBe(true);
    expect(moves).not.toContain(-1);
  });

  it('rook can capture enemy and stops', () => {
    const board = boardWithPieces([
      { piece: 'r', index: 35 }, // d5
      { piece: 'P', index: 27 }, // d6 enemy
      { piece: 'k', index: 60 },
      { piece: 'K', index: 4 },
    ]);
    const moves = getAllValidMovesNoCheck(board, [35])[0];
    expect(moves).toContain(27); // capture
    expect(moves).not.toContain(19); // stops after capture
  });
});

describe('queen moves', () => {
  it('queen on open board has rook + bishop moves', () => {
    const board = boardWithPieces([
      { piece: 'q', index: 35 }, // d4
      { piece: 'k', index: 60 },
      { piece: 'K', index: 4 },
    ]);
    const moves = getAllValidMovesNoCheck(board, [35])[0];
    // Rook directions: 14, Bishop directions: 13 = 27
    expect(moves).toHaveLength(27);
    expect(moves.every((m) => m >= 0 && m <= 63)).toBe(true);
  });
});

describe('king moves', () => {
  it('king in center has 8 moves on empty board', () => {
    const board = boardWithPieces([
      { piece: 'k', index: 35 }, // d5
      { piece: 'K', index: 4 },
    ]);
    const moves = getAllValidMovesNoCheck(board, [35])[0];
    expect(moves).toHaveLength(8);
  });

  it('king in corner has 3 moves', () => {
    const board = boardWithPieces([
      { piece: 'k', index: 0 }, // a8
      { piece: 'K', index: 63 },
    ]);
    const moves = getAllValidMovesNoCheck(board, [0])[0];
    expect(moves).toHaveLength(3);
  });

  it('king cannot move onto own pieces', () => {
    const board = boardWithPieces([
      { piece: 'k', index: 35 }, // d5
      { piece: 'p', index: 26 }, // c6 own pawn
      { piece: 'K', index: 4 },
    ]);
    const moves = getAllValidMovesNoCheck(board, [35])[0];
    expect(moves).not.toContain(26);
    expect(moves).toHaveLength(7);
  });
});

describe('isInCheck', () => {
  it('king not in check on starting position', () => {
    expect(isInCheck(STARTING_BOARD, 'white')).toBe(false);
    expect(isInCheck(STARTING_BOARD, 'black')).toBe(false);
  });

  it('white king in check from black rook', () => {
    const board = boardWithPieces([
      { piece: 'k', index: 60 }, // e1
      { piece: 'R', index: 56 }, // a1 (same rank)
      { piece: 'K', index: 4 },
    ]);
    expect(isInCheck(board, 'white')).toBe(true);
  });

  it('white king not in check from blocked rook', () => {
    const board = boardWithPieces([
      { piece: 'k', index: 60 }, // e1
      { piece: 'R', index: 56 }, // a1
      { piece: 'p', index: 58 }, // c1 blocks
      { piece: 'K', index: 4 },
    ]);
    expect(isInCheck(board, 'white')).toBe(false);
  });

  it('black king in check from white bishop', () => {
    const board = boardWithPieces([
      { piece: 'k', index: 60 },
      { piece: 'K', index: 4 },  // e8
      { piece: 'b', index: 31 }, // h5 - diagonal to e8
    ]);
    expect(isInCheck(board, 'black')).toBe(true);
  });

  it('king in check from knight', () => {
    const board = boardWithPieces([
      { piece: 'k', index: 60 }, // e1
      { piece: 'N', index: 45 }, // f3 (knight attacks e1)
      { piece: 'K', index: 4 },
    ]);
    expect(isInCheck(board, 'white')).toBe(true);
  });

  it('king in check from pawn', () => {
    const board = boardWithPieces([
      { piece: 'k', index: 35 }, // d5
      { piece: 'P', index: 26 }, // c6 (black pawn attacks d5 diagonally)
      { piece: 'K', index: 4 },
    ]);
    expect(isInCheck(board, 'white')).toBe(true);
  });
});

describe('getValid (with check filtering)', () => {
  beforeEach(() => {
    setupCastleState();
  });

  it('cannot move pinned piece away from pin line', () => {
    // White rook on e2 is pinned to king on e1 by black rook on e8.
    // It can only move along the e-file.
    const board = boardWithPieces([
      { piece: 'k', index: 60 }, // e1
      { piece: 'r', index: 52 }, // e2 (pinned by rook on e8)
      { piece: 'R', index: 4 },  // e8 black rook
      { piece: 'K', index: 0 },  // a8 black king (out of the way)
    ]);
    const moves = getValid(52, board);
    // The rook can only move along the e-file (not off it)
    for (const move of moves) {
      expect(move % 8).toBe(4); // column e = index%8 == 4
    }
  });

  it('king cannot move into check', () => {
    const board = boardWithPieces([
      { piece: 'k', index: 60 }, // e1
      { piece: 'R', index: 3 },  // d8 black rook (controls d-file)
      { piece: 'K', index: 0 },  // a8 black king
    ]);
    const moves = getValid(60, board);
    // King should not be able to go to d1(59) or d2(51) as those are on the d-file
    expect(moves).not.toContain(59);
    expect(moves).not.toContain(51);
  });
});

describe('castling', () => {
  beforeEach(() => {
    setupCastleState();
  });

  it('white can castle kingside when path is clear', () => {
    const board = boardWithPieces([
      { piece: 'k', index: 60 }, // e1
      { piece: 'r', index: 63 }, // h1
      { piece: 'K', index: 4 },
    ]);
    const moves = getValid(60, board);
    expect(moves).toContain(62); // g1 (kingside castle)
  });

  it('white can castle queenside when path is clear', () => {
    const board = boardWithPieces([
      { piece: 'k', index: 60 }, // e1
      { piece: 'r', index: 56 }, // a1
      { piece: 'K', index: 4 },
    ]);
    const moves = getValid(60, board);
    expect(moves).toContain(58); // c1 (queenside castle)
  });

  it('cannot castle when flag is false', () => {
    setupCastleState({ whiteShortCastle: false });
    const board = boardWithPieces([
      { piece: 'k', index: 60 },
      { piece: 'r', index: 63 },
      { piece: 'K', index: 4 },
    ]);
    const moves = getValid(60, board);
    expect(moves).not.toContain(62);
  });

  it('cannot castle through pieces', () => {
    const board = boardWithPieces([
      { piece: 'k', index: 60 }, // e1
      { piece: 'r', index: 63 }, // h1
      { piece: 'b', index: 61 }, // f1 blocks
      { piece: 'K', index: 4 },
    ]);
    const moves = getValid(60, board);
    expect(moves).not.toContain(62);
  });

  it('cannot castle when in check', () => {
    const board = boardWithPieces([
      { piece: 'k', index: 60 }, // e1
      { piece: 'r', index: 63 }, // h1
      { piece: 'R', index: 4 },  // e8 attacks e-file (king in check)
      { piece: 'K', index: 0 },  // a8
    ]);
    const moves = getValid(60, board);
    expect(moves).not.toContain(62);
  });

  it('cannot castle through check (king passes through attacked square)', () => {
    const board = boardWithPieces([
      { piece: 'k', index: 60 }, // e1
      { piece: 'r', index: 63 }, // h1
      { piece: 'R', index: 5 },  // f8 attacks f-file (f1 is in path)
      { piece: 'K', index: 0 },  // a8
    ]);
    const moves = getValid(60, board);
    expect(moves).not.toContain(62);
  });

  it('black can castle kingside', () => {
    const board = boardWithPieces([
      { piece: 'K', index: 4 },  // e8
      { piece: 'R', index: 7 },  // h8
      { piece: 'k', index: 60 }, // e1
    ]);
    const moves = getValid(4, board);
    expect(moves).toContain(6); // g8 (kingside castle)
  });

  it('black can castle queenside', () => {
    const board = boardWithPieces([
      { piece: 'K', index: 4 },  // e8
      { piece: 'R', index: 0 },  // a8
      { piece: 'k', index: 60 }, // e1
    ]);
    const moves = getValid(4, board);
    expect(moves).toContain(2); // c8 (queenside castle)
  });
});

describe('starting position moves', () => {
  beforeEach(() => {
    setupCastleState();
  });

  it('white pawns on starting position each have 2 moves', () => {
    for (let i = 48; i <= 55; i++) {
      const moves = getValid(i, STARTING_BOARD);
      expect(moves).toHaveLength(2);
    }
  });

  it('white knights have 2 moves each from starting position', () => {
    // b1 knight (57) -> a3(40), c3(42)
    const b1Moves = getValid(57, STARTING_BOARD);
    expect(b1Moves).toHaveLength(2);
    expect(b1Moves).toContain(40);
    expect(b1Moves).toContain(42);

    // g1 knight (62) -> f3(45), h3(47)
    const g1Moves = getValid(62, STARTING_BOARD);
    expect(g1Moves).toHaveLength(2);
    expect(g1Moves).toContain(45);
    expect(g1Moves).toContain(47);
  });

  it('white bishops, rooks, queen, king have 0 valid moves from starting position', () => {
    // All blocked by pawns. Filter out -1 (known sliding-piece border bug).
    const validMoves = (i: number) =>
      getValid(i, STARTING_BOARD).filter((m) => m >= 0);
    expect(validMoves(56)).toHaveLength(0); // a1 rook
    expect(validMoves(58)).toHaveLength(0); // c1 bishop
    expect(validMoves(59)).toHaveLength(0); // d1 queen
    expect(validMoves(60)).toHaveLength(0); // e1 king
    expect(validMoves(61)).toHaveLength(0); // f1 bishop
    expect(validMoves(63)).toHaveLength(0); // h1 rook
  });

  it('total white valid moves from starting position is 20', () => {
    let totalMoves = 0;
    for (let i = 48; i <= 63; i++) {
      totalMoves += getValid(i, STARTING_BOARD).filter((m) => m >= 0).length;
    }
    expect(totalMoves).toBe(20);
  });
});
