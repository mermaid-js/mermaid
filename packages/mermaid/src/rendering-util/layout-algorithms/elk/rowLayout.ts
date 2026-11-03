import type { P } from './geometry.js';
import type { TreeData } from './find-common-ancestor.js';
import type { ElkDirection, ElkEdgeLike } from './groupPorts.js';
import { findCommonAncestor } from './find-common-ancestor.js';
import { type Channel, type Route, isFree, routeInFlow, routeLength, turns } from './rowRouter.js';
import { LABEL_GAP_PADDING, justifyFrames, rowsToJustify } from './rowJustify.js';

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
  /** The id of the edge, to find the link again once it is routed. */
  id: string;
  source: Rect;
  target: Rect;
}

export interface RowItem {
  rect: Rect;
  /** Only a subgraph is shifted; a node sitting in the diagram keeps its place. */
  movable: boolean;
}

const ROOT = 'root';
const STRAIGHT_EPS = 0.01;
/** A marker's viewBox and the box `markers.js` draws it into, each as width and height. */
interface MarkerBox {
  viewBox: readonly [number, number];
  drawn: readonly [number, number];
}

/**
 * How far a marker reaches across the link it ends: the height of its viewBox, scaled to fit the
 * box it is drawn into while keeping its proportions, as SVG does by default.
 */
export function markerReach({ viewBox, drawn }: MarkerBox): number {
  return viewBox[1] * Math.min(drawn[0] / viewBox[0], drawn[1] / viewBox[1]);
}

/** The end markers the neo look draws on a link (`*End-margin` in `markers.js`). */
export const END_MARKERS: Record<'point' | 'circle' | 'cross', MarkerBox> = {
  point: { viewBox: [11.5, 14], drawn: [10.5, 14] },
  circle: { viewBox: [10, 10], drawn: [14, 14] },
  cross: { viewBox: [15, 15], drawn: [12, 12] },
};

/** How far the widest end marker reaches across its link. */
const END_MARKER_REACH = Math.max(...Object.values(END_MARKERS).map(markerReach));
/** The least distance between two link ends on one side of a node: the widest marker and a pixel. */
export const END_SPACING = END_MARKER_REACH + 1;
/**
 * How far a link keeps from the edge of a frame's title: half the room a label keeps beside it in
 * a gap, so a link past a title reads as passing it rather than touching its text.
 */
const TITLE_CLEARANCE = LABEL_GAP_PADDING / 2;
/** Half the width a line takes when another line or a label must keep off it. */
const LINE_HALF_WIDTH = 1;
/** Runs closer than this, side by side, read as one crowded lane: three arrowheads' room. */
const SHARED_RUN_DISTANCE = 3 * END_SPACING;

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
 * @param decided - filled with the link that decided each shift, in flow order
 * @returns the shift of each item that moves; absent items stay
 */
