import { describe, expect, it } from 'vitest';
import intersect from '../../../rendering-elements/intersect/index.js';
import { clipEndpointsToNodeOutlines } from './paintShapeClip.js';
import type { ShapeClipNode, ShapeClipPoint } from './paintShapeClip.js';

/**
 * A `diamond` node exactly as `shapes/question.ts` builds it: a rhombus with
 * side-midpoint apexes, inscribed in a square box, intersected through the real
 * `intersect.polygon` (including the shape's -0.5 adjustment).
 */
function diamondNode(cx: number, cy: number, s: number): ShapeClipNode {
  const node: any = { x: cx, y: cy, width: s, height: s };
  node.intersect = (point: ShapeClipPoint) => {
    const points = [
      { x: s / 2, y: 0 },
      { x: s, y: -s / 2 },
      { x: s / 2, y: -s },
      { x: 0, y: -s / 2 },
    ];
    const res = intersect.polygon(node, points, point);
    return { x: res.x - 0.5, y: res.y - 0.5 };
  };
  return node;
}

/**
 * A `hexagon` exactly as `shapes/hexagon.ts` builds it: flat top and bottom
 * sides that DO lie on the box boundary, plus slanted left/right ends. Its
 * `intersect` carries no coordinate adjustment.
 */
function hexagonNode(cx: number, cy: number, w: number, h: number): ShapeClipNode {
  const m = h / 4;
  const node: any = { x: cx, y: cy, width: w, height: h };
  const points = [
    { x: m, y: 0 },
    { x: w - m, y: 0 },
    { x: w, y: -h / 2 },
    { x: w - m, y: -h },
    { x: m, y: -h },
    { x: 0, y: -h / 2 },
  ];
  node.intersect = (point: ShapeClipPoint) => intersect.polygon(node, points, point);
  return node;
}

/** A box-filling shape (`squareRect` and friends) — `intersect.rect`. */
function rectNode(cx: number, cy: number, w: number, h: number): ShapeClipNode {
  const node: any = { x: cx, y: cy, width: w, height: h };
  node.intersect = (point: ShapeClipPoint) => intersect.rect(node, point);
  return node;
}

/**
 * Where `p` sits relative to a rhombus inscribed in a square box: 1 is exactly on
 * the drawn face, above 1 is outside it (the visible gap), below 1 is inside.
 */
function rhombusT(p: ShapeClipPoint, cx: number, cy: number, s: number): number {
  return (Math.abs(p.x - cx) + Math.abs(p.y - cy)) / (s / 2);
}

/**
 * The pass guarantees CONTACT: a clipped point never stops outside the drawn
 * face, and never sinks more than `SAFETY_INSET` (2px) plus a rounding hair past
 * it. `question.ts` disagrees with itself by ~1px between the polygon it draws
 * and the `intersect` it installs, so exact equality is not on offer.
 */
function expectOnFace(p: ShapeClipPoint, cx: number, cy: number, s: number): void {
  const t = rhombusT(p, cx, cy, s);
  expect(t).toBeLessThanOrEqual(1);
  expect(t).toBeGreaterThan(1 - (2.5 * 2) / s);
}

