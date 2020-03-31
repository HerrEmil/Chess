/* eslint-disable max-lines */
import { boardAfterMove } from './main.js';
import { getPieces } from './util.js';

const getValidPositionsInDirection = ({
  board,
  boardIndex,
  color,
  direction,
  startPosition
}): number[] => {
  const positions = [];

  // eslint-disable-next-line no-constant-condition
  for (let position = startPosition + direction; true; position += direction) {
    const piece = board[position].charCodeAt(0);

    if (piece === 45) {
      positions.push(boardIndex.indexOf(position));
    } else if (
      (piece > 96 && color === 'black') ||
      (piece < 96 && color === 'white')
    ) {
      positions.push(boardIndex.indexOf(position));
      return positions;
    } else {
      return positions;
    }
  }
};

const rookValids = ({ board, boardIndex, index, color }): number[] => {
  const startPosition = boardIndex[index];
  return [
    ...getValidPositionsInDirection({
      board,
      boardIndex,
      color,
      direction: -10,
      startPosition
    }),
    ...getValidPositionsInDirection({
      board,
      boardIndex,
      color,
      direction: 10,
      startPosition
    }),
    ...getValidPositionsInDirection({
      board,
      boardIndex,
      color,
      direction: -1,
      startPosition
    }),
    ...getValidPositionsInDirection({
      board,
      boardIndex,
      color,
      direction: 1,
      startPosition
    })
  ];
};

const bishopValids = ({ board, boardIndex, index, color }): number[] => {
  const startPosition = boardIndex[index];
  return [
    ...getValidPositionsInDirection({
      board,
      boardIndex,
      color,
      direction: -9,
      startPosition
    }),
    ...getValidPositionsInDirection({
      board,
      boardIndex,
      color,
      direction: 9,
      startPosition
    }),
    ...getValidPositionsInDirection({
      board,
      boardIndex,
      color,
      direction: -11,
      startPosition
    }),
    ...getValidPositionsInDirection({
      board,
      boardIndex,
      color,
      direction: 11,
      startPosition
    })
  ];
};

const colorCanStepOnPiece = (color, piece): boolean =>
  piece !== 42 &&
  (piece === 45 ||
    (piece > 96 && color === 'black') ||
    (piece < 96 && color === 'white'));

const knightValids = ({ board, boardIndex, index, color }): number[] => {
  const startPosition = boardIndex[index];
  return [
    startPosition - 8,
    startPosition - 12,
    startPosition - 19,
    startPosition - 21,
    startPosition + 8,
    startPosition + 12,
    startPosition + 19,
    startPosition + 21
  ]
    .filter(position =>
      colorCanStepOnPiece(color, board[position].charCodeAt(0))
    )
    .map(position => boardIndex.indexOf(position));
};

const kingValids = ({ board, boardIndex, index, color }): number[] => {
  const startPosition = boardIndex[index];
  return [
    startPosition - 1,
    startPosition - 9,
    startPosition - 10,
    startPosition - 11,
    startPosition + 1,
    startPosition + 9,
    startPosition + 10,
    startPosition + 11
  ]
    .filter(position =>
      colorCanStepOnPiece(color, board[position].charCodeAt(0))
    )
    .map(position => boardIndex.indexOf(position));
};

const pawnValids = ({ board, boardIndex, index, color }): number[] => {
  const pos = boardIndex[index];
  const valids = [];
  const forward = color === 'black' ? pos + 10 : pos - 10;
  if (board[forward].charCodeAt(0) === 45) {
    valids.push(boardIndex.indexOf(forward));
    const doubleForward = color === 'black' ? pos + 20 : pos - 20;
    if (
      (color === 'black' ? pos < 39 && pos > 30 : pos < 89 && pos > 80) &&
      board[doubleForward].charCodeAt(0) === 45
    ) {
      valids.push(boardIndex.indexOf(doubleForward));
    }
  }
  return [
    ...valids,
    ...[
      color === 'black' ? pos + 9 : pos - 9,
      color === 'black' ? pos + 11 : pos - 11
    ]
      .filter(position => {
        const piece = board[position].charCodeAt(0);
        return color === 'black'
          ? piece > 96 && piece < 115
          : piece > 64 && piece < 83;
      })
      .map(position => boardIndex.indexOf(position))
  ];
};

