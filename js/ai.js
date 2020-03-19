const AI = {};

// This var is just used to make sure that we do not return value on top level of decision tree
AI.plyUsed = 100;

// Piece Square Tables, numbers found in nice chessbin C# guide:
// http://www.chessbin.com/post/Chess-Board-Evaluation.aspx
// prettier-ignore
AI.pawnTable = [
	875, 875, 875, 875, 875, 875, 875, 875,
	50,   50,  50,  50,  50,  50,  50,  50,
	10,   10,  20,  30,  30,  20,  10,  10,
	5,     5,  10,  27,  27,  10,   5,   5,
	0,     0,   0,  25,  25,   0,   0,   0,
	5,    -5, -10,   0,   0, -10,  -5,   5,
	5,    10,  10, -25, -25,  10,  10,   5,
	0,     0,   0,   0,   0,   0,   0,   0
];

// prettier-ignore
AI.knightTable = [
	-50, -40, -30, -30, -30, -30, -40, -50,
	-40, -20,   0,   0,   0,   0, -20, -40,
	-30,   0,  10,  15,  15,  10,   0, -30,
	-30,   5,  15,  20,  20,  15,   5, -30,
	-30,   0,  15,  20,  20,  15,   0, -30,
	-30,   5,  10,  15,  15,  10,   5, -30,
	-40, -20,   0,   5,   5,   0, -20, -40,
	-50, -40, -20, -30, -30, -20, -40, -50
];

// prettier-ignore
AI.bishopTable = [
	-20, -10, -10, -10, -10, -10, -10, -20,
	-10,   0,   0,   0,   0,   0,   0, -10,
	-10,   0,   5,  10,  10,   5,   0, -10,
	-10,   5,   5,  10,  10,   5,   5, -10,
	-10,   0,  10,  10,  10,  10,   0, -10,
	-10,  10,  10,  10,  10,  10,  10, -10,
	-10,   5,   0,   0,   0,   0,   5, -10,
	-20, -10, -40, -10, -10, -40, -10, -20
];

// prettier-ignore
AI.kingTable = [
	-30, -40, -40, -50, -50, -40, -40, -30,
	-30, -40, -40, -50, -50, -40, -40, -30,
	-30, -40, -40, -50, -50, -40, -40, -30,
	-30, -40, -40, -50, -50, -40, -40, -30,
	-20, -30, -30, -40, -40, -30, -30, -20,
	-10, -20, -20, -20, -20, -20, -20, -10,
	20,   20,   0,   0,   0,   0,  20,  20,
	20,   30,  10,   0,   0,  10,  30,  20
];

// prettier-ignore
AI.kingTableEndGame = [
	-50, -40, -30, -20, -20, -30, -40, -50,
	-30, -20, -10,   0,   0, -10, -20, -30,
	-30, -10,  20,  30,  30,  20, -10, -30,
	-30, -10,  30,  40,  40,  30, -10, -30,
	-30, -10,  30,  40,  40,  30, -10, -30,
	-30, -10,  20,  30,  30,  20, -10, -30,
	-30, -30,   0,   0,   0,   0, -30, -30,
	-50, -30, -30, -30, -30, -30, -30, -50
];

/*  Difficulty 
	1 = Very easy. Original AI with more randomness, increase salt to AI breaking number.
	2 = Easy. The original AI.
	3 = Medium. Piece value + Strategic Positions
	4 = Hard. On my to-do list
*/

// These are set at the start of the game, depending on player selection.
AI.whiteIntelligence = -1;
AI.blackIntelligence = -1;
// This value is the one actually used by the evaluation function
// It is set by AI.makeMove depending on current turn
AI.intelligence = -1;

