// Independent, dependency-free chess engine used for authoring encyclopedia
// data. Standard model: board index 0 = a8 .. 63 = h1, standard FEN casing
// (uppercase = white, lowercase = black). This is deliberately INDEPENDENT of
// the repo's own move generator so that the vitest gate (which replays through
// the repo engine) acts as a differential cross-check on every stored line.

const FILES = 'abcdefgh';

export const squareToIndex = (sq) => {
  const file = FILES.indexOf(sq[0]);
  const rank = Number(sq[1]);
  return (8 - rank) * 8 + file;
};

export const indexToSquare = (i) => {
  const file = i % 8;
  const rank = 8 - Math.floor(i / 8);
  return `${FILES[file]}${rank}`;
};

const isWhite = (p) => p !== null && p === p.toUpperCase();
const isBlack = (p) => p !== null && p === p.toLowerCase();
const colorOf = (p) => (p === null ? null : isWhite(p) ? 'w' : 'b');

export const fenToPosition = (fen) => {
  const [placement, active, castling, ep, half, full] = fen.trim().split(/\s+/);
  const board = new Array(64).fill(null);
  const ranks = placement.split('/');
  for (let r = 0; r < 8; r += 1) {
    let file = 0;
    for (const ch of ranks[r]) {
      if (/\d/.test(ch)) {
        file += Number(ch);
      } else {
        board[r * 8 + file] = ch;
        file += 1;
      }
    }
  }
  return {
    board,
    active,
    castling: {
      K: castling.includes('K'),
      Q: castling.includes('Q'),
      k: castling.includes('k'),
      q: castling.includes('q'),
    },
    ep: ep === '-' ? null : squareToIndex(ep),
    half: Number(half),
    full: Number(full),
  };
};

export const positionToFen = (pos) => {
  const rows = [];
  for (let r = 0; r < 8; r += 1) {
    let row = '';
    let empty = 0;
    for (let f = 0; f < 8; f += 1) {
      const p = pos.board[r * 8 + f];
      if (p === null) {
        empty += 1;
      } else {
        if (empty > 0) {
          row += String(empty);
          empty = 0;
        }
        row += p;
      }
    }
    if (empty > 0) row += String(empty);
    rows.push(row);
  }
  const castle =
    (pos.castling.K ? 'K' : '') +
      (pos.castling.Q ? 'Q' : '') +
      (pos.castling.k ? 'k' : '') +
      (pos.castling.q ? 'q' : '') || '-';
  const ep = pos.ep === null ? '-' : indexToSquare(pos.ep);
  return `${rows.join('/')} ${pos.active} ${castle} ${ep} ${pos.half} ${pos.full}`;
};

const onBoard = (file, rank) => file >= 0 && file < 8 && rank >= 0 && rank < 8;
const fileOf = (i) => i % 8;
const rankRowOf = (i) => Math.floor(i / 8); // 0 = rank 8, 7 = rank 1

const SLIDES = {
  b: [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ],
  r: [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ],
  q: [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ],
};
const KNIGHT = [
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1],
];
const KING = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

// Is square `i` attacked by side `by` ('w' | 'b')? Pawn/knight/king/sliders.
const isAttacked = (board, i, by) => {
  const f = fileOf(i);
  const rr = rankRowOf(i);
  // Pawns: a white pawn on the board attacks the two squares diagonally
  // "up" (toward rank 8 = smaller row). So square i is attacked by a white
  // pawn sitting one row below-left / below-right.
  const pawnRow = by === 'w' ? rr + 1 : rr - 1;
  for (const df of [-1, 1]) {
    if (onBoard(f + df, pawnRow)) {
      const p = board[pawnRow * 8 + (f + df)];
      if (p !== null && colorOf(p) === by && p.toLowerCase() === 'p')
        return true;
    }
  }
  // Knights
  for (const [dr, dfp] of KNIGHT) {
    if (onBoard(f + dfp, rr + dr)) {
      const p = board[(rr + dr) * 8 + (f + dfp)];
      if (p !== null && colorOf(p) === by && p.toLowerCase() === 'n')
        return true;
    }
  }
  // King
  for (const [dr, dfp] of KING) {
    if (onBoard(f + dfp, rr + dr)) {
      const p = board[(rr + dr) * 8 + (f + dfp)];
      if (p !== null && colorOf(p) === by && p.toLowerCase() === 'k')
        return true;
    }
  }
  // Sliders (bishop/rook/queen)
  const check = (dirs, types) => {
    for (const [dr, dfp] of dirs) {
      let nf = f + dfp;
      let nr = rr + dr;
      while (onBoard(nf, nr)) {
        const p = board[nr * 8 + nf];
        if (p !== null) {
          if (colorOf(p) === by && types.includes(p.toLowerCase())) return true;
          break;
        }
        nf += dfp;
        nr += dr;
      }
    }
    return false;
  };
  if (check(SLIDES.b, ['b', 'q'])) return true;
  if (check(SLIDES.r, ['r', 'q'])) return true;
  return false;
};