export function planRowShifts(
  items: ReadonlyMap<string, RowItem>,
  links: readonly RowLink[],
  decided = new Map<string, RowLink>()
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
      decided.set(id, link);
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
 * Place points along one side of a node, each as near its wish as it can be while the points
 * stay `spacing` apart, between `low` and `high`. The points keep the order of their wishes, so
 * the links they end do not cross at the node.
 */
export function packAlong(
  wishes: readonly number[],
  low: number,
  high: number,
  spacing: number
): number[] {
  const order = wishes.map((_, index) => index).sort((a, b) => wishes[a] - wishes[b] || a - b);
  const placed: number[] = [];
  order.forEach((index, rank) => {
    const wish = Math.min(Math.max(wishes[index], low), high);
    placed.push(rank === 0 ? wish : Math.max(wish, placed[rank - 1] + spacing));
  });
  const overflow = Math.max(placed[placed.length - 1] - high, 0);
  const positions: number[] = [];
  order.forEach((index, rank) => {
    positions[index] = placed[rank] - overflow;
  });
  return positions;
}

/**
 * Slide packed points together, within `low` and `high`, so that as many as possible sit exactly
 * on their wish: those links then run straight. With a tie, the smaller slide wins.
 */
export function slideToWishes(
  positions: readonly number[],
  wishes: readonly number[],
  low: number,
  high: number
): number[] {
  const [least, most] = [Math.min(...positions), Math.max(...positions)];
  const straight = (slide: number) =>
    positions.filter((position, index) => Math.abs(position + slide - wishes[index]) < STRAIGHT_EPS)
      .length;
  const slides = [0, ...wishes.map((wish, index) => wish - positions[index])].filter(
    (slide) => least + slide >= low - STRAIGHT_EPS && most + slide <= high + STRAIGHT_EPS
  );
  const best = slides.reduce(
    (a, b) =>
      straight(b) > straight(a) || (straight(b) === straight(a) && Math.abs(b) < Math.abs(a))
        ? b
        : a,
    0
  );
  return positions.map((position) => position + best);
}

const fitsAmong = (taken: readonly number[], spacing: number) => (position: number) =>
  taken.every((other) => Math.abs(other - position) >= spacing - STRAIGHT_EPS);

/** The free spot nearest `wish` within `low` and `high`, at least `spacing` from every taken one. */
function nearestFree(
  wish: number,
  taken: readonly number[],
  [low, high]: readonly [number, number],
  spacing: number
): number {
  const want = Math.min(Math.max(wish, low), high);
  const free = [want, low, high, ...taken.flatMap((other) => [other - spacing, other + spacing])]
    .filter((spot) => spot >= low - STRAIGHT_EPS && spot <= high + STRAIGHT_EPS)
    .filter(fitsAmong(taken, spacing));
  return free.reduce((a, b) => (Math.abs(b - want) < Math.abs(a - want) ? b : a), free[0] ?? want);
}

/**
 * The stretch between two pinned points (or a pinned point and an end of the side) that `count`
 * points must share, and the spacing they can keep there: `spacing` when there is room, less when
 * there is not.
 */
function segment(
  before: number | undefined,
  after: number | undefined,
  [low, high]: readonly [number, number],
  count: number,
  spacing: number
): { lo: number; hi: number; gap: number } {
  const from = before ?? low;
  const to = after ?? high;
  const slots = count + (before === undefined ? 0 : 1) + (after === undefined ? 0 : 1) - 1;
  const gap = slots > 0 ? Math.min(spacing, (to - from) / slots) : spacing;
  return {
    lo: before === undefined ? low : before + gap,
    hi: after === undefined ? high : after - gap,
    gap,
  };
}

/**
 * Place the points that can sit on their wish there first, so their links run straight, then the
 * others between them in the order of their wishes, so their links do not cross. Points that do
 * not fit between their pinned neighbours, even an arrowhead apart, take the nearest free spot.
 */
export function pinStraight(
  wishes: readonly number[],
  low: number,
  high: number,
  spacing: number
): number[] {
  const positions: number[] = [];
  const pins: number[] = [];
  const byWish = wishes.map((_, index) => index).sort((a, b) => wishes[a] - wishes[b]);
  for (const index of byWish) {
    const wish = wishes[index];
    if (wish >= low && wish <= high && fitsAmong(pins, spacing)(wish)) {
      positions[index] = wish;
      pins.push(wish);
    }
  }
  const rest = byWish.filter((index) => positions[index] === undefined);
  const taken = [...pins];
  for (let k = 0; k <= pins.length; k++) {
    const members = rest.filter((index) => pins.filter((pin) => pin < wishes[index]).length === k);
    placeBetween(
      members,
      wishes,
      positions,
      segment(pins[k - 1], pins[k], [low, high], members.length, spacing),
      taken,
      [low, high]
    );
  }
  return positions;
}

function placeBetween(
  members: readonly number[],
  wishes: readonly number[],
  positions: number[],
  { lo, hi, gap }: { lo: number; hi: number; gap: number },
  taken: number[],
  side: readonly [number, number]
): void {
  if (members.length === 0) {
    return;
  }
  if (gap >= END_SPACING - STRAIGHT_EPS && hi >= lo - STRAIGHT_EPS) {
    const packed = packAlong(
      members.map((index) => wishes[index]),
      lo,
      hi,
      gap
    );
    members.forEach((index, rank) => {
      positions[index] = packed[rank];
      taken.push(packed[rank]);
    });
    return;
  }
  for (const index of members) {
    positions[index] = nearestFree(wishes[index], taken, side, END_SPACING);
    taken.push(positions[index]);
  }
}

const straightCount = (positions: readonly number[], wishes: readonly number[]) =>
  positions.filter((position, index) => Math.abs(position - wishes[index]) < STRAIGHT_EPS).length;

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
  labels?: { x?: number; y?: number; width?: number; height?: number }[];
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

/** A node of the ELK graph as built, before layout. */
interface ElkTreeNode {
  id: string;
  children?: ElkTreeNode[];
  /** The subgraph's place in the source, where the diagram records it (a flowchart does). */
  colorIndex?: number;
}

/** Frames in the order they are written: by their recorded place, else as listed. */
function inSourceOrder<T extends ElkTreeNode>(frames: readonly T[]): T[] {
  return frames
    .map((frame, index) => ({ frame, rank: frame.colorIndex ?? index }))
    .sort((a, b) => a.rank - b.rank)
    .map(({ frame }) => frame);
}

/**
 * The groups of frames to arrange: the separated frames sitting directly in the diagram, and the
 * separated frames inside each separated frame that holds more than one, each group with the
 * direction it is stacked in.
 */
export function arrangedGroups(
  children: readonly ElkTreeNode[],
  separated: ReadonlyMap<string, ElkDirection>,
  direction: ElkDirection
): { frames: string[]; direction: ElkDirection }[] {
  const frames = inSourceOrder(children.filter((child) => separated.has(child.id)));
  const inner = frames.flatMap((frame) =>
    arrangedGroups(frame.children ?? [], separated, separated.get(frame.id) ?? direction)
  );
  return frames.length > 1 ? [{ frames: frames.map(({ id }) => id), direction }, ...inner] : inner;
}

/**
 * Edges that only make ELK stack each group of arranged frames in the order they are written:
 * one from each frame to the next. {@link alignDirectedSubgraphs} drops them after layout.
 */
export function orderingEdges(groups: readonly { frames: string[] }[]): ElkEdgeLike[] {
  return groups.flatMap(({ frames }) =>
    frames.slice(1).map((frame, index) => ({
      id: `${frames[index]}--order--${frame}`,
      sources: [frames[index]],
      targets: [frame],
      labels: [],
      ordering: true,
    }))
  );
}

/** The child of `ancestor` that holds `id`, or `id` itself when it is a direct child. */
function childOf(id: string, ancestor: string, tree: TreeData): string {
  let current = id;
  while (tree.parentById[current] && tree.parentById[current] !== ancestor) {
    current = tree.parentById[current];
  }
  return current;
}

/**
 * Hand ELK each link between two different items of the diagram as a link between the items
 * themselves, when one of them is laid out on its own. ELK then orders the items by these links,
 * without a port on any frame; {@link alignDirectedSubgraphs} puts the real ends back and routes
 * the link. A link between two arranged frames of one group is not handed to ELK at all, since
 * the group is stacked in the order it is written; it is returned to be routed after layout. A
 * link against that order is handed to ELK reversed, so it does not fight the order.
 *
 * @returns the links kept back from ELK
 */
export function proxyRowLinks(
  graph: { edges: ElkEdgeLike[] },
  tree: TreeData,
  separated: ReadonlyMap<string, ElkDirection>,
  groups: readonly { frames: string[] }[] = []
): ElkEdgeLike[] {
  const position = new Map(groups.flatMap(({ frames }) => frames.map((id, index) => [id, index])));
  const sameGroup = (a: string, b: string) =>
    groups.some(({ frames }) => frames.includes(a) && frames.includes(b));
  const withheld: ElkEdgeLike[] = [];
  graph.edges = graph.edges.filter((edge) => {
    const ancestor = findCommonAncestor(edge.sources[0], edge.targets[0], tree);
    const sourceFrame = childOf(edge.sources[0], ancestor, tree);
    const targetFrame = childOf(edge.targets[0], ancestor, tree);
    if (ancestor !== ROOT && sourceFrame !== targetFrame && sameGroup(sourceFrame, targetFrame)) {
      withheld.push(edge);
      return false;
    }
    proxyRowLink(edge, tree, separated, position);
    return true;
  });
  return withheld;
}

function proxyRowLink(
  edge: ElkEdgeLike,
  tree: TreeData,
  separated: ReadonlyMap<string, ElkDirection>,
  position: ReadonlyMap<string, number>
): void {
  const sourceItem = itemOf(edge.sources[0], tree);
  const targetItem = itemOf(edge.targets[0], tree);
  const touchesFrame = separated.has(sourceItem) || separated.has(targetItem);
  if (sourceItem === targetItem || !touchesFrame) {
    return;
  }
  edge.proxyOf = { sources: edge.sources, targets: edge.targets };
  edge.sources = [sourceItem];
  edge.targets = [targetItem];
  if ((position.get(sourceItem) ?? -1) > (position.get(targetItem) ?? Infinity)) {
    edge.proxyOf = { sources: edge.proxyOf.targets, targets: edge.proxyOf.sources };
    [edge.sources, edge.targets] = [edge.targets, edge.sources];
    edge.layoutReversed = !edge.layoutReversed;
  }
}

/**
 * Prepare an ELK graph for arranged frames: proxy or keep back the links between arranged items,
 * and add the edges that keep each group of frames in the order it is written.
 */
export function arrangeForElk(
  graph: { children: ElkTreeNode[]; edges: ElkEdgeLike[] },
  tree: TreeData,
  separated: ReadonlyMap<string, ElkDirection>,
  direction: ElkDirection
): { withheld: ElkEdgeLike[]; groups: { frames: string[]; direction: ElkDirection }[] } {
  const groups = arrangedGroups(graph.children, separated, direction);
  const withheld = proxyRowLinks(graph, tree, separated, groups);
  graph.edges.push(...orderingEdges(groups));
  return { withheld, groups };
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
  /** The links {@link arrangeForElk} kept back from ELK. */
  withheld?: readonly ElkEdgeLike[];
  /** The groups of arranged frames, from {@link arrangedGroups}. */
  groups?: readonly { frames: string[]; direction: ElkDirection }[];
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
      id: edge.id,
      source: flow(source),
      target: flow(target),
    };
    return [{ link, edge }];
  });
}

