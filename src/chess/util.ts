import { color as ChessColor } from './ai';
import { getValid } from './moveGen.js';
import { mailboxIndex } from './main.js';

export const getPiecesOfColor = (
  board: readonly string[],
  color: ChessColor
): readonly number[] => {
  const charCodeLowerBound = color === 'white' ? 97 : 65;
  const charCodeUpperBound = color === 'white' ? 114 : 82;

  return Array.from(Array(64).keys()).filter((never, piecePosition) => {
    const charCode = board[mailboxIndex[piecePosition]].charCodeAt(0);
    return charCodeLowerBound <= charCode && charCode <= charCodeUpperBound;
  });
};

export const getAllValidMoves = (
  board: readonly string[],
  pieces: readonly number[]
): readonly (readonly number[])[] =>
  pieces.map(piece => getValid(piece, board));
