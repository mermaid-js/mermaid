import type { LayoutData } from '../../../types.js';
import { buildLaneModel, readLaneRole } from '../lanes.js';

type LayoutNode = NonNullable<LayoutData['nodes']>[number];
type LayoutEdge = NonNullable<LayoutData['edges']>[number];
interface Point {
  x: number;
  y: number;
}
export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const boxOf = (node: LayoutNode | undefined): Box | null => {
  if (
    !node ||
    typeof node.x !== 'number' ||
    typeof node.y !== 'number' ||
    typeof node.width !== 'number' ||
    typeof node.height !== 'number'
  ) {
    return null;
  }
  return {
    left: node.x - node.width / 2,
    right: node.x + node.width / 2,
    top: node.y - node.height / 2,
    bottom: node.y + node.height / 2,
  };
};

const alongSpan = (low: number, high: number, index: number, count: number): number =>
  low + ((high - low) * (index + 1)) / (count + 1);

function runBetween(from: Box, to: Box, index: number, count: number): [Point, Point] | null {
  const sharedLeft = Math.max(from.left, to.left);
  const sharedRight = Math.min(from.right, to.right);
  if (sharedLeft <= sharedRight) {
    const x = alongSpan(sharedLeft, sharedRight, index, count);
    if (from.bottom <= to.top) {
      return [
        { x, y: from.bottom },
        { x, y: to.top },
      ];
    }
    if (to.bottom <= from.top) {
      return [
        { x, y: from.top },
        { x, y: to.bottom },
      ];
    }
  }

  const sharedTop = Math.max(from.top, to.top);
  const sharedBottom = Math.min(from.bottom, to.bottom);
  if (sharedTop <= sharedBottom) {
    const y = alongSpan(sharedTop, sharedBottom, index, count);
    if (from.right <= to.left) {
      return [
        { x: from.right, y },
        { x: to.left, y },
      ];
    }
    if (to.right <= from.left) {
      return [
        { x: from.left, y },
        { x: to.right, y },
      ];
    }
  }
  return null;
}

/** How far beyond the participants it passes a detour runs. */
const DETOUR_CLEARANCE = 18;

/** The two coordinates of a point or box side, named along and across a run. */
interface Axis {
  along: 'x' | 'y';
  across: 'x' | 'y';
  low: 'left' | 'top';
  high: 'right' | 'bottom';
  acrossHigh: 'right' | 'bottom';
}

const VERTICAL: Axis = { along: 'y', across: 'x', low: 'top', high: 'bottom', acrossHigh: 'right' };
const HORIZONTAL: Axis = {
  along: 'x',
  across: 'y',
  low: 'left',
  high: 'right',
  acrossHigh: 'bottom',
};

/** Whether the segment from `a` to `b` passes through the inside of `box`. */
export function crosses(a: Point, b: Point, box: Box): boolean {
  return (
    Math.min(a.x, b.x) < box.right &&
    Math.max(a.x, b.x) > box.left &&
    Math.min(a.y, b.y) < box.bottom &&
    Math.max(a.y, b.y) > box.top
  );
}

const at = (axis: Axis, along: number, across: number): Point =>
  axis.along === 'y' ? { x: across, y: along } : { x: along, y: across };

/**
 * The run from `a` to `b` taken round the participants it would cross: out of the first
 * border into the gap in front of it, along that gap past the far side of every participant
 * it would cross, through the gap behind the last one, and back in to the second border.
 */
function detour(a: Point, b: Point, blockers: Box[], ends: Box[]): Point[] {
  const axis = a.x === b.x ? VERTICAL : HORIZONTAL;
  const forward = b[axis.along] > a[axis.along];
  const near = (box: Box) => (forward ? box[axis.low] : box[axis.high]);
  const far = (box: Box) => (forward ? box[axis.high] : box[axis.low]);
  const first = forward ? Math.min(...blockers.map(near)) : Math.max(...blockers.map(near));
  const last = forward ? Math.max(...blockers.map(far)) : Math.min(...blockers.map(far));
  const out = (a[axis.along] + first) / 2;
  const back = (last + b[axis.along]) / 2;
  const side =
    Math.max(...[...blockers, ...ends].map((box) => box[axis.acrossHigh])) + DETOUR_CLEARANCE;
  const across = a[axis.across];
  return [
    a,
    at(axis, out, across),
    at(axis, out, side),
    at(axis, back, side),
    at(axis, back, across),
    b,
  ];
}

