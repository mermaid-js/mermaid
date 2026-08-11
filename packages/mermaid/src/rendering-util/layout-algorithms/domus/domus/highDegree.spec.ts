import { describe, it, expect } from 'vitest';
import { runDomus, gridToPixelCoordinates, reconstructEdgePaths } from './domus.js';
import type { EdgeLabel } from './types.js';

describe('DOMUS High-Degree Vertex Handling (Rome Graphs Style)', () => {
  it('handles degree-8 node by expanding into a box post-SAT', () => {
    // Node A connected to 8 other nodes
    const vertices = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'I', 'J'];
    const edges = [
      { id: 'e1', from: 'A', to: 'B' },
      { id: 'e2', from: 'A', to: 'C' },
      { id: 'e3', from: 'A', to: 'D' },
      { id: 'e4', from: 'A', to: 'E' },
      { id: 'e5', from: 'A', to: 'F' },
      { id: 'e6', from: 'A', to: 'G' },
      { id: 'e7', from: 'A', to: 'I' },
      { id: 'e8', from: 'A', to: 'J' },
    ];

    const result = runDomus(vertices, edges, { debug: true });

    expect(result.success).toBe(true);
    expect(result.stats.expandedVertices).toBe(1);

    // Check that A's coordinates are still there (collapsed)
    expect(result.coordinates?.has('A')).toBe(true);

    // Verify the shape has more than 1 edge per direction for A
    if (result.shape) {
      const labels = new Set<EdgeLabel>();
      const sideCounts = new Map<EdgeLabel, number>();

      for (const e of edges) {
        const label = result.shape.getLabel('A', e.to, e.id);
        if (label) {
          labels.add(label);
          sideCounts.set(label, (sideCounts.get(label) ?? 0) + 1);
        }
      }

      // Should use all 4 directions (since degree 8 > 4)
      expect(labels.size).toBe(4);

      // Each direction should have at least 1 edge
      for (const count of sideCounts.values()) {
        expect(count).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('preserves drawability after box expansion', () => {
    // Star graph with degree 12
    const vertices = ['HUB'];
    const edges = [];
    for (let i = 0; i < 12; i++) {
      const vId = `leaf_${i}`;
      vertices.push(vId);
      edges.push({ id: `e${i}`, from: 'HUB', to: vId });
    }

    const result = runDomus(vertices, edges, { debug: false });
    expect(result.success).toBe(true);
    expect(result.stats.expandedVertices).toBe(1);

    // Total dummy vertices should include ports and internal edges
    // For degree 12, distributed say 3,3,3,3.
    // Each side has chain of 3 vertices (2 internal edges).
    // Total vertices: core(1) + 4 sides * 3 ports = 13 vertices.
    // Collapse should bring them all back to HUB.
    expect(result.coordinates?.size).toBe(13); // 1 hub + 12 leaves
  });

  it('routes expanded high-degree edges from the node center (renderer clips intersections)', () => {
    const vertices = ['HUB'];
    const edges: { id: string; from: string; to: string }[] = [];
    for (let i = 0; i < 12; i++) {
      const vId = `leaf_${i}`;
      vertices.push(vId);
      edges.push({ id: `e${i}`, from: 'HUB', to: vId });
    }

    // Provide a real node size so we can verify boundary clipping.
    const nodeSizes = new Map<string, { width: number; height: number }>();
    nodeSizes.set('HUB', { width: 120, height: 80 });
    for (let i = 0; i < 12; i++) {
      nodeSizes.set(`leaf_${i}`, { width: 40, height: 40 });
    }

    const result = runDomus(vertices, edges, { debug: false, nodeSizes });
    expect(result.success).toBe(true);
    expect(result.fullCoordinates, 'fullCoordinates should be available').toBeTruthy();
    expect(result.coordinates?.get('HUB'), 'collapsed HUB coordinate exists').toBeTruthy();

    // With nodeSizes provided, DOMUS coordinates are already in pixel units.
    const pixel = gridToPixelCoordinates(result.fullCoordinates!, 1, { x: 0, y: 0 });
    const paths = reconstructEdgePaths(result, pixel, edges, nodeSizes);

    const hub = result.coordinates!.get('HUB')!;
    const starts = new Set<string>();
    const secondPts = new Set<string>();
    for (const e of edges) {
      const pts = paths.get(e.id);
      expect(pts, `edge ${e.id} has path`).toBeTruthy();
      const start = pts![0];
      // Center-based endpoints: the renderer will later compute the boundary intersection.
      expect(Math.abs(start.x - hub.x)).toBeLessThan(1e-6);
      expect(Math.abs(start.y - hub.y)).toBeLessThan(1e-6);
      starts.add(`${start.x},${start.y}`);
      if (pts!.length >= 2) {
        const p1 = pts![1];
        secondPts.add(`${p1.x},${p1.y}`);
      }
    }

    // All starts should be at the same hub centroid.
    expect(starts.size).toBe(1);
    // But the first "outside" direction should differ for many edges (ports are distinct).
    expect(secondPts.size).toBeGreaterThan(4);
  });
});
