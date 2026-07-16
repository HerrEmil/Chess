import {
  boardAfterMove,
  computeCastleState,
  type CastleState,
  mailboxIndex,
  makeMove,
  pieceOnIndex,
  positionKey,
  reverseMailbox,
} from './main.js';
import { getAllValidMoves, getPiecesOfColor } from './util.js';
import { getAllValidMovesNoCheck, isInCheck } from './moveGen.js';

export type color = 'white' | 'black';

const oppositeColor = (c: color): color => (c === 'white' ? 'black' : 'white');

export type ChessAI = {
  readonly bishopTable: readonly number[];
  readonly kingTable: readonly number[];
  readonly kingTableEndGame: readonly number[];
  readonly knightTable: readonly number[];
  readonly pawnTable: readonly number[];
  readonly queenTable: readonly number[];
  readonly rookTable: readonly number[];
  whitePly: number;
  blackPly: number;
};

/*
 * Piece Square Tables, numbers found in nice chess bin C# guide:
 * http://www.chessbin.com/post/Chess-Board-Evaluation.aspx
 */

/* Difficulty = ply search depth (selectable in UI). */
export const AI = {
  // prettier-ignore
  bishopTable : [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10,   0,   0,   0,   0,   0,   0, -10,
    -10,   0,   5,  10,  10,   5,   0, -10,
    -10,   5,   5,  10,  10,   5,   5, -10,
    -10,   0,  10,  10,  10,  10,   0, -10,
    -10,  10,  10,  10,  10,  10,  10, -10,
    -10,   5,   0,   0,   0,   0,   5, -10,
    -20, -10, -40, -10, -10, -40, -10, -20
  ],
  blackPly: -1,
  // prettier-ignore
  kingTable : [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    20,   20,   0,   0,   0,   0,  20,  20,
    20,   30,  10,   0,   0,  10,  30,  20
  ],
  // prettier-ignore
  kingTableEndGame : [
    -50, -40, -30, -20, -20, -30, -40, -50,
    -30, -20, -10,   0,   0, -10, -20, -30,
    -30, -10,  20,  30,  30,  20, -10, -30,
    -30, -10,  30,  40,  40,  30, -10, -30,
    -30, -10,  30,  40,  40,  30, -10, -30,
    -30, -10,  20,  30,  30,  20, -10, -30,
    -30, -30,   0,   0,   0,   0, -30, -30,
    -50, -30, -30, -30, -30, -30, -30, -50
  ],
  // prettier-ignore
  knightTable : [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20,   0,   0,   0,   0, -20, -40,
    -30,   0,  10,  15,  15,  10,   0, -30,
    -30,   5,  15,  20,  20,  15,   5, -30,
    -30,   0,  15,  20,  20,  15,   0, -30,
    -30,   5,  10,  15,  15,  10,   5, -30,
    -40, -20,   0,   5,   5,   0, -20, -40,
    -50, -40, -20, -30, -30, -20, -40, -50
  ],
  // prettier-ignore
  pawnTable: [
    875, 875, 875, 875, 875, 875, 875, 875,
    50,   50,  50,  50,  50,  50,  50,  50,
    10,   10,  20,  30,  30,  20,  10,  10,
    5,     5,  10,  27,  27,  10,   5,   5,
    0,     0,   0,  25,  25,   0,   0,   0,
    5,    -5, -10,   0,   0, -10,  -5,   5,
    5,    10,  10, -25, -25,  10,  10,   5,
    0,     0,   0,   0,   0,   0,   0,   0
  ],
  // prettier-ignore
  queenTable: [
    -20, -10, -10,  -5,  -5, -10, -10, -20,
    -10,   0,   0,   0,   0,   0,   0, -10,
    -10,   0,   5,   5,   5,   5,   0, -10,
     -5,   0,   5,   5,   5,   5,   0,  -5,
     -5,   0,   5,   5,   5,   5,   0,  -5,
    -10,   0,   5,   5,   5,   5,   0, -10,
    -10,   0,   0,   0,   0,   0,   0, -10,
    -20, -10, -10,  -5,  -5, -10, -10, -20
  ],
  // prettier-ignore
  rookTable: [
     0,   0,   0,   0,   0,   0,   0,   0,
     5,  10,  10,  10,  10,  10,  10,   5,
    -5,   0,   0,   0,   0,   0,   0,  -5,
    -5,   0,   0,   0,   0,   0,   0,  -5,
    -5,   0,   0,   0,   0,   0,   0,  -5,
    -5,   0,   0,   0,   0,   0,   0,  -5,
    -5,   0,   0,   0,   0,   0,   0,  -5,
     0,   0,   0,   5,   5,   0,   0,   0
  ],
  whitePly: -1,
};

// Base material value for a piece character (no positional bonus)
const basePieceValue = (ch: string): number => {
  switch (ch.toLowerCase()) {
    case 'p':
      return 100;
    case 'n':
      return 320;
    case 'b':
      return 325;
    case 'r':
      return 500;
    case 'q':
      return 975;
    case 'k':
      return 32767;
    default:
      return 0;
  }
};

// Vertically mirror a 0-63 board index (flip rank, keep file): rank r -> 7-r.
const mirrorIndex = (index: number): number =>
  (7 - Math.floor(index / 8)) * 8 + (index % 8);

/*
 * Game phase for tapered evaluation. Standard 24-point scale: each knight/bishop
 * counts 1, each rook 2, the queen 4 (both colors), so the full opening board is
 * 24 and bare kings are 0. Returned as the middlegame weight in [0, 1]; the
 * endgame weight is 1 - it. Pawns and kings do not contribute to phase. Extra
 * queens from promotion are capped so the weight never exceeds 1.
 */
