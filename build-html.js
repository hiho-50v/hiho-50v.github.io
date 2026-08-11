const fs = require('fs');
const path = require('path');
const { parseMarkdown, resetToc, getTocEntries, esc } = require('./parse-html');

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

// Alkusanat on siirretty etusivulle (instapostausten alle) — ei omaa lukusivua eikä TOC-riviä.
const foreword = chapters.find((c) => c.file === '01-alkusanat.md');
const tocChapters = chapters.filter((c) => c.file !== '01-alkusanat.md');

// --- Hampurilaisvalikko: päätaso (etusivu + luvut) ja alakohdat (otsikot) ---
// Jokaisella sivulla sama valikko, jotta sisällössä pääsee liikkumaan mistä tahansa.
const navSection = (label, href, entries) => {
  const subs = entries.filter((e) => e.text !== label);
  const sub = subs.length
    ? '<ul>' + subs.map((e) => `<li class="nav-l${e.level}"><a href="${href}#${e.id}">${esc(e.text)}</a></li>`).join('') + '</ul>'
    : '';
  return `<li class="nav-top"><a href="${href}">${esc(label)}</a>${sub}</li>`;
};
const navItems = [
  navSection('Etusivu', 'index.html', foreword ? foreword.entries : []),
  ...tocChapters.map((ch) => navSection(ch.title, ch.slug, ch.entries)),
].join('');
const navHtml = `
<input type="checkbox" id="nav-toggle" class="nav-toggle" hidden>
<label for="nav-toggle" class="nav-burger" aria-label="Avaa valikko"><span></span><span></span><span></span></label>
<label for="nav-toggle" class="nav-overlay" aria-hidden="true"></label>
<nav class="site-nav" aria-label="Sisällysnavigaatio">
  <div class="site-nav-inner">
    <p class="site-nav-title">Sisällys</p>
    <ul class="nav-list">${navItems}</ul>
  </div>
</nav>`;

const BASE = 'https://hiho-50v.github.io/';
const OG_DESC = 'Poimintoja seuran historiasta nettisivuilta ja instasta kielimallin tulkitsemana';
const HEAD = (title, pagePath = '') => `<!doctype html>
<html lang="fi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>HIHO 50v — ${title}</title>
<meta name="description" content="${OG_DESC}">
<link rel="icon" type="image/png" href="images/hiho_h_logo_transparent.png">
<link rel="apple-touch-icon" href="images/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Hiki-Hockey 50 vuotta">
<meta property="og:title" content="HIHO 50v — ${title}">
<meta property="og:description" content="${OG_DESC}">
<meta property="og:image" content="${BASE}images/og_image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${BASE}${pagePath}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="HIHO 50v — ${title}">
<meta name="twitter:description" content="${OG_DESC}">
<meta name="twitter:image" content="${BASE}images/og_image.png">
<link rel="stylesheet" href="style.css">
</head>
<body>
${navHtml}
<div class="page">
`;
const TAIL = `</div>
<script>
document.querySelectorAll('.site-nav a').forEach(function (a) {
  a.addEventListener('click', function () { var t = document.getElementById('nav-toggle'); if (t) t.checked = false; });
});
</script>
</body>
</html>
`;

// --- index.html: cover + full table of contents ---
let tocHtml = '<nav class="toc"><h2>Sisällys</h2><ol>';
for (const ch of tocChapters) {
  tocHtml += `<li><a href="${ch.slug}">${ch.title}</a></li>`;
}
tocHtml += '</ol></nav>';

// Instagram-tyyliset kortit etusivulle, kannen ja sisällysluettelon väliin.
// Ikonirivi: sydän + tykkäysmäärä, kommentti, repostaus, jako, tallennus.
const igActions = (count) => `
  <div class="ig-actions">
    <svg class="ig-heart" viewBox="0 0 24 24" fill="#ed4956" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
    <span class="ig-count">${count}</span>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 1 1 21 11.5z"/></svg>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
    <svg class="ig-save" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
  </div>`;

// Tykkääjärivi (facepile + nimi). Vapaaehtoinen: annetaan vain jos on nimettyjä tykkääjiä.
const igLikers = (name) => `<div class="ig-likers"><img class="ig-likers-pics" src="images/ig_likers.png" alt=""><span><span class="ig-liker-name">${name}</span> ja muut tykkäävät tästä</span></div>`;

const igCard = ({ user, img, alt, count, likers, caption }) => `
<article class="ig-post">
  <div class="ig-head">
    <div class="ig-avatar"><img src="images/hiho_h_logo_transparent.png" alt="HIHO"></div>
    <div class="ig-user">${user}</div>
    <div class="ig-more">•••</div>
  </div>
  <img class="ig-photo" src="images/${img}" alt="${alt}">${igActions(count)}
  ${likers ? igLikers(likers) : ''}
  <div class="ig-caption"><span class="ig-user">${user}</span> ${caption}</div>
</article>`;

