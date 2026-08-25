/**
 * Where each edge label goes.
 *
 * HOLA's own `placeEdgeLabels` puts a label at the midpoint of its route's longest
 * axis-aligned run and slides it along that run when it collides with a label
 * already placed. That is the right policy — a label is an annotation, positioned
 * after routing, never allowed to have influenced the layout (guide §3.3) — and the
 * midpoint of the longest run is the right first guess. What it cannot see is
 * everything else in the drawing, and two of those matter enough to be worth a
 * pass of its own:
 *
 *   - **a crossing.** A label sitting where two edges cross belongs, as far as a
 *     reader can tell, to either of them. That is the one collision that changes
 *     what the diagram *says* rather than just how it looks, so a crossing is
 *     avoided outright wherever the label's own route offers anywhere else to go;
 *   - **nodes and other edges.** A label over a node box hides it; a label over a
 *     foreign route reads as belonging to that route.
 *
 * So the same first guess is kept and the search around it widened: the label may
 * sit anywhere along *any* axis-aligned run of its own route, sampled from the
 * middle outwards. It is never moved off the line — a label is read as belonging to
 * the edge it sits on, and its own background masks the line underneath, so stepping
 * aside far enough to clear a wide label would only detach it from the edge it
 * names. Each candidate is scored, and the scores are ordered so that the things a
 * reader could *misread* outrank the things that merely look untidy. Labels are
 * placed largest first, because a large label has the fewest places it can go.
 *
 * Nothing here moves a node or a route. If every candidate is bad the least bad one
 * is used, so a label always lands somewhere on its own edge.
 */

import type { Point } from '../../../types.js';
import type { Bounds } from '../hola-faithful/model.js';
import { rectsOverlap } from '../hola-faithful/model.js';
import type { GridAttachedOptions } from './options.js';

export interface LabelRequest {
  originalEdgeId: string;
  width: number;
  height: number;
  /** The route this label belongs to. */
  route: Point[];
}

export interface PlacedLabel {
  originalEdgeId: string;
  x: number;
  y: number;
}

/** One straight piece of a drawn edge. */
export interface RouteSegment {
  edgeId: string;
  a: Point;
  b: Point;
}

export interface LabelObstacles {
  /** Every node box in the drawing. */
  nodes: Bounds[];
  /** Every straight piece of every drawn edge. */
  segments: RouteSegment[];
}

/** Fractions along a run to try, midpoint first then alternating outwards. */
const FRACTIONS = [0.5, 0.38, 0.62, 0.26, 0.74, 0.15, 0.85];

/**
 * Costs, in the order a reader would care about them. Each tier is far enough above
 * the next that a candidate never trades a worse fault for a lighter one.
 */
const COST_ON_NODE = 1e6;
/**
 * Sitting *near* a node rather than on it. A separate, much smaller cost than
 * covering one: on a short edge the label may be wider than the gap between the two
 * nodes it runs between, and then no position clears them both. Charging the two the
 * same would let a candidate that genuinely covers a node look as good as one that
 * merely crowds it — and the tie-break would then slide the label into the node.
 */
const COST_NEAR_NODE = 1e2;
const COST_ON_CROSSING = 1e5;
const COST_ON_LABEL = 1e4;
const COST_ON_FOREIGN_ROUTE = 1e3;
/**
 * The tie-break between candidates that are equally sound: prefer the middle of the
 * longest run. A label centred on a long straight stretch of its edge is the easiest
 * to attribute, and giving up half a pixel of run is worth the same as sitting one
 * pixel off centre.
 */
const COST_PER_PIXEL_OFF_CENTRE = 1;
const COST_PER_PIXEL_OF_RUN_GIVEN_UP = 0.5;

export function placeLabels(
  requests: LabelRequest[],
  obstacles: LabelObstacles,
  options: GridAttachedOptions
): PlacedLabel[] {
  if (requests.length === 0) {
    return [];
  }

  const crossings = findCrossings(obstacles.segments);
  const placed: PlacedLabel[] = [];
  const occupied: Bounds[] = [];

  // Largest first: a large label has the fewest places it can go, so it should
  // choose before a small one takes the room.
  const ordered = [...requests].sort((a, b) => {
    const area = b.width * b.height - a.width * a.height;
    return area !== 0 ? area : a.originalEdgeId.localeCompare(b.originalEdgeId);
  });

  for (const request of ordered) {
    const spot = choose(request, obstacles, crossings, occupied, options);
    placed.push({ originalEdgeId: request.originalEdgeId, x: spot.x, y: spot.y });
    occupied.push(boxAt(spot, request));
  }

  return placed;
}

interface Run {
  a: Point;
  b: Point;
  horizontal: boolean;
  length: number;
}

function runsOf(route: Point[]): Run[] {
  const runs: Run[] = [];
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1];
    const b = route[i];
    const horizontal = Math.abs(a.y - b.y) < 1e-6;
    const vertical = Math.abs(a.x - b.x) < 1e-6;
    if (horizontal === vertical) {
      continue;
    }
    const length = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
    if (length <= 0) {
      continue;
    }
    runs.push({ a, b, horizontal, length });
  }
  return runs.sort((first, second) => second.length - first.length);
}