const PHASE_TOTAL = 24;
const gamePhaseMg = (board: readonly string[]): number => {
  let phase = 0;
  for (const idx of mailboxIndex) {
    switch (board[idx].toLowerCase()) {
      case 'n':
      case 'b':
        phase += 1;
        break;
      case 'r':
        phase += 2;
        break;
      case 'q':
        phase += 4;
        break;
      default:
        break;
    }
  }
  return (phase > PHASE_TOTAL ? PHASE_TOTAL : phase) / PHASE_TOTAL;
};

/*
 * King piece-square value, tapered by game phase between the middlegame table
 * (king tucked behind its pawns) and the endgame table (king centralised). At
 * mgWeight >= 1 (full material) it is exactly the middlegame table, so the
 * non-tapered evaluation is byte-for-byte unchanged; the endgame table — until
 * now defined but never read — is blended in as material comes off the board.
 */
const kingSquareValue = (idx: number, mgWeight: number): number =>
  mgWeight >= 1
    ? AI.kingTable[idx]
    : Math.round(
        AI.kingTable[idx] * mgWeight +
          AI.kingTableEndGame[idx] * (1 - mgWeight),
      );

// Piece-square tables are authored from White's perspective (index 0 = a8).
// Black's squares are the vertical mirror image, so Black piece lookups must
// use the flipped index. Passing `mirror = false` reproduces the legacy
// (single-orientation) behaviour and exists only for A/B regression testing.
// `queenPst` adds the queen piece-square table (default false = the queen is
// scored by flat material only, the pre-#7 behaviour), keeping every existing
// caller byte-for-byte unchanged.
const getPieceValueSum = ({
  board = [] as readonly string[],
  pieces = [] as readonly number[],
  black = false,
  mirror = true,
  mgWeight = 1,
  queenPst = false,
}): number =>
  pieces.reduce((sum, piece) => {
    const idx = black && mirror ? mirrorIndex(piece) : piece;
    switch (pieceOnIndex({ board, pieceIndex: piece })) {
      case 'p':
      case 'P':
        return sum + 100 + AI.pawnTable[idx];
      case 'r':
      case 'R':
        return sum + 500 + AI.rookTable[idx];
      case 'n':
      case 'N':
        return sum + 320 + AI.knightTable[idx];
      case 'b':
      case 'B':
        return sum + 325 + AI.bishopTable[idx];
      case 'q':
      case 'Q':
        return sum + 975 + (queenPst ? AI.queenTable[idx] : 0);
      case 'k':
      case 'K':
        return sum + 32767 + kingSquareValue(idx, mgWeight);
      default:
        return sum;
    }
  }, 0);

// When materially ahead, reward pushing opponent king to edge and bringing own king closer
const endgameBonus = (
  board: readonly string[],
  currentColor: color,
): number => {
  const myKingIdx =
    reverseMailbox[board.indexOf(currentColor === 'white' ? 'k' : 'K')];
  const oppKingIdx =
    reverseMailbox[board.indexOf(currentColor === 'white' ? 'K' : 'k')];
  if (myKingIdx === -1 || oppKingIdx === -1) return 0;

  const oppFile = oppKingIdx % 8;
  const oppRank = Math.floor(oppKingIdx / 8);
  const edgeBonus = (Math.abs(oppFile - 3.5) + Math.abs(oppRank - 3.5)) * 9;

  const myFile = myKingIdx % 8;
  const myRank = Math.floor(myKingIdx / 8);
  const kingDist = Math.abs(myFile - oppFile) + Math.abs(myRank - oppRank);
  const proximityBonus = (14 - kingDist) * 5;

  return edgeBonus + proximityBonus;
};

/*
 * Bishop-pair bonus. Two bishops cover both square colors and coordinate far
 * better than a bishop plus a knight — worth roughly half a pawn in practice —
 * yet the material table scores a bishop identically whether or not its partner
 * is still on the board, so the engine parts with the pair for free. This term
 * adds a small bonus to a side holding both bishops, returned as a White-minus-
 * Black delta from `currentColor`'s perspective (symmetric by construction: it
 * only counts bishops, so a mirror-image position nets 0).
 *
 * "Pair" is taken as two-or-more bishops — the standard simplification. It does
 * not check that the bishops sit on opposite square colors, which for a normally
 * promoting game only matters for the rare same-colored pair from an under-
 * promotion the UI never makes (it auto-queens). The bonus is deliberately
 * non-committal: it nudges roughly equal minor-piece trades toward keeping the
 * pair but never pushes a piece to a worse square, so — unlike the rejected
 * passed-pawn term (experiment #3) — it cannot steer the shallow search into
 * material it can't convert. A clearly winning capture (gain >> the bonus) is
 * still taken.
 */
const BISHOP_PAIR_BONUS = 40;
const bishopPairDelta = (
  board: readonly string[],
  currentColor: color,
): number => {
  let whiteBishops = 0;
  let blackBishops = 0;
  for (const idx of mailboxIndex) {
    const ch = board[idx];
    if (ch === 'b') whiteBishops += 1;
    else if (ch === 'B') blackBishops += 1;
  }
  const whiteBonus = whiteBishops >= 2 ? BISHOP_PAIR_BONUS : 0;
  const blackBonus = blackBishops >= 2 ? BISHOP_PAIR_BONUS : 0;
  return currentColor === 'white'
    ? whiteBonus - blackBonus
    : blackBonus - whiteBonus;
};

/*
 * Rook on an open / half-open file.
 *
 * A rook's strength is dominated by the file it controls, yet the rook piece-
 * square table is pawn-blind — it scores a rook the same whether the file in
 * front of it is wide open or clogged with its own pawns. This term closes that
 * gap: a rook earns a bonus on a file with no friendly pawns (half-open, enemy
 * pawns only) and a larger bonus on a fully open file (no pawns of either
 * color); a file blocked by a friendly pawn gives nothing. Returned as a White-
 * minus-Black delta from `currentColor`'s perspective, antisymmetric by
 * construction (it depends only on pawn/rook placement, so a mirror-image
 * position nets 0).
 *
 * Like the bishop-pair term (#6) and unlike the rejected passed-pawn term (#3),
 * it is non-committal: it rewards a rook for the file it already occupies and
 * biases a rook toward an open file, but a rook move is cheap and reversible —
 * it commits no pawn and creates no weakness — so it cannot steer the shallow
 * search into material it can't convert. A clearly winning capture still
 * outweighs it.
 */
