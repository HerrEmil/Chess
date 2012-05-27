/*
Handler for user interface (Control panels, counters and so on)
*/
function convertPawn() {
	'use strict';
	var textualChoice = $('input:radio[name=convert]:checked').val(),
		internalChoice,
		aPiece = $('#' + game.pawn.pawnToConvert).children('a');
	if (textualChoice === 'queen') {
		aPiece.removeClass('pawn').addClass('queen').html('&#9819;');
		internalChoice = 'q';
	} else if (textualChoice === 'rook') {
		aPiece.removeClass('pawn').addClass('rook').html('&#9820;');
		internalChoice = 'r';
	} else if (textualChoice === 'knight') {
		aPiece.removeClass('pawn').addClass('knight').html('&#9822;');
		internalChoice = 'n';
	} else if (textualChoice === 'bishop') {
		aPiece.removeClass('pawn').addClass('bishop').html('&#9821;');
		internalChoice = 'b';
	} else {
		console.log('PAWN CONVERSION UNSUCCESFULL!');
	}

	if (turn === 'black') {
		//Black use upper case, but the turn have already been switched.
		internalChoice = internalChoice.toUpperCase();
	}
	game.board[game.boardIndex[game.pawn.pawnToConvert]] = internalChoice;

	$('#conversion').addClass('hidden');
	$('input:radio[name=convert]').eq(0).attr('checked', 'checked');
	game.pawn.pawnToConvert = -1;
	switchTurn();
}

function startGame() {
	'use strict';
	var blackplayer = $('input:radio[name=blackPlayer]:checked').val(),
		whiteplayer = $('input:radio[name=whitePlayer]:checked').val();
	game.blackAI = blackplayer === 'bAI' ? true : false;
	game.whiteAI = whiteplayer === 'wAI' ? true : false;
	$('#background').addClass('hidden');
	switchTurn();
}
function endGame(checkmate) {
	'use strict';
	var outcome = checkmate ? 'Checkmate!' : 'Stalemate!',
		theMenu = $('#startMenu'),
		playerWhoWon = turn === 'black' ? 'White' : 'Black';
	//Empty the startmenu
	theMenu.html('');
	//Build new contents
	theMenu.append('<br/><br/><h2>' + outcome + '</h2>');
	if (checkmate) {
		theMenu.append('<h3>' + playerWhoWon + ' won the game!</h3><br/><br/>');
	} else {
		theMenu.append('<h3>Nobody won the game!</h3><br/><br/>');
	}
	theMenu.append('<input type="button" value="Restart Chess!" onclick="window.location.reload()">');
	//Show it
	$('#background').removeClass('hidden');
}