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

function terminalLength(points: { x: number; y: number }[], atStart: boolean): number {
  const normalized = normalizePolyline(points).points;
  const a = atStart ? normalized[0] : normalized[normalized.length - 1];
  const b = atStart ? normalized[1] : normalized[normalized.length - 2];
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function nodeRect(node: Node) {
  return {
    left: (node.x ?? 0) - (node.width ?? 0) / 2,
    right: (node.x ?? 0) + (node.width ?? 0) / 2,
    top: (node.y ?? 0) - (node.height ?? 0) / 2,
    bottom: (node.y ?? 0) + (node.height ?? 0) / 2,
  };
}

function boundaryCrossings(points: { x: number; y: number }[], owner: Node): number {
  const rect = nodeRect(owner);
  return normalizePolyline(points).segments.reduce((count, segment) => {
    if (segment.orientation === 'H' && segment.a.y > rect.top && segment.a.y < rect.bottom) {
      const low = Math.min(segment.a.x, segment.b.x);
      const high = Math.max(segment.a.x, segment.b.x);
      return (
        count +
        Number(low < rect.left && high > rect.left) +
        Number(low < rect.right && high > rect.right)
      );
    }
    if (segment.orientation === 'V' && segment.a.x > rect.left && segment.a.x < rect.right) {
      const low = Math.min(segment.a.y, segment.b.y);
      const high = Math.max(segment.a.y, segment.b.y);
      return (
        count +
        Number(low < rect.top && high > rect.top) +
        Number(low < rect.bottom && high > rect.bottom)
      );
    }
    return count;
  }, 0);
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
    expect(metrics.baseTopologyBuilds).toBe(1);
    expect(metrics.searches).toBeGreaterThan(0);
    expect(metrics.resourceLimitFallbacks).toBe(0);
    expect(metrics.fallbackReasons).toEqual({
      vertex_cap: 0,
      adjacency_cap: 0,
      estimated_memory_cap: 0,
      search_state_cap: 0,
    });

    const permuted = build();
    permuted.edges.reverse();
    const permutedMetrics = createGridRoutingInstrumentation();
    runGridLayoutCore(permuted, permutedMetrics);
    expect(permutedMetrics.routeOrder).toEqual(['horizontal', 'vertical']);
    expect(new Map(permuted.edges.map((item) => [item.id, item.points]))).toEqual(
      new Map(instrumented.edges.map((item) => [item.id, item.points]))
    );
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

  it('selects the motivating straight route through unused cell space by tuple cost', () => {
    const data = baseLayout(
      [
        leaf('v1', 80, 40, { row: 1, column: 1 }),
        leaf('v2', 80, 40, { row: 1, column: 3 }),
        leaf('v2p', 80, 40, { row: 2, column: 2 }),
      ],
      [edge('v1-v2', 'v1', 'v2')],
      { rowGap: 40, columnGap: 40 }
    );
    const metrics = createGridRoutingInstrumentation();

    runGridLayoutCore(data, metrics);

    const normalized = normalizePolyline(data.edges[0].points ?? []);
    expect(validateLayout(data)).toMatchObject({ ok: true, issues: [] });
    expect(normalized.segments).toHaveLength(1);
    expect(normalized.segments[0]?.orientation).toBe('H');
    expect(metrics.baseTopologyBuilds).toBe(1);
    expect(metrics.endpointOverlayBuilds).toBeGreaterThan(0);
    expect(metrics.searches).toBeGreaterThan(0);
    expect(metrics.expandedStates).toBeGreaterThan(0);
    expect(metrics.maxOpenSet).toBeGreaterThan(0);
    expect(metrics.resourceLimitFallbacks).toBe(0);
  });

  it('allocates deterministic legal endpoint slots with clearance and terminal approach', () => {
    const build = () =>
      baseLayout(
        [
          leaf('source', 80, 56, { row: 1, column: 1 }),
          leaf('high', 60, 32, { row: 1, column: 3 }),
          leaf('middle', 60, 32, { row: 1, column: 3 }),
          leaf('low', 60, 32, { row: 1, column: 3 }),
        ],
        [
          edge('to-low', 'source', 'low'),
          edge('to-high', 'source', 'high'),
          edge('to-middle', 'source', 'middle'),
        ],
        { rowGap: 34, columnGap: 70 }
      );
    const data = build();

    runGridLayoutCore(data);

    const source = data.nodes.find(({ id }) => id === 'source')!;
    const sourceTop = (source.y ?? 0) - (source.height ?? 0) / 2;
    const sourceBottom = (source.y ?? 0) + (source.height ?? 0) / 2;
    const ports = data.edges.map((item) => item.points![0]);
    const ys = ports.map(({ y }) => y).sort((a, b) => a - b);
    expect(ys[0]).toBeGreaterThanOrEqual(sourceTop + 6);
    expect(ys.at(-1)).toBeLessThanOrEqual(sourceBottom - 6);
    expect(ys[1] - ys[0]).toBeGreaterThanOrEqual(4);
    expect(ys[2] - ys[1]).toBeGreaterThanOrEqual(4);
    for (const routed of data.edges) {
      expect(terminalLength(routed.points ?? [], true)).toBeGreaterThanOrEqual(12);
      expect(terminalLength(routed.points ?? [], false)).toBeGreaterThanOrEqual(12);
    }

    const rerun = build();
    runGridLayoutCore(rerun);
    expect(rerun.edges.map(({ points }) => points)).toEqual(data.edges.map(({ points }) => points));
  });

  it('uses measured bounds conservatively for nonrectangular same-container endpoints', () => {
    const source = leaf('source', 70, 70, { row: 1, column: 1 });
    source.shape = 'circle';
    const blocker = leaf('blocker', 80, 80, { row: 1, column: 2 });
    blocker.shape = 'diamond';
    const target = leaf('target', 70, 70, { row: 1, column: 3 });
    target.shape = 'stadium';
    const data = baseLayout(
      [source, blocker, target],
      [edge('around-blocker', 'source', 'target')],
      { rowGap: 40, columnGap: 50 }
    );

    runGridLayoutCore(data);

    const blockerRect = {
      left: (blocker.x ?? 0) - (blocker.width ?? 0) / 2 - 6,
      right: (blocker.x ?? 0) + (blocker.width ?? 0) / 2 + 6,
      top: (blocker.y ?? 0) - (blocker.height ?? 0) / 2 - 6,
      bottom: (blocker.y ?? 0) + (blocker.height ?? 0) / 2 + 6,
    };
    const points = data.edges[0].points ?? [];
    for (let index = 1; index < points.length; index++) {
      const a = points[index - 1];
      const b = points[index];
      const crosses =
        a.y === b.y
          ? a.y > blockerRect.top &&
            a.y < blockerRect.bottom &&
            Math.max(a.x, b.x) > blockerRect.left &&
            Math.min(a.x, b.x) < blockerRect.right
          : a.x > blockerRect.left &&
            a.x < blockerRect.right &&
            Math.max(a.y, b.y) > blockerRect.top &&
            Math.min(a.y, b.y) < blockerRect.bottom;
      expect(crosses).toBe(false);
    }
  });

  it.each([
    {
      reason: 'vertex_cap',
      options: { topologyCaps: { maxVertices: 1 } },
    },
    {
      reason: 'adjacency_cap',
      options: { topologyCaps: { maxAdjacencyEntries: 1 } },
    },
    {
      reason: 'estimated_memory_cap',
      options: { topologyCaps: { maxEstimatedBytes: 1 } },
    },
    {
      reason: 'search_state_cap',
      options: { searchCaps: { maxExpandedStates: 1 } },
    },
  ] as const)(
    'falls back only for the fixed $reason resource-cap reason',
    ({ reason, options }) => {
      const data = baseLayout(
        [leaf('a', 80, 40, { row: 1, column: 1 }), leaf('b', 80, 40, { row: 1, column: 2 })],
        [edge('a-b', 'a', 'b')],
        { columnGap: 60 }
      );
      const metrics = createGridRoutingInstrumentation();

      runGridLayoutCore(data, metrics, options);

      expect(validateLayout(data)).toMatchObject({ ok: true, issues: [] });
      expect(metrics.resourceLimitFallbacks).toBe(1);
      expect(metrics.fallbackReasons[reason]).toBe(1);
      expect(metrics.fallbackValidationFailures).toBe(0);
    }
  );

  it('rejects an invalid resource-cap fallback instead of committing it', () => {
    const data = baseLayout(
      [leaf('a', 80, 40, { row: 1, column: 1 }), leaf('b', 80, 40, { row: 1, column: 2 })],
      [edge('a-b', 'a', 'b')],
      { columnGap: 0 }
    );
    const metrics = createGridRoutingInstrumentation();

    expect(() =>
      runGridLayoutCore(data, metrics, { topologyCaps: { maxVertices: 1 } })
    ).toThrowError(/GRID_ROUTE_NOT_FOUND: Invalid legacy fallback/);
    expect(metrics.resourceLimitFallbacks).toBe(1);
    expect(metrics.fallbackValidationFailures).toBe(1);
  });

  it('commits an earlier validated candidate when a later candidate reaches the search cap', () => {
    const data = baseLayout(
      [
        leaf('a', 80, 40, { row: 1, column: 1 }),
        leaf('blocker', 80, 400, { row: 1, column: 2 }),
        leaf('b', 80, 40, { row: 1, column: 3 }),
      ],
      [edge('a-b', 'a', 'b')],
      { columnGap: 40 }
    );
    const metrics = createGridRoutingInstrumentation();

    runGridLayoutCore(data, metrics, {
      searchCaps: { maxInvocationExpandedStates: 30 },
    });

    expect(validateLayout(data)).toMatchObject({ ok: true, issues: [] });
    expect(metrics.searches).toBe(2);
    expect(metrics.expandedStates).toBe(30);
    expect(metrics.resourceLimitFallbacks).toBe(0);
    expect(data.edges[0].points).toEqual([
      { x: 80, y: 200 },
      { x: 114, y: 200 },
      { x: 114, y: -6 },
      { x: 206, y: -6 },
      { x: 206, y: 200 },
      { x: 240, y: 200 },
    ]);
  });

  it('does not fall back when endpoint capacity makes a route impossible', () => {
    const data = baseLayout(
      [leaf('a', 10, 10, { row: 1, column: 1 }), leaf('b', 10, 10, { row: 1, column: 2 })],
      [edge('a-b', 'a', 'b')],
      { columnGap: 40 }
    );
    const metrics = createGridRoutingInstrumentation();

    expect(() => runGridLayoutCore(data, metrics)).toThrowError(
      /GRID_ROUTE_NOT_FOUND: No legal endpoint candidates/
    );
    expect(metrics.routesImpossible).toBe(1);
    expect(metrics.resourceLimitFallbacks).toBe(0);
  });

  it('excludes group titles and corners from same-container endpoint slots', () => {
    const data = baseLayout(
      [
        leaf('above', 60, 30, { row: 1, column: 1 }),
        group('g', 'Titled group', { row: 2, column: 1 }),
        leaf('member', 80, 40, { row: 1, column: 1 }, 'g'),
      ],
      [edge('g-above', 'g', 'above')],
      { rowGap: 70 }
    );

    runGridLayoutCore(data);

    const owner = data.nodes.find(({ id }) => id === 'g')!;
    const port = data.edges[0].points![0];
    const ownerRect = {
      left: (owner.x ?? 0) - (owner.width ?? 0) / 2,
      right: (owner.x ?? 0) + (owner.width ?? 0) / 2,
      top: (owner.y ?? 0) - (owner.height ?? 0) / 2,
      bottom: (owner.y ?? 0) + (owner.height ?? 0) / 2,
    };
    expect(port.y).not.toBe(ownerRect.top);
    if (port.x === ownerRect.left || port.x === ownerRect.right) {
      expect(port.y).toBeGreaterThanOrEqual((owner.groupTitleRect?.bottom ?? ownerRect.top) + 6);
    }
    expect(port.y).toBeLessThanOrEqual(ownerRect.bottom - 6);
  });

  it('routes same-cell stack endpoints around measured intervening items', () => {
    const data = baseLayout(
      [
        leaf('top', 70, 32, { row: 1, column: 1 }),
        leaf('middle', 90, 42, { row: 1, column: 1 }),
        leaf('bottom', 70, 32, { row: 1, column: 1 }),
      ],
      [edge('stack-edge', 'top', 'bottom')],
      { cellGap: 20 }
    );

    runGridLayoutCore(data);

    expect(validateLayout(data)).toMatchObject({ ok: true, issues: [] });
    expect(normalizePolyline(data.edges[0].points ?? []).bends).toBeGreaterThanOrEqual(2);
  });

  it.each([
    {
      name: 'nested siblings',
      nodes: [
        group('outer', 'Outer', { row: 1, column: 1 }),
        group('inner', 'Inner', { row: 1, column: 1 }, 'outer'),
        leaf('source', 70, 36, { row: 1, column: 1 }, 'inner'),
        leaf('target', 70, 36, { row: 1, column: 2 }, 'inner'),
      ],
      route: edge('nested-siblings', 'source', 'target'),
      boundaries: [],
    },
    {
      name: 'group/member',
      nodes: [
        group('outer', 'Outer', { row: 1, column: 1 }),
        leaf('source', 70, 36, { row: 1, column: 1 }, 'outer'),
      ],
      route: edge('group-member', 'outer', 'source'),
      boundaries: ['outer'],
    },
    {
      name: 'ancestor/member',
      nodes: [
        group('outer', 'Outer', { row: 1, column: 1 }),
        group('inner', 'Inner', { row: 1, column: 1 }, 'outer'),
        leaf('source', 70, 36, { row: 1, column: 1 }, 'inner'),
      ],
      route: edge('ancestor-member', 'outer', 'source'),
      boundaries: ['outer', 'inner'],
    },
    {
      name: 'cross-group members',
      nodes: [
        group('left-group', 'Left', { row: 1, column: 1 }),
        leaf('source', 70, 36, { row: 1, column: 1 }, 'left-group'),
        group('right-group', 'Right', { row: 1, column: 2 }),
        leaf('target', 70, 36, { row: 1, column: 1 }, 'right-group'),
      ],
      route: edge('cross-group', 'source', 'target'),
      boundaries: ['left-group', 'right-group'],
    },
    {
      name: 'outside/group endpoint',
      nodes: [
        leaf('source', 70, 36, { row: 1, column: 1 }),
        group('target-group', 'Target', { row: 1, column: 2 }),
        leaf('member', 70, 36, { row: 1, column: 1 }, 'target-group'),
      ],
      route: edge('group-endpoint', 'source', 'target-group'),
      boundaries: [],
    },
  ])(
    'routes $name container-by-container with only required boundary transitions',
    ({ nodes, route, boundaries }) => {
      const build = () =>
        baseLayout(
          nodes.map((node) => ({ ...node })),
          [{ ...route }],
          {
            rowGap: 70,
            columnGap: 90,
          }
        );
      const data = build();
      const metrics = createGridRoutingInstrumentation();

      runGridLayoutCore(data, metrics);

      expect(validateLayout(data)).toMatchObject({ ok: true, issues: [] });
      const routed = data.edges[0];
      const groups = data.nodes.filter((node) => node.isGroup);
      const actual = groups.reduce(
        (total, owner) => total + boundaryCrossings(routed.points ?? [], owner),
        0
      );
      expect(actual).toBe(boundaries.length);
      for (const owner of groups) {
        expect(boundaryCrossings(routed.points ?? [], owner)).toBe(
          boundaries.includes(owner.id) ? 1 : 0
        );
      }
      expect(metrics.routes[0]?.boundaryTransitionCount).toBe(boundaries.length);
      expect(metrics.hierarchyPortalPairs).toBe(boundaries.length);
      expect(metrics.resourceLimitFallbacks).toBe(0);

      const rerun = build();
      runGridLayoutCore(rerun);
      expect(rerun.edges[0].points).toEqual(routed.points);
    }
  );

  it('uses 12px paired portals outside title and corner exclusions', () => {
    const data = baseLayout(
      [
        group('titled', 'A deliberately wide title', { row: 1, column: 1 }),
        leaf('member', 64, 32, { row: 1, column: 1 }, 'titled'),
        leaf('outside', 64, 32, { row: 1, column: 2 }),
      ],
      [edge('title-adjacent', 'member', 'outside')],
      { rowGap: 60, columnGap: 80 }
    );
    const metrics = createGridRoutingInstrumentation();

    runGridLayoutCore(data, metrics);

    expect(validateLayout(data)).toMatchObject({ ok: true, issues: [] });
    const owner = data.nodes.find(({ id }) => id === 'titled')!;
    const rect = nodeRect(owner);
    const crossing = normalizePolyline(data.edges[0].points ?? []).segments.find((segment) => {
      if (segment.orientation === 'H') {
        return (
          segment.a.y > rect.top &&
          segment.a.y < rect.bottom &&
          Math.min(segment.a.x, segment.b.x) < rect.right &&
          Math.max(segment.a.x, segment.b.x) > rect.right
        );
      }
      return (
        segment.a.x > rect.left &&
        segment.a.x < rect.right &&
        Math.min(segment.a.y, segment.b.y) < rect.bottom &&
        Math.max(segment.a.y, segment.b.y) > rect.bottom
      );
    });
    expect(crossing).toBeDefined();
    const tangential = crossing?.orientation === 'H' ? crossing.a.y : crossing?.a.x;
    const low =
      crossing?.orientation === 'H'
        ? Math.max(rect.top + 6, (owner.groupTitleRect?.bottom ?? rect.top) + 6)
        : rect.left + 6;
    const high = crossing?.orientation === 'H' ? rect.bottom - 6 : rect.right - 6;
    expect(tangential).toBeGreaterThanOrEqual(low);
    expect(tangential).toBeLessThanOrEqual(high);
    expect(metrics.routes[0]?.boundaryTransitionCount).toBe(1);
    expect(metrics.hierarchyPortalPairs).toBe(1);
    expect(metrics.hierarchyPortalTransitionLength).toBe(12);
  });

  it('reports test-only sparse and legacy route comparison without changing selection', () => {
    const data = baseLayout(
      [
        leaf('v1', 80, 40, { row: 1, column: 1 }),
        leaf('v2', 80, 40, { row: 1, column: 3 }),
        leaf('v2p', 80, 40, { row: 2, column: 2 }),
      ],
      [edge('v1-v2', 'v1', 'v2')],
      { rowGap: 40, columnGap: 40 }
    );
    const comparisons: unknown[] = [];

    runGridLayoutCore(data, createGridRoutingInstrumentation(), {
      onDualRouteComparison: (comparison) => comparisons.push(comparison),
    });

    expect(comparisons).toEqual([
      expect.objectContaining({
        edgeId: 'v1-v2',
        sparse: expect.objectContaining({ valid: true, bends: 0 }),
        legacy: expect.objectContaining({ valid: true, bends: 4 }),
      }),
    ]);
    expect(normalizePolyline(data.edges[0].points ?? []).segments).toHaveLength(1);
  });
});