/** The laid-out diagram in diagram coordinates, after the shifts. */
interface Scene {
  /** Nodes without children: what a link must not cross. */
  leaves: Map<string, Rect>;
  /** Nodes with children, as they will be painted. */
  frames: Map<string, Rect>;
  titles: Rect[];
  /** The links routed by ELK, as thin boxes a rerouted link should not cross. */
  lines: Rect[];
  /** Where the links routed by ELK meet their nodes. */
  lineEnds: P[];
  /** The room along a node's side that each of those ends takes, as a thin box on the side. */
  lineMarks: Rect[];
  /** The loops ELK drew from a node back to itself, as thin boxes no other link may cross. */
  loops: Rect[];
}

const OPPOSITE: Record<ElkDirection, ElkDirection> = {
  DOWN: 'UP',
  UP: 'DOWN',
  RIGHT: 'LEFT',
  LEFT: 'RIGHT',
};

/** Each frame as it will be painted: the frames of an arranged group share one span. */
function paintedFrames(
  rects: ReadonlyMap<string, Rect>,
  framesOf: readonly string[],
  groups: readonly { frames: string[]; direction: ElkDirection }[]
): Map<string, Rect> {
  const painted = new Map<string, Rect>();
  for (const id of framesOf) {
    const rect = rects.get(id);
    if (rect) {
      painted.set(id, rect);
    }
  }
  for (const { frames, direction } of groups) {
    const flowRects = frames.flatMap((id) => {
      const rect = painted.get(id);
      return rect ? [{ id, flow: rectToFlow(rect, direction) }] : [];
    });
    const stacked = flowRects.filter(({ flow }) =>
      flowRects.every((other) => other.flow === flow || !shareBand(other.flow, flow))
    );
    if (stacked.length > 1) {
      const { start, size } = commonSpan(stacked.map(({ flow }) => flow));
      for (const { id, flow } of stacked) {
        painted.set(id, rectFromFlow({ ...flow, x: start, width: size }, direction));
      }
    }
  }
  return painted;
}

/** The box of each frame's title: centred at the top of the frame as painted. */
function titleBoxes(children: readonly ElkBox[], painted: ReadonlyMap<string, Rect>): Rect[] {
  return children.flatMap((node): Rect[] => [
    ...titleBox(painted.get(node.id), node.labels?.[0]),
    ...titleBoxes(node.children ?? [], painted),
  ]);
}

function titleBox(
  frame: Rect | undefined,
  label: { y?: number; width?: number; height?: number } | undefined
): Rect[] {
  if (!frame || !label?.width) {
    return [];
  }
  return [
    {
      x: frame.x + (frame.width - label.width) / 2 - TITLE_CLEARANCE,
      y: frame.y + (label.y ?? 0),
      width: label.width + 2 * TITLE_CLEARANCE,
      height: label.height ?? 0,
    },
  ];
}

function buildScene(
  children: readonly ElkBox[],
  groups: readonly { frames: string[]; direction: ElkDirection }[]
): Scene {
  const rects = absoluteRects(children, { x: 0, y: 0 });
  const withChildren = new Set<string>();
  const visit = (nodes: readonly ElkBox[]) => {
    for (const node of nodes) {
      if (node.children?.length) {
        withChildren.add(node.id);
        visit(node.children);
      }
    }
  };
  visit(children);
  const leaves = new Map([...rects].filter(([id]) => !withChildren.has(id)));
  const frames = paintedFrames(rects, [...withChildren], groups);
  return {
    leaves,
    frames,
    titles: titleBoxes(children, frames),
    lines: [],
    lineEnds: [],
    lineMarks: [],
    loops: [],
  };
}

/** A link to route through the arranged frames, and the frame of reference it is routed in. */
interface LinkPlan {
  edge: ElkEdgeLike;
  /** The lowest common subgraph of the link's ends, which its route is relative to. */
  container: string;
  /** The direction from the source's item to the target's. */
  direction: ElkDirection;
  sourceItem: string;
  targetItem: string;
  /** The items of the group the two items belong to. */
  members: readonly string[];
}

/** The items a link runs between and the group they belong to: the diagram's or an arranged one. */
function linkGroup(
  edge: ElkEdgeLike,
  { tree, separated, groups = [], graph }: AlignInput
): Omit<LinkPlan, 'direction'> | undefined {
  const [source] = edge.sources;
  const [target] = edge.targets;
  const container = findCommonAncestor(source, target, tree);
  const sourceItem = childOf(source, container, tree);
  const targetItem = childOf(target, container, tree);
  if (sourceItem === targetItem) {
    return undefined;
  }
  const members =
    container === ROOT
      ? rootMembers(sourceItem, targetItem, separated, graph.children ?? [])
      : groups.find(({ frames }) => frames.includes(sourceItem) && frames.includes(targetItem))
          ?.frames;
  return members && { edge, container, sourceItem, targetItem, members };
}

/** The items of the diagram, when one of the two linked items is an arranged frame. */
function rootMembers(
  sourceItem: string,
  targetItem: string,
  separated: ReadonlyMap<string, ElkDirection>,
  children: readonly ElkBox[]
): string[] | undefined {
  const arranged = separated.has(sourceItem) || separated.has(targetItem);
  return arranged ? children.map(({ id }) => id) : undefined;
}

/**
 * How a link is routed, if it runs between two items of the diagram that one arranged frame is
 * among, or between two frames of one arranged group: in that group's direction, turned round
 * when the target's item lies before the source's.
 */
function planLink(
  edge: ElkEdgeLike,
  input: AlignInput,
  rects: ReadonlyMap<string, Rect>
): LinkPlan | undefined {
  const linked = linkGroup(edge, input);
  const from = linked && rects.get(linked.sourceItem);
  const to = linked && rects.get(linked.targetItem);
  if (!linked || !from || !to) {
    return undefined;
  }
  const along = input.separated.get(linked.container) ?? input.direction;
  const backwards = rectToFlow(to, along).y < rectToFlow(from, along).y;
  return { ...linked, direction: backwards ? OPPOSITE[along] : along };
}

/** The free bands across the flow between two items, given the items that may lie between. */
function gapsBetween(from: Rect, to: Rect, between: readonly Rect[]): [number, number][] {
  const bands = between
    .filter((rect) => rect.y >= bottom(from) - STRAIGHT_EPS && bottom(rect) <= to.y + STRAIGHT_EPS)
    .map((rect): [number, number] => [rect.y, bottom(rect)])
    .sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const band of bands) {
    const last = merged[merged.length - 1];
    if (last && band[0] <= last[1]) {
      last[1] = Math.max(last[1], band[1]);
    } else {
      merged.push([...band]);
    }
  }
  const edges = [bottom(from), ...merged.flat(), to.y];
  const gaps: [number, number][] = [];
  for (let index = 0; index < edges.length; index += 2) {
    if (edges[index + 1] > edges[index]) {
      gaps.push([edges[index], edges[index + 1]]);
    }
  }
  return gaps.length === merged.length + 1 ? gaps : [];
}

