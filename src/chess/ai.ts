/* eslint-disable max-lines */
import {
  boardAfterMove,
  mailboxIndex,
  makeMove,
  pieceOnIndex
} from './main.js';
import { getAllValidMoves, getPiecesOfColor } from './util.js';
import { getAllValidMovesNoCheck, isInCheck } from './moveGen.js';

export type color = 'white' | 'black';

export type ChessAI = {
  readonly bishopTable: readonly number[];
  readonly kingTable: readonly number[];
  readonly kingTableEndGame: readonly number[];
  readonly knightTable: readonly number[];
  readonly pawnTable: readonly number[];
  whiteIntelligence: number;
  intelligence: number;
  blackIntelligence: number;
};

/*
 * Piece Square Tables, numbers found in nice chessbin C# guide:
 * http://www.chessbin.com/post/Chess-Board-Evaluation.aspx
 */

/*
 * Difficulty
 * 1 = Very easy. Original AI with more randomness, increase salt to AI breaking number.
 * 2 = Easy. The original AI.
 * 3 = Medium. Piece value + Strategic Positions
 */
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
  blackIntelligence: -1,
  /*
   * This value is the one actually used by the evaluation function
   * It is set by makeMove depending on current turn
   */
  intelligence: -1,
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
  whiteIntelligence: -1
};

const getPieceValueSum = ({
  board = [] as readonly string[],
  pieces = [] as readonly number[],
  AILevel = 1
}): number => {
  return pieces.reduce((sum, piece) => {
    switch (pieceOnIndex({ board, pieceIndex: piece })) {
      case 'p':
      case 'P':
        return sum + 100 + (AILevel === 3 ? AI.pawnTable[piece] : 0);
      case 'r':
      case 'R':
        return sum + 500;
      case 'n':
      case 'N':
        return sum + 320 + (AILevel === 3 ? AI.knightTable[piece] : 0);
      case 'b':
      case 'B':
        return sum + 325 + (AILevel === 3 ? AI.bishopTable[piece] : 0);
      case 'q':
      case 'Q':
        return sum + 975;
      case 'k':
      case 'K':
        return sum + 32767 + (AILevel === 3 ? AI.kingTable[piece] : 0);
      default:
        return sum;
    }
  }, 0);
};

// Evaluates the value of a state of a board
const evaluate = (board: readonly string[], color: color): number => {
  const whiteValue =
    getPieceValueSum({
      AILevel: AI.intelligence,
      board,
      pieces: getPiecesOfColor(board, 'white')
    }) + (isInCheck(board, 'black') ? 0.5 : 0);

  const blackValue =
    getPieceValueSum({
      AILevel: AI.intelligence,
      board,
      pieces: getPiecesOfColor(board, 'black')
    }) + (isInCheck(board, 'white') ? 0.5 : 0);

  const difference =
    color === 'white' ? whiteValue - blackValue : blackValue - whiteValue;

  const salt = Math.random() * (AI.intelligence === 1 ? 1000 : 0.1);
  return salt + difference;
};

/*
 * Best move lookup function
 * Given ply >1, return array will contain move with start position and end position, on index 0 and 1 respectively
 * Given ply 1, return array will contain a value of the boardState, on index 2
 */
// eslint-disable-next-line max-statements, max-lines-per-function
const maxMove = (
  board: readonly string[],
  player: color,
  ply: number,
  alpha: number,
  beta: number,
  boardIndex: readonly number[]
  // eslint-disable-next-line max-params
): readonly number[] => {
  if (ply === 1) {
    // eslint-disable-next-line no-sparse-arrays
    return [, , evaluate(board, player)] as readonly number[];
  }

  const pieces = getPiecesOfColor(board, player);
  const moves = getAllValidMoves(board, pieces);

  if (moves.length === 0) {
    // eslint-disable-next-line no-sparse-arrays
    return [, , evaluate(board, player)] as readonly number[];
  }

  let localBestMoveStart = -1;
  let localBestMoveGoal = -1;
  let localAlpha = alpha;
  for (let pieceIndex = 0; pieceIndex < pieces.length; pieceIndex += 1) {
    for (const move of moves[pieceIndex]) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      const childMove = minMove(
        boardAfterMove(board, pieces[pieceIndex].valueOf(), move.valueOf()),
        player,
        ply - 1,
        localAlpha,
        beta,
        boardIndex
      );

      if (childMove.length === 3) {
        if (childMove[2].valueOf() > localAlpha) {
          localAlpha = childMove[2].valueOf();
          localBestMoveStart = pieces[pieceIndex].valueOf();
          localBestMoveGoal = move.valueOf();
        }
      }

      if (beta < localAlpha) {
        return [localBestMoveStart, localBestMoveGoal, localAlpha];
      }
    }
  }
  return [localBestMoveStart, localBestMoveGoal, localAlpha];
};

// eslint-disable-next-line max-statements, max-params, max-lines-per-function
const minMove = (
  board: readonly string[],
  player: color,
  ply: number,
  alpha: number,
  beta: number,
  boardIndex: readonly number[]
  // eslint-disable-next-line max-params
): readonly number[] => {
  if (ply === 1) {
    // eslint-disable-next-line no-sparse-arrays
    return [, , evaluate(board, player)] as readonly number[];
  }

  const minPlayer = player === 'white' ? 'black' : 'white';
  const pieces = getPiecesOfColor(board, minPlayer);
  const moves: readonly (readonly number[])[] = getAllValidMovesNoCheck(
    board,
    pieces
  );

  if (moves.length === 0) {
    // eslint-disable-next-line no-sparse-arrays
    return [, , evaluate(board, minPlayer)] as readonly number[];
  }

  let localBestMoveStart = -1;
  let localBestMoveGoal = -1;
  let localBeta = beta;
  for (let pieceIndex = 0; pieceIndex < pieces.length; pieceIndex += 1) {
    for (const move of moves[pieceIndex]) {
      const childMove = maxMove(
        boardAfterMove(board, pieces[pieceIndex].valueOf(), move.valueOf()),
        player,
        ply - 1,
        alpha,
        localBeta,
        boardIndex
      );

      if (childMove.length === 3) {
        if (childMove[2].valueOf() < localBeta) {
          localBeta = childMove[2].valueOf();
          localBestMoveStart = pieces[pieceIndex].valueOf();
          localBestMoveGoal = move.valueOf();
        }
      }

      if (localBeta < alpha) {
        return [localBestMoveStart, localBestMoveGoal, localBeta];
      }
    }
  }
  return [localBestMoveStart, localBestMoveGoal, localBeta];
};

/*
 * This is the main AI function that is called from the game
 * The ply value has to be 2 or higher for the AI to behave
 * Note: There is something broken that causes the AI to only work when
 * given odd numbers, effectively limiting it to just accepting 3
 */
export const makeAIMove = (ply: number): void => {
  const alpha = -100000;
  const beta = 100000;

  // Make sure that ply is 2 or higher
  if (ply <= 2) {
    return;
  }

  // Set the evaluation difficulty
  AI.intelligence =
    window.turn === 'white' ? AI.whiteIntelligence : AI.blackIntelligence;

  // Call best move lookup function
  const bestMove = maxMove(
    window.game.board,
    window.turn,
    ply,
    alpha,
    beta,
    mailboxIndex
  );

  makeMove(bestMove[0], bestMove[1], true);
};
