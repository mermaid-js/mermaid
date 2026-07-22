/**
 * Line jumps ("hops") for edge crossings.
 *
 * Detects true segment crossings between edge polylines and rewrites the SVG
 * path of the later edge so the crossing renders as either a small arc
 * (`jumpStyle: 'arc'`) or a visible break (`jumpStyle: 'gap'`).
 *
 * The pure functions (`findEdgeIntersections`, `processEdgesWithJumps`) are
 * DOM-free. The DOM-side `applyLineJumpsToSvg` helper reads geometry from
 * layout data and leaves curved (non-`M`/`L`) rendered paths untouched.
 */

import type { D3Selection } from '../../types.js';
import { markerOffsets } from '../../utils/lineWithOffset.js';

/** Radius used by edges.js' generateRoundedPath. Kept in sync so rewritten
 * paths look like the originals at bends. */
const ROUNDED_CORNER_RADIUS = 5;

/** Skip the jump if its clamped radius falls below this — avoids invisible
 * zero-length arcs on very crowded paths. */
const CORNER_EPSILON = 1e-5;

export interface Point {
  x: number;
  y: number;
}

export interface EdgeGeom {
  id: string;
  points: Point[];
  /**
   * Optional curve hint matching `edge.curve` from the rendering layer.
   * When set, line jumps are only applied for orthogonal-friendly curves
   * (`'linear'`, `'rounded'`, `'step'`, `'stepBefore'`, `'stepAfter'`, or
   * undefined). Other curves (basis, monotoneX, …) are skipped to avoid
   * corrupting smoothed geometry.
   */
  curve?: string;
  /** Arrow type at the start (first point) — used to apply marker offset so
   * the rewritten path's endpoint matches the original rendered geometry and
   * the arrow marker orients correctly. */
  arrowTypeStart?: string;
  /** Arrow type at the end (last point). */
  arrowTypeEnd?: string;
}

export interface LineJumpConfig {
  enabled: boolean;
  jumpRadius: number;
  jumpStyle: 'arc' | 'gap';
}

export interface Crossing {
  jumpEdgeId: string;
  otherEdgeId: string;
  /** Index of the segment within the jumping edge's polyline. */
  segIndex: number;
  /** Position of the crossing along the jumping edge's segment, 0..1. */
  t: number;
  point: Point;
}

const ENDPOINT_EPSILON = 1e-6;

interface Segment {
  a: Point;
  b: Point;
}

function buildSegmentList(points: Point[]): Segment[] {
  const segments: Segment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    segments.push({ a: points[i], b: points[i + 1] });
  }
  return segments;
}

interface SegmentIntersection {
  point: Point;
  tA: number;
  tB: number;
}

/**
 * Parametric segment-segment intersection. Returns null if the segments are
 * parallel, do not intersect, or only meet at one of their endpoints (within
 * `ENDPOINT_EPSILON`). Endpoint rejection prevents normal joins, T-junctions,
 * and shared-start edges from being treated as crossings.
 */
function segmentIntersection(
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point
): SegmentIntersection | null {
  const dxA = a2.x - a1.x;
  const dyA = a2.y - a1.y;
  const dxB = b2.x - b1.x;
  const dyB = b2.y - b1.y;

  const denom = dxA * dyB - dyA * dxB;
  if (denom === 0) {
    return null;
  }

  const dx = b1.x - a1.x;
  const dy = b1.y - a1.y;

  const tA = (dx * dyB - dy * dxB) / denom;
  const tB = (dx * dyA - dy * dxA) / denom;

  if (
    tA <= ENDPOINT_EPSILON ||
    tA >= 1 - ENDPOINT_EPSILON ||
    tB <= ENDPOINT_EPSILON ||
    tB >= 1 - ENDPOINT_EPSILON
  ) {
    return null;
  }

  return {
    point: { x: a1.x + tA * dxA, y: a1.y + tA * dyA },
    tA,
    tB,
  };
}

