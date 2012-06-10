/* 
This file deals with functions building, scaling and modifying the board
*/
function buildBoard() {
	'use strict';
	var rows = 8,
		cols = 8,
		table = $('<table />'), //Initialize an empty table
		counter = 0,
		cellColor = 'bc',
		i,
		internalCellColor,
		row,
		j,
		cell;
	//Begin building the table. Note that it iterates from 1, so we can use the iterator as class
	for (i = 1; i <= rows; i += 1) {
		cellColor = cellColor === 'wc' ? 'bc' : 'wc';
		internalCellColor = cellColor;
		row = $('<tr></tr>'); //Initialize an empty row
		for (j = 1; j <= cols; j += 1) {
			cell = $('<td id="' + counter + '" class="' + internalCellColor + '"></td>'); //Create the appropriate td element and fill it with a correct label
			row.append(cell); //Append the td to the row
			counter += 1;
			internalCellColor = internalCellColor === 'wc' ? 'bc' : 'wc';
		}
		table.append(row); //Append the row to the table
	}
	$('#board').html(table.html()); //Grab the contents of the finished table and replace it with the contents of the #board element.
	scaleBoard(); //Scale it.
}
//Fill board with chess setup.
function setBoard() {
	'use strict';
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
}
//Simple function to scale a square board.
function scaleBoard() {
	var pik = Math.min($(window).height(), $(window).width()) - 109, //Get the lowest of document height and width and substract space for the borders.
		fontSize;
	tdSize = Math.floor(pik / $('tr').length); //Divide by the number of rows, and round down to int.
	fontSize = tdSize / 25;
	$('#board').css('font-size', fontSize + 'em');
	$('td').css('width', '').css('height', '').width(tdSize).height(tdSize); //Apply square dimensions to all TD elements
}

function bindEvents() {
	'use strict';
	var board = $('#board');

	// Make pieces draggable
	$('#board a').on('mousedown', function () {
		var location = parseInt($(this).parent().attr('id'), 10);
		inHand = location;
		mousePos = $(this).parent();
		mousePos.addClass('origin');
		markValids(getValid(location, game.board));
		return false;
	}).draggable({
		containment: $('#board'),
		grid: [$('table tr:nth(1)').height(), $('table tr:nth(1)').height()],
		zIndex: 1000
	});

	// Make move on mouse up
	$('#board td').on('mouseup', function () {
		makeMove(inHand, $(this), false);
	});

	// Return piece in hand and clear highlights when cursor leaves board
	$('#board').on('mouseleave', function () {
		$(document).mouseup();
		if (inHand !== '') {
			$('#' + inHand).children('a').attr('style', 'position: relative;');
		}
		// Clear hand
		if (inHand !== '') {
			inHand = '';
		}
		// Clear square highlights
		$('.valid').removeClass('valid');
		$('.attack').removeClass('attack');
		$('.origin').removeClass('origin');
	});

	// Re-scale on window resize
	$(window).resize(function () {
		scaleBoard();
		setLabels();
	});
}

//Horribly long function for creating and positioning the A-H and 1-8 Labels
function setLabels() {
	'use strict';
	// Delete old edgeLabels (for resize)
	$(".edgeLabel").remove();

	var cellSize = $('table tr:nth(1)').height(),
		leftPos = parseInt($('#0').position().left, 10),
		topPosLet1 = parseInt($('#0').position().top, 10),
		topPosLet2 = parseInt($('#56').position().top, 10) + cellSize + 1,
		fontSize = (cellSize / 50),
		i,
		topPos,
		leftPosLet,
		numLabel,
		letterLabel,
		blackTopPos,
		whiteTopPos,
		bothLeftPos;
	for (i = 0; i < 8; i += 1) {
		topPos = $('#' + (i * 8)).position().top;
		leftPosLet = $('#' + i).position().left;
		numLabel = 'label' + (9 - (i + 1));
		letterLabel = 'label' + intToCol(i);
		//Set the two numbered cols
		$('#main').append($('<p class="invis ' + numLabel + ' edgeLabel' + '" style="text-align:center;width:40px;top:' + topPos + 'px;left:' + (leftPos - 40) + 'px;line-height:' + cellSize + 'px;font-size:' + fontSize + 'em">' + (9 - (i + 1)) + '</p>'));
		$('#main').append($('<p class="invis ' + numLabel + ' edgeLabel' + '" style="text-align:center;width:40px;top:' + topPos + 'px;left:' + ((leftPos + (cellSize * 8))) + 'px;line-height:' + cellSize + 'px;font-size:' + fontSize + 'em">' + (9 - (i + 1)) + '</p>'));
		//Set the two lettered rows
		$('#main').append($('<p class="invis ' + letterLabel + ' edgeLabel' + '" style="text-align:center;height:40px;top:' + topPosLet2 + 'px;left:' + leftPosLet + 'px;line-height:40px;font-size:' + fontSize + 'em;width:' + cellSize + 'px">' + intToCol(i) + '</p>'));
		$('#main').append($('<p class="invis ' + letterLabel + ' edgeLabel' + '" style="text-align:center;height:40px;top:' + (topPosLet1 - 40) + 'px;left:' + leftPosLet + 'px;line-height:40px;font-size:' + fontSize + 'em;width:' + cellSize + 'px">' + intToCol(i) + '</p>'));
	}
	blackTopPos = topPosLet1 + (cellSize / 2);
	whiteTopPos = topPosLet2 - (cellSize / 2) - cellSize;
	bothLeftPos = leftPos + (cellSize * 8) + 25;
	$('#blackTurn2').css({
		'width' : cellSize + 'px',
		'height' : cellSize + 'px',
		'top' : blackTopPos + 'px',
		'left' : bothLeftPos + 'px',
		'font-size' : fontSize * 2 + 'em',
		'line-height' : cellSize + 'px'
	});
	$('#whiteTurn2').css({
		'width' : cellSize + 'px',
		'height' : cellSize + 'px',
		'top' : whiteTopPos + 'px',
		'left' : bothLeftPos + 'px',
		'font-size' : fontSize * 2 + 'em',
		'line-height' : cellSize + 'px'
	});

}

// Adds 'valid' CSS class to squares, i.e. turns on highlights
function markValids(array) {
	'use strict';
	var selector = '#' + array.join(',#');
	$(selector).addClass('valid');
}