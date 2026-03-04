import { AI, color, makeAIMove } from './ai.js';
import { bindEvents, buildBoard, setBoard, setLabels } from './board.js';
import { convertPawn, endGame, startGame } from './panels.js';
import { getAllValidMoves, getPiecesOfColor } from './util.js';
import { isInCheck } from './moveGen.js';

export type GameResult =
  | 'checkmate'
  | 'stalemate'
  | 'fifty-move'
  | 'repetition';

export type GlobalChess = {
  readonly castle: {
    blackLongCastle: boolean;
    blackShortCastle: boolean;
    whiteLongCastle: boolean;
    whiteShortCastle: boolean;
  };
  readonly pawn: {
    pawnToConvert: number;
  };
  enPassantTarget: number | null;
  board: string[];
  readonly boardIndex: readonly number[];
  blackAI: boolean;
  whiteAI: boolean;
  halfMoveClock: number;
  positionHistory: Map<string, number>;
};

// prettier-ignore
export const mailboxIndex = [
  21, 22, 23, 24, 25, 26, 27, 28,
  31, 32, 33, 34, 35, 36, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48,
  51, 52, 53, 54, 55, 56, 57, 58,
  61, 62, 63, 64, 65, 66, 67, 68,
  71, 72, 73, 74, 75, 76, 77, 78,
  81, 82, 83, 84, 85, 86, 87, 88,
  91, 92, 93, 94, 95, 96, 97, 98
];

export const positionKey = (turn?: color): string => {
  const { board, castle, enPassantTarget } = window.game;
  const activeTurn = turn ?? window.turn;
  const squares = mailboxIndex.map((i) => board[i]).join('');
  const c =
    (castle.whiteShortCastle ? 'K' : '') +
      (castle.whiteLongCastle ? 'Q' : '') +
      (castle.blackShortCastle ? 'k' : '') +
      (castle.blackLongCastle ? 'q' : '') || '-';
  const ep = enPassantTarget === null ? '-' : String(enPassantTarget);
  return `${squares} ${activeTurn} ${c} ${ep}`;
};

export const pieceOnIndex = ({
  board,
  pieceIndex,
}: {
  readonly board: readonly string[];
  readonly pieceIndex: number;
}): string => board[mailboxIndex[pieceIndex]];

window.inHand = '';
window.mousePos = '';
window.turn = '' as color;

window.AI = AI;
window.startGame = startGame;

window.game = {
  // prettier-ignore
  board: [
    '*', '*', '*', '*', '*', '*', '*', '*', '*', '*',
    '*', '*', '*', '*', '*', '*', '*', '*', '*', '*',
    '*', 'R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R', '*',
    '*', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', '*',
    '*', '-', '-', '-', '-', '-', '-', '-', '-', '*',
    '*', '-', '-', '-', '-', '-', '-', '-', '-', '*',
    '*', '-', '-', '-', '-', '-', '-', '-', '-', '*',
    '*', '-', '-', '-', '-', '-', '-', '-', '-', '*',
    '*', 'p', 'p', 'p', 'p', 'p', 'p', 'p', 'p', '*',
    '*', 'r', 'n', 'b', 'q', 'k', 'b', 'n', 'r', '*',
    '*', '*', '*', '*', '*', '*', '*', '*', '*', '*',
    '*', '*', '*', '*', '*', '*', '*', '*', '*', '*'
  ],
  castle: {
    blackLongCastle: true,
    blackShortCastle: true,
    whiteLongCastle: true,
    whiteShortCastle: true,
  },
  enPassantTarget: null,
  halfMoveClock: 0,
  pawn: { pawnToConvert: -1 },
  positionHistory: new Map(),
} as Partial<GlobalChess> as GlobalChess;

const initChess = (): void => {
  buildBoard();
  setBoard();
  bindEvents();
  setLabels();

  // Init the turn counter on black and switch turn to white
  window.turn = 'black';
  // Makes no text selectable.
  document.onselectstart = (): false => false;
};

/*
 * Takes board state and move, applies move to board state, returns resulting board
 * Does not check validity of move, so use with care.
 */
