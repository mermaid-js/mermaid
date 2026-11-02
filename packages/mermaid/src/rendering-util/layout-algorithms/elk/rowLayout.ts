import type { P } from './geometry.js';
import type { TreeData } from './find-common-ancestor.js';
import type { ElkDirection, ElkEdgeLike } from './groupPorts.js';

/** A box by its top-left corner. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A link between two items of the diagram (subgraphs or nodes sitting directly in it), with the
 * boxes of its two end nodes. Everything is in flow coordinates: the diagram's direction runs
 * down `y`, and the items stack along it.
 */
export interface RowLink {
  /** Position of the link in the source, which decides which link straightens an item. */
  order: number;
  sourceItem: string;
  targetItem: string;
  source: Rect;
  target: Rect;
}

export interface RowItem {
  rect: Rect;
  /** Only a subgraph is shifted; a node sitting in the diagram keeps its place. */
  movable: boolean;
}

const STRAIGHT_EPS = 0.01;

/** Turn a point into flow coordinates, where the diagram's direction runs down `y`. */
export function toFlow({ x, y }: P, direction: ElkDirection): P {
  switch (direction) {
    case 'UP':
      return { x, y: -y };
    case 'RIGHT':
      return { x: y, y: x };
    case 'LEFT':
      return { x: y, y: -x };
    default:
      return { x, y };
  }
}

/** The inverse of {@link toFlow}. */
export function fromFlow({ x, y }: P, direction: ElkDirection): P {
  switch (direction) {
    case 'UP':
      return { x, y: -y };
    case 'RIGHT':
      return { x: y, y: x };
    case 'LEFT':
      return { x: -y, y: x };
    default:
      return { x, y };
  }
}

export function rectToFlow(rect: Rect, direction: ElkDirection): Rect {
  const a = toFlow(rect, direction);
  const b = toFlow({ x: rect.x + rect.width, y: rect.y + rect.height }, direction);
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  };
}

const bottom = (rect: Rect) => rect.y + rect.height;
const centreX = (rect: Rect) => rect.x + rect.width / 2;
const shifted = (rect: Rect, dx: number): Rect => ({ ...rect, x: rect.x + dx });

/** True when the two items overlap along the flow, so neither lies wholly before the other. */
function shareBand(a: Rect, b: Rect): boolean {
  return a.y < bottom(b) && b.y < bottom(a);
}

/**
 * How far to shift each item across the flow so that its first link to an item already placed,
 * in source order, runs straight. Items are placed in flow order. An item is left where it is
 * when it is a node, when it shares its band with another item (shifting it could make the two
 * overlap), or when none of its links reaches an item placed before it.
 *
 * @returns the shift of each item that moves; absent items stay
 */
export function planRowShifts(
  items: ReadonlyMap<string, RowItem>,
  links: readonly RowLink[]
): Map<string, number> {
  const shifts = new Map<string, number>();
  const placed = new Set<string>();
  const inFlowOrder = [...items].sort(([, a], [, b]) => a.rect.y - b.rect.y);
  const byOrder = [...links].sort((a, b) => a.order - b.order);
  for (const [id, item] of inFlowOrder) {
    const alone = inFlowOrder.every(
      ([other, { rect }]) => other === id || !shareBand(rect, item.rect)
    );
    const link = byOrder.find(
      (candidate) =>
        (candidate.sourceItem === id && placed.has(candidate.targetItem)) ||
        (candidate.targetItem === id && placed.has(candidate.sourceItem))
    );
    if (item.movable && alone && link) {
      shifts.set(id, straighteningShift(link, id, shifts));
    }
    placed.add(id);
  }
  return shifts;
}

function straighteningShift(
  link: RowLink,
  id: string,
  shifts: ReadonlyMap<string, number>
): number {
  const [mine, theirs, theirItem] =
    link.targetItem === id
      ? [link.target, link.source, link.sourceItem]
      : [link.source, link.target, link.targetItem];
  return centreX(theirs) + (shifts.get(theirItem) ?? 0) - centreX(mine);
}

