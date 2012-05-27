function checkCheck(defender) {
	'use strict';
	//Set local variables needed for computation
	var king = $('.' + defender + '.king'),
		opponent = defender === "white" ? "black" : "white",
		pos = piece.parent().attr('id'),
		col = colToInt(startingPosition.charAt(0)), //convert to a number. Currently 0 for A, 7 for H
		row = parseInt(startingPosition.charAt(1), 10), //convert to a number. 1 for 1, 8 for 8 (durrr)
	//These four are used for traversing
		colUp = col,
		colDown = col,
		rowUp = row,
		rowDown = row,
	// These 8 are used to check if the direction has encountered a unit
		rightDone = false,
		leftDone = false,
		upDone = false,
		downDone = false,
		upRightDone = false,
		downRightDone = false,
		upLeftDone = false,
		downLeftDone = false,
		i,
		rightPiece,
		leftPiece,
		upPiece,
		downPiece,
		upRightPiece,
		downRightPiece,
		upLeftPiece,
		downLeftPiece,
		classes;
	//Spread out and find all pieces on same rank, file or diagonal. Only 7 steps are needed
	for (i = 0; i < 7; i += 1) {
		//Take a step in each direction
		colUp += 1;
		colDown -= 1;
		rowUp += 1;
		rowDown -= 1;
		//Get contents of all surrounding cells
		rightPiece = $('#' + colUp + (row)).html();
		leftPiece = $('#' + colDown + (row)).html();
		upPiece = $('#' + col + (rowUp)).html();
		downPiece = $('#' + col + (rowDown)).html();
		upRightPiece = $('#' + colUp + (rowUp)).html();
		downRightPiece = $('#' + colUp + (rowDown)).html();
		upLeftPiece = $('#' + colDown + (rowUp)).html();
		downLeftPiece = $('#' + colDown + (rowDown)).html();

		//Right: Rook and Queen
		if (rightPiece !== false) {
			classes = $(rightPiece).attr('class').split(' ');
			if ($.inArray(defender, classes) >= 0) {
				rightDone = true;
			} else if ($.inArray('rook', classes) >= 0 || $.inArray('queen', classes) >= 0) {
				$(rightPiece).parent().addClass('checking');
			}
		}

	}
	//do a knight check

}