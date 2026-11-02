import type { P } from './geometry.js';

/** A box by its top-left corner. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The free stretch a middle segment of a route may move within, and the axis it moves along. */
export interface Channel {
  axis: 'x' | 'y';
  low: number;
  high: number;
}

/** An orthogonal route, with the channel of each segment that may move (none for the ends). */
export interface Route {
  points: P[];
  channels: (Channel | undefined)[];
}

/**
 * A link to route, in flow coordinates: the flow runs down `y`, and the target's item lies below
 * the source's item. Everything that must not be crossed is an obstacle, the two end nodes
 * included; walls are the edges of frames, which a corridor may sit between but not on.
 */
export interface RouteProblem {
  source: Box;
  target: Box;
  /** The free bands across the flow between the source's item and the target's, in order. */
  gaps: readonly (readonly [number, number])[];
  obstacles: readonly Box[];
  /** Lines a route may cross, at a cost: the links ELK drew inside frames. */
  crossable?: readonly Box[];
  walls: readonly number[];
  /** How far across the flow a corridor may lie: the extent of the arranged frames. */
  limits: readonly [number, number];
}

/** A corridor along the flow, free of obstacles over some stretch: where it runs, and its room. */
export interface Corridor {
  at: number;
  low: number;
  high: number;
}

const EPS = 0.01;
/** The shortest straight run into or out of a node: room for an arrowhead and the run before it. */
export const MIN_TERMINAL_RUN = 16;
/** How far a link keeps from an obstacle it passes the edge of. */
const CLEARANCE = 1;

const right = (box: Box) => box.x + box.width;
const bottom = (box: Box) => box.y + box.height;
const centre = (box: Box): P => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
const middle = ([low, high]: readonly [number, number]) => (low + high) / 2;

/** Does the axis-aligned segment from `a` to `b` pass through the inside of `box`? */
export function crosses(a: P, b: P, box: Box): boolean {
  const [x1, x2] = [Math.min(a.x, b.x), Math.max(a.x, b.x)];
  const [y1, y2] = [Math.min(a.y, b.y), Math.max(a.y, b.y)];
  return x1 < right(box) - EPS && x2 > box.x + EPS && y1 < bottom(box) - EPS && y2 > box.y + EPS;
}

export function isFree(points: readonly P[], obstacles: readonly Box[]): boolean {
  return points
    .slice(1)
    .every((point, index) => obstacles.every((box) => !crosses(points[index], point, box)));
}

/** Drop repeated points and the joints of straight runs. */
export function simplify(points: readonly P[]): P[] {
  return tidy({ points: [...points], channels: points.map(() => undefined) }).points;
}

export function turns(points: readonly P[]): number {
  return Math.max(simplify(points).length - 2, 0);
}

export function routeLength(points: readonly P[]): number {
  return points
    .slice(1)
    .reduce(
      (sum, point, index) =>
        sum + Math.abs(point.x - points[index].x) + Math.abs(point.y - points[index].y),
      0
    );
}

/**
 * The corridors along the flow that stay clear of every obstacle over `range`: the middle of each
 * free stretch between obstacles and walls, inside `limits`.
 */
export function corridors(
  range: readonly [number, number],
  obstacles: readonly Box[],
  walls: readonly number[],
  limits: readonly [number, number]
): Corridor[] {
  const blocking = obstacles.filter(
    (box) => box.y < range[1] - EPS && bottom(box) > range[0] + EPS
  );
  const edges = [...blocking.flatMap((box) => [box.x, right(box)]), ...walls, ...limits].filter(
    (edge) => edge >= limits[0] - EPS && edge <= limits[1] + EPS
  );
  const sorted = [...new Set(edges)].sort((a, b) => a - b);
  return sorted.slice(1).flatMap((high, index) => {
    const low = sorted[index];
    const at = (low + high) / 2;
    const clear =
      high - low > 2 * CLEARANCE && blocking.every((box) => at <= box.x || at >= right(box));
    return clear ? [{ at, low, high }] : [];
  });
}

interface Leg {
  points: P[];
  /** Where the leg meets its lane. */
  x: number;
  channels: (Channel | undefined)[];
}

