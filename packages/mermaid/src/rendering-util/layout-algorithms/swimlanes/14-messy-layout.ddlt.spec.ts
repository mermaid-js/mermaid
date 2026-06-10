import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import type { LayoutData } from '../../types.js';
import { runSwimlanesDdlt } from '../ddlt/backends.js';
import { loadFreshSizesFixture } from '../ddlt/fixtureSizes.js';
import { parseMmdFileToLayoutData } from '../ddlt/parseToLayoutData.js';
import { validateLayout } from '../layout-utils/validateLayout.js';

const FIXTURE_ID = 'swimlanes/14-messy-layout';
const FIXTURES_DIR = 'cypress/platform/dev-diagrams/layout-tests';

let diagramsRegistered = false;
function registerDiagramsOnce(): void {
  if (diagramsRegistered) {
    return;
  }
  addDiagrams();
  diagramsRegistered = true;
}

async function runMessyLayout(autoLaneOrdering?: boolean): Promise<LayoutData> {
  registerDiagramsOnce();
  const mmdPath = resolve(process.cwd(), FIXTURES_DIR, `${FIXTURE_ID}.mmd`);
  const sizesPath = resolve(process.cwd(), FIXTURES_DIR, `${FIXTURE_ID}.sizes.json`);
  const sizes = loadFreshSizesFixture(sizesPath, mmdPath, FIXTURE_ID);
  const layout = await parseMmdFileToLayoutData(mmdPath, { stampFlowchartRendererFields: true });
  (layout as { layoutAlgorithm?: string }).layoutAlgorithm = 'swimlane';
  layout.config ??= {};
  layout.config.swimlane = { ...(layout.config.swimlane ?? {}) };
  if (autoLaneOrdering != null) {
    layout.config.swimlane.automaticLaneOrdering = autoLaneOrdering;
  }
  runSwimlanesDdlt(layout, sizes);
  return layout;
}

describe('Swimlanes DDLT - 14-messy-layout.mmd', () => {
  it('Level 2: validateLayout - routes the messy purchase flow as a valid layout', async () => {
    const layout = await runMessyLayout();
    const result = validateLayout(layout);

    if (!result.ok) {
      console.log('[14_MESSY_LAYOUT_DDLT] validateLayout result:', JSON.stringify(result, null, 2));
    }

    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it(
    'keeps the messy purchase flow valid when automatic lane ordering is enabled',
    { timeout: 20_000 },
    async () => {
      const baseline = validateLayout(await runMessyLayout(false));
      const automatic = validateLayout(await runMessyLayout(true));

      expect(automatic.ok).toBe(true);
      expect(automatic.issues).toEqual([]);
      expect(automatic.score).toBeGreaterThan(baseline.score);
    }
  );
});
