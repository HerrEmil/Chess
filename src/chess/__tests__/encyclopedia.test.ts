import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { getValid } from '../moveGen.js';
import {
  applyMove,
  mailboxIndex,
  type CastleState,
  type GlobalChess,
} from '../main.js';

/*
 * Correctness gate for the opening encyclopedia (src/encyclopedia/data/*.json).
 *
 * The data is authored + FEN-cached by an INDEPENDENT engine
 * (src/encyclopedia/scripts/chess.mjs). Here we re-verify every entry through
 * the game's OWN move generator: each stored { from, to } must be legal per
 * getValid, and replaying the whole line must reproduce the stored standard
 * FEN. Two independent engines agreeing on every line makes a hallucinated or
 * corrupted move impossible to ship.
 *
 * Board-index convention (shared with the engine): 0 = a8 .. 63 = h1.
 * Repo board casing is INVERTED from standard FEN: lowercase = white.
 */

const FILES = 'abcdefgh';

interface Move {
  san: string;
  from: number;
  to: number;
  promo?: string;
}

interface Entry {
  slug: string;
  name: string;
  line: string;
  startFen: string;
  moves: Move[];
  fen: string;
}

interface RepoState {
  board: string[];
  active: 'w' | 'b';
  castle: CastleState;
  ep: number | null;
  half: number;
  full: number;
}

const swapCase = (ch: string): string =>
  ch === ch.toLowerCase() ? ch.toUpperCase() : ch.toLowerCase();

const algToIndex = (sq: string): number => {
  const file = FILES.indexOf(sq[0]);
  const rank = Number(sq[1]);
  return (8 - rank) * 8 + file;
};

const indexToAlg = (i: number): string =>
  `${FILES[i % 8]}${String(8 - Math.floor(i / 8))}`;

// Parse a standard FEN into the repo's mailbox board + game flags.
const fenToRepo = (fen: string): RepoState => {
  const parts = fen.trim().split(/\s+/u);
  const placement = parts[0];
  const active = parts[1] === 'b' ? 'b' : 'w';
  const castling = parts[2];
  const epField = parts[3];
  const half = Number(parts[4]);
  const full = Number(parts[5]);

  const board: string[] = new Array<string>(120).fill('*');
  for (let i = 0; i < 64; i += 1) board[mailboxIndex[i]] = '-';
  const ranks = placement.split('/');
  for (let r = 0; r < 8; r += 1) {
    let file = 0;
    for (const ch of ranks[r]) {
      if (ch >= '1' && ch <= '8') {
        file += Number(ch);
      } else {
        board[mailboxIndex[r * 8 + file]] = swapCase(ch);
        file += 1;
      }
    }
  }

  return {
    board,
    active,
    castle: {
      whiteShortCastle: castling.includes('K'),
      whiteLongCastle: castling.includes('Q'),
      blackShortCastle: castling.includes('k'),
      blackLongCastle: castling.includes('q'),
    },
    ep: epField === '-' ? null : algToIndex(epField),
    half,
    full,
  };
};

// Re-serialise the repo state back into a standard FEN for comparison.
const repoToStandardFen = (st: RepoState): string => {
  const rows: string[] = [];
  for (let r = 0; r < 8; r += 1) {
    let row = '';
    let empty = 0;
    for (let f = 0; f < 8; f += 1) {
      const ch = st.board[mailboxIndex[r * 8 + f]];
      if (ch === '-') {
        empty += 1;
      } else {
        if (empty > 0) {
          row += String(empty);
          empty = 0;
        }
        row += swapCase(ch);
      }
    }
    if (empty > 0) row += String(empty);
    rows.push(row);
  }
  const castle =
    (st.castle.whiteShortCastle ? 'K' : '') +
      (st.castle.whiteLongCastle ? 'Q' : '') +
      (st.castle.blackShortCastle ? 'k' : '') +
      (st.castle.blackLongCastle ? 'q' : '') || '-';
  const ep = st.ep === null ? '-' : indexToAlg(st.ep);
  return `${rows.join('/')} ${st.active} ${castle} ${ep} ${String(st.half)} ${String(st.full)}`;
};

const makeGame = (st: RepoState): GlobalChess => ({
  board: st.board,
  boardIndex: mailboxIndex,
  castle: st.castle,
  enPassantTarget: st.ep,
  halfMoveClock: st.half,
  pawn: { pawnToConvert: -1 },
  positionHistory: new Map<string, number>(),
  blackAI: false,
  whiteAI: false,
});

// Resolved from the vitest working directory, which is the package root.
const dataDir = join('src', 'encyclopedia', 'data');

const entries: Entry[] = readdirSync(dataDir)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((f) => JSON.parse(readFileSync(join(dataDir, f), 'utf8')) as Entry);

describe('encyclopedia data', () => {
  it('has entries to verify', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it('every slug is unique', () => {
    const slugs = entries.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  for (const entry of entries) {
    it(`${entry.slug}: every move is legal and the FEN matches`, () => {
      const st = fenToRepo(entry.startFen);
      const game = makeGame(st);
      let active: 'w' | 'b' = st.active;
      let full = st.full;

      // SAN token count must match the stored move list.
      const sanTokens = entry.line.trim().split(/\s+/u).filter(Boolean);
      expect(sanTokens.length).toBe(entry.moves.length);

      for (const mv of entry.moves) {
        const pieceChar = game.board[mailboxIndex[mv.from]];
        const pieceColor =
          pieceChar === pieceChar.toLowerCase() ? 'w' : 'b';
        expect(pieceColor).toBe(active);

        const valids = getValid(
          mv.from,
          game.board,
          game.enPassantTarget,
          game.castle,
        );
        expect(valids).toContain(mv.to);

        const result = applyMove(game, mv.from, mv.to);
        game.board = result.board;
        game.castle = result.castle;
        game.enPassantTarget = result.enPassantTarget;
        game.halfMoveClock = result.halfMoveClock;

        if (typeof mv.promo === 'string') {
          const promoted =
            active === 'w' ? mv.promo.toLowerCase() : mv.promo.toUpperCase();
          game.board[mailboxIndex[mv.to]] = promoted;
        }

        if (active === 'b') full += 1;
        active = active === 'w' ? 'b' : 'w';
      }

      const finalFen = repoToStandardFen({
        board: game.board,
        active,
        castle: game.castle,
        ep: game.enPassantTarget,
        half: game.halfMoveClock,
        full,
      });
      expect(finalFen).toBe(entry.fen);
    });
  }
});
