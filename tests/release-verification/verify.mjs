/* eslint-disable no-console */
/**
 * Drives the three standalone pages in a real browser and reports each check.
 *
 * The pages under test are plain HTML importing the *packaged* artifacts from
 * ./node_modules, installed from the tarballs `pnpm pack` produces — the same
 * tarballs `npm publish` uploads. Nothing here touches the mermaid source tree.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

const handle = async (req, res) => {
  try {
    const rel = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
    const path = join(ROOT, rel);
    if (!(await stat(path)).isFile()) {
      throw new Error('not a file');
    }
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
    res.end(await readFile(path));
  } catch {
    res.writeHead(404).end('not found');
  }
};

const server = createServer((req, res) => {
  void handle(req, res);
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const PAGES = [
  ['a', 'a-mermaid-elk-and-dagre.html', 'Full mermaid runs ELK and dagre'],
  ['b', 'b-tiny-falls-back-to-dagre.html', 'tiny (no ELK) falls back to dagre'],
  ['c', 'c-tiny-with-elk-plugin.html', 'tiny + @mermaid-js/layout-elk renders with ELK'],
];

const browser = await chromium.launch();
let failed = 0;

for (const [id, file, title] of PAGES) {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e.message)));
  await page.goto(`${base}/${file}`);
  let result;
  try {
    await page.waitForFunction(() => window.__result?.ok !== undefined, null, { timeout: 30000 });
    result = await page.evaluate(() => window.__result);
  } catch {
    result = { ok: false, error: 'page never reported a result', checks: [] };
  }

  console.log(`\n${id}) ${title}`);
  for (const c of result.checks ?? []) {
    console.log(`   ${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
    if (!c.pass) {
      failed++;
    }
  }
  // The page's own verdict, asserted rather than merely waited on: a page that
  // reported `ok: false` without a failing check or an error would otherwise
  // pass silently.
  if (result.ok !== true) {
    console.log('   FAIL  page reported ok: false');
    failed++;
  }
  if (result.error) {
    console.log(`   ERROR ${result.error}`);
    failed++;
  }
  if (pageErrors.length) {
    console.log(`   PAGE ERRORS ${JSON.stringify(pageErrors)}`);
    failed++;
  }
  await page.close();
}

await browser.close();
server.close();
console.log(`\n${failed === 0 ? 'ALL CHECKS PASSED' : failed + ' CHECK(S) FAILED'}`);
process.exit(failed === 0 ? 0 : 1);