// Evaluates the value of a state of a board
AI.evaluate = (aBoard, color) => {
  let whiteValue = 0;
  let blackValue = 0;
  const bIndex = game.boardIndex;

  // Add up the value of all white pieces
  const whitePieces = getPieces(aBoard, 'white');
  for (piece of whitePieces) {
    switch (aBoard[bIndex[piece]]) {
      // Pawns
      case 'p':
        whiteValue += 100;
        if (AI.intelligence === 3) {
          whiteValue += AI.pawnTable[piece];
        }
        break;
      // Rooks
      case 'r':
        whiteValue += 500;
        break;
      // Knights
      case 'n':
        whiteValue += 320;
        if (AI.intelligence === 3) {
          whiteValue += AI.knightTable[piece];
        }
        break;
      // Bishops
      case 'b':
        whiteValue += 325;
        if (AI.intelligence === 3) {
          whiteValue += AI.bishopTable[piece];
        }
        break;
      // Queens
      case 'q':
        whiteValue += 975;
        break;
      // Kings, worth more than all other pieces together
      case 'k':
        whiteValue += 32767;
        if (AI.intelligence === 3) {
          whiteValue += AI.kingTable[piece];
        }
        break;
      default:
        break;
    }
  }

  // Add up the value of all black pieces
  const blackPieces = getPieces(aBoard, 'black');
  for (piece of blackPieces) {
    switch (aBoard[bIndex[piece]]) {
      // Pawns
      case 'P':
        blackValue += 100;
        if (AI.intelligence === 3) {
          blackValue += AI.pawnTable[63 - piece];
        }
        break;
      // Rooks
      case 'R':
        blackValue += 500;
        break;
      // Knights
      case 'N':
        blackValue += 320;
        if (AI.intelligence === 3) {
          blackValue += AI.knightTable[63 - piece];
        }
        break;
      // Bishops
      case 'B':
        blackValue += 325;
        if (AI.intelligence === 3) {
          blackValue += AI.bishopTable[63 - piece];
        }
        break;
      // Queens
      case 'Q':
        blackValue += 975;
        break;
      // Kings, worth more than all other pieces together
      case 'K':
        blackValue += 32767;
        if (AI.intelligence === 3) {
          blackValue += AI.kingTable[63 - piece];
        }
        break;
      default:
        break;
    }
  }

  // Check for checks
  if (isInCheck(aBoard, 'white')) {
    // White is checked, black likes that!
    blackValue += 0.5;
  }
  if (isInCheck(aBoard, 'black')) {
    // Black is checked, white likes that!
    whiteValue += 0.5;
  }

  // Return the value of all pieces of your color minus the value of all opposing pieces
  const salt = Math.random() * (AI.intelligence === 1 ? 1000 : 0.1);
  if (color === 'white') {
    return whiteValue - blackValue + salt;
  } else if (color === 'black') {
    return blackValue - whiteValue + salt;
  }
};

// Best move lookup function
// Given ply >1, return array will contain move with start position and end position, on index 0 and 1 respectively
// Given ply 1, return array will contain a value of the boardState, on index 2
AI.maxMove = (boardState, player, ply, alpha, beta) => {
  const nodeValue = [];
  let localBestMoveStart = -1;
  let localBestMoveGoal = -1;

  // Copy the board received, the childBoardState is the 'working board' that we try out moves on
  let childBoardState = boardState.slice();

  // Grab all pieces and all their valid moves
  const pieces = getPieces(childBoardState, player);
  const moves = getAllValidMoves(childBoardState, pieces);

  // Flatten moves 2D array (when .length of flat array is 0, it's game over man)
  const movesFlat = [].concat(...moves);

  // If the game has ended or we reach the depth limit, evaluate!
  if (movesFlat.length === 0 || ply === 1) {
    // The node returns the value of current board state
    nodeValue[2] = AI.evaluate(childBoardState, player);
    return nodeValue;
  } else {
    // We store array lengths to speed up loops
    const piecesLength = pieces.length;
    // Iterate through all moves
    for (let i = 0; i < piecesLength; i += 1) {
      const movesILength = moves[i].length;
      for (let j = 0; j < movesILength; j += 1) {
        // Update the state of the child board by making current move
        const tempBoardRef = boardAfterMove(
          childBoardState,
          pieces[i].valueOf(),
          moves[i][j].valueOf()
        );
        childBoardState = tempBoardRef.slice();

        // Calling sister method
        const childMove = AI.minMove(
          childBoardState,
          player,
          ply - 1,
          alpha,
          beta
        );

        // Restore the state of the child board
        childBoardState = boardState.slice();

        // Check if minMove returned the value of a board
        if (childMove.length === 3) {
          // Check if that value is higher than previously highest value
          if (childMove[2].valueOf() > alpha) {
            // When finding a new best move, we save it and update alpha
            alpha = childMove[2].valueOf();
            localBestMoveStart = pieces[i].valueOf();
            localBestMoveGoal = moves[i][j].valueOf();
          }
        }

        // alphaBeta optimizing like a boss
        if (beta < alpha) {
          return [localBestMoveStart, localBestMoveGoal, alpha];
        }
      }
    }
    // In case there was no alpha beta cut-off and all moves were evaluated, we return here
    return [localBestMoveStart, localBestMoveGoal, alpha];
  }
};

