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

    it('declines a diagonal departure rather than forcing it onto an axis', () => {
      // The bisection walks one axis holding the other fixed, so a diagonal has
      // no axis to preserve. Forcing it onto the dominant one would attach at a
      // point the edge does not pass through — reintroducing exactly the offset
      // this function exists to remove — so the caller's centre-ray path is the
      // honest fallback.
      const port = { x: 129.48, y: 454.87 };

      expect(outlineAttachPoint(diamond, bounds, port, { x: 144.48, y: 469.87 })).toBe(null);
      // Dominant-x and dominant-y diagonals are both declined, not just the 45°.
      expect(outlineAttachPoint(diamond, bounds, port, { x: 174.48, y: 459.87 })).toBe(null);
      expect(outlineAttachPoint(diamond, bounds, port, { x: 134.48, y: 494.87 })).toBe(null);
    });

    it('still accepts a departure carrying floating-point dust', () => {
      // ELK emits exact orthogonal stubs, but the numbers reaching here have been
      // through arithmetic. A sub-nanometre minor component is not a diagonal.
      const port = { x: 129.48, y: 454.87 };

      expect(outlineAttachPoint(diamond, bounds, port, { x: 144.48, y: 454.87 + 1e-9 })).not.toBe(
        null
      );
    });
  });

  describe('straightenTerminalJogs', () => {
    // Every case keeps BOTH ports exactly where they are: the step is removed by
    // moving the channel onto the port's row, never the other way round. Moving
    // a port slides the attachment along the node border and leaves a node whose
    // other edges are still evenly spread looking lopsided.

    it('moves the channel onto the port row, leaving the port alone', () => {
      // Leaves the port at y=116.25, steps 3.25 down onto the channel, runs on,
      // then turns. The run moves up to the port instead.
      const pts: P[] = [
        { x: 193, y: 116.25 },
        { x: 218, y: 116.25 },
        { x: 218, y: 119.5 },
        { x: 400, y: 119.5 },
        { x: 400, y: 300 },
      ];

      expect(straightenTerminalJogs(pts)).toEqual([
        { x: 193, y: 116.25 },
        { x: 400, y: 116.25 },
        { x: 400, y: 300 },
      ]);
    });

    it('moves a whole multi-segment run, not just its first leg', () => {
      // The channel carries on past the first bend. Shifting only part of it
      // would leave a diagonal where the moved and unmoved halves meet.
      const pts: P[] = [
        { x: 193, y: 116.25 },
        { x: 218, y: 116.25 },
        { x: 218, y: 119.5 },
        { x: 300, y: 119.5 },
        { x: 400, y: 119.5 },
        { x: 400, y: 300 },
      ];

      expect(straightenTerminalJogs(pts)).toEqual([
        { x: 193, y: 116.25 },
        { x: 300, y: 116.25 },
        { x: 400, y: 116.25 },
        { x: 400, y: 300 },
      ]);
    });

    it('handles a sub-pixel step', () => {
      // ELK routinely leaves under a pixel between port row and channel row. It
      // still paints as two rounded corners stacked on each other.
      const pts: P[] = [
        { x: 193, y: 116.5 },
        { x: 218, y: 116.5 },
        { x: 218, y: 117.358 },
        { x: 400, y: 117.358 },
        { x: 400, y: 300 },
      ];

      expect(straightenTerminalJogs(pts)).toEqual([
        { x: 193, y: 116.5 },
        { x: 400, y: 116.5 },
        { x: 400, y: 300 },
      ]);
    });

    it('refuses when the run ends at the far port', () => {
      // Moving this run would drag the other end's port — the very thing the
      // rewrite avoids — so the edge is left exactly as routed.
      const pts: P[] = [
        { x: 193, y: 116.25 },
        { x: 218, y: 116.25 },
        { x: 218, y: 119.5 },
        { x: 300, y: 119.5 },
        { x: 400, y: 119.5 },
      ];

      expect(straightenTerminalJogs(pts)).toEqual(pts);
    });

    it('leaves a step too large to be a port connector', () => {
      const pts: P[] = [
        { x: 193, y: 100 },
        { x: 218, y: 100 },
        { x: 218, y: 140 },
        { x: 400, y: 140 },
        { x: 400, y: 300 },
      ];

      expect(straightenTerminalJogs(pts)).toEqual(pts);
    });

    it('leaves a step that turns too far from the node', () => {
      // Small step, but the corner is 120 out: a routing decision, not the
      // port-to-channel connector.
      const pts: P[] = [
        { x: 193, y: 116.25 },
        { x: 313, y: 116.25 },
        { x: 313, y: 119.5 },
        { x: 415, y: 119.5 },
        { x: 415, y: 300 },
      ];

      expect(straightenTerminalJogs(pts)).toEqual(pts);
    });

    it('leaves a step that reverses direction', () => {
      const pts: P[] = [
        { x: 193, y: 116 },
        { x: 218, y: 116 },
        { x: 218, y: 119 },
        { x: 100, y: 119 },
        { x: 100, y: 300 },
      ];

      expect(straightenTerminalJogs(pts)).toEqual(pts);
    });

    it('leaves a route with nothing to collapse', () => {
      const pts: P[] = [
        { x: 193, y: 120 },
        { x: 315, y: 120 },
      ];

      expect(straightenTerminalJogs(pts)).toEqual(pts);
    });
  });
});
