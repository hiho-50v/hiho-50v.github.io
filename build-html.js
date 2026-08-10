const fs = require('fs');
const path = require('path');
const { parseMarkdown, resetToc, getTocEntries } = require('./parse-html');

const CONTENT_DIR = path.join(__dirname, '..', 'hiho50', 'content');
const OUT_DIR = __dirname;

const CHAPTER_TITLES = {
  '01-alkusanat.md': 'Alkusanat',
  '03-tanaan.md': 'Hiki-Hockey tänä päivänä',
  '04-seura-omin-sanoin.md': 'Seura omin sanoin',
  '05-ulkopuolinen-todiste.md': 'Ulkopuolinen todiste',
  '055-nettisivut.md': 'Nettisivut 1996–2016',
  '06-sama-peli.md': 'Sama peli, uudet nimet',
  '08-kutsu.md': 'Kutsu vuosijuhliin',
  '09-liite-saimaa.md': 'Liite 1: Saimaa-turnaus 2026',
};

const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md')).sort();

// Pass 1: render every chapter's HTML body and collect the global TOC
// (headings need file-qualified anchors so cross-chapter links resolve).
resetToc();
const chapters = [];
for (const f of files) {
  const src = fs.readFileSync(path.join(CONTENT_DIR, f), 'utf8');
  const before = getTocEntries().length;
  const bodyHtml = parseMarkdown(src);
  const entries = getTocEntries().slice(before);
  const slug = f.replace(/\.md$/, '') + '.html';
  chapters.push({ file: f, slug, title: CHAPTER_TITLES[f] || f, bodyHtml, entries });
}

const HEAD = (title) => `<!doctype html>
<html lang="fi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — Hiki-Hockey 50 vuotta</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="page">
`;
const TAIL = `</div>
</body>
</html>
`;

// --- index.html: cover + full table of contents ---
let tocHtml = '<nav class="toc"><h2>Sisällys</h2><ol>';
for (const ch of chapters) {
  tocHtml += `<li><a href="${ch.slug}">${ch.title}</a></li>`;
}
tocHtml += '</ol></nav>';

const indexHtml = HEAD('Etusivu') + `
<div class="cover">
  <img class="logo" src="images/hiho_h_logo_transparent.png" alt="HIHO">
  <h1>HIKI-HOCKEY 50 VUOTTA</h1>
  <p class="years">1976 – 2026</p>
  <p class="subtitle">Historiikki</p>
  <hr>
</div>
${tocHtml}
` + TAIL;
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexHtml);

// --- one HTML page per chapter, with prev/next nav ---
for (let idx = 0; idx < chapters.length; idx++) {
  const ch = chapters[idx];
  const prev = chapters[idx - 1];
  const next = chapters[idx + 1];

  let nav = '<nav class="chapter-nav">';
  nav += prev ? `<a href="${prev.slug}">← ${prev.title}</a>` : '<span></span>';
  nav += `<a class="to-toc" href="index.html">Sisällys</a>`;
  nav += next ? `<a href="${next.slug}">${next.title} →</a>` : '<span></span>';
  nav += '</nav>';

  let closing = '';
  if (idx === chapters.length - 1) {
    closing = `
<div class="closing">
  <img src="images/hiho_h_logo_transparent.png" alt="HIHO">
  <p>Katso videolta HIHO:n saunailta ylioppilaiden terveydenhuoltosäätiön (YTHS) tiloissa vuonna 1999. Vanhimpia säilyneitä tallenteita. Korkeakoululta lainaan saatu digikamera tallensi tuohon aikaan vain muutamien sekuntien pituisia klippejä.</p>
  <a href="https://youtu.be/zlfQrABxRF0?is=XT1GMz5RVPGTMCvA" target="_blank" rel="noopener">youtu.be/zlfQrABxRF0</a>
</div>`;
  }

  const bodyWithToc = ch.bodyHtml.replace('<!--TOC-PLACEHOLDER-->', tocHtml);
  const html = HEAD(ch.title) + `<h1 class="chapter-title" style="display:none">${ch.title}</h1>\n${bodyWithToc}\n${closing}\n${nav}\n` + TAIL;
  fs.writeFileSync(path.join(OUT_DIR, ch.slug), html);
}

console.log('Built', chapters.length, 'chapter pages + index.html');
