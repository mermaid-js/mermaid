import type { P } from './geometry.js';
import type { TreeData } from './find-common-ancestor.js';
import { findCommonAncestor } from './find-common-ancestor.js';

export type ElkDirection = 'RIGHT' | 'LEFT' | 'DOWN' | 'UP';
type PortSide = 'EAST' | 'WEST' | 'SOUTH' | 'NORTH';

/** A subgraph as far as its own layout direction is concerned. */
export interface DirectionGroup {
  id: string;
  parentId?: string;
  /** The direction the author gave the subgraph, if any. */
  direction?: ElkDirection;
  /** True when the subgraph runs an algorithm of its own (`elk.box` and the like). */
  ownAlgorithm: boolean;
}

/** An edge as far as splitting is concerned: the ids of its two ends. */
export interface EdgeEnds {
  source: string;
  target: string;
}

export interface ElkPort {
  id: string;
  width: number;
  height: number;
  layoutOptions: { 'elk.port.side': PortSide };
}

interface ElkLabelLike {
  x?: number;
  y?: number;
  layoutOptions?: Record<string, unknown>;
}

interface SplitMark {
  id: string;
  index: number;
  /** The segment between the outermost exit and entry, which carries the edge's label. */
  middle: number;
  /** The subgraph of each port, in the order the edge passes them. */
  groups: string[];
  sources: string[];
  targets: string[];
}

/** The fields of an ELK edge this module reads or writes; the rest travel along untouched. */
export interface ElkEdgeLike {
  id: string;
  sources: string[];
  targets: string[];
  labels?: ElkLabelLike[];
  container?: string;
  /** Where a stitched edge passes each subgraph frame, in the edge's own coordinates. */
  crossings?: { groupId: string; point: P }[];
  sections?: { startPoint: P; endPoint: P; bendPoints?: P[] }[];
  splitOf?: SplitMark;
}

interface ElkNodeLike {
  id: string;
  x?: number;
  y?: number;
  children?: ElkNodeLike[];
}

const ROOT = 'root';

/** Where an edge leaves and enters a subgraph, for each direction of the graph around it. */
const PORT_SIDES: Record<ElkDirection, { out: PortSide; in: PortSide }> = {
  RIGHT: { out: 'EAST', in: 'WEST' },
  LEFT: { out: 'WEST', in: 'EAST' },
  DOWN: { out: 'SOUTH', in: 'NORTH' },
  UP: { out: 'NORTH', in: 'SOUTH' },
};

/** The subgraphs `id` sits in, innermost first, below `stopId`. */
function ancestorsBelow(id: string, stopId: string, { parentById }: TreeData): string[] {
  const ancestors: string[] = [];
  for (let current = parentById[id]; current && current !== stopId; current = parentById[current]) {
    ancestors.push(current);
  }
  return ancestors;
}

function depthOf(id: string, tree: TreeData): number {
  return ancestorsBelow(id, ROOT, tree).length;
}

/** The direction ELK lays out the children of `id` in, given the subgraphs laid out on their own. */
export function runDirection(
  id: string | undefined,
  separated: ReadonlyMap<string, ElkDirection>,
  rootDirection: ElkDirection,
  tree: TreeData
): ElkDirection {
  for (let current = id; current; current = tree.parentById[current]) {
    const direction = separated.get(current);
    if (direction) {
      return direction;
    }
  }
  return rootDirection;
}

/**
 * Which subgraphs hold an edge between two of their own descendants, and which hold an edge between
 * a subgraph and one of its own members. ELK would have to attach the second kind to the inside of
 * the subgraph's own frame, so a subgraph holding one keeps the shared layout.
 */
function edgesHeld(
  edges: readonly EdgeEnds[],
  tree: TreeData
): { internal: Set<string>; ownMember: Set<string> } {
  const internal = new Set<string>();
  const ownMember = new Set<string>();
  for (const { source, target } of edges) {
    const ancestor = findCommonAncestor(source, target, tree);
    const holders = [ancestor, ...ancestorsBelow(ancestor, ROOT, tree)];
    const isOwnMember = ancestor === source || ancestor === target;
    holders.forEach((id) => (isOwnMember ? ownMember : internal).add(id));
  }
  return { internal, ownMember };
}

