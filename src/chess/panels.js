import { switchTurn } from './main.js';

const pieceChar = new Map(
  Object.entries({
    bishop: 'b',
    knight: 'n',
    queen: 'q',
    rook: 'r'
  })
);

const pieceHTML = new Map(
  Object.entries({
    bishop: '&#9821;',
    knight: '&#9822;',
    queen: '&#9819;',
    rook: '&#9820;'
  })
);

export const convertPawn = () => {
  const piece = $('input:radio[name=convert]:checked').val();

  // Update DOM board
  $(`#${game.pawn.pawnToConvert}`)
    .children('a')
    .removeClass('pawn')
    .addClass(piece)
    .html(pieceHTML.get(piece));

  // Update JS board
  game.board[game.boardIndex[game.pawn.pawnToConvert]] =
    turn === 'white'
      ? pieceChar.get(piece)
      : pieceChar.get(piece).toUpperCase();

  $('#conversion').addClass('hidden');
  $('input:radio[name=convert]')
    .eq(0)
    .attr('checked', 'checked');
  game.pawn.pawnToConvert = -1;
  switchTurn();
};
window.convertPawn = convertPawn;

export const startGame = () => {
  // Grab player selections
  const blackPlayer = $('#blackPlayer').val();

  const whitePlayer = $('#whitePlayer').val();

  // Set variables used for switching turns
  game.blackAI = blackPlayer !== 'Player';
  game.whiteAI = whitePlayer !== 'Player';

  // Save difficulties chosen to AI
  switch (whitePlayer) {
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

  // Go!
  switchTurn();
};

export const endGame = checkmate => {
  const outcome = checkmate ? 'Checkmate!' : 'Stalemate!';
  const theMenu = $('#startMenu');
  const playerWhoWon = turn === 'black' ? 'White' : 'Black';
  // Empty the startmenu
  theMenu.html('');
  // Build new contents
  theMenu.append(`<br/><br/><h2>${outcome}</h2>`);
  if (checkmate) {
    theMenu.append(`<h3>${playerWhoWon} won the game!</h3><br/><br/>`);
  } else {
    theMenu.append('<h3>Nobody won the game!</h3><br/><br/>');
  }
  theMenu.append(
    '<input type="button" value="Restart Chess!" onclick="window.location.reload()">'
  );
  // Show it
  $('#background').removeClass('hidden');
};
