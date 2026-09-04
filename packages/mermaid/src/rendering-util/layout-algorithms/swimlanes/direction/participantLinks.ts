import type { LayoutData } from '../../../types.js';
import { buildLaneModel } from '../lanes.js';

type LayoutNode = NonNullable<LayoutData['nodes']>[number];
type LayoutEdge = NonNullable<LayoutData['edges']>[number];
interface Point {
  x: number;
  y: number;
}
interface Box {
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

/** Where along a shared span the nth of `count` links crosses, so several stay apart. */
const alongSpan = (low: number, high: number, index: number, count: number): number =>
  low + ((high - low) * (index + 1)) / (count + 1);

/**
 * A straight run between the facing borders of two boxes, or null where they overlap on
 * both axes and no such run exists.
 */
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

/**
 * Draws the links that end on a participant band rather than on a node inside one.
 *
 * The router works on content, and a band is sized from the content it holds, so when
 * edges are routed a band has no geometry to aim at and such a link comes back as a
 * single point. Run once the bands have been placed, this joins their facing borders,
 * which is where the notation draws a message flow between two participants.
 */
export function linkParticipantBands(layout: LayoutData): void {
  const nodes = layout.nodes ?? [];
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

  // Links joining the same two bands share a border, so they are counted first and then
  // spread along it rather than drawn one on top of another.
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
      if (run) {
        (edge as { points?: Point[] }).points = run;
      }
    }
  }
}
