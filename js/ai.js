var AI = {};

// This var is just used to make sure that we do not return value on top level of decision tree
AI.plyUsed = 100;

// Piece Square Tables, numbers found in nice chessbin C# guide:
// http://www.chessbin.com/post/Chess-Board-Evaluation.aspx
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
AI.evaluate = function (aBoard, color) {
	'use strict';
	var whitePieces = [],
		blackPieces = [],
		whiteValue = 0,
		blackValue = 0,
		i = 0,
		bIndex = game.boardIndex,
		salt = Math.random() * 0.1,
		whiteSilverLining,
		blackSilverLining,
		whitePiecesLength,
		blackPiecesLength;

	if (AI.intelligence === 1) {
		// Herp derp
		salt = salt * 10000;
	}

	// Grab all pieces.
	whitePieces = getPieces(aBoard, 'white');
	blackPieces = getPieces(aBoard, 'black');
	whitePiecesLength = whitePieces.length;
	blackPiecesLength = blackPieces.length;

	// Add up the value of all white pieces
	for (i = 0; i < whitePiecesLength; i += 1) {
		switch (aBoard[bIndex[whitePieces[i]]]) {
		// Pawns
		case 'p':
			whiteValue += 100;
			//console.log('The white pawn at position', whitePieces[i], 'gets the position value', AI.pawnTable[whitePieces[i]]);
			if (AI.intelligence === 3) {
				whiteValue += AI.pawnTable[whitePieces[i]];
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
				whiteValue += AI.knightTable[whitePieces[i]];
			}
			break;
		// Bishops
		case 'b':
			whiteValue += 325;
			if (AI.intelligence === 3) {
				whiteValue += AI.bishopTable[whitePieces[i]];
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
				whiteValue += AI.kingTable[whitePieces[i]];
			}
			break;
		default:
			console.log('Error: Tried to evaluate invalid white piece!');
			break;
		}
	}

	// Add up the value of all black pieces
	for (i = 0; i < blackPiecesLength; i += 1) {
		switch (aBoard[bIndex[blackPieces[i]]]) {
		// Pawns
		case 'P':
			blackValue += 100;
			//console.log('The black pawn at position', blackPieces[i], 'gets the position value', AI.pawnTable[(63 - blackPieces[i])]);
			if (AI.intelligence === 3) {
				blackValue += AI.pawnTable[(63 - blackPieces[i])];
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
				blackValue += AI.knightTable[(63 - blackPieces[i])];
			}
			break;
		// Bishops
		case 'B':
			blackValue += 325;
			if (AI.intelligence === 3) {
				blackValue += AI.bishopTable[(63 - blackPieces[i])];
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
				blackValue += AI.kingTable[(63 - blackPieces[i])];
			}
			break;
		default:
			console.log('Error: Tried to evaluate invalid black piece!');
			break;
		}
	}

	// Check for checks
	if (isInCheck(aBoard, 'white')) {
		// White is checked, black likes that!
		blackSilverLining += 0.5;
		blackValue += blackSilverLining;
	}
	if (isInCheck(aBoard, 'black')) {
		// Black is checked, white likes that!
		whiteSilverLining += 0.5;
		whiteValue += whiteSilverLining;
	}

	// Return the value of all pieces of your color minus the value of all opposing pieces
	if (color === 'white') {
		return whiteValue - blackValue + salt;
	} else if (color === 'black') {
		return blackValue - whiteValue + salt;
	} else {
		console.log('Error: AI.evaluate was called with invalid color value!');
	}
};

// Best move lookup function
// Given ply >1, return array will contain move with start position and end position, on index 0 and 1 respectively
// Given ply 1, return array will contain a value of the boardState, on index 2
AI.maxMove = function (boardState, player, ply, alpha, beta) {
	'use strict';
	var childBoardState = [],
		childMove = [],
		pieces = [],
		moves = [],
		movesFlat = [],
		nodeValue = [],
		localBestMoveStart = -1,
		localBestMoveGoal = -1,
		returnArray = [],
		i = 0,
		j = 0,
		localBestValue = -1,
		tempBoardRef = [],
		piecesLength,
		movesILength;

	// Copy the board received, the childBoardState is the 'working board' that we try out moves on
	childBoardState = boardState.slice();

	// Grab all pieces and all their valid moves
	pieces = getPieces(childBoardState, player);
	moves = getAllValidMoves(childBoardState, pieces);

	// Flatten moves 2D array (when .length of flat array is 0, it's game over man)
	movesFlat = [].concat.apply([], moves);

	// If the game has ended or we reach the depth limit, evaluate!
	if (movesFlat.length === 0 || ply === 1) {
		// The node returns the value of current board state
		nodeValue[2] = AI.evaluate(childBoardState, player);
		return nodeValue;
	} else {
		// We store array lengths to speed up loops
		piecesLength = pieces.length;
		// Iterate through all moves
		for (i; i < piecesLength; i += 1) {
			j = 0;
			movesILength = moves[i].length;
			for (j; j < movesILength; j += 1) {
				// console.log('If I move from', arrayToReadable(pieces[i].valueOf()), 'to', arrayToReadable(moves[i][j].valueOf()) + ',');
				// Update the state of the child board by making current move
				tempBoardRef = boardAfterMove(childBoardState, pieces[i].valueOf(), moves[i][j].valueOf());
				childBoardState = tempBoardRef.slice();

				// Calling sister method
				childMove = AI.minMove(childBoardState, player, (ply - 1), alpha, beta);

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
					returnArray = [localBestMoveStart, localBestMoveGoal, alpha];
					return returnArray;
				}
			}
		}
		// In case there was no alpha beta cut-off and all moves were evaluated, we return here
		returnArray = [localBestMoveStart, localBestMoveGoal, alpha];
		return returnArray;
	}
};