/** True if the segment is horizontally dominant (abs(dx) is at least abs(dy)).
 * Ties go to horizontal to keep pure-diagonal edges grouped with the
 * horizontal bucket — they don't occur in orthogonal layouts anyway. */
function isHorizontalSeg(seg: Segment): boolean {
  return Math.abs(seg.b.x - seg.a.x) >= Math.abs(seg.b.y - seg.a.y);
}

export function findEdgeIntersections(edges: EdgeGeom[]): Crossing[] {
  const crossings: Crossing[] = [];

  for (let i = 0; i < edges.length; i++) {
    const edgeA = edges[i];
    const segmentsA = buildSegmentList(edgeA.points);
    for (let j = i + 1; j < edges.length; j++) {
      const edgeB = edges[j];
      const segmentsB = buildSegmentList(edgeB.points);

      for (const [si, segA] of segmentsA.entries()) {
        for (const [sj, segB] of segmentsB.entries()) {
          const hit = segmentIntersection(segA.a, segA.b, segB.a, segB.b);
          if (!hit) {
            continue;
          }

          // Orthogonal-orientation rule: when one segment is horizontal-
          // dominant and the other vertical-dominant, the HORIZONTAL one
          // gets the jump (classic line-hop convention — arcs arch upward
          // over the vertical line beneath). Falls back to later-index-wins
          // when both segments share an orientation.
          const aHoriz = isHorizontalSeg(segA);
          const bHoriz = isHorizontalSeg(segB);
          const orthogonalPair = aHoriz !== bHoriz;
          const jumpOnA = orthogonalPair ? aHoriz : false;

          if (jumpOnA) {
            crossings.push({
              jumpEdgeId: edgeA.id,
              otherEdgeId: edgeB.id,
              segIndex: si,
              t: hit.tA,
              point: hit.point,
            });
          } else {
            crossings.push({
              jumpEdgeId: edgeB.id,
              otherEdgeId: edgeA.id,
              segIndex: sj,
              t: hit.tB,
              point: hit.point,
            });
          }
        }
      }
    }
  }

  return crossings;
}

