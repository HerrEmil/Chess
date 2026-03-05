import { AI, color, makeAIMove } from './ai.js';
import {
  bindEvents,
  buildBoard,
  setBoardFromState,
  setBoard,
  setLabels,
} from './board.js';
import { convertPawn, endGame, startGame } from './panels.js';
import { getAllValidMoves, getPiecesOfColor } from './util.js';
import { isInCheck } from './moveGen.js';

export type GameResult =
  | 'checkmate'
  | 'stalemate'
  | 'fifty-move'
  | 'repetition';

export type CastleState = {
  blackLongCastle: boolean;
  blackShortCastle: boolean;
  whiteLongCastle: boolean;
  whiteShortCastle: boolean;
};

export type GlobalChess = {
  castle: CastleState;
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

// Reverse lookup: mailbox position → board index (0-63). O(1) vs indexOf O(64).
export const reverseMailbox: readonly number[] = (() => {
  const rev = new Array<number>(99).fill(-1);
  for (let i = 0; i < 64; i += 1) rev[mailboxIndex[i]] = i;
  return rev;
})();

export const positionKey = (
  board: readonly string[],
  turn: color,
  castle: CastleState,
  enPassantTarget: number | null,
): string => {
  const squares = mailboxIndex.map((i) => board[i]).join('');
  const c =
    (castle.whiteShortCastle ? 'K' : '') +
      (castle.whiteLongCastle ? 'Q' : '') +
      (castle.blackShortCastle ? 'k' : '') +
      (castle.blackLongCastle ? 'q' : '') || '-';
  const ep = enPassantTarget === null ? '-' : String(enPassantTarget);
  return `${squares} ${turn} ${c} ${ep}`;
};

export const pieceOnIndex = ({
  board,
  pieceIndex,
}: {
  readonly board: readonly string[];
  readonly pieceIndex: number;
}): string => board[mailboxIndex[pieceIndex]];

const setTurnVisible = (side: color, visible: boolean): void => {
  document
    .getElementById(`${side}Turn2`)!
    .classList.toggle('invisible', !visible);
  document
    .getElementById(`${side}Turn2Landscape`)
    ?.classList.toggle('invisible', !visible);
};

type GameSnapshot = {
  board: string[];
  capturedPieces: { black: string[]; white: string[] };
  castle: CastleState;
  enPassantTarget: number | null;
  halfMoveClock: number;
  lastMove: { from: number; to: number } | null;
  positionHistory: Map<string, number>;
  turn: color;
};

export const moveHistory: GameSnapshot[] = [];

export const appState = {
  capturedPieces: { black: [] as string[], white: [] as string[] },
  // prettier-ignore
  game: {
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
  } as Partial<GlobalChess> as GlobalChess,
  inHand: '' as number | string,
  lastMove: null as { from: number; to: number } | null,
  turn: '' as color,
};

window.startGame = startGame;
window.convertPawn = convertPawn;

const STORAGE_KEY = 'chessGame';

export const saveGame = (): void => {
  const data = {
    blackAI: appState.game.blackAI,
    blackPly: AI.blackPly,
    board: appState.game.board,
    capturedPieces: appState.capturedPieces,
    castle: appState.game.castle,
    enPassantTarget: appState.game.enPassantTarget,
    halfMoveClock: appState.game.halfMoveClock,
    positionHistory: [...appState.game.positionHistory],
    turn: appState.turn,
    whiteAI: appState.game.whiteAI,
    whitePly: AI.whitePly,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const restoreGame = (): boolean => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw) as {
      board: string[];
      capturedPieces?: { black: string[]; white: string[] };
      castle: CastleState;
      enPassantTarget: number | null;
      halfMoveClock: number;
      positionHistory: [string, number][];
      blackAI: boolean;
      whiteAI: boolean;
      turn: color;
      whitePly: number;
      blackPly: number;
    };
    appState.game.board = data.board;
    appState.game.castle = data.castle;
    appState.game.enPassantTarget = data.enPassantTarget;
    appState.game.halfMoveClock = data.halfMoveClock;
    appState.game.positionHistory = new Map(data.positionHistory);
    appState.game.blackAI = data.blackAI;
    appState.game.whiteAI = data.whiteAI;
    if (data.capturedPieces) {
      appState.capturedPieces = data.capturedPieces;
    }
    appState.turn = data.turn;
    AI.whitePly = data.whitePly;
    AI.blackPly = data.blackPly;
    return true;
  } catch {
    return false;
  }
};

