import { AI } from './ai.js';
import { buildBoard, setBoard, bindEvents, setLabels } from './board.js';
import { isInCheck } from './moveGen.js';
import { convertPawn, endGame, startGame } from './panels.js';
import { getAllValidMoves, getPieces } from './util.js';

$(document).ready(() => {
  initChess();
});

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

function initChess() {
  //Initialization function.
  inHand = '';
  mousePos = '';
  buildBoard();
  setBoard();
  bindEvents();
  setLabels();

  //Init the turn counter on black and switch turn to white
  turn = 'black';
  // Makes no text selectable.
  document.onselectstart = () => false;
}

// Move function that interacts with the main board and updates DOM
export function makeMove(origin, destination, IAmAI) {
  const destID =
    typeof destination === 'number'
      ? destination
      : parseInt(destination.attr('id'), 10);

  if (origin >= 0 && destID >= 0) {
    const wlc = game.castle.whiteLongCastle;
    const wsc = game.castle.whiteShortCastle;
    const blc = game.castle.blackLongCastle;
    const bsc = game.castle.blackShortCastle;

    // The AI does not mark cells with the 'valid' class, but we trust it to only make valid moves *knocks on wood*
    // Notice how the variable is a palindrome, palindromes are cool.
    const isValid = IAmAI
      ? 1
      : $.inArray(
          'valid',
          $(`#${destID}`)
            .attr('class')
            .split(' ')
        );

    const piece = $(`#${origin}`).children('a');
    if (isValid > -1) {
      //Do something here to move the captured piece, if any, to the tray. See the old makeMove for inspiration, or do it properly.
      $(`#${destID}`).html(piece.attr('style', 'position: relative;'));
      game.board = boardAfterMove(game.board, origin, destID).slice();

      /*===================================================
			Castling related shizz
			===================================================*/
      //Check if it's a move that disallows future castling
      if ((wlc || wsc) && origin === 60) {
        //White king moving
        game.castle.whiteLongCastle = false;
        game.castle.whiteShortCastle = false;
      } else if ((blc || bsc) && origin === 4) {
        //Black king moving
        game.castle.blackLongCastle = false;
        game.castle.blackShortCastle = false;
      }
      //White short rook
      if (wsc && (origin === 63 || destID === 63)) {
        game.castle.whiteShortCastle = false;
      }
      //White long rook
      if (wlc && (origin === 56 || destID === 56)) {
        game.castle.whiteLongCastle = false;
      }
      //Black short rook
      if (bsc && (origin === 7 || destID === 7)) {
        game.castle.blackShortCastle = false;
      }
      //Black long rook
      if (blc && (origin === 0 || destID === 0)) {
        game.castle.blackLongCastle = false;
      }

      //Check to see if the actual castling move is being made
      if ((wlc || wsc) && origin === 60) {
        if (wlc && destID === 58) {
          game.board = boardAfterMove(game.board, 56, 59).slice();
          const theRook = $('#56').children('a');
          $('#59').html(theRook);
        }
        if (wsc && destID === 62) {
          game.board = boardAfterMove(game.board, 63, 61).slice();
          const theRook = $('#63').children('a');
          $('#61').html(theRook);
        }
      }
      if ((blc || bsc) && origin === 4) {
        if (blc && destID === 2) {
          game.board = boardAfterMove(game.board, 0, 3).slice();
          const theRook = $('#0').children('a');
          $('#3').html(theRook);
        }
        if (bsc && destID === 6) {
          game.board = boardAfterMove(game.board, 7, 5).slice();
          const theRook = $('#7').children('a');
          $('#5').html(theRook);
        }
      }

      /*===================================================
			En passant related shizz
			===================================================*/
      //The moveGenerator needs to mark the attack cell as valid, while
      // this function needs to remove the killed pawn from play - both
      // in internal representation and in the visual (the a).

      //For the internal representation, kindaMakeMove should probably
      // handle it, so the AI can do the move as well.
      //Same goes for the pawn conversion aswell I guess.

      /*===================================================
			Pawn Conversion related shizz
			===================================================*/
      if (game.board[game.boardIndex[destID]].toLowerCase() === 'p') {
        if (turn === 'white' && destID < 8 && destID >= 0) {
          //if it's white making a pawn move, check if the destination is on the top row
          game.pawn.pawnToConvert = destID;
          if (game.whiteAI) {
            convertPawn();
          } else {
            $('#conversion').removeClass('hidden');
          }
        } else if (turn === 'black' && destID > 55 && destID < 64) {
          game.pawn.pawnToConvert = destID;
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
      //Finally switch the turn
      //Note that this switch happens before anyone humanly possible can select which piece they wish to convert a pawn to.
      //However, the AI is not human, so that may or may happen beforehand.
    } else {
      piece.attr('style', 'position: relative;');
    }
  }
  $('.valid').removeClass('valid');
  $('.origin').removeClass('origin');
  inHand = '';
}

export function switchTurn() {
  //Hide the turn for the one that just moved
  $(`.${turn}`).addClass('notYourTurn');
  $(`#${turn}Turn2`).addClass('hidden');

  //Switch the turn
  turn = turn === 'white' ? 'black' : 'white';

  //Show the turn for the one to move next
  $(`.${turn}`).removeClass('notYourTurn');
  $(`#${turn}Turn2`).removeClass('hidden');

  // After every turn switch, check if the game has ended
  // First grab all pieces
  const currentPlayerPieces = getPieces(game.board, turn);
  // Get all valid moves
  const currentPlayerValids = getAllValidMoves(game.board, currentPlayerPieces);
  // Flatten 2D array
  const currentPlayerValidsFlat = [].concat(...currentPlayerValids);
  // If none of those pieces can move...
  if (!currentPlayerValidsFlat.length) {
    // Check if the game ended because of stalemate or checkmate
    if (isInCheck(game.board, turn)) {
      // Checkmate!
      endGame(true);
    } else {
      // Stalemate!
      endGame(false);
    }
  } else if (turn === 'black' && game.blackAI) {
    setTimeout(() => {
      AI.makeMove(3);
    }, 10);
  } else if (turn === 'white' && game.whiteAI) {
    setTimeout(() => {
      AI.makeMove(3);
    }, 10);
  }
}

// Takes board state and move, applies move to board state, returns resulting board
// Does not check validity of move, so use with care.
export const boardAfterMove = (board, moveStart, moveGoal) => {
  // The move we get are indexes of a regular board (0-63), but our boards
  // are in mailbox format, so we need the mailbox index to update the board.
  const mailboxIndex = game.boardIndex.slice();

  // Copy piece from start to goal and clear start
  board[mailboxIndex[moveGoal]] = board[mailboxIndex[moveStart]];
  board[mailboxIndex[moveStart]] = '-';

  return board;
};
