import { describe, expect, it } from 'vitest';
import type { Edge, LayoutData, Node } from '../../types.js';
import { normalizePolyline } from '../layout-utils/geometry.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { prepareGridLayout } from './edgeLabels.js';
import { runGridLayoutCore } from './layoutCore.js';
import { createGridRoutingInstrumentation } from './routerInstrumentation.js';

function leaf(
  id: string,
  width = 80,
  height = 40,
  metadata?: Record<string, unknown>,
  parentId?: string
): Node {
  return {
    id,
    parentId,
    isGroup: false,
    shape: 'rect',
    width,
    height,
    metadata,
  } as Node;
}

function group(
  id: string,
  label: string,
  metadata?: Record<string, unknown>,
  parentId?: string
): Node {
  return {
    id,
    parentId,
    isGroup: true,
    shape: 'rect',
    label,
    labelBBox: { width: 70, height: 20 },
    metadata,
  } as Node;
}

function edge(id: string, start: string, end: string, label?: string): Edge {
  return {
    id,
    start,
    end,
    arrowTypeStart: 'none',
    arrowTypeEnd: 'arrow_point',
    label,
    type: 'arrow_point',
  } as Edge;
}

function baseLayout(nodes: Node[], edges: Edge[], grid: Record<string, unknown> = {}): LayoutData {
  return {
    nodes,
    edges,
    config: {
      layout: 'grid',
      grid,
    } as LayoutData['config'],
  };
}

function sizeGridLabelNodes(data: LayoutData, width = 42, height = 18): void {
  prepareGridLayout(data);
  for (const node of data.nodes) {
    if ((node as { isEdgeLabel?: boolean }).isEdgeLabel) {
      node.width = width;
      node.height = height;
    }
  }
}

