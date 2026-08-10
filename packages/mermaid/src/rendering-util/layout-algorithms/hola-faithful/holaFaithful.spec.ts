/**
 * End-to-end pipeline tests and the structural invariants of guide §23.
 */

import { describe, expect, it } from 'vitest';
import type { LayoutData } from '../../types.js';
import { runHolaFaithfulLayoutCore } from './layoutCore.js';
import { FIXTURES, buildLayoutData } from './testFixtures.js';

const EPSILON = 1e-6;

interface Rect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function rectOf(node: { x?: number; y?: number; width?: number; height?: number }): Rect {
  const w = node.width ?? 0;
  const h = node.height ?? 0;
  return {
    minX: (node.x ?? 0) - w / 2,
    minY: (node.y ?? 0) - h / 2,
    maxX: (node.x ?? 0) + w / 2,
    maxY: (node.y ?? 0) + h / 2,
  };
}

function overlaps(a: Rect, b: Rect, tolerance = 0.5): boolean {
  return (
    a.minX < b.maxX - tolerance &&
    b.minX < a.maxX - tolerance &&
    a.minY < b.maxY - tolerance &&
    b.minY < a.maxY - tolerance
  );
}

function segmentEntersRect(
  p: { x: number; y: number },
  q: { x: number; y: number },
  r: Rect
): boolean {
  const tolerance = 0.5;
  if (Math.abs(p.y - q.y) < EPSILON) {
    if (p.y <= r.minY + tolerance || p.y >= r.maxY - tolerance) {
      return false;
    }
    return Math.max(p.x, q.x) > r.minX + tolerance && Math.min(p.x, q.x) < r.maxX - tolerance;
  }
  if (Math.abs(p.x - q.x) < EPSILON) {
    if (p.x <= r.minX + tolerance || p.x >= r.maxX - tolerance) {
      return false;
    }
    return Math.max(p.y, q.y) > r.minY + tolerance && Math.min(p.y, q.y) < r.maxY - tolerance;
  }
  return false;
}

function assertOrthogonal(data: LayoutData): void {
  for (const edge of data.edges) {
    const points = edge.points ?? [];
    expect(points.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < points.length; i++) {
      const dx = Math.abs(points[i].x - points[i - 1].x);
      const dy = Math.abs(points[i].y - points[i - 1].y);
      expect(dx < 1e-3 || dy < 1e-3, `edge ${edge.id} has a diagonal segment (${dx}, ${dy})`).toBe(
        true
      );
    }
  }
}

function assertNoNodeOverlaps(data: LayoutData): void {
  const nodes = data.nodes.filter((n) => n.isGroup !== true);
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      expect(
        overlaps(rectOf(nodes[i]), rectOf(nodes[j])),
        `${nodes[i].id} overlaps ${nodes[j].id}`
      ).toBe(false);
    }
  }
}

function assertNoRouteThroughForeignNode(data: LayoutData): void {
  const nodeById = new Map(data.nodes.map((n) => [n.id, n]));
  for (const edge of data.edges) {
    const points = edge.points ?? [];
    for (const node of data.nodes) {
      if (node.id === edge.start || node.id === edge.end || node.isGroup === true) {
        continue;
      }
      const rect = rectOf(node);
      for (let i = 1; i < points.length; i++) {
        expect(
          segmentEntersRect(points[i - 1], points[i], rect),
          `edge ${edge.id} passes through node ${node.id}`
        ).toBe(false);
      }
    }
  }
  void nodeById;
}

function positionsOf(data: LayoutData): Record<string, [number, number]> {
  const result: Record<string, [number, number]> = {};
  for (const node of data.nodes) {
    result[node.id] = [node.x ?? 0, node.y ?? 0];
  }
  return result;
}

const TOPOLOGY_FIXTURES: (keyof typeof FIXTURES)[] = [
  'singleNode',
  'singleEdge',
  'threeNodePath',
  'balancedBinaryTree',
  'triangleCycle',
  'squareCycle',
  'lollipop',
  'twoCyclesBridge',
  'hubDegreeFive',
  'openDegreeTwoChain',
  'closedDegreeTwoCycle',
  'parallelEdges',
  'selfLoop',
  'trianglePlusPath',
  'threeIsolatedNodes',
  'largeComponentPlusSingleton',
];

