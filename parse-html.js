// Markdown -> HTML converter for the web edition.
// Mirrors the block syntax in ../hiho50/parse.js exactly, but emits HTML
// strings instead of docx.js objects. Keeping the two in sync means the
// print and web editions always describe the same source of truth.

const fs = require('fs');
const path = require('path');

const esc = (s) => s
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

// Inline **bold**, *italic*, [text](url) — text is already HTML-escaped
// by the caller in contexts where that matters (archivebox/quotes use
// plain text, matching the print pipeline's runs_to_plain distinction).
function inline(text, { allowFormatting = true } = {}) {
  let t = esc(text);
  if (allowFormatting) {
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\*([^*]+?)\*/g, '<em>$1</em>');
  }
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return t;
}

let tocEntries = []; // { level, text, id }
let slugCounter = 0;
function resetToc() { tocEntries = []; slugCounter = 0; }
function getTocEntries() { return tocEntries; }

function nextId() { return `h_${++slugCounter}`; }

const isBlank = (l) => l.trim() === '';

function parseMarkdown(src) {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let buf = [];

  const flush = () => {
    if (buf.length) {
      out.push(`<p>${inline(buf.join(' ').trim())}</p>`);
      buf = [];
    }
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith(':::') && line.trim() !== ':::') {
      flush();
      const type = line.trim().slice(3).trim().split(/\s+/)[0];
      const body = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ':::') {
        body.push(lines[i]);
        i++;
      }
      i++; // skip closing :::
      out.push(renderBlock(type, body));
      continue;
    }

    if (/^#\s+/.test(line)) {
      flush();
      const text = line.replace(/^#\s+/, '').trim();
      const id = nextId();
      tocEntries.push({ level: 1, text, id });
      out.push(`<h1 id="${id}">${inline(text)}</h1>`);
      i++;
      continue;
    }

    if (/^##\s+/.test(line)) {
      flush();
      let text = line.replace(/^##\s+/, '').trim();
      const colorTag = text.match(/\s*\[(green|brown)\]\s*$/);
      let cls = '';
      if (colorTag) {
        text = text.slice(0, colorTag.index).trim();
        cls = ` class="h2-${colorTag[1]}"`;
      }
      const id = nextId();
      tocEntries.push({ level: 2, text, id });
      out.push(`<h2 id="${id}"${cls}>${inline(text)}</h2>`);
      i++;
      continue;
    }

    if (isBlank(line)) { flush(); i++; continue; }

    buf.push(line.trim());
    i++;
  }
  flush();
  return out.join('\n');
}

