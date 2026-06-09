import { describe, it, expect } from 'vitest';
import type { LayoutData, Node, Edge } from '../../../types.js';
import type { Point } from '../types.js';
import { joinOrthogonallyAtPort, reconcilePortsToLaneOrderRoutingGraph } from './portReconcile.js';
import type { MermaidConfig } from '../../../../config.type.js';

describe('domus/pipeline/portReconcile - ', () => {
  it('reorders ports on a node side to match lane order outside the halo', () => {
    const A: Node = { id: 'A', isGroup: false, x: 0, y: 0, width: 10, height: 10 };
    const B: Node = { id: 'B', isGroup: false, x: 100, y: -50, width: 10, height: 10 };
    const C: Node = { id: 'C', isGroup: false, x: 100, y: 50, width: 10, height: 10 };

    // Right boundary of A is x=5. Left boundary of B/C is x=95.
    // Both edges start with the *same* port/anchor, but diverge vertically after the anchor.
    const eUp: Edge & { points: Point[] } = {
      id: 'eUp',
      start: 'A',
      end: 'B',
      points: [
        { x: 5, y: 0 }, // port on A:E
        { x: 15, y: 0 }, // anchor outside A
        { x: 15, y: -50 }, // lane goes up
        { x: 95, y: -50 }, // port on B:W
      ],
    };
    const eDown: Edge & { points: Point[] } = {
      id: 'eDown',
      start: 'A',
      end: 'C',
      points: [
        { x: 5, y: 0 },
        { x: 15, y: 0 },
        { x: 15, y: 50 }, // lane goes down
        { x: 95, y: 50 },
      ],
    };

    const data: LayoutData = {
      nodes: [A, B, C],
      edges: [eUp, eDown],
      config: {} as MermaidConfig,
    };
    const nodesById = new Map<string, Node>([
      ['A', A],
      ['B', B],
      ['C', C],
    ]);

    reconcilePortsToLaneOrderRoutingGraph(data, nodesById, 10, 0, { model: 'grid' });

    // After reconciliation, the start ports should be distributed along A:E.
    // With A height 10 and lo/hi = 0.25/0.75, y should become -2.5 and +2.5 (in that order).
    expect(eUp.points[0].x).toBe(5);
    expect(eDown.points[0].x).toBe(5);
    expect(eUp.points[0].y).toBeLessThan(eDown.points[0].y);
    expect(eUp.points[0].y).toBeCloseTo(-2.5);
    expect(eDown.points[0].y).toBeCloseTo(2.5);
  });
});

// iter-23 / R9 / Phase C3 — the port reshuffle producer must emit orthogonal
// polylines without relying on sanitize's final-pass diagonal break. This
// helper handles the anchor→adjacent axis realignment explicitly.
describe('joinOrthogonallyAtPort (iter-23 R9 producer fix)', () => {
  const diagonalSegmentCount = (pts: readonly Point[]): number => {
    let n = 0;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const dxZero = Math.abs(a.x - b.x) < 1e-6;
      const dyZero = Math.abs(a.y - b.y) < 1e-6;
      if (!dxZero && !dyZero) {
        n++;
      }
    }
    return n;
  };

  it('returns axis-aligned passthrough when anchor agrees with adjacent point on perpendicular axis (S-side start)', () => {
    const anchor: Point = { x: 309.6, y: 255.0 };
    const tail: Point[] = [
      { x: 309.6, y: 285.0 },
      { x: 352.8, y: 285.0 },
    ];
    const out = joinOrthogonallyAtPort(anchor, tail, 'S', 'start');
    expect(out).toEqual([anchor, ...tail]);
    expect(diagonalSegmentCount(out)).toBe(0);
  });

  it('inserts an elbow on the port outward axis for a diagonal anchor→tail[0] (S-side start, company-simp reproducer)', () => {
    // Reproduces the exact company-simp pattern that triggered 8 sanitize
    // diagonal-input calls on iter-22: S-side port sampled at a new t leaves
    // the anchor off-axis from tail[0]. Without the elbow, anchor→tail[0] is
    // diagonal (dx=43.2, dy=10).
    const anchor: Point = { x: 309.6, y: 255.0 };
    const tail: Point[] = [
      { x: 352.8, y: 265.0 },
      { x: 352.8, y: 285.0 },
    ];
    const out = joinOrthogonallyAtPort(anchor, tail, 'S', 'start');
    // S-side is vertical; elbow keeps anchor.x then goes to tail[0].y.
    expect(out).toEqual([anchor, { x: 309.6, y: 265.0 }, ...tail]);
    expect(diagonalSegmentCount(out)).toBe(0);
  });

  it('inserts an elbow for an E-side end case (head→anchor diagonal)', () => {
    // End kind on an E-side port: anchor should receive a horizontal segment
    // from the axis-corrected elbow; elbow stays on E-side outward normal.
    const anchor: Point = { x: 131.4, y: 128.8 };
    const head: Point[] = [
      { x: 191.1, y: 212.5 },
      { x: 171.1, y: 212.5 },
    ];
    const out = joinOrthogonallyAtPort(anchor, head, 'E', 'end');
    // E-side is horizontal; elbow keeps head[last].x then goes to anchor.y.
    expect(out).toEqual([...head, { x: 171.1, y: 128.8 }, anchor]);
    expect(diagonalSegmentCount(out)).toBe(0);
  });

  it('handles empty outer (single-point polyline)', () => {
    const anchor: Point = { x: 10, y: 20 };
    expect(joinOrthogonallyAtPort(anchor, [], 'E', 'start')).toEqual([anchor]);
    expect(joinOrthogonallyAtPort(anchor, [], 'S', 'end')).toEqual([anchor]);
  });
});
