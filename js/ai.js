import { boardAfterMove, makeMove } from './main.js';
import { getAllValidMoves, getPieces } from './util.js';
import { getAllValidMovesNoCheck, isInCheck } from './moveGen.js';

export const AI = {};

// This var is just used to make sure that we do not return value on top level of decision tree
AI.plyUsed = 100;

/*
 * Piece Square Tables, numbers found in nice chessbin C# guide:
 * http://www.chessbin.com/post/Chess-Board-Evaluation.aspx
 */

// prettier-ignore
AI.pawnTable = [
	875, 875, 875, 875, 875, 875, 875, 875,
	50,   50,  50,  50,  50,  50,  50,  50,
	10,   10,  20,  30,  30,  20,  10,  10,
	5,     5,  10,  27,  27,  10,   5,   5,
	0,     0,   0,  25,  25,   0,   0,   0,
	5,    -5, -10,   0,   0, -10,  -5,   5,
	5,    10,  10, -25, -25,  10,  10,   5,
	0,     0,   0,   0,   0,   0,   0,   0
];

// prettier-ignore
AI.knightTable = [
	-50, -40, -30, -30, -30, -30, -40, -50,
	-40, -20,   0,   0,   0,   0, -20, -40,
	-30,   0,  10,  15,  15,  10,   0, -30,
	-30,   5,  15,  20,  20,  15,   5, -30,
	-30,   0,  15,  20,  20,  15,   0, -30,
	-30,   5,  10,  15,  15,  10,   5, -30,
	-40, -20,   0,   5,   5,   0, -20, -40,
	-50, -40, -20, -30, -30, -20, -40, -50
];

// prettier-ignore
AI.bishopTable = [
	-20, -10, -10, -10, -10, -10, -10, -20,
	-10,   0,   0,   0,   0,   0,   0, -10,
	-10,   0,   5,  10,  10,   5,   0, -10,
	-10,   5,   5,  10,  10,   5,   5, -10,
	-10,   0,  10,  10,  10,  10,   0, -10,
	-10,  10,  10,  10,  10,  10,  10, -10,
	-10,   5,   0,   0,   0,   0,   5, -10,
	-20, -10, -40, -10, -10, -40, -10, -20
];

// prettier-ignore
AI.kingTable = [
	-30, -40, -40, -50, -50, -40, -40, -30,
	-30, -40, -40, -50, -50, -40, -40, -30,
	-30, -40, -40, -50, -50, -40, -40, -30,
	-30, -40, -40, -50, -50, -40, -40, -30,
	-20, -30, -30, -40, -40, -30, -30, -20,
	-10, -20, -20, -20, -20, -20, -20, -10,
	20,   20,   0,   0,   0,   0,  20,  20,
	20,   30,  10,   0,   0,  10,  30,  20
];

// prettier-ignore
AI.kingTableEndGame = [
	-50, -40, -30, -20, -20, -30, -40, -50,
	-30, -20, -10,   0,   0, -10, -20, -30,
	-30, -10,  20,  30,  30,  20, -10, -30,
	-30, -10,  30,  40,  40,  30, -10, -30,
	-30, -10,  30,  40,  40,  30, -10, -30,
	-30, -10,  20,  30,  30,  20, -10, -30,
	-30, -30,   0,   0,   0,   0, -30, -30,
	-50, -30, -30, -30, -30, -30, -30, -50
];

/*
 * Difficulty
 * 1 = Very easy. Original AI with more randomness, increase salt to AI breaking number.
 * 2 = Easy. The original AI.
 * 3 = Medium. Piece value + Strategic Positions
 */

// These are set at the start of the game, depending on player selection.
AI.whiteIntelligence = -1;
AI.blackIntelligence = -1;
/*
 * This value is the one actually used by the evaluation function
 * It is set by AI.makeMove depending on current turn
 */
AI.intelligence = -1;

