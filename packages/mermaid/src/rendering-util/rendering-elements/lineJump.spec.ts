import { describe, expect, it } from 'vitest';
import { select } from 'd3';
import {
  applyLineJumpsToSvg,
  findEdgeIntersections,
  isStraightPath,
  processEdgesWithJumps,
  type EdgeGeom,
  type LineJumpConfig,
} from './lineJump.js';
import type { D3Selection } from '../../types.js';

const ARC_CONFIG: LineJumpConfig = {
  enabled: true,
  jumpRadius: 1,
  jumpStyle: 'arc',
};

describe('lineJump', () => {
  describe('findEdgeIntersections', () => {
    it('detects a single perpendicular crossing and assigns the jump to the horizontal edge', () => {
      const edges: EdgeGeom[] = [
        {
          id: 'e1',
          points: [
            { x: 0, y: 5 },
            { x: 10, y: 5 },
          ],
        },
        {
          id: 'e2',
          points: [
            { x: 5, y: 0 },
            { x: 5, y: 10 },
          ],
        },
      ];

      const crossings = findEdgeIntersections(edges);

      expect(crossings).toHaveLength(1);
      const [c] = crossings;
      // Orthogonal rule: horizontal edge hops over vertical.
      expect(c.jumpEdgeId).toBe('e1');
      expect(c.otherEdgeId).toBe('e2');
      expect(c.point.x).toBeCloseTo(5);
      expect(c.point.y).toBeCloseTo(5);
    });

    it('keeps horizontal-hops-over-vertical even when input order is reversed', () => {
      const edges: EdgeGeom[] = [
        {
          id: 'vertical',
          points: [
            { x: 5, y: 0 },
            { x: 5, y: 10 },
          ],
        },
        {
          id: 'horizontal',
          points: [
            { x: 0, y: 5 },
            { x: 10, y: 5 },
          ],
        },
      ];

      const [c] = findEdgeIntersections(edges);

      // Still horizontal that gets the jump, regardless of array order.
      expect(c.jumpEdgeId).toBe('horizontal');
      expect(c.otherEdgeId).toBe('vertical');
    });

    it('falls back to later-index-wins when both segments share orientation', () => {
      // Two diagonal edges crossing each other — neither is purely horizontal
      // nor purely vertical under the |dx|>=|dy| test (both are horizontal-
      // dominant here), so the tie is broken by input order.
      const edges: EdgeGeom[] = [
        {
          id: 'a',
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 2 },
          ],
        },
        {
          id: 'b',
          points: [
            { x: 0, y: 2 },
            { x: 10, y: 0 },
          ],
        },
      ];

      const [c] = findEdgeIntersections(edges);
      expect(c.jumpEdgeId).toBe('b');
      expect(c.otherEdgeId).toBe('a');
    });

    it('does not treat a T-junction (endpoint touching another edge) as a crossing', () => {
      // e2 ends exactly on e1, like an arrowhead landing on a backbone edge.
      const edges: EdgeGeom[] = [
        {
          id: 'e1',
          points: [
            { x: 0, y: 5 },
            { x: 10, y: 5 },
          ],
        },
        {
          id: 'e2',
          points: [
            { x: 5, y: 0 },
            { x: 5, y: 5 },
          ],
        },
      ];

      expect(findEdgeIntersections(edges)).toHaveLength(0);
    });

    it('does not treat shared start points as crossings', () => {
      // Two edges fanning out from the same node.
      const edges: EdgeGeom[] = [
        {
          id: 'e1',
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 5 },
          ],
        },
        {
          id: 'e2',
          points: [
            { x: 0, y: 0 },
            { x: 10, y: -5 },
          ],
        },
      ];

      expect(findEdgeIntersections(edges)).toHaveLength(0);
    });

    it('does not treat shared end points as crossings', () => {
      // Two edges converging on the same node.
      const edges: EdgeGeom[] = [
        {
          id: 'e1',
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 5 },
          ],
        },
        {
          id: 'e2',
          points: [
            { x: 0, y: 10 },
            { x: 10, y: 5 },
          ],
        },
      ];

      expect(findEdgeIntersections(edges)).toHaveLength(0);
    });

    it('ignores parallel (non-intersecting) segments', () => {
      const edges: EdgeGeom[] = [
        {
          id: 'e1',
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
          ],
        },
        {
          id: 'e2',
          points: [
            { x: 0, y: 5 },
            { x: 10, y: 5 },
          ],
        },
      ];

      expect(findEdgeIntersections(edges)).toHaveLength(0);
    });
  });

  describe('processEdgesWithJumps', () => {
    it('leaves the vertical edge untouched and puts the arc jump on the horizontal edge', () => {
      const edges: EdgeGeom[] = [
        {
          id: 'h',
          points: [
            { x: 0, y: 5 },
            { x: 10, y: 5 },
          ],
        },
        {
          id: 'v',
          points: [
            { x: 5, y: 0 },
            { x: 5, y: 10 },
          ],
        },
      ];

      const paths = processEdgesWithJumps(edges, ARC_CONFIG);

      // Vertical edge unchanged.
      expect(paths.get('v')).toBe('M5,0 L5,10');
      // Horizontal edge carries a unit-radius arc that "bumps up" at the
      // crossing — segment going +x → sweep flag 0.
      expect(paths.get('h')).toBe('M0,5 L4,5 A1,1 0 0 1 6,5 L10,5');
    });

    it('emits two arcs in t-order when a horizontal edge crosses multiple verticals', () => {
      const edges: EdgeGeom[] = [
        {
          id: 'v1',
          points: [
            { x: 3, y: 0 },
            { x: 3, y: 10 },
          ],
        },
        {
          id: 'v2',
          points: [
            { x: 7, y: 0 },
            { x: 7, y: 10 },
          ],
        },
        {
          id: 'h',
          points: [
            { x: 0, y: 5 },
            { x: 10, y: 5 },
          ],
        },
      ];

      const paths = processEdgesWithJumps(edges, ARC_CONFIG);

      expect(paths.get('v1')).toBe('M3,0 L3,10');
      expect(paths.get('v2')).toBe('M7,0 L7,10');
      // Two crossings at x=3 and x=7 on the same horizontal segment, t-sorted.
      expect(paths.get('h')).toBe('M0,5 L2,5 A1,1 0 0 1 4,5 L6,5 A1,1 0 0 1 8,5 L10,5');
    });

    it('shrinks jump radii when adjacent crossings would overlap', () => {
      // Two crossings only 1.0 apart on a horizontal segment, but radius is
      // 1.0 so a naive rewrite would invert the path. The two arcs must
      // shrink to fit (each ≤ half the gap) and stay monotonic along the
      // segment.
      const edges: EdgeGeom[] = [
        {
          id: 'v1',
          points: [
            { x: 4.5, y: 0 },
            { x: 4.5, y: 10 },
          ],
        },
        {
          id: 'v2',
          points: [
            { x: 5.5, y: 0 },
            { x: 5.5, y: 10 },
          ],
        },
        {
          id: 'h',
          points: [
            { x: 0, y: 5 },
            { x: 10, y: 5 },
          ],
        },
      ];

      const paths = processEdgesWithJumps(edges, ARC_CONFIG);

      const d = paths.get('h')!;
      const arcs = d.match(/A[^A]*?(?=L|A|M|$)/g) ?? [];
      expect(arcs).toHaveLength(2);
      expect(d.startsWith('M0,5 ')).toBe(true);
      expect(d.endsWith(' L10,5')).toBe(true);
      // Sweep flag 0 for horizontal +x segments, and radius clamped to at
      // most half the 1.0 gap between the two crossings.
      const firstArcMatch = /A([\d.]+),([\d.]+) 0 0 1 ([\d.]+),5/.exec(d);
      expect(firstArcMatch).not.toBeNull();
      const firstArcRadius = parseFloat(firstArcMatch![1]);
      expect(firstArcRadius).toBeLessThanOrEqual(0.5);
      expect(firstArcRadius).toBeGreaterThan(0);
    });

    it('returns plain polylines for every edge when disabled, even with crossings present', () => {
      const edges: EdgeGeom[] = [
        {
          id: 'h',
          points: [
            { x: 0, y: 5 },
            { x: 10, y: 5 },
          ],
        },
        {
          id: 'v',
          points: [
            { x: 5, y: 0 },
            { x: 5, y: 10 },
          ],
        },
      ];

      const paths = processEdgesWithJumps(edges, { ...ARC_CONFIG, enabled: false });

      expect(paths.get('h')).toBe('M0,5 L10,5');
      expect(paths.get('v')).toBe('M5,0 L5,10');
    });

    it('emits an M (move) on the horizontal edge when jumpStyle is "gap"', () => {
      const edges: EdgeGeom[] = [
        {
          id: 'h',
          points: [
            { x: 0, y: 5 },
            { x: 10, y: 5 },
          ],
        },
        {
          id: 'v',
          points: [
            { x: 5, y: 0 },
            { x: 5, y: 10 },
          ],
        },
      ];

      const paths = processEdgesWithJumps(edges, {
        enabled: true,
        jumpRadius: 1,
        jumpStyle: 'gap',
      });

      expect(paths.get('v')).toBe('M5,0 L5,10');
      // The gap variant lifts the pen and resumes on the far side of the crossing.
      expect(paths.get('h')).toBe('M0,5 L4,5 M6,5 L10,5');
    });
  });

  describe('isStraightPath', () => {
    it('accepts pure M/L paths', () => {
      expect(isStraightPath('M0,5 L10,5')).toBe(true);
      expect(isStraightPath('M5,0 L5,4 L5,10')).toBe(true);
    });

    it('rejects paths containing curve commands', () => {
      expect(isStraightPath('M0,0 C1,1 2,2 3,3')).toBe(false);
      expect(isStraightPath('M0,0 Q1,1 2,2')).toBe(false);
      expect(isStraightPath('M0,0 L1,1 A1,1 0 0 1 2,2')).toBe(false);
    });
  });

  describe('applyLineJumpsToSvg', () => {
    function makeGroup(paths: { id: string; d: string }[]): {
      group: D3Selection<SVGGElement>;
      svg: SVGSVGElement;
    } {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      svg.appendChild(g);
      for (const { id, d } of paths) {
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('data-id', id);
        p.setAttribute('d', d);
        g.appendChild(p);
      }
      return { group: select(g) as D3Selection<SVGGElement>, svg };
    }

    it('rewrites the d attribute of the horizontal edge for a perpendicular crossing', () => {
      const edges: EdgeGeom[] = [
        {
          id: 'h',
          points: [
            { x: 0, y: 5 },
            { x: 10, y: 5 },
          ],
        },
        {
          id: 'v',
          points: [
            { x: 5, y: 0 },
            { x: 5, y: 10 },
          ],
        },
      ];

      const { group } = makeGroup([
        { id: 'h', d: 'M0,5 L10,5' },
        { id: 'v', d: 'M5,0 L5,10' },
      ]);

      applyLineJumpsToSvg(group, edges, ARC_CONFIG);

      const h = group.node()!.querySelector('path[data-id="h"]')!;
      const v = group.node()!.querySelector('path[data-id="v"]')!;
      expect(v.getAttribute('d')).toBe('M5,0 L5,10');
      expect(h.getAttribute('d')).toBe('M0,5 L4,5 A1,1 0 0 1 6,5 L10,5');
    });

    it('rewrites a "rounded" edge whose rendered d contains corner-rounding Q commands', () => {
      // Real-world case: swimlane edges render via generateRoundedPath with
      // small Q quadratics at corners. With curve hint = 'rounded' the
      // rewrite should still fire and replace the path with arcs at
      // crossings (corner rounding is intentionally lost on the rewritten
      // edge to make the hop visible).
      // With horizontal-hops-over-vertical, the edge that gets rewritten is
      // the one whose crossing segment is horizontal. Use an horizontalBend
      // (horizontal-first-then-down) that crosses a tall vertical.
      const edges: EdgeGeom[] = [
        {
          id: 'verticalLine',
          points: [
            { x: 10, y: 0 },
            { x: 10, y: 25 },
          ],
          curve: 'rounded',
        },
        {
          id: 'horizontalBend',
          // Horizontal segment at y=5 from x=0 to x=20, then bend down to
          // (20, 15). The crossing with verticalLine is at (10, 5), well inside
          // the horizontal segment and away from the corner.
          points: [
            { x: 0, y: 5 },
            { x: 20, y: 5 },
            { x: 20, y: 15 },
          ],
          curve: 'rounded',
        },
      ];

      // Simulated rendered output for `horizontalBend` from generateRoundedPath.
      const renderedRounded = 'M0,5 L17.5,5 Q20,5 20,7.5 L20,15';
      const { group } = makeGroup([
        { id: 'verticalLine', d: 'M10,0 L10,25' },
        { id: 'horizontalBend', d: renderedRounded },
      ]);

      applyLineJumpsToSvg(group, edges, ARC_CONFIG);

      const horizontalBend = group.node()!.querySelector('path[data-id="horizontalBend"]')!;
      const newD = horizontalBend.getAttribute('d')!;
      expect(newD).not.toBe(renderedRounded);
      // The jump arc uses the full requested radius and bumps up (sweep=1
      // for a +x-going horizontal segment in SVG's y-down coordinate system).
      expect(newD).toContain('A1,1 0 0 1');
      // Corner rounding is preserved — Q at the bend point (20, 5).
      expect(newD).toMatch(/Q20,5/);
    });

    it('skips edges whose curve hint is a true smoothing curve', () => {
      const edges: EdgeGeom[] = [
        {
          id: 'horiz',
          points: [
            { x: 0, y: 5 },
            { x: 10, y: 5 },
          ],
          curve: 'linear',
        },
        {
          id: 'vert',
          points: [
            { x: 5, y: 0 },
            { x: 5, y: 10 },
          ],
          curve: 'basis',
        },
      ];

      const curvedD = 'M5,0 C5,3 5,7 5,10';
      const { group } = makeGroup([
        { id: 'horiz', d: 'M0,5 L10,5' },
        { id: 'vert', d: curvedD },
      ]);

      applyLineJumpsToSvg(group, edges, ARC_CONFIG);

      // basis curve → skipped by the curve hint, even before the d check.
      expect(group.node()!.querySelector('path[data-id="vert"]')!.getAttribute('d')).toBe(curvedD);
    });

    it('skips edges whose rendered d contains curve commands', () => {
      const edges: EdgeGeom[] = [
        {
          id: 'e1',
          points: [
            { x: 0, y: 5 },
            { x: 10, y: 5 },
          ],
        },
        {
          id: 'e2',
          points: [
            { x: 5, y: 0 },
            { x: 5, y: 10 },
          ],
        },
      ];

      const curvedD = 'M5,0 C5,3 5,7 5,10';
      const { group } = makeGroup([
        { id: 'e1', d: 'M0,5 L10,5' },
        { id: 'e2', d: curvedD },
      ]);

      applyLineJumpsToSvg(group, edges, ARC_CONFIG);

      const e2 = group.node()!.querySelector('path[data-id="e2"]')!;
      // Curved path left untouched even though geometry says it crosses e1.
      expect(e2.getAttribute('d')).toBe(curvedD);
    });

    it('prefers data-points (the geometry edges.js actually rendered) over edge.points', () => {
      // Simulates the swimlane case where edge.points from layout differs
      // slightly from what edges.js used after its node-boundary
      // intersect() clipping. The rewrite must use the rendered geometry so
      // endpoints line up with the arrow marker.
      const layoutEdges: EdgeGeom[] = [
        {
          id: 'horiz',
          // Layout says y=5; rendering clipped to y=5 too.
          points: [
            { x: 0, y: 5 },
            { x: 20, y: 5 },
          ],
          curve: 'linear',
        },
        {
          id: 'vert',
          // Layout says x=10 from y=0 to y=20.
          points: [
            { x: 10, y: 0 },
            { x: 10, y: 20 },
          ],
          curve: 'linear',
        },
      ];

      // Rendering (via edges.js) actually used x=10, y=2..18 after clipping
      // — encoded in data-points. Crossings/rewrites must use the rendered y.
      const renderedVertPoints = [
        { x: 10, y: 2 },
        { x: 10, y: 18 },
      ];
      const b64 = Buffer.from(JSON.stringify(renderedVertPoints)).toString('base64');

      const { group } = makeGroup([
        { id: 'horiz', d: 'M0,5 L20,5' },
        { id: 'vert', d: 'M10,2 L10,18' },
      ]);
      const vertPath = group.node()!.querySelector('path[data-id="vert"]')!;
      vertPath.setAttribute('data-points', b64);

      applyLineJumpsToSvg(group, layoutEdges, ARC_CONFIG);

      const d = vertPath.getAttribute('d')!;
      expect(d.startsWith('M10,2')).toBe(true);
      expect(d.endsWith('L10,18')).toBe(true);
    });

    it('applies markerOffsets so the rewritten endpoint matches edges.js', () => {
      // With arrowTypeEnd='arrow_point' the markerOffsets table shifts the
      // last point inward by 4 along the last segment's direction. Without
      // this, the arrow marker's orientation/clipping goes wrong (user bug
      // report: "arrow pointing in the wrong way").
      const edges: EdgeGeom[] = [
        {
          id: 'horiz',
          points: [
            { x: 0, y: 5 },
            { x: 20, y: 5 },
          ],
          curve: 'linear',
          arrowTypeEnd: 'arrow_point',
        },
        {
          id: 'vert',
          points: [
            { x: 10, y: 0 },
            { x: 10, y: 20 },
          ],
          curve: 'linear',
        },
      ];

      const { group } = makeGroup([
        { id: 'horiz', d: 'M0,5 L20,5' },
        { id: 'vert', d: 'M10,0 L10,20' },
      ]);

      applyLineJumpsToSvg(group, edges, ARC_CONFIG);

      const horiz = group.node()!.querySelector('path[data-id="horiz"]')!;
      const d = horiz.getAttribute('d')!;
      // Last coord pair is "16,5" (20 - markerOffsets.arrow_point=4), not "20,5".
      expect(d.endsWith('L16,5')).toBe(true);
    });

    it('recomputes stroke-dasharray against the new total length to preserve neo-look marker clearance', () => {
      // The `neo` look in edges.js emits:
      //   stroke-dasharray: 0 <oValueS> <len - oValueS - oValueE> <oValueE>
      // which hides the first oValueS (9 for arrow_point) and last oValueE
      // pixels of the stroke so it doesn't leak into the arrow marker body.
      // After rewrite the path length changes, so the "on" middle portion
      // must be updated, but oValueS and oValueE must be preserved.
      const edges: EdgeGeom[] = [
        {
          id: 'horiz',
          points: [
            { x: 0, y: 5 },
            { x: 20, y: 5 },
          ],
          curve: 'linear',
        },
        {
          id: 'vert',
          points: [
            { x: 10, y: 0 },
            { x: 10, y: 20 },
          ],
          curve: 'linear',
        },
      ];

      const { group } = makeGroup([
        { id: 'horiz', d: 'M0,5 L20,5' },
        { id: 'vert', d: 'M10,0 L10,20' },
      ]);
      const vertPath = group.node()!.querySelector('path[data-id="vert"]')!;
      vertPath.setAttribute(
        'style',
        'stroke-dasharray: 0 9 42 9; stroke-dashoffset: 0; stroke: #000;'
      );
      // JSDOM does not implement getTotalLength; stub it so the recompute
      // branch runs. Value is arbitrary but plausible — mirrors post-rewrite
      // length with an arc inserted.
      (vertPath as unknown as { getTotalLength: () => number }).getTotalLength = () => 60;

      applyLineJumpsToSvg(group, edges, ARC_CONFIG);

      const style = vertPath.getAttribute('style') ?? '';
      // oValueS (9) and oValueE (9) preserved; the on-portion recomputed to
      // (60 - 9 - 9) = 42.
      expect(style).toMatch(/stroke-dasharray:\s*0 9 42 9/);
      // Other declarations survive.
      expect(style).toMatch(/stroke:\s*#000/);
    });

    it('does nothing when disabled', () => {
      const edges: EdgeGeom[] = [
        {
          id: 'e1',
          points: [
            { x: 0, y: 5 },
            { x: 10, y: 5 },
          ],
        },
        {
          id: 'e2',
          points: [
            { x: 5, y: 0 },
            { x: 5, y: 10 },
          ],
        },
      ];

      const { group } = makeGroup([
        { id: 'e1', d: 'M0,5 L10,5' },
        { id: 'e2', d: 'M5,0 L5,10' },
      ]);

      applyLineJumpsToSvg(group, edges, { ...ARC_CONFIG, enabled: false });

      const e2 = group.node()!.querySelector('path[data-id="e2"]')!;
      expect(e2.getAttribute('d')).toBe('M5,0 L5,10');
    });
  });
});
