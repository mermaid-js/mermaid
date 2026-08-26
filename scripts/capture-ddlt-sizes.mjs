/**
 * Capture DDLT `.sizes.json` fixtures for a directory of `.mmd` files.
 *
 * DDLT runs layout in Node with no DOM, so the measured sizes a browser would
 * have produced have to come from somewhere. This script is that somewhere: it
 * drives a real Chromium against the running dev server, renders each diagram
 * with size capture enabled, and posts the result to `/dev/api/sizes`, which
 * writes the sibling `.sizes.json` with the freshness metadata (source hash,
 * capture version) that `assertSizesFixtureFresh` checks.
 *
 * The dev explorer has a button that does this for one open file. This is the
 * same capture for a whole directory, so re-capturing after an edit to a batch
 * of fixtures is one command rather than N clicks.
 *
 * Usage (dev server must be running — `pnpm dev`):
 *
 *   node scripts/capture-ddlt-sizes.mjs --dir layout-tests/elk-edge-cases --layout elk
 *
 * `--dir` is relative to `e2e/platform/dev-diagrams` (the dev-explorer root).
 * `--layout` must be one of the layouts whose measure step runs
 * `createGraphWithElements`, since that is where the capture hook lives:
 * `elk`, `domus`, `swimlane`. `dagre` will silently capture nothing.
 */
import { chromium } from '@playwright/test';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}

const dir = arg('dir');
const layout = arg('layout', 'elk');
const theme = arg('theme', 'default');
const look = arg('look', 'classic');
const port = arg('port', process.env.MERMAID_DEV_PORT ?? '9000');
const base = `http://localhost:${port}`;

if (!dir) {
  console.error('Missing --dir (relative to e2e/platform/dev-diagrams)');
  process.exit(1);
}

const CAPTURE_LAYOUTS = ['elk', 'domus', 'swimlane'];
if (!CAPTURE_LAYOUTS.includes(layout)) {
  console.error(`--layout must be one of ${CAPTURE_LAYOUTS.join(', ')} (got "${layout}")`);
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
page.on('pageerror', (err) => console.error('  [pageerror]', err.message));

// The dev-explorer bootstrap is what registers the ELK layout loader, so load
// that page rather than building an equivalent harness here — one less thing
// that can drift from what the browser actually runs.
await page.goto(`${base}/dev/`, { waitUntil: 'load' });
await page.waitForFunction(() => Boolean(window.mermaidReady), null, { timeout: 30_000 });

const results = await page.evaluate(
  async ({ dir, layout, theme, look }) => {
    const mermaid = await window.mermaidReady;
    const listing = await (await fetch(`/dev/api/files?path=${encodeURIComponent(dir)}`)).json();
    const files = (listing.entries ?? []).filter(
      (e) => e.kind === 'file' && e.path.endsWith('.mmd')
    );

    const out = [];
    window.mermaidCaptureSizes = true;
    for (const file of files) {
      const host = document.createElement('div');
      // Off-screen but laid out, so getBBox reports real text metrics.
      host.style.cssText = 'position:absolute;left:-99999px;top:0;width:2000px;';
      document.body.appendChild(host);
      try {
        const src = await (
          await fetch(`/dev/api/file?path=${encodeURIComponent(file.path)}`)
        ).text();
        window.mermaidLastCapturedSizes = undefined;
        await mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme,
          look,
          layout,
          logLevel: 5,
          maxTextSize: 500_000,
          maxEdges: 2000,
        });
        await mermaid.render(`ddlt-capture-${out.length}`, src, host);

        const captured = window.mermaidLastCapturedSizes;
        if (!captured?.sizes.nodes.length) {
          out.push({ file: file.path, error: 'no sizes captured' });
          continue;
        }
        const res = await fetch('/dev/api/sizes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: file.path,
            nodes: captured.sizes.nodes,
            groups: captured.sizes.groups ?? [],
            edges: captured.sizes.edges ?? [],
            capturedFrom: `capture-ddlt-sizes ${file.path} theme=${theme} look=${look} layout=${layout}`,
            theme,
            look,
          }),
        });
        const body = await res.json();
        out.push(
          res.ok
            ? {
                file: file.path,
                nodes: body.nodes,
                groups: body.groups,
                edges: body.edges,
              }
            : { file: file.path, error: body.error ?? `HTTP ${res.status}` }
        );
      } catch (e) {
        out.push({ file: file.path, error: e instanceof Error ? e.message : String(e) });
      } finally {
        host.remove();
      }
    }
    window.mermaidCaptureSizes = false;
    return out;
  },
  { dir, layout, theme, look }
);

await browser.close();

let failed = 0;
for (const row of results) {
  if (row.error) {
    failed++;
    console.error(`✗ ${row.file}: ${row.error}`);
  } else {
    console.log(`✓ ${row.file}  nodes=${row.nodes} groups=${row.groups} edges=${row.edges}`);
  }
}
console.log(`\n${results.length - failed}/${results.length} captured`);
process.exit(failed > 0 ? 1 : 0);