const ROOK_OPEN_FILE_BONUS = 16;
const ROOK_HALF_OPEN_FILE_BONUS = 8;

// Bonus for a rook on a file, given whether a friendly / an enemy pawn stands on
// it. A friendly pawn closes the file for this rook (no bonus); otherwise an
// open file (no pawns) beats a half-open one (enemy pawns only).
const rookFileScore = (friendlyPawn: boolean, enemyPawn: boolean): number => {
  if (friendlyPawn) return 0;
  return enemyPawn ? ROOK_HALF_OPEN_FILE_BONUS : ROOK_OPEN_FILE_BONUS;
};

const rookFileDelta = (
  board: readonly string[],
  currentColor: color,
): number => {
  // Pawn occupancy per file (file = board index % 8, 0 = a-file). Two passes:
  // all pawns must be seen before a rook's file can be classified.
  const whitePawnFile = [
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ];
  const blackPawnFile = [
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ];
  for (let sq = 0; sq < 64; sq += 1) {
    const ch = board[mailboxIndex[sq]];
    if (ch === 'p') whitePawnFile[sq % 8] = true;
    else if (ch === 'P') blackPawnFile[sq % 8] = true;
  }
  let whiteScore = 0;
  let blackScore = 0;
  for (let sq = 0; sq < 64; sq += 1) {
    const ch = board[mailboxIndex[sq]];
    const file = sq % 8;
    if (ch === 'r') {
      whiteScore += rookFileScore(whitePawnFile[file], blackPawnFile[file]);
    } else if (ch === 'R') {
      blackScore += rookFileScore(blackPawnFile[file], whitePawnFile[file]);
    }
  }
  return currentColor === 'white'
    ? whiteScore - blackScore
    : blackScore - whiteScore;
};

/*
 * Mobility.
 *
 * A piece's worth is not just its material and its square but how many squares
 * it commands: a knight on the rim or a rook hemmed in behind its own pawns is
 * worth far less than the material table credits, and the piece-square and rook-
 * file terms only partly capture it (a rook on a half-open file can still be
 * walled in by an enemy piece two squares ahead). This term counts each side's
 * pseudo-legal moves for its mobile pieces — knights, bishops, rooks and queens
 * — and rewards the more active side.
 *
 * Pawns and kings are excluded on purpose. A pawn's two push squares say nothing
 * about its strength (its value is structural, already scored by the pawn table),
 * and king "mobility" in the middlegame measures exposure — a mobility bonus
 * would reward walking the king into the open, exactly backwards. Counting is
 * pseudo-legal (pins are not discounted) to stay cheap: it reuses the same
 * generator quiescence already calls, and the small symmetric overcount from
 * pinned pieces washes out in the White-minus-Black delta.
 *
 * Returned as `weight * (White mobile-move count - Black mobile-move count)` from
 * `currentColor`'s perspective, antisymmetric by construction (a mirror-image
 * position nets 0) so the evaluation stays color-symmetric. Like the bishop-pair
 * (#6), queen-PST (#7) and rook-file (#8) terms and unlike the rejected pawn-
 * structure term (#3), it induces no committal move — it rewards activity the
 * pieces already have, and every mobile move is cheap and reversible, so it
 * cannot steer the shallow search into material it can't hold. A clearly winning
 * capture still outweighs it.
 */
const MOBILE_PIECES = new Set(['n', 'b', 'r', 'q']);

// Total pseudo-legal moves available to `color`'s mobile pieces (N/B/R/Q).
const sideMobility = (board: readonly string[], color: color): number => {
  const pieces = getPiecesOfColor(board, color).filter((idx) =>
    MOBILE_PIECES.has(board[mailboxIndex[idx]].toLowerCase()),
  );
  const perPiece = getAllValidMovesNoCheck(board, pieces);
  let count = 0;
  for (const moves of perPiece) count += moves.length;
  return count;
};

// White-minus-Black mobile-move-count delta from `currentColor`'s perspective,
// scaled by `weight`. `weight === 0` short-circuits so no move generation runs,
// keeping the term a true no-op for every caller that leaves it off.
const mobilityDelta = (
  board: readonly string[],
  currentColor: color,
  weight: number,
): number => {
  if (weight === 0) return 0;
  const white = sideMobility(board, 'white');
  const black = sideMobility(board, 'black');
  const diff = currentColor === 'white' ? white - black : black - white;
  return diff * weight;
};

/*
 * Weight (centipawns per mobile move of advantage) for the mobility term, tuned
 * by self-play in tools/engine-lab (see experiments.jsonl). The production leaf
 * `quiescentEvalMobility` passes this; every other caller leaves the weight at 0
 * (off), so those code paths are byte-for-byte unchanged.
 */
const MOBILITY_WEIGHT = 3;

