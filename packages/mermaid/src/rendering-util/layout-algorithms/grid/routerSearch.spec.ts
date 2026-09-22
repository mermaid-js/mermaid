import { describe, expect, it } from 'vitest';
import { createGridRoutingInstrumentation } from './routerInstrumentation.js';
import {
  addTupleCost,
  compareTupleCost,
  findDenseOracleRoute,
  findShortestRoute,
  tupleHeuristic,
} from './routerSearch.js';
import { buildContainerRoutingTopology } from './routerTopology.js';
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
    expect(tupleHeuristic({ x: 10, y: 15 }, { x: 22, y: 8 })).toEqual([19, 0, 0, 0, 0, 0]);
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
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 100 };
      const reduced = findShortestRoute(
        topology,
        vertexAt(topology, source),
        vertexAt(topology, target)
      );
      const dense = findDenseOracleRoute({
        bounds: topology.bounds,
        obstacles: topology.obstacles,
        source,
        target,
      });

      expect(Boolean(reduced), `reachability case ${caseIndex}`).toBe(Boolean(dense));
      expect(reduced?.cost.slice(0, 2), `cost case ${caseIndex}`).toEqual(dense?.cost.slice(0, 2));
    }
  }, 20_000);
});
