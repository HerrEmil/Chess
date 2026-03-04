import { getValid } from './moveGen.js';
import { appState, makeMove } from './main.js';

// Takes a column (0-7) and returns column label (A-H)
export const intToCol = (charInt: number): string => 'ABCDEFGH'.charAt(charInt);

// Simple function to scale a square board.
const scaleBoard = (): void => {
  // Get the lowest of document height and width and substract space for the borders.
  const pik = Math.min(window.innerHeight, window.innerWidth) - 109;
  // Divide by the number of rows, and round down to int.
  const tdSize = Math.floor(pik / document.querySelectorAll('tr').length);
  const fontSize = tdSize / 25;
  document.getElementById('board')!.style.fontSize = `${fontSize}em`;
  document.querySelectorAll<HTMLElement>('td').forEach((td) => {
    td.style.width = `${tdSize}px`;
    td.style.height = `${tdSize}px`;
  });
};

// This file deals with functions building, scaling and modifying the board
export const buildBoard = (): void => {
  // Initialize an empty table
  const tableElement = document.createElement('table');
  let cellId = 0;
  let rowStartingColor = 'bc';
  // Begin building the table. Note that it iterates from 1, so we can use the iterator as class
  for (let row = 1; row <= 8; row += 1) {
    rowStartingColor = rowStartingColor === 'wc' ? 'bc' : 'wc';
    let cellColor = rowStartingColor;
    // Initialize an empty row
    const rowElement = document.createElement('tr');
    for (let column = 1; column <= 8; column += 1) {
      // Create the appropriate td element and fill it with a correct label
      const cellElement = document.createElement('td');
      cellElement.id = `${cellId}`;
      cellElement.className = cellColor;
      // Append the td to the row
      rowElement.appendChild(cellElement);
      cellId += 1;
      cellColor = cellColor === 'wc' ? 'bc' : 'wc';
    }
    // Append the row to the table
    tableElement.appendChild(rowElement);
  }
  // Grab the contents of the finished table and replace it with the contents of the #board element.
  document.getElementById('board')!.innerHTML = tableElement.innerHTML;
  scaleBoard();
};

// Fill board with chess setup.
export const setBoard = (): void => {
  document.querySelectorAll('td').forEach((td) => {
    td.innerHTML = '';
  });
  document.getElementById('56')!.innerHTML =
    '<a href="#" class="white rook">&#9820;</a>';
  document.getElementById('57')!.innerHTML =
    '<a href="#" class="white knight">&#9822;</a>';
  document.getElementById('58')!.innerHTML =
    '<a href="#" class="white bishop">&#9821;</a>';
  document.getElementById('59')!.innerHTML =
    '<a href="#" class="white queen">&#9819;</a>';
  document.getElementById('60')!.innerHTML =
    '<a href="#" class="white king">&#9818;</a>';
  document.getElementById('61')!.innerHTML =
    '<a href="#" class="white bishop">&#9821;</a>';
  document.getElementById('62')!.innerHTML =
    '<a href="#" class="white knight">&#9822;</a>';
  document.getElementById('63')!.innerHTML =
    '<a href="#" class="white rook">&#9820;</a>';
  document.getElementById('48')!.innerHTML =
    '<a href="#" class="white pawn">&#9823;</a>';
  document.getElementById('49')!.innerHTML =
    '<a href="#" class="white pawn">&#9823;</a>';
  document.getElementById('50')!.innerHTML =
    '<a href="#" class="white pawn">&#9823;</a>';
  document.getElementById('51')!.innerHTML =
    '<a href="#" class="white pawn">&#9823;</a>';
  document.getElementById('52')!.innerHTML =
    '<a href="#" class="white pawn">&#9823;</a>';
  document.getElementById('53')!.innerHTML =
    '<a href="#" class="white pawn">&#9823;</a>';
  document.getElementById('54')!.innerHTML =
    '<a href="#" class="white pawn">&#9823;</a>';
  document.getElementById('55')!.innerHTML =
    '<a href="#" class="white pawn">&#9823;</a>';
  document.getElementById('0')!.innerHTML =
    '<a href="#" class="black rook">&#9820;</a>';
  document.getElementById('1')!.innerHTML =
    '<a href="#" class="black knight">&#9822;</a>';
  document.getElementById('2')!.innerHTML =
    '<a href="#" class="black bishop">&#9821;</a>';
  document.getElementById('3')!.innerHTML =
    '<a href="#" class="black queen">&#9819;</a>';
  document.getElementById('4')!.innerHTML =
    '<a href="#" class="black king">&#9818;</a>';
  document.getElementById('5')!.innerHTML =
    '<a href="#" class="black bishop">&#9821;</a>';
  document.getElementById('6')!.innerHTML =
    '<a href="#" class="black knight">&#9822;</a>';
  document.getElementById('7')!.innerHTML =
    '<a href="#" class="black rook">&#9820;</a>';
  document.getElementById('8')!.innerHTML =
    '<a href="#" class="black pawn">&#9823;</a>';
  document.getElementById('9')!.innerHTML =
    '<a href="#" class="black pawn">&#9823;</a>';
  document.getElementById('10')!.innerHTML =
    '<a href="#" class="black pawn">&#9823;</a>';
  document.getElementById('11')!.innerHTML =
    '<a href="#" class="black pawn">&#9823;</a>';
  document.getElementById('12')!.innerHTML =
    '<a href="#" class="black pawn">&#9823;</a>';
  document.getElementById('13')!.innerHTML =
    '<a href="#" class="black pawn">&#9823;</a>';
  document.getElementById('14')!.innerHTML =
    '<a href="#" class="black pawn">&#9823;</a>';
  document.getElementById('15')!.innerHTML =
    '<a href="#" class="black pawn">&#9823;</a>';
};