function fmt(n: number): string {
  // Strip trailing zeros so "5.00" → "5"; keep up to 3 decimals otherwise.
  const rounded = Math.round(n * 1000) / 1000;
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded}`;
}

function pointToString(p: Point): string {
  return `${fmt(p.x)},${fmt(p.y)}`;
}

/**
 * Determines the SVG arc sweep flag so the jump bumps in the conventional
 * direction: horizontal segments bump up (smaller y in SVG), vertical segments
 * bump right (larger x).
 */
function getArcSweepFlag(seg: Segment): 0 | 1 {
  const dx = seg.b.x - seg.a.x;
  const dy = seg.b.y - seg.a.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    // Horizontal-dominant: bump up (smaller y in SVG's y-down frame).
    // Going +x → sweep=1 sweeps through increasing angle 180°→270°→0°,
    //   which passes through (mid, y-r) = up.
    // Going -x → sweep=0 (reverse direction) also lands the bump above.
    return dx >= 0 ? 1 : 0;
  }
  // Vertical-dominant: bump right (positive x).
  // Going +y → sweep=1; going -y → sweep=0.
  return dy >= 0 ? 1 : 0;
}

interface JumpOnSegment {
  t: number;
  point: Point;
  /** Distance from segment start along the segment direction. */
  d: number;
  /** Effective radius after boundary + adjacency clamping. */
  r: number;
}

const MIN_JUMP_RADIUS = 1e-3;

/**
 * Shifts the first/last point inward along the edge direction by the amount
 * required for their arrow markers, matching `applyMarkerOffsetsToPoints` in
 * edges.js so the rewritten path ends exactly where the original did.
 */
function applyMarkerOffsets(points: Point[], edge: EdgeGeom): Point[] {
  if (points.length < 2) {
    return points.map((p) => ({ ...p }));
  }
  const out = points.map((p) => ({ ...p }));
  const startOff =
    edge.arrowTypeStart && markerOffsets[edge.arrowTypeStart as keyof typeof markerOffsets];
  if (startOff) {
    const a = points[0];
    const b = points[1];
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    out[0].x = a.x + startOff * Math.cos(ang);
    out[0].y = a.y + startOff * Math.sin(ang);
  }
  const endOff =
    edge.arrowTypeEnd && markerOffsets[edge.arrowTypeEnd as keyof typeof markerOffsets];
  if (endOff) {
    const n = points.length;
    const a = points[n - 2];
    const b = points[n - 1];
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    out[n - 1].x = b.x - endOff * Math.cos(ang);
    out[n - 1].y = b.y - endOff * Math.sin(ang);
  }
  return out;
}

/**
 * Emits the arc or gap command for a crossing, in the segment's direction.
 * Returns the part strings; caller inserts them in order.
 */
function emitJump(
  jump: JumpOnSegment,
  ux: number,
  uy: number,
  sweep: 0 | 1,
  style: 'arc' | 'gap'
): string[] {
  const cx = jump.point.x;
  const cy = jump.point.y;
  const pre = { x: cx - ux * jump.r, y: cy - uy * jump.r };
  const post = { x: cx + ux * jump.r, y: cy + uy * jump.r };
  const out = [`L${pointToString(pre)}`];
  if (style === 'arc') {
    out.push(`A${fmt(jump.r)},${fmt(jump.r)} 0 0 ${sweep} ${pointToString(post)}`);
  } else {
    out.push(`M${pointToString(post)}`);
  }
  return out;
}

/**
 * Mirrors the corner-rounding logic of `generateRoundedPath` in edges.js:
 * given a bend at `curr` between segments `prev→curr` and `curr→next`,
 * computes (startX, startY) just before curr on the incoming segment and
 * (endX, endY) just after curr on the outgoing segment, plus the Q control
 * point (which is curr itself). Returns `null` if the angle is degenerate
 * and the caller should just emit a straight `L curr`.
 */
interface RoundedCorner {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  ctrlX: number;
  ctrlY: number;
  /** How much the start of the rounded corner eats into the incoming segment. */
  cutLen: number;
}
function computeRoundedCorner(
  prev: Point,
  curr: Point,
  next: Point,
  radius: number
): RoundedCorner | null {
  const dx1 = curr.x - prev.x;
  const dy1 = curr.y - prev.y;
  const dx2 = next.x - curr.x;
  const dy2 = next.y - curr.y;
  const len1 = Math.hypot(dx1, dy1);
  const len2 = Math.hypot(dx2, dy2);
  if (len1 < CORNER_EPSILON || len2 < CORNER_EPSILON) {
    return null;
  }
  const nx1 = dx1 / len1;
  const ny1 = dy1 / len1;
  const nx2 = dx2 / len2;
  const ny2 = dy2 / len2;
  const dot = nx1 * nx2 + ny1 * ny2;
  const clamped = Math.max(-1, Math.min(1, dot));
  const angle = Math.acos(clamped);
  if (angle < CORNER_EPSILON || Math.abs(Math.PI - angle) < CORNER_EPSILON) {
    return null;
  }
  const cutLen = Math.min(radius / Math.sin(angle / 2), len1 / 2, len2 / 2);
  return {
    startX: curr.x - nx1 * cutLen,
    startY: curr.y - ny1 * cutLen,
    endX: curr.x + nx2 * cutLen,
    endY: curr.y + ny2 * cutLen,
    ctrlX: curr.x,
    ctrlY: curr.y,
    cutLen,
  };
}

function rewriteEdgePath(edge: EdgeGeom, jumps: Crossing[], config: LineJumpConfig): string {
  const rawPoints = edge.points;
  if (rawPoints.length < 2) {
    return '';
  }

  // Match edges.js: shift the first/last point inward so arrow markers line up.
  const points = applyMarkerOffsets(rawPoints, edge);
  const rounded = edge.curve === 'rounded';

  // Jumps are indexed into the ORIGINAL (un-offset) segment list. For mid-
  // segments (i > 0 and i < n-2) the offsets don't change anything, and for
  // the first/last segment the shift is tiny compared to jump radius so
  // reusing the same (segIndex, t) is fine.
  const segments = buildSegmentList(points);
  const bySeg = new Map<number, JumpOnSegment[]>();
  for (const j of jumps) {
    const seg = segments[j.segIndex];
    if (!seg) {
      continue;
    }
    const segLen = Math.hypot(seg.b.x - seg.a.x, seg.b.y - seg.a.y);
    const list = bySeg.get(j.segIndex) ?? [];
    list.push({
      t: j.t,
      point: j.point,
      d: j.t * segLen,
      r: config.jumpRadius,
    });
    bySeg.set(j.segIndex, list);
  }

  const parts: string[] = [`M${pointToString(points[0])}`];
  // Running cursor along the current segment measured from seg.a.
  // Consumed at the front by the previous corner's cutLen (for rounded) and
  // after that by mid-segment jumps.
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const segLen = Math.hypot(seg.b.x - seg.a.x, seg.b.y - seg.a.y);
    const ux = segLen === 0 ? 0 : (seg.b.x - seg.a.x) / segLen;
    const uy = segLen === 0 ? 0 : (seg.b.y - seg.a.y) / segLen;
    const sweep = getArcSweepFlag(seg);

    // How much of the front of this segment was consumed by the previous
    // corner's Q end-point (endX,endY). Default 0.
    let segStartConsumed = 0;
    if (rounded && i > 0) {
      const corner = computeRoundedCorner(
        points[i - 1],
        points[i],
        points[i + 1] ?? points[i],
        ROUNDED_CORNER_RADIUS
      );
      if (corner) {
        segStartConsumed = corner.cutLen;
      }
    }

    // Rounded: if there's a next corner ahead, we stop short of it by cutLen.
    let segEndStop = segLen;
    let upcomingCorner: RoundedCorner | null = null;
    if (rounded && i < segments.length - 1) {
      upcomingCorner = computeRoundedCorner(
        points[i],
        points[i + 1],
        points[i + 2] ?? points[i + 1],
        ROUNDED_CORNER_RADIUS
      );
      if (upcomingCorner) {
        segEndStop = segLen - upcomingCorner.cutLen;
      }
    }

    // Jumps clamped so they don't overlap corners at either end of the
    // segment or each other.
    const segJumps = [...(bySeg.get(i) ?? [])].sort((a, b) => a.t - b.t);
    for (const j of segJumps) {
      j.r = Math.min(j.r, j.d - segStartConsumed, segEndStop - j.d);
    }
    for (let k = 0; k < segJumps.length - 1; k++) {
      const gap = segJumps[k + 1].d - segJumps[k].d;
      if (segJumps[k].r + segJumps[k + 1].r > gap) {
        const half = gap / 2;
        segJumps[k].r = Math.min(segJumps[k].r, half);
        segJumps[k + 1].r = Math.min(segJumps[k + 1].r, half);
      }
    }

    for (const j of segJumps) {
      if (j.r < MIN_JUMP_RADIUS) {
        continue;
      }
      parts.push(...emitJump(j, ux, uy, sweep, config.jumpStyle));
    }

    // End of segment: either a straight L to seg.b (last segment or linear),
    // or a Q-corner into seg.b's neighborhood (rounded, middle).
    if (rounded && upcomingCorner) {
      parts.push(`L${fmt(upcomingCorner.startX)},${fmt(upcomingCorner.startY)}`);
      parts.push(
        `Q${fmt(upcomingCorner.ctrlX)},${fmt(upcomingCorner.ctrlY)} ${fmt(upcomingCorner.endX)},${fmt(upcomingCorner.endY)}`
      );
    } else {
      parts.push(`L${pointToString(seg.b)}`);
    }
  }

  return parts.join(' ');
}

function plainPath(points: Point[]): string {
  if (points.length === 0) {
    return '';
  }
  const parts = [`M${pointToString(points[0])}`];
  for (let i = 1; i < points.length; i++) {
    parts.push(`L${pointToString(points[i])}`);
  }
  return parts.join(' ');
}

export function processEdgesWithJumps(
  edges: EdgeGeom[],
  config: LineJumpConfig
): Map<string, string> {
  const result = new Map<string, string>();

  if (!config.enabled) {
    for (const edge of edges) {
      result.set(edge.id, plainPath(edge.points));
    }
    return result;
  }

  const crossings = findEdgeIntersections(edges);
  const jumpsByEdge = new Map<string, Crossing[]>();
  for (const c of crossings) {
    const list = jumpsByEdge.get(c.jumpEdgeId) ?? [];
    list.push(c);
    jumpsByEdge.set(c.jumpEdgeId, list);
  }

  for (const edge of edges) {
    const jumps = jumpsByEdge.get(edge.id);
    if (!jumps || jumps.length === 0) {
      result.set(edge.id, plainPath(edge.points));
    } else {
      result.set(edge.id, rewriteEdgePath(edge, jumps, config));
    }
  }

  return result;
}

/**
 * Returns true iff the SVG path `d` is a straight-line path — only `M`/`L`/`m`/`l`
 * move/line commands plus their numeric coordinates (digits, sign, decimal point,
 * scientific-notation `e`, and `,`/space separators). Curved paths are skipped by
 * the caller.
 */
export function isStraightPath(d: string): boolean {
  return /^[\d\s+,.LMelm-]*$/.test(d);
}

/**
 * Returns true iff the named curve produces orthogonal-friendly segments that
 * can be safely re-emitted with line jumps. Includes `'rounded'` even though
 * its rendered `d` contains `Q` corner-rounding commands — when an edge with
 * a jump is rewritten the corner rounding is dropped in exchange for visible
 * arc hops at crossings, which is the desired trade-off.
 */
export function curveSupportsLineHops(curve: string | undefined): boolean {
  if (!curve) {
    return true;
  }
  return (
    curve === 'linear' ||
    curve === 'rounded' ||
    curve === 'step' ||
    curve === 'stepBefore' ||
    curve === 'stepAfter'
  );
}

/**
 * Decodes the `data-points` attribute set by edges.js at render time. This
 * gives us the exact point list edges.js used to emit the rendered path —
 * i.e. after node-boundary `intersect()` clipping and any orthogonalization,
 * but BEFORE `applyMarkerOffsetsToPoints`. Using these points guarantees the
 * rewrite's endpoints match the original rendered endpoints.
 */
function decodeDataPoints(raw: string | null): Point[] | null {
  if (!raw) {
    return null;
  }
  try {
    const json = typeof atob === 'function' ? atob(raw) : Buffer.from(raw, 'base64').toString();
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) {
      return null;
    }
    const pts: Point[] = [];
    for (const p of parsed) {
      if (p && typeof p.x === 'number' && typeof p.y === 'number') {
        pts.push({ x: p.x, y: p.y });
      }
    }
    return pts.length >= 2 ? pts : null;
  } catch {
    return null;
  }
}

/**
 * Patches the rendered SVG paths in `edgePathsGroup` for any edges that
 * cross. The true geometry is read from each path's `data-points` attribute
 * (written by edges.js at render time) so the rewrite's endpoints match
 * exactly what was originally rendered. Edges whose curve is a true
 * smoothing curve (`basis`, `monotoneX`, …) are skipped.
 */
export function applyLineJumpsToSvg(
  edgePathsGroup: D3Selection<SVGGElement>,
  edges: EdgeGeom[],
  config: LineJumpConfig
): void {
  if (!config.enabled) {
    return;
  }

  const groupNode = edgePathsGroup.node();
  if (!groupNode) {
    return;
  }

  // Build a metadata lookup so per-edge properties (curve, arrow types)
  // survive the DOM round-trip.
  const edgeMeta = new Map<string, EdgeGeom>();
  for (const e of edges) {
    edgeMeta.set(e.id, e);
  }

  // Collect geometry from each path's data-points, preferring that over the
  // incoming `edges[].points` which came from pre-render layout state.
  const renderedEdges: EdgeGeom[] = [];
  const pathById = new Map<string, Element>();
  for (const e of edges) {
    const escapedId = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(e.id) : e.id;
    const pathEl = groupNode.querySelector(`path[data-id="${escapedId}"]`);
    if (!pathEl) {
      continue;
    }
    pathById.set(e.id, pathEl);
    const decoded = decodeDataPoints(pathEl.getAttribute('data-points'));
    const points = decoded ?? e.points;
    renderedEdges.push({ ...e, points });
  }

  const crossings = findEdgeIntersections(renderedEdges);
  if (crossings.length === 0) {
    return;
  }

  const jumpsByEdge = new Map<string, Crossing[]>();
  for (const c of crossings) {
    const list = jumpsByEdge.get(c.jumpEdgeId) ?? [];
    list.push(c);
    jumpsByEdge.set(c.jumpEdgeId, list);
  }

  for (const renderedEdge of renderedEdges) {
    const jumps = jumpsByEdge.get(renderedEdge.id);
    if (!jumps || jumps.length === 0) {
      continue;
    }
    const meta = edgeMeta.get(renderedEdge.id);
    const curveHint = meta?.curve;
    if (curveHint !== undefined && !curveSupportsLineHops(curveHint)) {
      continue;
    }

    const pathEl = pathById.get(renderedEdge.id);
    if (!pathEl) {
      continue;
    }

    if (curveHint === undefined) {
      const currentD = pathEl.getAttribute('d') ?? '';
      if (!isStraightPath(currentD)) {
        continue;
      }
    }

    // Read the ORIGINAL stroke-dasharray before rewriting so we can
    // recompute it against the new total length. The `neo` look emits:
    //   stroke-dasharray: 0 <oValueS> <len - oValueS - oValueE> <oValueE>;
    // which hides the first oValueS and last oValueE pixels of the stroke
    // — this is what actually prevents the stroke from poking into the arrow
    // marker body. Our rewritten path has a different length, so without
    // updating the "on" portion the hidden tail ends up in the wrong place.
    const originalStyle = pathEl.getAttribute('style') ?? '';
    const dasharrayMatch = /stroke-dasharray\s*:\s*0\s+([\d.]+)\s+[\d.]+\s+([\d.]+)/.exec(
      originalStyle
    );
    const preservedOValueS = dasharrayMatch ? Number.parseFloat(dasharrayMatch[1]) : null;
    const preservedOValueE = dasharrayMatch ? Number.parseFloat(dasharrayMatch[2]) : null;

    const newD = rewriteEdgePath(renderedEdge, jumps, config);
    pathEl.setAttribute('d', newD);

    if (
      preservedOValueS !== null &&
      preservedOValueE !== null &&
      typeof (pathEl as SVGPathElement).getTotalLength === 'function'
    ) {
      const newLen = (pathEl as SVGPathElement).getTotalLength();
      const onLen = Math.max(0, newLen - preservedOValueS - preservedOValueE);
      const newDasharray = `0 ${preservedOValueS} ${onLen} ${preservedOValueE}`;
      const cleaned = originalStyle
        .replace(/stroke-dasharray\s*:[^;]*;?/g, `stroke-dasharray: ${newDasharray};`)
        .replace(/;\s*;+/g, ';');
      pathEl.setAttribute('style', cleaned);
    }
  }
}