/** Places along a node's side where a straight run past `range` clears every other obstacle. */
function clearSpots(
  node: Box,
  range: readonly [number, number],
  obstacles: readonly Box[],
  prefer?: number
): number[] {
  const low = node.x + MIN_TERMINAL_RUN / 2;
  const high = right(node) - MIN_TERMINAL_RUN / 2;
  const spots = [
    centre(node).x,
    ...(prefer === undefined ? [] : [prefer]),
    ...obstacles
      .filter((box) => box !== node && box.y < range[1] && bottom(box) > range[0])
      .flatMap((box) => [box.x - CLEARANCE, right(box) + CLEARANCE]),
  ];
  return spots.filter((spot) => spot >= low && spot <= high);
}

/** Leave the source downwards, or sideways into a corridor that runs down to the first lane. */
function exits(problem: RouteProblem, lane: number): Leg[] {
  const { source, obstacles, walls, limits } = problem;
  const down = clearSpots(source, [bottom(source), lane], obstacles).map((x) => ({
    points: [
      { x, y: bottom(source) },
      { x, y: lane },
    ],
    x,
    channels: [undefined],
  }));
  const sideways = corridors([centre(source).y, lane], obstacles, walls, limits).flatMap(
    (corridor) => sideLeg(source, corridor, lane, 'out')
  );
  return [...down, ...sideways];
}

/** Enter the target from above, or from the side out of a corridor that runs down from the last lane. */
function entries(problem: RouteProblem, lane: number, prefer: number): Leg[] {
  const { target, obstacles, walls, limits } = problem;
  const down = clearSpots(target, [lane, target.y], obstacles, prefer).map((x) => ({
    points: [
      { x, y: lane },
      { x, y: target.y },
    ],
    x,
    channels: [undefined],
  }));
  const sideways = corridors([lane, centre(target).y], obstacles, walls, limits)
    .flatMap((corridor) => [corridor, ...within(corridor, prefer)])
    .flatMap((corridor) => sideLeg(target, corridor, lane, 'in'));
  return [...down, ...sideways];
}

/** The corridor moved to `at`, when `at` lies inside it with room to spare on both sides. */
function within(corridor: Corridor, at: number): Corridor[] {
  const inside = at > corridor.low + CLEARANCE && at < corridor.high - CLEARANCE;
  return inside && Math.abs(at - corridor.at) > EPS ? [{ ...corridor, at }] : [];
}

/** A leg between a node's side and a lane, through a corridor beside the node. */
function sideLeg(node: Box, corridor: Corridor, lane: number, way: 'in' | 'out'): Leg[] {
  const side = corridor.at < node.x ? node.x : right(node);
  if (
    Math.abs(corridor.at - side) < MIN_TERMINAL_RUN ||
    (corridor.at > node.x && corridor.at < right(node))
  ) {
    return [];
  }
  const y = centre(node).y;
  const channel: Channel = { axis: 'x', low: corridor.low, high: corridor.high };
  const points =
    way === 'out'
      ? [
          { x: side, y },
          { x: corridor.at, y },
          { x: corridor.at, y: lane },
        ]
      : [
          { x: corridor.at, y: lane },
          { x: corridor.at, y },
          { x: side, y },
        ];
  const channels = way === 'out' ? [undefined, channel] : [channel, undefined];
  return [{ points, x: corridor.at, channels }];
}

/** The ways from the first lane at `from` to the last lane at `to`. */
function middles(problem: RouteProblem, from: number, to: number): Route[] {
  const { gaps, obstacles, walls, limits } = problem;
  const first = gaps[0];
  const last = gaps[gaps.length - 1];
  const laneChannel = (gap: readonly [number, number]): Channel => ({
    axis: 'y',
    low: gap[0],
    high: gap[1],
  });
  if (gaps.length === 1) {
    const lane = middle(first);
    return [
      {
        points: [
          { x: from, y: lane },
          { x: to, y: lane },
        ],
        channels: [laneChannel(first)],
      },
    ];
  }
  const [top, end] = [middle(first), middle(last)];
  const through = [
    { at: from, low: from, high: from },
    { at: to, low: to, high: to },
    ...corridors([top, end], obstacles, walls, limits),
  ];
  return through.map((corridor) => ({
    points: [
      { x: from, y: top },
      { x: corridor.at, y: top },
      { x: corridor.at, y: end },
      { x: to, y: end },
    ],
    channels: [
      laneChannel(first),
      { axis: 'x', low: corridor.low, high: corridor.high },
      laneChannel(last),
    ],
  }));
}

