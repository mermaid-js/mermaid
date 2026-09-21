import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import {
  applyFixtureContentSizesStrict,
  loadFreshSizesFixture,
  parseMmdFileToLayoutData,
} from '../ddlt/index.js';
import { runGridDdlt } from '../ddlt/backends.js';
import { prepareGridLayout } from './edgeLabels.js';
import { runGridLayoutCore } from './layoutCore.js';

const FIXTURES_DIR = 'e2e/platform/dev-diagrams/layout-tests';

function geometrySignature(layout: Awaited<ReturnType<typeof parseMmdFileToLayoutData>>) {
  return {
    nodes: layout.nodes.map((node) => ({
      id: node.id,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      groupTitleRect: node.groupTitleRect,
    })),
    edges: layout.edges.map((edge) => ({
      id: edge.id,
      points: edge.points,
      labelNodeId: edge.labelNodeId,
    })),
  };
}

describe('grid DDLT parity', () => {
  it('uses the same prepare → measure → core orchestration in DDLT as production', async () => {
    addDiagrams();
    const fixtureId = 'grid/simple';
    const mmdPath = resolve(process.cwd(), FIXTURES_DIR, `${fixtureId}.mmd`);
    const sizesPath = resolve(process.cwd(), FIXTURES_DIR, `${fixtureId}.sizes.json`);
    const sizes = loadFreshSizesFixture(sizesPath, mmdPath, fixtureId);

    const ddltLayout = await parseMmdFileToLayoutData(mmdPath, {
      stampFlowchartRendererFields: true,
    });
    runGridDdlt(ddltLayout, sizes);

    const directLayout = await parseMmdFileToLayoutData(mmdPath, {
      stampFlowchartRendererFields: true,
    });
    prepareGridLayout(directLayout);
    applyFixtureContentSizesStrict(directLayout, sizes);
    runGridLayoutCore(directLayout);

    expect(geometrySignature(ddltLayout)).toEqual(geometrySignature(directLayout));
  });
});