// Sister method
AI.minMove = (boardState, player, ply, alpha, beta) => {
  const nodeValue = [];
  let localBestMoveStart = -1;
  let localBestMoveGoal = -1;

  // Save the opposing player, in this sister method, the evaluation method is called with it
  const minPlayer = player === 'white' ? 'black' : 'white';

  // Copy the board received, the childBoardState is the 'working board' that we try out moves on
  let childBoardState = boardState.slice();

  // Grab all pieces and all their valid moves
  const pieces = getPieces(childBoardState, minPlayer);
  const moves = getAllValidMovesNoCheck(childBoardState, pieces);

  // Flatten moves 2D array (when .length of flat array is 0, it's game over man)
  const movesFlat = [].concat(...moves);

  // If we reach the depth limit, evaluate!
  if (movesFlat.length === 0 || ply === 1) {
    // The node returns the value of current board state
    nodeValue[2] = AI.evaluate(childBoardState, minPlayer);
    return nodeValue;
  } else {
    // We store array lengths to speed up loops
    const piecesLength = pieces.length;
    // Iterate through all moves
    for (let i = 0; i < piecesLength; i += 1) {
      const movesILength = moves[i].length;
      for (let j = 0; j < movesILength; j += 1) {
        // Update the state of the child board by making current move
        const tempBoardRef = boardAfterMove(
          childBoardState,
          pieces[i].valueOf(),
          moves[i][j].valueOf()
        );
        childBoardState = tempBoardRef.slice();

        // Calling sister method
        const childMove = AI.maxMove(
          childBoardState,
          player,
          ply - 1,
          alpha,
          beta
        );

        // Restore the state of the child board
        childBoardState = boardState.slice();

        // Check if minMove returned the value of a board
        if (childMove.length === 3) {
          // Check if that value is lower than previously lowest value
          if (childMove[2].valueOf() < beta) {
            beta = childMove[2].valueOf();
            localBestMoveStart = pieces[i].valueOf();
            localBestMoveGoal = moves[i][j].valueOf();
          }
        }

        // alphaBeta optimizing like a boss
        if (beta < alpha) {
          return [localBestMoveStart, localBestMoveGoal, beta];
        }
      }
    }
    // In case there was no alpha beta cut-off and all moves were evaluated, we return here
    return [localBestMoveStart, localBestMoveGoal, beta];
  }
};

// This is the main AI function that is called from the game
// The ply value has to be 2 or higher for the AI to behave

// Note: There is something broken that causes the AI to only work when
//  given odd numbers, effectively limiting it to just accepting 3
AI.makeMove = ply => {
  const alpha = -100000;
  const beta = 100000;

  // Make sure that ply is 2 or higher
  if (ply <= 2) {
    return;
  }

  // Note down which ply you are using
  AI.plyUsed = ply;

  // Set the evaluation difficulty
  if (turn === 'white') {
    AI.intelligence = AI.whiteIntelligence;
  } else {
    AI.intelligence = AI.blackIntelligence;
  }

  // Call best move lookup function
  const bestMove = AI.maxMove(game.board, turn, ply, alpha, beta);

  // Check that the lookup function returned a useful move
  if (bestMove[0] !== -1 && bestMove[1] !== -1) {
    // Make the move!
    makeMove(bestMove[0], bestMove[1], true);
  }
};
