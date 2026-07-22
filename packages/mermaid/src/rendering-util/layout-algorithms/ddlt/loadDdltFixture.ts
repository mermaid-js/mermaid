import { resolve } from 'node:path';
import type { LayoutData } from '../../types.js';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import { setLogLevel } from '../../../logger.js';
import { parseApplySizesAndLayout } from './backends.js';
import { loadFreshSizesFixture } from './fixtureSizes.js';
import type { LayoutTestBackendId, OrthogonalTrace } from './types.js';

const FIXTURES_DIR = 'cypress/platform/dev-diagrams/layout-tests';

let diagramsRegistered = false;
function registerDiagramsOnce(): void {
  if (diagramsRegistered) {
    return;
  }
  addDiagrams();
  diagramsRegistered = true;
}

export interface LoadDdltFixtureOptions {
  /** Backend identifier — defaults to `'domus-orthogonal'`. */
  backendId?: LayoutTestBackendId;
  /** Optional pipeline trace sink, populated in place during routing. */
  trace?: OrthogonalTrace;
}

/**
 * Run a DDLT layout for a named fixture using the canonical pipeline.
 *
 * The fixture name is the basename used for both the `.mmd` source and the
 * captured `.sizes.json` under `cypress/platform/dev-diagrams/layout-tests/`.
 * Example: `loadDdltFixture('Company')` reads `Company.mmd` + `Company.sizes.json`.
 *
 * Pipeline used: `parseApplySizesAndLayout` → `runDomusOrthogonalDdlt` (the
 * same pipeline the browser runs in `domus/index.ts:layout()`). Anything that
 * fixes a layout bug in DDLT will fix it in the browser.
 */
export async function loadDdltFixture(
  name: string,
  options: LoadDdltFixtureOptions = {}
): Promise<LayoutData> {
  setLogLevel(process.env.ORTHO_TEST_DEBUG ? 'debug' : 'fatal');
  registerDiagramsOnce();
  const mmdPath = resolve(process.cwd(), FIXTURES_DIR, `${name}.mmd`);
  const sizesPath = resolve(process.cwd(), FIXTURES_DIR, `${name}.sizes.json`);
  const sizes = loadFreshSizesFixture(sizesPath, mmdPath, name);
  return await parseApplySizesAndLayout(mmdPath, sizes, options.backendId ?? 'domus-orthogonal', {
    trace: options.trace,
  });
}