function choose(
  request: LabelRequest,
  obstacles: LabelObstacles,
  crossings: Point[],
  occupied: Bounds[],
  options: GridAttachedOptions
): Point {
  const runs = runsOf(request.route);
  if (runs.length === 0) {
    return request.route[Math.floor(request.route.length / 2)] ?? { x: 0, y: 0 };
  }

  // Runs are sorted longest first, so this is both the first guess and the fallback:
  // the midpoint of the longest run, which is what HOLA would have chosen.
  const home = at(runs[0], 0.5);
  const longest = runs[0].length;

  let best: Point | undefined;
  let bestCost = Number.POSITIVE_INFINITY;

  for (const run of runs) {
    const givenUp = COST_PER_PIXEL_OF_RUN_GIVEN_UP * (longest - run.length);
    for (const fraction of FRACTIONS) {
      const point = at(run, fraction);
      const offCentre = Math.abs(fraction - 0.5) * run.length;
      const cost =
        score(point, request, obstacles, crossings, occupied, options) +
        givenUp +
        COST_PER_PIXEL_OFF_CENTRE * offCentre;
      if (cost < bestCost) {
        bestCost = cost;
        best = point;
      }
    }
  }

  return best ?? home;
}

function at(run: Run, fraction: number): Point {
  return {
    x: run.a.x + (run.b.x - run.a.x) * fraction,
    y: run.a.y + (run.b.y - run.a.y) * fraction,
  };
}

function boxAt(point: Point, request: LabelRequest): Bounds {
  return {
    minX: point.x - request.width / 2,
    maxX: point.x + request.width / 2,
    minY: point.y - request.height / 2,
    maxY: point.y + request.height / 2,
  };
}

function score(
  point: Point,
  request: LabelRequest,
  obstacles: LabelObstacles,
  crossings: Point[],
  occupied: Bounds[],
  options: GridAttachedOptions
): number {
  const box = boxAt(point, request);
  const padded = inflate(box, options.labelClearance);
  let cost = 0;

  for (const node of obstacles.nodes) {
    if (rectsOverlap(box, node)) {
      cost += COST_ON_NODE;
    } else if (rectsOverlap(padded, node)) {
      cost += COST_NEAR_NODE;
    }
  }

  // A crossing anywhere near the label is what makes it ambiguous, so the box is
  // grown by the crossing clearance before the test rather than only checked for
  // containment.
  const reach = inflate(box, options.labelCrossingClearance);
  for (const crossing of crossings) {
    if (
      crossing.x > reach.minX &&
      crossing.x < reach.maxX &&
      crossing.y > reach.minY &&
      crossing.y < reach.maxY
    ) {
      cost += COST_ON_CROSSING;
    }
  }

  for (const other of occupied) {
    if (rectsOverlap(box, other)) {
      cost += COST_ON_LABEL;
    }
  }

  for (const segment of obstacles.segments) {
    if (segment.edgeId === request.originalEdgeId) {
      continue;
    }
    if (segmentHitsBox(segment, box)) {
      cost += COST_ON_FOREIGN_ROUTE;
    }
  }

  return cost;
}

function inflate(bounds: Bounds, amount: number): Bounds {
  return {
    minX: bounds.minX - amount,
    minY: bounds.minY - amount,
    maxX: bounds.maxX + amount,
    maxY: bounds.maxY + amount,
  };
}

/** Axis-aligned segments only, which is what every drawn route is made of. */
function segmentHitsBox(segment: RouteSegment, box: Bounds): boolean {
  const lowX = Math.min(segment.a.x, segment.b.x);
  const highX = Math.max(segment.a.x, segment.b.x);
  const lowY = Math.min(segment.a.y, segment.b.y);
  const highY = Math.max(segment.a.y, segment.b.y);
  return (
    Math.min(highX, box.maxX) - Math.max(lowX, box.minX) > 0 &&
    Math.min(highY, box.maxY) - Math.max(lowY, box.minY) > 0
  );
}

/**
 * Points where two different edges cross.
 *
 * Only proper crossings count: two routes meeting at a shared node touch at its
 * boundary by construction, and a label near *that* is unambiguous — it is beside
 * the node both edges reach.
 */
function findCrossings(segments: RouteSegment[]): Point[] {
  const crossings: Point[] = [];

  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      if (segments[i].edgeId === segments[j].edgeId) {
        continue;
      }
      const hit = properCrossing(segments[i], segments[j]);
      if (hit) {
        crossings.push(hit);
      }
    }
  }

  return crossings;
}

function properCrossing(first: RouteSegment, second: RouteSegment): Point | undefined {
  const r = { x: first.b.x - first.a.x, y: first.b.y - first.a.y };
  const s = { x: second.b.x - second.a.x, y: second.b.y - second.a.y };
  const denominator = r.x * s.y - r.y * s.x;
  if (Math.abs(denominator) < 1e-9) {
    return undefined;
  }
  const d = { x: second.a.x - first.a.x, y: second.a.y - first.a.y };
  const t = (d.x * s.y - d.y * s.x) / denominator;
  const u = (d.x * r.y - d.y * r.x) / denominator;
  if (t <= 1e-6 || t >= 1 - 1e-6 || u <= 1e-6 || u >= 1 - 1e-6) {
    return undefined;
  }
  return { x: first.a.x + t * r.x, y: first.a.y + t * r.y };
}
