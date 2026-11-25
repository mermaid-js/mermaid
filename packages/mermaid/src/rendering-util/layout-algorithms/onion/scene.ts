import { normalOf, type Context, type LabeledEdge } from './context.js';
import {
  boundsOf,
  boxTouchesBounds,
  boxIntersectsConvex,
  boxesOverlap,
  clipSegmentToBox,
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

/** The box a slanted shape is actually drawn in where an edge meets it. */
function narrowed(ctx: Context, id: string, box: Box): Box {
  return { ...box, width: box.width - 2 * (ctx.slantInset.get(id) ?? 0) };
}

/** Part of the edge between the two shapes: where the painter draws it and anchors its label. */
export function edgeSegment(ctx: Context, edge: LabeledEdge, src: Box, dst: Box): EdgeSegment {
  const a = { x: src.x, y: src.y };
  const b = { x: dst.x, y: dst.y };
  const n = normalOf(a, b);
  const a2 = { x: a.x + n.x * edge.shift, y: a.y + n.y * edge.shift };
  const b2 = { x: b.x + n.x * edge.shift, y: b.y + n.y * edge.shift };
  const leaving = clipSegmentToBox(a2, b2, narrowed(ctx, edge.start, src));
  const entering = clipSegmentToBox(a2, b2, narrowed(ctx, edge.end, dst));
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

/** First clear position along the edge for its label, or the one with the fewest overlaps. */
function bestLabelSpot(
  label: { width: number; height: number },
  seg: EdgeSegment,
  nodes: readonly GrownNode[],
  frames: readonly FrameShape[],
  placed: readonly Box[]
): { box: Box; hits: number } {
  let bestBox: Box | undefined;
  let bestHits = Number.POSITIVE_INFINITY;
  for (const step of LABEL_STEPS) {
    const at = pointAlong(seg.from, seg.to, step);
    const box: Box = { x: at.x, y: at.y, width: label.width, height: label.height };
    const padded = paddedLabel(box, seg);
    let hits = 0;
    for (const n of nodes) {
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
}

/**
 * Counts overlaps between nodes, frames, titles, labels and edges, and slides every label along
 * its edge to the first spot that clears them (centre first, then outwards).
 */
export function scan(ctx: Context, scene: Scene, detailed: boolean): ScanResult {
  let count = 0;
  const report: string[] = [];
  const note = (text: () => string) => {
    count++;
    if (detailed) {
      report.push(text());
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
        note(() => `node ${idA} x node ${entries[j][0]}`);
      }
    }
    for (const frame of scene.frames) {
      if (
        !frame.members.has(idA) &&
        boxTouchesBounds(grownA, frame.bounds) &&
        boxIntersectsConvex(grownA, frame.poly)
      ) {
        note(() => `node ${idA} x frame ${frame.id}`);
      }
      if (boxesOverlap(grownA, frame.title)) {
        note(() => `node ${idA} x title ${frame.id}`);
      }
    }
  }

  const labels = new Map<string, Box>();
  const placed: Box[] = [];
  const quarter = NODE_GAP / 4;
  const grownNodes = entries.map(([id, b]) => ({ id, box: inflateBox(b, quarter) }));
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
        note(() => `edge ${edge.id} through node ${id}`);
      }
    }
    for (const frame of scene.frames) {
      if (segmentHitsBox(seg.from, seg.to, frame.title)) {
        note(() => `edge ${edge.id} through title ${frame.id}`);
      }
    }
    if (!edge.label) {
      continue;
    }
    const spot = bestLabelSpot(edge.label, seg, grownNodes, scene.frames, placed);
    const bestBox = spot.box;
    const bestHits = spot.hits;
    labels.set(edge.id, bestBox);
    placed.push(paddedLabel(bestBox, seg));
    for (let h = 0; h < bestHits; h++) {
      note(() => `label ${edge.id} blocked`);
    }
  }
  return { count, labels, report };
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
      const spot = bestLabelSpot(edge.label, seg, nodes, scene.frames, taken);
      count += spot.hits;
      taken.push(paddedLabel(spot.box, seg));
    }
  }
  return count;
}