describe('final output invariants (guide §23)', () => {
  for (const name of TOPOLOGY_FIXTURES) {
    describe(name, () => {
      it('produces an orthogonal, overlap-free, complete drawing', () => {
        const data = FIXTURES[name]();
        const expectedNodes = data.nodes.filter((n) => n.isGroup !== true).map((n) => n.id);
        const expectedEdges = data.edges.map((e) => e.id);

        const result = runHolaFaithfulLayoutCore(data);

        // Every ordinary node appears exactly once, positioned.
        const ids = data.nodes.map((n) => n.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids.sort()).toEqual([...expectedNodes].sort());
        for (const node of data.nodes) {
          expect(Number.isFinite(node.x)).toBe(true);
          expect(Number.isFinite(node.y)).toBe(true);
        }

        // Every retained edge appears exactly once, with a route.
        const edgeIds = data.edges.map((e) => e.id);
        expect(new Set(edgeIds).size).toBe(edgeIds.length);
        expect(edgeIds.sort()).toEqual([...expectedEdges].sort());

        assertOrthogonal(data);
        assertNoNodeOverlaps(data);
        assertNoRouteThroughForeignNode(data);
        expect(data.nodes.some((n) => n.isGroup === true)).toBe(false);
        expect(result.componentCount).toBeGreaterThan(0);
      });

      it('is deterministic', () => {
        const first = FIXTURES[name]();
        const second = FIXTURES[name]();
        runHolaFaithfulLayoutCore(first);
        runHolaFaithfulLayoutCore(second);
        expect(positionsOf(second)).toEqual(positionsOf(first));
      });
    });
  }
});

describe('disconnected components (guide §9)', () => {
  it('lays out two disconnected parts as independent drawings', () => {
    const data = FIXTURES.trianglePlusPath();
    const result = runHolaFaithfulLayoutCore(data);
    expect(result.componentCount).toBe(2);
  });

  it('packs components left to right without overlapping bounding boxes', () => {
    const data = FIXTURES.trianglePlusPath();
    runHolaFaithfulLayoutCore(data);

    const byId = new Map(data.nodes.map((n) => [n.id, n]));
    const triangle = ['A', 'B', 'C'].map((id) => rectOf(byId.get(id)!));
    const path = ['P', 'Q'].map((id) => rectOf(byId.get(id)!));
    const box = (rects: Rect[]): Rect => ({
      minX: Math.min(...rects.map((r) => r.minX)),
      minY: Math.min(...rects.map((r) => r.minY)),
      maxX: Math.max(...rects.map((r) => r.maxX)),
      maxY: Math.max(...rects.map((r) => r.maxY)),
    });
    expect(overlaps(box(triangle), box(path))).toBe(false);
  });

  it('treats an isolated node as its own component', () => {
    const data = FIXTURES.threeIsolatedNodes();
    const result = runHolaFaithfulLayoutCore(data);
    expect(result.componentCount).toBe(3);
    assertNoNodeOverlaps(data);
  });

  it('orders components by the input order of their first node', () => {
    const data = FIXTURES.largeComponentPlusSingleton();
    runHolaFaithfulLayoutCore(data);
    const byId = new Map(data.nodes.map((n) => [n.id, n]));
    // A appears before Z in the source, so its component is packed first.
    expect(byId.get('A')!.x!).toBeLessThan(byId.get('Z')!.x!);
  });

  it('does not let one component influence another', () => {
    const together = buildLayoutData([
      ['A', 'B'],
      ['B', 'C'],
      ['C', 'A'],
      ['P', 'Q'],
    ]);
    const alone = buildLayoutData([
      ['A', 'B'],
      ['B', 'C'],
      ['C', 'A'],
    ]);
    runHolaFaithfulLayoutCore(together);
    runHolaFaithfulLayoutCore(alone);

    const relative = (data: LayoutData, ids: string[]): [number, number][] => {
      const byId = new Map(data.nodes.map((n) => [n.id, n]));
      const origin = byId.get(ids[0])!;
      return ids.map((id) => [
        (byId.get(id)!.x ?? 0) - (origin.x ?? 0),
        (byId.get(id)!.y ?? 0) - (origin.y ?? 0),
      ]);
    };
    expect(relative(together, ['A', 'B', 'C'])).toEqual(relative(alone, ['A', 'B', 'C']));
  });
});

describe('subgraphs are flattened (guide §3.2)', () => {
  it('drops the container and keeps its children as one flat component', () => {
    const data = FIXTURES.subgraphWithExit();
    runHolaFaithfulLayoutCore(data);

    expect(data.nodes.map((n) => n.id).sort()).toEqual(['A', 'B', 'C']);
    expect(data.nodes.every((n) => n.parentId === undefined)).toBe(true);
    expect(data.edges).toHaveLength(2);
  });

  it('reports an unsupported diagnostic for an edge to a container', () => {
    const data = FIXTURES.edgeToSubgraph();
    const result = runHolaFaithfulLayoutCore(data);

    const unsupported = result.diagnostics.filter(
      (d) => d.code === 'HOLA_SUBGRAPH_ENDPOINT_UNSUPPORTED'
    );
    expect(unsupported).toHaveLength(1);
    expect(unsupported[0].edgeIds).toContain('e1:C-S');
    // The edge is omitted rather than redirected to a child.
    expect(data.edges.map((e) => e.id)).not.toContain('e1:C-S');
  });

  it('adds no synthetic node or edge', () => {
    const data = FIXTURES.subgraphWithExit();
    runHolaFaithfulLayoutCore(data);
    expect(data.nodes.every((n) => n.isDummy !== true && n.isLabelNode !== true)).toBe(true);
  });
});

