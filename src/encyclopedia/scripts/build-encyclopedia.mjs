// Render the chess opening encyclopedia: one static HTML page per data/*.json
// entry, a hub index, and sitemap.xml — all written into build/. Ships ZERO
// page JavaScript (inline <style> only, no <script> except JSON-LD metadata) to
// protect the size-limit budget and keep Lighthouse perf high.
//
// Run automatically as part of `yarn build`. Re-derives each entry's moves+FEN
// from its `line` through the independent engine and refuses to build if the
// stored cache has drifted, so a hand-edited data file can never ship stale.
//
// Usage: node src/encyclopedia/scripts/build-encyclopedia.mjs

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  applyLine,
  fenToPosition,
  indexToSquare,
  STANDARD_START,
} from './chess.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, '..', 'data');
const outDir = join(here, '..', '..', '..', 'build', 'encyclopedia');
const buildDir = join(here, '..', '..', '..', 'build');

// Production is served from the chess.herremil.com subdomain; the legacy
// herremil.com/chess/ path 301-redirects here (stripping the path), so canonical
// URLs must point at the subdomain to resolve directly (SEO).
const SITE = 'https://chess.herremil.com/';
const HUB_URL = `${SITE}encyclopedia/`;

// Outline glyphs = white, solid glyphs = black (print-diagram convention). This
// keeps every glyph a single dark colour, so contrast holds on both square
// tints regardless of piece colour. U+FE0E forces text (not emoji) rendering.
const GLYPH = {
  K: '♔',
  Q: '♕',
  R: '♖',
  B: '♗',
  N: '♘',
  P: '♙',
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
};
const VS = String.fromCodePoint(0xfe0e);

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const readData = () =>
  readdirSync(dataDir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(dataDir, f), 'utf8')));

const assertFresh = (entry) => {
  const startFen = entry.startFen ?? STANDARD_START;
  const { moves, fen } = applyLine(startFen, entry.line);
  if (fen !== entry.fen) {
    throw new Error(
      `${entry.slug}: stored fen "${entry.fen}" != derived "${fen}" — run derive.mjs`,
    );
  }
  if (JSON.stringify(moves) !== JSON.stringify(entry.moves)) {
    throw new Error(
      `${entry.slug}: stored moves differ from derived — run derive.mjs`,
    );
  }
  return { startFen, fen };
};

// Render a position (standard FEN) as an 8x8 Unicode board table.
const renderBoard = (fen, label) => {
  const { board } = fenToPosition(fen);
  const rows = [];
  for (let r = 0; r < 8; r += 1) {
    const cells = [];
    for (let f = 0; f < 8; f += 1) {
      const i = r * 8 + f;
      const light = (f + (8 - r)) % 2 === 0;
      const cls = light ? 'wc' : 'bc';
      const p = board[i];
      const glyph = p ? `${GLYPH[p]}${VS}` : '';
      cells.push(`<td class="${cls}">${glyph}</td>`);
    }
    rows.push(`<tr>${cells.join('')}</tr>`);
  }
  return (
    `<figure class="diagram">` +
    `<table class="board" aria-hidden="true"><tbody>${rows.join('')}</tbody></table>` +
    `<figcaption>${esc(label)}</figcaption></figure>`
  );
};

// "1. e4 e5 2. Nf3 Nc6 3. Bb5" from moves[].san, honouring the start position.
const renderMoveLine = (entry) => {
  const start = fenToPosition(entry.startFen ?? STANDARD_START);
  let num = start.full;
  let white = start.active === 'w';
  const parts = [];
  for (const mv of entry.moves) {
    if (white) {
      parts.push(`<b>${num}.</b> ${esc(mv.san)}`);
    } else {
      if (parts.length === 0) parts.push(`<b>${num}.</b> …`);
      parts.push(esc(mv.san));
      num += 1;
    }
    white = !white;
  }
  return parts.join(' ');
};

