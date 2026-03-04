import { describe, it, expect } from 'vitest';
import { boardAfterMove, mailboxIndex } from '../main.js';
import { STARTING_BOARD, boardWithPieces, emptyBoard } from './helpers.js';

describe('mailboxIndex', () => {
  it('has 64 entries mapping to the 120-element board', () => {
    expect(mailboxIndex).toHaveLength(64);
  });

  it('first entry maps to index 21 (a8)', () => {
    expect(mailboxIndex[0]).toBe(21);
  });

  it('last entry maps to index 98 (h1)', () => {
    expect(mailboxIndex[63]).toBe(98);
  });
});

describe('boardAfterMove', () => {
  it('moves a piece from start to goal', () => {
    const board = STARTING_BOARD;
    // Move white pawn from e2 (index 52) to e4 (index 36)
    const result = boardAfterMove(board, 52, 36);

    // e4 should now have the white pawn
    expect(result[mailboxIndex[36]]).toBe('p');
    // e2 should be empty
    expect(result[mailboxIndex[52]]).toBe('-');
  });

  it('captures by replacing the destination piece', () => {
    const board = boardWithPieces([
      { piece: 'n', index: 27 }, // white knight on d5
      { piece: 'P', index: 12 }, // black pawn on e7
    ]);
    const result = boardAfterMove(board, 27, 12);

    expect(result[mailboxIndex[12]]).toBe('n');
    expect(result[mailboxIndex[27]]).toBe('-');
  });

  it('does not mutate the original board', () => {
    const board = STARTING_BOARD;
    const originalPiece = board[mailboxIndex[52]];
    boardAfterMove(board, 52, 36);
    expect(board[mailboxIndex[52]]).toBe(originalPiece);
  });

  it('returns a board of the same length', () => {
    const result = boardAfterMove(STARTING_BOARD, 52, 36);
    expect(result).toHaveLength(120);
  });

  it('preserves all other pieces', () => {
    const board = STARTING_BOARD;
    const result = boardAfterMove(board, 52, 36);
    // Check that a8 rook is still there
    expect(result[mailboxIndex[0]]).toBe('R');
    // Check that h1 rook is still there
    expect(result[mailboxIndex[63]]).toBe('r');
  });
});