describe('edge labels stay annotations (guide §3.3)', () => {
  it('creates no label node and still positions the label', () => {
    const data = buildLayoutData(
      [
        ['A', 'B'],
        ['B', 'C'],
      ],
      [],
      { labels: { 'e0:A-B': 'yes' } }
    );
    runHolaFaithfulLayoutCore(data);

    expect(data.nodes.map((n) => n.id).sort()).toEqual(['A', 'B', 'C']);
    const labelled = data.edges.find((e) => e.id === 'e0:A-B')!;
    expect(Number.isFinite(labelled.x)).toBe(true);
    expect(Number.isFinite(labelled.y)).toBe(true);
  });

  it('does not change the decomposition', () => {
    const withLabel = buildLayoutData(
      [
        ['A', 'B'],
        ['B', 'C'],
        ['C', 'A'],
      ],
      [],
      { labels: { 'e0:A-B': 'a long label that would be a big node' } }
    );
    const withoutLabel = buildLayoutData([
      ['A', 'B'],
      ['B', 'C'],
      ['C', 'A'],
    ]);
    runHolaFaithfulLayoutCore(withLabel);
    runHolaFaithfulLayoutCore(withoutLabel);
    expect(positionsOf(withLabel)).toEqual(positionsOf(withoutLabel));
  });
});

describe('parallel edges and self-loops (guide §3.4)', () => {
  it('routes both parallel edges separately', () => {
    const data = FIXTURES.parallelEdges();
    runHolaFaithfulLayoutCore(data);

    expect(data.edges).toHaveLength(2);
    const [first, second] = data.edges;
    expect(first.points).toBeDefined();
    expect(second.points).toBeDefined();
    expect(JSON.stringify(first.points)).not.toBe(JSON.stringify(second.points));
  });

  it('does not let a parallel edge inflate a node degree', () => {
    // A—B twice is still a tree topologically, so it must not gain a core.
    const data = FIXTURES.parallelEdges();
    const result = runHolaFaithfulLayoutCore(data);
    expect(result.componentCount).toBe(1);
    assertOrthogonal(data);
  });

  it('hands anti-parallel edges back in their own declared direction', () => {
    // `b --> a` folds into the same topological edge as `a --> b`, but its
    // polyline must still start on `b` and end on `a` — the renderer puts the
    // arrowhead on the last point.
    const data = buildLayoutData([
      ['A', 'B'],
      ['B', 'A'],
    ]);
    runHolaFaithfulLayoutCore(data);
    expect(data.edges).toHaveLength(2);

    const rect = (id: string) => {
      const node = data.nodes.find((n) => n.id === id)!;
      return {
        left: node.x! - node.width! / 2,
        right: node.x! + node.width! / 2,
        top: node.y! - node.height! / 2,
        bottom: node.y! + node.height! / 2,
      };
    };
    const touches = (p: { x: number; y: number }, id: string) => {
      const r = rect(id);
      const dx = Math.max(r.left - p.x, 0, p.x - r.right);
      const dy = Math.max(r.top - p.y, 0, p.y - r.bottom);
      return Math.hypot(dx, dy) <= 1;
    };

    for (const edge of data.edges) {
      const points = edge.points!;
      expect(touches(points[0], edge.start!), `${edge.id} tail off ${edge.start}`).toBe(true);
      expect(touches(points[points.length - 1], edge.end!), `${edge.id} head off ${edge.end}`).toBe(
        true
      );
    }
  });

  it('routes a self-loop orthogonally back to its own node', () => {
    const data = FIXTURES.selfLoop();
    runHolaFaithfulLayoutCore(data);

    const loop = data.edges.find((e) => e.start === e.end)!;
    expect(loop.points!.length).toBeGreaterThanOrEqual(3);
    assertOrthogonal(data);
  });
});

describe('cycles survive decomposition (invariant 1)', () => {
  it('draws all three edges of a triangle', () => {
    const data = FIXTURES.triangleCycle();
    runHolaFaithfulLayoutCore(data);
    expect(data.edges).toHaveLength(3);
    for (const edge of data.edges) {
      expect(edge.points!.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('draws both cycles of a bridged pair', () => {
    const data = FIXTURES.twoCyclesBridge();
    runHolaFaithfulLayoutCore(data);
    expect(data.edges).toHaveLength(7);
    assertOrthogonal(data);
    assertNoNodeOverlaps(data);
  });
});
