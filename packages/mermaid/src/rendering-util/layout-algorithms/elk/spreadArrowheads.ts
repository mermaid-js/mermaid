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

type Arrowheads = Map<string, number>;

const carriesArrowhead = (arrowType: string | undefined): boolean =>
  arrowType !== undefined && arrowType !== '' && arrowType !== 'none';

const addArrowhead = (tally: Arrowheads, nodeId: string | undefined): void => {
  if (nodeId !== undefined) {
    tally.set(nodeId, (tally.get(nodeId) ?? 0) + 1);
  }
};

/**
 * The arrowheads on the side each node's edges enter and the side they leave, which
 * are different sides: only an end that carries an arrowhead can overlap another.
 */
function countArrowheads(
  edges: readonly Pick<Edge, 'start' | 'end' | 'arrowTypeStart' | 'arrowTypeEnd'>[]
) {
  const entering: Arrowheads = new Map();
  const leaving: Arrowheads = new Map();
  for (const edge of edges) {
    if (edge.start === edge.end) {
      continue;
    }
    if (carriesArrowhead(edge.arrowTypeEnd)) {
      addArrowhead(entering, edge.end);
    }
    if (carriesArrowhead(edge.arrowTypeStart)) {
      addArrowhead(leaving, edge.start);
    }
  }
  return { entering, leaving };
}

function isCrowded(
  node: Pick<Node, 'id' | 'width' | 'height'>,
  arrowheads: number,
  { directionOf, cornerMargin }: SpreadContext
): boolean {
  const direction = directionOf(node.id);
  const side = direction === 'RIGHT' || direction === 'LEFT' ? node.height : node.width;
  if (side === undefined || arrowheads < FEWEST_ARROWHEADS_TO_SPREAD) {
    return false;
  }
  return (side - 2 * cornerMargin) / (arrowheads + 1) < ARROWHEAD_PITCH;
}

/**
 * The ids of the nodes whose attachment points ELK should spread across the side.
 *
 * ELK places `k` implicit ports on a side at least `(side - 2 * margin) / (k + 1)` apart
 * (it keeps them 2px nearer the corners than the margin, so that is a lower bound), which
 * leaves the arrowheads of a fan-in on a short node sitting on top of each other. This
 * names the nodes where that bound falls below `ARROWHEAD_PITCH`, so a diagram without
 * such a node is laid out exactly as before.
 */
export function nodesToSpreadPorts(
  nodes: readonly Pick<Node, 'id' | 'isGroup' | 'width' | 'height'>[],
  edges: readonly Pick<Edge, 'start' | 'end' | 'arrowTypeStart' | 'arrowTypeEnd'>[],
  context: SpreadContext
): Set<string> {
  const { entering, leaving } = countArrowheads(edges);
  const crowded = nodes.filter(
    (node) =>
      !node.isGroup &&
      isCrowded(node, Math.max(entering.get(node.id) ?? 0, leaving.get(node.id) ?? 0), context)
  );
  return new Set(crowded.map((node) => node.id));
}
