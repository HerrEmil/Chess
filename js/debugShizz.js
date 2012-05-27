function setTestBoard() {
	'use strict';
	$('td').html('');
	/*$('#56').html('<a href="#" class="white rook">&#9820;</a>');
	$('#57').html('<a href="#" class="white knight">&#9822;</a>');
	$('#58').html('<a href="#" class="white bishop">&#9821;</a>');*/
	$('#11').html('<a href="#" class="white queen">&#9819;</a>');
	$('#60').html('<a href="#" class="white king">&#9818;</a>');
	/*$('#61').html('<a href="#" class="white bishop">&#9821;</a>');
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
	$('#3').html('<a href="#" class="black queen">&#9819;</a>');*/
	$('#6').html('<a href="#" class="black king">&#9818;</a>');
	/*$('#5').html('<a href="#" class="black bishop">&#9821;</a>');
	$('#6').html('<a href="#" class="black knight">&#9822;</a>');
	$('#7').html('<a href="#" class="black rook">&#9820;</a>');
	$('#8').html('<a href="#" class="black pawn">&#9823;</a>');
	$('#9').html('<a href="#" class="black pawn">&#9823;</a>');
	$('#10').html('<a href="#" class="black pawn">&#9823;</a>');
	$('#11').html('<a href="#" class="black pawn">&#9823;</a>');
	$('#12').html('<a href="#" class="black pawn">&#9823;</a>');
	$('#13').html('<a href="#" class="black pawn">&#9823;</a>');
	$('#14').html('<a href="#" class="black pawn">&#9823;</a>');
	$('#15').html('<a href="#" class="black pawn">&#9823;</a>');*/
	game.board = [
		'*', '*', '*', '*', '*', '*', '*', '*', '*', '*',
		'*', '*', '*', '*', '*', '*', '*', '*', '*', '*',
		'*', '-', '-', '-', '-', '-', '-', 'K', '-', '*',
		'*', '-', '-', '-', 'q', '-', '-', '-', '-', '*',
		'*', '-', '-', '-', '-', '-', '-', '-', '-', '*',
		'*', '-', '-', '-', '-', '-', '-', '-', '-', '*',
		'*', '-', '-', '-', '-', '-', '-', '-', '-', '*',
		'*', '-', '-', '-', '-', '-', '-', '-', '-', '*',
		'*', '-', '-', '-', '-', '-', '-', '-', '-', '*',
		'*', '-', '-', '-', '-', 'k', '-', '-', '-', '*',
		'*', '*', '*', '*', '*', '*', '*', '*', '*', '*',
		'*', '*', '*', '*', '*', '*', '*', '*', '*', '*'
	];
	bindEvents();
}

function setBobby() {
	'use strict';
	//Clear off the current pieces
	$('td').html('');
	//Clear all pieces except pawns
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
	var dice6 = function(){ return Math.floor(Math.random()*6)+1;}
	var dice50 = function(){ return Math.floor(Math.random()*5);}
	var dice4 = function(){ return Math.floor(Math.random()*4)+1;}
	var dice40 = function(){ return Math.floor(Math.random()*4);}
	var dice8 = function(){ return Math.floor(Math.random()*8);}

	//Create an array to keep track of what have been used
	var unfilled = [true,true,true,true,true,true,true,true]

	//First bishop
	var bishOne = dice40() * 2;
	var whiteBishOne = 56+bishOne;
	$('#'+bishOne).html('<a href="#" class="black bishop">&#9821;</a>');
	game.board[game.boardIndex[bishOne]] = 'B';
	$('#'+whiteBishOne).html('<a href="#" class="white bishop">&#9821;</a>');
	game.board[game.boardIndex[whiteBishOne]] = 'b';
	unfilled[bishOne] = false;

	//Second bishop
	var bishTwo = 1 + dice40() * 2;
	var whiteBishTwo = 56+bishTwo;
	$('#'+bishTwo).html('<a href="#" class="black bishop">&#9821;</a>');
	game.board[game.boardIndex[bishTwo]] = 'B';
	$('#'+whiteBishTwo).html('<a href="#" class="white bishop">&#9821;</a>');
	game.board[game.boardIndex[whiteBishTwo]] = 'b';
	unfilled[bishTwo] = false;

	//Queen time
	var queenPlaced = false;
	while(!queenPlaced){
		var queenRoll = dice8();
		if(unfilled[queenRoll]){
			$('#'+queenRoll).html('<a href="#" class="black queen">&#9819;</a>');
			game.board[game.boardIndex[queenRoll]] = 'Q';
			$('#'+(queenRoll+56)).html('<a href="#" class="white queen">&#9819;</a>');
			game.board[game.boardIndex[queenRoll+56]] = 'q';
			queenPlaced = true;
			unfilled[queenRoll] = false;
		}
	}
	//First knight
	var knight1Placed = false;
	while(!knight1Placed){
		var knight1Roll = dice8();
		if(unfilled[knight1Roll]){
			$('#'+knight1Roll).html('<a href="#" class="black knight">&#9822;</a>');
			game.board[game.boardIndex[knight1Roll]] = 'N';
			$('#'+(knight1Roll+56)).html('<a href="#" class="white knight">&#9822;</a>');
			game.board[game.boardIndex[knight1Roll+56]] = 'n';
			knight1Placed = true;
			unfilled[knight1Roll] = false;
		}
	}
	//second knight
	var knight2Placed = false;
	while(!knight2Placed){
		var knight2Roll = dice8();
		if(unfilled[knight2Roll]){
			$('#'+knight2Roll).html('<a href="#" class="black knight">&#9822;</a>');
			game.board[game.boardIndex[knight2Roll]] = 'N';
			$('#'+(knight2Roll+56)).html('<a href="#" class="white knight">&#9822;</a>');
			game.board[game.boardIndex[knight2Roll+56]] = 'n';
			knight2Placed = true;
			unfilled[knight2Roll] = false;
		}
	}

	//Rooks
	var i =0;
	for(i;i<8;i++){
		if(unfilled[i]){
			$('#'+i).html('<a href="#" class="black rook">&#9820;</a>');
			game.board[game.boardIndex[i]] = 'R';
			$('#'+(i+56)).html('<a href="#" class="white rook">&#9820;</a>');
			game.board[game.boardIndex[i+56]] = 'r';
			unfilled[i] = false;
			break;
		}
	}

	//King
	var i =0;
	for(i;i<8;i++){
		if(unfilled[i]){
			$('#'+i).html('<a href="#" class="black king">&#9818;</a>');
			game.board[game.boardIndex[i]] = 'K';
			$('#'+(i+56)).html('<a href="#" class="white king">&#9818;</a>');
			game.board[game.boardIndex[i+56]] = 'k';
			unfilled[i] = false;
			break;
		}
	}

	var i =0;
	for(i;i<8;i++){
		if(unfilled[i]){
			$('#'+i).html('<a href="#" class="black rook">&#9820;</a>');
			game.board[game.boardIndex[i]] = 'R';
			$('#'+(i+56)).html('<a href="#" class="white rook">&#9820;</a>');
			game.board[game.boardIndex[i+56]] = 'r';
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
	
	//Update the internal representation aswell
	
	bindEvents();
}