// Sister method
AI.minMove = function (boardState, player, ply, alpha, beta) {
	'use strict';
	var childBoardState = [],
		minPlayer,
		childMove = [],
		pieces = [],
		moves = [],
		movesFlat = [],
		nodeValue = [],
		localBestMoveStart = -1,
		localBestMoveGoal = -1,
		returnArray = [],
		i = 0,
		j = 0,
		localBestValue = -1,
		tempBoardRef = [],
		piecesLength,
		movesILength;

	// Save the opposing player, in this sister method, the evaluation method is called with it
	minPlayer = player === 'white' ? 'black' : 'white';

	// Copy the board received, the childBoardState is the 'working board' that we try out moves on
	childBoardState = boardState.slice();

	// Grab all pieces and all their valid moves
	pieces = getPieces(childBoardState, minPlayer);
	moves = getAllValidMovesNoCheck(childBoardState, pieces);

	// Flatten moves 2D array (when .length of flat array is 0, it's game over man)
	movesFlat = [].concat.apply([], moves);

	// If we reach the depth limit, evaluate!
	if (movesFlat.length === 0 || ply === 1) {
		// The node returns the value of current board state
		nodeValue[2] = AI.evaluate(childBoardState, minPlayer);
		return nodeValue;
	} else {
		// We store array lengths to speed up loops
		piecesLength = pieces.length;
		// Iterate through all moves
		for (i; i < piecesLength; i += 1) {
			j = 0;
			movesILength = moves[i].length;
			for (j; j < movesILength; j += 1) {
				// Update the state of the child board by making current move
				tempBoardRef = boardAfterMove(childBoardState, pieces[i].valueOf(), moves[i][j].valueOf());
				childBoardState = tempBoardRef.slice();

				// Calling sister method
				childMove = AI.maxMove(childBoardState, player, (ply - 1), alpha, beta);

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
					// console.log('opponent will move from', arrayToReadable(localBestMoveStart), 'to', arrayToReadable(localBestMoveGoal), 'giving a board valued', Math.floor(beta));
					returnArray = [localBestMoveStart, localBestMoveGoal, beta];
					return returnArray;
				}
			}
		}
		// console.log('opponent will move from', arrayToReadable(localBestMoveStart), 'to', arrayToReadable(localBestMoveGoal), 'giving a board valued', Math.floor(beta));
		// In case there was no alpha beta cut-off and all moves were evaluated, we return here
		returnArray = [localBestMoveStart, localBestMoveGoal, beta];
		return returnArray;
	}
};

// This is the main AI function that is called from the game
// The ply value has to be 2 or higher for the AI to behave

// Note: There is something broken that causes the AI to only work when
//  given odd numbers, effectively limiting it to just accepting 3
AI.makeMove = function (ply) {
	'use strict';
	var bestMove = [],
		alpha = -100000,
		beta = 100000,
		pieces = [],
		opposingPieces,
		opposingColor;

	// Set bestMove to invalid positions for check later
	bestMove[0] = -1;
	bestMove[1] = -1;
	bestMove[2] = -1;

	// Make sure that ply is 2 or higher
	if (ply <= 2) {
		console.log('Error: AI.makeMove was called with ply lower than 2!');
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

	// console.log('********************************************');
	// console.log('AI is thinking through', turn + "'s possibilities");
	// console.log('********************************************');

	// Call best move lookup function
	bestMove = AI.maxMove(game.board, turn, ply, alpha, beta);

	// Check that the lookup function returned a useful move
	if (bestMove[0] !== -1 && bestMove[1] !== -1) {
		// Make the move!
		makeMove(bestMove[0], bestMove[1], true);
	} else {
		console.log('Error: AI did not pick a move!');
	}
};