/**
 * The subgraphs whose `direction` differs from the direction they sit in. Visited outermost first,
 * so each one is compared with the direction its parent is really laid out in.
 */
function findDirectedGroups(
  groups: readonly DirectionGroup[],
  rootDirection: ElkDirection,
  eligible: (id: string) => boolean,
  tree: TreeData
): Map<string, ElkDirection> {
  const directed = new Map<string, ElkDirection>();
  const outermostFirst = [...groups].sort((a, b) => depthOf(a.id, tree) - depthOf(b.id, tree));
  for (const group of outermostFirst) {
    const inherited = runDirection(group.parentId, directed, rootDirection, tree);
    if (
      group.direction &&
      group.direction !== inherited &&
      !group.ownAlgorithm &&
      eligible(group.id)
    ) {
      directed.set(group.id, group.direction);
    }
  }
  return directed;
}

/** The subgraphs an edge passes through or runs inside, below the outermost one it leaves. */
function groupsTouchedBy({ source, target }: EdgeEnds, tree: TreeData): string[] {
  const ancestor = findCommonAncestor(source, target, tree);
  return [
    ...ancestorsBelow(source, ancestor, tree),
    ...ancestorsBelow(target, ancestor, tree),
    ancestor,
  ];
}

/**
 * Decide which subgraphs ELK lays out on their own, and in which direction.
 *
 * A subgraph is laid out on its own when its `direction` differs from the one it would inherit, it
 * runs no algorithm of its own, it holds an edge between two of its own nodes, and nothing in it is
 * an edge between a subgraph and its own member. Without an edge inside, its direction has nothing
 * to order, and laying it out on its own would only bend every edge into it round to the side its
 * own direction enters from.
 * Inside such a subgraph ELK lays out every nested subgraph on its own as well, so each nested one
 * an edge passes through or runs inside joins the result, in its own direction or else in the one
 * around it.
 *
 * @param groups - every subgraph
 * @param rootDirection - the direction of the diagram
 * @param edges - every edge between two known nodes
 * @param tree - the subgraph parent lookup
 * @returns the subgraphs to lay out on their own, each with its direction; empty when none differs
 */
export function findSeparatedGroups(
  groups: readonly DirectionGroup[],
  rootDirection: ElkDirection,
  edges: readonly EdgeEnds[],
  tree: TreeData
): Map<string, ElkDirection> {
  const { internal, ownMember } = edgesHeld(edges, tree);
  const directed = findDirectedGroups(
    groups,
    rootDirection,
    (id) => internal.has(id) && !ownMember.has(id),
    tree
  );
  if (directed.size === 0) {
    return directed;
  }
  const insideDirected = (id: string) =>
    ancestorsBelow(id, ROOT, tree).some((ancestor) => directed.has(ancestor));
  const nested = new Set(
    edges.flatMap((edge) => groupsTouchedBy(edge, tree)).filter((id) => !directed.has(id))
  );
  const byId = new Map(groups.map((group) => [group.id, group]));
  const separated = new Map(directed);
  const outermostFirst = [...nested]
    .filter(insideDirected)
    .sort((a, b) => depthOf(a, tree) - depthOf(b, tree));
  for (const id of outermostFirst) {
    const parent = byId.get(id)?.parentId;
    separated.set(
      id,
      byId.get(id)?.direction ?? runDirection(parent, separated, rootDirection, tree)
    );
  }
  return separated;
}

function portFor(edgeId: string, groupId: string, way: 'out' | 'in', side: PortSide): ElkPort {
  return {
    id: `${groupId}--${way}--${edgeId}`,
    width: 0,
    height: 0,
    layoutOptions: { 'elk.port.side': side },
  };
}

