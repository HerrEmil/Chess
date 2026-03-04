import { describe, it, expect } from 'vitest';
import { AI } from '../ai.js';

describe('AI piece-square tables', () => {
  it('pawnTable has 64 entries', () => {
    expect(AI.pawnTable).toHaveLength(64);
  });

  it('knightTable has 64 entries', () => {
    expect(AI.knightTable).toHaveLength(64);
  });

  it('bishopTable has 64 entries', () => {
    expect(AI.bishopTable).toHaveLength(64);
  });

  it('kingTable has 64 entries', () => {
    expect(AI.kingTable).toHaveLength(64);
  });

  it('kingTableEndGame has 64 entries', () => {
    expect(AI.kingTableEndGame).toHaveLength(64);
  });

  it('pawn promotion row has high values', () => {
    // First 8 values (rank 8 for white, promotion row)
    for (let i = 0; i < 8; i++) {
      expect(AI.pawnTable[i]).toBeGreaterThan(800);
    }
  });

  it('knight table penalizes edges', () => {
    // Corners should be negative
    expect(AI.knightTable[0]).toBeLessThan(0);
    expect(AI.knightTable[7]).toBeLessThan(0);
    expect(AI.knightTable[56]).toBeLessThan(0);
    expect(AI.knightTable[63]).toBeLessThan(0);
    // Center should be positive
    expect(AI.knightTable[27]).toBeGreaterThan(0);
    expect(AI.knightTable[28]).toBeGreaterThan(0);
  });

  it('bishop table penalizes corners', () => {
    expect(AI.bishopTable[0]).toBeLessThan(0);
    expect(AI.bishopTable[7]).toBeLessThan(0);
  });

  it('king table encourages castled position in middlegame', () => {
    // g1/h1 area should be positive (castled king)
    expect(AI.kingTable[62]).toBeGreaterThan(0); // g1
    expect(AI.kingTable[63]).toBeGreaterThan(0); // h1 -- actually let me check
    // Row 6 (rank 2): index 48-55, row 7 (rank 1): 56-63
    expect(AI.kingTable[56]).toBeGreaterThan(0); // a1
  });

  it('king endgame table encourages center', () => {
    // Center squares should be highest
    expect(AI.kingTableEndGame[27]).toBeGreaterThan(AI.kingTableEndGame[0]);
    expect(AI.kingTableEndGame[28]).toBeGreaterThan(AI.kingTableEndGame[7]);
  });
});

describe('AI difficulty settings', () => {
  it('default ply values are -1 (unset)', () => {
    expect(AI.whitePly).toBe(-1);
    expect(AI.blackPly).toBe(-1);
  });

  it('ply can be set to valid depth levels', () => {
    const original = AI.whitePly;
    AI.whitePly = 3;
    expect(AI.whitePly).toBe(3);
    AI.whitePly = original;
  });
});