const igCards =
  igCard({
    user: 'Hikiliikkujat Ry',
    img: 'ttkk_joukkuekuva_1979.jpg',
    alt: 'Hiki-Hockeyn joukkue Hakametsässä 1979, lainatuissa peliasuissa.',
    count: 130,
    likers: 'ttuominen76',
    caption: 'Viime kaudella 24 voittoa pelatuista 27 pelistä, nousu III-divisioonaan ja korkeakoulujen välinen PM-mestaruus! Kaudella 1978-1979 tavoitteet yhtä korkealla! Suunnitteilla myös joukkueen nimen muutos Hiki-Hockeyksi kansainväliseen toimintaan paremmin sopivaksi. <span class="ig-tags">#hikiliikkujat #varmatieto</span>',
  }) +
  igCard({
    user: 'Hikiliikkujat Ry',
    img: 'vuoden_ruukie_palkinto.jpg',
    alt: 'Vuoden ruukie -palkinto, Hikiliikkujat, kausi 1977–1978.',
    count: 67,
    likers: 'Hchicken',
    caption: 'Hikiliikkujien vuoden tulokas kaudella 1977-1978: Perustajajäsen Pekka Haakana. Onnittelut!',
  }) +
  igCard({
    user: 'Hiki-Hockey',
    img: 'koulukatu_1996.jpg',
    alt: 'Hiki-Hockey Koulukadun kentällä 1996, kevyessä lumisateessa.',
    count: 32,
    likers: null,
    caption: 'Kotivoitto Koulukadulla kevyessä lumisateessa. Linköpingin PM-kisat lähestyvät (NSC 1997)',
  });

// Alkusanat etusivulla: ensimmäinen kappale, sitten instapostaukset, sitten loput tekstistä.
const fwBody = foreword ? foreword.bodyHtml : '';
const fwCut = fwBody.indexOf('</p>');
const forewordWithPosts = fwCut >= 0
  ? fwBody.slice(0, fwCut + 4) + '\n' + igCards + '\n' + fwBody.slice(fwCut + 4)
  : igCards + '\n' + fwBody;

const indexHtml = HEAD('Etusivu') + `
<div class="cover">
  <img class="logo" src="images/hiho_h_logo_transparent.png" alt="HIHO">
  <h1>HIKI-HOCKEY 50 VUOTTA</h1>
  <p class="years">1976 – 2026</p>
  <p class="subtitle">Historiikki</p>
  <hr>
</div>
${forewordWithPosts}
${tocHtml}
` + TAIL;
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexHtml);

// --- one HTML page per chapter, with prev/next nav ---
for (let idx = 0; idx < tocChapters.length; idx++) {
  const ch = tocChapters[idx];
  const prev = tocChapters[idx - 1];
  const next = tocChapters[idx + 1];

  let nav = '<nav class="chapter-nav">';
  nav += prev ? `<a href="${prev.slug}">← ${prev.title}</a>` : '<span></span>';
  nav += `<a class="to-toc" href="index.html">Sisällys</a>`;
  nav += next ? `<a href="${next.slug}">${next.title} →</a>` : '<span></span>';
  nav += '</nav>';

  let closing = '';
  if (idx === tocChapters.length - 1) {
    closing = `
<div class="closing">
  <img src="images/hiho_h_logo_transparent.png" alt="HIHO">
  <p>Katso videolta HIHO:n saunailta ylioppilaiden terveydenhuoltosäätiön (YTHS) tiloissa vuonna 1999. Vanhimpia säilyneitä tallenteita. Korkeakoululta lainaan saatu digikamera tallensi tuohon aikaan vain muutamien sekuntien pituisia klippejä.</p>
  <a href="https://youtu.be/zlfQrABxRF0?is=XT1GMz5RVPGTMCvA" target="_blank" rel="noopener">youtu.be/zlfQrABxRF0</a>
</div>`;
  }

  const bodyWithToc = ch.bodyHtml.replace('<!--TOC-PLACEHOLDER-->', tocHtml);
  const html = HEAD(ch.title, ch.slug) + `<h1 class="chapter-title" style="display:none">${ch.title}</h1>\n${bodyWithToc}\n${closing}\n${nav}\n` + TAIL;
  fs.writeFileSync(path.join(OUT_DIR, ch.slug), html);
}

console.log('Built', tocChapters.length, 'chapter pages + index.html (alkusanat etusivulla)');
