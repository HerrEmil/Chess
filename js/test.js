// Various pieces of test code
// Don't put any code that should be available in live version here
// There are some functions in here that could be useful later on

//
const testSpace = {
  counter: 0,
  increment() {
    this.counter += 1;
  },
  log() {
    console.log(this.counter);
  }
};

// First draft of Bobby Fischer support
function setBobby() {
  //Clear off the current pieces
  $('td').html('');
  //Clear all pieces except pawns
  // prettier-ignore
  game.board = [
        '*', '*', '*', '*', '*', '*', '*', '*', '*', '*',
        '*', '*', '*', '*', '*', '*', '*', '*', '*', '*',
        '*', '-', '-', '-', '-', '-', '-', '-', '-', '*',
        '*', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', '*',
        '*', '-', '-', '-', '-', '-', '-', '-', '-', '*',
        '*', '-', '-', '-', '-', '-', '-', '-', '-', '*',
        '*', '-', '-', '-', '-', '-', '-', '-', '-', '*',
        '*', '-', '-', '-', '-', '-', '-', '-', '-', '*',
        '*', 'p', 'p', 'p', 'p', 'p', 'p', 'p', 'p', '*',
        '*', '-', '-', '-', '-', '-', '-', '-', '-', '*',
        '*', '*', '*', '*', '*', '*', '*', '*', '*', '*',
        '*', '*', '*', '*', '*', '*', '*', '*', '*', '*'
    ];
  // Magic assignments happens here
  // Starting with diceroll functions
  const dice6 = () => Math.floor(Math.random() * 6) + 1;
  const dice50 = () => Math.floor(Math.random() * 5);
  const dice4 = () => Math.floor(Math.random() * 4) + 1;
  const dice40 = () => Math.floor(Math.random() * 4);
  const dice8 = () => Math.floor(Math.random() * 8);

  //Create an array to keep track of what have been used
  const unfilled = [true, true, true, true, true, true, true, true];

  //First bishop
  const bishOne = dice40() * 2;
  const whiteBishOne = 56 + bishOne;
  $(`#${bishOne}`).html('<a href="#" class="black bishop">&#9821;</a>');
  game.board[game.boardIndex[bishOne]] = 'B';
  $(`#${whiteBishOne}`).html('<a href="#" class="white bishop">&#9821;</a>');
  game.board[game.boardIndex[whiteBishOne]] = 'b';
  unfilled[bishOne] = false;

  //Second bishop
  const bishTwo = 1 + dice40() * 2;
  const whiteBishTwo = 56 + bishTwo;
  $(`#${bishTwo}`).html('<a href="#" class="black bishop">&#9821;</a>');
  game.board[game.boardIndex[bishTwo]] = 'B';
  $(`#${whiteBishTwo}`).html('<a href="#" class="white bishop">&#9821;</a>');
  game.board[game.boardIndex[whiteBishTwo]] = 'b';
  unfilled[bishTwo] = false;

  //Queen time
  let queenPlaced = false;
  while (!queenPlaced) {
    const queenRoll = dice8();
    if (unfilled[queenRoll]) {
      $(`#${queenRoll}`).html('<a href="#" class="black queen">&#9819;</a>');
      game.board[game.boardIndex[queenRoll]] = 'Q';
      $(`#${queenRoll + 56}`).html(
        '<a href="#" class="white queen">&#9819;</a>'
      );
      game.board[game.boardIndex[queenRoll + 56]] = 'q';
      queenPlaced = true;
      unfilled[queenRoll] = false;
    }
  }
  //First knight
  let knight1Placed = false;
  while (!knight1Placed) {
    const knight1Roll = dice8();
    if (unfilled[knight1Roll]) {
      $(`#${knight1Roll}`).html('<a href="#" class="black knight">&#9822;</a>');
      game.board[game.boardIndex[knight1Roll]] = 'N';
      $(`#${knight1Roll + 56}`).html(
        '<a href="#" class="white knight">&#9822;</a>'
      );
      game.board[game.boardIndex[knight1Roll + 56]] = 'n';
      knight1Placed = true;
      unfilled[knight1Roll] = false;
    }
  }
  //second knight
  let knight2Placed = false;
  while (!knight2Placed) {
    const knight2Roll = dice8();
    if (unfilled[knight2Roll]) {
      $(`#${knight2Roll}`).html('<a href="#" class="black knight">&#9822;</a>');
      game.board[game.boardIndex[knight2Roll]] = 'N';
      $(`#${knight2Roll + 56}`).html(
        '<a href="#" class="white knight">&#9822;</a>'
      );
      game.board[game.boardIndex[knight2Roll + 56]] = 'n';
      knight2Placed = true;
      unfilled[knight2Roll] = false;
    }
  }

  //Rooks
  for (let i = 0; i < 8; i += 1) {
    if (unfilled[i]) {
      $(`#${i}`).html('<a href="#" class="black rook">&#9820;</a>');
      game.board[game.boardIndex[i]] = 'R';
      $(`#${i + 56}`).html('<a href="#" class="white rook">&#9820;</a>');
      game.board[game.boardIndex[i + 56]] = 'r';
      unfilled[i] = false;
      break;
    }
  }

  //King
  for (let i = 0; i < 8; i += 1) {
    if (unfilled[i]) {
      $(`#${i}`).html('<a href="#" class="black king">&#9818;</a>');
      game.board[game.boardIndex[i]] = 'K';
      $(`#${i + 56}`).html('<a href="#" class="white king">&#9818;</a>');
      game.board[game.boardIndex[i + 56]] = 'k';
      unfilled[i] = false;
      break;
    }
  }

  for (let i = 0; i < 8; i += 1) {
    if (unfilled[i]) {
      $(`#${i}`).html('<a href="#" class="black rook">&#9820;</a>');
      game.board[game.boardIndex[i]] = 'R';
      $(`#${i + 56}`).html('<a href="#" class="white rook">&#9820;</a>');
      game.board[game.boardIndex[i + 56]] = 'r';
      unfilled[i] = false;
      break;
    }
  }

  //Pawns are static
  $('#48').html('<a href="#" class="white pawn">&#9823;</a>');
  $('#49').html('<a href="#" class="white pawn">&#9823;</a>');
  $('#50').html('<a href="#" class="white pawn">&#9823;</a>');
  $('#51').html('<a href="#" class="white pawn">&#9823;</a>');
  $('#52').html('<a href="#" class="white pawn">&#9823;</a>');
  $('#53').html('<a href="#" class="white pawn">&#9823;</a>');
  $('#54').html('<a href="#" class="white pawn">&#9823;</a>');
  $('#55').html('<a href="#" class="white pawn">&#9823;</a>');
  $('#8').html('<a href="#" class="black pawn">&#9823;</a>');
  $('#9').html('<a href="#" class="black pawn">&#9823;</a>');
  $('#10').html('<a href="#" class="black pawn">&#9823;</a>');
  $('#11').html('<a href="#" class="black pawn">&#9823;</a>');
  $('#12').html('<a href="#" class="black pawn">&#9823;</a>');
  $('#13').html('<a href="#" class="black pawn">&#9823;</a>');
  $('#14').html('<a href="#" class="black pawn">&#9823;</a>');
  $('#15').html('<a href="#" class="black pawn">&#9823;</a>');

  //Update the internal representation as well
  bindEvents();
}

