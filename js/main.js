import { bindEvents, buildBoard, setBoard, setLabels } from './board.js';
import { convertPawn, endGame, startGame } from './panels.js';
import { getAllValidMoves, getPieces } from './util.js';
import { AI } from './ai.js';
import { isInCheck } from './moveGen.js';

window.inHand = '';
window.mousePos = '';
window.turn = '';

window.AI = AI;
window.startGame = startGame;

window.game = {};
game.castle = {
  blackLongCastle: true,
  blackShortCastle: true,
  whiteLongCastle: true,
  whiteShortCastle: true
};
game.pawn = { pawnToConvert: -1 };
// prettier-ignore
game.board = [
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
];
// prettier-ignore
game.boardIndex = [
	21, 22, 23, 24, 25, 26, 27, 28,
	31, 32, 33, 34, 35, 36, 37, 38,
	41, 42, 43, 44, 45, 46, 47, 48,
	51, 52, 53, 54, 55, 56, 57, 58,
	61, 62, 63, 64, 65, 66, 67, 68,
	71, 72, 73, 74, 75, 76, 77, 78,
	81, 82, 83, 84, 85, 86, 87, 88,
	91, 92, 93, 94, 95, 96, 97, 98
];

const initChess = () => {
  buildBoard();
  setBoard();
  bindEvents();
  setLabels();

  // Init the turn counter on black and switch turn to white
  turn = 'black';
  // Makes no text selectable.
  document.onselectstart = () => false;
};

/*
 * Takes board state and move, applies move to board state, returns resulting board
 * Does not check validity of move, so use with care.
 */
export const boardAfterMove = (board, moveStart, moveGoal) => {
  /*
   * The move we get are indexes of a regular board (0-63), but our boards
   * are in mailbox format, so we need the mailbox index to update the board.
   */
  const mailboxIndex = game.boardIndex.slice();

  // Copy piece from start to goal and clear start
  board[mailboxIndex[moveGoal]] = board[mailboxIndex[moveStart]];
  board[mailboxIndex[moveStart]] = '-';

  return board;
};

export const switchTurn = () => {
  // Hide the turn for the one that just moved
  $(`.${turn}`).addClass('notYourTurn');
  $(`#${turn}Turn2`).addClass('hidden');

  // Switch the turn
  turn = turn === 'white' ? 'black' : 'white';

  // Show the turn for the one to move next
  $(`.${turn}`).removeClass('notYourTurn');
  $(`#${turn}Turn2`).removeClass('hidden');

  // After every turn switch, check if the game has ended
  const currentPlayerValids = getAllValidMoves(
    game.board,
    getPieces(game.board, turn)
  );

  // If none of those pieces can move...
  if (![].concat(...currentPlayerValids).length) {
    // End the game, with checkmat/stalemate flag
    endGame(isInCheck(game.board, turn));
  } else if (turn === 'black' && game.blackAI) {
    setTimeout(() => {
      AI.makeMove(3);
    }, 10);
  } else if (turn === 'white' && game.whiteAI) {
    setTimeout(() => {
      AI.makeMove(3);
    }, 10);
  }
};

const updateCastlingAllowedState = (moveOrigin, moveDestination) => {
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

const movePiece = (moveOrigin, moveDestination) => {
  game.board = boardAfterMove(game.board, moveOrigin, moveDestination).slice();
  const destinationElement = document.getElementById(`${moveDestination}`);
  destinationElement.innerHTML = '';
  destinationElement.appendChild(
    document.getElementById(`${moveOrigin}`).querySelector('a')
  );
};

const moveRookIfCastling = (moveOrigin, moveDestination) => {
  if (moveOrigin === 60) {
    if (game.castle.whiteLongCastle && moveDestination === 58) {
      movePiece(56, 59);
    }
    if (game.castle.whiteShortCastle && moveDestination === 62) {
      movePiece(63, 61);
    }
  }
  if (moveOrigin === 4) {
    if (game.castle.blackLongCastle && moveDestination === 2) {
      movePiece(0, 3);
    }
    if (game.castle.blackShortCastle && moveDestination === 6) {
      movePiece(7, 5);
    }
  }
};

// eslint-disable-next-line max-statements
const pawnConversion = pawnPosition => {
  if (game.board[game.boardIndex[pawnPosition]].toLowerCase() === 'p') {
    if (turn === 'white' && pawnPosition < 8 && pawnPosition >= 0) {
      game.pawn.pawnToConvert = pawnPosition;
      if (game.whiteAI) {
        convertPawn();
      } else {
        $('#conversion').removeClass('hidden');
      }
    } else if (turn === 'black' && pawnPosition > 55 && pawnPosition < 64) {
      game.pawn.pawnToConvert = pawnPosition;
      if (game.blackAI) {
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

export const makeMove = (origin, destination, AIMove) => {
  if (origin >= 0 && destination >= 0) {
    $(`#${origin}`)
      .children('a')
      .attr('style', 'position: relative;');

    if (
      AIMove ||
      document.getElementById(destination).classList.contains('valid')
    ) {
      movePiece(origin, destination);

      moveRookIfCastling(origin, destination);

      updateCastlingAllowedState(origin, destination);

      pawnConversion(destination);
    }
  }

  $('.valid').removeClass('valid');
  $('.origin').removeClass('origin');
  inHand = '';
};

$(document).ready(() => {
  initChess();
});
