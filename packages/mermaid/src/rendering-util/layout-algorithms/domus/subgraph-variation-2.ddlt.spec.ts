import { describe, expect, it, beforeAll } from 'vitest';
import type { LayoutData, Node } from '../../types.js';
import { baselineDdltSpec } from '../ddlt/baselineDdltSpec.js';
import { loadDdltFixture } from '../ddlt/loadDdltFixture.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { scoreLayout } from '../layout-utils/scoreLayout.js';

baselineDdltSpec('subgraph-variation-2');

interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function rectFor(node: Node): Rect {
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const w = node.width ?? 0;
  const h = node.height ?? 0;
  return { left: x - w / 2, right: x + w / 2, top: y - h / 2, bottom: y + h / 2 };
}

function rangeOverlap(a1: number, a2: number, b1: number, b2: number): number {
  return Math.min(a2, b2) - Math.max(a1, b1);
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

function horizontalGap(a: Rect, b: Rect): number {
  if (a.right <= b.left) {
    return b.left - a.right;
  }
  if (b.right <= a.left) {
    return a.left - b.right;
  }
  return 0;
}

function segmentCrossesRectInterior(
  a: { x: number; y: number },
  b: { x: number; y: number },
  rect: Rect
): boolean {
  const eps = 0.5;
  if (Math.abs(a.x - b.x) < eps) {
    const x = a.x;
    if (x <= rect.left + eps || x >= rect.right - eps) {
      return false;
    }
    const yLo = Math.min(a.y, b.y);
    const yHi = Math.max(a.y, b.y);
    return yHi > rect.top + eps && yLo < rect.bottom - eps;
  }
  if (Math.abs(a.y - b.y) < eps) {
    const y = a.y;
    if (y <= rect.top + eps || y >= rect.bottom - eps) {
      return false;
    }
    const xLo = Math.min(a.x, b.x);
    const xHi = Math.max(a.x, b.x);
    return xHi > rect.left + eps && xLo < rect.right - eps;
  }
  return false;
}

function clusterTitleRect(group: Node): Rect {
  const rect = rectFor(group);
  const spacing = 10;
  const sideInset = Math.min(Math.max(2, spacing / 2), (rect.right - rect.left) / 3);
  const bandHeight = Math.min(rect.bottom - rect.top, Math.max(24, spacing * 3));
  return {
    left: rect.left + sideInset,
    right: rect.right - sideInset,
    top: rect.top,
    bottom: rect.top + bandHeight,
  };
}

describe('Domus DDLT — subgraph-variation-2.mmd (cluster containment)', () => {
  let layout: LayoutData;

  beforeAll(async () => {
    layout = await loadDdltFixture('subgraph-variation-2');
  });

  it('passes layout validation and clears the zero-score attachment collision', () => {
    const validation = validateLayout(layout);
    const quality = scoreLayout(layout);

    expect(validation.issues, `validation issues: ${JSON.stringify(validation.issues)}`).toEqual(
      []
    );
    expect(validation.ok).toBe(true);
    expect(validation.score).toBeGreaterThan(0);
    expect(quality.scores.crossings).toBe(0);
  });

  it('treats long runs along group borders as invalid border hugging', () => {
    const group: Node = {
      id: 'G',
      isGroup: true,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    } as Node;
    const synthetic: LayoutData = {
      nodes: [group],
      edges: [
        {
          id: 'e',
          type: 'arrow',
          points: [
            { x: -52, y: -60 },
            { x: -52, y: 60 },
          ],
        },
      ],
      config: {} as LayoutData['config'],
    };

    const issues = validateLayout(synthetic).issues;
    expect(issues.map((issue) => issue.type)).toContain('edge-border-hugging');
    expect(issues.some((issue) => issue.nodeIds?.includes('G'))).toBe(true);
  });

  it('keeps subgraph children inside their rendered parent clusters', () => {
    const nodesById = new Map<string, Node>();
    for (const node of layout.nodes ?? []) {
      if (node.id != null) {
        nodesById.set(String(node.id), node);
      }
    }

    const failures: { childId: string; parentId: string; child: Rect; parent: Rect }[] = [];
    for (const node of layout.nodes ?? []) {
      if (node.parentId == null || node.isGroup) {
        continue;
      }
      const parent = nodesById.get(String(node.parentId));
      if (!parent?.isGroup) {
        continue;
      }
      const childRect = rectFor(node);
      const parentRect = rectFor(parent);
      if (
        childRect.left < parentRect.left - 1e-6 ||
        childRect.right > parentRect.right + 1e-6 ||
        childRect.top < parentRect.top - 1e-6 ||
        childRect.bottom > parentRect.bottom + 1e-6
      ) {
        failures.push({
          childId: String(node.id),
          parentId: String(parent.id),
          child: childRect,
          parent: parentRect,
        });
      }
    }

    expect(failures, `cluster containment failures: ${JSON.stringify(failures)}`).toEqual([]);
  });

  it('keeps the two sibling subgraphs separated on at least one axis', () => {
    const nodesById = new Map<string, Node>();
    for (const node of layout.nodes ?? []) {
      if (node.id != null) {
        nodesById.set(String(node.id), node);
      }
    }
    const two = nodesById.get('two');
    const three = nodesById.get('three');
    expect(two?.isGroup).toBe(true);
    expect(three?.isGroup).toBe(true);

    const twoRect = rectFor(two!);
    const threeRect = rectFor(three!);
    const xOverlap = rangeOverlap(twoRect.left, twoRect.right, threeRect.left, threeRect.right);
    const yOverlap = rangeOverlap(twoRect.top, twoRect.bottom, threeRect.top, threeRect.bottom);
    const separated =
      (xOverlap > 0 && verticalGap(twoRect, threeRect) >= 80) ||
      (yOverlap > 0 && horizontalGap(twoRect, threeRect) >= 80) ||
      horizontalGap(twoRect, threeRect) >= 80 ||
      verticalGap(twoRect, threeRect) >= 80;
    expect(separated).toBe(true);
  });

  it('keeps routed edges out of sibling subgraph title bands', () => {
    const groups = (layout.nodes ?? []).filter((node) => node.isGroup);
    const offenders: { edgeId: string; groupId: string; segIdx: number }[] = [];

    for (const edge of layout.edges ?? []) {
      const pts = edge.points ?? [];
      if (pts.length < 2) {
        continue;
      }
      const startId = edge.start != null ? String(edge.start) : '';
      const endId = edge.end != null ? String(edge.end) : '';
      for (const group of groups) {
        const groupId = String(group.id);
        if (groupId === startId || groupId === endId) {
          continue;
        }
        const title = clusterTitleRect(group);
        for (let i = 0; i < pts.length - 1; i++) {
          if (segmentCrossesRectInterior(pts[i], pts[i + 1], title)) {
            offenders.push({
              edgeId: String(edge.id ?? `${startId}->${endId}`),
              groupId,
              segIdx: i,
            });
          }
        }
      }
    }

    expect(offenders, `subgraph title crossings: ${JSON.stringify(offenders)}`).toEqual([]);
  });
});