export const clearSavedGame = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

const restartGame = (): void => {
  clearSavedGame();
  window.location.reload();
};
window.restartGame = restartGame;

const capturedPieceHtml: Record<string, string> = {
  B: '\u265D',
  K: '\u265A',
  N: '\u265E',
  P: '\u265F',
  Q: '\u265B',
  R: '\u265C',
  b: '\u265D',
  k: '\u265A',
  n: '\u265E',
  p: '\u265F',
  q: '\u265B',
  r: '\u265C',
};

const pieceOrder = 'qrbnp';

export const renderCapturedPieces = (): void => {
  for (const side of ['black', 'white'] as const) {
    const el = document.getElementById(`captured-${side}`);
    if (el) {
      const sorted = [...appState.capturedPieces[side]].sort(
        (a, b) =>
          pieceOrder.indexOf(a.toLowerCase()) -
          pieceOrder.indexOf(b.toLowerCase()),
      );
      el.textContent = sorted.map((p) => capturedPieceHtml[p] ?? '').join(' ');
    }
  }
};

const pushSnapshot = (): void => {
  moveHistory.push({
    board: [...appState.game.board],
    capturedPieces: {
      black: [...appState.capturedPieces.black],
      white: [...appState.capturedPieces.white],
    },
    castle: { ...appState.game.castle },
    enPassantTarget: appState.game.enPassantTarget,
    halfMoveClock: appState.game.halfMoveClock,
    lastMove: appState.lastMove ? { ...appState.lastMove } : null,
    positionHistory: new Map(appState.game.positionHistory),
    turn: appState.turn,
  });
};

const restoreSnapshot = (snap: GameSnapshot): void => {
  appState.game.board = snap.board;
  appState.game.castle = snap.castle;
  appState.game.enPassantTarget = snap.enPassantTarget;
  appState.game.halfMoveClock = snap.halfMoveClock;
  appState.game.positionHistory = snap.positionHistory;
  appState.capturedPieces = snap.capturedPieces;
  appState.lastMove = snap.lastMove;
  appState.turn = snap.turn;
};

const undoMove = (): void => {
  if (moveHistory.length === 0) return;

  // If playing vs AI, undo 2 moves (AI + player) to get back to player's turn
  const isVsAI =
    (appState.turn === 'white' && appState.game.blackAI) ||
    (appState.turn === 'black' && appState.game.whiteAI);
  const steps = isVsAI && moveHistory.length >= 2 ? 2 : 1;

  for (let i = 0; i < steps; i += 1) {
    const snap = moveHistory.pop();
    if (snap) restoreSnapshot(snap);
  }

  // Re-render the board
  setBoardFromState(appState.game.board);
  renderCapturedPieces();

  // Update last move highlights
  document
    .querySelectorAll('.lastMove')
    .forEach((el) => el.classList.remove('lastMove'));
  if (appState.lastMove) {
    document
      .getElementById(`${appState.lastMove.from}`)
      ?.classList.add('lastMove');
    document
      .getElementById(`${appState.lastMove.to}`)
      ?.classList.add('lastMove');
  }

  // Update turn indicators
  const opponent: color = appState.turn === 'white' ? 'black' : 'white';
  document
    .querySelectorAll(`.${opponent}`)
    .forEach((el) => el.classList.add('notYourTurn'));
  setTurnVisible(opponent, false);
  document
    .querySelectorAll(`.${appState.turn}`)
    .forEach((el) => el.classList.remove('notYourTurn'));
  setTurnVisible(appState.turn, true);

  saveGame();
};
window.undoMove = undoMove;