function channelFromFlow(channel: Channel, direction: ElkDirection): Channel {
  const across = direction === 'RIGHT' || direction === 'LEFT' ? 'y' : 'x';
  const alongAxis = across === 'x' ? 'y' : 'x';
  if (channel.axis === 'x') {
    return { ...channel, axis: across };
  }
  const negated = direction === 'UP' || direction === 'LEFT';
  return negated
    ? { axis: alongAxis, low: -channel.high, high: -channel.low }
    : { ...channel, axis: alongAxis };
}

/** The boxes of a link's two ends: a node, or a frame when the link ends on a subgraph. */
function endBoxes(
  edge: ElkEdgeLike,
  scene: Scene,
  flow: (rect: Rect) => Rect
): { source: Rect; target: Rect; leaves: Map<string, Rect> } | undefined {
  const leaves = new Map([...scene.leaves].map(([id, rect]) => [id, flow(rect)]));
  const box = (id: string) => {
    const frame = scene.frames.get(id);
    return leaves.get(id) ?? (frame && flow(frame));
  };
  const source = box(edge.sources[0]);
  const target = box(edge.targets[0]);
  return source && target ? { source, target, leaves } : undefined;
}

/** The stretch across the flow a corridor may use: the container's frame, or the items' extent. */
function limitsOf(extent: readonly Rect[]): [number, number] {
  return [
    Math.min(...extent.map((rect) => rect.x)),
    Math.max(...extent.map((rect) => rect.x + rect.width)),
  ];
}

/** Route one planned link through the scene; the route comes back in diagram coordinates. */
function routePlan(
  plan: LinkPlan,
  scene: Scene,
  rects: ReadonlyMap<string, Rect>
): Route | undefined {
  const { direction } = plan;
  const flow = (rect: Rect) => rectToFlow(rect, direction);
  const ends = endBoxes(plan.edge, scene, flow);
  const from = rects.get(plan.sourceItem);
  const to = rects.get(plan.targetItem);
  if (!ends || !from || !to) {
    return undefined;
  }
  const members = plan.members
    .filter((id) => id !== plan.sourceItem && id !== plan.targetItem)
    .flatMap((id) => {
      const rect = rects.get(id);
      return rect ? [flow(rect)] : [];
    });
  const frames = [...scene.frames.values()].map(flow);
  const container = scene.frames.get(plan.container);
  const route = routeInFlow({
    source: ends.source,
    target: ends.target,
    gaps: gapsBetween(flow(from), flow(to), members),
    obstacles: [
      ...ends.leaves.values(),
      ...scene.titles.map(flow),
      ...scene.lineMarks.map(flow),
      ...scene.loops.map(flow),
    ],
    crossable: scene.lines.map(flow),
    walls: frames.flatMap((frame) => [frame.x, frame.x + frame.width]),
    limits: limitsOf(container ? [flow(container)] : [flow(from), flow(to), ...members]),
  });
  return (
    route && {
      points: route.points.map((point) => fromFlow(point, direction)),
      channels: route.channels.map((channel) => channel && channelFromFlow(channel, direction)),
    }
  );
}

type Side = 'top' | 'bottom' | 'left' | 'right';

interface Terminal {
  route: Route;
  /** The index of the end point: 0 for the start, the last index for the end. */
  index: number;
  node: Rect;
  key: string;
  along: 'x' | 'y';
  wish: number;
  /** The boxes of the route's two end nodes, which its ends may touch. */
  ends: readonly [Rect, Rect];
}

/** Which side of its node a route's end touches, and the axis that side runs along. */
function sideOf(end: P, next: P): { side: Side; along: 'x' | 'y' } {
  if (Math.abs(end.x - next.x) < STRAIGHT_EPS) {
    return { side: next.y > end.y ? 'bottom' : 'top', along: 'x' };
  }
  return { side: next.x > end.x ? 'right' : 'left', along: 'y' };
}

function terminalsOf(
  route: Route,
  ids: readonly [string, string],
  ends: readonly [Rect, Rect]
): Terminal[] {
  const { points } = route;
  const last = points.length - 1;
  const indices: [number, number] = [0, last];
  return indices.map((index, which) => {
    const step = index === 0 ? 1 : -1;
    const { side, along } = sideOf(points[index], points[index + step]);
    const beyond = points[index + 2 * step] ?? points[last - index];
    const key = `${ids[which]} ${side}`;
    return { route, index, node: ends[which], key, along, wish: beyond[along], ends };
  });
}

/** Move a route's end as {@link moveEnd} does, unless that takes the route through an obstacle. */
/**
 * Does a route leave its first node and enter its last one square to the side it touches, with
 * no segment of zero length? A route that runs along a node's edge does not.
 */
export function meetsSquarely(points: readonly P[], [from, to]: readonly [Rect, Rect]): boolean {
  const last = points.length - 1;
  const empty = points
    .slice(1)
    .some(
      (point, index) =>
        Math.abs(point.x - points[index].x) + Math.abs(point.y - points[index].y) < STRAIGHT_EPS
    );
  return !empty && square(points[0], points[1], from) && square(points[last], points[last - 1], to);
}

/** Is the segment from `end`, on the border of `node`, square to the side `end` lies on? */
function square(end: P, next: P, node: Rect): boolean {
  const onLeftOrRight =
    Math.abs(end.x - node.x) < STRAIGHT_EPS ||
    Math.abs(end.x - (node.x + node.width)) < STRAIGHT_EPS;
  const horizontal = Math.abs(end.y - next.y) < STRAIGHT_EPS;
  return onLeftOrRight === horizontal;
}

function moveIfFree(terminal: Terminal, position: number, obstacles: readonly Rect[]): boolean {
  const { route, ends } = terminal;
  const saved = { points: [...route.points], channels: [...route.channels] };
  moveEnd(terminal, position);
  const others = obstacles.filter((box) => box !== ends[0] && box !== ends[1]);
  if (isFree(route.points, others) && meetsSquarely(route.points, ends)) {
    return true;
  }
  route.points = saved.points;
  route.channels = saved.channels;
  return false;
}

/** Move a route's end along its node's side, and the corner after it with it. */
function moveEnd({ route, index, along }: Terminal, position: number): void {
  const { points } = route;
  if (Math.abs(points[index][along] - position) < STRAIGHT_EPS) {
    return;
  }
  const step = index === 0 ? 1 : -1;
  if (points.length === 2) {
    const across = along === 'x' ? 'y' : 'x';
    const mid = (points[0][across] + points[1][across]) / 2;
    const end = { ...points[index], [along]: position };
    const bend = { ...end, [across]: mid };
    const other = points[index + step];
    const join = { ...other, [across]: mid };
    route.points = index === 0 ? [end, bend, join, other] : [other, join, bend, end];
    route.channels = [undefined, undefined, undefined];
    return;
  }
  points[index] = { ...points[index], [along]: position };
  points[index + step] = { ...points[index + step], [along]: position };
}

