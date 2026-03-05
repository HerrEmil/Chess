import {
  boardAfterMove,
  computeCastleState,
  type CastleState,
  mailboxIndex,
  makeMove,
  pieceOnIndex,
  positionKey,
  reverseMailbox,
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
  readonly rookTable: readonly number[];
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
  // prettier-ignore
  rookTable: [
     0,   0,   0,   0,   0,   0,   0,   0,
     5,  10,  10,  10,  10,  10,  10,   5,
    -5,   0,   0,   0,   0,   0,   0,  -5,
    -5,   0,   0,   0,   0,   0,   0,  -5,
    -5,   0,   0,   0,   0,   0,   0,  -5,
    -5,   0,   0,   0,   0,   0,   0,  -5,
    -5,   0,   0,   0,   0,   0,   0,  -5,
     0,   0,   0,   5,   5,   0,   0,   0
  ],
  whitePly: -1,
};

// Base material value for a piece character (no positional bonus)
const basePieceValue = (ch: string): number => {
  switch (ch.toLowerCase()) {
    case 'p':
      return 100;
    case 'n':
      return 320;
    case 'b':
      return 325;
    case 'r':
      return 500;
    case 'q':
      return 975;
    case 'k':
      return 32767;
    default:
      return 0;
  }
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
        return sum + 500 + AI.rookTable[piece];
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

// When materially ahead, reward pushing opponent king to edge and bringing own king closer
const endgameBonus = (
  board: readonly string[],
  currentColor: color,
): number => {
  const myKingIdx =
    reverseMailbox[board.indexOf(currentColor === 'white' ? 'k' : 'K')];
  const oppKingIdx =
    reverseMailbox[board.indexOf(currentColor === 'white' ? 'K' : 'k')];
  if (myKingIdx === -1 || oppKingIdx === -1) return 0;

  const oppFile = oppKingIdx % 8;
  const oppRank = Math.floor(oppKingIdx / 8);
  const edgeBonus = (Math.abs(oppFile - 3.5) + Math.abs(oppRank - 3.5)) * 9;

  const myFile = myKingIdx % 8;
  const myRank = Math.floor(myKingIdx / 8);
  const kingDist = Math.abs(myFile - oppFile) + Math.abs(myRank - oppRank);
  const proximityBonus = (14 - kingDist) * 5;

  return edgeBonus + proximityBonus;
};

// Evaluates the board relative to `currentColor`
const evaluate = (board: readonly string[], currentColor: color): number => {
  const opponent = oppositeColor(currentColor);
  const checkBonus = isInCheck(board, opponent) ? 50 : 0;
  const checkPenalty = isInCheck(board, currentColor) ? 50 : 0;

  const currentValue = getPieceValueSum({
    board,
    pieces: getPiecesOfColor(board, currentColor),
  });

  const opponentValue = getPieceValueSum({
    board,
    pieces: getPiecesOfColor(board, opponent),
  });

  const materialDiff = currentValue - opponentValue;
  const endgame = materialDiff > 300 ? endgameBonus(board, currentColor) : 0;

  return checkBonus - checkPenalty + materialDiff + endgame;
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
  posHistory: Map<string, number> = new Map(),
): readonly number[] => {
  if (depth === 0) {
    return [-1, -1, evaluate(board, currentPlayer)];
  }

  const pieces = getPiecesOfColor(board, currentPlayer);
  const moves = getAllValidMoves(board, pieces, enPassantTarget, castle);

  // Flatten into a sortable move list for MVV-LVA ordering
  const moveList: { goal: number; orderScore: number; start: number }[] = [];
  for (let i = 0; i < pieces.length; i += 1) {
    for (const goal of moves[i]) {
      const start = pieces[i];
      const victim = board[mailboxIndex[goal]];
      // MVV-LVA: prioritize capturing high-value pieces with low-value attackers
      const orderScore =
        victim === '-'
          ? 0
          : basePieceValue(victim) * 10 -
            basePieceValue(board[mailboxIndex[start]]);
      moveList.push({ goal, orderScore, start });
    }
  }

  if (moveList.length === 0) {
    // Checkmate (in check) or stalemate (not in check)
    if (isInCheck(board, currentPlayer)) {
      return [-1, -1, -50000 - depth];
    }
    return [-1, -1, 0];
  }

  // Sort: captures first (highest MVV-LVA score), then quiet moves
  moveList.sort((a, b) => b.orderScore - a.orderScore);

  let bestStart = -1;
  let bestGoal = -1;
  let localAlpha = alpha;

  // Only check repetition near the root (depth >= 2) to avoid
  // expensive positionKey computation at every node
  const checkRepetition = depth >= 2 && posHistory.size > 0;

  for (const { start, goal } of moveList) {
    const childBoard = boardAfterMove(board, start, goal, enPassantTarget);
    const childEp = computeEnPassantTarget(board, start, goal);
    const childCastle = computeCastleState(castle, start, goal);

    const childKey = checkRepetition
      ? positionKey(
          childBoard,
          oppositeColor(currentPlayer),
          childCastle,
          childEp,
        )
      : '';
    const histCount = checkRepetition ? (posHistory.get(childKey) ?? 0) : 0;

    let score = 0;

    if (histCount < 2) {
      if (checkRepetition) posHistory.set(childKey, histCount + 1);
      const childResult = negamax(
        childBoard,
        oppositeColor(currentPlayer),
        depth - 1,
        -beta,
        -localAlpha,
        childEp,
        childCastle,
        posHistory,
      );
      score = -childResult[2];
      // Restore history
      if (checkRepetition) {
        if (histCount === 0) posHistory.delete(childKey);
        else posHistory.set(childKey, histCount);
      }
    }

    if (score > localAlpha) {
      localAlpha = score;
      bestStart = start;
      bestGoal = goal;
    }

    if (localAlpha >= beta) {
      return [bestStart, bestGoal, localAlpha];
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
  posHistory: Map<string, number> = new Map(),
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
    posHistory,
  );

  makeMove(bestMove[0], bestMove[1], true);
};