function placementOf(label: ElkLabelLike): unknown {
  return label.layoutOptions?.['edgeLabels.placement'];
}

/** The labels a segment carries: the tail label on the first, the head label on the last, the rest in between. */
function labelsForSegment(
  labels: readonly ElkLabelLike[],
  index: number,
  middle: number,
  last: number
): ElkLabelLike[] {
  return labels.filter((label) => {
    const placement = placementOf(label);
    if (placement === 'TAIL') {
      return index === 0;
    }
    if (placement === 'HEAD') {
      return index === last;
    }
    return index === middle;
  });
}

/**
 * Replace each edge that leaves or enters a separately laid-out subgraph with segments joined at
 * ports on that subgraph's frame, one port per edge and frame.
 *
 * ELK cannot route an edge across the border of a subgraph it lays out on its own, but it routes an
 * edge to a port on that border from either side. A port's side follows the direction of the graph
 * the subgraph sits in: an edge leaves downstream and enters upstream, so a feedback edge is routed
 * around rather than through a side facing the wrong way. The segment between the outermost exit
 * and entry carries the edge's label.
 *
 * @param edges - the ELK edges, after any reversal for layout
 * @param tree - the subgraph parent lookup
 * @param separated - the result of {@link findSeparatedGroups}
 * @param rootDirection - the direction of the diagram
 * @returns the edges with each crossing edge replaced by its segments, and the ports per subgraph
 */
export function splitAtGroupPorts<E extends ElkEdgeLike>(
  edges: readonly E[],
  tree: TreeData,
  separated: ReadonlyMap<string, ElkDirection>,
  rootDirection: ElkDirection
): { edges: E[]; ports: Map<string, ElkPort[]> } {
  const ports = new Map<string, ElkPort[]>();
  const addPort = (edgeId: string, groupId: string, way: 'out' | 'in') => {
    const side = PORT_SIDES[runDirection(tree.parentById[groupId], separated, rootDirection, tree)];
    const port = portFor(edgeId, groupId, way, side[way]);
    ports.set(groupId, [...(ports.get(groupId) ?? []), port]);
    return port.id;
  };

  const split = edges.flatMap((edge): E[] => {
    const [source] = edge.sources;
    const [target] = edge.targets;
    const ancestor = findCommonAncestor(source, target, tree);
    const exits = ancestorsBelow(source, ancestor, tree).filter((id) => separated.has(id));
    const entries = ancestorsBelow(target, ancestor, tree)
      .filter((id) => separated.has(id))
      .reverse();
    if (exits.length + entries.length === 0) {
      return [edge];
    }
    const chain = [
      source,
      ...exits.map((id) => addPort(edge.id, id, 'out')),
      ...entries.map((id) => addPort(edge.id, id, 'in')),
      target,
    ];
    const last = chain.length - 2;
    return chain.slice(1).map((end, index) => ({
      ...edge,
      id: `${edge.id}--segment--${index}`,
      sources: [chain[index]],
      targets: [end],
      labels: labelsForSegment(edge.labels ?? [], index, exits.length, last),
      splitOf: {
        id: edge.id,
        index,
        middle: exits.length,
        groups: [...exits, ...entries],
        sources: edge.sources,
        targets: edge.targets,
      },
    }));
  });
  return { edges: split, ports };
}

/** Where ELK put each subgraph, in diagram coordinates. */
export function containerOrigins(graph: { children?: ElkNodeLike[] }): Map<string, P> {
  const origins = new Map<string, P>([[ROOT, { x: 0, y: 0 }]]);
  const visit = (nodes: readonly ElkNodeLike[], origin: P) => {
    for (const node of nodes) {
      const at = { x: origin.x + (node.x ?? 0), y: origin.y + (node.y ?? 0) };
      if (node.children?.length) {
        origins.set(node.id, at);
        visit(node.children, at);
      }
    }
  };
  visit(graph.children ?? [], { x: 0, y: 0 });
  return origins;
}

const COLLINEAR_EPS = 0.01;

