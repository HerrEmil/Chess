import { describe, it, expect, beforeEach } from 'vitest';
import { positionKey, mailboxIndex } from '../main.js';
import { STARTING_BOARD, boardWithPieces } from './helpers.js';

beforeEach(() => {
  window.turn = 'white';
  window.game = {
    board: STARTING_BOARD.slice(),
    castle: {
      whiteLongCastle: true,
      whiteShortCastle: true,
      blackLongCastle: true,
      blackShortCastle: true,
    },
    enPassantTarget: null,
    pawn: { pawnToConvert: -1 },
    halfMoveClock: 0,
    positionHistory: new Map(),
  } as any;
});

describe('positionKey', () => {
  it('returns the same key for the same position', () => {
    expect(positionKey()).toBe(positionKey());
  });

  it('different turn produces different key', () => {
    const keyWhite = positionKey();
    window.turn = 'black';
    const keyBlack = positionKey();
    expect(keyWhite).not.toBe(keyBlack);
  });

  it('different castling rights produce different key', () => {
    const keyAll = positionKey();
    window.game.castle.whiteShortCastle = false;
    const keyNoCastle = positionKey();
    expect(keyAll).not.toBe(keyNoCastle);
  });

  it('different en passant target produces different key', () => {
    const keyNoEp = positionKey();
    window.game.enPassantTarget = 20;
    const keyWithEp = positionKey();
    expect(keyNoEp).not.toBe(keyWithEp);
  });

  it('different board produces different key', () => {
    const keyStart = positionKey();
    window.game.board = boardWithPieces([
      { piece: 'k', index: 60 },
      { piece: 'K', index: 4 },
    ]);
    const keyMinimal = positionKey();
    expect(keyStart).not.toBe(keyMinimal);
  });

  it('includes all 64 squares in the key', () => {
    const key = positionKey();
    // The board portion should contain characters for all 64 squares
    const boardPortion = key.split(' ')[0];
    expect(boardPortion).toHaveLength(64);
  });
});
