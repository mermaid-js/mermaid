import { normalOf, type Context, type LabeledEdge } from './context.js';
import {
  boundsOf,
  boxTouchesBounds,
  boxIntersectsConvex,
  boxesOverlap,
  clipSegmentToConvex,
  inflateBox,
  pointAlong,
  outlineHitsBox,
  segmentHitsBox,
  type Bounds,
  type Box,
  type Vec,
} from './geometry.js';

/** Clear space kept between two nodes, and between a node and an edge label. */
export const NODE_GAP = 16;
/** Room kept around a label along its edge: the painter pulls an edge end back by its arrowhead, which moves the label that way. */
const LABEL_ALONG_PAD = 10;
/** Room kept around a label across its edge. */
const LABEL_CROSS_PAD = 4;

/** Where along the visible part of an edge a label is tried, as a fraction of its length, centre first. */
const LABEL_STEPS = [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74, 0.18, 0.82, 0.12, 0.88] as const;

export interface Frame {
  width: number;
  height: number;
  depth: number;
  poly: Vec[];
  title: Box;
}

export interface FrameShape extends Frame {
  id: string;
  members: ReadonlySet<string>;
  bounds: Bounds;
}

export interface Scene {
  boxes: Map<string, Box>;
  frames: FrameShape[];
}

export function makeFrameShape(frame: Frame, id: string, members: ReadonlySet<string>): FrameShape {
  return { ...frame, id, members, bounds: boundsOf(frame.poly) };
}

export interface EdgeSegment {
  /** Where the edge leaves the source and enters the target, on the sideways-shifted line. */
  from: Vec;
  to: Vec;
  mid: Vec;
  /** Midpoint of the shifted centre-to-centre line: the point the painter measures label shifts from. */
  anchor: Vec;
}

/** The outline node `id` is drawn with, placed at `box`. */
export function outlineAt(ctx: Context, id: string, box: Box): Vec[] {
  return (ctx.outline.get(id) ?? []).map((p) => ({ x: box.x + p.x, y: box.y + p.y }));
}

/** Part of the edge between the two shapes: where the painter draws it and anchors its label. */
export function edgeSegment(ctx: Context, edge: LabeledEdge, src: Box, dst: Box): EdgeSegment {
  const a = { x: src.x, y: src.y };
  const b = { x: dst.x, y: dst.y };
  const n = normalOf(a, b);
  const a2 = { x: a.x + n.x * edge.shift, y: a.y + n.y * edge.shift };
  const b2 = { x: b.x + n.x * edge.shift, y: b.y + n.y * edge.shift };
  const leaving = clipSegmentToConvex(a2, b2, outlineAt(ctx, edge.start, src));
  const entering = clipSegmentToConvex(a2, b2, outlineAt(ctx, edge.end, dst));
  const t0 = leaving ? leaving[1] : 0;
  const t1 = entering ? entering[0] : 1;
  const [lo, hi] = t0 <= t1 ? [t0, t1] : [(t0 + t1) / 2, (t0 + t1) / 2];
  return {
    from: pointAlong(a2, b2, lo),
    to: pointAlong(a2, b2, hi),
    mid: pointAlong(a2, b2, (lo + hi) / 2),
    anchor: pointAlong(a2, b2, 0.5),
  };
}

/** Label box with room for the arrowhead pull-back along the edge and a thin margin across it. */
function paddedLabel(box: Box, seg: EdgeSegment): Box {
  const len = Math.hypot(seg.to.x - seg.from.x, seg.to.y - seg.from.y) || 1;
  const cos = Math.abs(seg.to.x - seg.from.x) / len;
  const sin = Math.abs(seg.to.y - seg.from.y) / len;
  return {
    x: box.x,
    y: box.y,
    width: box.width + 2 * (LABEL_CROSS_PAD + (LABEL_ALONG_PAD - LABEL_CROSS_PAD) * cos),
    height: box.height + 2 * (LABEL_CROSS_PAD + (LABEL_ALONG_PAD - LABEL_CROSS_PAD) * sin),
  };
}

interface GrownNode {
  id: string;
  box: Box;
}

/** The visible part of each edge in the scene, by edge id. */
function edgeSegments(ctx: Context, scene: Scene): Map<string, EdgeSegment> {
  const out = new Map<string, EdgeSegment>();
  for (const edge of ctx.edges) {
    const src = scene.boxes.get(edge.start);
    const dst = scene.boxes.get(edge.end);
    if (src && dst) {
      out.set(edge.id, edgeSegment(ctx, edge, src, dst));
    }
  }
  return out;
}

/**
 * First clear position along the edge for its label, or the one with the fewest overlaps:
 * with nodes, frame outlines and titles, labels already placed, and the lines of other edges.
 */
