import { getValid } from './moveGen.js';
import { appState, mailboxIndex, makeMove } from './main.js';

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

const pieceInfo: Record<string, { color: string; html: string; type: string }> =
  {
    B: { color: 'black', html: '&#9821;', type: 'bishop' },
    K: { color: 'black', html: '&#9818;', type: 'king' },
    N: { color: 'black', html: '&#9822;', type: 'knight' },
    P: { color: 'black', html: '&#9823;', type: 'pawn' },
    Q: { color: 'black', html: '&#9819;', type: 'queen' },
    R: { color: 'black', html: '&#9820;', type: 'rook' },
    b: { color: 'white', html: '&#9821;', type: 'bishop' },
    k: { color: 'white', html: '&#9818;', type: 'king' },
    n: { color: 'white', html: '&#9822;', type: 'knight' },
    p: { color: 'white', html: '&#9823;', type: 'pawn' },
    q: { color: 'white', html: '&#9819;', type: 'queen' },
    r: { color: 'white', html: '&#9820;', type: 'rook' },
  };

// Render any board position to the DOM by iterating all 64 squares.
export const setBoardFromState = (board: readonly string[]): void => {
  for (let i = 0; i < 64; i += 1) {
    const cell = document.getElementById(`${i}`)!;
    const ch = board[mailboxIndex[i]];
    const info = pieceInfo[ch];
    cell.innerHTML = info
      ? `<a href="#" class="${info.color} ${info.type}">${info.html}</a>`
      : '';
  }
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
  const board = document.getElementById('board')!;
  let selectedSquare: number | null = null;

  const clearSelection = (): void => {
    document
      .querySelectorAll('.valid')
      .forEach((el) => el.classList.remove('valid'));
    document
      .querySelectorAll('.origin')
      .forEach((el) => el.classList.remove('origin'));
    selectedSquare = null;
    appState.inHand = '';
  };

  const selectPiece = (location: number): void => {
    selectedSquare = location;
    appState.inHand = location;
    document.getElementById(`${location}`)!.classList.add('origin');
    markValids(
      getValid(
        location,
        appState.game.board,
        appState.game.enPassantTarget,
        appState.game.castle,
      ),
    );
  };

  // Prevent native browser drag on <a> elements so mousemove fires during drag
  board.addEventListener('dragstart', (e) => e.preventDefault());

  board.addEventListener('mousedown', (e) => {
    const targetEl = e.target as HTMLElement;
    const targetTd = targetEl.closest('#board td');
    if (!targetTd) return;

    const clickedLocation = parseInt(targetTd.id, 10);
    // --- Path A: a piece is already selected ---
    if (selectedSquare !== null) {
      e.preventDefault();

      // Clicked a valid destination → execute move
      // makeMove checks .valid class and handles cleanup, so don't clearSelection first
      if (targetTd.classList.contains('valid')) {
        const origin = selectedSquare;
        selectedSquare = null;
        makeMove(origin, clickedLocation, false);
        return;
      }

      // Clicked a different own piece → switch selection
      const anchor = targetEl.closest('#board a');
      if (
        anchor instanceof HTMLAnchorElement &&
        anchor.classList.contains(appState.turn)
      ) {
        clearSelection();
        selectPiece(clickedLocation);
        return;
      }

      // Anything else → deselect
      clearSelection();
      return;
    }

    // --- Path B: no selection, need a piece click ---
    const anchor = targetEl.closest('#board a');
    if (!(anchor instanceof HTMLAnchorElement)) return;
    e.preventDefault();

    const cell = targetTd;
    const location = clickedLocation;

    selectPiece(location);

    const boardRect = board.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();
    const cellSize = boardRect.width / 8;
    const startX = e.clientX;
    const startY = e.clientY;
    const ac = new AbortController();

    const onMove = (ev: MouseEvent): void => {
      let dx = ev.clientX - startX;
      let dy = ev.clientY - startY;

      // Clamp so the anchor stays within board bounds
      const minDx = boardRect.left - cellRect.left;
      const maxDx = boardRect.right - cellRect.right;
      const minDy = boardRect.top - cellRect.top;
      const maxDy = boardRect.bottom - cellRect.bottom;
      dx = Math.max(minDx, Math.min(maxDx, dx));
      dy = Math.max(minDy, Math.min(maxDy, dy));

      // Snap to grid
      dx = Math.round(dx / cellSize) * cellSize;
      dy = Math.round(dy / cellSize) * cellSize;

      anchor.style.left = `${dx}px`;
      anchor.style.top = `${dy}px`;
    };

    const startDrag = (): void => {
      anchor.classList.add('dragging');
      anchor.style.position = 'relative';
      anchor.style.zIndex = '1000';
      document.addEventListener('mousemove', onMove, { signal: ac.signal });
    };

    const resetAnchor = (): void => {
      ac.abort();
      anchor.classList.remove('dragging');
      anchor.style.position = '';
      anchor.style.zIndex = '';
      anchor.style.left = '';
      anchor.style.top = '';
    };

    const cancelDrag = (): void => {
      resetAnchor();
      clearSelection();
    };

    let dragging = false;

    const onMouseMove = (ev: MouseEvent): void => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!dragging && Math.hypot(dx, dy) >= 5) {
        dragging = true;
        startDrag();
      }
    };

    const onUp = (ev: MouseEvent): void => {
      ac.abort();
      if (!dragging) {
        // Click (no drag) → keep selection visible for click-to-move
        return;
      }

      resetAnchor();

      // Find the drop target cell under the pointer
      const dropEl = document.elementFromPoint(ev.clientX, ev.clientY);
      const dropTd = dropEl?.closest('#board td') as HTMLElement | null;
      if (dropTd) {
        const origin = selectedSquare!;
        selectedSquare = null;
        makeMove(origin, parseInt(dropTd.id, 10), false);
      } else {
        cancelDrag();
      }
    };

    document.addEventListener('mousemove', onMouseMove, { signal: ac.signal });
    document.addEventListener('mouseup', onUp, {
      once: true,
      signal: ac.signal,
    });
    board.addEventListener(
      'mouseleave',
      () => {
        // Stop listening but keep selection if not dragging
        if (dragging) cancelDrag();
        else ac.abort();
      },
      {
        once: true,
        signal: ac.signal,
      },
    );
  });

  window.addEventListener('resize', () => {
    scaleBoard();
    setLabels();
  });
};
