import { getValid } from './moveGen.js';
// This file contains various utility functions

// Takes a column (0-7) and returns column label (A-H)
export const intToCol = charInt => {
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
};

// Function that returns an array with all piece positions on a board of a certain color
export const getPieces = (board, color) => {
  const { boardIndex } = game;
  const pieces = [];

  const charCodeLowerBound = color === 'white' ? 97 : 65;
  const charCodeUpperBound = color === 'white' ? 114 : 82;

  for (let piecePosition = 0; piecePosition < 64; piecePosition += 1) {
    const charCode = board[boardIndex[piecePosition]].charCodeAt(0);
    if (charCodeLowerBound <= charCode && charCode <= charCodeUpperBound) {
      pieces.push(piecePosition);
    }
  }
  return pieces;
};

// Takes a board and an array of piece positions
export const getAllValidMoves = (notGlobalBoard, pieces) =>
  pieces.map(piece => getValid(piece, notGlobalBoard));