function bestLabelSpot(
  edgeId: string,
  label: { width: number; height: number },
  seg: EdgeSegment,
  nodes: readonly GrownNode[],
  frames: readonly FrameShape[],
  placed: readonly Box[],
  lines: ReadonlyMap<string, EdgeSegment>
): { box: Box; hits: number } {
  let bestBox: Box | undefined;
  let bestHits = Number.POSITIVE_INFINITY;
  // Every spot lies on this edge, and the padded label reaches at most this far from it, so
  // only nodes and lines within that distance can meet it.
  const reach = Math.max(label.width, label.height) / 2 + LABEL_ALONG_PAD;
  const minX = Math.min(seg.from.x, seg.to.x) - reach;
  const maxX = Math.max(seg.from.x, seg.to.x) + reach;
  const minY = Math.min(seg.from.y, seg.to.y) - reach;
  const maxY = Math.max(seg.from.y, seg.to.y) + reach;
  const near = (x0: number, x1: number, y0: number, y1: number) =>
    x1 >= minX && x0 <= maxX && y1 >= minY && y0 <= maxY;
  const nearLines: EdgeSegment[] = [];
  for (const [otherId, line] of lines) {
    if (
      otherId !== edgeId &&
      near(
        Math.min(line.from.x, line.to.x),
        Math.max(line.from.x, line.to.x),
        Math.min(line.from.y, line.to.y),
        Math.max(line.from.y, line.to.y)
      )
    ) {
      nearLines.push(line);
    }
  }
  const nearNodes = nodes.filter(({ box: b }) =>
    near(b.x - b.width / 2, b.x + b.width / 2, b.y - b.height / 2, b.y + b.height / 2)
  );
  for (const step of LABEL_STEPS) {
    const at = pointAlong(seg.from, seg.to, step);
    const box: Box = { x: at.x, y: at.y, width: label.width, height: label.height };
    const padded = paddedLabel(box, seg);
    let hits = 0;
    for (const n of nearNodes) {
      if (boxesOverlap(padded, n.box)) {
        hits++;
      }
    }
    for (const frame of frames) {
      if (
        boxesOverlap(padded, frame.title) ||
        (boxTouchesBounds(padded, frame.bounds) && outlineHitsBox(frame.poly, padded))
      ) {
        hits++;
      }
    }
    for (const other of placed) {
      if (boxesOverlap(padded, other)) {
        hits++;
      }
    }
    for (const line of nearLines) {
      if (segmentHitsBox(line.from, line.to, box)) {
        hits++;
      }
    }
    if (hits < bestHits) {
      bestHits = hits;
      bestBox = box;
    }
    if (hits === 0) {
      break;
    }
  }
  return { box: bestBox!, hits: bestHits };
}

export interface ScanResult {
  count: number;
  /** Chosen label box per labelled edge. */
  labels: Map<string, Box>;
  /** Each conflict named; filled only when asked for. */
  report: string[];
  /** Nodes taking part in a conflict: both ends of a blocked edge and what blocks it. */
  involved: Set<string>;
}

/**
 * Counts overlaps between nodes, frames, titles, labels and edges, and slides every label along
 * its edge to the first spot that clears them (centre first, then outwards).
 */
export function scan(ctx: Context, scene: Scene, detailed: boolean): ScanResult {
  let count = 0;
  const report: string[] = [];
  const involved = new Set<string>();
  const note = (text: () => string, ...ids: string[]) => {
    count++;
    if (detailed) {
      report.push(text());
      ids.forEach((id) => involved.add(id));
    }
  };
  const entries = [...scene.boxes];
  const half = NODE_GAP / 2;
  const grownBoxes = entries.map(([, b]) => inflateBox(b, half));
  for (let i = 0; i < entries.length; i++) {
    const idA = entries[i][0];
    const grownA = grownBoxes[i];
    for (let j = i + 1; j < entries.length; j++) {
      if (boxesOverlap(grownA, grownBoxes[j])) {
        note(() => `node ${idA} x node ${entries[j][0]}`, idA, entries[j][0]);
      }
    }
    for (const frame of scene.frames) {
      if (
        !frame.members.has(idA) &&
        boxTouchesBounds(grownA, frame.bounds) &&
        boxIntersectsConvex(grownA, frame.poly)
      ) {
        note(() => `node ${idA} x frame ${frame.id}`, idA);
      }
      if (boxesOverlap(grownA, frame.title)) {
        note(() => `node ${idA} x title ${frame.id}`, idA);
      }
    }
  }

  const labels = new Map<string, Box>();
  const placed: Box[] = [];
  const quarter = NODE_GAP / 4;
  const grownNodes = entries.map(([id, b]) => ({ id, box: inflateBox(b, quarter) }));
  const lines = edgeSegments(ctx, scene);
  for (const edge of ctx.edges) {
    const src = scene.boxes.get(edge.start);
    const dst = scene.boxes.get(edge.end);
    if (!src || !dst) {
      continue;
    }
    const seg = edgeSegment(ctx, edge, src, dst);
    for (const [id, box] of entries) {
      if (
        id !== edge.start &&
        id !== edge.end &&
        segmentHitsBox(seg.from, seg.to, inflateBox(box, 2))
      ) {
        note(() => `edge ${edge.id} through node ${id}`, edge.start, edge.end, id);
      }
    }
    for (const frame of scene.frames) {
      if (segmentHitsBox(seg.from, seg.to, frame.title)) {
        note(() => `edge ${edge.id} through title ${frame.id}`, edge.start, edge.end);
      }
      if (crossesForeignFrame(edge, seg, frame)) {
        note(() => `edge ${edge.id} through frame ${frame.id}`, edge.start, edge.end);
      }
    }
    if (!edge.label) {
      continue;
    }
    const spot = bestLabelSpot(edge.id, edge.label, seg, grownNodes, scene.frames, placed, lines);
    const bestBox = spot.box;
    const bestHits = spot.hits;
    labels.set(edge.id, bestBox);
    placed.push(paddedLabel(bestBox, seg));
    for (let h = 0; h < bestHits; h++) {
      note(() => `label ${edge.id} blocked`, edge.start, edge.end);
    }
  }
  return { count, labels, report, involved };
}

