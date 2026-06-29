/**
 * Upload composite Argos sheets with verified metadata sidecars.
 *
 * Regenerates `.png.argos.json` from tile manifests (source of truth), verifies
 * every PNG has annotations, then invokes the Argos CLI upload.
 *
 *   pnpm run argos:upload-sheets
 *   SHEETS_DIR=e2e/sheets ARGOS_SUBSET=true pnpm run argos:upload-sheets
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyArgosMetadataSidecars } from '../e2e/helpers/argos-metadata.ts';
import { ensureSheetMetadataSidecars } from './screenshot-sheets.ts';

function log(message: string): void {
  process.stdout.write(`[argos-upload] ${message}\n`);
}

async function main(): Promise<void> {
  const sheetsDir = process.env.SHEETS_DIR ?? 'e2e/sheets';
  const absDir = resolve(sheetsDir);

  if (!existsSync(absDir)) {
    log(`no sheets directory at ${sheetsDir} — nothing to upload`);
    return;
  }

  const ensured = await ensureSheetMetadataSidecars(absDir);
  log(`ensured ${ensured} metadata sidecars in ${sheetsDir}`);

  const check = await verifyArgosMetadataSidecars(absDir);
  log(`verified ${check.withAnnotations}/${check.pngs} sheets carry tile annotations`);

  if (check.missingSidecars.length > 0) {
    throw new Error(`Missing Argos sidecars for: ${check.missingSidecars.slice(0, 5).join(', ')}`);
  }
  if (check.corruptSidecars.length > 0) {
    throw new Error(`Corrupt Argos sidecars: ${check.corruptSidecars.slice(0, 5).join(', ')}`);
  }
  if (check.emptyAnnotations.length > 0) {
    throw new Error(
      `Argos sidecars without annotations: ${check.emptyAnnotations.slice(0, 5).join(', ')}`
    );
  }

  if (check.pngs === 0) {
    log('no sheets to upload');
    return;
  }

  const args = ['argos', 'upload', sheetsDir];
  if (process.env.ARGOS_SUBSET === 'true') {
    args.push('--subset');
  }
  log(`running: npx ${args.join(' ')}`);

  const result = spawnSync('npx', args, {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.error) {
    throw new Error(`Failed to run "npx ${args.join(' ')}": ${result.error.message}`);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void main();
}