/**
 * Spread the ends that meet on one side of one node, as {@link pinStraight} and
 * {@link slideToWishes} place them, clear of a frame title above the side when there is room.
 */
function spreadEnds(
  terminals: readonly Terminal[],
  titles: readonly Rect[],
  obstacles: readonly Rect[],
  drawnEnds: readonly P[] = []
): void {
  const sides = new Map<string, Terminal[]>();
  for (const terminal of terminals) {
    sides.set(terminal.key, [...(sides.get(terminal.key) ?? []), terminal]);
  }
  for (const ends of sides.values()) {
    if (ends.length > 1) {
      spreadSide(ends, titles, obstacles);
    }
    keepOffDrawnEnds(ends, drawnEnds, titles, obstacles);
  }
}

/** Spread the ends on one side of a node along it, in order, around any that cannot move. */
function spreadSide(
  ends: readonly Terminal[],
  titles: readonly Rect[],
  obstacles: readonly Rect[]
) {
  const { node, along } = ends[0];
  const [start, size] = along === 'x' ? [node.x, node.width] : [node.y, node.height];
  const title = along === 'x' ? titleAbove(node, titles) : undefined;
  const [low, high] = freeRange(start, size, ends.length, title);
  const room = Math.max(high - low, 0);
  const gap = Math.max(END_SPACING, Math.min(room / ends.length, room / (ends.length - 1)));
  const wishes = ends.map(({ wish }) => wish);
  const best = bestPositions(wishes, low, high, gap);
  const stuck = ends.flatMap((end, index) =>
    moveIfFree(end, best[index], obstacles) ? [] : [index]
  );
  if (stuck.length > 0) {
    spreadAround(ends, stuck, [low, high], gap, obstacles);
  }
}

/**
 * The room each end of a drawn link takes along its node's side: {@link END_SPACING} either way
 * along the side, so another link's arrowhead keeps clear of it.
 */
function endMarks(points: readonly P[]): Rect[] {
  const last = points.length - 1;
  if (last < 1) {
    return [];
  }
  return [endMark(points[0], points[1]), endMark(points[last], points[last - 1])];
}

function endMark(end: P, next: P): Rect {
  const alongX = Math.abs(end.x - next.x) < STRAIGHT_EPS;
  const [halfX, halfY] = alongX ? [END_SPACING, LINE_HALF_WIDTH] : [LINE_HALF_WIDTH, END_SPACING];
  return { x: end.x - halfX, y: end.y - halfY, width: 2 * halfX, height: 2 * halfY };
}

/** Where a terminal's end lies along its side. */
const positionOf = ({ route, index, along }: Terminal) => route.points[index][along];

/**
 * Move the ends on one side of a node that lie closer than {@link END_SPACING} to where a link
 * ELK drew meets the same side, to the nearest place clear of those and of each other.
 */
function keepOffDrawnEnds(
  ends: readonly Terminal[],
  drawnEnds: readonly P[],
  titles: readonly Rect[],
  obstacles: readonly Rect[]
): void {
  const pinned = drawnOnSide(ends[0], drawnEnds);
  const crowded = ends.filter((end) =>
    pinned.some((at) => Math.abs(at - positionOf(end)) < END_SPACING - STRAIGHT_EPS)
  );
  if (crowded.length === 0) {
    return;
  }
  const { node, along } = ends[0];
  const [start, size] = along === 'x' ? [node.x, node.width] : [node.y, node.height];
  const title = along === 'x' ? titleAbove(node, titles) : undefined;
  const range = freeRange(start, size, ends.length + pinned.length, title);
  for (const end of crowded) {
    const taken = [...pinned, ...ends.filter((other) => other !== end).map(positionOf)];
    moveIfFree(end, nearestFree(positionOf(end), taken, range, END_SPACING), obstacles);
  }
}

/** Where the links ELK drew meet the side of the node a terminal ends on, along that side. */
function drawnOnSide({ route, index, node, along }: Terminal, drawnEnds: readonly P[]): number[] {
  const across = along === 'x' ? 'y' : 'x';
  const line = route.points[index][across];
  const [start, size] = along === 'x' ? [node.x, node.width] : [node.y, node.height];
  return drawnEnds
    .filter((point) => Math.abs(point[across] - line) < LINE_HALF_WIDTH)
    .map((point) => point[along])
    .filter((at) => at >= start && at <= start + size);
}

/** Positions packed in order or pinned where links run straight, whichever keeps more straight. */
function bestPositions(wishes: readonly number[], low: number, high: number, gap: number) {
  const inOrder = slideToWishes(packAlong(wishes, low, high, gap), wishes, low, high);
  const pinned = pinStraight(wishes, low, high, gap);
  return straightCount(pinned, wishes) > straightCount(inOrder, wishes) ? pinned : inOrder;
}

/**
 * Spread the ends of one side again around the ends that could not move without their route
 * crossing an obstacle: those stay where they are, and the others fit around them.
 */
function spreadAround(
  ends: readonly Terminal[],
  stuck: readonly number[],
  [low, high]: readonly [number, number],
  gap: number,
  obstacles: readonly Rect[]
): void {
  const wishes = ends.map((end, index) =>
    stuck.includes(index) ? end.route.points[end.index][end.along] : end.wish
  );
  const again = pinStraight(wishes, low, high, gap);
  ends.forEach((end, index) => {
    if (!stuck.includes(index)) {
      moveIfFree(end, again[index], obstacles);
    }
  });
}

/** The span across a node's top that a title just above it takes, if any. */
function titleAbove(node: Rect, titles: readonly Rect[]): readonly [number, number] | undefined {
  const title = titles.find(
    (box) =>
      bottom(box) <= node.y + STRAIGHT_EPS &&
      box.x < node.x + node.width &&
      box.x + box.width > node.x
  );
  return title && [title.x, title.x + title.width];
}

/**
 * The stretch of a node's side the ends may use: clear of its corners, and clear of the title of
 * its frame when the rest of the side still holds them all.
 */
function freeRange(start: number, size: number, count: number, title?: readonly [number, number]) {
  const side: [number, number] = [start + END_SPACING, start + size - END_SPACING];
  if (!title || title[1] <= side[0] || title[0] >= side[1]) {
    return side;
  }
  const left: [number, number] = [side[0], Math.min(side[1], title[0])];
  const rightPart: [number, number] = [Math.max(side[0], title[1]), side[1]];
  const wider = left[1] - left[0] >= rightPart[1] - rightPart[0] ? left : rightPart;
  return wider[1] - wider[0] >= (count - 1) * END_SPACING ? wider : side;
}

