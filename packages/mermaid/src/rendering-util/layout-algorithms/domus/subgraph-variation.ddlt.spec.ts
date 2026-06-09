import { describe, expect, it, beforeAll } from 'vitest';
import { resolve } from 'node:path';
import type { LayoutData, Node } from '../../types.js';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import { setLogLevel } from '../../../logger.js';
import { parseApplySizesAndLayout } from '../ddlt/backends.js';
import { parseMmdFileToLayoutData } from '../ddlt/parseToLayoutData.js';
import { applySyntheticContentSizes, applySyntheticLabelSizes } from '../ddlt/fixtureSizes.js';
import { injectDomusEdgeLabelNodes } from '../ddlt/domusEdgeLabelInject.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { layout as runDomusLayout } from './index.js';

const SUBGRAPH_VARIATION_BROWSER_SIZES = {
  nodes: [
    { id: 'P2.5', width: 73.34375, height: 73.34375 },
    { id: 'P1', width: 49.125, height: 45 },
    { id: 'P2', width: 49.125, height: 45 },
    { id: 'P3', width: 49.125, height: 45 },
    { id: 'P4', width: 49.125, height: 45 },
    { id: 'P6', width: 49.125, height: 45 },
    { id: 'P5', width: 49.125, height: 45 },
  ],
};

function rectFor(node: Node): { left: number; right: number; top: number; bottom: number } {
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const width = node.width ?? 0;
  const height = node.height ?? 0;
  return {
    left: x - width / 2,
    right: x + width / 2,
    top: y - height / 2,
    bottom: y + height / 2,
  };
}

function rectsOverlap(a: ReturnType<typeof rectFor>, b: ReturnType<typeof rectFor>): boolean {
  return (
    Math.min(a.right, b.right) > Math.max(a.left, b.left) &&
    Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top)
  );
}

function rectContains(
  outer: ReturnType<typeof rectFor>,
  inner: ReturnType<typeof rectFor>,
  margin = 1
): boolean {
  return (
    inner.left >= outer.left + margin &&
    inner.right <= outer.right - margin &&
    inner.top >= outer.top + margin &&
    inner.bottom <= outer.bottom - margin
  );
}

async function loadSyntheticFixture(name: string): Promise<LayoutData> {
  const layout = await parseMmdFileToLayoutData(
    resolve(process.cwd(), `cypress/platform/dev-diagrams/layout-tests/${name}.mmd`),
    { stampFlowchartRendererFields: true }
  );
  applySyntheticContentSizes(layout, { minWidth: 60, height: 45, charWidth: 8, padding: 16 });
  injectDomusEdgeLabelNodes(layout);
  applySyntheticLabelSizes(layout);
  runDomusLayout(layout);
  return layout;
}

async function loadSyntheticSubgraphVariation(): Promise<LayoutData> {
  return await loadSyntheticFixture('subgraph-variation');
}

async function loadBrowserSizedSubgraphVariation(): Promise<LayoutData> {
  return await parseApplySizesAndLayout(
    resolve(process.cwd(), 'cypress/platform/dev-diagrams/layout-tests/subgraph-variation.mmd'),
    SUBGRAPH_VARIATION_BROWSER_SIZES,
    'domus-orthogonal'
  );
}

describe('Domus DDLT — subgraph-variation group overlap', () => {
  beforeAll(() => {
    setLogLevel(process.env.ORTHO_TEST_DEBUG ? 'debug' : 'fatal');
    addDiagrams();
  });

  it('keeps P5 outside the P1.5 subgraph border', async () => {
    const layout = await loadSyntheticSubgraphVariation();
    const nodesById = new Map((layout.nodes ?? []).map((node) => [String(node.id), node]));
    const group = nodesById.get('P1.5');
    const p5 = nodesById.get('P5');

    expect(group, 'expected parser-produced subgraph node P1.5').toBeDefined();
    expect(p5, 'expected parser-produced node P5').toBeDefined();

    expect(rectsOverlap(rectFor(group!), rectFor(p5!))).toBe(false);

    const result = validateLayout(layout);
    const p5GroupOverlaps = result.issues.filter(
      (issue) =>
        issue.type === 'node-overlap' &&
        issue.nodeIds?.includes('P1.5') &&
        issue.nodeIds?.includes('P5')
    );
    expect(p5GroupOverlaps).toEqual([]);
  });

  it('routes P2 to P4 without hugging the P1.5 subgraph border', async () => {
    const layout = await loadSyntheticSubgraphVariation();
    const result = validateLayout(layout);
    const p2ToP4Issues = result.issues.filter((issue) => issue.edgeId === 'L_P2_P4_0');

    expect(p2ToP4Issues).toEqual([]);
  });

  it('routes P1.5 to P5 without crossing into P5 after leaving the subgraph', async () => {
    const layout = await loadSyntheticSubgraphVariation();
    const result = validateLayout(layout);
    const p15ToP5Issues = result.issues.filter((issue) => issue.edgeId === 'L_P1.5_P5_0');

    expect(p15ToP5Issues).toEqual([]);
  });

  it('keeps browser-sized subgraph-variation routes away from the P1.5 border', async () => {
    const layout = await loadBrowserSizedSubgraphVariation();
    const result = validateLayout(layout);

    for (const edgeId of ['L_P2_P4_0', 'L_P1.5_P5_0']) {
      const edgeIssues = result.issues.filter((issue) => issue.edgeId === edgeId);
      expect(edgeIssues).toEqual([]);
    }
  });

  it('keeps subgraph-variation-2 children inside their rendered subgraph borders', async () => {
    const layout = await loadSyntheticFixture('subgraph-variation-2');
    const nodesById = new Map((layout.nodes ?? []).map((node) => [String(node.id), node]));

    for (const [childId, groupId] of [
      ['b1', 'two'],
      ['c2', 'three'],
    ]) {
      const child = nodesById.get(childId);
      const group = nodesById.get(groupId);
      expect(child, `expected parser-produced child node ${childId}`).toBeDefined();
      expect(group, `expected parser-produced subgraph node ${groupId}`).toBeDefined();
      expect(rectContains(rectFor(group!), rectFor(child!))).toBe(true);
    }
  });
});
