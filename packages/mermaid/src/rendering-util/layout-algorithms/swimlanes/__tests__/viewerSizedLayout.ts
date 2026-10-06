import { resolve } from 'node:path';
import { addDiagrams } from '../../../../diagram-api/diagram-orchestration.js';
import { setLogLevel } from '../../../../logger.js';
import type { LayoutData } from '../../../types.js';
import { runSwimlanesDdlt } from '../../ddlt/backends.js';
import { loadSizesFixture } from '../../ddlt/fixtureSizes.js';
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
  setLogLevel('fatal');
  if (!registered) {
    addDiagrams();
    registered = true;
  }
  const base = resolve(process.cwd(), FIXTURES_DIR, name);
  const sizes = loadSizesFixture(`${base}.sizes.json`);
  for (const node of sizes.nodes) {
    const measured = measuredInViewer[node.id];
    if (measured) {
      [node.width, node.height] = measured;
    }
  }
  const layout = await parseMmdFileToLayoutData(`${base}.mmd`, {
    stampFlowchartRendererFields: true,
  });
  (layout as { layoutAlgorithm?: string }).layoutAlgorithm = 'swimlane';
  runSwimlanesDdlt(layout, sizes);
  return layout;
}
