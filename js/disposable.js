// Various pieces of throwaway code, used when testing
// Don't put anything important here

// Used for testing specific board state, copy regular setup and change
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




/* 
CharCodeAt(0):
BLACKS:
A = 65
R = 82

WHITES:
a = 97
r = 114

EMPTY
- = 45

PADDING:
* = 42
*/