/** Deepest a segment may cut into a ring it has no end in, in px: a graze is not a crossing. */
const FRAME_GRAZE = 4;

/**
 * Whether an edge with neither end inside a ring cuts through that ring: a call between two use
 * cases that runs across the domain, say.
 */
function crossesForeignFrame(edge: LabeledEdge, seg: EdgeSegment, frame: FrameShape): boolean {
  if (frame.members.has(edge.start) || frame.members.has(edge.end)) {
    return false;
  }
  const { minX, maxX, minY, maxY } = frame.bounds;
  if (
    Math.max(seg.from.x, seg.to.x) < minX ||
    Math.min(seg.from.x, seg.to.x) > maxX ||
    Math.max(seg.from.y, seg.to.y) < minY ||
    Math.min(seg.from.y, seg.to.y) > maxY
  ) {
    return false;
  }
  const inside = clipSegmentToConvex(seg.from, seg.to, frame.poly);
  const length = Math.hypot(seg.to.x - seg.from.x, seg.to.y - seg.from.y);
  return inside !== undefined && (inside[1] - inside[0]) * length > 2 * FRAME_GRAZE;
}

export function countConflicts(ctx: Context, scene: Scene): number {
  return scan(ctx, scene, false).count;
}

/** Padded label boxes the scene settles on, for scoring one more node against them. */
export function placedLabels(ctx: Context, scene: Scene): Box[] {
  const result = scan(ctx, scene, false);
  return ctx.edges.flatMap((e) => {
    const box = result.labels.get(e.id);
    const src = scene.boxes.get(e.start);
    const dst = scene.boxes.get(e.end);
    return box && src && dst ? [paddedLabel(box, edgeSegment(ctx, e, src, dst))] : [];
  });
}

/**
 * Overlaps caused by one node that was just added to a scene that was otherwise settled:
 * what `scan` would add, without rescanning the rest. `labels` come from `placedLabels`
 * taken before the node existed.
 */
export function scanNewNode(
  ctx: Context,
  scene: Scene,
  id: string,
  labels: readonly Box[]
): number {
  const box = scene.boxes.get(id)!;
  const half = NODE_GAP / 2;
  const grown = inflateBox(box, half);
  let count = 0;
  const entries = [...scene.boxes];
  for (const [other, b] of entries) {
    if (other !== id && boxesOverlap(grown, inflateBox(b, half))) {
      count++;
    }
  }
  for (const frame of scene.frames) {
    if (
      (!frame.members.has(id) &&
        boxTouchesBounds(grown, frame.bounds) &&
        boxIntersectsConvex(grown, frame.poly)) ||
      boxesOverlap(grown, frame.title)
    ) {
      count++;
    }
  }
  const nodes = entries.map(([nid, b]) => ({ id: nid, box: inflateBox(b, NODE_GAP / 4) }));
  const taken = [...labels];
  const lines = edgeSegments(ctx, scene);
  for (const l of labels) {
    if (boxesOverlap(l, inflateBox(box, NODE_GAP / 4))) {
      count++;
    }
  }
  for (const edge of ctx.edges) {
    const src = scene.boxes.get(edge.start);
    const dst = scene.boxes.get(edge.end);
    if (!src || !dst) {
      continue;
    }
    const seg = edgeSegment(ctx, edge, src, dst);
    if (edge.start !== id && edge.end !== id) {
      if (segmentHitsBox(seg.from, seg.to, inflateBox(box, 2))) {
        count++;
      }
      continue;
    }
    for (const [oid, b] of entries) {
      if (
        oid !== edge.start &&
        oid !== edge.end &&
        segmentHitsBox(seg.from, seg.to, inflateBox(b, 2))
      ) {
        count++;
      }
    }
    for (const frame of scene.frames) {
      if (segmentHitsBox(seg.from, seg.to, frame.title)) {
        count++;
      }
    }
    if (edge.label) {
      const spot = bestLabelSpot(edge.id, edge.label, seg, nodes, scene.frames, taken, lines);
      count += spot.hits;
      taken.push(paddedLabel(spot.box, seg));
    }
  }
  return count;
}
