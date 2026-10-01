import { describe, expect, it, vi } from 'vitest';
import { log } from '../../../logger.js';
import type { Edge, LayoutData, Node } from '../../types.js';
import { normalizePolyline } from '../layout-utils/geometry.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { runGridLayoutCore } from './layoutCore.js';
import { createGridRoutingInstrumentation } from './routerInstrumentation.js';
import { ROOT_CONTAINER_ID } from './types.js';

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

function longestSharedNonterminalSubpath(first: Edge, second: Edge): number {
  const firstSegments = normalizePolyline(first.points ?? []).segments.slice(1, -1);
  const secondSegments = normalizePolyline(second.points ?? []).segments.slice(1, -1);
  let longest = 0;
  for (const a of firstSegments) {
    for (const b of secondSegments) {
      if (a.orientation !== b.orientation) {
        continue;
      }
      if (a.orientation === 'H' && a.a.y === b.a.y) {
        longest = Math.max(
          longest,
          0,
          Math.min(Math.max(a.a.x, a.b.x), Math.max(b.a.x, b.b.x)) -
            Math.max(Math.min(a.a.x, a.b.x), Math.min(b.a.x, b.b.x))
        );
      } else if (a.orientation === 'V' && a.a.x === b.a.x) {
        longest = Math.max(
          longest,
          0,
          Math.min(Math.max(a.a.y, a.b.y), Math.max(b.a.y, b.b.y)) -
            Math.max(Math.min(a.a.y, a.b.y), Math.min(b.a.y, b.b.y))
        );
      }
    }
  }
  return longest;
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

const invalidRoutingIssueTypes = new Set([
  'edge-missing-points',
  'edge-non-orthogonal',
  'edge-intersects-obstacle',
  'edge-endpoint-inside-node',
]);

function invalidRoutingIssues(data: LayoutData) {
  return validateLayout(data).issues.filter(({ type }) => invalidRoutingIssueTypes.has(type));
}

describe('grid router', () => {
  it('keeps routing deterministic when edge input order changes', () => {
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

    const permuted = build();
    permuted.edges.reverse();
    runGridLayoutCore(permuted);
    expect(new Map(permuted.edges.map((item) => [item.id, item.points]))).toEqual(
      new Map(baseline.edges.map((item) => [item.id, item.points]))
    );
  });

  it('routes ordinary edges into valid orthogonal polylines', () => {
    const data = baseLayout(
      [
        group('g', 'Group', { row: 1, column: 1 }),
        leaf('a', 80, 40, { row: 1, column: 1 }, 'g'),
        leaf('b', 90, 40, { row: 1, column: 2 }),
        leaf('c', 70, 40, { row: 2, column: 2 }),
      ],
      [edge('e1', 'a', 'b'), edge('e3', 'a', 'c')],
      { rowGap: 40, columnGap: 40 }
    );

    runGridLayoutCore(data);

    for (const routed of data.edges) {
      expect(routed.points?.length).toBeGreaterThanOrEqual(2);
      for (let index = 1; index < (routed.points?.length ?? 0); index++) {
        const prev = routed.points![index - 1];
        const next = routed.points![index];
        expect(prev.x === next.x || prev.y === next.y).toBe(true);
      }
    }
  });

  it('routes a leaf-to-group edge with finite orthogonal points', () => {
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
  ])('routes $name edges without containment violations', ({ edges }) => {
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

  it('uses centered 8px pair lanes, distinct ports, and deterministic reverse ordering', () => {
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

    const bundle = data.edges.filter((item) => item.id.startsWith('e'));
    const primaryTracks = bundle
      .filter((item) => item.id.startsWith('e'))
      .map((item) => primaryTrackCoordinate(item))
      .sort((a, b) => a - b);
    const centerY = data.nodes.find(({ id }) => id === 'a')!.y ?? 0;
    expect(primaryTracks.map((coordinate) => coordinate - centerY)).toEqual([-12, -4, 4, 12]);
    for (let index = 1; index < primaryTracks.length; index++) {
      expect(primaryTracks[index] - primaryTracks[index - 1]).toBeGreaterThanOrEqual(8);
    }
    expect(new Set(bundle.map((item) => JSON.stringify(item.points?.[0]))).size).toBe(
      bundle.length
    );
    expect(new Set(bundle.map((item) => JSON.stringify(item.points?.at(-1)))).size).toBe(
      bundle.length
    );
    for (let first = 0; first < bundle.length; first++) {
      for (let second = first + 1; second < bundle.length; second++) {
        expect(longestSharedNonterminalSubpath(bundle[first], bundle[second])).toBeLessThan(8);
      }
    }
    const rerun = build();
    runGridLayoutCore(rerun);
    expect(rerun.edges.map((item) => item.points)).toEqual(data.edges.map((item) => item.points));
  });

  it('routes a four-edge bundle around a blocked lane with shared spans below 8px', () => {
    const data = baseLayout(
      [
        leaf('a', 80, 40, { row: 1, column: 1 }),
        leaf('blocker', 80, 8, { row: 1, column: 2 }),
        leaf('b', 80, 40, { row: 1, column: 3 }),
      ],
      [edge('e1', 'a', 'b'), edge('e2', 'a', 'b'), edge('e3', 'a', 'b'), edge('e4', 'b', 'a')],
      { rowGap: 40, columnGap: 60 }
    );
    runGridLayoutCore(data);

    expect(validateLayout(data)).toMatchObject({ ok: true, issues: [] });
    expect(data.edges.some((item) => normalizePolyline(item.points ?? []).bends > 0)).toBe(true);
    for (let first = 0; first < data.edges.length; first++) {
      for (let second = first + 1; second < data.edges.length; second++) {
        expect(longestSharedNonterminalSubpath(data.edges[first], data.edges[second])).toBeLessThan(
          8
        );
      }
    }
  });

  it('throws an explicit no-route error when a pair cannot allocate distinct 8px lanes', () => {
    const data = baseLayout(
      [leaf('a', 40, 24, { row: 1, column: 1 }), leaf('b', 40, 24, { row: 1, column: 2 })],
      Array.from({ length: 10 }, (_, index) => edge(`e${index}`, 'a', 'b')),
      { rowGap: 0, columnGap: 12 }
    );
    expect(() => runGridLayoutCore(data)).toThrowError(
      /GRID_ROUTE_NOT_FOUND: No distinct lane route/
    );
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

  it('allocates distinct ports for repeated self-loops on the same node', () => {
    const data = baseLayout(
      [leaf('a', 800, 400, { row: 1, column: 1 })],
      Array.from({ length: 5 }, (_, index) => edge(`loop-${index}`, 'a', 'a'))
    );

    runGridLayoutCore(data);

    expect(validateLayout(data)).toMatchObject({ ok: true, issues: [] });
    expect(new Set(data.edges.map(({ points }) => JSON.stringify(points))).size).toBe(5);
  });

  it('keeps reverse pair lanes distinct across hierarchy portals', () => {
    const data = baseLayout(
      [
        group('left-group', 'Left', { row: 1, column: 1 }),
        leaf('a', 80, 40, { row: 1, column: 1 }, 'left-group'),
        group('right-group', 'Right', { row: 1, column: 2 }),
        leaf('b', 80, 40, { row: 1, column: 1 }, 'right-group'),
      ],
      [edge('e1', 'a', 'b'), edge('e2', 'a', 'b'), edge('e3', 'b', 'a')],
      { rowGap: 50, columnGap: 90 }
    );
    runGridLayoutCore(data);

    expect(validateLayout(data)).toMatchObject({ ok: true, issues: [] });
    expect(new Set(data.edges.map(({ points }) => JSON.stringify(points))).size).toBe(3);
    const a = data.nodes.find(({ id }) => id === 'a')!;
    const aPorts = data.edges
      .map((item) => (item.start === 'a' ? item.points?.[0] : item.points?.at(-1)))
      .map((point) => (point?.y ?? 0) - (a.y ?? 0))
      .sort((first, second) => first - second);
    expect(aPorts).toEqual([-8, 0, 8]);
    for (let first = 0; first < data.edges.length; first++) {
      for (let second = first + 1; second < data.edges.length; second++) {
        expect(longestSharedNonterminalSubpath(data.edges[first], data.edges[second])).toBeLessThan(
          8
        );
      }
    }
  });

  it('selects a shortest straight route through unused cell space over the legacy detour', () => {
    const data = baseLayout(
      [
        leaf('v1', 80, 40, { row: 1, column: 1 }),
        leaf('v2', 80, 40, { row: 1, column: 3 }),
        leaf('v2p', 80, 40, { row: 2, column: 2 }),
      ],
      [edge('v1-v2', 'v1', 'v2')],
      { rowGap: 40, columnGap: 40 }
    );
    runGridLayoutCore(data);

    const normalized = normalizePolyline(data.edges[0].points ?? []);
    expect(validateLayout(data)).toMatchObject({ ok: true, issues: [] });
    expect(normalized.segments).toHaveLength(1);
    expect(normalized.segments[0]?.orientation).toBe('H');
  });

  it('does not separate edges that use opposite sides of the same node', () => {
    const data = baseLayout(
      [
        leaf('v1', 80, 40, { row: 1, column: 1 }),
        leaf('v2p', 80, 40, { row: 2, column: 2 }),
        leaf('v2', 80, 40, { row: 1, column: 3 }),
        leaf('v3', 80, 40, { row: 1, column: 4 }),
      ],
      [edge('v1-v2', 'v1', 'v2'), edge('v2-v3', 'v2', 'v3'), edge('v2p-v1', 'v2p', 'v1')]
    );

    runGridLayoutCore(data);

    expect(data.edges.find(({ id }) => id === 'v2-v3')?.points).toEqual([
      { x: 340, y: 20 },
      { x: 390, y: 20 },
    ]);
    const preview = data.nodes.find(({ id }) => id === 'v2p')!;
    const previewToV1 = data.edges.find(({ id }) => id === 'v2p-v1')!;
    expect(previewToV1.points?.[0]).toEqual({
      x: (preview.x ?? 0) - (preview.width ?? 0) / 2,
      y: preview.y,
    });
    expect(
      normalizePolyline(previewToV1.points ?? []).segments.every(
        ({ orientation }) => orientation === 'H' || orientation === 'V'
      )
    ).toBe(true);
    expect(validateLayout(data)).toMatchObject({ ok: true, issues: [] });
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

  it('routes around the inflated measured bounds of a nonrectangular blocker', () => {
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

  it('treats user nodes with the edge-label prefix as routing obstacles', () => {
    const source = leaf('source', 80, 40, { row: 1, column: 1 });
    const blocker = leaf('edge-label-blocker', 80, 80, { row: 1, column: 2 });
    const target = leaf('target', 80, 40, { row: 1, column: 3 });
    const data = baseLayout(
      [source, blocker, target],
      [edge('around-prefixed-blocker', 'source', 'target')],
      { rowGap: 40, columnGap: 50 }
    );

    runGridLayoutCore(data);

    const blockerBounds = nodeRect(blocker);
    const route = normalizePolyline(data.edges[0].points ?? []);
    expect(route.bends).toBeGreaterThan(0);
    for (const segment of route.segments) {
      const crosses =
        segment.orientation === 'H'
          ? segment.a.y > blockerBounds.top &&
            segment.a.y < blockerBounds.bottom &&
            Math.max(segment.a.x, segment.b.x) > blockerBounds.left &&
            Math.min(segment.a.x, segment.b.x) < blockerBounds.right
          : segment.a.x > blockerBounds.left &&
            segment.a.x < blockerBounds.right &&
            Math.max(segment.a.y, segment.b.y) > blockerBounds.top &&
            Math.min(segment.a.y, segment.b.y) < blockerBounds.bottom;
      expect(crosses).toBe(false);
    }
    expect(validateLayout(data)).toMatchObject({ ok: true, issues: [] });
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
      // These counters prove the configured cap selected a validated fallback for the expected
      // reason; valid geometry alone cannot distinguish fallback routing from the normal path.
      expect(metrics.resourceLimitFallbacks).toBe(1);
      expect(metrics.fallbackReasons[reason]).toBe(1);
      expect(metrics.fallbackValidationFailures).toBe(0);
      expect(metrics.routeOrder).toEqual(['a-b']);
      expect(metrics.routes).toHaveLength(1);
      expect(metrics.routesFound).toBe(1);
      expect(metrics.routesImpossible).toBe(0);
      expect(metrics.routeLength).toBe(metrics.routes[0].routeLength);
      expect(metrics.bendCount).toBe(metrics.routes[0].bendCount);
      expect(metrics.crossingCount).toBe(metrics.routes[0].crossingCount);
      expect(metrics.sharedLength).toBe(metrics.routes[0].sharedLength);
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
    // The counters are necessary to prove the rejected geometry came from the configured fallback
    // and that fallback validation, rather than an unrelated routing failure, blocked the commit.
    expect(metrics.resourceLimitFallbacks).toBe(1);
    expect(metrics.fallbackValidationFailures).toBe(1);
    expect(metrics.routeOrder).toEqual([]);
    expect(metrics.routes).toEqual([]);
    expect(metrics.routesFound).toBe(0);
    expect(metrics.routeLength).toBe(0);
    expect(metrics.bendCount).toBe(0);
    expect(metrics.crossingCount).toBe(0);
    expect(metrics.sharedLength).toBe(0);
  });

  it('validates resource-cap fallback for every hierarchy segment', () => {
    const data = baseLayout(
      [
        group('left-group', 'Left', { row: 1, column: 1 }),
        leaf('source', 70, 36, { row: 1, column: 1 }, 'left-group'),
        group('right-group', 'Right', { row: 1, column: 2 }),
        leaf('target', 70, 36, { row: 1, column: 1 }, 'right-group'),
      ],
      [edge('cross-group', 'source', 'target')],
      { rowGap: 70, columnGap: 90 }
    );
    const metrics = createGridRoutingInstrumentation();

    runGridLayoutCore(data, metrics, { topologyCaps: { maxVertices: 1 } });

    expect(validateLayout(data)).toMatchObject({ ok: true, issues: [] });
    // A cross-group route has three independently capped hierarchy segments; these counters prove
    // every segment used and validated the fallback rather than only the final assembled route.
    expect(metrics.resourceLimitFallbacks).toBe(3);
    expect(metrics.fallbackReasons.vertex_cap).toBe(3);
    expect(metrics.fallbackValidationFailures).toBe(0);
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
    // The exact expansion count is the configured shared invocation budget; it verifies the router
    // stops at the cap while retaining the earlier validated candidate.
    expect(metrics.expandedStates).toBe(30);
    expect(data.edges[0].points).toEqual([
      { x: 80, y: 200 },
      { x: 114, y: 200 },
      { x: 114, y: -6 },
      { x: 206, y: -6 },
      { x: 206, y: 200 },
      { x: 240, y: 200 },
    ]);
  });

  it('warns once when the shared invocation search budget is exhausted', () => {
    const data = baseLayout(
      [
        leaf('a', 80, 40, { row: 1, column: 1 }),
        leaf('b', 80, 40, { row: 1, column: 2 }),
        leaf('c', 80, 40, { row: 1, column: 3 }),
      ],
      [edge('a-b', 'a', 'b'), edge('b-c', 'b', 'c')],
      { columnGap: 60 }
    );
    const warn = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
    const metrics = createGridRoutingInstrumentation();

    try {
      runGridLayoutCore(data, metrics, {
        searchCaps: { maxInvocationExpandedStates: 1 },
      });

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'grid-router',
        'GRID_ROUTING_INVOCATION_SEARCH_BUDGET_EXHAUSTED',
        expect.objectContaining({
          edgeId: expect.any(String),
          containerId: ROOT_CONTAINER_ID,
          expandedStates: 1,
        })
      );
    } finally {
      warn.mockRestore();
    }
  });

  it('does not fall back when endpoint capacity makes a route impossible', () => {
    const data = baseLayout(
      [leaf('a', 10, 10, { row: 1, column: 1 }), leaf('b', 10, 10, { row: 1, column: 2 })],
      [edge('a-b', 'a', 'b')],
      { columnGap: 40 }
    );
    expect(() => runGridLayoutCore(data)).toThrowError(
      /GRID_ROUTE_NOT_FOUND: No legal endpoint candidates/
    );
  });

  it('routes high-degree endpoints when no side can preserve minimum port spacing', () => {
    const data = baseLayout(
      [
        leaf('source', 80, 40, { row: 1, column: 1 }),
        ...Array.from({ length: 19 }, (_, index) =>
          leaf(`target-${index}`, 80, 40, { row: 1, column: index + 2 })
        ),
      ],
      Array.from({ length: 19 }, (_, index) => edge(`edge-${index}`, 'source', `target-${index}`)),
      { columnGap: 40 }
    );

    runGridLayoutCore(data);

    expect(data.edges.every(({ points }) => (points?.length ?? 0) >= 2)).toBe(true);
    expect(
      new Set(data.edges.map(({ points }) => JSON.stringify(points?.[0]))).size
    ).toBeGreaterThan(1);
  });

  it('routes hierarchy bundles when strict separation cannot be preserved', () => {
    const makeData = (reverseEdges = false) => {
      const edges = Array.from({ length: 6 }, (_, index) =>
        edge(`edge-${index}`, 'source', 'target')
      );
      return baseLayout(
        [
          group('left-group', 'Left', { row: 1, column: 1 }),
          leaf('source', 80, 40, { row: 1, column: 1 }, 'left-group'),
          group('right-group', 'Right', { row: 1, column: 2 }),
          leaf('target', 80, 40, { row: 1, column: 1 }, 'right-group'),
        ],
        reverseEdges ? edges.reverse() : edges,
        { rowGap: 50, columnGap: 90 }
      );
    };
    const data = makeData();
    const metrics = createGridRoutingInstrumentation();

    runGridLayoutCore(data, metrics);

    expect(data.edges.every(({ points }) => (points?.length ?? 0) >= 2)).toBe(true);
    expect(invalidRoutingIssues(data)).toEqual([]);
    expect(metrics).toMatchObject({
      hierarchyPortalPairs: 12,
      hierarchyPortalTransitionLength: 144,
      hierarchyPortalAlternativeAttempts: 10,
      hierarchyPortalAlternativeSelections: 4,
      hierarchyBoundaryTransitions: 12,
      routesFound: 6,
      routesImpossible: 0,
      bundleRetryAttempts: 1,
      bundleRetrySuccesses: 0,
      bundleSeparationRelaxations: 2,
      routeOrder: ['edge-0', 'edge-1', 'edge-2', 'edge-3', 'edge-4', 'edge-5'],
    });
    expect(
      metrics.routes.map(({ edgeId, routeOrder, laneOffset, boundaryTransitionCount }) => ({
        edgeId,
        routeOrder,
        laneOffset,
        boundaryTransitionCount,
      }))
    ).toEqual([
      { edgeId: 'edge-0', routeOrder: 0, laneOffset: -20, boundaryTransitionCount: 2 },
      { edgeId: 'edge-1', routeOrder: 1, laneOffset: -12, boundaryTransitionCount: 2 },
      { edgeId: 'edge-2', routeOrder: 2, laneOffset: -4, boundaryTransitionCount: 2 },
      { edgeId: 'edge-3', routeOrder: 3, laneOffset: 4, boundaryTransitionCount: 2 },
      { edgeId: 'edge-4', routeOrder: 4, laneOffset: 12, boundaryTransitionCount: 2 },
      { edgeId: 'edge-5', routeOrder: 5, laneOffset: 20, boundaryTransitionCount: 2 },
    ]);
    expect(metrics.routeLength).toBeCloseTo(
      metrics.routes.reduce((total, route) => total + route.routeLength, 0)
    );
    expect(metrics.bendCount).toBe(
      metrics.routes.reduce((total, route) => total + route.bendCount, 0)
    );
    expect(metrics.crossingCount).toBe(
      metrics.routes.reduce((total, route) => total + route.crossingCount, 0)
    );
    expect(metrics.sharedLength).toBeCloseTo(
      metrics.routes.reduce((total, route) => total + route.sharedLength, 0)
    );

    const reversed = makeData(true);
    const reversedMetrics = createGridRoutingInstrumentation();
    runGridLayoutCore(reversed, reversedMetrics);

    expect(
      Object.fromEntries(data.edges.map(({ id, points }) => [id, JSON.stringify(points)]))
    ).toEqual(
      Object.fromEntries(reversed.edges.map(({ id, points }) => [id, JSON.stringify(points)]))
    );
    expect(reversedMetrics.routeOrder).toEqual(metrics.routeOrder);
    expect(reversedMetrics.routes).toEqual(metrics.routes);
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

  it('routes hierarchy edges to a root sibling in the same stacked cell', () => {
    const data = baseLayout(
      [
        group('G', 'Group One', { row: 1, column: 1 }),
        leaf('A', 80, 40, { row: 1, column: 1 }, 'G'),
        leaf('B', 80, 40, { row: 2, column: 1 }, 'G'),
        leaf('C', 80, 40, { row: 1, column: 1 }),
      ],
      [edge('A-to-C', 'A', 'C'), edge('B-to-C', 'B', 'C')]
    );

    runGridLayoutCore(data);

    expect(data.edges.every(({ points }) => (points?.length ?? 0) >= 2)).toBe(true);
    expect(invalidRoutingIssues(data)).toEqual([]);
  });

  it('routes a mixed-demand hierarchy edge around intervening stacked items', () => {
    const data = baseLayout(
      [
        group('group', 'Group', { row: 1, column: 1 }),
        leaf('top', 70, 32, { row: 1, column: 1 }, 'group'),
        leaf('middle', 90, 42, { row: 1, column: 1 }, 'group'),
        leaf('bottom', 70, 32, { row: 1, column: 1 }, 'group'),
        leaf('outside', 70, 32, { row: 1, column: 2 }),
      ],
      [edge('hierarchy-edge', 'top', 'outside'), edge('incident-edge', 'top', 'middle')],
      { cellGap: 20, columnGap: 80 }
    );
    runGridLayoutCore(data);

    expect(validateLayout(data)).toMatchObject({ ok: true, issues: [] });
    expect(normalizePolyline(data.edges[0].points ?? []).bends).toBeGreaterThanOrEqual(2);
  });

  it('routes a vertical mixed-demand stack without invalid geometry', () => {
    const data = baseLayout(
      [
        group('group', 'Group', { row: 1, column: 1 }),
        leaf('top', 70, 32, { row: 1, column: 1 }, 'group'),
        leaf('middle', 90, 42, { row: 1, column: 1 }, 'group'),
        leaf('bottom', 70, 32, { row: 1, column: 1 }, 'group'),
        leaf('outside', 70, 32, { row: 2, column: 1 }),
      ],
      [edge('hierarchy-edge', 'top', 'outside'), edge('incident-edge', 'top', 'middle')],
      { cellGap: 20, rowGap: 80 }
    );
    runGridLayoutCore(data);

    expect(data.edges.every(({ points }) => (points?.length ?? 0) >= 2)).toBe(true);
    expect(invalidRoutingIssues(data)).toEqual([]);
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
      runGridLayoutCore(data);

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
      const rerun = build();
      runGridLayoutCore(rerun);
      expect(rerun.edges[0].points).toEqual(routed.points);
    }
  );

  it('validates assembled hierarchy routes across deterministic placement variations', () => {
    for (let caseIndex = 0; caseIndex < 64; caseIndex++) {
      const leftRow = 1 + (caseIndex % 3);
      const rightRow = 1 + ((caseIndex >> 2) % 3);
      const leftColumn = 1 + ((caseIndex >> 4) % 2);
      const rightColumn = leftColumn + 1 + ((caseIndex >> 5) % 2);
      const data = baseLayout(
        [
          group('left-group', 'Left', { row: leftRow, column: leftColumn }),
          leaf('source', 60, 32, { row: 1, column: 1 }, 'left-group'),
          leaf('left-blocker', 72, 36, { row: 2, column: 2 }, 'left-group'),
          group('right-group', 'Right', { row: rightRow, column: rightColumn }),
          leaf('target', 60, 32, { row: 1, column: 1 }, 'right-group'),
          leaf('right-blocker', 72, 36, { row: 2, column: 2 }, 'right-group'),
        ],
        [edge(`cross-group-${caseIndex}`, 'source', 'target')],
        {
          rowGap: 48 + (caseIndex % 3) * 8,
          columnGap: 56 + (caseIndex % 4) * 8,
        }
      );

      runGridLayoutCore(data);

      expect(validateLayout(data), `case ${caseIndex}`).toMatchObject({ ok: true, issues: [] });
      const route = data.edges[0].points ?? [];
      const leftGroup = data.nodes.find(({ id }) => id === 'left-group')!;
      const rightGroup = data.nodes.find(({ id }) => id === 'right-group')!;
      expect(boundaryCrossings(route, leftGroup), `left boundary case ${caseIndex}`).toBe(1);
      expect(boundaryCrossings(route, rightGroup), `right boundary case ${caseIndex}`).toBe(1);
    }
  });

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
    // The portal counters express the functional paired-transition contract that is lost when the
    // final route is normalized: one boundary crossing must use one 12px portal pair.
    expect(metrics.routes[0]?.boundaryTransitionCount).toBe(1);
    expect(metrics.hierarchyPortalPairs).toBe(1);
    expect(metrics.hierarchyPortalTransitionLength).toBe(12);
  });

  it('keeps independent hierarchy portals near their preferred coordinates', () => {
    const data = baseLayout(
      [
        group('group', 'Stacked cell', { row: 1, column: 1 }),
        leaf(
          'a',
          80,
          40,
          { row: 1, column: 1, horizontalAlign: 'left', verticalAlign: 'bottom' },
          'group'
        ),
        leaf(
          'b',
          80,
          40,
          { row: 2, column: 1, horizontalAlign: 'right', verticalAlign: 'bottom' },
          'group'
        ),
        leaf('c', 80, 40, { row: 1, column: 2 }),
      ],
      [edge('a-c', 'a', 'c'), edge('b-c', 'b', 'c')],
      { cellGap: 16 }
    );

    runGridLayoutCore(data);

    expect(validateLayout(data)).toMatchObject({ ok: true, issues: [] });
    const owner = data.nodes.find(({ id }) => id === 'group')!;
    const ownerRect = nodeRect(owner);
    const crossingCoordinate = (route: Edge): number => {
      const crossing = normalizePolyline(route.points ?? []).segments.find((segment) => {
        if (segment.orientation !== 'H') {
          return false;
        }
        const low = Math.min(segment.a.x, segment.b.x);
        const high = Math.max(segment.a.x, segment.b.x);
        return low < ownerRect.right && high > ownerRect.right;
      });
      expect(crossing).toBeDefined();
      return crossing!.a.y;
    };

    for (const route of data.edges) {
      const source = data.nodes.find(({ id }) => id === route.start)!;
      expect(Math.abs(crossingCoordinate(route) - (source.y ?? 0))).toBeLessThanOrEqual(1);
    }
  });

  it('keeps a single hierarchy portal near its endpoint instead of centering it', () => {
    const data = baseLayout(
      [
        group('group', 'Group', { row: 1, column: 1 }),
        leaf('a', 80, 40, { row: 1, column: 1 }, 'group'),
        leaf('c', 80, 40, { row: 1, column: 2 }),
      ],
      [edge('a-c', 'a', 'c')],
      { cellGap: 16 }
    );

    runGridLayoutCore(data);

    expect(validateLayout(data)).toMatchObject({ ok: true, issues: [] });
    const owner = data.nodes.find(({ id }) => id === 'group')!;
    const source = data.nodes.find(({ id }) => id === 'a')!;
    const ownerRect = nodeRect(owner);
    const crossing = normalizePolyline(data.edges[0].points ?? []).segments.find((segment) => {
      if (segment.orientation !== 'H') {
        return false;
      }
      const low = Math.min(segment.a.x, segment.b.x);
      const high = Math.max(segment.a.x, segment.b.x);
      return low < ownerRect.right && high > ownerRect.right;
    });

    expect(crossing).toBeDefined();
    expect(Math.abs(crossing!.a.y - (source.y ?? 0))).toBeLessThanOrEqual(1);
    const endpointYs = [source.y ?? 0, data.nodes.find(({ id }) => id === 'c')?.y ?? 0];
    const routeYs = data.edges[0].points?.map(({ y }) => y) ?? [];
    expect(Math.min(...routeYs)).toBeGreaterThanOrEqual(Math.min(...endpointYs) - 1);
    expect(Math.max(...routeYs)).toBeLessThanOrEqual(Math.max(...endpointYs) + 1);
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