/**
 * The route of a link between two items in different bands, in flow coordinates: from the side
 * of the source facing the target to the side of the target facing the source, straight when the
 * two line up and otherwise with two turns in the middle of the gap. The items' shifts are applied.
 *
 * @returns the route, or `undefined` when the two items share a band
 */
export function routeRowLink(
  link: RowLink,
  items: ReadonlyMap<string, RowItem>,
  shifts: ReadonlyMap<string, number>
): P[] | undefined {
  const apart = itemsApart(link, items);
  if (!apart) {
    return undefined;
  }
  const [sourceItem, targetItem] = apart;
  const source = shifted(link.source, shifts.get(link.sourceItem) ?? 0);
  const target = shifted(link.target, shifts.get(link.targetItem) ?? 0);
  return targetItem.y >= bottom(sourceItem)
    ? zRoute(source, target, (bottom(sourceItem) + targetItem.y) / 2)
    : zRoute(target, source, (bottom(targetItem) + sourceItem.y) / 2).reverse();
}

/** The boxes of a link's two items, when neither shares its band with the other. */
function itemsApart(link: RowLink, items: ReadonlyMap<string, RowItem>): [Rect, Rect] | undefined {
  const source = items.get(link.sourceItem)?.rect;
  const target = items.get(link.targetItem)?.rect;
  return source && target && !shareBand(source, target) ? [source, target] : undefined;
}

/** From the bottom of `upper` to the top of `lower`: straight when they line up, else a Z through `gap`. */
function zRoute(upper: Rect, lower: Rect, gap: number): P[] {
  const start = { x: centreX(upper), y: bottom(upper) };
  const end = { x: centreX(lower), y: lower.y };
  if (Math.abs(start.x - end.x) < STRAIGHT_EPS) {
    return [start, { x: start.x, y: end.y }];
  }
  return [start, { x: start.x, y: gap }, { x: end.x, y: gap }, end];
}