function segmentLength(points: { x: number; y: number }[]): number {
  if (points.length < 2) {
    return 0;
  }
  const [a, b] = points;
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function primaryTrackCoordinate(edge: Edge): number {
  const primary = [...normalizePolyline(edge.points ?? []).segments].sort(
    (a, b) => segmentLength([b.a, b.b]) - segmentLength([a.a, a.b])
  )[0];
  if (!primary) {
    return Number.NaN;
  }
  return primary.orientation === 'H' ? primary.a.y : primary.a.x;
}

describe('grid router', () => {
  it('records current route metrics without changing geometry', () => {
    const build = () =>
      baseLayout(
        [
          leaf('a', 80, 40, { row: 1, column: 1 }),
          leaf('b', 80, 40, { row: 1, column: 2 }),
          leaf('c', 80, 40, { row: 2, column: 2 }),
        ],
        [edge('horizontal', 'a', 'b'), edge('vertical', 'b', 'c')],
        { rowGap: 40, columnGap: 60 }
      );
    const baseline = build();
    runGridLayoutCore(baseline);
    const expectedGeometry = baseline.edges.map((item) => item.points);

    const instrumented = build();
    const metrics = createGridRoutingInstrumentation();
    runGridLayoutCore(instrumented, metrics);

    expect(instrumented.edges.map((item) => item.points)).toEqual(expectedGeometry);
    expect(metrics.routeOrder).toEqual(['horizontal', 'vertical']);
    expect(metrics.routes.map(({ edgeId, routeOrder }) => ({ edgeId, routeOrder }))).toEqual([
      { edgeId: 'horizontal', routeOrder: 0 },
      { edgeId: 'vertical', routeOrder: 1 },
    ]);
    expect(metrics.routesFound).toBe(2);
    expect(metrics.routeLength).toBeGreaterThan(0);
    expect(metrics.bendCount).toBeGreaterThanOrEqual(0);
    expect(metrics.crossingCount).toBeGreaterThanOrEqual(0);
    expect(metrics.sharedLength).toBe(0);
    expect(metrics.baseTopologyBuilds).toBe(0);
    expect(metrics.searches).toBe(0);
    expect(metrics.resourceLimitFallbacks).toBe(0);
    expect(metrics.fallbackReasons).toEqual({
      vertex_cap: 0,
      adjacency_cap: 0,
      estimated_memory_cap: 0,
      search_state_cap: 0,
    });
  });
  it('routes ordinary and labelled edges into valid orthogonal polylines', () => {
    const data = baseLayout(
      [
        group('g', 'Group', { row: 1, column: 1 }),
        leaf('a', 80, 40, { row: 1, column: 1 }, 'g'),
        leaf('b', 90, 40, { row: 1, column: 2 }),
        leaf('c', 70, 40, { row: 2, column: 2 }),
      ],
      [edge('e1', 'a', 'b'), edge('e3', 'a', 'c', 'labelled')],
      { rowGap: 40, columnGap: 40 }
    );

    sizeGridLabelNodes(data, 60, 20);
    runGridLayoutCore(data);

    for (const routed of data.edges) {
      expect(routed.points?.length).toBeGreaterThanOrEqual(2);
      for (let index = 1; index < (routed.points?.length ?? 0); index++) {
        const prev = routed.points![index - 1];
        const next = routed.points![index];
        expect(prev.x === next.x || prev.y === next.y).toBe(true);
      }
    }

    const labelNode = data.nodes.find((node) => (node as { isEdgeLabel?: boolean }).isEdgeLabel);
    expect(labelNode?.x).toEqual(expect.any(Number));
    expect(labelNode?.y).toEqual(expect.any(Number));
  });

  it('routes edges to group boundaries with finite orthogonal points', () => {
    const data = baseLayout(
      [
        group('g', 'Group', { row: 1, column: 1 }),
        leaf('a', 80, 40, { row: 1, column: 1 }, 'g'),
        leaf('b', 90, 40, { row: 1, column: 2 }),
      ],
      [edge('e2', 'b', 'g')],
      { rowGap: 40, columnGap: 40 }
    );

    runGridLayoutCore(data);
    const points = data.edges[0].points ?? [];
    expect(points.length).toBeGreaterThanOrEqual(2);
    for (let index = 1; index < points.length; index++) {
      expect(Number.isFinite(points[index].x)).toBe(true);
      expect(Number.isFinite(points[index].y)).toBe(true);
      expect(
        points[index - 1].x === points[index].x || points[index - 1].y === points[index].y
      ).toBe(true);
    }
  });

  it.each([
    {
      name: 'group-to-member',
      edges: [edge('group-to-member', 'g', 'member')],
    },
    {
      name: 'outside-to-member',
      edges: [edge('outside-to-member', 'outside', 'member')],
    },
  ])('routes $name edges through safe group gutters', ({ edges }) => {
    const data = baseLayout(
      [
        group('g', 'Group', { row: 1, column: 1 }),
        leaf('member', 80, 40, { row: 1, column: 1 }, 'g'),
        leaf('outside', 90, 40, { row: 1, column: 2 }),
      ],
      edges,
      { rowGap: 40, columnGap: 40 }
    );

    runGridLayoutCore(data);
    expect(validateLayout(data)).toMatchObject({ ok: true, issues: [] });
  });

  it('keeps parallel, reverse, and self-loop routes distinct and at least 8px apart', () => {
    const build = () =>
      baseLayout(
        [leaf('a', 80, 40, { row: 1, column: 1 }), leaf('b', 80, 40, { row: 1, column: 2 })],
        [
          edge('e1', 'a', 'b'),
          edge('e2', 'a', 'b'),
          edge('e3', 'a', 'b'),
          edge('e4', 'b', 'a'),
          edge('loop-1', 'a', 'a'),
          edge('loop-2', 'a', 'a'),
        ],
        { rowGap: 40, columnGap: 60 }
      );

    const data = build();
    runGridLayoutCore(data);

    const byId = new Map(data.edges.map((item) => [item.id, item.points ?? []]));
    expect(byId.get('e1')).not.toEqual(byId.get('e2'));
    expect(byId.get('e2')).not.toEqual(byId.get('e3'));
    expect(byId.get('e4')).not.toEqual(byId.get('e1'));
    expect(byId.get('loop-1')).not.toEqual(byId.get('loop-2'));

    const primaryTracks = data.edges
      .filter((item) => item.id.startsWith('e'))
      .map((item) => primaryTrackCoordinate(item))
      .sort((a, b) => a - b);
    for (let index = 1; index < primaryTracks.length; index++) {
      expect(primaryTracks[index] - primaryTracks[index - 1]).toBeGreaterThanOrEqual(8);
    }

    const rerun = build();
    runGridLayoutCore(rerun);
    expect(rerun.edges.map((item) => item.points)).toEqual(data.edges.map((item) => item.points));
  });

  it('produces distinct routes for parallel, reverse, and self-loop edges', () => {
    const data = baseLayout(
      [leaf('a', 80, 40, { row: 1, column: 1 }), leaf('b', 80, 40, { row: 1, column: 2 })],
      [
        edge('e1', 'a', 'b'),
        edge('e2', 'a', 'b'),
        edge('e3', 'a', 'b'),
        edge('e4', 'b', 'a'),
        edge('loop-1', 'a', 'a'),
        edge('loop-2', 'a', 'a'),
      ],
      { rowGap: 40, columnGap: 60 }
    );

    runGridLayoutCore(data);

    const byId = new Map(data.edges.map((item) => [item.id, item.points ?? []]));
    expect(byId.get('e1')).not.toEqual(byId.get('e2'));
    expect(byId.get('e2')).not.toEqual(byId.get('e3'));
    expect(byId.get('e4')).not.toEqual(byId.get('e1'));
    expect(byId.get('loop-1')).not.toEqual(byId.get('loop-2'));
  });

  it('routes self-loops around adjacent nodes when track gaps are zero', () => {
    const data = baseLayout(
      [leaf('a', 80, 40, { row: 1, column: 1 }), leaf('b', 80, 40, { row: 1, column: 2 })],
      [edge('loop', 'b', 'b')],
      { rowGap: 0, columnGap: 0 }
    );

    runGridLayoutCore(data);

    expect(validateLayout(data)).toMatchObject({ ok: true, issues: [] });
  });
});
