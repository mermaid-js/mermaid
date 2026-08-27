import { describe, it, expect } from 'vitest';
import {
  intersection,
  ensureTrulyOutside,
  makeInsidePoint,
  tryNodeIntersect,
  replaceEndpoint,
  outlineAttachPoint,
  type RectLike,
  type P,
} from '../geometry.js';
// Lives in render.ts rather than geometry.ts, but it is pure point maths and
// belongs with the other geometry cases.
import { straightenTerminalJogs } from '../render.js';

const approx = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

describe('geometry helpers', () => {
  it('intersection: vertical approach hits bottom border', () => {
    const rect: RectLike = { x: 0, y: 0, width: 100, height: 50 };
    const h = rect.height / 2; // 25
    const outside: P = { x: 0, y: 100 };
    const inside: P = { x: 0, y: 0 };
    const res = intersection(rect, outside, inside);
    expect(approx(res.x, 0)).toBe(true);
    expect(approx(res.y, h)).toBe(true);
  });

  it('ensureTrulyOutside nudges near-boundary point outward', () => {
    const rect: RectLike = { x: 0, y: 0, width: 100, height: 50 };
    // near bottom boundary (y ~ h)
    const near: P = { x: 0, y: rect.height / 2 - 0.2 };
    const out = ensureTrulyOutside(rect, near, 10);
    expect(out.y).toBeGreaterThan(rect.height / 2);
  });

  it('makeInsidePoint keeps x for vertical and y from center', () => {
    const rect: RectLike = { x: 10, y: 5, width: 100, height: 50 };
    const outside: P = { x: 10, y: 40 };
    const center: P = { x: 99, y: -123 }; // center y should be used
    const inside = makeInsidePoint(rect, outside, center);
    expect(inside.x).toBe(outside.x);
    expect(inside.y).toBe(center.y);
  });

  it('tryNodeIntersect returns null for wrong-side intersections', () => {
    const rect: RectLike = { x: 0, y: 0, width: 100, height: 50 };
    const outside: P = { x: -50, y: 0 };
    const node = { intersect: () => ({ x: 10, y: 0 }) } as any; // right side of center
    const res = tryNodeIntersect(node, rect, outside);
    expect(res).toBeNull();
  });

  it('replaceEndpoint dedup removes end/start appropriately', () => {
    const pts: P[] = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ];
    // remove duplicate end
    replaceEndpoint(pts, 'end', { x: 1, y: 1 });
    expect(pts.length).toBe(1);

    const pts2: P[] = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ];
    // remove duplicate start
    replaceEndpoint(pts2, 'start', { x: 0, y: 0 });
    expect(pts2.length).toBe(1);
  });

  describe('outlineAttachPoint', () => {
    // A diamond 105.48 wide and tall, centred like the `diamond-intersections`
    // fixture: outline through the midpoints of its bounding box sides.
    const half = 52.74;
    const bounds: RectLike = { x: 76.74, y: 428.5, width: half * 2, height: half * 2 };
    const diamond = {
      intersect: (p: P): P => {
        // Crossing of the ray centre -> p with |dx|/half + |dy|/half = 1.
        const dx = p.x - bounds.x;
        const dy = p.y - bounds.y;
        const t = half / (Math.abs(dx) + Math.abs(dy));
        return { x: bounds.x + dx * t, y: bounds.y + dy * t };
      },
    };

    it('attaches on the outline at the port’s own offset along the side', () => {
      // ELK's port sits on the bounding box at y = 454.87 and departs east. The
      // attachment must keep that y, so the opening segment stays horizontal;
      // the centre ray would instead land at y = 446.08 and open diagonally.
      const port: P = { x: 129.48, y: 454.87 };
      const next: P = { x: 144.48, y: 454.87 };

      const attach = outlineAttachPoint(diamond, bounds, port, next)!;

      expect(attach.y).toBe(port.y);
      expect(approx(attach.x, 103.11, 0.01)).toBe(true);
      // On the outline: |dx| + |dy| === half.
      expect(
        approx(Math.abs(attach.x - bounds.x) + Math.abs(attach.y - bounds.y), half, 0.01)
      ).toBe(true);
    });

    it('keeps a vertical departure vertical', () => {
      const port: P = { x: 60, y: 481.24 };
      const next: P = { x: 60, y: 520 };

      const attach = outlineAttachPoint(diamond, bounds, port, next)!;

      expect(attach.x).toBe(port.x);
      expect(
        approx(Math.abs(attach.x - bounds.x) + Math.abs(attach.y - bounds.y), half, 0.01)
      ).toBe(true);
    });

    it('returns the port unchanged for a shape whose outline is its box', () => {
      const rect: RectLike = { x: 100, y: 100, width: 80, height: 40 };
      const rectNode = {
        intersect: (p: P): P => {
          const dx = p.x - rect.x;
          const dy = p.y - rect.y;
          const t = Math.min(40 / Math.abs(dx || 1e-9), 20 / Math.abs(dy || 1e-9));
          return { x: rect.x + dx * t, y: rect.y + dy * t };
        },
      };
      const port: P = { x: 140, y: 112 };

      const attach = outlineAttachPoint(rectNode, rect, port, { x: 180, y: 112 })!;

      expect(approx(attach.x, port.x, 0.01)).toBe(true);
      expect(approx(attach.y, port.y, 0.01)).toBe(true);
    });

    it('declines a shapeless node rather than guessing', () => {
      expect(
        outlineAttachPoint({}, bounds, { x: 129.48, y: 454.87 }, { x: 144.48, y: 454.87 })
      ).toBe(null);
    });
  });

  describe('straightenTerminalJogs', () => {
    // A node 40 tall centred at y=120: its border spans y 100..140, so a
    // terminal may be moved anywhere in that range.
    const node: RectLike = { x: 200, y: 120, width: 60, height: 40 };
    const far: RectLike = { x: 600, y: 120, width: 60, height: 40 };

    it('collapses the port-to-channel step next to a node', () => {
      // Leave the port at y=116.25, step 3.25 down onto the channel, carry on.
      const pts: P[] = [
        { x: 193, y: 116.25 },
        { x: 218, y: 116.25 },
        { x: 218, y: 119.5 },
        { x: 315, y: 119.5 },
      ];

      expect(straightenTerminalJogs(pts, node, far)).toEqual([
        { x: 193, y: 119.5 },
        { x: 218, y: 119.5 },
        { x: 315, y: 119.5 },
      ]);
    });

    it('leaves a step too large to be a port connector alone', () => {
      // 40 is a real routing decision, not the leftover from port spreading.
      const pts: P[] = [
        { x: 193, y: 100 },
        { x: 218, y: 100 },
        { x: 218, y: 140 },
        { x: 315, y: 140 },
      ];

      expect(straightenTerminalJogs(pts, node, far)).toEqual(pts);
    });

    it('leaves a step that reverses direction', () => {
      // The route doubles back after the step, so this is a turn, not a jog.
      const pts: P[] = [
        { x: 193, y: 116 },
        { x: 218, y: 116 },
        { x: 218, y: 119 },
        { x: 100, y: 119 },
      ];

      expect(straightenTerminalJogs(pts, node, far)).toEqual(pts);
    });

    it('refuses to move a terminal off the node border', () => {
      // y=145 is past the bottom of the border span, so collapsing here would
      // detach the edge from the node.
      const pts: P[] = [
        { x: 193, y: 141 },
        { x: 218, y: 141 },
        { x: 218, y: 145 },
        { x: 315, y: 145 },
      ];

      expect(straightenTerminalJogs(pts, node, far)).toEqual(pts);
    });

    it('collapses the step at the far end too', () => {
      // The start side deliberately opens with an 80px turn so it does not
      // match the pattern — on a four-point route the same four points serve
      // both ends, and the start pass would consume the step first.
      const target: RectLike = { x: 600, y: 198, width: 60, height: 40 };
      const pts: P[] = [
        { x: 193, y: 119.5 },
        { x: 400, y: 119.5 },
        { x: 400, y: 200 },
        { x: 560, y: 200 },
        { x: 560, y: 196.75 },
        { x: 570, y: 196.75 },
      ];

      expect(straightenTerminalJogs(pts, node, target)).toEqual([
        { x: 193, y: 119.5 },
        { x: 400, y: 119.5 },
        { x: 400, y: 200 },
        { x: 560, y: 200 },
        { x: 570, y: 200 },
      ]);
    });

    it('leaves a route with nothing to collapse', () => {
      const pts: P[] = [
        { x: 193, y: 120 },
        { x: 315, y: 120 },
      ];

      expect(straightenTerminalJogs(pts, node, far)).toEqual(pts);
    });
  });
});
