$(document).ready(function () {
	'use strict';
	console.time('init');
	initChess();
	console.timeEnd('init');
});
var game = {};
game.castle = {
	blackLongCastle : true,
	blackShortCastle : true,
	whiteLongCastle : true,
	whiteShortCastle : true
};
game.pawn = {pawnToConvert : -1};
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
	document.onselectstart = function () { return false; };
}

function makeMove(piece, sender) {
	'use strict';
	//clear the highlighted cells
	if (piece !== '') {
		/*if(sender != ''){
			var senderID = sender.attr('id');
			var senderClasses = ($('#'+senderID).attr('class') + '').split(' ');
			var pieceObject = $('#'+piece).children('a');
			if ($.inArray('valid',senderClasses) >= 0){
				if ($('#'+senderID).html() !== ''){
					//Put the captured piece in the tray.
					var capColor = $($('#'+senderID).html()).attr('class').split(' ');
					var caps = $('#'+capColor[0]+'Controls div.tray').html();
					$('#'+capColor[0]+'Controls div.tray').html(caps + $($('#'+senderID).html()).html());
				}

				//if move is valid, do it, else snap back
				$('#'+senderID).html(pieceObject.attr('style','position: relative;'));
				board = kindaMakeMove(board, inHand,senderID);
				switchTurn();
			} else {
				pieceObject.attr('style','position: relative;');
			}
		}*/
		inHand = '';
	}
	$('.valid').removeClass('valid');
	$('.attack').removeClass('attack');
	$('.origin').removeClass('origin');
}

/*
This function is pretty overkill and needs to be either split up or optimized a bit.
*/
function reallyMakeMove(origin, destination, IAmAI) {
	var destID,
		wlc,
		isValid,
		piece,
		theRook;
	if (typeof destination !== 'number') {
		destID = parseInt(destination.attr('id'), 10);
	} else {
		destID = destination;
	}

	if (origin >= 0 && destID >= 0) {
		wlc = game.castle.whiteLongCastle;
		wsc = game.castle.whiteShortCastle;
		blc = game.castle.blackLongCastle;
		bsc = game.castle.blackShortCastle;
		isValid = $.inArray('valid', ($('#' + destID).attr('class')).split(' '));
		// The AI does not mark cells with the 'valid' class, but we trust it to only make valid moves *knocks on wood*
		// Notice how the variable is a palindrome, palindromes are cool.
		if (IAmAI) {isValid = 1; }
		piece = $('#' + origin).children('a');
		if (isValid > -1) {
			//Do something here to move the captured piece, if any, to the tray. See the old makeMove for inspiration, or do it properly.
			$('#' + destID).html(piece.attr('style', 'position: relative;'));
			game.board = kindaMakeMove(game.board, origin, destID).slice();

			/*===================================================
			Castling related shizz
			===================================================*/
			//Check if it's a move that disallows future castling
			if ((wlc || wsc) && origin === 60) {
				//White king moving
				game.castle.whiteLongCastle = false;
				game.castle.whiteShortCastle = false;
				console.log("disabled wlc");
				console.log("disabled wsc");
			} else if ((blc || bsc) && origin === 4) {
				//Black king moving
				game.castle.blackLongCastle = false;
				game.castle.blackShortCastle = false;
				console.log("disabled blc");
				console.log("disabled bsc");
			}
			//White short rook
			if (wsc && (origin === 63 || destID === 63)) {
				game.castle.whiteShortCastle = false;
				console.log("disabled wsc");
			}
			//White long rook
			if (wlc && (origin === 56 || destID === 56)) {
				game.castle.whiteLongCastle = false;
				console.log("disabled wlc");
			}
			//Black short rook
			if (bsc && (origin === 7 || destID === 7)) {
				game.castle.blackShortCastle = false;
				console.log("disabled bsc");
			}
			//Black long rook
			if (blc && (origin === 0 || destID === 0)) {
				game.castle.blackLongCastle = false;
				console.log("disabled blc");
			}

			//Check to see if the actual castling move is being made
			if ((wlc || wsc) && origin === 60) {
				if (wlc && destID === 58) {
					game.board = kindaMakeMove(game.board, 56, 59).slice();
					theRook = $('#56').children('a');
					$('#59').html(theRook);
				}
				if (wsc && destID === 62) {
					game.board = kindaMakeMove(game.board, 63, 61).slice();
					theRook = $('#63').children('a');
					$('#61').html(theRook);
				}
			}
			if ((blc || bsc) && origin === 4) {
				if (blc && destID === 2) {
					game.board = kindaMakeMove(game.board, 0, 3).slice();
					theRook = $('#0').children('a');
					$('#3').html(theRook);
				}
				if (bsc && destID === 6) {
					game.board = kindaMakeMove(game.board, 7, 5).slice();
					theRook = $('#7').children('a');
					$('#5').html(theRook);
				}
			}

			/*===================================================
			En passant related shizz
			===================================================*/
			//The moveGenerator needs to mark the attack cell as valid, while this function needs to remove the killed pawn from play - both in internal representation and in the visual (the a).
			//For the internal representation, kindaMakeMove should probably handle it, so the AI can do the move aswell.
			//Same goes for the pawn conversion aswell I guess.

			/*===================================================
			Pawn Conversion related shizz
			===================================================*/
			if (game.board[game.boardIndex[destID]].toLowerCase() === 'p') {
				if (turn === 'white' && destID < 8 && destID >= 0) {
					//if it's white making a pawn move, check if the destination is on the top row
					console.log('White is totally about to convert a pawn!');
					game.pawn.pawnToConvert = destID;
					if (game.whiteAI) {
						convertPawn();
					} else {
						$('#conversion').removeClass('hidden');
					}
				} else if (turn === 'black' && destID > 55 && destID < 64) {
					console.log('Black is totally about to convert a pawn!');
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
	//$('.attack').removeClass('attack');
	$('.origin').removeClass('origin');
	inHand = '';
}
function switchTurn() {
	'use strict';
	var currentPlayerPieces,
		currentPlayerValids,
		currentPlayerValidsFlat;
	//Hide the turn for the one that just moved
	$('.' + turn).addClass('notYourTurn');
	$('#' + turn + 'Turn2').addClass('hidden');

	//Switch the turn
	turn = turn === 'white' ? 'black' : 'white';

	//Show the turn for the one to move next
	$('.' + turn).removeClass('notYourTurn');
	$('#' + turn + 'Turn2').removeClass('hidden');

	// After every turn switch, check if the game has ended
	// First grab all pieces
	currentPlayerPieces = getPieces(game.board, turn);
	// Get all valid moves
	currentPlayerValids = getAllValidMoves(game.board, currentPlayerPieces);
	// Flatten 2D array
	currentPlayerValidsFlat = [].concat.apply([], currentPlayerValids);
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
		setTimeout(function () {AI.makeMove(3); }, 100);
	} else if (turn === 'white' && game.whiteAI) {
		setTimeout(function () {AI.makeMove(3); }, 100);
	}
}
function kindaMakeMove(aboard, originIndex, destIndex) {
	'use strict';
	var bIndex = game.boardIndex,
		indexOfOrigin = bIndex[originIndex],
		indexOfDest = bIndex[destIndex],
		newBoard = aboard.slice(),
		oldPiece = aboard[indexOfOrigin];
	newBoard[indexOfDest] = oldPiece;
	newBoard[indexOfOrigin] = '-';
	return newBoard;
}