/*
 * Passed pawns (endgame-scaled).
 *
 * A passed pawn — one with no enemy pawn ahead of it on its own or an adjacent
 * file — has an unobstructed road to promotion and grows more dangerous the
 * further it advances. But that value is overwhelmingly an ENDGAME asset: in the
 * middlegame a pawn "passed" on paper is usually blockaded or drowned out by the
 * pieces, and rewarding its advance there is exactly what sank the earlier pawn-
 * structure term (experiment #3 — the shallow search pushed passers it could not
 * support, a regression that grew monotonically with the bonus). This term fixes
 * that by scaling the whole bonus by the ENDGAME weight (1 - gamePhaseMg): ~0 at
 * full material, full value only as the board empties and a passed pawn genuinely
 * decides the game (and the horizon is short enough for a shallow search to
 * convert it). Only passed pawns are scored here; doubled/isolated penalties are
 * deliberately kept separate (a later ladder item) so this retry stays isolated.
 *
 * Detection is a two-pass file scan like rookFileDelta: record each color's
 * most-advanced pawn per file, then a pawn is passed iff no enemy pawn stands on
 * the same or an adjacent file on any rank AHEAD of it (toward its promotion
 * rank — smaller ranks for White, which promotes at rank 0; larger ranks for
 * Black, which promotes at rank 7). Returned as a White-minus-Black delta from
 * `currentColor`'s perspective, antisymmetric by construction (it depends only on
 * pawn placement, so a mirror-image position nets 0). The per-rank bonus below is
 * the full endgame value, indexed by the pawn's rank from its own side (1 = just
 * off the start rank … 6 = one rank from queening); indices 0 and 7 are unused (a
 * pawn never lives on its own back rank or the promotion rank) and left at 0.
 */
// prettier-ignore
const PASSED_PAWN_BONUS = [0, 5, 12, 22, 36, 55, 80, 0];

// Most-advanced pawn rank per file, per color, for passed detection. White
// promotes toward rank 0, so a black sentry is one at a SMALLER rank => track the
// min black rank (8 = none). Black promotes toward rank 7, so a white sentry is
// one at a LARGER rank => track the max white rank (-1 = none).
const pawnSentryRanks = (
  board: readonly string[],
): { blackMin: number[]; whiteMax: number[] } => {
  const blackMin = [8, 8, 8, 8, 8, 8, 8, 8];
  const whiteMax = [-1, -1, -1, -1, -1, -1, -1, -1];
  for (let sq = 0; sq < 64; sq += 1) {
    const ch = board[mailboxIndex[sq]];
    const file = sq % 8;
    const rank = Math.floor(sq / 8);
    if (ch === 'p') {
      if (rank > whiteMax[file]) whiteMax[file] = rank;
    } else if (ch === 'P' && rank < blackMin[file]) {
      blackMin[file] = rank;
    }
  }
  return { blackMin, whiteMax };
};

// True when no enemy sentry stands ahead of a pawn on (file, rank), scanning its
// own and both adjacent files. `sentry[f]` is the enemy's most-advanced rank on
// file f. For a White pawn a sentry is a black pawn AHEAD at a smaller rank
// (`forWhite` true, compare `<`); for a Black pawn it is a white pawn ahead at a
// larger rank (compare `>`). The sentinels (8 for blackMin, -1 for whiteMax)
// never satisfy either comparison, so an empty file never blocks.
const noSentryAhead = (
  sentry: readonly number[],
  file: number,
  rank: number,
  forWhite: boolean,
): boolean => {
  for (let f = file - 1; f <= file + 1; f += 1) {
    const onBoard = f >= 0 && f <= 7;
    if (onBoard && (forWhite ? sentry[f] < rank : sentry[f] > rank)) {
      return false;
    }
  }
  return true;
};

const passedPawnDelta = (
  board: readonly string[],
  currentColor: color,
  mgWeight: number,
): number => {
  const endWeight = 1 - mgWeight;
  if (endWeight <= 0) return 0;
  const { blackMin, whiteMax } = pawnSentryRanks(board);
  let whiteScore = 0;
  let blackScore = 0;
  for (let sq = 0; sq < 64; sq += 1) {
    const ch = board[mailboxIndex[sq]];
    const rank = Math.floor(sq / 8);
    const file = sq % 8;
    if (ch === 'p') {
      if (noSentryAhead(blackMin, file, rank, true)) {
        whiteScore += PASSED_PAWN_BONUS[7 - rank];
      }
    } else if (ch === 'P' && noSentryAhead(whiteMax, file, rank, false)) {
      blackScore += PASSED_PAWN_BONUS[rank];
    }
  }
  // Round the perspective-independent White-minus-Black delta once, then flip
  // sign for the side to move. Rounding here (rather than after the perspective
  // flip) keeps the term exactly antisymmetric — evaluate(pos, white) is the
  // exact negation of evaluate(pos, black) — matching the integer sibling deltas;
  // rounding a perspective-dependent value would disagree by 1cp on a .5 result.
  const whiteMinusBlack = Math.round((whiteScore - blackScore) * endWeight);
  return currentColor === 'white' ? whiteMinusBlack : -whiteMinusBlack;
};

/*
 * Queen piece-square table.
 *
 * Every other piece already reads a piece-square table, but the queen was
 * scored by flat material alone, so the engine had no positional preference for
 * where the queen sat — parking it on a rim or corner square cost nothing. This
 * small, conservative table (standard shape: mild centre preference, edges and
 * back-rank corners penalised) gives the queen a gradient without inviting an
 * early sortie: the swing from the home square (-5) to the centre (+5) is only
 * ~10cp, far less than the tempo a shallow search loses when its queen is
 * kicked around, so it nudges placement but never chases. Like the bishop-pair
 * term (#6) and unlike the rejected passed-pawn term (#3), it induces no
 * committal move — it only scores the square the queen already occupies.
 */