describe('clipEndpointsToNodeOutlines', () => {
  // Geometry lifted from `domus/incremental-editing`: the `overlap` diamond and
  // its two left-side exit ports, which sat 57.5px and 82.2px outside the drawn
  // rhombus before this pass existed.
  const OVERLAP = { cx: 564.6, cy: 1028.8, s: 230 };

  it('pulls an off-apex port on the left side onto the rhombus face', () => {
    const node = diamondNode(OVERLAP.cx, OVERLAP.cy, OVERLAP.s);
    // Port on the box's left side, 57.5px below center; exits horizontally.
    const points = [
      { x: 449.7, y: 1086.3 },
      { x: 401.9, y: 1086.3 },
      { x: 401.9, y: 873.8 },
    ];
    const out = clipEndpointsToNodeOutlines(points, node, undefined)!;

    expect(out).not.toBe(points);
    // Before: 57.5px of empty space between the port and the drawn rhombus.
    expect(rhombusT(points[0], OVERLAP.cx, OVERLAP.cy, OVERLAP.s)).toBeCloseTo(1.5, 2);
    // After: on the face, moved ~57.5px inward, still axis-aligned with its bend.
    expectOnFace(out[0], OVERLAP.cx, OVERLAP.cy, OVERLAP.s);
    expect(out[0].x).toBeGreaterThan(449.7 + 57.5);
    expect(out[0].x).toBeLessThan(449.7 + 57.5 + 2.5);
    expect(out[0].y).toBeCloseTo(1086.3, 6);
    expect(out.slice(1)).toEqual(points.slice(1)); // interior bends untouched
  });

  it('scales the clip with the port offset (deeper port, deeper clip)', () => {
    const node = diamondNode(OVERLAP.cx, OVERLAP.cy, OVERLAP.s);
    const points = [
      { x: 449.7, y: 1111 }, // 82.2px below center
      { x: 429.7, y: 1111 },
    ];
    const out = clipEndpointsToNodeOutlines(points, node, undefined)!;
    expectOnFace(out[0], OVERLAP.cx, OVERLAP.cy, OVERLAP.s);
    expect(out[0].x).toBeGreaterThan(449.7 + 82.2);
    expect(out[0].x).toBeLessThan(449.7 + 82.2 + 2.5);
    expect(out[0].y).toBeCloseTo(1111, 6);
  });

  it('leaves an apex port alone', () => {
    const node = diamondNode(OVERLAP.cx, OVERLAP.cy, OVERLAP.s);
    // Bottom apex, entered vertically — already on the rhombus.
    const points = [
      { x: 564.6, y: 1183.8 },
      { x: 564.6, y: 1143.8 },
    ];
    expect(clipEndpointsToNodeOutlines(points, undefined, node)).toBe(points);
  });

  it('clips the end point of an edge entering a diamond off-apex', () => {
    const node = diamondNode(0, 0, 100);
    const points = [
      { x: 0, y: -200 },
      { x: 20, y: -200 },
      { x: 20, y: -50 }, // top side of the box, 20px right of the apex
    ];
    const out = clipEndpointsToNodeOutlines(points, undefined, node)!;
    expect(out[2].x).toBeCloseTo(20, 6);
    // Rhombus at dx=20 of a 100-square sits at y=-30; the clip reaches it (or a
    // hair past), never stopping short at the box side (y=-50).
    expect(out[2].y).toBeGreaterThanOrEqual(-30);
    expectOnFace(out[2], 0, 0, 100);
  });

  it('clips both terminals of a two-point edge between two diamonds', () => {
    const start = diamondNode(0, 0, 100);
    const end = diamondNode(400, 0, 100);
    const points = [
      { x: 50, y: 20 }, // right side of start, 20px below its apex
      { x: 350, y: 20 }, // left side of end, 20px below its apex
    ];
    const out = clipEndpointsToNodeOutlines(points, start, end)!;
    expectOnFace(out[0], 0, 0, 100);
    expectOnFace(out[1], 400, 0, 100);
    expect(out[0].x).toBeLessThanOrEqual(30);
    expect(out[1].x).toBeGreaterThanOrEqual(370);
    expect(out[0].y).toBeCloseTo(20, 6);
    expect(out[1].y).toBeCloseTo(20, 6);
  });

  // Regression: `life-choices`' hexagon. Its flat bottom side lies ON the box
  // boundary, so those ports were already correct — an earlier version of this
  // pass still spent the safety inset on them and pushed them 2px into the shape.
  it('leaves a port alone where the outline already lies on the box side', () => {
    const node = hexagonNode(0, 0, 200, 80);
    const points = [
      { x: 30, y: 40 }, // bottom side, inside the flat run (m = 20 from each end)
      { x: 30, y: 200 },
    ];
    expect(clipEndpointsToNodeOutlines(points, node, undefined)).toBe(points);
  });

  it('still clips a hexagon port that sits on a slanted end', () => {
    const node = hexagonNode(0, 0, 200, 80);
    // Left box side, 30px above center: the hexagon's left point is at mid-height,
    // so the outline there is well inside the box side.
    const points = [
      { x: -100, y: -30 },
      { x: -300, y: -30 },
    ];
    const out = clipEndpointsToNodeOutlines(points, node, undefined)!;
    expect(out).not.toBe(points);
    expect(out[0].x).toBeGreaterThan(-100);
    expect(out[0].y).toBeCloseTo(-30, 6);
  });

  it('is a no-op for box-filling shapes', () => {
    const node = rectNode(0, 0, 200, 100);
    const points = [
      { x: -100, y: 30 }, // on the left side, well off center — but the rect fills its box
      { x: -300, y: 30 },
    ];
    expect(clipEndpointsToNodeOutlines(points, node, undefined)).toBe(points);
  });

  it('does not touch the caller’s polyline', () => {
    const node = diamondNode(0, 0, 100);
    const points = [
      { x: -50, y: 20 },
      { x: -200, y: 20 },
    ];
    const before = JSON.stringify(points);
    clipEndpointsToNodeOutlines(points, node, undefined);
    expect(JSON.stringify(points)).toBe(before);
  });

  it('skips non-axis-aligned terminal segments', () => {
    const node = diamondNode(0, 0, 100);
    const points = [
      { x: -50, y: 20 },
      { x: -120, y: 60 },
    ];
    expect(clipEndpointsToNodeOutlines(points, node, undefined)).toBe(points);
  });

  it('skips groups, missing intersect and degenerate boxes', () => {
    const group = { ...diamondNode(0, 0, 100), isGroup: true };
    const noIntersect: ShapeClipNode = { x: 0, y: 0, width: 100, height: 100 };
    const zeroBox = { ...diamondNode(0, 0, 100), width: 0, height: 0 };
    const points = [
      { x: -50, y: 20 },
      { x: -200, y: 20 },
    ];
    for (const node of [group, noIntersect, zeroBox]) {
      expect(clipEndpointsToNodeOutlines(points, node, undefined)).toBe(points);
    }
  });

  it('survives a throwing intersect and short polylines', () => {
    const boom: ShapeClipNode = {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      intersect: () => {
        throw new Error('no shape yet');
      },
    };
    const points = [
      { x: -50, y: 20 },
      { x: -200, y: 20 },
    ];
    expect(clipEndpointsToNodeOutlines(points, boom, undefined)).toBe(points);
    expect(clipEndpointsToNodeOutlines([{ x: 1, y: 1 }], boom, boom)).toHaveLength(1);
    expect(clipEndpointsToNodeOutlines(undefined, boom, boom)).toBeUndefined();
  });
});