/** The midpoint of a route's middle segment, where its label goes. */
export function labelCentre(route: readonly P[]): P {
  const middle = Math.floor((route.length - 1) / 2);
  const [a, b] = [route[middle], route[middle + 1]];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * The common span of frames stacked along the flow: from the leftmost start to the rightmost end
 * across it.
 */
export function commonSpan(frames: readonly Rect[]): { start: number; size: number } {
  const start = Math.min(...frames.map((frame) => frame.x));
  const end = Math.max(...frames.map((frame) => frame.x + frame.width));
  return { start, size: end - start };
}

interface ElkBox {
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  children?: ElkBox[];
}

/** Each node's box in diagram coordinates. */
function absoluteRects(nodes: readonly ElkBox[], origin: P, into = new Map<string, Rect>()) {
  for (const node of nodes) {
    const rect = {
      x: origin.x + (node.x ?? 0),
      y: origin.y + (node.y ?? 0),
      width: node.width ?? 0,
      height: node.height ?? 0,
    };
    into.set(node.id, rect);
    absoluteRects(node.children ?? [], rect, into);
  }
  return into;
}

/** The node or subgraph sitting directly in the diagram that holds `id`. */
function itemOf(id: string, tree: TreeData): string {
  let current = id;
  while (tree.parentById[current]) {
    current = tree.parentById[current];
  }
  return current;
}

/**
 * Hand ELK each link between two different items of the diagram as a link between the items
 * themselves, when one of them is laid out on its own. ELK then orders the items by these links,
 * without a port on any frame; {@link alignDirectedSubgraphs} puts the real ends back and routes
 * the link.
 */
export function proxyRowLinks(
  edges: readonly ElkEdgeLike[],
  tree: TreeData,
  separated: ReadonlyMap<string, ElkDirection>
): void {
  for (const edge of edges) {
    const sourceItem = itemOf(edge.sources[0], tree);
    const targetItem = itemOf(edge.targets[0], tree);
    const touchesFrame = separated.has(sourceItem) || separated.has(targetItem);
    if (sourceItem !== targetItem && touchesFrame) {
      edge.proxyOf = { sources: edge.sources, targets: edge.targets };
      edge.sources = [sourceItem];
      edge.targets = [targetItem];
    }
  }
}

function restoreProxies(edges: readonly ElkEdgeLike[]): void {
  for (const edge of edges) {
    if (edge.proxyOf) {
      edge.sources = edge.proxyOf.sources;
      edge.targets = edge.proxyOf.targets;
      delete edge.proxyOf;
    }
  }
}

interface AlignInput {
  graph: { children?: ElkBox[]; edges?: ElkEdgeLike[] };
  tree: TreeData;
  separated: ReadonlyMap<string, ElkDirection>;
  direction: ElkDirection;
  /** The position of an edge in the source, by its id. */
  orderOf: (id: string) => number;
}

function rowLinks(
  { graph, tree, separated, direction, orderOf }: AlignInput,
  rects: ReadonlyMap<string, Rect>
): { link: RowLink; edge: ElkEdgeLike }[] {
  return (graph.edges ?? []).flatMap((edge) => {
    const [sourceId] = edge.sources;
    const [targetId] = edge.targets;
    const sourceItem = itemOf(sourceId, tree);
    const targetItem = itemOf(targetId, tree);
    const source = rects.get(sourceId);
    const target = rects.get(targetId);
    const touchesFrame = separated.has(sourceItem) || separated.has(targetItem);
    if (sourceItem === targetItem || !touchesFrame || !source || !target) {
      return [];
    }
    const flow = (rect: Rect) => rectToFlow(rect, direction);
    const link = {
      order: orderOf(edge.id),
      sourceItem,
      targetItem,
      source: flow(source),
      target: flow(target),
    };
    return [{ link, edge }];
  });
}

/** Where a rerouted link passes the frame it leaves and the frame it enters. */
function frameCrossings(
  route: readonly P[],
  link: RowLink,
  items: ReadonlyMap<string, RowItem>,
  separated: ReadonlyMap<string, ElkDirection>
): { groupId: string; point: P }[] {
  const start = route[0];
  const end = route[route.length - 1];
  const down = end.y > start.y;
  const ends = [
    { groupId: link.sourceItem, x: start.x, leaves: true },
    { groupId: link.targetItem, x: end.x, leaves: false },
  ];
  return ends.flatMap(({ groupId, x, leaves }) => {
    const rect = items.get(groupId)?.rect;
    if (!rect || !separated.has(groupId)) {
      return [];
    }
    return [{ groupId, point: { x, y: leaves === down ? bottom(rect) : rect.y } }];
  });
}

/** Give a rerouted edge its route, its main label's place and the frames it passes. */
function applyRoute(
  edge: ElkEdgeLike,
  route: P[],
  crossings: { groupId: string; point: P }[],
  direction: ElkDirection
) {
  const points = route.map((point) => fromFlow(point, direction));
  edge.sections = [
    { startPoint: points[0], bendPoints: points.slice(1, -1), endPoint: points[points.length - 1] },
  ];
  edge.crossings = crossings.map(({ groupId, point }) => ({
    groupId,
    point: fromFlow(point, direction),
  }));
  const [main, ...ends] = edge.labels ?? [];
  if (main) {
    const centre = fromFlow(labelCentre(route), direction);
    main.x = centre.x - (main.width ?? 0) / 2;
    main.y = centre.y - (main.height ?? 0) / 2;
  }
  for (const end of ends) {
    end.x = 0;
    end.y = 0;
  }
}

function shiftChild(child: ElkBox, shift: number, direction: ElkDirection) {
  const along = direction === 'RIGHT' || direction === 'LEFT' ? 'y' : 'x';
  child[along] = (child[along] ?? 0) + shift;
}

/**
 * Arrange the separately laid-out subgraphs sitting directly in the diagram as aligned rows (or
 * columns), after ELK has laid out the graph and before its result is read.
 *
 * Each such subgraph is shifted across the flow so that its first link, in source order, to an
 * item placed before it runs straight; then every link between two different items that touches
 * such a subgraph is routed again, through the gap between the two, from the side of its source
 * that faces the target to the side of the target that faces the source. A link between items in
 * one band keeps ELK's route. End labels are handed back unplaced, so they take the default
 * placement along the new route.
 */
export function alignDirectedSubgraphs(input: AlignInput): void {
  const { graph, separated, direction } = input;
  const children = graph.children ?? [];
  if (!children.some((child) => separated.has(child.id))) {
    return;
  }
  restoreProxies(graph.edges ?? []);
  const rects = absoluteRects(children, { x: 0, y: 0 });
  const items = new Map<string, RowItem>(
    children.map((child) => [
      child.id,
      {
        rect: rectToFlow(
          { x: child.x ?? 0, y: child.y ?? 0, width: child.width ?? 0, height: child.height ?? 0 },
          direction
        ),
        movable: separated.has(child.id),
      },
    ])
  );
  const links = rowLinks(input, rects);
  const shifts = planRowShifts(
    items,
    links.map(({ link }) => link)
  );
  for (const child of children) {
    shiftChild(child, shifts.get(child.id) ?? 0, direction);
  }
  const movedItems = new Map(
    [...items].map(([id, item]) => [id, { ...item, rect: shifted(item.rect, shifts.get(id) ?? 0) }])
  );
  for (const { link, edge } of links) {
    const route = routeRowLink(link, items, shifts);
    if (route) {
      applyRoute(edge, route, frameCrossings(route, link, movedItems, separated), direction);
    }
  }
}

/** The inverse of {@link rectToFlow}. */
export function rectFromFlow(rect: Rect, direction: ElkDirection): Rect {
  const a = fromFlow(rect, direction);
  const b = fromFlow({ x: rect.x + rect.width, y: rect.y + rect.height }, direction);
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  };
}