// Takes column (A-H), returns column (0-7)
function colToInt(char) {
  switch (char) {
    case 'A':
      return 0;
    case 'B':
      return 1;
    case 'C':
      return 2;
    case 'D':
      return 3;
    case 'E':
      return 4;
    case 'F':
      return 5;
    case 'G':
      return 6;
    case 'H':
      return 7;
    default:
      break;
  }
  return -1;
}

function getPosArray(id) {
  const posArray = [];
  posArray[0] = colToInt(id.charAt(0));
  posArray[1] = parseInt(id.charAt(1), 10) - 1;
  return posArray;
}

// Basic check of a board
function validateBoard({ length }) {
  if (length !== 120) {
    console.log('Board is the wrong length');
    return;
  } else if ($.grep(board, c => c === '-').length < 32) {
    console.log('Too few empty spaces on the board');
    return;
  } else {
    console.log('Board seems to be fine');
  }
  return;
}

// Prints a board to the console, very useful when testing
function logBoard(aboard) {
  let counter = 0;
  if (aboard === undefined) {
    console.log(`${turn} to move on this board:`);
  }
  const theBoard = aboard || game.board.slice();
  for (let i = 0; i < 12; i += 1) {
    let line = '';
    for (let j = 0; j < 10; j += 1) {
      line = `${line + theBoard[counter]} `;
      counter += 1;
    }
    console.log(line);
  }
}

// Takes board position (0-63), returns readable position (e.g. D6)
// Can be useful for PGN and replays later on
function arrayToReadable(arrayPosition) {
  const row = 8 - Math.floor(arrayPosition / 8);
  const column = intToCol(arrayPosition % 8);

  if (arrayPosition > -1 && arrayPosition < 64) {
    return column + row;
  }

  return 'INVALID POSITION';
}

function castleCheckTest() {
  $('td').html('');
  $('#18').html('<a href="#" class="white rook">&#9820;</a>');
  $('#22').html('<a href="#" class="white rook">&#9820;</a>');
  $('#56').html('<a href="#" class="white rook">&#9820;</a>');
  $('#63').html('<a href="#" class="white rook">&#9820;</a>');

  $('#60').html('<a href="#" class="white king">&#9818;</a>');
  $('#57').html('<a href="#" class="white pawn">&#9823;</a>');

  $('#0').html('<a href="#" class="black rook">&#9820;</a>');
  $('#7').html('<a href="#" class="black rook">&#9820;</a>');
  $('#43').html('<a href="#" class="black rook">&#9820;</a>');
  $('#45').html('<a href="#" class="black rook">&#9820;</a>');

  $('#4').html('<a href="#" class="black king">&#9818;</a>');
  // prettier-ignore
  game.board = [
        '*', '*', '*', '*', '*', '*', '*', '*', '*', '*',
        '*', '*', '*', '*', '*', '*', '*', '*', '*', '*',
        '*', 'R', '-', '-', '-', 'K', '-', '-', 'R', '*',
        '*', '-', '-', '-', '-', '-', '-', '-', '-', '*',
        '*', '-', '-', 'r', '-', '-', '-', 'r', '-', '*',
        '*', '-', '-', '-', '-', '-', '-', '-', '-', '*',
        '*', '-', '-', '-', '-', '-', '-', '-', '-', '*',
        '*', '-', '-', '-', 'R', '-', 'R', '-', '-', '*',
        '*', '-', '-', '-', '-', '-', '-', '-', '-', '*',
        '*', 'r', 'p', '-', '-', 'k', '-', '-', 'r', '*',
        '*', '*', '*', '*', '*', '*', '*', '*', '*', '*',
        '*', '*', '*', '*', '*', '*', '*', '*', '*', '*'
    ];
  bindEvents();
}
