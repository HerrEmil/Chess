/*
 * DOM-free self-play harness for the chess engine.
 *
 * Plays the engine against itself so that a candidate evaluation/search change
 * can be measured against the previous engine over many seeded, reproducible
 * games. It reuses the production pure primitives (`negamax`, `applyMove`,
 * `positionKey`, `isInCheck`) so headless game mechanics are identical to the
 * real game — the only thing that varies between the two players is the
 * evaluation function that `negamax` is handed.
 *
 * Everything here is deterministic: `negamax` has no randomness, and opening
 * variety comes from a seeded PRNG, so a given seed always yields the same
 * games.
 */
import { color, evaluate, negamax } from '../../src/chess/ai.js';
import {
  applyMove,
  mailboxIndex,
  positionKey,
  type CastleState,
  type GlobalChess,
} from '../../src/chess/main.js';
import { getAllValidMoves, getPiecesOfColor } from '../../src/chess/util.js';
import { isInCheck } from '../../src/chess/moveGen.js';
import { STARTING_BOARD } from '../../src/chess/__tests__/helpers.js';

export type EngineEval = (b: readonly string[], c: color) => number;

// The two engines under comparison. `newEval` mirrors the piece-square tables
// per color; `legacyEval` reproduces the pre-fix single-orientation behaviour.
export const newEval: EngineEval = (b, c) => evaluate(b, c, true);
export const legacyEval: EngineEval = (b, c) => evaluate(b, c, false);

export type Move = { start: number; goal: number };
export type GameOutcome = 'white' | 'black' | 'draw';
export type GameReason =
  | 'checkmate'
  | 'stalemate'
  | 'repetition'
  | 'fifty-move'
  | 'adjudicated'
  | 'no-move';

export type GameResult = {
  outcome: GameOutcome;
  reason: GameReason;
  plies: number;
};

const ALL_CASTLE: CastleState = {
  whiteShortCastle: true,
  whiteLongCastle: true,
  blackShortCastle: true,
  blackLongCastle: true,
};

const opposite = (c: color): color => (c === 'white' ? 'black' : 'white');

// Deterministic PRNG (mulberry32). Seeded, so games are fully reproducible.
const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return (): number => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

type State = {
  board: readonly string[];
  castle: CastleState;
  enPassantTarget: number | null;
  halfMoveClock: number;
};

const listMoves = (state: State, turn: color): Move[] => {
  const pieces = getPiecesOfColor(state.board, turn);
  const perPiece = getAllValidMoves(
    state.board,
    pieces,
    state.enPassantTarget,
    state.castle,
  );
  const moves: Move[] = [];
  for (let i = 0; i < pieces.length; i += 1) {
    for (const goal of perPiece[i]) moves.push({ start: pieces[i], goal });
  }
  return moves;
};

// Apply a move via the production `applyMove`, then auto-queen any pawn that
// reached the last rank (the DOM layer promotes to queen by default).
const advance = (state: State, turn: color, move: Move): State => {
  const game = {
    board: state.board as string[],
    castle: state.castle,
    enPassantTarget: state.enPassantTarget,
    halfMoveClock: state.halfMoveClock,
  } as unknown as GlobalChess;

  const result = applyMove(game, move.start, move.goal);
  let board = result.board;

  const reachedLastRank =
    (turn === 'white' && move.goal < 8) || (turn === 'black' && move.goal > 55);
  const landed = board[mailboxIndex[move.goal]];
  if (reachedLastRank && landed.toLowerCase() === 'p') {
    board = board.slice();
    board[mailboxIndex[move.goal]] = turn === 'white' ? 'q' : 'Q';
  }

  return {
    board,
    castle: result.castle,
    enPassantTarget: result.enPassantTarget,
    halfMoveClock: result.halfMoveClock,
  };
};

// Base material only (no positional term), for neutral adjudication of games
// that hit the ply cap.
const materialValue = (ch: string): number => {
  switch (ch.toLowerCase()) {
    case 'p':
      return 100;
    case 'n':
    case 'b':
      return 320;
    case 'r':
      return 500;
    case 'q':
      return 900;
    default:
      return 0;
  }
};

const materialDiff = (board: readonly string[]): number => {
  let white = 0;
  let black = 0;
  for (const idx of mailboxIndex) {
    const ch = board[idx];
    if (ch === '-' || ch === '*') continue;
    const v = materialValue(ch);
    if (ch === ch.toLowerCase()) white += v;
    else black += v;
  }
  return white - black;
};

export type PlayGameOptions = {
  whiteEval: EngineEval;
  blackEval: EngineEval;
  depth: number;
  opening?: Move[];
  maxPlies?: number;
};