interface FrameNode {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  offset?: { posX: number; posY: number; width: number; height: number };
  elkOrigin?: { posX: number; posY: number };
}

/**
 * Give the aligned frames one common span across the flow, after their frames have been sized:
 * full-width rows, or full-height columns. A frame that shares its band with another keeps its
 * own span, since widening it would cover its neighbour. Each frame keeps where ELK put it in `elkOrigin`, which
 * the edges routed inside it resolve against.
 *
 * @param frames - each aligned frame's layout box, and the box painted for it
 */
export function spanAlignedFrames(
  frames: readonly { box: FrameNode; painted?: FrameNode }[],
  direction: ElkDirection
): void {
  const sized = frames.flatMap(({ box, painted }) => {
    const offset = box.offset;
    if (!offset) {
      return [];
    }
    const flowRect = rectToFlow(
      { x: offset.posX, y: offset.posY, width: offset.width, height: offset.height },
      direction
    );
    return [{ box, painted, offset, flowRect }];
  });
  const stacked = sized.filter(({ flowRect }) =>
    sized.every((other) => other.flowRect === flowRect || !shareBand(other.flowRect, flowRect))
  );
  if (stacked.length < 2) {
    return;
  }
  const { start, size } = commonSpan(stacked.map(({ flowRect }) => flowRect));
  for (const { box, painted, offset, flowRect } of stacked) {
    const rect = rectFromFlow({ ...flowRect, x: start, width: size }, direction);
    box.elkOrigin ??= { posX: offset.posX, posY: offset.posY };
    Object.assign(offset, { posX: rect.x, posY: rect.y, width: rect.width, height: rect.height });
    for (const node of painted ? [box, painted] : [box]) {
      Object.assign(node, {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
        width: rect.width,
        height: rect.height,
      });
    }
  }
}
