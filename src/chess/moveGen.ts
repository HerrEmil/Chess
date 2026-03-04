import { boardAfterMove, mailboxIndex, type CastleState } from './main.js';
import { color as chessColor } from './ai.js';
import { getPiecesOfColor } from './util.js';

const getValidPositionsInDirection = ({
  board,
  color,
  direction,
  startPosition,
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

    if (piece === 42) {
      return positions;
    } else if (piece === 45) {
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
  color,
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
      startPosition,
    }),
    ...getValidPositionsInDirection({
      board,
      color,
      direction: 10,
      startPosition,
    }),
    ...getValidPositionsInDirection({
      board,
      color,
      direction: -1,
      startPosition,
    }),
    ...getValidPositionsInDirection({
      board,
      color,
      direction: 1,
      startPosition,
    }),
  ];
};

const bishopValids = ({
  board,
  index,
  color,
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
      startPosition,
    }),
    ...getValidPositionsInDirection({
      board,
      color,
      direction: 9,
      startPosition,
    }),
    ...getValidPositionsInDirection({
      board,
      color,
      direction: -11,
      startPosition,
    }),
    ...getValidPositionsInDirection({
      board,
      color,
      direction: 11,
      startPosition,
    }),
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
  color,
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
    startPosition + 21,
  ]
    .filter((position) =>
      colorCanStepOnPiece(color, board[position].charCodeAt(0)),
    )
    .map((position) => boardIndex.indexOf(position));
};

const kingValids = ({
  board,
  boardIndex,
  index,
  color,
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
    startPosition + 11,
  ]
    .filter((position) =>
      colorCanStepOnPiece(color, board[position].charCodeAt(0)),
    )
    .map((position) => boardIndex.indexOf(position));
};

const pawnValids = ({
  board,
  boardIndex,
  index,
  color,
  enPassantTarget = null,
}: {
  readonly board: readonly string[];
  readonly boardIndex: readonly number[];
  readonly color: chessColor;
  readonly index: number;
  readonly enPassantTarget?: number | null;
}): readonly number[] => {
  const pos = boardIndex[index];
  const forward = color === 'black' ? pos + 10 : pos - 10;
  const doubleForward = color === 'black' ? pos + 20 : pos - 20;
  const canMoveForward = board[forward].charCodeAt(0) === 45;
  const canDoubleMove =
    canMoveForward &&
    (color === 'black' ? pos < 39 && pos > 30 : pos < 89 && pos > 80) &&
    board[doubleForward].charCodeAt(0) === 45;

  const forwardMoves = canMoveForward
    ? [
        boardIndex.indexOf(forward),
        ...(canDoubleMove ? [boardIndex.indexOf(doubleForward)] : []),
      ]
    : [];

  const diagonals = [
    color === 'black' ? pos + 9 : pos - 9,
    color === 'black' ? pos + 11 : pos - 11,
  ];

  const captures = diagonals
    .filter((position) => {
      const piece = board[position].charCodeAt(0);
      return color === 'black'
        ? piece > 96 && piece < 115
        : piece > 64 && piece < 83;
    })
    .map((position) => boardIndex.indexOf(position));

  const epCaptures =
    enPassantTarget !== null && diagonals.includes(boardIndex[enPassantTarget])
      ? [enPassantTarget]
      : [];

  return [...forwardMoves, ...captures, ...epCaptures];
};

const getStandardMoves = ({
  pieceType,
  board,
  boardIndex,
  piecePosition: index,
  pieceColor: color,
  enPassantTarget = null,
}: {
  readonly pieceType: string;
  readonly board: readonly string[];
  readonly boardIndex: readonly number[];
  readonly piecePosition: number;
  readonly pieceColor: chessColor;
  readonly enPassantTarget?: number | null;
}): readonly number[] => {
  const boardPayload = {
    board,
    boardIndex,
    color,
    index,
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
      return pawnValids({ ...boardPayload, enPassantTarget });
    default:
      return [];
  }
};

const getValidNoCheck = (
  board: readonly string[],
  piecePosition: number,
  enPassantTarget: number | null = null,
): readonly number[] => {
  const piece = board[mailboxIndex[piecePosition]];
  const pieceType = piece.toLowerCase();

  return getStandardMoves({
    board,
    boardIndex: mailboxIndex,
    enPassantTarget,
    pieceColor: pieceType === piece ? 'white' : 'black',
    piecePosition,
    pieceType,
  });
};

export const getAllValidMovesNoCheck = (
  board: readonly string[],
  pieces: readonly number[],
  enPassantTarget: number | null = null,
): readonly (readonly number[])[] =>
  pieces.map((piece) => getValidNoCheck(board, piece, enPassantTarget));

export const isInCheck = (
  board: readonly string[],
  color: chessColor,
): boolean => {
  const positionsOpponentCanMoveTo = getAllValidMovesNoCheck(
    board,
    getPiecesOfColor(board, color === 'white' ? 'black' : 'white'),
  ).flat();

  const kingPosition = mailboxIndex.indexOf(
    board.indexOf(color === 'white' ? 'k' : 'K'),
  );

  return positionsOpponentCanMoveTo.includes(kingPosition);
};

const getCastlingMoves = ({
  type,
  color,
  valids,
  board,
  boardIndex,
  castle,
}: {
  readonly type: string;
  readonly color: chessColor;
  readonly valids: readonly number[];
  readonly board: readonly string[];
  readonly boardIndex: readonly number[];
  readonly castle: CastleState;
}): readonly number[] => {
  if (type !== 'k' || isInCheck(board, color)) return [];

  const candidates =
    color === 'black'
      ? [
          {
            allowed: castle.blackShortCastle,
            emptySquares: [6],
            kingPos: 4,
            target: 6,
            throughSquare: 5,
          },
          {
            allowed: castle.blackLongCastle,
            emptySquares: [2, 1],
            kingPos: 4,
            target: 2,
            throughSquare: 3,
          },
        ]
      : [
          {
            allowed: castle.whiteShortCastle,
            emptySquares: [62],
            kingPos: 60,
            target: 62,
            throughSquare: 61,
          },
          {
            allowed: castle.whiteLongCastle,
            emptySquares: [58, 57],
            kingPos: 60,
            target: 58,
            throughSquare: 59,
          },
        ];

  return candidates
    .filter(
      (c) =>
        c.allowed &&
        valids.includes(c.throughSquare) &&
        c.emptySquares.every((sq) => board[boardIndex[sq]] === '-') &&
        !isInCheck(boardAfterMove(board, c.kingPos, c.throughSquare), color),
    )
    .map((c) => c.target);
};

export const getValid = (
  piecePosition: number,
  board: readonly string[],
  enPassantTarget: number | null,
  castle: CastleState,
): readonly number[] => {
  const boardIndex = mailboxIndex;
  const piece = board[boardIndex[piecePosition]];
  const type = piece.toLowerCase();
  const color = type === piece ? 'white' : 'black';
  const standardMoves = getStandardMoves({
    board,
    boardIndex,
    enPassantTarget,
    pieceColor: color,
    piecePosition,
    pieceType: type,
  });
  const castlingMoves = getCastlingMoves({
    board,
    boardIndex,
    castle,
    color,
    type,
    valids: standardMoves,
  });

  return [...standardMoves, ...castlingMoves].filter(
    (move) =>
      !isInCheck(
        boardAfterMove(board, piecePosition, move, enPassantTarget),
        color,
      ),
  );
};
