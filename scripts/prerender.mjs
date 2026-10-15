// Post-build prerender for AI crawlers (GPTBot, PerplexityBot, ClaudeBot…).
// They do not run JavaScript, so the SPA shell gives them an empty page.
// This script renders the built site in headless Chrome, takes the text-bearing
// markup of #root and puts it back into dist/index.html inside a visually-hidden
// wrapper. React's createRoot clears #root on first render, so humans see exactly
// the same page as before; crawlers get the same text people see after JS.
// No npm dependencies: uses the system Chrome (`--dump-dom`) and Node built-ins.

import { createServer } from 'node:http';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync, mkdtempSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';

const DIST = path.resolve('dist');
const INDEX = path.join(DIST, 'index.html');
const MIN_TEXT_CHARS = 500; // fail the build rather than ship an empty snapshot

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
};

function serve(dir) {
  const server = createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(dir, p);
    if (!file.startsWith(dir)) { res.writeHead(403).end(); return; }
    try {
      if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    } catch { file = INDEX; }
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404).end(); }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function dumpDom(chrome, url) {
  const args = [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
    '--hide-scrollbars', '--window-size=1440,900',
    `--user-data-dir=${mkdtempSync(path.join(tmpdir(), 'sd-prerender-'))}`,
    '--virtual-time-budget=20000', '--dump-dom', url,
  ];
  return new Promise((resolve, reject) =>
    execFile(chrome, args, { maxBuffer: 32 * 1024 * 1024, timeout: 120000 }, (err, out) =>
      err ? reject(err) : resolve(out)));
}

// Inner HTML of <div id="root">…</div>, balancing nested divs.
function rootInner(html) {
  const open = '<div id="root">';
  const start = html.indexOf(open);
  if (start < 0) throw new Error('#root not found in rendered DOM');
  const re = /<div\b|<\/div>/g;
  re.lastIndex = start + open.length;
  let depth = 1, m;
  while ((m = re.exec(html))) {
    depth += m[0] === '</div>' ? -1 : 1;
    if (depth === 0) return html.slice(start + open.length, m.index);
  }
  throw new Error('unbalanced #root');
}

const KEEP_ATTRS = new Set(['href', 'rel', 'target', 'alt', 'title', 'lang']);

function clean(html) {
  return html
    // drop non-text and active content
    .replace(/<(script|style|noscript|svg|video|audio|iframe|canvas|button)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // images: keep only their alt text, so the hidden snapshot downloads nothing
    .replace(/<img\b[^>]*>/gi, (tag) => {
      const alt = /\balt="([^"]*)"/i.exec(tag)?.[1]?.trim();
      return alt ? `<span>${alt}</span>` : '';
    })
    // whitelist attributes (drops class/style/id/data-*: no duplicate ids, no inline opacity)
    .replace(/<([a-z][a-z0-9]*)\b([^>]*)>/gi, (_, tag, attrs) => {
      const kept = [];
      for (const a of attrs.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("[^"]*"|'[^']*')/g)) {
        if (KEEP_ATTRS.has(a[1].toLowerCase())) kept.push(`${a[1]}=${a[2]}`);
      }
      return `<${tag}${kept.length ? ' ' + kept.join(' ') : ''}>`;
    })
    // collapse empty wrappers and whitespace
    .replace(/<(div|span)>\s*<\/\1>/g, '')
    .replace(/<(div|span)>\s*<\/\1>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const textLength = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;

// Standard "visually hidden" pattern: takes no space, paints nothing, stays in the HTML text.
const WRAP_STYLE =
  'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;' +
  'clip:rect(0 0 0 0);clip-path:inset(50%);border:0;white-space:normal';

async function main() {
  const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!chrome) throw new Error('Chrome not found; set CHROME_PATH');

  const template = await readFile(INDEX, 'utf8');
  if (!template.includes('<div id="root"></div>')) throw new Error('dist/index.html: empty #root not found (already prerendered?)');

  const server = await serve(DIST);
  const { port } = server.address();
  try {
    const dom = await dumpDom(chrome, `http://127.0.0.1:${port}/`);
    const snapshot = clean(rootInner(dom));
    const chars = textLength(snapshot);
    if (chars < MIN_TEXT_CHARS) throw new Error(`prerender produced only ${chars} text chars`);
    const out = template.replace(
      '<div id="root"></div>',
      `<div id="root"><div data-prerender="ai-crawlers" style="${WRAP_STYLE}">${snapshot}</div></div>`,
    );
    await writeFile(INDEX, out);
    console.log(`prerender: ${chars} text chars injected into dist/index.html`);
  } finally {
    server.close();
  }
}

main().catch((e) => { console.error('prerender failed:', e.message); process.exit(1); });
