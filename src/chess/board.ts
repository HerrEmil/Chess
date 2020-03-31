import { getValid } from './moveGen.js';
import { intToCol } from './util.js';
import { makeMove } from './main.js';

// Simple function to scale a square board.
const scaleBoard = (): void => {
  // Get the lowest of document height and width and substract space for the borders.
  const pik =
    Math.min($(window).height() as number, $(window).width() as number) - 109;
  // Divide by the number of rows, and round down to int.
  const tdSize = Math.floor(pik / $('tr').length);
  const fontSize = tdSize / 25;
  $('#board').css('font-size', `${fontSize}em`);
  $('td')
    .css('width', '')
    .css('height', '')
    .width(tdSize)
    .height(tdSize);
};

// This file deals with functions building, scaling and modifying the board
// eslint-disable-next-line max-statements
export const buildBoard = (): void => {
  // Initialize an empty table
  const tableElement = $('<table />');
  let cellId = 0;
  let rowStartingColor = 'bc';
  // Begin building the table. Note that it iterates from 1, so we can use the iterator as class
  for (let row = 1; row <= 8; row += 1) {
    rowStartingColor = rowStartingColor === 'wc' ? 'bc' : 'wc';
    let cellColor = rowStartingColor;
    // Initialize an empty row
    const rowElement = $('<tr></tr>');
    for (let column = 1; column <= 8; column += 1) {
      // Create the appropriate td element and fill it with a correct label
      const cellElement = $(`<td id="${cellId}" class="${cellColor}"></td>`);
      // Append the td to the row
      rowElement.append(cellElement);
      cellId += 1;
      cellColor = cellColor === 'wc' ? 'bc' : 'wc';
    }
    // Append the row to the table
    tableElement.append(rowElement);
  }
  // Grab the contents of the finished table and replace it with the contents of the #board element.
  $('#board').html(tableElement.html());
  scaleBoard();
};

// Fill board with chess setup.
// eslint-disable-next-line max-statements
export const setBoard = (): void => {
  $('td').html('');
  $('#56').html('<a href="#" class="white rook">&#9820;</a>');
  $('#57').html('<a href="#" class="white knight">&#9822;</a>');
  $('#58').html('<a href="#" class="white bishop">&#9821;</a>');
  $('#59').html('<a href="#" class="white queen">&#9819;</a>');
  $('#60').html('<a href="#" class="white king">&#9818;</a>');
  $('#61').html('<a href="#" class="white bishop">&#9821;</a>');
  $('#62').html('<a href="#" class="white knight">&#9822;</a>');
  $('#63').html('<a href="#" class="white rook">&#9820;</a>');
  $('#48').html('<a href="#" class="white pawn">&#9823;</a>');
  $('#49').html('<a href="#" class="white pawn">&#9823;</a>');
  $('#50').html('<a href="#" class="white pawn">&#9823;</a>');
  $('#51').html('<a href="#" class="white pawn">&#9823;</a>');
  $('#52').html('<a href="#" class="white pawn">&#9823;</a>');
  $('#53').html('<a href="#" class="white pawn">&#9823;</a>');
  $('#54').html('<a href="#" class="white pawn">&#9823;</a>');
  $('#55').html('<a href="#" class="white pawn">&#9823;</a>');
  $('#0').html('<a href="#" class="black rook">&#9820;</a>');
  $('#1').html('<a href="#" class="black knight">&#9822;</a>');
  $('#2').html('<a href="#" class="black bishop">&#9821;</a>');
  $('#3').html('<a href="#" class="black queen">&#9819;</a>');
  $('#4').html('<a href="#" class="black king">&#9818;</a>');
  $('#5').html('<a href="#" class="black bishop">&#9821;</a>');
  $('#6').html('<a href="#" class="black knight">&#9822;</a>');
  $('#7').html('<a href="#" class="black rook">&#9820;</a>');
  $('#8').html('<a href="#" class="black pawn">&#9823;</a>');
  $('#9').html('<a href="#" class="black pawn">&#9823;</a>');
  $('#10').html('<a href="#" class="black pawn">&#9823;</a>');
  $('#11').html('<a href="#" class="black pawn">&#9823;</a>');
  $('#12').html('<a href="#" class="black pawn">&#9823;</a>');
  $('#13').html('<a href="#" class="black pawn">&#9823;</a>');
  $('#14').html('<a href="#" class="black pawn">&#9823;</a>');
  $('#15').html('<a href="#" class="black pawn">&#9823;</a>');
};