function isCollinear(a: P, b: P, c: P): boolean {
  return (
    (Math.abs(a.x - b.x) < COLLINEAR_EPS && Math.abs(b.x - c.x) < COLLINEAR_EPS) ||
    (Math.abs(a.y - b.y) < COLLINEAR_EPS && Math.abs(b.y - c.y) < COLLINEAR_EPS)
  );
}

/** Join routes end to end, dropping each joint that is not a bend. */
function joinRoutes(routes: readonly P[][]): P[] {
  const points: P[] = [];
  for (const route of routes) {
    for (const point of route) {
      if (
        points.length >= 2 &&
        isCollinear(points[points.length - 2], points[points.length - 1], point)
      ) {
        points.pop();
      }
      points.push(point);
    }
  }
  return points;
}

function shift<T extends { x?: number; y?: number }>(item: T, by: P): T {
  return { ...item, x: (item.x ?? 0) + by.x, y: (item.y ?? 0) + by.y };
}

function stitch<E extends ElkEdgeLike>(
  { id, sources, targets, middle, groups }: SplitMark,
  segments: readonly E[],
  origins: ReadonlyMap<string, P>,
  tree: TreeData
): E {
  const container = findCommonAncestor(sources[0], targets[0], tree);
  const frame = origins.get(container) ?? { x: 0, y: 0 };
  const offsetOf = (segment: E) => {
    const origin = origins.get(segment.container ?? ROOT) ?? { x: 0, y: 0 };
    return { x: origin.x - frame.x, y: origin.y - frame.y };
  };
  const routes = segments.map((segment) => {
    const section = segment.sections?.[0];
    return section
      ? [section.startPoint, ...(section.bendPoints ?? []), section.endPoint].map((point) =>
          shift(point, offsetOf(segment))
        )
      : [];
  });
  const routed = routes.every((route) => route.length);
  const points = routed ? joinRoutes(routes) : [];
  const stitched = { ...segments[middle] };
  delete stitched.splitOf;
  stitched.id = id;
  stitched.sources = sources;
  stitched.targets = targets;
  stitched.container = container;
  stitched.crossings = routed
    ? groups.flatMap((groupId, index) => {
        const point = routes[index].at(-1);
        return point ? [{ groupId, point }] : [];
      })
    : [];
  stitched.labels = segments.flatMap((segment) =>
    (segment.labels ?? []).map((label) => shift(label, offsetOf(segment)))
  );
  const [startPoint] = points;
  const endPoint = points.at(-1);
  stitched.sections =
    startPoint && endPoint ? [{ startPoint, bendPoints: points.slice(1, -1), endPoint }] : [];
  return stitched;
}

/**
 * Put back together the edges {@link splitAtGroupPorts} took apart, after layout: one route per
 * edge through every port it passed, in the coordinates of the edge's lowest common subgraph, which
 * is where ELK would have put it. Edges that were never split come back unchanged and in order.
 *
 * @param edges - the laid-out ELK edges
 * @param origins - the result of {@link containerOrigins}
 * @param tree - the subgraph parent lookup
 */
export function stitchPortSegments<E extends ElkEdgeLike>(
  edges: readonly E[],
  origins: ReadonlyMap<string, P>,
  tree: TreeData
): E[] {
  const segmentsOf = new Map<string, E[]>();
  for (const edge of edges) {
    if (edge.splitOf) {
      segmentsOf.set(edge.splitOf.id, [...(segmentsOf.get(edge.splitOf.id) ?? []), edge]);
    }
  }
  if (segmentsOf.size === 0) {
    return [...edges];
  }
  return edges.flatMap((edge) => {
    if (!edge.splitOf) {
      return [edge];
    }
    if (edge.splitOf.index !== 0) {
      return [];
    }
    const segments = [...(segmentsOf.get(edge.splitOf.id) ?? [])].sort(
      (a, b) => (a.splitOf?.index ?? 0) - (b.splitOf?.index ?? 0)
    );
    return [stitch(edge.splitOf, segments, origins, tree)];
  });
}
