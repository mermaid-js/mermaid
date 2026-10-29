import { resolve } from 'node:path';
import { addDiagrams } from '../../../../diagram-api/diagram-orchestration.js';
import { setLogLevel } from '../../../../logger.js';
import type { LayoutData } from '../../../types.js';
import { runSwimlanesDdlt } from '../../ddlt/backends.js';
import { loadSizesFixture } from '../../ddlt/fixtureSizes.js';
import type { SizesFixture } from '../../ddlt/types.js';
import { parseMmdFileToLayoutData } from '../../ddlt/parseToLayoutData.js';

const FIXTURES_DIR = 'e2e/platform/dev-diagrams/layout-tests/swimlanes';

export type NodeSizes = Record<string, readonly [width: number, height: number]>;

let registered = false;

/**
 * Lays out a swimlane fixture with its captured sizes, replacing the nodes named in
 * `measuredInViewer` by the sizes the dev viewer measures today (the captured files
 * predate its larger node padding, and the layouts differ).
 */
export async function layOutFixture(
  name: string,
  measuredInViewer: NodeSizes = {}
): Promise<LayoutData> {
  const sizes = loadSizesFixture(`${resolve(process.cwd(), FIXTURES_DIR, name)}.sizes.json`);
  for (const node of sizes.nodes) {
    const measured = measuredInViewer[node.id];
    if (measured) {
      [node.width, node.height] = measured;
    }
  }
  return layOutWithSizes(name, sizes);
}

/** Lays out a fixture that has no captured sizes file, from the sizes the dev viewer measures. */
export function layOutMeasured(name: string, measuredInViewer: NodeSizes): Promise<LayoutData> {
  const nodes = Object.entries(measuredInViewer).map(([id, [width, height]]) => ({
    id,
    width,
    height,
  }));
  return layOutWithSizes(name, { nodes });
}

async function layOutWithSizes(name: string, sizes: SizesFixture): Promise<LayoutData> {
  setLogLevel('fatal');
  if (!registered) {
    addDiagrams();
    registered = true;
  }
  const layout = await parseMmdFileToLayoutData(
    `${resolve(process.cwd(), FIXTURES_DIR, name)}.mmd`,
    { stampFlowchartRendererFields: true }
  );
  (layout as { layoutAlgorithm?: string }).layoutAlgorithm = 'swimlane';
  runSwimlanesDdlt(layout, sizes);
  return layout;
}
