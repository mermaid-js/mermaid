import type { Edge, Node } from '../../types.js';

export type ElkDirection = 'RIGHT' | 'LEFT' | 'DOWN' | 'UP';

type MarkerPosition = 'start' | 'end';

/**
 * How far a marker reaches across its edge, in px: the height of its viewBox scaled into the
 * box `markers.js` draws it in. `margin` is the variant the neo look draws (`useMargin` in
 * `edges.js`); a start marker is drawn at its own scale, so it differs from the end one.
 */
const MARKER_EXTENT: Record<string, Record<'plain' | 'margin', Record<MarkerPosition, number>>> = {
  arrow_point: {
    plain: { start: 8, end: 8 },
    margin: { start: 14, end: 12.8 },
  },
  arrow_circle: {
    plain: { start: 11, end: 11 },
    margin: { start: 14, end: 14 },
  },
  arrow_cross: {
    plain: { start: 11, end: 11 },
    margin: { start: 12, end: 12 },
  },
};

/** Reach of the markers no entry above measures: relation and cardinality markers. */
const UNMEASURED_MARKER_EXTENT = 8;

export function markerExtent(arrowType: string, position: MarkerPosition, margin: boolean): number {
  return (
    MARKER_EXTENT[arrowType]?.[margin ? 'margin' : 'plain'][position] ?? UNMEASURED_MARKER_EXTENT
  );
}

/** ELK keeps its implicit ports this far inside `portsSurrounding`. */
const PORT_INSET = 2;

/**
 * The distance ELK leaves between `ports` implicit ports on a side `side` long, when the node
 * keeps its default port alignment.
 */
export function elkPortGap(side: number, ports: number, cornerMargin: number): number {
  return (side - 2 * Math.max(cornerMargin - PORT_INSET, 0)) / (ports + 1);
}

/**
 * Fewer arrowheads than this are left to ELK: on a 48px flowchart node it keeps two 9.3px apart,
 * and spreading every join would move diagrams that were not asked to change.
 */
const FEWEST_ARROWHEADS_TO_SPREAD = 3;

type EdgeEnds = Pick<
  Edge,
  'start' | 'end' | 'arrowTypeStart' | 'arrowTypeEnd' | 'look' | 'animate' | 'animation'
>;

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
  /** The widest marker among the arrowheads. */
  extent: number;
}

type Sides = Map<string, Side>;

const carriesArrowhead = (arrowType: string | undefined): arrowType is string =>
  arrowType !== undefined && arrowType !== '' && arrowType !== 'none';

/** `edges.js` draws the margin variant of a marker on a neo edge that is not animated. */
const drawsMarginMarkers = (edge: EdgeEnds): boolean =>
  edge.look === 'neo' && edge.animate !== true && !edge.animation;

function addEnd(
  sides: Sides,
  nodeId: string | undefined,
  arrowType: string | undefined,
  edge: EdgeEnds,
  position: MarkerPosition
): void {
  if (nodeId === undefined) {
    return;
  }
  const side = sides.get(nodeId) ?? { ports: 0, arrowheads: 0, extent: 0 };
  side.ports += 1;
  if (carriesArrowhead(arrowType)) {
    side.arrowheads += 1;
    side.extent = Math.max(
      side.extent,
      markerExtent(arrowType, position, drawsMarginMarkers(edge))
    );
  }
  sides.set(nodeId, side);
}

/** The side each node's edges enter and the side they leave, which are different sides. */
function sidesOf(edges: readonly EdgeEnds[]) {
  const entering: Sides = new Map();
  const leaving: Sides = new Map();
  for (const edge of edges) {
    if (edge.start !== edge.end) {
      addEnd(entering, edge.end, edge.arrowTypeEnd, edge, 'end');
      addEnd(leaving, edge.start, edge.arrowTypeStart, edge, 'start');
    }
  }
  return { entering, leaving };
}

function overlaps(side: Side | undefined, length: number, cornerMargin: number): boolean {
  return (
    side !== undefined &&
    side.arrowheads >= FEWEST_ARROWHEADS_TO_SPREAD &&
    elkPortGap(length, side.ports, cornerMargin) < side.extent
  );
}

/**
 * The ids of the nodes whose attachment points ELK should spread across the side.
 *
 * ELK gives every edge end a port, an open link as much as an arrow, and spaces them
 * `elkPortGap` apart. This names the nodes where that falls below the width of the arrowheads
 * on a side, so a diagram without such a node is laid out exactly as before.
 */
export function nodesToSpreadPorts(
  nodes: readonly Pick<Node, 'id' | 'isGroup' | 'width' | 'height'>[],
  edges: readonly EdgeEnds[],
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