/**
 * Orders two segments sharing a channel from its low side to its high side so that neither cuts
 * the run that leads into the other: of two runs heading the same way, the one that starts
 * nearer the high side lies further along; runs heading low take the lower part.
 */
function byChannel(a: { before: P; after: P }, b: { before: P; after: P }): number {
  const headsLowA = a.after.x < a.before.x;
  const headsLowB = b.after.x < b.before.x;
  if (headsLowA !== headsLowB) {
    return headsLowA ? -1 : 1;
  }
  return headsLowA ? a.before.x - b.before.x : b.before.x - a.before.x;
}

/** A straight run of a route, and the stretch across it that it may move within. */
interface Run {
  route: Route;
  index: number;
  /** An end run stays where the ends were spread; it only takes up room. */
  fixed: boolean;
  axis: 'x' | 'y';
  at: number;
  extent: readonly [number, number];
  low: number;
  high: number;
  before: P;
  after: P;
}

/**
 * The runs of a route that may move across themselves: its middle runs within their channel, and
 * its first and last runs along the side of their node, as long as the route turns at all.
 */
function runsOf(route: Route, ends: readonly [Rect, Rect]): Run[] {
  const { points } = route;
  const last = points.length - 2;
  if (last < 1) {
    return [];
  }
  return points.slice(1).flatMap((to, index) => {
    const node = index === 0 ? ends[0] : index === last ? ends[1] : undefined;
    return runAt(route, index, node);
  });
}

/** The run from point `index` to the next, if it has room to move: along its node or its channel. */
function runAt(route: Route, index: number, node: Rect | undefined): Run[] {
  const { points } = route;
  const [from, to] = [points[index], points[index + 1]];
  const axis = Math.abs(from.x - to.x) < STRAIGHT_EPS ? 'x' : 'y';
  const other = axis === 'x' ? 'y' : 'x';
  const room = node ? nodeRoom(node, axis) : route.channels[index];
  if (!room) {
    return [];
  }
  const flip = (p: P): P => (axis === 'y' ? p : { x: p.y, y: p.x });
  const extent: [number, number] = [
    Math.min(from[other], to[other]),
    Math.max(from[other], to[other]),
  ];
  return [
    {
      route,
      index,
      fixed: node !== undefined,
      axis,
      at: from[axis],
      extent,
      low: room.low,
      high: room.high,
      before: flip(points[index - 1] ?? from),
      after: flip(points[index + 2] ?? to),
    },
  ];
}

/** Where along a node's side a run that ends on it may sit. */
function nodeRoom(node: Rect, axis: 'x' | 'y') {
  const [start, size] = axis === 'x' ? [node.x, node.width] : [node.y, node.height];
  return { low: start + END_SPACING, high: start + size - END_SPACING };
}

/** Runs that lie on top of each other, or nearly: same axis, close, and overlapping. */
function close(a: Run, b: Run): boolean {
  return (
    a.axis === b.axis &&
    Math.abs(a.at - b.at) < SHARED_RUN_DISTANCE &&
    a.extent[0] < b.extent[1] - STRAIGHT_EPS &&
    b.extent[0] < a.extent[1] - STRAIGHT_EPS
  );
}

/** Group runs that lie on top of each other, directly or through a chain of them. */
function clusters(runs: readonly Run[]): Run[][] {
  const groups: Run[][] = [];
  for (const run of runs) {
    const touching = groups.filter((group) => group.some((other) => close(run, other)));
    const merged = [run, ...touching.flat()];
    groups.splice(0, groups.length, ...groups.filter((group) => !touching.includes(group)), merged);
  }
  return groups;
}

/**
 * Give runs that lie on top of each other, or nearly, a place each across the room they share:
 * lanes in a gap, corridors beside nodes. The room is cut into even places; an end run keeps its
 * own spot and takes the place nearest it, and the middle runs take the rest in order. Runs of
 * one route never move against each other.
 */
function spreadChannels(
  routes: readonly { route: Route; ends: readonly [Rect, Rect] }[],
  obstacles: readonly Rect[]
): void {
  const endsOf = new Map(routes.map(({ route, ends }) => [route, ends]));
  const runs = routes.flatMap(({ route, ends }) => runsOf(route, ends));
  for (const group of clusters(runs)) {
    if (group.length < 2 || new Set(group.map(({ route }) => route)).size < group.length) {
      continue;
    }
    const low = Math.max(...group.map((run) => run.low));
    const high = Math.min(...group.map((run) => run.high));
    if (high - low < (group.length - 1) * END_SPACING) {
      continue;
    }
    const step = (high - low) / (group.length + 1);
    const places = group.map((_, rank) => low + step * (rank + 1));
    for (const { at } of group.filter(({ fixed }) => fixed)) {
      const nearest = places.reduce(
        (best, place, index) => (Math.abs(place - at) < Math.abs(places[best] - at) ? index : best),
        0
      );
      places.splice(nearest, 1);
    }
    group
      .filter(({ fixed }) => !fixed)
      .sort(byChannel)
      .forEach((run, rank) => moveRun(run, places[rank], obstacles, endsOf.get(run.route)));
  }
}

/** Move a run across itself, unless that takes its route through an obstacle. */
function moveRun(
  { route, index, axis }: Run,
  at: number,
  obstacles: readonly Rect[],
  ends: readonly [Rect, Rect] | undefined
): void {
  const saved = [...route.points];
  for (const point of [index, index + 1]) {
    route.points[point] = { ...route.points[point], [axis]: at };
  }
  const others = obstacles.filter((box) => box !== ends?.[0] && box !== ends?.[1]);
  if (!isFree(route.points, others)) {
    route.points = saved;
  }
}

/**
 * Where a label goes on a route: the middle of its longest segment on which the label covers
 * nothing in `avoid`, else the middle of its longest segment.
 */
export function labelSpot(
  route: readonly P[],
  { width = 0, height = 0 }: { width?: number; height?: number },
  avoid: readonly Rect[]
): P {
  const middles = route
    .slice(1)
    .map((point, index) => ({ a: route[index], b: point }))
    .sort((p, q) => routeLength([q.a, q.b]) - routeLength([p.a, p.b]))
    .map(({ a, b }) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }));
  const free = middles.find((centre) => {
    const box = { x: centre.x - width / 2, y: centre.y - height / 2, width, height };
    return avoid.every((other) => !overlaps(box, other));
  });
  return free ?? middles[0];
}

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/** Where a route passes the border of each frame, relative to `origin`. */
function frameCrossings(points: readonly P[], frames: ReadonlyMap<string, Rect>, origin: P) {
  return points.slice(1).flatMap((point, index) => {
    const from = points[index];
    return [...frames].flatMap(([groupId, frame]) =>
      borderHits(from, point, frame).map((hit) => ({
        groupId,
        point: { x: hit.x - origin.x, y: hit.y - origin.y },
      }))
    );
  });
}