export const playGame = (opts: PlayGameOptions): GameResult => {
  const maxPlies = opts.maxPlies ?? 200;
  let state: State = {
    board: STARTING_BOARD,
    castle: ALL_CASTLE,
    enPassantTarget: null,
    halfMoveClock: 0,
  };
  let turn: color = 'white';
  const history = new Map<string, number>();

  // Play the (already-legal) opening line to diversify the starting position.
  for (const move of opts.opening ?? []) {
    state = advance(state, turn, move);
    turn = opposite(turn);
  }

  for (let ply = 0; ply < maxPlies; ply += 1) {
    const evalFn = turn === 'white' ? opts.whiteEval : opts.blackEval;
    const best = negamax(
      state.board,
      turn,
      opts.depth,
      -100000,
      100000,
      state.enPassantTarget,
      state.castle,
      history,
      evalFn,
    );
    const start = best[0];
    const goal = best[1];

    if (start < 0 || goal < 0) {
      // No legal move: checkmate (in check) or stalemate.
      if (isInCheck(state.board, turn)) {
        return { outcome: opposite(turn), reason: 'checkmate', plies: ply };
      }
      return { outcome: 'draw', reason: 'stalemate', plies: ply };
    }

    state = advance(state, turn, { start, goal });
    const newTurn = opposite(turn);

    const key = positionKey(
      state.board,
      newTurn,
      state.castle,
      state.enPassantTarget,
    );
    const count = (history.get(key) ?? 0) + 1;
    history.set(key, count);

    if (count >= 3)
      return { outcome: 'draw', reason: 'repetition', plies: ply };
    if (state.halfMoveClock >= 100) {
      return { outcome: 'draw', reason: 'fifty-move', plies: ply };
    }

    turn = newTurn;
  }

  // Hit the ply cap: adjudicate by material (a rook-or-more lead wins).
  const diff = materialDiff(state.board);
  if (diff >= 500)
    return { outcome: 'white', reason: 'adjudicated', plies: maxPlies };
  if (diff <= -500)
    return { outcome: 'black', reason: 'adjudicated', plies: maxPlies };
  return { outcome: 'draw', reason: 'adjudicated', plies: maxPlies };
};

// Build a reproducible opening by playing `plies` seeded-random legal moves
// from the starting position. Stops early if a terminal position is reached.
export const randomOpening = (seed: number, plies: number): Move[] => {
  const rng = mulberry32(seed);
  const opening: Move[] = [];
  let state: State = {
    board: STARTING_BOARD,
    castle: ALL_CASTLE,
    enPassantTarget: null,
    halfMoveClock: 0,
  };
  let turn: color = 'white';

  for (let i = 0; i < plies; i += 1) {
    const moves = listMoves(state, turn);
    if (moves.length === 0) break;
    const move = moves[Math.floor(rng() * moves.length)];
    opening.push(move);
    state = advance(state, turn, move);
    turn = opposite(turn);
  }
  return opening;
};

export type MatchResult = {
  games: number;
  newScore: number;
  oldScore: number;
  newWins: number;
  oldWins: number;
  draws: number;
  reasons: Record<string, number>;
};

/*
 * Run a match of the new engine vs the old engine. Each opening is played
 * twice with colors swapped (new-as-white then old-as-white) so first-move
 * advantage cancels. Score: win = 1, draw = 0.5, loss = 0, summed for the new
 * engine.
 */
export const runMatch = (opts: {
  games: number;
  depth: number;
  seed?: number;
  openingPlies?: number;
  maxPlies?: number;
}): MatchResult => {
  const seed = opts.seed ?? 1;
  const openingPlies = opts.openingPlies ?? 6;
  const openings = Math.ceil(opts.games / 2);

  let newScore = 0;
  let oldScore = 0;
  let newWins = 0;
  let oldWins = 0;
  let draws = 0;
  const reasons: Record<string, number> = {};
  let played = 0;

  const record = (newIsWhite: boolean, result: GameResult): void => {
    reasons[result.reason] = (reasons[result.reason] ?? 0) + 1;
    const newColor: GameOutcome = newIsWhite ? 'white' : 'black';
    if (result.outcome === 'draw') {
      newScore += 0.5;
      oldScore += 0.5;
      draws += 1;
    } else if (result.outcome === newColor) {
      newScore += 1;
      newWins += 1;
    } else {
      oldScore += 1;
      oldWins += 1;
    }
    played += 1;
  };

  for (let o = 0; o < openings && played < opts.games; o += 1) {
    const opening = randomOpening(seed + o, openingPlies);

    record(
      true,
      playGame({
        whiteEval: newEval,
        blackEval: legacyEval,
        depth: opts.depth,
        opening,
        maxPlies: opts.maxPlies,
      }),
    );

    if (played >= opts.games) break;

    record(
      false,
      playGame({
        whiteEval: legacyEval,
        blackEval: newEval,
        depth: opts.depth,
        opening,
        maxPlies: opts.maxPlies,
      }),
    );
  }

  return {
    games: played,
    newScore,
    oldScore,
    newWins,
    oldWins,
    draws,
    reasons,
  };
};