const initChess = (): void => {
  buildBoard();
  bindEvents();
  setLabels();

  if (restoreGame()) {
    setBoardFromState(appState.game.board);
    renderCapturedPieces();
    // Hide start menu, show game buttons
    document.getElementById('background')!.classList.add('hidden');
    document.getElementById('restartBtn')!.classList.remove('hidden');
    document.getElementById('undoBtn')!.classList.remove('hidden');
    // Set turn indicators
    const opponent: color = appState.turn === 'white' ? 'black' : 'white';
    document
      .querySelectorAll(`.${opponent}`)
      .forEach((el) => el.classList.add('notYourTurn'));
    setTurnVisible(opponent, false);
    document
      .querySelectorAll(`.${appState.turn}`)
      .forEach((el) => el.classList.remove('notYourTurn'));
    setTurnVisible(appState.turn, true);
    // If it's AI's turn, trigger AI move
    if (
      (appState.turn === 'black' && appState.game.blackAI) ||
      (appState.turn === 'white' && appState.game.whiteAI)
    ) {
      setTimeout(() => {
        makeAIMove(
          appState.game.board,
          appState.turn,
          appState.game.enPassantTarget,
          appState.game.castle,
          appState.game.positionHistory,
        );
      }, 10);
    }
  } else {
    setBoard();
    appState.turn = 'black';
  }

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
  board: string[];
  capturedPiece: string | null;
  castle: CastleState;
  castlingRookMove: [number, number] | null;
  enPassantCaptureIndex: number | null;
  enPassantTarget: number | null;
  halfMoveClock: number;
};

const computeCastlingRookMove = (
  castle: CastleState,
  origin: number,
  destination: number,
): [number, number] | null => {
  if (origin === 60) {
    if (castle.whiteLongCastle && destination === 58) return [56, 59];
    if (castle.whiteShortCastle && destination === 62) return [63, 61];
  }
  if (origin === 4) {
    if (castle.blackLongCastle && destination === 2) return [0, 3];
    if (castle.blackShortCastle && destination === 6) return [7, 5];
  }
  return null;
};

export const computeCastleState = (
  castle: CastleState,
  moveOrigin: number,
  moveDestination: number,
): CastleState => {
  const updated = { ...castle };

  // King or rook moved
  switch (moveOrigin) {
    case 60:
      updated.whiteLongCastle = false;
      updated.whiteShortCastle = false;
      break;
    case 4:
      updated.blackLongCastle = false;
      updated.blackShortCastle = false;
      break;
    case 63:
      updated.whiteShortCastle = false;
      break;
    case 56:
      updated.whiteLongCastle = false;
      break;
    case 7:
      updated.blackShortCastle = false;
      break;
    case 0:
      updated.blackLongCastle = false;
      break;
    default:
      break;
  }

  // Rook captured
  switch (moveDestination) {
    case 63:
      updated.whiteShortCastle = false;
      break;
    case 56:
      updated.whiteLongCastle = false;
      break;
    case 7:
      updated.blackShortCastle = false;
      break;
    case 0:
      updated.blackLongCastle = false;
      break;
    default:
      break;
  }

  return updated;
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

  // Record captured piece character
  const capturedPiece = isEnPassant
    ? pieceOnIndex({ board: game.board, pieceIndex: enPassantCaptureIndex! })
    : destPiece === '-'
      ? null
      : destPiece;

  // Compute castling rook move before updating castling state
  const castlingRookMove = computeCastlingRookMove(
    game.castle,
    origin,
    destination,
  );

  // Apply main piece move to board
  let board = boardAfterMove(
    game.board,
    origin,
    destination,
    game.enPassantTarget,
  ) as string[];

  // Apply castling rook move to board
  if (castlingRookMove) {
    board = boardAfterMove(
      board,
      castlingRookMove[0],
      castlingRookMove[1],
    ) as string[];
  }

  const castle = computeCastleState(game.castle, origin, destination);

  // Update en passant target: set when pawn double-moves, clear otherwise
  const enPassantTarget =
    isPawn && Math.abs(destination - origin) === 16
      ? (origin + destination) / 2
      : null;

  // Update half-move clock: reset on pawn move or capture, increment otherwise
  const halfMoveClock = isPawn || isCapture ? 0 : game.halfMoveClock + 1;

  return {
    board,
    capturedPiece,
    castle,
    castlingRookMove,
    enPassantCaptureIndex,
    enPassantTarget,
    halfMoveClock,
  };
};

export type TurnEndResult = {
  gameEnd: GameResult | null;
  newTurn: color;
  positionEntry: { key: string; count: number };
  shouldTriggerAI: boolean;
};