const kingIndex = (board, color) => {
  const target = color === 'w' ? 'K' : 'k';
  return board.indexOf(target);
};

// Pseudo-legal destination indices for the piece on `from` (ignores king safety
// except castling, which validates through-squares here).
const pseudoMoves = (pos, from) => {
  const { board } = pos;
  const p = board[from];
  const color = colorOf(p);
  const type = p.toLowerCase();
  const f = fileOf(from);
  const rr = rankRowOf(from);
  const out = [];
  const enemy = color === 'w' ? 'b' : 'w';

  if (type === 'p') {
    const dir = color === 'w' ? -1 : 1; // white moves toward row 0
    const startRow = color === 'w' ? 6 : 1;
    // forward one
    if (onBoard(f, rr + dir) && board[(rr + dir) * 8 + f] === null) {
      out.push((rr + dir) * 8 + f);
      // forward two
      if (rr === startRow && board[(rr + 2 * dir) * 8 + f] === null) {
        out.push((rr + 2 * dir) * 8 + f);
      }
    }
    // captures + en passant
    for (const df of [-1, 1]) {
      if (!onBoard(f + df, rr + dir)) continue;
      const idx = (rr + dir) * 8 + (f + df);
      const target = board[idx];
      if (target !== null && colorOf(target) === enemy) out.push(idx);
      else if (pos.ep !== null && idx === pos.ep) out.push(idx);
    }
    return out;
  }

  if (type === 'n') {
    for (const [dr, df] of KNIGHT) {
      if (!onBoard(f + df, rr + dr)) continue;
      const idx = (rr + dr) * 8 + (f + df);
      if (board[idx] === null || colorOf(board[idx]) === enemy) out.push(idx);
    }
    return out;
  }

  if (type === 'k') {
    for (const [dr, df] of KING) {
      if (!onBoard(f + df, rr + dr)) continue;
      const idx = (rr + dr) * 8 + (f + df);
      if (board[idx] === null || colorOf(board[idx]) === enemy) out.push(idx);
    }
    // Castling
    const rights = pos.castling;
    const backRow = color === 'w' ? 7 : 0;
    if (from === backRow * 8 + 4 && !isAttacked(board, from, enemy)) {
      // short: e->g, squares f,g empty, king not passing through check
      const shortOk = color === 'w' ? rights.K : rights.k;
      if (
        shortOk &&
        board[backRow * 8 + 5] === null &&
        board[backRow * 8 + 6] === null &&
        !isAttacked(board, backRow * 8 + 5, enemy) &&
        !isAttacked(board, backRow * 8 + 6, enemy)
      ) {
        out.push(backRow * 8 + 6);
      }
      const longOk = color === 'w' ? rights.Q : rights.q;
      if (
        longOk &&
        board[backRow * 8 + 3] === null &&
        board[backRow * 8 + 2] === null &&
        board[backRow * 8 + 1] === null &&
        !isAttacked(board, backRow * 8 + 3, enemy) &&
        !isAttacked(board, backRow * 8 + 2, enemy)
      ) {
        out.push(backRow * 8 + 2);
      }
    }
    return out;
  }

  // sliders
  for (const [dr, df] of SLIDES[type]) {
    let nf = f + df;
    let nr = rr + dr;
    while (onBoard(nf, nr)) {
      const idx = nr * 8 + nf;
      if (board[idx] === null) {
        out.push(idx);
      } else {
        if (colorOf(board[idx]) === enemy) out.push(idx);
        break;
      }
      nf += df;
      nr += dr;
    }
  }
  return out;
};