const list = (items) =>
  `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;

const paragraphs = (arr) => arr.map((p) => `<p>${esc(p)}</p>`).join('');

const STYLE = `
:root{--sq:min(44px,calc((100vw - 40px) / 8))}
*{box-sizing:border-box}
html{background:#cdbfa8}
body{margin:0;color:#2b2420;background:#ece3d3;
font-family:'Segoe UI',system-ui,-apple-system,Roboto,sans-serif;
line-height:1.6;font-size:17px}
.bar{background:#3a2a1e;color:#f4ece0;padding:10px 20px}
.bar nav{max-width:760px;margin:0 auto;font-size:14px}
.bar a{color:#f4d9b8;text-decoration:underline;padding:6px 4px;display:inline-block}
.bar span{opacity:.7;padding:0 4px}
main{max-width:760px;margin:0 auto;padding:20px}
h1{font-size:1.9rem;line-height:1.2;margin:.2em 0 .1em}
h2{font-size:1.3rem;margin:1.6em 0 .4em;border-bottom:2px solid #d6c3a2;padding-bottom:.2em}
h3{font-size:1.05rem;margin:1em 0 .3em}
.eco{display:inline-block;background:#5c3a1e;color:#fff;font-weight:600;
font-size:.8rem;letter-spacing:.5px;border-radius:4px;padding:3px 9px;margin-bottom:.4em}
.aka{color:#5a4d40;font-size:.95rem;margin:.2em 0 1em}
a{color:#7a3b12}
p a,li a{text-decoration:underline}
.diagram{margin:1.4em auto;text-align:center}
.board{border-collapse:collapse;border:6px solid #5c3a1e;border-radius:4px;
margin:0 auto;background:#5c3a1e}
.board td{width:var(--sq);height:var(--sq);text-align:center;padding:0;
font-size:calc(var(--sq) * .74);line-height:var(--sq);
font-family:'Arial Unicode MS','Segoe UI Symbol','Noto Sans Symbols2',sans-serif;
font-variant-emoji:text;color:#1c1a17}
.wc{background:#f0d9b5}
.bc{background:#b58863}
figcaption{color:#5a4d40;font-size:.9rem;margin-top:.6em;max-width:26rem;
margin-left:auto;margin-right:auto}
.moves{background:#f7f1e6;border:1px solid #d6c3a2;border-radius:8px;
padding:12px 16px;font-size:1.05rem;word-spacing:.15em}
.related{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:8px}
.related li{margin:0}
.related a{display:inline-block;background:#f7f1e6;border:1px solid #d6c3a2;
border-radius:999px;padding:9px 15px;text-decoration:none;color:#5c3a1e;
font-weight:600;font-size:.95rem;min-height:44px;line-height:26px}
.related a:hover{background:#efe4d0}
.cols{display:flex;flex-wrap:wrap;gap:8px 32px}
.cols>div{flex:1 1 240px}
footer{max-width:760px;margin:0 auto;padding:24px 20px 48px;color:#5a4d40;
font-size:.9rem;border-top:1px solid #d6c3a2;margin-top:2em}
footer a{padding:6px 4px;display:inline-block}
.hub-group{margin-bottom:1.4em}
.hub-list{list-style:none;padding:0;display:grid;gap:10px;
grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
.hub-list a{display:block;background:#f7f1e6;border:1px solid #d6c3a2;
border-radius:10px;padding:12px 15px;text-decoration:none;color:#2b2420;min-height:44px}
.hub-list a:hover{background:#efe4d0}
.hub-list .ec{color:#7a5a3a;font-weight:600;font-size:.8rem}
.hub-list .nm{color:#5c3a1e;font-weight:600}
.lede{font-size:1.1rem}
`
  .replace(/\n/g, '')
  .trim();

const head = (title, description, canonical) =>
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index, follow">
<meta name="theme-color" content="#3a2a1e">
<link rel="canonical" href="${esc(canonical)}">
<link rel="icon" href="../favicon.ico">
<style>${STYLE}</style>
</head>`;

const breadcrumbJsonLd = (crumbs) =>
  JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  });

// Openings and endgames share one template; a handful of fields switch on
// entry.category. Endgames have no ECO code (a `tag` names the family instead),
// their headline diagram is the *starting* named position rather than the
// position after the line, and their prose cross-links other endgames.
const CAT_LABEL = { opening: 'Openings', endgame: 'Endgames' };

const renderPage = (entry, nameBySlug) => {
  const { startFen, fen } = assertFresh(entry);
  const isEndgame = entry.category === 'endgame';
  const catLabel = CAT_LABEL[entry.category] ?? 'Openings';
  const canonical = `${SITE}encyclopedia/${entry.slug}.html`;
  const title = isEndgame
    ? `${entry.name} – Chess Endgames`
    : `${entry.name} (${entry.eco}) – Chess Openings`;
  const badge = isEndgame ? entry.tag : `ECO ${entry.eco}`;
  const diagramFen = isEndgame ? startFen : fen;
  const caption = isEndgame
    ? entry.boardCaption
    : `${entry.name}: position after ${plainMoveLine(entry)}.`;

  const sections = (entry.sections ?? [])
    .map((s) => `<h2>${esc(s.heading)}</h2>${paragraphs(s.paragraphs)}`)
    .join('');

  const plans =
    entry.plans && (entry.plans.white?.length || entry.plans.black?.length)
      ? `<h2>Typical plans</h2><div class="cols">` +
        `<div><h3>White</h3>${list(entry.plans.white ?? [])}</div>` +
        `<div><h3>Black</h3>${list(entry.plans.black ?? [])}</div></div>`
      : '';

  const keyIdeas = entry.keyIdeas?.length
    ? `<h2>Key ideas</h2>${list(entry.keyIdeas)}`
    : '';

  const related = entry.related?.length
    ? `<h2>Related ${isEndgame ? 'endgames' : 'openings'}</h2><ul class="related">` +
      entry.related
        .filter((slug) => nameBySlug.has(slug))
        .map(
          (slug) =>
            `<li><a href="${slug}.html">${esc(nameBySlug.get(slug))}</a></li>`,
        )
        .join('') +
      `</ul>`
    : '';

  const aka = entry.aka?.length
    ? `<p class="aka">Also known as: ${esc(entry.aka.join(', '))}</p>`
    : '';

  const jsonld = breadcrumbJsonLd([
    { name: 'Chess', url: SITE },
    { name: catLabel, url: HUB_URL },
    { name: entry.name, url: canonical },
  ]);

  return `${head(title, entry.summary, canonical)}
<body>
<div class="bar"><nav><a href="../">Chess</a><span>›</span><a href="index.html">${esc(catLabel)}</a><span>›</span>${esc(entry.name)}</nav></div>
<main>
<p class="eco">${esc(badge)}</p>
<h1>${esc(entry.name)}</h1>
${aka}
<p class="lede">${esc(entry.intro)}</p>
<p class="moves">${renderMoveLine(entry)}</p>
${renderBoard(diagramFen, caption)}
${sections}
${keyIdeas}
${plans}
${related}
</main>
<footer>
<p>Part of the <a href="index.html">Chess ${isEndgame ? 'Endgame' : 'Openings'} Encyclopedia</a> · <a href="../">play the game</a>. Positions are verified move-by-move against the game&#39;s own engine.</p>
</footer>
<script type="application/ld+json">${jsonld}</script>
</body>
</html>
`;
};

const plainMoveLine = (entry) => {
  const start = fenToPosition(entry.startFen ?? STANDARD_START);
  let num = start.full;
  let white = start.active === 'w';
  const parts = [];
  for (const mv of entry.moves) {
    if (white) parts.push(`${num}.${mv.san}`);
    else {
      if (parts.length === 0) parts.push(`${num}...`);
      parts.push(mv.san);
      num += 1;
    }
    white = !white;
  }
  return parts.join(' ');
};

// Hub layout: two category blocks (Openings, Endgames), each an <h2> with its
// named groups as <h3> sublists. Openings sort by ECO code; endgames sort by an
// authored `order` field (falling back to name). New groups only appear once at
// least one entry claims them, so the hub grows automatically.
const HUB_CATEGORIES = [
  {
    key: 'opening',
    label: 'Openings',
    groups: [
      'Open Games (1.e4 e5)',
      'Semi-Open Games (1.e4)',
      'Closed & Flank Openings',
    ],
  },
  {
    key: 'endgame',
    label: 'Endgames',
    groups: [
      'Basic Checkmates',
      'Pawn Endgames',
      'Rook Endgames',
      'Queen & Minor-Piece Endgames',
      'Endgame Concepts',
    ],
  },
];

const hubItem = (e) =>
  e.category === 'endgame'
    ? `<li><a href="${e.slug}.html"><span class="nm">${esc(e.name)}</span></a></li>`
    : `<li><a href="${e.slug}.html"><span class="ec">${esc(e.eco)}</span> ` +
      `<span class="nm">${esc(e.name)}</span></a></li>`;

const hubSort = (a, b) =>
  a.category === 'endgame'
    ? (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)
    : a.eco.localeCompare(b.eco);

const renderHub = (entries) => {
  const canonical = HUB_URL;
  const title = 'Chess Encyclopedia – Openings & Endgames';
  const description =
    'A growing, SEO-friendly chess encyclopedia: opening theory by ECO code plus essential endgames — checkmates, pawn, rook, queen and minor-piece play — every position verified against a real chess engine.';

  const nOpenings = entries.filter((e) => e.category !== 'endgame').length;
  const nEndgames = entries.filter((e) => e.category === 'endgame').length;

  const blocks = [];
  for (const cat of HUB_CATEGORIES) {
    const inCat = entries.filter((e) => (e.category ?? 'opening') === cat.key);
    if (!inCat.length) continue;
    const groups = [];
    for (const g of cat.groups) {
      const inGroup = inCat.filter((e) => e.group === g).sort(hubSort);
      if (!inGroup.length) continue;
      groups.push(
        `<section class="hub-group"><h3>${esc(g)}</h3>` +
          `<ul class="hub-list">${inGroup.map(hubItem).join('')}</ul></section>`,
      );
    }
    blocks.push(
      `<h2 id="${cat.key}s">${esc(cat.label)}</h2>${groups.join('')}`,
    );
  }

  const jsonld = breadcrumbJsonLd([
    { name: 'Chess', url: SITE },
    { name: 'Encyclopedia', url: HUB_URL },
  ]);

  return `${head(title, description, canonical)}
<body>
<div class="bar"><nav><a href="../">Chess</a><span>›</span>Encyclopedia</nav></div>
<main>
<h1>Chess Encyclopedia</h1>
<p class="lede">A growing reference for the royal game: the great openings by ECO code and the essential endgames every player must know. Each page gives the key moves, the ideas for both sides, and a board diagram — and every move is replayed through this site&#39;s own chess engine, so the theory you see is provably legal.</p>
${blocks.join('')}
</main>
<footer>
<p>${nOpenings} openings and ${nEndgames} endgames and counting · <a href="../">Play chess</a>. This encyclopedia grows over time.</p>
</footer>
<script type="application/ld+json">${jsonld}</script>
</body>
</html>
`;
};

const renderSitemapXml = (entries) => {
  const urls = [
    SITE,
    HUB_URL,
    ...entries.map((e) => `${SITE}encyclopedia/${e.slug}.html`),
  ];
  const body = urls
    .map(
      (u) =>
        `  <url><loc>${esc(u)}</loc><changefreq>monthly</changefreq></url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
};

// --- main ---
const entries = readData();
const nameBySlug = new Map(entries.map((e) => [e.slug, e.name]));

mkdirSync(outDir, { recursive: true });

for (const entry of entries) {
  writeFileSync(
    join(outDir, `${entry.slug}.html`),
    renderPage(entry, nameBySlug),
  );
}
writeFileSync(join(outDir, 'index.html'), renderHub(entries));
writeFileSync(join(buildDir, 'sitemap.xml'), renderSitemapXml(entries));

process.stdout.write(
  `encyclopedia: ${entries.length} pages + hub + sitemap -> build/encyclopedia/\n`,
);