// Evaluates the board relative to `currentColor`.
// `mirror` toggles per-color piece-square mirroring; false = legacy behaviour.
// `tapered` blends the king table toward its endgame orientation by game phase
// (default false = single middlegame king table, the pre-taper behaviour).
// `bishopPair` adds the bishop-pair bonus (default false = no bishop-pair term,
// the pre-#6 behaviour), keeping every existing caller byte-for-byte unchanged.
// `queenPst` adds the queen piece-square table (default false = flat queen
// material, the pre-#7 behaviour).
// `rookFile` adds the rook open/half-open-file bonus (default false = no rook-
// file term, the pre-#8 behaviour), keeping every existing caller byte-for-byte
// unchanged.
// `mobility` is the centipawns-per-move weight of the mobility term (default 0 =
// off, the pre-#9 behaviour); a positive weight adds it, so every existing
// caller that omits it is byte-for-byte unchanged.
// `passedPawn` adds the endgame-scaled passed-pawn bonus (default false = no
// passed-pawn term, the pre-#12 behaviour). It reads the same `mgWeight` used for
// tapering, so it is a no-op unless `tapered` is on (the middlegame weight is 1,
// giving endWeight 0); with the flag off every existing caller is unchanged.
export const evaluate = (
  board: readonly string[],
  currentColor: color,
  mirror = true,
  tapered = false,
  bishopPair = false,
  queenPst = false,
  rookFile = false,
  mobility = 0,
  passedPawn = false,
): number => {
  const opponent = oppositeColor(currentColor);
  const checkBonus = isInCheck(board, opponent) ? 50 : 0;
  const checkPenalty = isInCheck(board, currentColor) ? 50 : 0;
  const mgWeight = tapered ? gamePhaseMg(board) : 1;

  const currentValue = getPieceValueSum({
    black: currentColor === 'black',
    board,
    mgWeight,
    mirror,
    pieces: getPiecesOfColor(board, currentColor),
    queenPst,
  });

  const opponentValue = getPieceValueSum({
    black: opponent === 'black',
    board,
    mgWeight,
    mirror,
    pieces: getPiecesOfColor(board, opponent),
    queenPst,
  });

  const materialDiff = currentValue - opponentValue;
  const endgame = materialDiff > 300 ? endgameBonus(board, currentColor) : 0;
  const pairDelta = bishopPair ? bishopPairDelta(board, currentColor) : 0;
  const rookDelta = rookFile ? rookFileDelta(board, currentColor) : 0;
  const mobilityScore = mobilityDelta(board, currentColor, mobility);
  const passedDelta = passedPawn
    ? passedPawnDelta(board, currentColor, mgWeight)
    : 0;

  return (
    checkBonus -
    checkPenalty +
    materialDiff +
    endgame +
    pairDelta +
    rookDelta +
    mobilityScore +
    passedDelta
  );
};

/*
 * Quiescence search.
 *
 * The static `evaluate` is only meaningful for "quiet" positions. Calling it at
 * a fixed horizon mid-capture causes the horizon effect: the search stops after
 * grabbing a piece and never sees the recapture, so it over/under-counts
 * material. Quiescence fixes this by, at the leaf, resolving all pending
 * captures before scoring — it plays out capture sequences (only) until the
 * position is quiet, using a stand-pat lower bound so the side to move is never
 * forced into a losing capture it could decline.
 *
 * Captures are generated pseudo-legally and filtered for self-check legality in
 * the loop. En passant is intentionally omitted (rare, and its target isn't
 * threaded to the leaf); capture-promotions auto-queen to match the game UI.
 */
const QUIESCENCE_MAX_DEPTH = 4;

/*
 * Safety buffer for delta pruning: the largest positional swing `evaluate` can
 * add on top of raw material (piece-square + check + endgame terms). A capture
 * that can't reach alpha even with this slack cannot improve the score.
 */
const DELTA_MARGIN = 200;

/*
 * Extra delta-pruning slack for the queen piece-square table. A single capture
 * can add at most one queen-table swing beyond raw material: the moving piece
 * changes square (a queen swings by at most max-min = 5 - (-20) = 25) and the
 * captured piece is removed (an enemy queen's table value is at most 20 in
 * magnitude), so 25 + 20 = 45 < 50. Widening the margin by this when the queen
 * table is active keeps delta pruning from discarding a capture whose queen-PST
 * swing would reach alpha; with the flag off the margin is exactly DELTA_MARGIN.
 */
const QUEEN_PST_MARGIN = 50;

/*
 * Extra delta-pruning slack for the rook-file term. A side has at most two rooks
 * — the game never under-promotes (pawns auto-queen), so no third rook can
 * appear — each worth at most ROOK_OPEN_FILE_BONUS, so the whole White-minus-
 * Black rook-file delta lies in [-32, +32] and any single-capture swing is at
 * most 64. Widening the margin by this when the term is active keeps delta
 * pruning from discarding a capture whose rook-file swing would reach alpha;
 * with the flag off the margin is exactly DELTA_MARGIN.
 */
const ROOK_FILE_MARGIN = 64;

/*
 * Extra delta-pruning slack per unit of mobility weight. A single capture can
 * shift the White-minus-Black mobile-move-count delta by removing an enemy
 * mobile piece (up to ~27 of a central queen's moves), relocating the capturing
 * piece, and opening or closing lines for sliders behind it; MOBILITY_MAX_SWING
 * bounds that count swing generously (over-estimating only relaxes pruning, it
 * never prunes a capture that could reach alpha). Multiplied by the active
 * weight, it widens the margin so a capture whose mobility swing would reach
 * alpha is not discarded; with the weight at 0 the margin is exactly
 * DELTA_MARGIN, keeping the pre-mobility leaves byte-for-byte unchanged.
 */
const MOBILITY_MAX_SWING = 60;

/*
 * Extra delta-pruning slack for the passed-pawn term, scaled by the endgame
 * weight so it tracks the term (which is itself endgame-scaled): ~0 in the
 * middlegame — where the term contributes nothing, keeping pruning as tight as
 * the pre-#12 leaves — rising to its full bound as the board empties. A single
 * capture can at most convert a handful of friendly pawns to passers and strip an
 * enemy passer; this bounds that swing generously (over-estimating only relaxes
 * pruning, it never prunes a capture that could reach alpha). With the flag off
 * the margin is exactly DELTA_MARGIN, keeping the pre-#12 leaves byte-for-byte
 * unchanged.
 */
