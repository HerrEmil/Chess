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
import { getAllValidMovesNoCheck, isInCheck } from './moveGen.js';

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

// Vertically mirror a 0-63 board index (flip rank, keep file): rank r -> 7-r.
const mirrorIndex = (index: number): number =>
  (7 - Math.floor(index / 8)) * 8 + (index % 8);

// Piece-square tables are authored from White's perspective (index 0 = a8).
// Black's squares are the vertical mirror image, so Black piece lookups must
// use the flipped index. Passing `mirror = false` reproduces the legacy
// (single-orientation) behaviour and exists only for A/B regression testing.
const getPieceValueSum = ({
  board = [] as readonly string[],
  pieces = [] as readonly number[],
  black = false,
  mirror = true,
}): number =>
  pieces.reduce((sum, piece) => {
    const idx = black && mirror ? mirrorIndex(piece) : piece;
    switch (pieceOnIndex({ board, pieceIndex: piece })) {
      case 'p':
      case 'P':
        return sum + 100 + AI.pawnTable[idx];
      case 'r':
      case 'R':
        return sum + 500 + AI.rookTable[idx];
      case 'n':
      case 'N':
        return sum + 320 + AI.knightTable[idx];
      case 'b':
      case 'B':
        return sum + 325 + AI.bishopTable[idx];
      case 'q':
      case 'Q':
        return sum + 975;
      case 'k':
      case 'K':
        return sum + 32767 + AI.kingTable[idx];
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

// Evaluates the board relative to `currentColor`.
// `mirror` toggles per-color piece-square mirroring; false = legacy behaviour.
export const evaluate = (
  board: readonly string[],
  currentColor: color,
  mirror = true,
): number => {
  const opponent = oppositeColor(currentColor);
  const checkBonus = isInCheck(board, opponent) ? 50 : 0;
  const checkPenalty = isInCheck(board, currentColor) ? 50 : 0;

  const currentValue = getPieceValueSum({
    black: currentColor === 'black',
    board,
    mirror,
    pieces: getPiecesOfColor(board, currentColor),
  });

  const opponentValue = getPieceValueSum({
    black: opponent === 'black',
    board,
    mirror,
    pieces: getPiecesOfColor(board, opponent),
  });

  const materialDiff = currentValue - opponentValue;
  const endgame = materialDiff > 300 ? endgameBonus(board, currentColor) : 0;

  return checkBonus - checkPenalty + materialDiff + endgame;
};

/*
 * Quiescence search.
 *
 * The static `evaluate` is only meaningful for "quiet" positions. Calling it at
 * a fixed horizon mid-capture causes the horizon effect: the search stops after
 * grabbing a piece and never sees the recapture, so it over/under-counts
 * material. Quiescence fixes this by, at the leaf, resolving all pending
 * captures before scoring — it plays out capture sequences (only) until the
 * position is quiet, using a stand-pat lower bound so the side to move is never
 * forced into a losing capture it could decline.
 *
 * Captures are generated pseudo-legally and filtered for self-check legality in
 * the loop. En passant is intentionally omitted (rare, and its target isn't
 * threaded to the leaf); capture-promotions auto-queen to match the game UI.
 */
const QUIESCENCE_MAX_DEPTH = 4;

/*
 * Safety buffer for delta pruning: the largest positional swing `evaluate` can
 * add on top of raw material (piece-square + check + endgame terms). A capture
 * that can't reach alpha even with this slack cannot improve the score.
 */
const DELTA_MARGIN = 200;

// A pseudo-legal capture for quiescence, pre-scored for MVV-LVA ordering.
// `gain` is the captured material (plus promotion), used for delta pruning.
type Capture = {
  gain: number;
  goal: number;
  orderScore: number;
  start: number;
};

/*
 * True when `code` (a char code) is an enemy piece of `currentColor` other than
 * the king. Lowercase = white, uppercase = black; kings are never "captured".
 * White's enemies are black A-Z (65-90, excluding 'K' 75); black's enemies are
 * white a-z (97-122, excluding 'k' 107).
 */
const isEnemyNonKing = (code: number, currentColor: color): boolean =>
  currentColor === 'white'
    ? code >= 65 && code <= 90 && code !== 75
    : code >= 97 && code <= 122 && code !== 107;

// All pseudo-legal captures for `currentColor`, MVV-LVA ordered (most valuable
// victim, least valuable attacker first). Reuses the production pseudo-legal
// move generator, then keeps only moves landing on an enemy piece.
const generateCaptures = (
  board: readonly string[],
  currentColor: color,
): Capture[] => {
  const pieces = getPiecesOfColor(board, currentColor);
  const perPiece = getAllValidMovesNoCheck(board, pieces);
  const captures: Capture[] = [];
  for (let i = 0; i < pieces.length; i += 1) {
    const start = pieces[i];
    const attacker = board[mailboxIndex[start]];
    const attackerValue = basePieceValue(attacker);
    for (const goal of perPiece[i]) {
      const victim = board[mailboxIndex[goal]];
      if (isEnemyNonKing(victim.charCodeAt(0), currentColor)) {
        const isPromotion =
          (attacker === 'p' && goal < 8) || (attacker === 'P' && goal > 55);
        // A capture-promotion also nets a queen minus the consumed pawn.
        const gain = basePieceValue(victim) + (isPromotion ? 975 - 100 : 0);
        captures.push({
          gain,
          goal,
          orderScore: gain * 10 - attackerValue,
          start,
        });
      }
    }
  }
  return captures;
};

// Board after a quiescence capture, auto-queening a pawn that reached the last
// rank (mirrors the game UI's default promotion). No en passant here.
const captureChild = (
  board: readonly string[],
  start: number,
  goal: number,
): readonly string[] => {
  const child = boardAfterMove(board, start, goal).slice();
  const moved = child[mailboxIndex[goal]];
  if (moved === 'p' && goal < 8) child[mailboxIndex[goal]] = 'q';
  else if (moved === 'P' && goal > 55) child[mailboxIndex[goal]] = 'Q';
  return child;
};

// Negamax capture-only search returning the quiet score for `currentColor`.
export const quiesce = (
  board: readonly string[],
  currentColor: color,
  alpha: number,
  beta: number,
  qdepth: number = QUIESCENCE_MAX_DEPTH,
): number => {
  // Stand-pat: the side to move may always decline to capture, so the static
  // score is a lower bound on what it can achieve.
  const standPat = evaluate(board, currentColor, true);
  if (standPat >= beta) return beta;
  let localAlpha = standPat > alpha ? standPat : alpha;
  if (qdepth === 0) return localAlpha;

  const captures = generateCaptures(board, currentColor);
  captures.sort((a, b) => b.orderScore - a.orderScore);

  for (const { start, goal, gain } of captures) {
    // Delta pruning: skip captures whose best-case material can't reach alpha.
    const worthTrying = standPat + gain + DELTA_MARGIN >= localAlpha;
    const child = worthTrying ? captureChild(board, start, goal) : null;
    // Skip captures that leave the mover's own king in check (illegal).
    if (child !== null && !isInCheck(child, currentColor)) {
      const score = -quiesce(
        child,
        oppositeColor(currentColor),
        -beta,
        -localAlpha,
        qdepth - 1,
      );
      if (score >= beta) return beta;
      if (score > localAlpha) localAlpha = score;
    }
  }
  return localAlpha;
};

// Leaf evaluator used by negamax: resolves captures before scoring. This is the
// production engine's static-eval replacement at the search horizon.
export const quiescentEval = (
  board: readonly string[],
  currentColor: color,
): number => quiesce(board, currentColor, -100000, 100000);

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
  evaluateFn: (b: readonly string[], c: color) => number = quiescentEval,
): readonly number[] => {
  if (depth === 0) {
    return [-1, -1, evaluateFn(board, currentPlayer)];
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
        evaluateFn,
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
