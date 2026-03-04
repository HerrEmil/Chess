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

export const positionKey = (): string => {
  const { board, castle, enPassantTarget } = window.game;
  const squares = mailboxIndex.map((i) => board[i]).join('');
  const c =
    (castle.whiteShortCastle ? 'K' : '') +
      (castle.whiteLongCastle ? 'Q' : '') +
      (castle.blackShortCastle ? 'k' : '') +
      (castle.blackLongCastle ? 'q' : '') || '-';
  const ep = enPassantTarget === null ? '-' : String(enPassantTarget);
  return `${squares} ${window.turn} ${c} ${ep}`;
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

export const switchTurn = (): void => {
  // Hide the turn for the one that just moved
  $(`.${window.turn}`).addClass('notYourTurn');
  $(`#${window.turn}Turn2`).addClass('hidden');

  // Switch the turn
  window.turn = window.turn === 'white' ? 'black' : 'white';

  // Show the turn for the one to move next
  $(`.${window.turn}`).removeClass('notYourTurn');
  $(`#${window.turn}Turn2`).removeClass('hidden');

  // Record position and check draw rules
  const key = positionKey();
  const count = (window.game.positionHistory.get(key) ?? 0) + 1;
  window.game.positionHistory.set(key, count);

  if (count >= 3) {
    endGame('repetition');
    return;
  }

  if (window.game.halfMoveClock >= 100) {
    endGame('fifty-move');
    return;
  }

  // After every turn switch, check if the game has ended
  const currentPlayerValids = getAllValidMoves(
    window.game.board,
    getPiecesOfColor(window.game.board, window.turn),
    window.game.enPassantTarget,
  ).flat();

  // If none of those pieces can move...
  if (!currentPlayerValids.length) {
    endGame(
      isInCheck(window.game.board, window.turn) ? 'checkmate' : 'stalemate',
    );
  } else if (window.turn === 'black' && window.game.blackAI) {
    setTimeout(() => {
      makeAIMove();
    }, 10);
  } else if (window.turn === 'white' && window.game.whiteAI) {
    setTimeout(() => {
      makeAIMove();
    }, 10);
  }
};

const updateCastlingAllowedState = (
  moveOrigin: number,
  moveDestination: number,
): void => {
  // King or rook moved
  switch (moveOrigin) {
    case 60:
      window.game.castle.whiteLongCastle = false;
      window.game.castle.whiteShortCastle = false;
      break;
    case 4:
      window.game.castle.blackLongCastle = false;
      window.game.castle.blackShortCastle = false;
      break;
    case 63:
      window.game.castle.whiteShortCastle = false;
      break;
    case 56:
      window.game.castle.whiteLongCastle = false;
      break;
    case 7:
      window.game.castle.blackShortCastle = false;
      break;
    case 0:
      window.game.castle.blackLongCastle = false;
      break;
    default:
      break;
  }

  // Rook captured
  switch (moveDestination) {
    case 63:
      window.game.castle.whiteShortCastle = false;
      break;
    case 56:
      window.game.castle.whiteLongCastle = false;
      break;
    case 7:
      window.game.castle.blackShortCastle = false;
      break;
    case 0:
      window.game.castle.blackLongCastle = false;
      break;
    default:
      break;
  }
};

const movePiece = (
  moveOrigin: number,
  moveDestination: number,
  enPassantTarget: number | null = null,
): void => {
  window.game.board = boardAfterMove(
    window.game.board,
    moveOrigin,
    moveDestination,
    enPassantTarget,
  ) as string[];
  const destinationElement = document.getElementById(
    `${moveDestination}`,
  ) as HTMLElement;
  destinationElement.innerHTML = '';
  destinationElement.appendChild(
    (document.getElementById(`${moveOrigin}`) as HTMLElement).querySelector(
      'a',
    ) as HTMLAnchorElement,
  );
};

const moveRookIfCastling = (
  moveOrigin: number,
  moveDestination: number,
): void => {
  if (moveOrigin === 60) {
    if (window.game.castle.whiteLongCastle && moveDestination === 58) {
      movePiece(56, 59);
    }
    if (window.game.castle.whiteShortCastle && moveDestination === 62) {
      movePiece(63, 61);
    }
  }
  if (moveOrigin === 4) {
    if (window.game.castle.blackLongCastle && moveDestination === 2) {
      movePiece(0, 3);
    }
    if (window.game.castle.blackShortCastle && moveDestination === 6) {
      movePiece(7, 5);
    }
  }
};

const pawnConversion = (pawnPosition: number): void => {
  if (
    pieceOnIndex({
      board: window.game.board,
      pieceIndex: pawnPosition,
    }).toLowerCase() === 'p'
  ) {
    if (window.turn === 'white' && pawnPosition < 8 && pawnPosition >= 0) {
      window.game.pawn.pawnToConvert = pawnPosition;
      if (window.game.whiteAI) {
        convertPawn();
      } else {
        $('#conversion').removeClass('hidden');
      }
    } else if (
      window.turn === 'black' &&
      pawnPosition > 55 &&
      pawnPosition < 64
    ) {
      window.game.pawn.pawnToConvert = pawnPosition;
      if (window.game.blackAI) {
        convertPawn();
      } else {
        $('#conversion').removeClass('hidden');
      }
    } else {
      switchTurn();
    }
  } else {
    switchTurn();
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
      const piece = pieceOnIndex({
        board: window.game.board,
        pieceIndex: origin,
      });
      const isPawn = piece.toLowerCase() === 'p';

      // Detect en passant capture before moving
      const isEnPassant =
        isPawn &&
        window.game.enPassantTarget !== null &&
        destination === window.game.enPassantTarget &&
        pieceOnIndex({
          board: window.game.board,
          pieceIndex: destination,
        }) === '-';

      // Remove captured pawn's DOM element for en passant
      if (isEnPassant) {
        const capturedPawnIndex = destination + (destination > origin ? -8 : 8);
        (
          document.getElementById(`${capturedPawnIndex}`) as HTMLElement
        ).innerHTML = '';
      }

      // Detect capture before moving the piece
      const isCapture =
        pieceOnIndex({ board: window.game.board, pieceIndex: destination }) !==
          '-' || isEnPassant;

      movePiece(origin, destination, window.game.enPassantTarget);

      moveRookIfCastling(origin, destination);

      updateCastlingAllowedState(origin, destination);

      // Update en passant target: set when pawn double-moves, clear otherwise
      if (isPawn && Math.abs(destination - origin) === 16) {
        window.game.enPassantTarget = (origin + destination) / 2;
      } else {
        window.game.enPassantTarget = null;
      }

      // Update half-move clock: reset on pawn move or capture, increment otherwise
      if (isPawn || isCapture) {
        window.game.halfMoveClock = 0;
      } else {
        window.game.halfMoveClock += 1;
      }

      pawnConversion(destination);
    }
  }

  $('.valid').removeClass('valid');
  $('.origin').removeClass('origin');
  window.inHand = '';
};

$(document).ready(initChess);
