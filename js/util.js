import { getValid } from './moveGen.js';
// This file contains various utility functions

// Takes a column (0-7) and returns column label (A-H)
// Used when drawing the column labels on the edges of the board
export function intToCol(charInt) {
  let intChar = '';
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

// Function that returns an array with all pieces on a board of a certain color
export function getPieces(aBoard, color) {
  // Create variables first to remind myself that they are always on top of scope
  let bIndex;

  let piecesArray;
  let numberOfPiecesAdded;
  let i;
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
        if (
          97 <= aBoard[bIndex[i]].charCodeAt(0) &&
          aBoard[bIndex[i]].charCodeAt(0) <= 114
        ) {
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
        if (
          65 <= aBoard[bIndex[i]].charCodeAt(0) &&
          aBoard[bIndex[i]].charCodeAt(0) <= 82
        ) {
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
export function getAllValidMoves(notGlobalBoard, pieces) {
  // Create an array with all pieces of one color, and a counter for the loop
  const allValidMoves = [];

  let i;
  // Iterate through all pieces and get their valid moves
  for (i = 0; i < pieces.length; i += 1) {
    // Replace all the pieces with an array of their valid moves
    allValidMoves[i] = getValid(pieces[i], notGlobalBoard);
  }
  return allValidMoves;
}
