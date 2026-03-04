import { AI } from './ai.js';
import { appState, mailboxIndex, switchTurn, type GameResult } from './main.js';

const pieceChar = new Map(
  Object.entries({
    bishop: 'b',
    knight: 'n',
    queen: 'q',
    rook: 'r',
  }),
);

const pieceHTML = new Map(
  Object.entries({
    bishop: '&#9821;',
    knight: '&#9822;',
    queen: '&#9819;',
    rook: '&#9820;',
  }),
);

export const convertPawn = (): void => {
  const piece = $('input:radio[name=convert]:checked').val() as string;

  // Update DOM board
  $(`#${appState.game.pawn.pawnToConvert}`)
    .children('a')
    .removeClass('pawn')
    .addClass(piece)
    .html(pieceHTML.get(piece) as string);

  // Update JS board
  appState.game.board[mailboxIndex[appState.game.pawn.pawnToConvert]] =
    appState.turn === 'white'
      ? (pieceChar.get(piece) as string)
      : (pieceChar.get(piece) as string).toUpperCase();

  $('#conversion').addClass('hidden');
  $('input:radio[name=convert]').eq(0).attr('checked', 'checked');
  appState.game.pawn.pawnToConvert = -1;
  switchTurn();
};

export const startGame = (): void => {
  // Grab player selections
  const blackPlayer = $('#blackPlayer').val();

  const whitePlayer = $('#whitePlayer').val();

  // Set variables used for switching turns
  appState.game.blackAI = blackPlayer !== 'Player';
  appState.game.whiteAI = whitePlayer !== 'Player';

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

export const endGame = (result: GameResult): void => {
  const titles: Record<GameResult, string> = {
    checkmate: 'Checkmate!',
    'fifty-move': 'Draw — 50-move rule!',
    repetition: 'Draw — threefold repetition!',
    stalemate: 'Stalemate!',
  };
  const theMenu = $('#startMenu');
  const playerWhoWon = appState.turn === 'black' ? 'White' : 'Black';
  theMenu.html('');
  theMenu.append(`<br/><br/><h2>${titles[result]}</h2>`);
  theMenu.append(
    result === 'checkmate'
      ? `<h3>${playerWhoWon} won the game!</h3><br/><br/>`
      : '<h3>Nobody won the game!</h3><br/><br/>',
  );
  theMenu.append(
    '<input type="button" value="Restart Chess!" onclick="window.location.reload()">',
  );
  $('#background').removeClass('hidden');
};
