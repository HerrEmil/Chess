/* eslint-disable max-lines */
import { boardAfterMove, mailboxIndex } from './main.js';
import { color as chessColor } from './ai.js';
import { getPiecesOfColor } from './util.js';

const getValidPositionsInDirection = ({
  board,
  color,
  direction,
  startPosition
}: {
  readonly board: readonly string[];
  readonly color: chessColor;
  readonly direction: number;
  readonly startPosition: number;
}): readonly number[] => {
  const positions = [];

  // eslint-disable-next-line no-constant-condition
  for (let position = startPosition + direction; true; position += direction) {
    const piece = board[position].charCodeAt(0);

    if (piece === 45) {
      positions.push(mailboxIndex.indexOf(position));
    } else if (
      (piece > 96 && color === 'black') ||
      (piece < 96 && color === 'white')
    ) {
      positions.push(mailboxIndex.indexOf(position));
      return positions;
    } else {
      return positions;
    }
  }
};

const rookValids = ({
  board,
  index,
  color
}: {
  readonly board: readonly string[];
  readonly color: chessColor;
  readonly index: number;
}): readonly number[] => {
  const startPosition = mailboxIndex[index];
  return [
    ...getValidPositionsInDirection({
      board,
      color,
      direction: -10,
      startPosition
    }),
    ...getValidPositionsInDirection({
      board,
      color,
      direction: 10,
      startPosition
    }),
    ...getValidPositionsInDirection({
      board,
      color,
      direction: -1,
      startPosition
    }),
    ...getValidPositionsInDirection({
      board,
      color,
      direction: 1,
      startPosition
    })
  ];
};

const bishopValids = ({
  board,
  index,
  color
}: {
  readonly board: readonly string[];
  readonly color: chessColor;
  readonly index: number;
}): readonly number[] => {
  const startPosition = mailboxIndex[index];
  return [
    ...getValidPositionsInDirection({
      board,
      color,
      direction: -9,
      startPosition
    }),
    ...getValidPositionsInDirection({
      board,
      color,
      direction: 9,
      startPosition
    }),
    ...getValidPositionsInDirection({
      board,
      color,
      direction: -11,
      startPosition
    }),
    ...getValidPositionsInDirection({
      board,
      color,
      direction: 11,
      startPosition
    })
  ];
};

const colorCanStepOnPiece = (color: chessColor, piece: number): boolean =>
  piece !== 42 &&
  (piece === 45 ||
    (piece > 96 && color === 'black') ||
    (piece < 96 && color === 'white'));

const knightValids = ({
  board,
  boardIndex,
  index,
  color
}: {
  readonly board: readonly string[];
  readonly boardIndex: readonly number[];
  readonly color: chessColor;
  readonly index: number;
}): readonly number[] => {
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

const kingValids = ({
  board,
  boardIndex,
  index,
  color
}: {
  readonly board: readonly string[];
  readonly boardIndex: readonly number[];
  readonly color: chessColor;
  readonly index: number;
}): readonly number[] => {
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

const pawnValids = ({
  board,
  boardIndex,
  index,
  color
}: {
  readonly board: readonly string[];
  readonly boardIndex: readonly number[];
  readonly color: chessColor;
  readonly index: number;
}): readonly number[] => {
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
}: {
  readonly pieceType: string;
  readonly board: readonly string[];
  readonly boardIndex: readonly number[];
  readonly piecePosition: number;
  readonly pieceColor: chessColor;
}): readonly number[] => {
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

const getValidNoCheck = (
  board: readonly string[],
  piecePosition: number
): readonly number[] => {
  const piece = board[mailboxIndex[piecePosition]];
  const pieceType = piece.toLowerCase();

  return getStandardMoves({
    board,
    boardIndex: mailboxIndex,
    pieceColor: pieceType === piece ? 'white' : 'black',
    piecePosition,
    pieceType
  });
};

export const getAllValidMovesNoCheck = (
  board: readonly string[],
  pieces: readonly number[]
): readonly (readonly number[])[] =>
  pieces.map(piece => getValidNoCheck(board, piece));

export const isInCheck = (
  board: readonly string[],
  color: chessColor
): boolean => {
  const positionsOpponentCanMoveTo = getAllValidMovesNoCheck(
    board,
    getPiecesOfColor(board, color === 'white' ? 'black' : 'white')
  ).flat();

  const kingPosition = mailboxIndex.indexOf(
    board.indexOf(color === 'white' ? 'k' : 'K')
  );

  return positionsOpponentCanMoveTo.includes(kingPosition);
};

// eslint-disable-next-line complexity, max-statements, max-lines-per-function
const getCastlingMoves = ({
  type,
  color,
  valids,
  board,
  boardIndex
}: {
  readonly type: string;
  readonly color: chessColor;
  readonly valids: readonly number[];
  readonly board: readonly string[];
  readonly boardIndex: readonly number[];
}): readonly number[] => {
  const castlingMoves = [];
  if (type === 'k' && color === 'black' && !isInCheck(board, 'black')) {
    if (
      window.game.castle.blackShortCastle &&
      valids.includes(5) &&
      board[boardIndex[6]] === '-' &&
      !isInCheck(boardAfterMove(board, 4, 5), 'black')
    ) {
      castlingMoves.push(6);
    }
    if (
      window.game.castle.blackLongCastle &&
      valids.includes(3) &&
      board[boardIndex[2]] === '-' &&
      board[boardIndex[1]] === '-' &&
      !isInCheck(boardAfterMove(board, 4, 3), 'black')
    ) {
      castlingMoves.push(2);
    }
  } else if (type === 'k' && color === 'white' && !isInCheck(board, 'white')) {
    if (
      window.game.castle.whiteShortCastle &&
      valids.includes(61) &&
      board[boardIndex[62]] === '-' &&
      !isInCheck(boardAfterMove(board, 60, 61), 'white')
    ) {
      castlingMoves.push(62);
    }
    if (
      window.game.castle.whiteLongCastle &&
      valids.includes(59) &&
      board[boardIndex[58]] === '-' &&
      board[boardIndex[57]] === '-' &&
      !isInCheck(boardAfterMove(board, 60, 59), 'white')
    ) {
      castlingMoves.push(58);
    }
  }
  return castlingMoves;
};

export const getValid = (
  piecePosition: number,
  board: readonly string[]
): readonly number[] => {
  const boardIndex = mailboxIndex;
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
    move => !isInCheck(boardAfterMove(board, piecePosition, move), color)
  );
};
