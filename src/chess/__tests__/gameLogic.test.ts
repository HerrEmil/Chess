import { describe, it, expect } from 'vitest';
import {
  applyMove,
  checkTurnEnd,
  shouldConvertPawn,
  type GlobalChess,
} from '../main.js';
import { STARTING_BOARD, boardWithPieces } from './helpers.js';

const makeGame = (overrides: Partial<GlobalChess> = {}): GlobalChess => ({
  board: STARTING_BOARD.slice(),
  castle: {
    whiteLongCastle: true,
    whiteShortCastle: true,
    blackLongCastle: true,
    blackShortCastle: true,
  },
  enPassantTarget: null,
  halfMoveClock: 0,
  pawn: { pawnToConvert: -1 },
  positionHistory: new Map(),
  blackAI: false,
  whiteAI: false,
  boardIndex: [],
  ...overrides,
});

// --- applyMove ---

describe('applyMove', () => {
  it('resets half-move clock on pawn move', () => {
    const game = makeGame({ halfMoveClock: 5 });
    applyMove(game, 52, 44); // e2-e4
    expect(game.halfMoveClock).toBe(0);
  });

  it('resets half-move clock on capture', () => {
    const game = makeGame({
      board: boardWithPieces([
        { piece: 'n', index: 40 },
        { piece: 'P', index: 33 },
      ]),
      halfMoveClock: 7,
    });
    applyMove(game, 40, 33); // knight captures
    expect(game.halfMoveClock).toBe(0);
  });

  it('increments half-move clock on quiet move', () => {
    const game = makeGame({
      board: boardWithPieces([
        { piece: 'n', index: 57 },
        { piece: 'K', index: 4 },
      ]),
      halfMoveClock: 3,
    });
    applyMove(game, 57, 42); // Ng1-f3
    expect(game.halfMoveClock).toBe(4);
  });

  it('returns en passant capture index', () => {
    const game = makeGame({
      board: boardWithPieces([
        { piece: 'p', index: 33 },
        { piece: 'P', index: 34 },
      ]),
      enPassantTarget: 42,
    });
    const result = applyMove(game, 33, 42);
    expect(result.enPassantCaptureIndex).toBe(34);
  });

  it('returns null en passant capture index for normal move', () => {
    const game = makeGame();
    const result = applyMove(game, 52, 44);
    expect(result.enPassantCaptureIndex).toBeNull();
  });

  it('returns castling rook move for white kingside', () => {
    const game = makeGame({
      board: boardWithPieces([
        { piece: 'k', index: 60 },
        { piece: 'r', index: 63 },
      ]),
    });
    const result = applyMove(game, 60, 62);
    expect(result.castlingRookMove).toEqual([63, 61]);
  });

  it('updates castling state when king moves', () => {
    const game = makeGame({
      board: boardWithPieces([
        { piece: 'k', index: 60 },
        { piece: 'r', index: 63 },
        { piece: 'r', index: 56 },
      ]),
    });
    applyMove(game, 60, 61);
    expect(game.castle.whiteLongCastle).toBe(false);
    expect(game.castle.whiteShortCastle).toBe(false);
  });

  it('sets en passant target on double pawn push', () => {
    const game = makeGame();
    applyMove(game, 52, 36); // e2-e4
    expect(game.enPassantTarget).toBe(44);
  });
});

// --- checkTurnEnd ---

describe('checkTurnEnd', () => {
  it('returns opposite color', () => {
    const result = checkTurnEnd(makeGame(), 'white');
    expect(result.newTurn).toBe('black');
  });

  it('detects checkmate', () => {
    // Back-rank mate: rook on a8 checks king on h8, pawns on g7/h7 block escape
    const board = boardWithPieces([
      { piece: 'K', index: 7 },
      { piece: 'P', index: 14 },
      { piece: 'P', index: 15 },
      { piece: 'r', index: 0 },
      { piece: 'k', index: 60 },
    ]);
    const game = makeGame({ board });
    const result = checkTurnEnd(game, 'white');
    expect(result.gameEnd).toBe('checkmate');
  });

  it('detects stalemate', () => {
    // Black king on a8, white queen on b6, white king on c8 — black to move, stalemate
    const board = boardWithPieces([
      { piece: 'K', index: 0 },
      { piece: 'q', index: 17 },
      { piece: 'k', index: 2 },
    ]);
    const game = makeGame({ board });
    const result = checkTurnEnd(game, 'white');
    expect(result.gameEnd).toBe('stalemate');
  });

  it('detects threefold repetition', () => {
    const game = makeGame();
    const key = 'test-key';
    game.positionHistory.set(key, 999); // won't match positionKey

    // First two calls record position
    checkTurnEnd(game, 'white');
    checkTurnEnd(game, 'white');
    // Third triggers repetition
    const result = checkTurnEnd(game, 'white');
    expect(result.gameEnd).toBe('repetition');
  });

  it('detects fifty-move rule', () => {
    const game = makeGame({ halfMoveClock: 100 });
    const result = checkTurnEnd(game, 'white');
    expect(result.gameEnd).toBe('fifty-move');
  });

  it('sets shouldTriggerAI when next player is AI', () => {
    const game = makeGame({ blackAI: true });
    const result = checkTurnEnd(game, 'white');
    expect(result.shouldTriggerAI).toBe(true);
  });

  it('does not trigger AI for human player', () => {
    const game = makeGame({ blackAI: false });
    const result = checkTurnEnd(game, 'white');
    expect(result.shouldTriggerAI).toBe(false);
  });
});

// --- shouldConvertPawn ---

describe('shouldConvertPawn', () => {
  it('returns convert_ai for AI pawn reaching promotion rank', () => {
    const game = makeGame({
      board: boardWithPieces([{ piece: 'p', index: 3 }]),
      whiteAI: true,
    });
    expect(shouldConvertPawn(game, 'white', 3)).toBe('convert_ai');
  });

  it('returns convert_human for human pawn reaching promotion rank', () => {
    const game = makeGame({
      board: boardWithPieces([{ piece: 'P', index: 56 }]),
      blackAI: false,
    });
    expect(shouldConvertPawn(game, 'black', 56)).toBe('convert_human');
  });

  it('returns switch_turn for pawn not on promotion rank', () => {
    const game = makeGame({
      board: boardWithPieces([{ piece: 'p', index: 20 }]),
    });
    expect(shouldConvertPawn(game, 'white', 20)).toBe('switch_turn');
  });

  it('returns switch_turn for non-pawn piece', () => {
    const game = makeGame({
      board: boardWithPieces([{ piece: 'q', index: 3 }]),
    });
    expect(shouldConvertPawn(game, 'white', 3)).toBe('switch_turn');
  });
});