type EndsOf = (edge: LayoutEdge) => [string, string] | null;

function drawRuns(
  linksPerPair: Map<string, LayoutEdge[]>,
  endsOf: EndsOf,
  byId: Map<string, LayoutNode>,
  obstaclesFor: (ends: [string, string]) => Box[]
): void {
  for (const links of linksPerPair.values()) {
    for (const [index, edge] of links.entries()) {
      const ends = endsOf(edge);
      if (!ends) {
        continue;
      }
      const from = boxOf(byId.get(ends[0]));
      const to = boxOf(byId.get(ends[1]));
      if (!from || !to) {
        continue;
      }
      const run = runBetween(from, to, index, links.length);
      if (!run) {
        continue;
      }
      const blockers = obstaclesFor(ends).filter((box) => crosses(run[0], run[1], box));
      (edge as { points?: Point[] }).points =
        blockers.length === 0 ? run : detour(run[0], run[1], blockers, [from, to]);
    }
  }
}

/**
 * The pools and lanes a flow from `start` to `end` must not pass through: every one outside
 * the participants its two ends belong to, so it may cross the lanes of its own pools but
 * not another participant. Empty unless the layout has a pool and one end is a pool or a
 * lane, the flows {@link linkParticipantBands} draws.
 */
export function foreignParticipantBoxes(
  nodes: readonly LayoutNode[],
  start: string | undefined,
  end: string | undefined
): Box[] {
  if (!start || !end || !nodes.some((node) => readLaneRole(node) === 'pool')) {
    return [];
  }
  const laneModel = buildLaneModel([...nodes]);
  const isBand = (id: string) => laneModel.isPool(id) || laneModel.isLane(id);
  if (!isBand(start) && !isBand(end)) {
    return [];
  }
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const lineage = (id: string): string[] => {
    const chain: string[] = [];
    for (let current: string | undefined = id; current; current = byId.get(current)?.parentId) {
      chain.push(current);
    }
    return chain;
  };
  const related = new Set([...lineage(start), ...lineage(end)]);
  return nodes
    .filter((node) => isBand(node.id) && !lineage(node.id).some((id) => related.has(id)))
    .map((node) => boxOf(node))
    .filter((box): box is Box => box !== null);
}

/**
 * Draws each flow that ends on a pool or a lane as a straight run between the facing borders,
 * or, when another pool or lane lies across that run, as a detour round them. A layout
 * without a pool is left alone, so a plain swimlane routes a flow to a lane as it always has.
 */
export function linkParticipantBands(layout: LayoutData): void {
  const nodes = layout.nodes ?? [];
  if (!nodes.some((node) => readLaneRole(node) === 'pool')) {
    return;
  }
  const laneModel = buildLaneModel(nodes);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const isBand = (id: string) => laneModel.isPool(id) || laneModel.isLane(id);

  const endsOf = (edge: LayoutEdge): [string, string] | null => {
    const start = typeof edge.start === 'string' ? edge.start : undefined;
    const end = typeof edge.end === 'string' ? edge.end : undefined;
    if (!start || !end || start === end) {
      return null;
    }
    return isBand(start) || isBand(end) ? [start, end] : null;
  };

  const linksPerPair = new Map<string, LayoutEdge[]>();
  for (const edge of layout.edges ?? []) {
    if ((edge as { isLayoutOnly?: boolean }).isLayoutOnly) {
      continue;
    }
    const ends = endsOf(edge);
    if (!ends) {
      continue;
    }
    const [a, b] = ends;
    const key = a < b ? `${a} ${b}` : `${b} ${a}`;
    linksPerPair.set(key, [...(linksPerPair.get(key) ?? []), edge]);
  }

  const obstaclesFor = (ends: [string, string]): Box[] =>
    foreignParticipantBoxes(nodes, ends[0], ends[1]);

  drawRuns(linksPerPair, endsOf, byId, obstaclesFor);
}