const PASSED_PAWN_MAX_SWING = 320;

// A pseudo-legal capture for quiescence, pre-scored for MVV-LVA ordering.
// `gain` is the captured material (plus promotion), used for delta pruning.
type Capture = {
  gain: number;
  goal: number;
  orderScore: number;
  start: number;
};

/*
 * True when `code` (a char code) is an enemy piece of `currentColor` other than
 * the king. Lowercase = white, uppercase = black; kings are never "captured".
 * White's enemies are black A-Z (65-90, excluding 'K' 75); black's enemies are
 * white a-z (97-122, excluding 'k' 107).
 */
const isEnemyNonKing = (code: number, currentColor: color): boolean =>
  currentColor === 'white'
    ? code >= 65 && code <= 90 && code !== 75
    : code >= 97 && code <= 122 && code !== 107;

// All pseudo-legal captures for `currentColor`, MVV-LVA ordered (most valuable
// victim, least valuable attacker first). Reuses the production pseudo-legal
// move generator, then keeps only moves landing on an enemy piece.
const generateCaptures = (
  board: readonly string[],
  currentColor: color,
): Capture[] => {
  const pieces = getPiecesOfColor(board, currentColor);
  const perPiece = getAllValidMovesNoCheck(board, pieces);
  const captures: Capture[] = [];
  for (let i = 0; i < pieces.length; i += 1) {
    const start = pieces[i];
    const attacker = board[mailboxIndex[start]];
    const attackerValue = basePieceValue(attacker);
    for (const goal of perPiece[i]) {
      const victim = board[mailboxIndex[goal]];
      if (isEnemyNonKing(victim.charCodeAt(0), currentColor)) {
        const isPromotion =
          (attacker === 'p' && goal < 8) || (attacker === 'P' && goal > 55);
        // A capture-promotion also nets a queen minus the consumed pawn.
        const gain = basePieceValue(victim) + (isPromotion ? 975 - 100 : 0);
        captures.push({
          gain,
          goal,
          orderScore: gain * 10 - attackerValue,
          start,
        });
      }
    }
  }
  return captures;
};

// Board after a quiescence capture, auto-queening a pawn that reached the last
// rank (mirrors the game UI's default promotion). No en passant here.
const captureChild = (
  board: readonly string[],
  start: number,
  goal: number,
): readonly string[] => {
  const child = boardAfterMove(board, start, goal).slice();
  const moved = child[mailboxIndex[goal]];
  if (moved === 'p' && goal < 8) child[mailboxIndex[goal]] = 'q';
  else if (moved === 'P' && goal > 55) child[mailboxIndex[goal]] = 'Q';
  return child;
};

/*
 * Delta-pruning margin: an upper bound on the positional (non-material) score a
 * single capture can add on top of its raw material gain. The bishop-pair term
 * can swing by at most one bonus when a capture removes the enemy's second
 * bishop, the queen table by at most QUEEN_PST_MARGIN, the rook-file term by at
 * most ROOK_FILE_MARGIN, mobility by MOBILITY_MAX_SWING per unit weight, and the
 * passed-pawn term by PASSED_PAWN_MAX_SWING scaled to the board's endgame weight;
 * widen the margin by each active term. With all flags off it is exactly
 * DELTA_MARGIN, keeping quiescentEval / quiescentEvalTapered byte-for-byte
 * unchanged.
 */
const quiesceDeltaMargin = (
  board: readonly string[],
  bishopPair: boolean,
  queenPst: boolean,
  rookFile: boolean,
  mobility: number,
  passedPawn: boolean,
): number =>
  DELTA_MARGIN +
  (bishopPair ? BISHOP_PAIR_BONUS : 0) +
  (queenPst ? QUEEN_PST_MARGIN : 0) +
  (rookFile ? ROOK_FILE_MARGIN : 0) +
  Math.abs(mobility) * MOBILITY_MAX_SWING +
  (passedPawn
    ? Math.round(PASSED_PAWN_MAX_SWING * (1 - gamePhaseMg(board)))
    : 0);

// Negamax capture-only search returning the quiet score for `currentColor`.
export const quiesce = (
  board: readonly string[],
  currentColor: color,
  alpha: number,
  beta: number,
  qdepth: number = QUIESCENCE_MAX_DEPTH,
  tapered = false,
  bishopPair = false,
  queenPst = false,
  rookFile = false,
  mobility = 0,
  passedPawn = false,
): number => {
  // Stand-pat: the side to move may always decline to capture, so the static
  // score is a lower bound on what it can achieve.
  const standPat = evaluate(
    board,
    currentColor,
    true,
    tapered,
    bishopPair,
    queenPst,
    rookFile,
    mobility,
    passedPawn,
  );
  if (standPat >= beta) return beta;
  let localAlpha = standPat > alpha ? standPat : alpha;
  if (qdepth === 0) return localAlpha;

  const captures = generateCaptures(board, currentColor);
  captures.sort((a, b) => b.orderScore - a.orderScore);
  const deltaMargin = quiesceDeltaMargin(
    board,
    bishopPair,
    queenPst,
    rookFile,
    mobility,
    passedPawn,
  );

  for (const { start, goal, gain } of captures) {
    // Delta pruning: skip captures whose best-case material can't reach alpha.
    const worthTrying = standPat + gain + deltaMargin >= localAlpha;
    const child = worthTrying ? captureChild(board, start, goal) : null;
    // Skip captures that leave the mover's own king in check (illegal).
    if (child !== null && !isInCheck(child, currentColor)) {
      const score = -quiesce(
        child,
        oppositeColor(currentColor),
        -beta,
        -localAlpha,
        qdepth - 1,
        tapered,
        bishopPair,
        queenPst,
        rookFile,
        mobility,
        passedPawn,
      );
      if (score >= beta) return beta;
      if (score > localAlpha) localAlpha = score;
    }
  }
  return localAlpha;
};