export const boardAfterMove = (
  board: readonly string[],
  moveStart: number,
  moveGoal: number,
  enPassantTarget: number | null = null,
): readonly string[] => {
  /*
   * The move we get are indexes of a regular board (0-63), but our boards
   * are in mailbox format, so we need the mailbox index to update the board.
   */
  const boardIndexGoal = mailboxIndex[moveGoal];
  const boardIndexStart = mailboxIndex[moveStart];

  // Detect en passant capture: pawn moves diagonally to the en passant target square
  const movingPiece = board[boardIndexStart].toLowerCase();
  const isEnPassant =
    movingPiece === 'p' &&
    enPassantTarget !== null &&
    moveGoal === enPassantTarget &&
    board[boardIndexGoal] === '-';

  // The captured pawn is behind the target square (same file, capturer's rank)
  const capturedPawnMailbox = isEnPassant
    ? mailboxIndex[moveGoal + (moveGoal > moveStart ? -8 : 8)]
    : -1;

  // Copy piece from start to goal, clear start, and remove captured pawn if en passant
  const newBoard = board.slice();
  newBoard[boardIndexGoal] = board[boardIndexStart];
  newBoard[boardIndexStart] = '-';
  if (isEnPassant) newBoard[capturedPawnMailbox] = '-';
  return newBoard;
};

// --- Pure game logic functions ---

export type MoveResult = {
  castlingRookMove: [number, number] | null;
  enPassantCaptureIndex: number | null;
};

const computeCastlingRookMove = (
  game: GlobalChess,
  origin: number,
  destination: number,
): [number, number] | null => {
  if (origin === 60) {
    if (game.castle.whiteLongCastle && destination === 58) return [56, 59];
    if (game.castle.whiteShortCastle && destination === 62) return [63, 61];
  }
  if (origin === 4) {
    if (game.castle.blackLongCastle && destination === 2) return [0, 3];
    if (game.castle.blackShortCastle && destination === 6) return [7, 5];
  }
  return null;
};

const updateCastlingAllowedState = (
  game: GlobalChess,
  moveOrigin: number,
  moveDestination: number,
): void => {
  // King or rook moved
  switch (moveOrigin) {
    case 60:
      game.castle.whiteLongCastle = false;
      game.castle.whiteShortCastle = false;
      break;
    case 4:
      game.castle.blackLongCastle = false;
      game.castle.blackShortCastle = false;
      break;
    case 63:
      game.castle.whiteShortCastle = false;
      break;
    case 56:
      game.castle.whiteLongCastle = false;
      break;
    case 7:
      game.castle.blackShortCastle = false;
      break;
    case 0:
      game.castle.blackLongCastle = false;
      break;
    default:
      break;
  }

  // Rook captured
  switch (moveDestination) {
    case 63:
      game.castle.whiteShortCastle = false;
      break;
    case 56:
      game.castle.whiteLongCastle = false;
      break;
    case 7:
      game.castle.blackShortCastle = false;
      break;
    case 0:
      game.castle.blackLongCastle = false;
      break;
    default:
      break;
  }
};

export const applyMove = (
  game: GlobalChess,
  origin: number,
  destination: number,
): MoveResult => {
  const piece = pieceOnIndex({ board: game.board, pieceIndex: origin });
  const isPawn = piece.toLowerCase() === 'p';
  const destPiece = pieceOnIndex({
    board: game.board,
    pieceIndex: destination,
  });

  // Detect en passant capture before moving
  const isEnPassant =
    isPawn &&
    game.enPassantTarget !== null &&
    destination === game.enPassantTarget &&
    destPiece === '-';

  const enPassantCaptureIndex = isEnPassant
    ? destination + (destination > origin ? -8 : 8)
    : null;

  // Detect capture before moving the piece
  const isCapture = destPiece !== '-' || isEnPassant;

  // Compute castling rook move before updating castling state
  const castlingRookMove = computeCastlingRookMove(game, origin, destination);

  // Apply main piece move to board
  game.board = boardAfterMove(
    game.board,
    origin,
    destination,
    game.enPassantTarget,
  ) as string[];

  // Apply castling rook move to board
  if (castlingRookMove) {
    game.board = boardAfterMove(
      game.board,
      castlingRookMove[0],
      castlingRookMove[1],
    ) as string[];
  }

  updateCastlingAllowedState(game, origin, destination);

  // Update en passant target: set when pawn double-moves, clear otherwise
  if (isPawn && Math.abs(destination - origin) === 16) {
    game.enPassantTarget = (origin + destination) / 2;
  } else {
    game.enPassantTarget = null;
  }

  // Update half-move clock: reset on pawn move or capture, increment otherwise
  if (isPawn || isCapture) {
    game.halfMoveClock = 0;
  } else {
    game.halfMoveClock += 1;
  }

  return { castlingRookMove, enPassantCaptureIndex };
};

export type TurnEndResult = {
  gameEnd: GameResult | null;
  newTurn: color;
  shouldTriggerAI: boolean;
};

