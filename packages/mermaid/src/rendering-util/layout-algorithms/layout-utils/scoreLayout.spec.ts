import { describe, it, expect } from 'vitest';
import type { LayoutData, Node, Edge } from '../../types.js';
import { scoreLayout } from './scoreLayout.js';
import { segmentsCross } from './geometry.js';
import type { Segment } from './geometry.js';

interface Point {
  x: number;
  y: number;
}

function mkNode(id: string, x: number, y: number, width = 40, height = 40): Node {
  return { id, x, y, width, height, isGroup: false } as Node;
}

function mkEdge(
  id: string,
  start: string | undefined,
  end: string | undefined,
  points: Point[]
): Edge {
  return { id, start, end, type: 'arrow', points } as Edge;
}

describe('scoreLayout', () => {
  describe('simple 3-node chain (A→B→C)', () => {
    // A at (0, 0), B at (0, 100), C at (0, 200) — vertical chain
    // node.x/y = center, so centers are at (0,0), (0,100), (0,200)
    const a = mkNode('A', 0, 0);
    const b = mkNode('B', 0, 100);
    const c = mkNode('C', 0, 200);
    // Edges connect from boundary to boundary (straight vertical lines)
    const e1 = mkEdge('e1', 'A', 'B', [
      { x: 0, y: 20 },
      { x: 0, y: 80 },
    ]);
    const e2 = mkEdge('e2', 'B', 'C', [
      { x: 0, y: 120 },
      { x: 0, y: 180 },
    ]);
    const layout: LayoutData = { nodes: [a, b, c], edges: [e1, e2], config: {} };

    it('returns reasonable values for all metrics', () => {
      const result = scoreLayout(layout);
      const s = result.scores;

      // edgeLengthRatio: actual 60+60=120, theoretical Manhattan 100+100=200, ratio=0.6
      expect(s.edgeLengthRatio).toBeGreaterThan(0);
      expect(s.edgeLengthRatio).toBeLessThan(3);
      expect(s.edgeLengthRatio).toBeCloseTo(0.6, 5);

      // aspectRatio: BB width=40, height=240, ratio ≈ 0.167
      expect(s.aspectRatio).toBeGreaterThan(0);
      expect(s.aspectRatio).toBeLessThan(1);

      // All edges are straight
      expect(s.avgBendsPerEdge).toBe(0);
      expect(s.totalBends).toBe(0);
      expect(s.straightEdgeRatio).toBe(1);

      // No crossings
      expect(s.crossings).toBe(0);

      // Perfect rank faithfulness (depth matches Y order)
      expect(s.rankFaithfulness).toBeCloseTo(1.0, 5);

      // Neighborhood preservation: connected closer than unconnected
      expect(s.neighborhoodPreservation).toBeGreaterThanOrEqual(0);
      expect(s.neighborhoodPreservation).toBeLessThanOrEqual(1);

      // Symmetry is stubbed
      expect(Number.isNaN(s.symmetryScore)).toBe(true);

      // Bounding box area > 0
      expect(s.boundingBoxArea).toBeGreaterThan(0);
    });

    it('returns null thresholdResults when no thresholds provided', () => {
      const result = scoreLayout(layout);
      expect(result.thresholdResults).toBeNull();
    });
  });

  describe('degenerate: all nodes stacked vertically in a column', () => {
    // Nodes in a vertical column, no edges
    // BB: width = 40 (single column), height = 40 + 3*100 = 340
    // aspectRatio = 40 / 340 ≈ 0.118
    const nodes = [
      mkNode('A', 0, 0, 40, 40),
      mkNode('B', 0, 100, 40, 40),
      mkNode('C', 0, 200, 40, 40),
      mkNode('D', 0, 300, 40, 40),
    ];
    const layout: LayoutData = { nodes, edges: [], config: {} };

    it('has very small aspectRatio', () => {
      const result = scoreLayout(layout);
      expect(result.scores.aspectRatio).toBeLessThan(0.3);
      expect(result.scores.aspectRatio).toBeCloseTo(40 / 340, 3);
    });
  });

  describe('no edges', () => {
    const nodes = [mkNode('A', 0, 0), mkNode('B', 100, 0)];
    const layout: LayoutData = { nodes, edges: [], config: {} };

    it('returns NaN for edge-dependent metrics', () => {
      const result = scoreLayout(layout);
      const s = result.scores;
      expect(Number.isNaN(s.edgeLengthRatio)).toBe(true);
      expect(Number.isNaN(s.avgBendsPerEdge)).toBe(true);
      expect(Number.isNaN(s.straightEdgeRatio)).toBe(true);
      expect(s.totalBends).toBe(0);
      expect(s.crossings).toBe(0);
    });

    it('still computes node-based metrics', () => {
      const result = scoreLayout(layout);
      const s = result.scores;
      expect(s.aspectRatio).toBeGreaterThan(0);
      expect(s.boundingBoxArea).toBeGreaterThan(0);
    });
  });

  describe('cyclic graph (A→B→C→A)', () => {
    // All nodes have in-degree 1, so no roots exist
    const nodeA = mkNode('A', 0, 0);
    const nodeB = mkNode('B', 100, 0);
    const nodeC = mkNode('C', 100, 100);
    const edgeAB = mkEdge('eAB', 'A', 'B', [
      { x: 20, y: 0 },
      { x: 80, y: 0 },
    ]);
    const edgeBC = mkEdge('eBC', 'B', 'C', [
      { x: 100, y: 20 },
      { x: 100, y: 80 },
    ]);
    const edgeCA = mkEdge('eCA', 'C', 'A', [
      { x: 80, y: 100 },
      { x: 0, y: 100 },
      { x: 0, y: 20 },
    ]);
    const cycleLayout: LayoutData = {
      nodes: [nodeA, nodeB, nodeC],
      edges: [edgeAB, edgeBC, edgeCA],
      config: {},
    };

    it('returns NaN for rankFaithfulness', () => {
      const result = scoreLayout(cycleLayout);
      expect(Number.isNaN(result.scores.rankFaithfulness)).toBe(true);
    });

    it('computes other metrics normally', () => {
      const result = scoreLayout(cycleLayout);
      const s = result.scores;
      expect(s.edgeLengthRatio).toBeGreaterThan(0);
      expect(s.crossings).toBeGreaterThanOrEqual(0);
      expect(s.avgBendsPerEdge).toBeGreaterThanOrEqual(0);
    });
  });

  describe('threshold evaluation', () => {
    const a = mkNode('A', 0, 0);
    const b = mkNode('B', 0, 100);
    const e = mkEdge('e', 'A', 'B', [
      { x: 0, y: 20 },
      { x: 0, y: 80 },
    ]);
    const layout: LayoutData = { nodes: [a, b], edges: [e], config: {} };

    it('produces pass/fail results based on thresholds', () => {
      const result = scoreLayout(layout, {
        edgeLengthRatio: { max: 10 },
        crossings: { max: 0 },
        aspectRatio: { min: 0.001 },
      });

      expect(result.thresholdResults).not.toBeNull();
      const tr = result.thresholdResults!;

      expect(tr.edgeLengthRatio.pass).toBe(true);
      expect(tr.crossings.pass).toBe(true);
      expect(tr.crossings.value).toBe(0);
      expect(tr.aspectRatio.pass).toBe(true);

      // Check threshold string format
      expect(tr.edgeLengthRatio.threshold).toBe('max: 10');
      expect(tr.aspectRatio.threshold).toBe('min: 0.001');
    });

    it('reports both min and max in threshold string', () => {
      const result = scoreLayout(layout, {
        aspectRatio: { min: 0.3, max: 3.0 },
      });
      const tr = result.thresholdResults!;
      expect(tr.aspectRatio.threshold).toBe('min: 0.3, max: 3');
    });

    it('fails when value is below min threshold', () => {
      // aspectRatio for 2 vertically stacked nodes (40x40 each, 100 apart)
      // BB: width=40, height=140, ratio ≈ 0.286
      const result = scoreLayout(layout, {
        aspectRatio: { min: 0.5 },
      });
      const tr = result.thresholdResults!;
      expect(tr.aspectRatio.pass).toBe(false);
    });

    it('fails NaN scores against thresholds', () => {
      const noEdgeLayout: LayoutData = { nodes: [a, b], edges: [], config: {} };
      const result = scoreLayout(noEdgeLayout, {
        edgeLengthRatio: { max: 2 },
      });

      expect(result.thresholdResults).not.toBeNull();
      expect(result.thresholdResults!.edgeLengthRatio.pass).toBe(false);
    });
  });

  describe('edges with bends', () => {
    const a = mkNode('A', 0, 0);
    const b = mkNode('B', 100, 100);
    // Edge with one bend: goes right then down
    const e = mkEdge('e', 'A', 'B', [
      { x: 20, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 80 },
    ]);
    const layout: LayoutData = { nodes: [a, b], edges: [e], config: {} };

    it('correctly counts bends', () => {
      const result = scoreLayout(layout);
      expect(result.scores.totalBends).toBe(1);
      expect(result.scores.avgBendsPerEdge).toBe(1);
      expect(result.scores.straightEdgeRatio).toBe(0);
    });
  });

  describe('edge crossings', () => {
    // Two edges that cross: one horizontal, one vertical
    const a = mkNode('A', 0, 50);
    const b = mkNode('B', 100, 50);
    const c = mkNode('C', 50, 0);
    const d = mkNode('D', 50, 100);

    const eH = mkEdge('eH', 'A', 'B', [
      { x: 20, y: 50 },
      { x: 80, y: 50 },
    ]);
    const eV = mkEdge('eV', 'C', 'D', [
      { x: 50, y: 20 },
      { x: 50, y: 80 },
    ]);
    const layout: LayoutData = { nodes: [a, b, c, d], edges: [eH, eV], config: {} };

    it('detects crossings', () => {
      const result = scoreLayout(layout);
      expect(result.scores.crossings).toBe(1);
    });
  });

  describe('segmentsCross — T-intersections and shared endpoints', () => {
    it('detects proper interior crossing (existing behavior)', () => {
      // H segment: (0,50)→(100,50), V segment: (50,0)→(50,100)
      // Intersection at (50,50) — interior of both segments
      const h: Segment = { a: { x: 0, y: 50 }, b: { x: 100, y: 50 }, orientation: 'H' };
      const v: Segment = { a: { x: 50, y: 0 }, b: { x: 50, y: 100 }, orientation: 'V' };
      expect(segmentsCross(h, v)).toBe(true);
    });

    it('detects T-intersection where H endpoint lies on V interior', () => {
      // H segment: (0,50)→(50,50), V segment: (50,0)→(50,100)
      // Intersection at (50,50) — endpoint of H, interior of V
      const h: Segment = { a: { x: 0, y: 50 }, b: { x: 50, y: 50 }, orientation: 'H' };
      const v: Segment = { a: { x: 50, y: 0 }, b: { x: 50, y: 100 }, orientation: 'V' };
      expect(segmentsCross(h, v)).toBe(true);
    });

    it('detects T-intersection where V endpoint lies on H interior', () => {
      // H segment: (0,50)→(100,50), V segment: (50,0)→(50,50)
      // Intersection at (50,50) — interior of H, endpoint of V
      const h: Segment = { a: { x: 0, y: 50 }, b: { x: 100, y: 50 }, orientation: 'H' };
      const v: Segment = { a: { x: 50, y: 0 }, b: { x: 50, y: 50 }, orientation: 'V' };
      expect(segmentsCross(h, v)).toBe(true);
    });

    it('excludes shared endpoint (both segments end at the same point)', () => {
      // H segment: (0,50)→(50,50), V segment: (50,50)→(50,100)
      // Intersection at (50,50) — endpoint of BOTH segments
      const h: Segment = { a: { x: 0, y: 50 }, b: { x: 50, y: 50 }, orientation: 'H' };
      const v: Segment = { a: { x: 50, y: 50 }, b: { x: 50, y: 100 }, orientation: 'V' };
      expect(segmentsCross(h, v)).toBe(false);
    });
  });
});
