/* 
This file contains various utility functions

CharCodeAt(0):
BLACKS:
A = 65
R = 82

WHITES:
a = 97
r = 114

EMPTY
- = 45

PADDING:
* = 42


*/
function colToInt(char) {
	'use strict';
	var charInt = -1;
	switch (char) {
	case 'A':
		charInt = 0;
		break;
	case 'B':
		charInt = 1;
		break;
	case 'C':
		charInt = 2;
		break;
	case 'D':
		charInt = 3;
		break;
	case 'E':
		charInt = 4;
		break;
	case 'F':
		charInt = 5;
		break;
	case 'G':
		charInt = 6;
		break;
	case 'H':
		charInt = 7;
		break;
	default:
		break;
	}
	return charInt;
}
function intToCol(charInt) {
	'use strict';
	var intChar = '';
	switch (charInt) {
	case 0:
		intChar = 'A';
		break;
	case 1:
		intChar = 'B';
		break;
	case 2:
		intChar = 'C';
		break;
	case 3:
		intChar = 'D';
		break;
	case 4:
		intChar = 'E';
		break;
	case 5:
		intChar = 'F';
		break;
	case 6:
		intChar = 'G';
		break;
	case 7:
		intChar = 'H';
		break;
	default:
		break;
	}
	return intChar;
}
function getPosArray(id) {
	'use strict';
	var posArray = [];
	posArray[0] = colToInt(id.charAt(0));
	posArray[1] = parseInt(id.charAt(1), 10) - 1;
	return posArray;
}

function validateBoard(someBoard) {
	'use strict';
	if (someBoard.length !== 120) {
		console.log("Board is the wrong length");
		return;
	} else if ($.grep(board, function (c) {return c === '-'; }).length < 32) {
		console.log("Too few empty spaces on the board");
		return;
	} else {
		console.log("Board seems to be fine");
	}
	return;
}

function logBoard(aboard) {
	'use strict';
	var theBoard,
		line,
		i,
		counter = 0,
		j;
	if (typeof aboard === 'undefined') {
		theBoard = game.board.slice();
		console.log(turn + ' to move on this board:');
	} else {
		theBoard = aboard;
	}
	i = 0;
	for (i; i < 12; i += 1) {
		line = '';
		j = 0;
		for (j; j < 10; j += 1) {
			line = line + theBoard[counter] + ' ';
			counter += 1;
		}
		console.log(line);
	}
}



// Function that returns an array with all pieces on a board of a certain color
function getPieces(aBoard, color) {
	'use strict';
	// Create variables first to remind myself that they are always on top of scope
	var bIndex, piecesArray, numberOfPiecesAdded, i;
	// Copy the board index to avoid calling global in the loop
	bIndex = game.boardIndex;
	// Create an array to put the pieces in
	piecesArray = [];
	// Keep track of how many piece positions have been added to the array
	numberOfPiecesAdded = 0;
	// Too make the loop less demanding, first sort on color
	switch (color) {
	case 'white':
		// Iterate through all squares of the board
		for (i = 0; i < 64; i += 1) {
			// If the square is in the char range that contains the white pieces
			if (97 <= aBoard[bIndex[i]].charCodeAt(0) && aBoard[bIndex[i]].charCodeAt(0) <= 114) {
				// add the position to the array of pieces
				piecesArray[numberOfPiecesAdded] = i;
				// And increment the pieces added counter
				numberOfPiecesAdded += 1;
			}
		}
		break;
	case 'black':
		// Iterate through all squares of the board
		for (i = 0; i < 64; i += 1) {
			// If the square is in the char range that contains the black pieces
			if (65 <= aBoard[bIndex[i]].charCodeAt(0) && aBoard[bIndex[i]].charCodeAt(0) <= 82) {
				// add the position to the array of pieces
				piecesArray[numberOfPiecesAdded] = i;
				// And increment the pieces added counter
				numberOfPiecesAdded += 1;
			}
		}
		break;
	default:
		alert('You called getPieces with an invalid color!');
		break;
	}
	return piecesArray;
}


// Takes a board and an array of piece positions
function getAllValidMoves(notGlobalBoard, pieces) {
	'use strict';
	// Create an array with all pieces of one color, and a counter for the loop
	var allValidMoves = [], i;
	// Iterate through all pieces and get their valid moves
	for (i = 0; i < pieces.length; i += 1) {
		// Replace all the pieces with an array of their valid moves
		allValidMoves[i] = getValid(pieces[i], notGlobalBoard);
	}
	return allValidMoves;
}