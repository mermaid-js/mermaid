#!/usr/bin/env node

/* eslint-disable no-console -- CLI tool, console output is intentional */

/**
 * verify-diagram — Render a mermaid diagram via the dev server and save a screenshot.
 *
 * Prerequisites:
 *   - Dev server running (`pnpm dev`) — port from MERMAID_PORT env or .env file (default 9000)
 *   - `playwright` installed as a dev dependency
 *   - Chromium browser installed: `npx playwright install chromium`
 *
 * Usage:
 *   node scripts/verify-diagram/verify.mjs -f /tmp/diagram.mmd
 *   node scripts/verify-diagram/verify.mjs -f /tmp/diagram.mmd -o /tmp/output.png
 *   node scripts/verify-diagram/verify.mjs -f /tmp/diagram.mmd --theme dark
 *
 * Flags:
 *   -f, --file     Path to a .mmd file containing diagram text (REQUIRED)
 *   -o, --output   Output PNG path (default: /tmp/mermaid-verify.png)
 *   --theme        Mermaid theme: default, dark, forest, neutral, base (default: default)
 *   --port         Dev server port (overrides MERMAID_PORT env and .env)
 *   --timeout      Render timeout in ms (default: 10000)
 *
 * IMPORTANT: Always use -f (file) mode. Do NOT pass diagram text via -d flag —
 * it breaks on frontmatter (---) and special shell characters.
 */

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

// --- Argument parsing ---

const { values: args } = parseArgs({
  options: {
    file: { type: 'string', short: 'f' },
    output: { type: 'string', short: 'o', default: '/tmp/mermaid-verify.png' },
    theme: { type: 'string', default: 'default' },
    port: { type: 'string' },
    timeout: { type: 'string', default: '10000' },
  },
  strict: false,
});

if (!args.file) {
  console.error('Error: -f / --file is required. Pass the path to a .mmd file.');
  console.error('Usage: node scripts/verify-diagram/verify.mjs -f /tmp/diagram.mmd');
  process.exit(1);
}

if (!fs.existsSync(args.file)) {
  console.error(`Error: File not found: ${args.file}`);
  process.exit(1);
}

// --- Resolve port ---

function resolvePort() {
  if (args.port) {
    return args.port;
  }
  if (process.env.MERMAID_PORT) {
    return process.env.MERMAID_PORT;
  }

  // Try reading .env from repo root
  const envPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../.env'), // from scripts/verify-diagram/
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = /^MERMAID_PORT=(\d+)/m.exec(content);
      if (match) {
        return match[1];
      }
    }
  }
  return '9000';
}

const port = resolvePort();
const timeout = parseInt(args.timeout, 10);
const diagramText = fs.readFileSync(args.file, 'utf8');

// --- Check dev server is up ---

async function checkServer(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

// --- Render --- // cspell:ignore networkidle

async function render() {
  const serverUrl = `http://localhost:${port}`;

  if (!(await checkServer(serverUrl))) {
    console.error(`Error: Dev server not reachable at ${serverUrl}`);
    console.error('Start it with: pnpm dev');
    process.exit(1);
  }

  // Build an inline HTML page that loads mermaid from the dev server
  const html = `<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 16px; background: white; }
  .mermaid { font-family: 'trebuchet ms', verdana, arial, sans-serif; }
  #error { color: red; font-family: monospace; white-space: pre-wrap; display: none; }
</style>
<script type="module">
import mermaid from '${serverUrl}/mermaid.esm.mjs';
mermaid.initialize({ startOnLoad: false, theme: '${args.theme}' });
try {
  const { svg } = await mermaid.render('verify', document.getElementById('source').textContent);
  document.getElementById('output').innerHTML = svg;
  window.__rendered = true;
} catch (e) {
  document.getElementById('error').textContent = 'Render error: ' + e.message;
  document.getElementById('error').style.display = 'block';
  window.__renderError = e.message;
  window.__rendered = true;
}
</script>
</head>
<body>
<pre id="source" style="display:none">${diagramText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
<div id="output"></div>
<div id="error"></div>
</body>
</html>`;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  await page.setContent(html, { waitUntil: 'networkidle' });

  // Wait for mermaid to render
  try {
    await page.waitForFunction(() => window.__rendered === true, { timeout });
  } catch {
    console.error(`Error: Diagram did not render within ${timeout}ms`);
    await browser.close();
    process.exit(1);
  }

  // Check for render errors
  const renderError = await page.evaluate(() => window.__renderError);
  if (renderError) {
    console.error(`Mermaid render error: ${renderError}`);
    await browser.close();
    process.exit(1);
  }

  // Screenshot just the rendered diagram, not the whole page
  const output = await page.locator('#output').boundingBox();
  if (output) {
    await page.screenshot({
      path: args.output,
      clip: {
        x: 0,
        y: 0,
        width: Math.ceil(output.x + output.width + 32),
        height: Math.ceil(output.y + output.height + 32),
      },
    });
  } else {
    await page.screenshot({ path: args.output, fullPage: true });
  }

  await browser.close();
  console.log(`Screenshot saved to ${args.output}`);
}

render().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