const getStandardMoves = ({
  pieceType,
  board,
  boardIndex,
  piecePosition: index,
  pieceColor: color
}): number[] => {
  const boardPayload = {
    board,
    boardIndex,
    color,
    index
  };
  switch (pieceType) {
    case 'r':
      return rookValids(boardPayload);
    case 'n':
      return knightValids(boardPayload);
    case 'b':
      return bishopValids(boardPayload);
    case 'q':
      return [...rookValids(boardPayload), ...bishopValids(boardPayload)];
    case 'k':
      return kingValids(boardPayload);
    case 'p':
      return pawnValids(boardPayload);
    default:
      return [];
  }
};

const getValidNoCheck = (board, piecePosition): number[] => {
  const { boardIndex } = window.game;
  const piece = board[boardIndex[piecePosition]];
  const pieceType = piece.toLowerCase();

  return getStandardMoves({
    board,
    boardIndex,
    pieceColor: pieceType === piece ? 'white' : 'black',
    piecePosition,
    pieceType
  });
};

export const getAllValidMovesNoCheck = (board, pieces): number[][] =>
  pieces.map(piece => getValidNoCheck(board, piece));

export const isInCheck = (board, color): boolean => {
  const opponentMoves = [].concat(
    ...getAllValidMovesNoCheck(
      board,
      getPieces(board, color === 'white' ? 'black' : 'white')
    )
  );
  const friendlyKingPos = window.game.boardIndex.indexOf(
    board.indexOf(color === 'white' ? 'k' : 'K')
  );
  return opponentMoves.includes(friendlyKingPos);
};

// eslint-disable-next-line complexity, max-statements
const getCastlingMoves = ({
  type,
  color,
  valids,
  board,
  boardIndex
}): number[] => {
  const castlingMoves = [];
  if (type === 'k' && color === 'black' && !isInCheck(board, 'black')) {
    if (
      window.game.castle.blackShortCastle &&
      valids.includes(5) &&
      board[boardIndex[6]] === '-' &&
      !isInCheck(boardAfterMove(board.slice(), 4, 5), 'black')
    ) {
      castlingMoves.push(6);
    }
    if (
      window.game.castle.blackLongCastle &&
      valids.includes(3) &&
      board[boardIndex[2]] === '-' &&
      board[boardIndex[1]] === '-' &&
      !isInCheck(boardAfterMove(board.slice(), 4, 3), 'black')
    ) {
      castlingMoves.push(2);
    }
  } else if (type === 'k' && color === 'white' && !isInCheck(board, 'white')) {
    if (
      window.game.castle.whiteShortCastle &&
      valids.includes(61) &&
      board[boardIndex[62]] === '-' &&
      !isInCheck(boardAfterMove(board.slice(), 60, 61), 'white')
    ) {
      castlingMoves.push(62);
    }
    if (
      window.game.castle.whiteLongCastle &&
      valids.includes(59) &&
      board[boardIndex[58]] === '-' &&
      board[boardIndex[57]] === '-' &&
      !isInCheck(boardAfterMove(board.slice(), 60, 59), 'white')
    ) {
      castlingMoves.push(58);
    }
  }
  return castlingMoves;
};

export const getValid = (piecePosition: number, board): number[] => {
  const { boardIndex } = window.game;
  const piece = board[boardIndex[piecePosition]];
  const type = piece.toLowerCase();
  const color = type === piece ? 'white' : 'black';
  const standardMoves = getStandardMoves({
    board,
    boardIndex,
    pieceColor: color,
    piecePosition,
    pieceType: type
  });
  const castlingMoves = getCastlingMoves({
    board,
    boardIndex,
    color,
    type,
    valids: standardMoves
  });

  return [...standardMoves, ...castlingMoves].filter(
    move =>
      !isInCheck(boardAfterMove(board.slice(), piecePosition, move), color)
  );
};
