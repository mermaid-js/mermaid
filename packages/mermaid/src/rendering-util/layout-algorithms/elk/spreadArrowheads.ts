import type { Edge, Node } from '../../types.js';

export type ElkDirection = 'RIGHT' | 'LEFT' | 'DOWN' | 'UP';

/** Width of the `pointEnd` marker in the neo look (see `markers.js`). */
export const ARROWHEAD_WIDTH = 8;

/** Air that keeps two arrowheads reading as two. */
const ARROWHEAD_AIR = 2;

/** The closest two arrowheads on one node may sit. */
export const ARROWHEAD_PITCH = ARROWHEAD_WIDTH + ARROWHEAD_AIR;

/**
 * Two arrowheads are left to ELK: on a 48px flowchart node it keeps them 9.3px apart,
 * clear of each other, and spreading every join would move diagrams with no overlap.
 */
const FEWEST_ARROWHEADS_TO_SPREAD = 3;

interface SpreadContext {
  /** The direction the layout around a node runs in, which fixes the side its edges meet. */
  directionOf: (nodeId: string) => ElkDirection;
  /** `elk.spacing.portsSurrounding`: the margin ELK keeps free at each end of a side. */
  cornerMargin: number;
}

/** What ends on one side of a node: every edge takes a port there, the arrowheads are what overlap. */
interface Side {
  ports: number;
  arrowheads: number;
}

type Sides = Map<string, Side>;

const carriesArrowhead = (arrowType: string | undefined): boolean =>
  arrowType !== undefined && arrowType !== '' && arrowType !== 'none';

function addEnd(sides: Sides, nodeId: string | undefined, arrowType: string | undefined): void {
  if (nodeId === undefined) {
    return;
  }
  const side = sides.get(nodeId) ?? { ports: 0, arrowheads: 0 };
  side.ports += 1;
  if (carriesArrowhead(arrowType)) {
    side.arrowheads += 1;
  }
  sides.set(nodeId, side);
}

/** The side each node's edges enter and the side they leave, which are different sides. */
function sidesOf(
  edges: readonly Pick<Edge, 'start' | 'end' | 'arrowTypeStart' | 'arrowTypeEnd'>[]
) {
  const entering: Sides = new Map();
  const leaving: Sides = new Map();
  for (const edge of edges) {
    if (edge.start !== edge.end) {
      addEnd(entering, edge.end, edge.arrowTypeEnd);
      addEnd(leaving, edge.start, edge.arrowTypeStart);
    }
  }
  return { entering, leaving };
}

function overlaps(side: Side | undefined, length: number, cornerMargin: number): boolean {
  return (
    side !== undefined &&
    side.arrowheads >= FEWEST_ARROWHEADS_TO_SPREAD &&
    (length - 2 * cornerMargin) / (side.ports + 1) < ARROWHEAD_PITCH
  );
}

/**
 * The ids of the nodes whose attachment points ELK should spread across the side.
 *
 * ELK gives every edge end a port, an open link as much as an arrow, and places `k` of them on
 * a side at least `(side - 2 * margin) / (k + 1)` apart (it keeps them 2px nearer the corners
 * than the margin, so that is a lower bound). This names the nodes where that bound falls below
 * `ARROWHEAD_PITCH` while three or more of the ports carry an arrowhead, so a diagram without
 * such a node is laid out exactly as before.
 */
export function nodesToSpreadPorts(
  nodes: readonly Pick<Node, 'id' | 'isGroup' | 'width' | 'height'>[],
  edges: readonly Pick<Edge, 'start' | 'end' | 'arrowTypeStart' | 'arrowTypeEnd'>[],
  { directionOf, cornerMargin }: SpreadContext
): Set<string> {
  const { entering, leaving } = sidesOf(edges);
  const crowded = nodes.filter((node) => {
    const direction = directionOf(node.id);
    const length = direction === 'RIGHT' || direction === 'LEFT' ? node.height : node.width;
    return (
      !node.isGroup &&
      length !== undefined &&
      (overlaps(entering.get(node.id), length, cornerMargin) ||
        overlaps(leaving.get(node.id), length, cornerMargin))
    );
  });
  return new Set(crowded.map((node) => node.id));
}
