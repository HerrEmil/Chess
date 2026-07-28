import { color as ChessColor } from './ai';
import { getValid } from './moveGen.js';
import { mailboxIndex, type CastleState } from './main.js';

export const getPiecesOfColor = (
  board: readonly string[],
  color: ChessColor,
): readonly number[] => {
  const pieces: number[] = [];
  const lo = color === 'white' ? 97 : 65;
  const hi = color === 'white' ? 114 : 82;
  for (let i = 0; i < 64; i += 1) {
    const c = board[mailboxIndex[i]].charCodeAt(0);
    if (lo <= c && c <= hi) pieces.push(i);
  }
  return pieces;
};

export const getAllValidMoves = (
  board: readonly string[],
  pieces: readonly number[],
  enPassantTarget: number | null,
  castle: CastleState,
): readonly (readonly number[])[] =>
  pieces.map((piece) => getValid(piece, board, enPassantTarget, castle));

// True when `color` has at least one legal move. getValid already discards
// moves that would leave the king in check, so "no legal move anywhere" is
// exactly stalemate-or-mate depending on whether the king is currently checked.
export const sideHasLegalMove = (
  board: readonly string[],
  color: ChessColor,
  enPassantTarget: number | null,
  castle: CastleState,
): boolean =>
  getPiecesOfColor(board, color).some(
    (piece) => getValid(piece, board, enPassantTarget, castle).length > 0,
  );
