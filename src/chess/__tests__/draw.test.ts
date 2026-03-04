import { describe, it, expect, beforeEach } from 'vitest';
import { positionKey } from '../main.js';
import { STARTING_BOARD, boardWithPieces, ALL_CASTLE } from './helpers.js';
import type { CastleState } from '../main.js';

let board: readonly string[];
let castle: CastleState;
let enPassantTarget: number | null;

beforeEach(() => {
  board = STARTING_BOARD.slice();
  castle = { ...ALL_CASTLE };
  enPassantTarget = null;
});

describe('positionKey', () => {
  it('returns the same key for the same position', () => {
    expect(positionKey(board, 'white', castle, enPassantTarget)).toBe(
      positionKey(board, 'white', castle, enPassantTarget),
    );
  });

  it('different turn produces different key', () => {
    const keyWhite = positionKey(board, 'white', castle, enPassantTarget);
    const keyBlack = positionKey(board, 'black', castle, enPassantTarget);
    expect(keyWhite).not.toBe(keyBlack);
  });

  it('different castling rights produce different key', () => {
    const keyAll = positionKey(board, 'white', castle, enPassantTarget);
    const keyNoCastle = positionKey(
      board,
      'white',
      { ...castle, whiteShortCastle: false },
      enPassantTarget,
    );
    expect(keyAll).not.toBe(keyNoCastle);
  });

  it('different en passant target produces different key', () => {
    const keyNoEp = positionKey(board, 'white', castle, null);
    const keyWithEp = positionKey(board, 'white', castle, 20);
    expect(keyNoEp).not.toBe(keyWithEp);
  });

  it('different board produces different key', () => {
    const keyStart = positionKey(board, 'white', castle, enPassantTarget);
    const minimalBoard = boardWithPieces([
      { piece: 'k', index: 60 },
      { piece: 'K', index: 4 },
    ]);
    const keyMinimal = positionKey(
      minimalBoard,
      'white',
      castle,
      enPassantTarget,
    );
    expect(keyStart).not.toBe(keyMinimal);
  });

  it('includes all 64 squares in the key', () => {
    const key = positionKey(board, 'white', castle, enPassantTarget);
    // The board portion should contain characters for all 64 squares
    const boardPortion = key.split(' ')[0];
    expect(boardPortion).toHaveLength(64);
  });
});