// Adds 'valid' CSS class to squares, i.e. turns on highlights
const markValids = (array: readonly number[]): void => {
  for (const id of array) {
    document.getElementById(`${id}`)?.classList.add('valid');
  }
};

// Horribly long function for creating and positioning the A-H and 1-8 Labels
export const setLabels = (): void => {
  // Delete old edgeLabels (for resize)
  document.querySelectorAll('.edgeLabel').forEach((el) => el.remove());

  const firstCell = document.getElementById('0')!;
  const { scrollX, scrollY } = window;
  const firstRect = firstCell.getBoundingClientRect();
  const cellSize = firstRect.height;
  const leftPos = firstRect.left + scrollX;
  const topPosLet1 = firstRect.top + scrollY;
  const topPosLet2 =
    document.getElementById('56')!.getBoundingClientRect().top +
    scrollY +
    cellSize +
    1;
  const fontSize = cellSize / 50;

  const mainEl = document.getElementById('main')!;

  for (let index = 0; index < 8; index += 1) {
    const topPos =
      document.getElementById(`${index * 8}`)!.getBoundingClientRect().top +
      scrollY;
    const leftPosLet =
      document.getElementById(`${index}`)!.getBoundingClientRect().left +
      scrollX;
    const numLabel = `label${9 - (index + 1)}`;
    const letterLabel = `label${intToCol(index)}`;
    // Set the two numbered cols
    mainEl.insertAdjacentHTML(
      'beforeend',
      `<p class="invis ${numLabel} edgeLabel" style="text-align:center;width:40px;top:${topPos}px;left:${
        leftPos - 40
      }px;line-height:${cellSize}px;font-size:${fontSize}em">${
        9 - (index + 1)
      }</p>`,
    );
    mainEl.insertAdjacentHTML(
      'beforeend',
      `<p class="invis ${numLabel} edgeLabel" style="text-align:center;width:40px;top:${topPos}px;left:${
        leftPos + cellSize * 8
      }px;line-height:${cellSize}px;font-size:${fontSize}em">${
        9 - (index + 1)
      }</p>`,
    );
    // Set the two lettered rows
    mainEl.insertAdjacentHTML(
      'beforeend',
      `<p class="invis ${letterLabel} edgeLabel" style="text-align:center;height:40px;top:${topPosLet2}px;left:${leftPosLet}px;line-height:40px;font-size:${fontSize}em;width:${cellSize}px">${intToCol(
        index,
      )}</p>`,
    );
    mainEl.insertAdjacentHTML(
      'beforeend',
      `<p class="invis ${letterLabel} edgeLabel" style="text-align:center;height:40px;top:${
        topPosLet1 - 40
      }px;left:${leftPosLet}px;line-height:40px;font-size:${fontSize}em;width:${cellSize}px">${intToCol(
        index,
      )}</p>`,
    );
  }
  const blackTopPos = topPosLet1 + cellSize / 2;
  const whiteTopPos = topPosLet2 - cellSize / 2 - cellSize;
  const bothLeftPos = leftPos + cellSize * 8 + 25;

  for (const [id, topPos] of [
    ['blackTurn2', blackTopPos],
    ['whiteTurn2', whiteTopPos],
  ] as const) {
    const el = document.getElementById(id)!;
    el.style.fontSize = `${fontSize * 2}em`;
    el.style.height = `${cellSize}px`;
    el.style.left = `${bothLeftPos}px`;
    el.style.lineHeight = `${cellSize}px`;
    el.style.top = `${topPos}px`;
    el.style.width = `${cellSize}px`;
  }
};

export const bindEvents = (): void => {
  $('#board a')
    .on('mousedown', ({ target }) => {
      const location = parseInt($(target).parent().attr('id') as string, 10);
      appState.inHand = location;
      appState.mousePos = $(target).parent().addClass('origin');
      markValids(
        getValid(
          location,
          appState.game.board,
          appState.game.enPassantTarget,
          appState.game.castle,
        ),
      );
      return false;
    })
    .draggable({
      containment: $('#board'),
      grid: [
        $('table tr:nth(1)').height() as number,
        $('table tr:nth(1)').height() as number,
      ],
      zIndex: 1000,
    });

  $('#board td').on('mouseup', ({ target }) => {
    makeMove(
      appState.inHand as number,
      parseInt($(target).attr('id') as string, 10),
      false,
    );
  });

  $('#board').on('mouseleave', () => {
    $(document).mouseup();
    if (appState.inHand !== '') {
      $(`#${appState.inHand}`)
        .children('a')
        .attr('style', 'position: relative;');
      appState.inHand = '';
    }

    $('.valid').removeClass('valid');
    $('.attack').removeClass('attack');
    $('.origin').removeClass('origin');
  });

  // Re-scale on window resize
  $(window).resize(() => {
    scaleBoard();
    setLabels();
  });
};
