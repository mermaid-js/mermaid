import { describe, it, expect, beforeAll } from 'vitest';
import type { Edge, LayoutData } from '../../types.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { loadDdltFixture } from '../ddlt/loadDdltFixture.js';

const FIXTURE_NAME = 'project-sox2';

interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function rectForCenterBox(box: { x?: number; y?: number; width?: number; height?: number }): Rect {
  const x = box.x ?? 0;
  const y = box.y ?? 0;
  const width = box.width ?? 0;
  const height = box.height ?? 0;
  return {
    left: x - width / 2,
    right: x + width / 2,
    top: y - height / 2,
    bottom: y + height / 2,
  };
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

describe(`Domus DDLT — ${FIXTURE_NAME}.mmd`, () => {
  let layout: LayoutData;

  beforeAll(async () => {
    layout = await loadDdltFixture(FIXTURE_NAME);
  });

  it('keeps the Transwell/Wound Healing Assay edge label off the migratory glioblastoma node', () => {
    const edge = (layout.edges ?? []).find(
      (e) => String(e?.label ?? '') === 'Transwell/Wound Healing Assay'
    ) as (Edge & { x?: number; y?: number; width?: number; height?: number }) | undefined;
    const node = (layout.nodes ?? []).find((n) =>
      String(n?.label ?? '').includes('Investigate and isolate migratory glioblastoma')
    );

    expect(edge, 'expected labelled F→K edge to exist').toBeTruthy();
    expect(node, 'expected migratory glioblastoma node to exist').toBeTruthy();
    expect(Number.isFinite(edge?.x)).toBe(true);
    expect(Number.isFinite(edge?.y)).toBe(true);
    expect((edge?.width ?? 0) > 0).toBe(true);
    expect((edge?.height ?? 0) > 0).toBe(true);

    const validation = validateLayout(layout);
    const labelNodeIssues = validation.issues.filter(
      (issue) =>
        (issue.type as string) === 'edge-label-overlaps-node' &&
        issue.edgeId === String(edge!.id) &&
        issue.nodeIds?.includes(String(node!.id))
    );
    expect(labelNodeIssues).toEqual([]);

    const labelRect = rectForCenterBox(edge!);
    const nodeRect = rectForCenterBox(node!);
    expect({ labelRect, nodeRect, edgeId: edge!.id, nodeId: node!.id }).toSatisfy(
      ({ labelRect, nodeRect }) => !rectsOverlap(labelRect, nodeRect)
    );
  });
});
