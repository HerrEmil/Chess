import { describe, it, expect, beforeEach } from 'vitest';
import { AI } from '../ai.js';
import {
  appState,
  saveGame,
  restoreGame,
  clearSavedGame,
  type CastleState,
} from '../main.js';
import { STARTING_BOARD } from './helpers.js';

const midGameCastle: CastleState = {
  whiteShortCastle: true,
  whiteLongCastle: false,
  blackShortCastle: false,
  blackLongCastle: true,
};

beforeEach(() => {
  localStorage.clear();
  // Reset appState to defaults
  appState.game.board = STARTING_BOARD.slice();
  appState.game.castle = {
    whiteShortCastle: true,
    whiteLongCastle: true,
    blackShortCastle: true,
    blackLongCastle: true,
  };
  appState.game.enPassantTarget = null;
  appState.game.halfMoveClock = 0;
  appState.game.positionHistory = new Map();
  appState.game.blackAI = false;
  appState.game.whiteAI = false;
  appState.turn = 'white';
  AI.whitePly = 3;
  AI.blackPly = 3;
});

describe('saveGame + restoreGame round-trip', () => {
  it('preserves all state fields', () => {
    appState.game.castle = midGameCastle;
    appState.game.enPassantTarget = 20;
    appState.game.halfMoveClock = 7;
    appState.game.positionHistory.set('pos1', 1);
    appState.game.positionHistory.set('pos2', 2);
    appState.game.blackAI = true;
    appState.game.whiteAI = false;
    appState.turn = 'black';
    AI.whitePly = 5;
    AI.blackPly = 2;

    const boardSnapshot = appState.game.board.slice();

    saveGame();

    // Mutate everything to prove restore overwrites
    appState.game.board = [];
    appState.game.castle = {
      whiteShortCastle: false,
      whiteLongCastle: false,
      blackShortCastle: false,
      blackLongCastle: false,
    };
    appState.game.enPassantTarget = null;
    appState.game.halfMoveClock = 0;
    appState.game.positionHistory = new Map();
    appState.game.blackAI = false;
    appState.game.whiteAI = true;
    appState.turn = 'white';
    AI.whitePly = 1;
    AI.blackPly = 1;

    const restored = restoreGame();

    expect(restored).toBe(true);
    expect(appState.game.board).toEqual(boardSnapshot);
    expect(appState.game.castle).toEqual(midGameCastle);
    expect(appState.game.enPassantTarget).toBe(20);
    expect(appState.game.halfMoveClock).toBe(7);
    expect(appState.game.blackAI).toBe(true);
    expect(appState.game.whiteAI).toBe(false);
    expect(appState.turn).toBe('black');
    expect(AI.whitePly).toBe(5);
    expect(AI.blackPly).toBe(2);
  });
});

describe('restoreGame', () => {
  it('returns false when nothing is saved', () => {
    expect(restoreGame()).toBe(false);
  });

  it('returns false on corrupt data', () => {
    localStorage.setItem('chessGame', 'not json{{{');
    expect(restoreGame()).toBe(false);
  });
});

describe('clearSavedGame', () => {
  it('removes the key from localStorage', () => {
    saveGame();
    expect(localStorage.getItem('chessGame')).not.toBeNull();
    clearSavedGame();
    expect(localStorage.getItem('chessGame')).toBeNull();
  });
});

describe('positionHistory Map serialization', () => {
  it('survives round-trip through JSON', () => {
    appState.game.positionHistory.set('abc 123', 2);
    appState.game.positionHistory.set('def 456', 1);

    saveGame();

    appState.game.positionHistory = new Map();
    restoreGame();

    expect(appState.game.positionHistory).toBeInstanceOf(Map);
    expect(appState.game.positionHistory.get('abc 123')).toBe(2);
    expect(appState.game.positionHistory.get('def 456')).toBe(1);
    expect(appState.game.positionHistory.size).toBe(2);
  });
});
