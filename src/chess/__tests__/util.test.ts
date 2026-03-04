import { describe, it, expect } from 'vitest';
import { getPiecesOfColor } from '../util.js';
import { STARTING_BOARD, emptyBoard, boardWithPieces } from './helpers.js';

describe('getPiecesOfColor', () => {
  it('finds all 16 white pieces on starting board', () => {
    const whites = getPiecesOfColor(STARTING_BOARD, 'white');
    expect(whites).toHaveLength(16);
  });

  it('finds all 16 black pieces on starting board', () => {
    const blacks = getPiecesOfColor(STARTING_BOARD, 'black');
    expect(blacks).toHaveLength(16);
  });

  it('white pieces include pawns on rank 2 (indices 48-55)', () => {
    const whites = getPiecesOfColor(STARTING_BOARD, 'white');
    for (let i = 48; i <= 55; i++) {
      expect(whites).toContain(i);
    }
  });

  it('black pieces include pawns on rank 7 (indices 8-15)', () => {
    const blacks = getPiecesOfColor(STARTING_BOARD, 'black');
    for (let i = 8; i <= 15; i++) {
      expect(blacks).toContain(i);
    }
  });

  it('returns empty array on empty board', () => {
    const board = emptyBoard();
    expect(getPiecesOfColor(board, 'white')).toHaveLength(0);
    expect(getPiecesOfColor(board, 'black')).toHaveLength(0);
  });

  it('finds a single piece', () => {
    const board = boardWithPieces([{ piece: 'k', index: 35 }]);
    const whites = getPiecesOfColor(board, 'white');
    expect(whites).toEqual([35]);
  });

  it('does not confuse colors', () => {
    const board = boardWithPieces([
      { piece: 'k', index: 60 }, // white king
      { piece: 'K', index: 4 }, // black king
    ]);
    const whites = getPiecesOfColor(board, 'white');
    const blacks = getPiecesOfColor(board, 'black');
    expect(whites).toEqual([60]);
    expect(blacks).toEqual([4]);
  });
});