const getPieceValueSum = ({
  board = [],
  boardIndex = [],
  pieces = [],
  AILevel = 1
}) => {
  return pieces.reduce((sum, piece) => {
    switch (board[boardIndex[piece]]) {
      case 'p':
        return sum + 100 + (AILevel === 3 && AI.pawnTable[piece]);
      case 'r':
        return sum + 500;
      case 'n':
        return sum + 320 + (AILevel === 3 && AI.knightTable[piece]);
      case 'b':
        return sum + 325 + (AILevel === 3 && AI.bishopTable[piece]);
      case 'q':
        return sum + 975;
      case 'k':
        return sum + 32767 + (AILevel === 3 && AI.kingTable[piece]);
      default:
        return sum;
    }
  }, 0);
};

// Evaluates the value of a state of a board
AI.evaluate = (board, color) => {
  const whiteValue =
    getPieceValueSum({
      AILevel: AI.intelligence,
      board,
      boardIndex: game.boardIndex,
      pieces: getPieces(board, 'white')
    }) + (isInCheck(board, 'black') && 0.5);

  const blackValue =
    getPieceValueSum({
      AILevel: AI.intelligence,
      board,
      boardIndex: game.boardIndex,
      pieces: getPieces(board, 'black')
    }) + (isInCheck(board, 'white') && 0.5);

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
// eslint-disable-next-line max-statements, max-params
AI.maxMove = (board, player, ply, alpha, beta) => {
  let childBoardState = board.slice();
  if (ply === 1) {
    // eslint-disable-next-line no-sparse-arrays
    return [, , AI.evaluate(childBoardState, player)];
  }

  const pieces = getPieces(childBoardState, player);
  const moves = getAllValidMoves(childBoardState, pieces);

  if ([].concat(...moves).length === 0) {
    // eslint-disable-next-line no-sparse-arrays
    return [, , AI.evaluate(childBoardState, player)];
  }

  let localBestMoveStart = -1;
  let localBestMoveGoal = -1;
  let localAlpha = alpha;
  for (let pieceIndex = 0; pieceIndex < pieces.length; pieceIndex += 1) {
    for (const move of moves[pieceIndex]) {
      const childMove = AI.minMove(
        boardAfterMove(
          childBoardState,
          pieces[pieceIndex].valueOf(),
          move.valueOf()
        ).slice(),
        player,
        ply - 1,
        localAlpha,
        beta
      );

      childBoardState = board.slice();

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

// eslint-disable-next-line max-statements, max-params
AI.minMove = (board, player, ply, alpha, beta) => {
  let childBoardState = board.slice();
  if (ply === 1) {
    // eslint-disable-next-line no-sparse-arrays
    return [, , AI.evaluate(childBoardState, player)];
  }

  const minPlayer = player === 'white' ? 'black' : 'white';
  const pieces = getPieces(childBoardState, minPlayer);
  const moves = getAllValidMovesNoCheck(childBoardState, pieces);

  if ([].concat(...moves).length === 0) {
    // eslint-disable-next-line no-sparse-arrays
    return [, , AI.evaluate(childBoardState, minPlayer)];
  }

  let localBestMoveStart = -1;
  let localBestMoveGoal = -1;
  let localBeta = beta;
  for (let pieceIndex = 0; pieceIndex < pieces.length; pieceIndex += 1) {
    for (const move of moves[pieceIndex]) {
      const childMove = AI.maxMove(
        boardAfterMove(
          childBoardState,
          pieces[pieceIndex].valueOf(),
          move.valueOf()
        ),
        player,
        ply - 1,
        alpha,
        localBeta
      );

      childBoardState = board.slice();

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
AI.makeMove = ply => {
  const alpha = -100000;
  const beta = 100000;

  // Make sure that ply is 2 or higher
  if (ply <= 2) {
    return;
  }

  // Note down which ply you are using
  AI.plyUsed = ply;

  // Set the evaluation difficulty
  AI.intelligence =
    turn === 'white' ? AI.whiteIntelligence : AI.blackIntelligence;

  // Call best move lookup function
  const bestMove = AI.maxMove(game.board, turn, ply, alpha, beta);

  // Check that the lookup function returned a useful move
  if (bestMove[0] !== -1 && bestMove[1] !== -1) {
    // Make the move!
    makeMove(bestMove[0], bestMove[1], true);
  }
};
