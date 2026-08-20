/**
 * Regenerate (or verify) the committed sheet-order manifest.
 *
 * The compositor (screenshot-sheets.ts) tiles each group in the order pinned by
 * `e2e/sheet-order.json`: new screenshots append at their group's tail and
 * removed ones leave a blank cell, so adding/removing a test re-tiles only the
 * affected sheet instead of cascading the whole sorted tail. This script keeps
 * that manifest compact — it append-folds newly-seen screenshots into stable
 * order and prunes removed ones. Run it after capturing a full screenshot set.
 *
 *   pnpm run screenshots:order            # rewrite the manifest from captured screenshots
 *   pnpm run screenshots:order --check    # report screenshots missing from the manifest (non-fatal)
 *
 * Env: SCREENSHOT_DIR (default e2e/screenshots),
 *      SHEET_ORDER_FILE (default e2e/sheet-order.json).
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  collectScreenshots,
  findUnordered,
  readOrderManifest,
  updateOrder,
} from './screenshot-sheets.js';

function log(message: string): void {
  process.stdout.write(`[order] ${message}\n`);
}

const countTiles = (manifest: Record<string, string[]>): number =>
  Object.values(manifest).reduce((n, list) => n + list.length, 0);

async function main(): Promise<void> {
  const screenshotDir = process.env.SCREENSHOT_DIR ?? 'e2e/screenshots';
  const orderFile = process.env.SHEET_ORDER_FILE ?? 'e2e/sheet-order.json';
  const check = process.argv.slice(2).includes('--check');

  const relPaths = await collectScreenshots(screenshotDir);
  const previous = await readOrderManifest(orderFile);

  if (check) {
    const missing = findUnordered(relPaths, previous);
    const count = countTiles(missing);
    if (count > 0) {
      log(
        `${count} screenshot(s) are not in ${orderFile} (they will append at their group's tail):\n` +
          Object.entries(missing)
            .map(([group, list]) => `  ${group}:\n${list.map((r) => `    ${r}`).join('\n')}`)
            .join('\n') +
          `\n\nRun \`pnpm run screenshots:order\` after a full capture and commit ${orderFile} to keep it compact.`
      );
    } else {
      log(`${orderFile} is in sync (${relPaths.length} screenshots checked).`);
    }
    return;
  }

  const next = updateOrder(relPaths, previous);
  await writeFile(orderFile, JSON.stringify(next, null, 2) + '\n');
  log(`wrote ${orderFile} (${countTiles(next)} tiles across ${Object.keys(next).length} groups).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void main();
}