function borderHits(a: P, b: P, frame: Rect): P[] {
  const vertical = Math.abs(a.x - b.x) < STRAIGHT_EPS;
  const [fixed, from, to] = vertical ? [a.x, a.y, b.y] : [a.y, a.x, b.x];
  const [low, high] = vertical
    ? [frame.x, frame.x + frame.width]
    : [frame.y, frame.y + frame.height];
  const borders = vertical ? [frame.y, bottom(frame)] : [frame.x, frame.x + frame.width];
  if (fixed <= low || fixed >= high) {
    return [];
  }
  return borders
    .filter((border) => border > Math.min(from, to) && border < Math.max(from, to))
    .map((border) => (vertical ? { x: fixed, y: border } : { x: border, y: fixed }));
}

/** Give a rerouted edge its route, its main label's place and the frames it passes. */
function applyRoute(
  edge: ElkEdgeLike,
  points: readonly P[],
  origin: P,
  frames: ReadonlyMap<string, Rect>,
  avoid: readonly Rect[]
) {
  const local = points.map((point) => ({ x: point.x - origin.x, y: point.y - origin.y }));
  edge.sections = [
    { startPoint: local[0], bendPoints: local.slice(1, -1), endPoint: local[local.length - 1] },
  ];
  edge.crossings = frameCrossings(points, frames, origin);
  edge.endsOnBorder = true;
  const [main, ...ends] = edge.labels ?? [];
  if (main) {
    const centre = labelSpot(points, main, avoid);
    main.x = centre.x - origin.x - (main.width ?? 0) / 2;
    main.y = centre.y - origin.y - (main.height ?? 0) / 2;
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
 * Shift the arranged frames sitting directly in the diagram so their first links run straight.
 *
 * @returns the link that decided each shift, in flow order
 */
function shiftRows(input: AlignInput, justified: ReadonlySet<string>): Map<string, RowLink> {
  const { graph, separated, direction } = input;
  const children = graph.children ?? [];
  const rects = absoluteRects(children, { x: 0, y: 0 });
  const items = new Map<string, RowItem>(
    children.map((child) => [
      child.id,
      {
        rect: rectToFlow(
          { x: child.x ?? 0, y: child.y ?? 0, width: child.width ?? 0, height: child.height ?? 0 },
          direction
        ),
        movable: separated.has(child.id) && !justified.has(child.id),
      },
    ])
  );
  const decided = new Map<string, RowLink>();
  const shifts = planRowShifts(
    items,
    rowLinks(input, rects).map(({ link }) => link),
    decided
  );
  for (const child of children) {
    shiftChild(child, shifts.get(child.id) ?? 0, direction);
  }
  return decided;
}

function justifyInput({ graph, separated, groups = [], direction, tree }: AlignInput) {
  return {
    children: graph.children ?? [],
    edges: graph.edges ?? [],
    separated,
    groups,
    direction,
    tree,
  };
}

/** Where every node and link of the laid-out graph lies, to try an arrangement and go back. */
function snapshotOf({ graph }: AlignInput) {
  const boxes = new Map<ElkBox, Rect>();
  const visit = (nodes: readonly ElkBox[]) => {
    for (const node of nodes) {
      boxes.set(node, {
        x: node.x ?? 0,
        y: node.y ?? 0,
        width: node.width ?? 0,
        height: node.height ?? 0,
      });
      visit(node.children ?? []);
    }
  };
  visit(graph.children ?? []);
  const lines = new Map(
    (graph.edges ?? []).map((edge) => [
      edge,
      {
        sections: edge.sections && JSON.stringify(edge.sections),
        labels: (edge.labels ?? []).map(({ x, y }) => ({ x, y })),
      },
    ])
  );
  return { boxes, lines };
}

function restore({ boxes, lines }: ReturnType<typeof snapshotOf>): void {
  for (const [node, box] of boxes) {
    Object.assign(node, box);
  }
  for (const [edge, { sections, labels }] of lines) {
    const kept: ElkEdgeLike['sections'] = sections === undefined ? undefined : JSON.parse(sections);
    edge.sections = kept;
    (edge.labels ?? []).forEach((label, index) => Object.assign(label, labels[index]));
  }
}

/** Lay the graph back as it was, then spread the chosen frames, shift the rest and route. */
function arrange(
  input: AlignInput,
  snapshot: ReturnType<typeof snapshotOf>,
  spread: ReadonlySet<string>
) {
  restore(snapshot);
  const justified = justifyFrames({ ...justifyInput(input), include: (id) => spread.has(id) });
  return refineShifts(input, shiftRows(input, justified));
}

/**
 * How many more turns a link that already turns may take when its row is spread over the full
 * width: one, so an L may become a Z. A straight link stays straight.
 */
const SPREAD_EXTRA_TURNS = 1;

/**
 * May a link that took `before` turns take `after` once its row is spread? A link that turned may
 * turn {@link SPREAD_EXTRA_TURNS} more times; a straight one must stay straight.
 */
export function spreadKeepsTurns(before: number, after: number): boolean {
  return after <= (before > 0 ? before + SPREAD_EXTRA_TURNS : 0);
}

/** Does a link with an end in `item` turn more often in `trial` than {@link spreadKeepsTurns} allows? */
function addsTurns(
  base: ReturnType<typeof routeAll>,
  trial: ReturnType<typeof routeAll>,
  item: string,
  tree: TreeData
): boolean {
  const before = new Map(base.routed.map(({ plan, route }) => [plan.edge.id, turns(route.points)]));
  return trial.routed.some(({ plan, route }) => {
    const touches = [plan.edge.sources[0], plan.edge.targets[0]].some(
      (id) => itemOf(id, tree) === item
    );
    const was = before.get(plan.edge.id) ?? Infinity;
    return touches && !spreadKeepsTurns(was, turns(route.points));
  });
}

/** How far the frames and nodes sitting directly in the diagram reach across the flow. */
function spanAcross({ graph, direction }: AlignInput): number {
  const rects = (graph.children ?? []).map((child) =>
    rectToFlow(
      { x: child.x ?? 0, y: child.y ?? 0, width: child.width ?? 0, height: child.height ?? 0 },
      direction
    )
  );
  const from = Math.min(...rects.map(({ x }) => x));
  return Math.max(...rects.map(({ x, width }) => x + width)) - from;
}

/**
 * Spread every band of columns over the full span and put every row beside a band over its
 * columns, whatever that does to the turns of its links; then spread every other row whose spreading neither makes
 * one of its links turn more than {@link SPREAD_EXTRA_TURNS} more often nor shifts another row out
 * past the span the diagram had; the other rows keep their first-link alignment.
 */
function chooseSpread(input: AlignInput) {
  const snapshot = snapshotOf(input);
  const rows = rowsToJustify(justifyInput(input));
  const fixed = rows.filter(({ band, overBand }) => band || overBand);
  const spread = new Set(fixed.map(({ id }) => id));
  let state = arrange(input, snapshot, spread);
  let span = spanAcross(input);
  for (const { id } of rows.filter((row) => !fixed.includes(row))) {
    const trial = arrange(input, snapshot, new Set([...spread, id]));
    const trialSpan = spanAcross(input);
    if (trialSpan <= span + STRAIGHT_EPS && !addsTurns(state, trial, id, input.tree)) {
      spread.add(id);
      state = trial;
      span = trialSpan;
    }
  }
  return arrange(input, snapshot, spread);
}

/** Route every link through the arranged frames as the graph now lies, without spreading. */
function routeAll(input: AlignInput) {
  const children = input.graph.children ?? [];
  const rects = absoluteRects(children, { x: 0, y: 0 });
  const scene = buildScene(children, input.groups ?? []);
  const edges = input.graph.edges ?? [];
  const plans = edges.map((edge) => planLink(edge, input, rects));
  const unplanned = edges.filter((_, index) => !plans[index]);
  const isLoop = (edge: ElkEdgeLike) => edge.sources[0] === edge.targets[0];
  const drawn = unplanned.map((edge) => sectionPoints(edge, rects));
  scene.lines = unplanned
    .filter((edge) => !isLoop(edge))
    .flatMap((edge) => thinBoxes(sectionPoints(edge, rects)));
  scene.loops = unplanned.filter(isLoop).flatMap((edge) => thinBoxes(sectionPoints(edge, rects)));
  scene.lineEnds = drawn.flatMap((points) =>
    points.length > 0 ? [points[0], points[points.length - 1]] : []
  );
  scene.lineMarks = drawn.flatMap(endMarks);
  const routed = plans.flatMap((plan) => {
    const route = plan && routePlan(plan, scene, rects);
    return plan && route ? [{ plan, route }] : [];
  });
  return { rects, scene, routed };
}

/** The points of the route ELK gave an edge, in diagram coordinates. */
function sectionPoints(edge: ElkEdgeLike, rects: ReadonlyMap<string, Rect>): P[] {
  const origin = rects.get(edge.container ?? ROOT) ?? { x: 0, y: 0 };
  const section = edge.sections?.[0];
  return section
    ? [section.startPoint, ...(section.bendPoints ?? []), section.endPoint].map((point) => ({
        x: point.x + origin.x,
        y: point.y + origin.y,
      }))
    : [];
}

/** A route's segments as boxes a line's width thick, so they can be tested like nodes. */
function thinBoxes(points: readonly P[]): Rect[] {
  return points.slice(1).map((point, index) => {
    const from = points[index];
    return {
      x: Math.min(from.x, point.x) - LINE_HALF_WIDTH,
      y: Math.min(from.y, point.y) - LINE_HALF_WIDTH,
      width: Math.abs(point.x - from.x) + 2 * LINE_HALF_WIDTH,
      height: Math.abs(point.y - from.y) + 2 * LINE_HALF_WIDTH,
    };
  });
}

/**
 * How far to shift `item` across the flow so its routed link runs straight into it (or out of
 * it): the distance from the link's last run along the flow to its end, when the route ends with
 * a run along the flow, one across it and one along it again.
 */
function approachShift(points: readonly P[], atEnd: boolean, direction: ElkDirection): number {
  const across = direction === 'RIGHT' || direction === 'LEFT' ? 'y' : 'x';
  const ordered = atEnd ? points : [...points].reverse();
  if (ordered.length < 4) {
    return 0;
  }
  const [approach, turn, corner, end] = ordered.slice(-4);
  return zShaped([approach, turn, corner, end], across) ? turn[across] - end[across] : 0;
}

/** Do the four points run along the flow, across it, and along it again? */
function zShaped([approach, turn, corner, end]: readonly P[], across: 'x' | 'y'): boolean {
  const along = across === 'x' ? 'y' : 'x';
  const same = (a: number, b: number) => Math.abs(a - b) < STRAIGHT_EPS;
  return (
    same(corner[across], end[across]) &&
    same(turn[along], corner[along]) &&
    same(approach[across], turn[across])
  );
}

/**
 * Shift each arranged frame sitting directly in the diagram again, in flow order, so that the
 * link that decided its first shift runs straight now that it is routed round obstacles, and
 * route everything again after each shift.
 */
function refineShifts(input: AlignInput, decided: ReadonlyMap<string, RowLink>) {
  let state = routeAll(input);
  const children = input.graph.children ?? [];
  for (const [item, link] of decided) {
    const found = state.routed.find(
      ({ plan }) => plan.edge.id === link.id && plan.container === ROOT
    );
    const shift = found
      ? approachShift(found.route.points, found.plan.targetItem === item, input.direction)
      : 0;
    const child = children.find(({ id }) => id === item);
    if (child && Math.abs(shift) > STRAIGHT_EPS) {
      shiftChild(child, shift, input.direction);
      state = routeAll(input);
    }
  }
  return state;
}

/** Spread the routes' ends and crowded runs, then hand each route to its edge. */
function finishRoutes({ rects, scene, routed }: ReturnType<typeof routeAll>): void {
  const nodes = new Map([...scene.leaves, ...scene.frames]);
  const ended = routed.flatMap(({ plan, route }) => {
    const source = nodes.get(plan.edge.sources[0]);
    const target = nodes.get(plan.edge.targets[0]);
    const ends: [Rect, Rect] | undefined = source && target ? [source, target] : undefined;
    return ends ? [{ plan, route, ends }] : [];
  });
  spreadEnds(
    ended.flatMap(({ plan, route, ends }) =>
      terminalsOf(route, [plan.edge.sources[0], plan.edge.targets[0]], ends)
    ),
    scene.titles,
    [...scene.leaves.values(), ...scene.titles],
    scene.lineEnds
  );
  spreadChannels(ended, [...scene.leaves.values(), ...scene.titles]);
  const fixed = [...scene.leaves.values(), ...scene.titles, ...scene.lines];
  for (const { plan, route } of routed) {
    const origin = rects.get(plan.container) ?? { x: 0, y: 0, width: 0, height: 0 };
    const others = routed.flatMap((other) =>
      other.route === route ? [] : thinBoxes(other.route.points)
    );
    applyRoute(plan.edge, route.points, origin, scene.frames, [...fixed, ...others]);
  }
}

/**
 * Arrange the separately laid-out subgraphs as aligned rows (or columns), after ELK has laid out
 * the graph and before its result is read.
 *
 * Each such subgraph sitting directly in the diagram is shifted across the flow so that its first
 * link, in source order, to an item placed before it runs straight. Then every link between two
 * different items of the diagram that touches such a subgraph, and every link between two frames
 * of one arranged group, is routed again by {@link routeInFlow}, through the gaps between the
 * items and corridors beside the nodes. The ends that meet on one side of a node are spread along
 * it, and segments that share a lane or a corridor are spread across it. A link between items in
 * one band keeps ELK's route. End labels are handed back unplaced, so they take the default
 * placement along the new route.
 */
export function alignDirectedSubgraphs(input: AlignInput): void {
  const { graph, separated } = input;
  graph.edges = [
    ...(graph.edges ?? []).filter((edge) => !edge.ordering),
    ...(input.withheld ?? []),
  ];
  if (!(graph.children ?? []).some((child) => separated.has(child.id))) {
    return;
  }
  restoreProxies(graph.edges ?? []);
  finishRoutes(chooseSpread(input));
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