// Adds 'valid' CSS class to squares, i.e. turns on highlights
const markValids = (array: number[]): void => {
  const selector = `#${array.join(',#')}`;
  $(selector).addClass('valid');
};

// Horribly long function for creating and positioning the A-H and 1-8 Labels
// eslint-disable-next-line max-statements, max-lines-per-function
export const setLabels = (): void => {
  // Delete old edgeLabels (for resize)
  $('.edgeLabel').remove();

  const cellSize = $('table tr:nth(1)').height() as number;
  const leftPos = parseInt(($('#0').position().left as unknown) as string, 10);
  const topPosLet1 = parseInt(
    ($('#0').position().top as unknown) as string,
    10
  );
  const topPosLet2 =
    parseInt(($('#56').position().top as unknown) as string, 10) + cellSize + 1;
  const fontSize = cellSize / 50;

  for (let index = 0; index < 8; index += 1) {
    const topPos = $(`#${index * 8}`).position().top;
    const leftPosLet = $(`#${index}`).position().left;
    const numLabel = `label${9 - (index + 1)}`;
    const letterLabel = `label${intToCol(index)}`;
    // Set the two numbered cols
    $('#main').append(
      $(
        `<p class="invis ${numLabel} edgeLabel" style="text-align:center;width:40px;top:${topPos}px;left:${leftPos -
          40}px;line-height:${cellSize}px;font-size:${fontSize}em">${9 -
          (index + 1)}</p>`
      )
    );
    $('#main').append(
      $(
        `<p class="invis ${numLabel} edgeLabel" style="text-align:center;width:40px;top:${topPos}px;left:${leftPos +
          cellSize *
            8}px;line-height:${cellSize}px;font-size:${fontSize}em">${9 -
          (index + 1)}</p>`
      )
    );
    // Set the two lettered rows
    $('#main').append(
      $(
        `<p class="invis ${letterLabel} edgeLabel" style="text-align:center;height:40px;top:${topPosLet2}px;left:${leftPosLet}px;line-height:40px;font-size:${fontSize}em;width:${cellSize}px">${intToCol(
          index
        )}</p>`
      )
    );
    $('#main').append(
      $(
        `<p class="invis ${letterLabel} edgeLabel" style="text-align:center;height:40px;top:${topPosLet1 -
          40}px;left:${leftPosLet}px;line-height:40px;font-size:${fontSize}em;width:${cellSize}px">${intToCol(
          index
        )}</p>`
      )
    );
  }
  const blackTopPos = topPosLet1 + cellSize / 2;
  const whiteTopPos = topPosLet2 - cellSize / 2 - cellSize;
  const bothLeftPos = leftPos + cellSize * 8 + 25;
  $('#blackTurn2').css({
    'font-size': `${fontSize * 2}em`,
    height: `${cellSize}px`,
    left: `${bothLeftPos}px`,
    'line-height': `${cellSize}px`,
    top: `${blackTopPos}px`,
    width: `${cellSize}px`
  });
  $('#whiteTurn2').css({
    'font-size': `${fontSize * 2}em`,
    height: `${cellSize}px`,
    left: `${bothLeftPos}px`,
    'line-height': `${cellSize}px`,
    top: `${whiteTopPos}px`,
    width: `${cellSize}px`
  });
};

// eslint-disable-next-line max-lines-per-function
export const bindEvents = (): void => {
  $('#board a')
    .on('mousedown', ({ target }) => {
      const location = parseInt(
        $(target)
          .parent()
          .attr('id') as string,
        10
      );
      window.inHand = location;
      window.mousePos = $(target)
        .parent()
        .addClass('origin');
      markValids(getValid(location, window.game.board));
      return false;
    })
    .draggable({
      containment: $('#board'),
      grid: [
        $('table tr:nth(1)').height() as number,
        $('table tr:nth(1)').height() as number
      ],
      zIndex: 1000
    });

  $('#board td').on('mouseup', ({ target }) => {
    makeMove(
      window.inHand as number,
      parseInt($(target).attr('id') as string, 10),
      false
    );
  });

  $('#board').on('mouseleave', () => {
    $(document).mouseup();
    if (window.inHand !== '') {
      $(`#${window.inHand}`)
        .children('a')
        .attr('style', 'position: relative;');
      window.inHand = '';
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
