/*
Handler for user interface (Control panels, counters and so on)
*/
function convertPawn() {
  const textualChoice = $('input:radio[name=convert]:checked').val();
  let internalChoice;
  const aPiece = $(`#${game.pawn.pawnToConvert}`).children('a');
  if (textualChoice === 'queen') {
    aPiece
      .removeClass('pawn')
      .addClass('queen')
      .html('&#9819;');
    internalChoice = 'q';
  } else if (textualChoice === 'rook') {
    aPiece
      .removeClass('pawn')
      .addClass('rook')
      .html('&#9820;');
    internalChoice = 'r';
  } else if (textualChoice === 'knight') {
    aPiece
      .removeClass('pawn')
      .addClass('knight')
      .html('&#9822;');
    internalChoice = 'n';
  } else if (textualChoice === 'bishop') {
    aPiece
      .removeClass('pawn')
      .addClass('bishop')
      .html('&#9821;');
    internalChoice = 'b';
  }

  if (turn === 'black') {
    //Black use upper case, but the turn have already been switched.
    internalChoice = internalChoice.toUpperCase();
  }
  game.board[game.boardIndex[game.pawn.pawnToConvert]] = internalChoice;

  $('#conversion').addClass('hidden');
  $('input:radio[name=convert]')
    .eq(0)
    .attr('checked', 'checked');
  game.pawn.pawnToConvert = -1;
  switchTurn();
}

function startGame() {
  // Grab player selections
  const blackPlayer = $('#blackPlayer').val();

  const whitePlayer = $('#whitePlayer').val();

  // Set variables used for switching turns
  game.blackAI = blackPlayer !== 'Player' ? true : false;
  game.whiteAI = whitePlayer !== 'Player' ? true : false;

  // Save difficulties chosen to AI
  switch (whitePlayer) {
    case 'Player':
      // No AI to save, do nothing
      break;
    case 'AI - Very Easy':
      AI.whiteIntelligence = 1;
      break;
    case 'AI - Easy':
      AI.whiteIntelligence = 2;
      break;
    case 'AI - Medium':
      AI.whiteIntelligence = 3;
      break;
    default:
      break;
  }

  switch (blackPlayer) {
    case 'Player':
      // No AI to save, do nothing
      break;
    case 'AI - Very Easy':
      AI.blackIntelligence = 1;
      break;
    case 'AI - Easy':
      AI.blackIntelligence = 2;
      break;
    case 'AI - Medium':
      AI.blackIntelligence = 3;
      break;
    default:
      break;
  }

  // Remove start menu
  $('#background').addClass('hidden');

  // For testing only!
  // castleCheckTest();

  // Go!
  switchTurn();
}
function endGame(checkmate) {
  const outcome = checkmate ? 'Checkmate!' : 'Stalemate!';
  const theMenu = $('#startMenu');
  const playerWhoWon = turn === 'black' ? 'White' : 'Black';
  //Empty the startmenu
  theMenu.html('');
  //Build new contents
  theMenu.append(`<br/><br/><h2>${outcome}</h2>`);
  if (checkmate) {
    theMenu.append(`<h3>${playerWhoWon} won the game!</h3><br/><br/>`);
  } else {
    theMenu.append('<h3>Nobody won the game!</h3><br/><br/>');
  }
  theMenu.append(
    '<input type="button" value="Restart Chess!" onclick="window.location.reload()">'
  );
  //Show it
  $('#background').removeClass('hidden');
}
