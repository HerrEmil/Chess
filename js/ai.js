var AI = {};

// This var is just used to make sure that we do not return value on top level of decision tree
AI.plyUsed = 100;

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
		// For King valids
		whiteIndex = bIndex.indexOf(aBoard.indexOf('k')),
		blackIndex = bIndex.indexOf(aBoard.indexOf('K')),
		whiteKingMoves = [],
		blackKingMoves = [],
		whiteSilverLining,
		blackSilverLining;

	// Grab all pieces.
	whitePieces = getPieces(aBoard, 'white');
	blackPieces = getPieces(aBoard, 'black');

	// Add up the value of all white pieces
	for (i = 0; i < whitePieces.length; i += 1) {
		switch (aBoard[bIndex[whitePieces[i]]]) {
		// Pawns
		case 'p':
			whiteValue += 1;
			break;
		// Rooks
		case 'r':
			whiteValue += 5;
			break;
		// Knights
		case 'n':
			whiteValue += 3;
			break;
		// Bishops
		case 'b':
			whiteValue += 3;
			break;
		// Queens
		case 'q':
			whiteValue += 9;
			break;
		// Kings, worth more than all other pieces together
		case 'k':
			whiteValue += 1000;
			break;
		default:
			console.log('Error: Tried to evaluate invalid white piece!');
			break;
		}
	}

	// Add up the value of all black pieces
	for (i = 0; i < blackPieces.length; i += 1) {
		switch (aBoard[bIndex[blackPieces[i]]]) {
		// Pawns
		case 'P':
			blackValue += 1;
			break;
		// Rooks
		case 'R':
			blackValue += 5;
			break;
		// Knights
		case 'N':
			blackValue += 3;
			break;
		// Bishops
		case 'B':
			blackValue += 3;
			break;
		// Queens
		case 'Q':
			blackValue += 9;
			break;
		// Kings, worth more than all other pieces together
		case 'K':
			blackValue += 1000;
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
		moveSetOnce = false,
		hasSetOnce;

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
		// Iterate through all moves
		for (i; i < pieces.length; i += 1) {
			j = 0;
			for (j; j < moves[i].length; j += 1) {
				// Update the state of the child board by making current move
				tempBoardRef = kindaMakeMove(childBoardState, pieces[i].valueOf(), moves[i][j].valueOf());
				childBoardState = tempBoardRef.slice();

				// Calling sister method
				childMove = AI.minMove(childBoardState, player, (ply - 1), alpha, beta);

				// Restore the state of the child board by unmaking current move
				tempBoardRef = kindaMakeMove(childBoardState, moves[i][j].valueOf(), pieces[i].valueOf());
				childBoardState = tempBoardRef.slice();

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
		randomPieces = [],
		randomPiecesAdded = 0,
		randomMoves = [];

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
		// Iterate through all moves
		for (i; i < pieces.length; i += 1) {
			j = 0;
			for (j; j < moves[i].length; j += 1) {
				// Update the state of the child board by making current move
				tempBoardRef = kindaMakeMove(childBoardState, pieces[i].valueOf(), moves[i][j].valueOf());
				childBoardState = tempBoardRef.slice();

				// Calling sister method
				childMove = AI.maxMove(childBoardState, player, (ply - 1), alpha, beta);

				// Restore the state of the child board by unmaking current move
				tempBoardRef = kindaMakeMove(childBoardState, moves[i][j].valueOf(), pieces[i].valueOf());
				childBoardState = tempBoardRef.slice();

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
					returnArray = [localBestMoveStart, localBestMoveGoal, beta];
					return returnArray;
				}
			}
		}
		// In case there was no alpha beta cut-off and all moves were evaluated, we return here
		returnArray = [localBestMoveStart, localBestMoveGoal, beta];
		return returnArray;
	}
};

// This is the main AI function that is called from the game
// The ply value has to be 2 or higher for the AI to behave
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

	// Call best move lookup function
	bestMove = AI.maxMove(game.board, turn, ply, alpha, beta);

	// Check that the lookup function returned a useful move
	if (bestMove[0] !== -1 && bestMove[1] !== -1) {
		// Make the move!
		reallyMakeMove(bestMove[0], bestMove[1], true);
	} else {
		console.log('Error: AI did not pick a move!');
	}
};