/**
 * Maintains cypress/sheet-order.json — the committed, append-only tile order the
 * screenshot-sheets batcher uses so adding a visual test only re-tiles its
 * group's last sheet instead of shifting every following tile across sheets.
 *
 * The manifest moves through git with the tests it describes: when you add,
 * remove, or rename a visual test, regenerate it and commit it in the same PR so
 * the new tile's slot shows up in the diff.
 *
 * Usage:
 *   pnpm run screenshots:order            # rewrite the manifest from captured screenshots
 *   pnpm run screenshots:order --check    # CI: fail if any screenshot is missing from it
 *
 * Reads screenshots from SCREENSHOT_DIR (default cypress/screenshots) — run the
 * e2e suite (or the specs you touched) first so the screenshots exist.
 */

/* eslint-disable no-console */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  collectScreenshots,
  updateOrder,
  findUnordered,
  type OrderManifest,
} from './screenshot-sheets.ts';

const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR ?? 'cypress/screenshots';
const ORDER_FILE = process.env.SHEET_ORDER_FILE ?? 'cypress/sheet-order.json';

async function readManifest(): Promise<OrderManifest> {
  try {
    return JSON.parse(await readFile(ORDER_FILE, 'utf8')) as OrderManifest;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

function serialize(order: OrderManifest): string {
  return JSON.stringify(order, null, 2) + '\n';
}

async function main(): Promise<void> {
  const check = process.argv.includes('--check');
  const relPaths = await collectScreenshots(SCREENSHOT_DIR);
  const previous = await readManifest();

  if (check) {
    // Scope-tolerant: a screenshot present on disk but absent from the manifest
    // means a test was added/renamed without refreshing it. Existing entries
    // can't drift (regeneration preserves committed order), so missing-only is
    // the whole check, and scoped runs only validate the groups they captured.
    const missing = findUnordered(relPaths, previous);
    const count = Object.values(missing).reduce((n, list) => n + list.length, 0);
    if (count > 0) {
      console.error(
        `[screenshots:order] ${count} screenshot(s) are missing from ${ORDER_FILE}:\n` +
          Object.entries(missing)
            .map(([group, list]) => `  ${group}:\n${list.map((r) => `    ${r}`).join('\n')}`)
            .join('\n') +
          `\n\nRun \`pnpm run screenshots:order\` after capturing screenshots and commit ${ORDER_FILE}.`
      );
      process.exit(1);
    }
    console.log(
      `[screenshots:order] ${ORDER_FILE} is in sync (${relPaths.length} screenshots checked).`
    );
    return;
  }

  const next = updateOrder(relPaths, previous);
  await writeFile(ORDER_FILE, serialize(next));
  const total = Object.values(next).reduce((n, list) => n + list.length, 0);
  console.log(
    `[screenshots:order] wrote ${ORDER_FILE} (${total} tiles across ${Object.keys(next).length} groups).`
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void main();
}