function renderBlock(type, bodyLines) {
  const nonBlank = bodyLines.filter((l) => l.trim() !== '');
  const caption = nonBlank.length && nonBlank[nonBlank.length - 1].trim().startsWith('^')
    ? nonBlank[nonBlank.length - 1].trim().replace(/^\^\s*/, '')
    : null;
  const textLines = caption ? nonBlank.slice(0, -1) : nonBlank;
  const joinedPlain = textLines.join(' ').trim();

  switch (type) {
    case 'archival':
      return `<blockquote class="q-archival">${esc(joinedPlain)}</blockquote>`;

    case 'ig': {
      let html = `<blockquote class="q-ig">${esc(joinedPlain)}</blockquote>`;
      if (caption) html += `<p class="q-ig-cap">${esc(caption)}</p>`;
      return html;
    }
    case 'press': {
      let html = `<blockquote class="q-press">${esc(joinedPlain)}</blockquote>`;
      if (caption) html += `<p class="q-press-cap">${esc(caption)}</p>`;
      return html;
    }
    case 'fix': {
      let html = `<blockquote class="q-fix">${esc(joinedPlain)}</blockquote>`;
      if (caption) html += `<p class="q-fix-cap">${esc(caption)}</p>`;
      return html;
    }

    case 'sini': {
      let html = `<p class="sini">${esc(joinedPlain)}</p>`;
      if (caption) html += `<p class="sini-sig">${esc(caption)}</p>`;
      return html;
    }

    case 'regbox': {
      const rows = textLines.map((l) => l.split('|').map((s) => s.trim()));
      let html = '<table class="regbox">';
      for (const [label, value] of rows) {
        html += `<tr><th>${esc(label)}</th><td>${esc(value)}</td></tr>`;
      }
      html += '</table>';
      if (caption) html += `<p class="regbox-cap">${esc(caption)}</p>`;
      return html;
    }

    case 'todo':
      return `<p class="todo">${esc(joinedPlain)}</p>`;

    case 'mbullets':
      return `<ul class="bullets bullets-m">${nonBlank.map((l) => `<li>${esc(l.trim())}</li>`).join('')}</ul>`;
    case 'sbullets':
      return `<ul class="bullets bullets-s">${nonBlank.map((l) => `<li>${esc(l.trim())}</li>`).join('')}</ul>`;
    case 'hbullets':
      return `<ul class="bullets bullets-h">${nonBlank.map((l) => `<li>${esc(l.trim())}</li>`).join('')}</ul>`;

    case 'img': {
      const meta = {};
      nonBlank.forEach((l) => {
        const m = l.match(/^(\w+):\s*(.+)$/);
        if (m) meta[m[1]] = m[2].trim();
      });
      const base = path.basename(meta.path || '', path.extname(meta.path || ''));
      // web-optimized copies are always .jpg unless they had transparency (kept .png)
      const pngCandidate = path.join(__dirname, 'images', base + '.png');
      const webFile = fs.existsSync(pngCandidate) ? base + '.png' : base + '.jpg';
      let imgTag = `<img src="images/${webFile}" alt="${esc(meta.caption || '')}" loading="lazy">`;
      if (meta.url) imgTag = `<a href="${esc(meta.url)}" target="_blank" rel="noopener">${imgTag}</a>`;
      let html = `<figure>${imgTag}`;
      if (meta.caption) html += `<figcaption>${esc(meta.caption)}</figcaption>`;
      html += '</figure>';
      return html;
    }

    case 'archivebox': {
      let html = '<div class="archivebox">';
      let pbuf = [];
      const flushP = () => { if (pbuf.length) { html += `<p>${esc(pbuf.join(' ').trim())}</p>`; pbuf = []; } };
      for (const raw of bodyLines) {
        const l = raw;
        if (isBlank(l)) { flushP(); continue; }
        if (/^#\s+/.test(l)) { flushP(); html += `<h3>${esc(l.replace(/^#\s+/, '').trim())}</h3>`; continue; }
        if (/^##\s+/.test(l)) { flushP(); html += `<h4>${esc(l.replace(/^##\s+/, '').trim())}</h4>`; continue; }
        if (/^\+\s+/.test(l)) { flushP(); html += `<p class="a-foot">${esc(l.replace(/^\+\s+/, '').trim())}</p>`; continue; }
        if (/^>\s+/.test(l)) { flushP(); html += `<p class="a-sig">${esc(l.replace(/^>\s+/, '').trim())}</p>`; continue; }
        pbuf.push(l.trim());
      }
      flushP();
      html += '</div>';
      return html;
    }

    case 'cta': {
      const meta = {};
      nonBlank.forEach((l) => {
        const m = l.match(/^(\w+):\s*(.+)$/);
        if (m) meta[m[1]] = m[2].trim();
      });
      return `<a class="cta-button" href="${esc(meta.url || '#')}" target="_blank" rel="noopener">${esc(meta.label || 'Seuraa Hihoa')}</a>`;
    }

    case 'toc':
      return '<!--TOC-PLACEHOLDER-->';

    default:
      return `<p>${inline(joinedPlain)}</p>`;
  }
}

module.exports = { parseMarkdown, resetToc, getTocEntries, esc };
