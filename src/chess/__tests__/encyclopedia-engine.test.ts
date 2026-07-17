import { describe, it, expect } from 'vitest';
import {
  fenToPosition,
  legalMovesFrom,
  indexToSquare,
  squareToIndex,
} from '../../encyclopedia/scripts/chess.mjs';

/*
 * Unit gate for the encyclopedia's INDEPENDENT engine (chess.mjs).
 *
 * encyclopedia.test.ts checks the *data*: it replays every stored line through
 * the game's own move generator. That catches a bad line, but it cannot catch a
 * chess.mjs that is wrong in a way the data happens not to exercise -- and a
 * silently-wrong second engine defeats the whole point of deriving with one
 * engine and verifying with the other.
 *
 * The regression pinned here: legalMovesFrom used to filter with a hardcoded
 * promo of 'q', so makeMove dropped a queen on the destination of EVERY move it
 * tested. For a king move that erased the king, kingIndex returned -1, and
 * isAttacked then probed the nonsense square (file -1, rank -1) -- whose rays
 * happen to graze real squares like a8. King legality came back arbitrary in
 * both directions, which is precisely what endgame entries lean on.
 */

const legalFrom = (fen: string, square: string): string[] =>
  legalMovesFrom(fenToPosition(fen), squareToIndex(square))
    .map(indexToSquare)
    .sort();

describe('encyclopedia engine: king safety', () => {
  it('does not let a king walk into check', () => {
    // Black Kh8; the g2 rook covers the whole g-file, so only h7 is legal.
    expect(legalFrom('7k/8/8/8/8/8/6R1/6K1 b - - 0 1', 'h8')).toEqual(['h7']);
  });

  it('finds a checked king its escapes past a phantom-square false positive', () => {
    // White Kh1 is checked by the h8 rook. The a8 queen's long diagonal is
    // blocked by the d5 pawn, so g1 and g2 are both safe. The old bug reported
    // zero escapes here (the a8 queen "attacked" the erased king's -1 square).
    expect(legalFrom('q6r/8/8/3P4/8/8/8/7K w - - 0 1', 'h1')).toEqual([
      'g1',
      'g2',
    ]);
  });

  it('still lets a pawn promote on the back rank', () => {
    expect(legalFrom('8/4P3/8/8/8/8/8/K6k w - - 0 1', 'e7')).toEqual(['e8']);
  });

  it('keeps a pinned piece pinned', () => {
    // The e2 knight is pinned against Ke1 by the e8 rook and cannot move.
    expect(legalFrom('4r3/8/8/8/8/8/4N3/4K3 w - - 0 1', 'e2')).toEqual([]);
  });
});