// Leaf evaluator used by negamax: resolves captures before scoring. This is the
// production engine's static-eval replacement at the search horizon.
export const quiescentEval = (
  board: readonly string[],
  currentColor: color,
): number => quiesce(board, currentColor, -100000, 100000);

// Candidate leaf (experiment #5): quiescence with a phase-tapered king table, so
// the king is valued for safety in the middlegame and for activity as the board
// empties. Same capture resolution as `quiescentEval`; only the leaf king term
// differs, isolating the tapered-eval contribution in self-play.
export const quiescentEvalTapered = (
  board: readonly string[],
  currentColor: color,
): number =>
  quiesce(board, currentColor, -100000, 100000, QUIESCENCE_MAX_DEPTH, true);

/*
 * Production leaf (experiment #6): the accepted tapered-king quiescence leaf
 * (experiment #5) plus the bishop-pair bonus. Wiring this as the negamax default
 * also finally ships tapering: experiment #5 was accepted in the lab but the
 * production default was left as the non-tapered `quiescentEval`, so the browser
 * AI was still the experiment-#4 engine. This leaf lands both the tapered king
 * table and the bishop-pair term. Same capture resolution as
 * `quiescentEvalTapered`; only the added pair term differs, isolating the
 * bishop-pair contribution in self-play (new here vs `quiescentEvalTapered`).
 */
export const quiescentEvalBishopPair = (
  board: readonly string[],
  currentColor: color,
): number =>
  quiesce(
    board,
    currentColor,
    -100000,
    100000,
    QUIESCENCE_MAX_DEPTH,
    true,
    true,
  );

/*
 * Production leaf (experiment #7): the accepted bishop-pair quiescence leaf
 * (experiment #6) plus the queen piece-square table. Same capture resolution,
 * tapered king, and bishop-pair bonus as `quiescentEvalBishopPair`; only the
 * added queen-PST term differs, isolating the queen-table contribution in
 * self-play (new here vs `quiescentEvalBishopPair`).
 */
export const quiescentEvalQueenPst = (
  board: readonly string[],
  currentColor: color,
): number =>
  quiesce(
    board,
    currentColor,
    -100000,
    100000,
    QUIESCENCE_MAX_DEPTH,
    true,
    true,
    true,
  );

/*
 * Production leaf (experiment #8): the accepted queen-PST quiescence leaf
 * (experiment #7) plus the rook open/half-open-file bonus. Same capture
 * resolution, tapered king, bishop-pair bonus, and queen table as
 * `quiescentEvalQueenPst`; only the added rook-file term differs, isolating the
 * rook-file contribution in self-play (new here vs `quiescentEvalQueenPst`).
 */
export const quiescentEvalRookFile = (
  board: readonly string[],
  currentColor: color,
): number =>
  quiesce(
    board,
    currentColor,
    -100000,
    100000,
    QUIESCENCE_MAX_DEPTH,
    true,
    true,
    true,
    true,
  );

/*
 * Production leaf (experiment #10): the accepted rook-file quiescence leaf
 * (experiment #8) plus the mobility term at MOBILITY_WEIGHT. Same capture
 * resolution, tapered king, bishop-pair bonus, queen table and rook-file bonus
 * as `quiescentEvalRookFile`; only the added mobility term differs, isolating
 * the mobility contribution in self-play (new here vs `quiescentEvalRookFile`).
 */
export const quiescentEvalMobility = (
  board: readonly string[],
  currentColor: color,
): number =>
  quiesce(
    board,
    currentColor,
    -100000,
    100000,
    QUIESCENCE_MAX_DEPTH,
    true,
    true,
    true,
    true,
    MOBILITY_WEIGHT,
  );

/*
 * Production leaf (experiment #12, Ladder 2 item 2): the accepted mobility
 * quiescence leaf (experiment #10) plus the endgame-scaled passed-pawn bonus.
 * Same capture resolution, tapered king, bishop-pair bonus, queen table, rook-
 * file bonus and mobility term as `quiescentEvalMobility`; only the added passed-
 * pawn term differs, isolating its contribution in self-play (new here vs
 * `quiescentEvalMobility`). The bonus is ~0 in the middlegame and rises as the
 * board empties, so it only steers the search where a passer can actually be
 * converted — the retry condition the rejected pawn-structure term (#3) failed.
 */
export const quiescentEvalPassedPawns = (
  board: readonly string[],
  currentColor: color,
): number =>
  quiesce(
    board,
    currentColor,
    -100000,
    100000,
    QUIESCENCE_MAX_DEPTH,
    true,
    true,
    true,
    true,
    MOBILITY_WEIGHT,
    true,
  );

/*
 * Negamax with alpha-beta pruning.
 * Returns [bestMoveStart, bestMoveGoal, score].
 * Score is always from the perspective of the current player.
 */
const computeEnPassantTarget = (
  board: readonly string[],
  moveStart: number,
  moveGoal: number,
): number | null => {
  const piece = board[mailboxIndex[moveStart]].toLowerCase();
  if (piece === 'p' && Math.abs(moveGoal - moveStart) === 16) {
    return (moveStart + moveGoal) / 2;
  }
  return null;
};