export const checkTurnEnd = (
  game: GlobalChess,
  currentTurn: color,
): TurnEndResult => {
  const newTurn: color = currentTurn === 'white' ? 'black' : 'white';

  // Compute position key and count (without mutating positionHistory)
  const key = positionKey(
    game.board,
    newTurn,
    game.castle,
    game.enPassantTarget,
  );
  const count = (game.positionHistory.get(key) ?? 0) + 1;
  const positionEntry = { count, key };

  if (count >= 3) {
    return {
      gameEnd: 'repetition',
      newTurn,
      positionEntry,
      shouldTriggerAI: false,
    };
  }

  if (game.halfMoveClock >= 100) {
    return {
      gameEnd: 'fifty-move',
      newTurn,
      positionEntry,
      shouldTriggerAI: false,
    };
  }

  // Check if the next player has any valid moves
  const currentPlayerValids = getAllValidMoves(
    game.board,
    getPiecesOfColor(game.board, newTurn),
    game.enPassantTarget,
    game.castle,
  ).flat();

  if (!currentPlayerValids.length) {
    const result = isInCheck(game.board, newTurn) ? 'checkmate' : 'stalemate';
    return { gameEnd: result, newTurn, positionEntry, shouldTriggerAI: false };
  }

  const shouldTriggerAI =
    (newTurn === 'black' && game.blackAI) ||
    (newTurn === 'white' && game.whiteAI);

  return { gameEnd: null, newTurn, positionEntry, shouldTriggerAI };
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
  const result = checkTurnEnd(appState.game, appState.turn);
  appState.game.positionHistory.set(
    result.positionEntry.key,
    result.positionEntry.count,
  );

  // Hide the turn for the one that just moved
  document
    .querySelectorAll(`.${appState.turn}`)
    .forEach((el) => el.classList.add('notYourTurn'));
  setTurnVisible(appState.turn, false);

  // Apply new turn
  appState.turn = result.newTurn;

  // Show the turn for the one to move next
  document
    .querySelectorAll(`.${appState.turn}`)
    .forEach((el) => el.classList.remove('notYourTurn'));
  setTurnVisible(appState.turn, true);

  if (result.gameEnd) {
    endGame(result.gameEnd);
    return;
  }

  saveGame();

  if (result.shouldTriggerAI) {
    setTimeout(() => {
      makeAIMove(
        appState.game.board,
        appState.turn,
        appState.game.enPassantTarget,
        appState.game.castle,
        appState.game.positionHistory,
      );
    }, 10);
  }
};

const pawnConversion = (pawnPosition: number): void => {
  const action = shouldConvertPawn(appState.game, appState.turn, pawnPosition);

  if (action === 'convert_ai' || action === 'convert_human') {
    appState.game.pawn.pawnToConvert = pawnPosition;
  }

  switch (action) {
    case 'convert_ai':
      convertPawn();
      break;
    case 'convert_human':
      document.getElementById('conversion')!.classList.remove('hidden');
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
    if (appState.lastMove) {
      document
        .getElementById(`${appState.lastMove.from}`)
        ?.classList.remove('lastMove');
      document
        .getElementById(`${appState.lastMove.to}`)
        ?.classList.remove('lastMove');
      appState.lastMove = null;
    }

    document
      .getElementById(`${origin}`)!
      .querySelector('a')!
      .setAttribute('style', 'position: relative;');

    if (
      AIMove ||
      (
        document.getElementById(`${destination}`) as HTMLElement
      ).classList.contains('valid')
    ) {
      pushSnapshot();
      const result = applyMove(appState.game, origin, destination);
      appState.game.board = result.board;
      appState.game.castle = result.castle;
      appState.game.enPassantTarget = result.enPassantTarget;
      appState.game.halfMoveClock = result.halfMoveClock;

      if (result.capturedPiece) {
        // Uppercase = black piece, lowercase = white piece
        const capturedColor =
          result.capturedPiece === result.capturedPiece.toUpperCase()
            ? 'black'
            : 'white';
        appState.capturedPieces[capturedColor].push(result.capturedPiece);
        renderCapturedPieces();
      }

      const { enPassantCaptureIndex, castlingRookMove } = result;

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

      if (AIMove) {
        appState.lastMove = { from: origin, to: destination };
        document.getElementById(`${origin}`)?.classList.add('lastMove');
        document.getElementById(`${destination}`)?.classList.add('lastMove');
      }
    }
  }

  document
    .querySelectorAll('.valid')
    .forEach((el) => el.classList.remove('valid'));
  document
    .querySelectorAll('.origin')
    .forEach((el) => el.classList.remove('origin'));
  appState.inHand = '';
};

document.addEventListener('DOMContentLoaded', initChess);
