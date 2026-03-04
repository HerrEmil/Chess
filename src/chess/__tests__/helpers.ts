import { mailboxIndex, type CastleState } from '../main.js';

/**
 * Creates a 120-element mailbox board from a simplified 64-square representation.
 * Input: array of 64 piece characters, row 0 = rank 8 (black side), row 7 = rank 1 (white side).
 * Pieces: lowercase=white (p,r,n,b,q,k), uppercase=black (P,R,N,B,Q,K), '-'=empty.
 */
export const boardFromSquares = (squares: string[]): string[] => {
  const board: string[] = Array(120).fill('*');
  for (let i = 0; i < 64; i++) {
    board[mailboxIndex[i]] = squares[i];
  }
  return board;
};

// prettier-ignore
export const STARTING_SQUARES: string[] = [
  'R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R',
  'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P',
  '-', '-', '-', '-', '-', '-', '-', '-',
  '-', '-', '-', '-', '-', '-', '-', '-',
  '-', '-', '-', '-', '-', '-', '-', '-',
  '-', '-', '-', '-', '-', '-', '-', '-',
  'p', 'p', 'p', 'p', 'p', 'p', 'p', 'p',
  'r', 'n', 'b', 'q', 'k', 'b', 'n', 'r',
];

export const STARTING_BOARD = boardFromSquares(STARTING_SQUARES);

/** Create an empty board (all '-' on valid squares, '*' borders). */
export const emptyBoard = (): string[] => {
  return boardFromSquares(Array(64).fill('-'));
};

/** Place multiple pieces on an empty board. */
export const boardWithPieces = (
  pieces: { piece: string; index: number }[],
): string[] => {
  const board = emptyBoard();
  for (const { piece, index } of pieces) {
    board[mailboxIndex[index]] = piece;
  }
  return board;
};

export const ALL_CASTLE: CastleState = {
  whiteShortCastle: true,
  whiteLongCastle: true,
  blackShortCastle: true,
  blackLongCastle: true,
};