/** Join legs end to end, keeping one channel per segment, then drop joints that do not turn. */
function join(parts: readonly Route[]): Route {
  const points: P[] = [];
  const channels: (Channel | undefined)[] = [];
  for (const part of parts) {
    const offset = points.length > 0 ? 1 : 0;
    points.push(...part.points.slice(offset));
    channels.push(...part.channels);
  }
  return tidy({ points, channels });
}

/** Simplify a route while keeping each remaining segment's channel. */
function tidy({ points, channels }: Route): Route {
  const kept: Route = { points: [], channels: [] };
  points.forEach((point, index) => keep(kept, point, channels[index - 1]));
  return kept;
}

const samePoint = (a: P, b: P) => Math.abs(a.x - b.x) < EPS && Math.abs(a.y - b.y) < EPS;

/** Add a point to a route under construction, merging a joint that does not turn. */
function keep(route: Route, point: P, channel: Channel | undefined): void {
  const { points, channels } = route;
  const last = points[points.length - 1];
  if (last && samePoint(last, point)) {
    return;
  }
  const before = points[points.length - 2];
  if (before && collinear(before, last, point)) {
    points.pop();
    channels[channels.length - 1] = channels[channels.length - 1] ?? channel;
  } else if (last) {
    channels.push(channel);
  }
  points.push(point);
}

function collinear(a: P, b: P, c: P): boolean {
  return (
    (Math.abs(a.x - b.x) < EPS && Math.abs(b.x - c.x) < EPS) ||
    (Math.abs(a.y - b.y) < EPS && Math.abs(b.y - c.y) < EPS)
  );
}

/**
 * The route with the fewest turns, then the shortest, that leaves the source on its side facing
 * the target or through a corridor beside it, crosses the gaps in their lanes (and any items
 * between them through a corridor), and enters the target from the side facing the source or
 * from a corridor beside it, without crossing any obstacle.
 *
 * @returns the route, or `undefined` when every way is blocked
 */
export function routeInFlow(problem: RouteProblem): Route | undefined {
  const { gaps, obstacles } = problem;
  if (gaps.length === 0) {
    return undefined;
  }
  const outs = exits(problem, middle(gaps[0]));
  const candidates = outs.flatMap((out) =>
    entries(problem, middle(gaps[gaps.length - 1]), out.x).flatMap((into) =>
      middles(problem, out.x, into.x).map((through) =>
        join([
          { points: out.points, channels: out.channels },
          through,
          { points: into.points, channels: into.channels },
        ])
      )
    )
  );
  const free = candidates.filter((route) => isFree(route.points, obstacles));
  const cost = (route: Route) =>
    score(route) + crossings(route.points, problem.crossable ?? []) * CROSSING_COST;
  return free.reduce<Route | undefined>(
    (best, route) => (best === undefined || cost(route) < cost(best) ? route : best),
    undefined
  );
}

/** How many times a route crosses the given lines. */
export function crossings(points: readonly P[], lines: readonly Box[]): number {
  return points
    .slice(1)
    .reduce(
      (sum, point, index) =>
        sum + lines.filter((line) => crosses(points[index], point, line)).length,
      0
    );
}

/**
 * Crossing a link drawn inside a frame costs as much as a detour of this many pixels: enough to
 * prefer a corridor beside it, little enough that a far corridor never wins over one crossing.
 */
const CROSSING_COST = 400;

/** A turn costs more than any length a diagram reaches. */
const TURN_COST = 1e6;
/**
 * Entering by a side rather than the side facing the source costs two turns, so an arrowhead
 * meets the facing side whenever it can. Leaving by a side costs half a turn: a link leaves by a
 * side only when that saves a turn.
 */
const SIDE_ENTRY_COST = 2 * TURN_COST;
const SIDE_EXIT_COST = TURN_COST / 2;

const acrossFlow = (a: P, b: P) => Math.abs(a.y - b.y) < EPS;

/** What the ends of a route cost for leaving or entering a node by a side. */
function sideCost(points: readonly P[]): number {
  const last = points.length - 1;
  return (
    Number(acrossFlow(points[0], points[1])) * SIDE_EXIT_COST +
    Number(acrossFlow(points[last - 1], points[last])) * SIDE_ENTRY_COST
  );
}

function score({ points }: Route): number {
  return turns(points) * TURN_COST + sideCost(points) + routeLength(points);
}
