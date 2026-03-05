import {
  boardAfterMove,
  computeCastleState,
  type CastleState,
  mailboxIndex,
  makeMove,
  pieceOnIndex,
} from './main.js';
import { getAllValidMoves, getPiecesOfColor } from './util.js';
import { isInCheck } from './moveGen.js';

export type color = 'white' | 'black';

const oppositeColor = (c: color): color => (c === 'white' ? 'black' : 'white');

export type ChessAI = {
  readonly bishopTable: readonly number[];
  readonly kingTable: readonly number[];
  readonly kingTableEndGame: readonly number[];
  readonly knightTable: readonly number[];
  readonly pawnTable: readonly number[];
  whitePly: number;
  blackPly: number;
};

/*
 * Piece Square Tables, numbers found in nice chess bin C# guide:
 * http://www.chessbin.com/post/Chess-Board-Evaluation.aspx
 */

/* Difficulty = ply search depth (selectable in UI). */
export const AI = {
  // prettier-ignore
  bishopTable : [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10,   0,   0,   0,   0,   0,   0, -10,
    -10,   0,   5,  10,  10,   5,   0, -10,
    -10,   5,   5,  10,  10,   5,   5, -10,
    -10,   0,  10,  10,  10,  10,   0, -10,
    -10,  10,  10,  10,  10,  10,  10, -10,
    -10,   5,   0,   0,   0,   0,   5, -10,
    -20, -10, -40, -10, -10, -40, -10, -20
  ],
  blackPly: -1,
  // prettier-ignore
  kingTable : [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    20,   20,   0,   0,   0,   0,  20,  20,
    20,   30,  10,   0,   0,  10,  30,  20
  ],
  // prettier-ignore
  kingTableEndGame : [
    -50, -40, -30, -20, -20, -30, -40, -50,
    -30, -20, -10,   0,   0, -10, -20, -30,
    -30, -10,  20,  30,  30,  20, -10, -30,
    -30, -10,  30,  40,  40,  30, -10, -30,
    -30, -10,  30,  40,  40,  30, -10, -30,
    -30, -10,  20,  30,  30,  20, -10, -30,
    -30, -30,   0,   0,   0,   0, -30, -30,
    -50, -30, -30, -30, -30, -30, -30, -50
  ],
  // prettier-ignore
  knightTable : [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20,   0,   0,   0,   0, -20, -40,
    -30,   0,  10,  15,  15,  10,   0, -30,
    -30,   5,  15,  20,  20,  15,   5, -30,
    -30,   0,  15,  20,  20,  15,   0, -30,
    -30,   5,  10,  15,  15,  10,   5, -30,
    -40, -20,   0,   5,   5,   0, -20, -40,
    -50, -40, -20, -30, -30, -20, -40, -50
  ],
  // prettier-ignore
  pawnTable: [
    875, 875, 875, 875, 875, 875, 875, 875,
    50,   50,  50,  50,  50,  50,  50,  50,
    10,   10,  20,  30,  30,  20,  10,  10,
    5,     5,  10,  27,  27,  10,   5,   5,
    0,     0,   0,  25,  25,   0,   0,   0,
    5,    -5, -10,   0,   0, -10,  -5,   5,
    5,    10,  10, -25, -25,  10,  10,   5,
    0,     0,   0,   0,   0,   0,   0,   0
  ],
  whitePly: -1,
};

const getPieceValueSum = ({
  board = [] as readonly string[],
  pieces = [] as readonly number[],
}): number =>
  pieces.reduce((sum, piece) => {
    switch (pieceOnIndex({ board, pieceIndex: piece })) {
      case 'p':
      case 'P':
        return sum + 100 + AI.pawnTable[piece];
      case 'r':
      case 'R':
        return sum + 500;
      case 'n':
      case 'N':
        return sum + 320 + AI.knightTable[piece];
      case 'b':
      case 'B':
        return sum + 325 + AI.bishopTable[piece];
      case 'q':
      case 'Q':
        return sum + 975;
      case 'k':
      case 'K':
        return sum + 32767 + AI.kingTable[piece];
      default:
        return sum;
    }
  }, 0);

// Evaluates the board relative to `currentColor`
const evaluate = (board: readonly string[], currentColor: color): number => {
  const opponent = oppositeColor(currentColor);
  const checkBonus = isInCheck(board, opponent) ? 15 : 0;
  const checkPenalty = isInCheck(board, currentColor) ? 15 : 0;

  const currentValue = getPieceValueSum({
    board,
    pieces: getPiecesOfColor(board, currentColor),
  });

  const opponentValue = getPieceValueSum({
    board,
    pieces: getPiecesOfColor(board, opponent),
  });

  const salt = Math.random() * 0.1;
  return salt + checkBonus - checkPenalty + (currentValue - opponentValue);
};

/*
 * Negamax with alpha-beta pruning.
 * Returns [bestMoveStart, bestMoveGoal, score].
 * Score is always from the perspective of the current player.
 */
const computeEnPassantTarget = (
  board: readonly string[],
  moveStart: number,
  moveGoal: number,
): number | null => {
  const piece = board[mailboxIndex[moveStart]].toLowerCase();
  if (piece === 'p' && Math.abs(moveGoal - moveStart) === 16) {
    return (moveStart + moveGoal) / 2;
  }
  return null;
};

export const negamax = (
  board: readonly string[],
  currentPlayer: color,
  depth: number,
  alpha: number,
  beta: number,
  enPassantTarget: number | null,
  castle: CastleState,
): readonly number[] => {
  if (depth === 0) {
    return [-1, -1, evaluate(board, currentPlayer)];
  }

  const pieces = getPiecesOfColor(board, currentPlayer);
  const moves = getAllValidMoves(board, pieces, enPassantTarget, castle);

  if (moves.every((m) => m.length === 0)) {
    return [-1, -1, evaluate(board, currentPlayer)];
  }

  let bestStart = -1;
  let bestGoal = -1;
  let localAlpha = alpha;

  for (let pieceIndex = 0; pieceIndex < pieces.length; pieceIndex += 1) {
    for (const move of moves[pieceIndex]) {
      const start = pieces[pieceIndex].valueOf();
      const goal = move.valueOf();
      const childBoard = boardAfterMove(board, start, goal, enPassantTarget);
      const childEp = computeEnPassantTarget(board, start, goal);
      const childCastle = computeCastleState(castle, start, goal);

      const childResult = negamax(
        childBoard,
        oppositeColor(currentPlayer),
        depth - 1,
        -beta,
        -localAlpha,
        childEp,
        childCastle,
      );

      const score = -childResult[2];

      if (score > localAlpha) {
        localAlpha = score;
        bestStart = start;
        bestGoal = goal;
      }

      if (localAlpha >= beta) {
        return [bestStart, bestGoal, localAlpha];
      }
    }
  }

  return [bestStart, bestGoal, localAlpha];
};

/*
 * Main AI entry point. Ply depth is selected directly in the UI.
 */
export const makeAIMove = (
  board: readonly string[],
  turn: color,
  enPassantTarget: number | null,
  castle: CastleState,
): void => {
  const ply = turn === 'white' ? AI.whitePly : AI.blackPly;

  const bestMove = negamax(
    board,
    turn,
    ply,
    -100000,
    100000,
    enPassantTarget,
    castle,
  );

  makeMove(bestMove[0], bestMove[1], true);
};
