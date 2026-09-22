import { describe, expect, it } from 'vitest';
import { createGridRoutingInstrumentation } from './routerInstrumentation.js';
import {
  addTupleCost,
  compareTupleCost,
  findDenseOracleRoute,
  findShortestRoute,
  tupleHeuristic,
} from './routerSearch.js';
import {
  EndpointOverlayScratch,
  buildContainerRoutingTopology,
  buildEndpointRoutingOverlay,
} from './routerTopology.js';
import type { ContainerRoutingTopology, RouterPoint } from './types.js';

function build(
  obstacles: { id: string; left: number; right: number; top: number; bottom: number }[] = []
): ContainerRoutingTopology {
  return buildContainerRoutingTopology({
    containerId: '__grid_root__',
    ancestryPath: ['__grid_root__'],
    bounds: { left: 0, right: 100, top: 0, bottom: 100 },
    obstacles: obstacles.map(({ id, ...bounds }) => ({ id, bounds })),
  });
}

function vertexAt(topology: ContainerRoutingTopology, point: RouterPoint): number {
  const vertex = topology.vertices.find(
    (candidate) => candidate.point.x === point.x && candidate.point.y === point.y
  );
  if (!vertex) {
    throw new Error(`Missing topology vertex at ${point.x},${point.y}`);
  }
  return vertex.id;
}

