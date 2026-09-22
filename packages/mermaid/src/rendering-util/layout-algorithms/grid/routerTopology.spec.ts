import { describe, expect, it } from 'vitest';
import { createGridRoutingInstrumentation } from './routerInstrumentation.js';
import { buildContainerRoutingTopology, derivePortalRanges } from './routerTopology.js';
import type { RouterPoint } from './types.js';

function point(x: number, y: number): RouterPoint {
  return { x, y };
}

function topology(
  obstacles: { id: string; left: number; right: number; top: number; bottom: number }[] = []
) {
  return buildContainerRoutingTopology({
    containerId: '__grid_root__',
    ancestryPath: ['__grid_root__'],
    bounds: { left: 0, right: 100, top: 0, bottom: 100 },
    obstacles: obstacles.map(({ id, ...bounds }) => ({ id, bounds })),
  });
}

describe('grid router topology', () => {
  it('uses inflated measured geometry and title exclusions as obstacles', () => {
    const result = buildContainerRoutingTopology({
      containerId: 'group',
      ancestryPath: ['__grid_root__', 'group'],
      bounds: { left: 0, right: 120, top: 0, bottom: 100 },
      obstacles: [{ id: 'leaf', bounds: { left: 20, right: 40, top: 30, bottom: 50 } }],
      titleExclusions: [{ id: 'group-title', bounds: { left: 50, right: 90, top: 4, bottom: 14 } }],
    });

    expect(result.obstacles).toEqual([
      { id: 'group-title', left: 44, right: 96, top: 0, bottom: 20 },
      { id: 'leaf', left: 14, right: 46, top: 24, bottom: 56 },
    ]);
    expect(result.horizontalIntervals.intersects(40, 15, 45)).toBe(true);
    expect(result.horizontalIntervals.intersects(70, 15, 45)).toBe(false);
    expect(result.verticalIntervals.intersects(30, 25, 55)).toBe(true);
  });

  it('normalizes overlapping inflated obstacles into disjoint rectangles', () => {
    const result = topology([
      { id: 'b', left: 30, right: 60, top: 30, bottom: 60 },
      { id: 'a', left: 50, right: 75, top: 40, bottom: 70 },
    ]);

    for (let first = 0; first < result.obstacles.length; first++) {
      for (let second = first + 1; second < result.obstacles.length; second++) {
        const a = result.obstacles[first];
        const b = result.obstacles[second];
        const overlapWidth = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const overlapHeight = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        expect(overlapWidth > 0 && overlapHeight > 0).toBe(false);
      }
    }
  });

  it('does not route along a shared boundary through the union interior', () => {
    const result = topology([
      { id: 'left', left: 20, right: 44, top: 30, bottom: 70 },
      { id: 'right', left: 56, right: 80, top: 30, bottom: 70 },
    ]);

    expect(result.obstacles).toEqual([{ id: 'left', left: 14, right: 86, top: 24, bottom: 76 }]);
    expect(result.verticalIntervals.intersects(50, 24, 76)).toBe(true);
  });

  it('adds nearest-visible projections without Cartesian line intersections', () => {
    const result = topology([
      { id: 'center', left: 40, right: 60, top: 40, bottom: 60 },
      { id: 'lower-right', left: 75, right: 85, top: 70, bottom: 80 },
    ]);
    const points = result.vertices.map(({ point: value }) => value);

    expect(points).toContainEqual(point(0, 34));
    expect(points).toContainEqual(point(34, 0));
    expect(points).not.toContainEqual(point(34, 64));
    expect(result.vertices.length).toBeLessThanOrEqual(5 * result.seedCount + 32);
    expect(result.adjacencyEntries).toBeLessThanOrEqual(8 * result.vertices.length);
  });

  it('assigns stable exact ordinals and sorted immutable adjacency', () => {
    const forward = topology([
      { id: 'a', left: 10.25, right: 20.5, top: -0, bottom: 25.75 },
      { id: 'b', left: 70.125, right: 80.875, top: 65.5, bottom: 90.25 },
    ]);
    const reverse = topology([
      { id: 'b', left: 70.125, right: 80.875, top: 65.5, bottom: 90.25 },
      { id: 'a', left: 10.25, right: 20.5, top: -0, bottom: 25.75 },
    ]);

    expect(reverse.vertices).toEqual(forward.vertices);
    expect([...reverse.adjacency]).toEqual([...forward.adjacency]);
    expect(JSON.stringify(forward.vertices)).not.toContain('-0');
    expect(Object.isFrozen(forward.vertices)).toBe(true);
    expect(() => (forward.adjacency as Map<number, unknown>).set(999, [])).toThrowError();

    for (const arcs of forward.adjacency.values()) {
      expect(arcs).toEqual(
        [...arcs].sort(
          (a, b) =>
            a.kind.localeCompare(b.kind) ||
            a.orientation.localeCompare(b.orientation) ||
            forward.vertices[a.to].point.x - forward.vertices[b.to].point.x ||
            forward.vertices[a.to].point.y - forward.vertices[b.to].point.y ||
            a.to - b.to
        )
      );
    }
  });

  it('derives title-safe portal ranges with exact corner clearance', () => {
    const ranges = derivePortalRanges(
      'group',
      { left: 10, right: 110, top: 20, bottom: 100 },
      { left: 10, right: 110, top: 20, bottom: 42 }
    );

    expect(ranges).toEqual([
      { ownerId: 'group', side: 'left', low: 48, high: 94 },
      { ownerId: 'group', side: 'right', low: 48, high: 94 },
      { ownerId: 'group', side: 'bottom', low: 16, high: 104 },
    ]);
  });

  it('has geometry-only counts for compact and sparse logical-coordinate twins', () => {
    const metricsCompact = createGridRoutingInstrumentation();
    const metricsSparse = createGridRoutingInstrumentation();
    const input = {
      containerId: '__grid_root__',
      ancestryPath: ['__grid_root__'],
      bounds: { left: 0, right: 220, top: 0, bottom: 100 },
      obstacles: [
        { id: 'first', bounds: { left: 20, right: 80, top: 30, bottom: 70 } },
        { id: 'second', bounds: { left: 140, right: 200, top: 30, bottom: 70 } },
      ],
    };

    const compact = buildContainerRoutingTopology(input, { metrics: metricsCompact });
    const sparse = buildContainerRoutingTopology(input, { metrics: metricsSparse });

    expect({
      vertices: compact.vertices.length,
      adjacency: compact.adjacencyEntries,
      events: metricsCompact.buildSweepEvents,
    }).toEqual({
      vertices: sparse.vertices.length,
      adjacency: sparse.adjacencyEntries,
      events: metricsSparse.buildSweepEvents,
    });
    expect(metricsCompact.baseTopologyBuilds).toBe(1);
    expect(metricsCompact.containersBuilt).toBe(1);
    expect(metricsCompact.estimatedBytes).toBeGreaterThan(0);
  });
});
