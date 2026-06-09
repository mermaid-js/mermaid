import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import type { LayoutData } from '../../types.js';
import { runDomusOrthogonalDdlt } from '../ddlt/backends.js';
import { applySyntheticContentSizes, applySyntheticLabelSizes } from '../ddlt/fixtureSizes.js';
import { parseMmdFileToLayoutData } from '../ddlt/parseToLayoutData.js';
import { validateLayout } from '../layout-utils/validateLayout.js';

interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function rectFor(node: NonNullable<LayoutData['nodes']>[number]): Rect {
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

function verticalGap(a: Rect, b: Rect): number {
  if (a.bottom <= b.top) {
    return b.top - a.bottom;
  }
  if (b.bottom <= a.top) {
    return a.top - b.bottom;
  }
  return 0;
}

describe('Domus DDLT — subgraph-variation.mmd (cluster edge clearance)', () => {
  let layout: LayoutData;

  beforeAll(async () => {
    addDiagrams();
    const fixturePath = resolve(
      process.cwd(),
      'cypress/platform/dev-diagrams/layout-tests/subgraph-variation.mmd'
    );
    layout = await parseMmdFileToLayoutData(fixturePath, {
      stampFlowchartRendererFields: true,
    });
    (layout as { layoutAlgorithm?: string }).layoutAlgorithm = 'domus';

    applySyntheticContentSizes(layout, {
      minWidth: 80,
      height: 50,
      charWidth: 7,
      padding: 24,
    });
    applySyntheticLabelSizes(layout);

    await runDomusOrthogonalDdlt(layout);
  });

  it('produces a layout with nodes and routed edges', () => {
    expect(layout.nodes?.length, 'expected at least one node').toBeGreaterThan(0);
    expect(layout.edges?.length, 'expected at least one edge').toBeGreaterThan(0);
    const unrouted = (layout.edges ?? [])
      .filter((edge) => !Array.isArray(edge.points) || edge.points.length < 2)
      .map((edge) => String(edge.id ?? `${String(edge.start)}->${String(edge.end)}`));
    expect(unrouted, `unrouted edges: ${unrouted.join(', ')}`).toEqual([]);
  });

  it('keeps routed edges from hugging the P1.5 subgraph border', () => {
    const issues = validateLayout(layout).issues.filter(
      (issue) =>
        issue.type === 'edge-border-hugging' &&
        (issue.nodeIds ?? []).some((id) => String(id) === 'P1.5')
    );

    expect(issues, `P1.5 border hugs: ${JSON.stringify(issues)}`).toEqual([]);
  });

  it('leaves readable clearance between P1 and the P1.5 subgraph', () => {
    const nodesById = new Map((layout.nodes ?? []).map((node) => [String(node.id), node]));
    const p1 = nodesById.get('P1');
    const p15 = nodesById.get('P1.5');

    expect(p1).toBeDefined();
    expect(p15?.isGroup).toBe(true);
    expect(verticalGap(rectFor(p1!), rectFor(p15!))).toBeGreaterThanOrEqual(30);
  });
});