export const checkTurnEnd = (
  game: GlobalChess,
  currentTurn: color,
): TurnEndResult => {
  const newTurn: color = currentTurn === 'white' ? 'black' : 'white';

  // Record position and check draw rules
  const key = positionKey(newTurn);
  const count = (game.positionHistory.get(key) ?? 0) + 1;
  game.positionHistory.set(key, count);

  if (count >= 3) {
    return { gameEnd: 'repetition', newTurn, shouldTriggerAI: false };
  }

  if (game.halfMoveClock >= 100) {
    return { gameEnd: 'fifty-move', newTurn, shouldTriggerAI: false };
  }

  // Check if the next player has any valid moves
  const currentPlayerValids = getAllValidMoves(
    game.board,
    getPiecesOfColor(game.board, newTurn),
    game.enPassantTarget,
  ).flat();

  if (!currentPlayerValids.length) {
    const result = isInCheck(game.board, newTurn) ? 'checkmate' : 'stalemate';
    return { gameEnd: result, newTurn, shouldTriggerAI: false };
  }

  const shouldTriggerAI =
    (newTurn === 'black' && game.blackAI) ||
    (newTurn === 'white' && game.whiteAI);

  return { gameEnd: null, newTurn, shouldTriggerAI };
};

export type PawnConversionAction =
  | 'convert_ai'
  | 'convert_human'
  | 'switch_turn';

export const shouldConvertPawn = (
  game: GlobalChess,
  turn: color,
  pos: number,
): PawnConversionAction => {
  const piece = pieceOnIndex({ board: game.board, pieceIndex: pos });
  if (piece.toLowerCase() !== 'p') return 'switch_turn';

  if (turn === 'white' && pos < 8) {
    return game.whiteAI ? 'convert_ai' : 'convert_human';
  }
  if (turn === 'black' && pos > 55) {
    return game.blackAI ? 'convert_ai' : 'convert_human';
  }
  return 'switch_turn';
};

// --- DOM helpers ---

const renderPieceMove = (origin: number, destination: number): void => {
  const destinationElement = document.getElementById(
    `${destination}`,
  ) as HTMLElement;
  destinationElement.innerHTML = '';
  destinationElement.appendChild(
    (document.getElementById(`${origin}`) as HTMLElement).querySelector(
      'a',
    ) as HTMLAnchorElement,
  );
};

// --- DOM wrappers ---

export const switchTurn = (): void => {
  const result = checkTurnEnd(window.game, window.turn);

  // Hide the turn for the one that just moved
  $(`.${window.turn}`).addClass('notYourTurn');
  $(`#${window.turn}Turn2`).addClass('hidden');

  // Apply new turn
  window.turn = result.newTurn;

  // Show the turn for the one to move next
  $(`.${window.turn}`).removeClass('notYourTurn');
  $(`#${window.turn}Turn2`).removeClass('hidden');

  if (result.gameEnd) {
    endGame(result.gameEnd);
    return;
  }

  if (result.shouldTriggerAI) {
    setTimeout(() => {
      makeAIMove();
    }, 10);
  }
};

const pawnConversion = (pawnPosition: number): void => {
  const action = shouldConvertPawn(window.game, window.turn, pawnPosition);

  if (action === 'convert_ai' || action === 'convert_human') {
    window.game.pawn.pawnToConvert = pawnPosition;
  }

  switch (action) {
    case 'convert_ai':
      convertPawn();
      break;
    case 'convert_human':
      $('#conversion').removeClass('hidden');
      break;
    case 'switch_turn':
      switchTurn();
      break;
    default:
      break;
  }
};

export const makeMove = (
  origin: number,
  destination: number,
  AIMove: boolean,
): void => {
  if (origin >= 0 && destination >= 0) {
    $(`#${origin}`).children('a').attr('style', 'position: relative;');

    if (
      AIMove ||
      (
        document.getElementById(`${destination}`) as HTMLElement
      ).classList.contains('valid')
    ) {
      const { enPassantCaptureIndex, castlingRookMove } = applyMove(
        window.game,
        origin,
        destination,
      );

      // Remove captured pawn's DOM element for en passant
      if (enPassantCaptureIndex !== null) {
        (
          document.getElementById(`${enPassantCaptureIndex}`) as HTMLElement
        ).innerHTML = '';
      }

      // Render main piece move
      renderPieceMove(origin, destination);

      // Render castling rook move
      if (castlingRookMove) {
        renderPieceMove(castlingRookMove[0], castlingRookMove[1]);
      }

      pawnConversion(destination);
    }
  }

  $('.valid').removeClass('valid');
  $('.origin').removeClass('origin');
  window.inHand = '';
};

$(document).ready(initChess);