/*
 * Check extensions (horizon-only).
 *
 * Quiescence resolves captures at the horizon but not check evasions, so a leaf
 * reached while the side to move is in check is scored by a stand-pat that
 * cannot tell a forced mate/loss from a harmless check. When the search hits the
 * horizon in check, it is extended one ply to search the (few, forced) evasions
 * instead of trusting the leaf — recognising mate the plain leaf would miss.
 * Only the frontier is extended (interior nodes already search their evasions to
 * the remaining depth), so the cost is a small sub-search at in-check leaves
 * rather than an inflation of the whole tree. A per-path budget bounds a run of
 * consecutive frontier checks so a forcing sequence cannot recurse without
 * limit: total search depth never exceeds nominalDepth + CHECK_EXTENSION_BUDGET.
 *
 * The budget is 1 (a single extension ply, no check-chains) deliberately: a
 * larger budget lets alternating-check sequences extend repeatedly and blows up
 * worst-case search time at the UI's higher depths (measurably pathological at
 * depth 4+), which would freeze the AI mid-move. One ply already resolves the
 * in-check horizon leaf — the case quiescence cannot handle — at bounded cost.
 */
const CHECK_EXTENSION_BUDGET = 1;

// Resolve the depth to search at a node, applying the horizon-only check
// extension. Interior nodes (depth > 0) are unchanged. At the horizon a side to
// move in check is extended one ply (searchDepth 1), consuming one unit of the
// budget; otherwise the leaf is scored statically (searchDepth 0).
const resolveSearchDepth = (
  depth: number,
  inCheck: boolean,
  checkExtend: boolean,
  extLeft: number,
): { extRemaining: number; searchDepth: number } => {
  if (depth > 0) return { extRemaining: extLeft, searchDepth: depth };
  if (checkExtend && inCheck && extLeft > 0) {
    return { extRemaining: extLeft - 1, searchDepth: 1 };
  }
  return { extRemaining: extLeft, searchDepth: 0 };
};

type OrderedMove = { goal: number; orderScore: number; start: number };

// Flatten the per-piece move lists into a single MVV-LVA-ordered move list:
// captures of high-value victims by low-value attackers first, then quiet moves.
const orderMoves = (
  board: readonly string[],
  pieces: readonly number[],
  moves: readonly (readonly number[])[],
): OrderedMove[] => {
  const moveList: OrderedMove[] = [];
  for (let i = 0; i < pieces.length; i += 1) {
    for (const goal of moves[i]) {
      const start = pieces[i];
      const victim = board[mailboxIndex[goal]];
      // MVV-LVA: prioritize capturing high-value pieces with low-value attackers
      const orderScore =
        victim === '-'
          ? 0
          : basePieceValue(victim) * 10 -
            basePieceValue(board[mailboxIndex[start]]);
      moveList.push({ goal, orderScore, start });
    }
  }
  moveList.sort((a, b) => b.orderScore - a.orderScore);
  return moveList;
};

export const negamax = (
  board: readonly string[],
  currentPlayer: color,
  depth: number,
  alpha: number,
  beta: number,
  enPassantTarget: number | null,
  castle: CastleState,
  posHistory: Map<string, number> = new Map(),
  evaluateFn: (
    b: readonly string[],
    c: color,
  ) => number = quiescentEvalPassedPawns,
  checkExtend = true,
  extLeft: number = CHECK_EXTENSION_BUDGET,
): readonly number[] => {
  const inCheck = isInCheck(board, currentPlayer);
  const { searchDepth, extRemaining } = resolveSearchDepth(
    depth,
    inCheck,
    checkExtend,
    extLeft,
  );
  if (searchDepth === 0) {
    return [-1, -1, evaluateFn(board, currentPlayer)];
  }

  const pieces = getPiecesOfColor(board, currentPlayer);
  const moves = getAllValidMoves(board, pieces, enPassantTarget, castle);
  const moveList = orderMoves(board, pieces, moves);

  if (moveList.length === 0) {
    // Checkmate (in check) or stalemate (not in check)
    if (inCheck) {
      return [-1, -1, -50000 - searchDepth];
    }
    return [-1, -1, 0];
  }

  let bestStart = -1;
  let bestGoal = -1;
  let localAlpha = alpha;

  // Only check repetition near the root (depth >= 2) to avoid
  // expensive positionKey computation at every node
  const checkRepetition = searchDepth >= 2 && posHistory.size > 0;

  for (const { start, goal } of moveList) {
    const childBoard = boardAfterMove(board, start, goal, enPassantTarget);
    const childEp = computeEnPassantTarget(board, start, goal);
    const childCastle = computeCastleState(castle, start, goal);

    const childKey = checkRepetition
      ? positionKey(
          childBoard,
          oppositeColor(currentPlayer),
          childCastle,
          childEp,
        )
      : '';
    const histCount = checkRepetition ? (posHistory.get(childKey) ?? 0) : 0;

    let score = 0;

    if (histCount < 2) {
      if (checkRepetition) posHistory.set(childKey, histCount + 1);
      const childResult = negamax(
        childBoard,
        oppositeColor(currentPlayer),
        searchDepth - 1,
        -beta,
        -localAlpha,
        childEp,
        childCastle,
        posHistory,
        evaluateFn,
        checkExtend,
        extRemaining,
      );
      score = -childResult[2];
      // Restore history
      if (checkRepetition) {
        if (histCount === 0) posHistory.delete(childKey);
        else posHistory.set(childKey, histCount);
      }
    }

    if (score > localAlpha) {
      localAlpha = score;
      bestStart = start;
      bestGoal = goal;
    }

    if (localAlpha >= beta) {
      return [bestStart, bestGoal, localAlpha];
    }
  }

  return [bestStart, bestGoal, localAlpha];
};

/*
 * Main AI entry point. Ply depth is selected directly in the UI.
 */
export const makeAIMove = (
  board: readonly string[],
  turn: color,
  enPassantTarget: number | null,
  castle: CastleState,
  posHistory: Map<string, number> = new Map(),
): void => {
  const ply = turn === 'white' ? AI.whitePly : AI.blackPly;

  const bestMove = negamax(
    board,
    turn,
    ply,
    -100000,
    100000,
    enPassantTarget,
    castle,
    posHistory,
  );

  makeMove(bestMove[0], bestMove[1], true);
};