describe('grid router search', () => {
  it('compares and adds tuple costs lexicographically without epsilon', () => {
    expect(compareTupleCost([10, 2, 0, 0, 0, 0], [10, 3, 0, 0, 0, 0])).toBeLessThan(0);
    expect(compareTupleCost([10.0000000001, 1, 0, 0, 0, 0], [10, 99, 0, 0, 0, 0])).toBeGreaterThan(
      0
    );
    expect(addTupleCost([1, 2, 3, 4, 5, 6], [6, 5, 4, 3, 2, 1])).toEqual([7, 7, 7, 7, 7, 7]);
    expect(tupleHeuristic({ x: 10, y: 15 }, { x: 22, y: 8 }, 'H', 'V')).toEqual([
      19, 1, 0, 0, 0, 0,
    ]);
    expect(tupleHeuristic({ x: 10, y: 15 }, { x: 10, y: 8 }, 'H', 'V')).toEqual([7, 1, 0, 0, 0, 0]);
  });

  it('finds a deterministic shortest path with exact bend accounting', () => {
    const topology = build();
    const source = vertexAt(topology, { x: 0, y: 0 });
    const target = vertexAt(topology, { x: 100, y: 100 });
    const metrics = createGridRoutingInstrumentation();

    const route = findShortestRoute(topology, source, target, { metrics });

    expect(route?.cost.slice(0, 2)).toEqual([200, 1]);
    expect(route?.points).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 100 },
      { x: 100, y: 100 },
    ]);
    expect(metrics.searches).toBe(1);
    expect(metrics.routesFound).toBe(1);
    expect(metrics.expandedStates).toBeGreaterThan(0);
    expect(metrics.maxOpenSet).toBeGreaterThan(0);
  });

  it('takes a shortest obstacle detour and matches the dense oracle', () => {
    const topology = build([{ id: 'center', left: 40, right: 60, top: 30, bottom: 70 }]);
    const source = vertexAt(topology, { x: 0, y: 24 });
    const target = vertexAt(topology, { x: 100, y: 24 });

    const reduced = findShortestRoute(topology, source, target);
    const dense = findDenseOracleRoute({
      bounds: topology.bounds,
      obstacles: topology.obstacles,
      source: topology.vertices[source].point,
      target: topology.vertices[target].point,
    });

    expect(reduced?.cost.slice(0, 2)).toEqual(dense?.cost.slice(0, 2));
    expect(reduced?.cost.slice(0, 2)).toEqual([100, 0]);
  });

  it('keeps endpoint overlays bounded and outside the base topology', () => {
    const topology = build([{ id: 'center', left: 40, right: 60, top: 30, bottom: 70 }]);
    const metrics = createGridRoutingInstrumentation();
    const overlay = buildEndpointRoutingOverlay(
      topology,
      { x: 10, y: 10 },
      { x: 90, y: 90 },
      metrics
    );

    expect(overlay.vertices.length - topology.vertices.length).toBeLessThanOrEqual(32);
    expect(overlay.adjacencyEntries - topology.adjacencyEntries).toBeLessThanOrEqual(64);
    expect(metrics.endpointOverlayBuilds).toBe(1);
    expect(metrics.endpointOverlayVertices).toBe(
      overlay.vertices.length - topology.vertices.length
    );
    expect(topology.vertices.some(({ kind }) => kind === 'endpoint')).toBe(false);
  });

  it('reuses endpoint overlay scratch without changing the immutable base topology', () => {
    const topology = build([{ id: 'center', left: 40, right: 60, top: 30, bottom: 70 }]);
    const baseSnapshot = structuredClone({
      vertices: topology.vertices,
      adjacency: [...topology.adjacency],
    });
    const scratch = new EndpointOverlayScratch(topology);
    const first = buildEndpointRoutingOverlay(
      topology,
      { x: 10, y: 10 },
      { x: 90, y: 90 },
      undefined,
      scratch
    );
    const firstCounts = {
      vertices: first.vertices.length - topology.vertices.length,
      arcs: first.adjacencyEntries - topology.adjacencyEntries,
    };
    const second = buildEndpointRoutingOverlay(
      topology,
      { x: 10, y: 90 },
      { x: 90, y: 10 },
      undefined,
      scratch
    );

    expect(firstCounts.vertices).toBeLessThanOrEqual(32);
    expect(firstCounts.arcs).toBeLessThanOrEqual(64);
    expect(second.vertices.length - topology.vertices.length).toBeLessThanOrEqual(32);
    expect(second.adjacencyEntries - topology.adjacencyEntries).toBeLessThanOrEqual(64);
    expect(scratch.resetCount).toBe(2);
    expect({
      vertices: topology.vertices,
      adjacency: [...topology.adjacency],
    }).toEqual(baseSnapshot);
  });

  it('returns the same canonical route with zero heuristic and perturbed queue order', () => {
    const topology = build([
      { id: 'center', left: 40, right: 60, top: 30, bottom: 70 },
      { id: 'upper-left', left: 15, right: 25, top: 10, bottom: 25 },
    ]);
    const overlay = buildEndpointRoutingOverlay(topology, { x: 0, y: 50 }, { x: 100, y: 50 });
    const source = vertexAt(overlay, { x: 0, y: 50 });
    const target = vertexAt(overlay, { x: 100, y: 50 });
    const canonical = findShortestRoute(overlay, source, target);
    const zero = findShortestRoute(overlay, source, target, { heuristic: 'zero' });
    const perturbed = findShortestRoute(overlay, source, target, {
      queueOrder: 'reverse',
    });

    expect(zero).toEqual(canonical);
    expect(perturbed).toEqual(canonical);
  });

  it('accounts for reusable search workspace memory and enforces its cap', () => {
    const topology = build();
    const source = vertexAt(topology, { x: 0, y: 0 });
    const target = vertexAt(topology, { x: 100, y: 100 });
    const metrics = createGridRoutingInstrumentation();

    findShortestRoute(topology, source, target, { metrics });
    expect(metrics.searchWorkspaceBytes).toBeGreaterThan(0);
    expect(() =>
      findShortestRoute(topology, source, target, {
        caps: { maxEstimatedBytes: 1 },
      })
    ).toThrowError(expect.objectContaining({ reason: 'estimated_memory_cap' }));
  });

  it('reports deterministic search-state cap exhaustion', () => {
    const topology = build([{ id: 'center', left: 40, right: 60, top: 30, bottom: 70 }]);
    const source = vertexAt(topology, { x: 0, y: 24 });
    const target = vertexAt(topology, { x: 100, y: 76 });
    const metrics = createGridRoutingInstrumentation();

    expect(() =>
      findShortestRoute(topology, source, target, {
        metrics,
        caps: { maxExpandedStates: 1 },
      })
    ).toThrowError(
      expect.objectContaining({
        reason: 'search_state_cap',
      })
    );
    expect(metrics.expandedStates).toBe(1);
  });

  it('rejects malformed graph invariants without treating them as no-route', () => {
    const topology = build();
    const source = vertexAt(topology, { x: 0, y: 0 });
    const target = vertexAt(topology, { x: 100, y: 100 });
    const adjacency = new Map(topology.adjacency);
    adjacency.set(source, [
      {
        from: source,
        to: target,
        orientation: 'H',
        length: Number.NaN,
        kind: 'visibility',
        intervalStart: 0,
        intervalEnd: 100,
      },
    ]);

    expect(() =>
      findShortestRoute({ vertices: topology.vertices, adjacency }, source, target)
    ).toThrowError('Malformed grid routing arc');
  });

  it('matches dense Dijkstra reachability, shortest length, and bends for 10,000 cases', () => {
    let state = 0x5eed1234;
    const random = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 0x1_0000_0000;
    };

    for (let caseIndex = 0; caseIndex < 10_000; caseIndex++) {
      const obstacleCount = 1 + Math.floor(random() * 3);
      const obstacles = Array.from({ length: obstacleCount }, (_, index) => {
        const column = index % 2;
        const row = Math.floor(index / 2);
        const left = 16 + column * 44 + Math.floor(random() * 8);
        const top = 16 + row * 44 + Math.floor(random() * 8);
        return {
          id: `obstacle-${index}`,
          left,
          right: left + 12 + Math.floor(random() * 10),
          top,
          bottom: top + 12 + Math.floor(random() * 10),
        };
      });
      const topology = build(obstacles);
      const seeds = topology.vertices.filter(({ kind }) => kind !== 'projection');
      const source = seeds[caseIndex % seeds.length];
      const target = seeds[(caseIndex * 17 + 7) % seeds.length];
      const overlay = buildEndpointRoutingOverlay(topology, source.point, target.point);
      const reduced = findShortestRoute(
        overlay,
        vertexAt(overlay, source.point),
        vertexAt(overlay, target.point)
      );
      const zero = findShortestRoute(
        overlay,
        vertexAt(overlay, source.point),
        vertexAt(overlay, target.point),
        { heuristic: 'zero' }
      );
      const perturbed = findShortestRoute(
        overlay,
        vertexAt(overlay, source.point),
        vertexAt(overlay, target.point),
        { queueOrder: 'reverse' }
      );
      const dense = findDenseOracleRoute({
        bounds: topology.bounds,
        obstacles: topology.obstacles,
        source: source.point,
        target: target.point,
      });

      expect(Boolean(reduced), `reachability case ${caseIndex}`).toBe(Boolean(dense));
      expect(reduced?.cost.slice(0, 2), `cost case ${caseIndex}`).toEqual(dense?.cost.slice(0, 2));
      expect(zero, `zero heuristic canonical case ${caseIndex}`).toEqual(reduced);
      expect(perturbed, `queue perturbation canonical case ${caseIndex}`).toEqual(reduced);
    }
  }, 60_000);
});