// Apply a fully-specified move, returning a new position. Handles captures,
// en passant, castling rook move, castling-right updates, ep target, clocks.
export const makeMove = (pos, from, to, promo = null) => {
  const board = pos.board.slice();
  const p = board[from];
  const color = colorOf(p);
  const type = p.toLowerCase();
  const isPawn = type === 'p';
  const isCapture = board[to] !== null || (isPawn && to === pos.ep);

  // en passant capture removes the pawn behind `to`
  if (isPawn && to === pos.ep && board[to] === null) {
    const capRow = rankRowOf(to) + (color === 'w' ? 1 : -1);
    board[capRow * 8 + fileOf(to)] = null;
  }

  board[to] = promo
    ? color === 'w'
      ? promo.toUpperCase()
      : promo.toLowerCase()
    : p;
  board[from] = null;

  // castling rook move
  if (type === 'k' && Math.abs(fileOf(to) - fileOf(from)) === 2) {
    const backRow = rankRowOf(from);
    if (fileOf(to) === 6) {
      board[backRow * 8 + 5] = board[backRow * 8 + 7];
      board[backRow * 8 + 7] = null;
    } else {
      board[backRow * 8 + 3] = board[backRow * 8 + 0];
      board[backRow * 8 + 0] = null;
    }
  }

  const castling = { ...pos.castling };
  if (type === 'k') {
    if (color === 'w') {
      castling.K = false;
      castling.Q = false;
    } else {
      castling.k = false;
      castling.q = false;
    }
  }
  // rook moved or captured from a corner
  const touch = (idx) => {
    if (idx === 63) castling.K = false;
    if (idx === 56) castling.Q = false;
    if (idx === 7) castling.k = false;
    if (idx === 0) castling.q = false;
  };
  touch(from);
  touch(to);

  const ep =
    isPawn && Math.abs(rankRowOf(to) - rankRowOf(from)) === 2
      ? (from + to) / 2
      : null;

  const half = isPawn || isCapture ? 0 : pos.half + 1;
  const full = color === 'b' ? pos.full + 1 : pos.full;

  return {
    board,
    active: color === 'w' ? 'b' : 'w',
    castling,
    ep,
    half,
    full,
  };
};

const leavesKingSafe = (pos, from, to, promo) => {
  const next = makeMove(pos, from, to, promo);
  return !isAttacked(
    next.board,
    kingIndex(next.board, pos.active),
    next.active,
  );
};

// Legal destinations from `from` for the side to move.
export const legalMovesFrom = (pos, from) =>
  pseudoMoves(pos, from).filter((to) => leavesKingSafe(pos, from, to, 'q'));

// Parse one SAN token against `pos`, returning { from, to, promo, san }.
export const sanToMove = (pos, rawSan) => {
  const san = rawSan.replace(/[+#!?]+$/, '').replace(/e\.p\.?$/i, '');
  const color = pos.active;
  const backRow = color === 'w' ? 7 : 0;

  if (san === 'O-O' || san === '0-0') {
    return {
      from: backRow * 8 + 4,
      to: backRow * 8 + 6,
      promo: null,
      san: 'O-O',
    };
  }
  if (san === 'O-O-O' || san === '0-0-0') {
    return {
      from: backRow * 8 + 4,
      to: backRow * 8 + 2,
      promo: null,
      san: 'O-O-O',
    };
  }

  let promo = null;
  let body = san;
  const promoMatch = body.match(/=([QRBN])$/);
  if (promoMatch) {
    promo = promoMatch[1].toLowerCase();
    body = body.slice(0, -2);
  }

  let type = 'p';
  if (/^[KQRBN]/.test(body)) {
    type = body[0].toLowerCase();
    body = body.slice(1);
  }

  body = body.replace('x', '');
  const dest = body.slice(-2);
  const to = squareToIndex(dest);
  const hint = body.slice(0, -2); // optional disambiguation (file and/or rank)
  const hintFile = hint.match(/[a-h]/)?.[0];
  const hintRank = hint.match(/[1-8]/)?.[0];

  const pieceChar = color === 'w' ? type.toUpperCase() : type.toLowerCase();
  const candidates = [];
  for (let i = 0; i < 64; i += 1) {
    if (pos.board[i] !== pieceChar) continue;
    if (hintFile && FILES[fileOf(i)] !== hintFile) continue;
    if (hintRank && String(8 - rankRowOf(i)) !== hintRank) continue;
    if (legalMovesFrom(pos, i).includes(to)) candidates.push(i);
  }
  if (candidates.length !== 1) {
    throw new Error(
      `SAN "${rawSan}" resolved to ${candidates.length} candidates (dest ${dest}) in ${positionToFen(pos)}`,
    );
  }
  return {
    from: candidates[0],
    to,
    promo,
    san: rawSan.replace(/[+#!?]+$/, ''),
  };
};

// Replay a whitespace-separated SAN line (no move numbers) from startFen.
// Returns { moves: [{ san, from, to, promo? }], fen }.
export const applyLine = (startFen, line) => {
  let pos = fenToPosition(startFen);
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  const moves = [];
  for (const tok of tokens) {
    const mv = sanToMove(pos, tok);
    const entry = { san: mv.san, from: mv.from, to: mv.to };
    if (mv.promo) entry.promo = mv.promo;
    moves.push(entry);
    pos = makeMove(pos, mv.from, mv.to, mv.promo);
  }
  return { moves, fen: positionToFen(pos) };
};

export const STANDARD_START =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
