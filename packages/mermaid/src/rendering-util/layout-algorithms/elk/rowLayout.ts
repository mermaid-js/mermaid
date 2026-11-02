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
  /** The ids of the two end nodes, which tell links sharing a side of one node apart. */
  sourceNode: string;
  targetNode: string;
  source: Rect;
  target: Rect;
}

/**
 * Where a link leaves its source and enters its target, the gap between their items, and the
 * lane in that gap where a link that does not run straight turns.
 */
export interface LinkEnds {
  start: P;
  end: P;
  gap: number;
  gapTop: number;
  gapBottom: number;
}

export interface RowItem {
  rect: Rect;
  /** Only a subgraph is shifted; a node sitting in the diagram keeps its place. */
  movable: boolean;
}

const STRAIGHT_EPS = 0.01;
/** The width of the arrowhead markers. */
const ARROWHEAD_WIDTH = 8;
/** The least distance between two link ends on one side of a node: an arrowhead and a pixel. */
const END_SPACING = ARROWHEAD_WIDTH + 1;
/** How far a link end keeps from the edge of a frame's title. */
const TITLE_CLEARANCE = 1;

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
  const ends = linkEnds(link, items, shifts);
  return ends && routeBetween(ends);
}

/**
 * The two ends of a link at the middle of the facing sides of its nodes, after the items' shifts.
 *
 * @returns the ends, or `undefined` when the two items share a band
 */
export function linkEnds(
  link: RowLink,
  items: ReadonlyMap<string, RowItem>,
  shifts: ReadonlyMap<string, number>
): LinkEnds | undefined {
  const apart = itemsApart(link, items);
  if (!apart) {
    return undefined;
  }
  const [sourceItem, targetItem] = apart;
  const source = shifted(link.source, shifts.get(link.sourceItem) ?? 0);
  const target = shifted(link.target, shifts.get(link.targetItem) ?? 0);
  if (targetItem.y >= bottom(sourceItem)) {
    return {
      start: { x: centreX(source), y: bottom(source) },
      end: { x: centreX(target), y: target.y },
      ...gapBetween(sourceItem, targetItem),
    };
  }
  return {
    start: { x: centreX(source), y: source.y },
    end: { x: centreX(target), y: bottom(target) },
    ...gapBetween(targetItem, sourceItem),
  };
}

function gapBetween(upper: Rect, lower: Rect) {
  const [gapTop, gapBottom] = [bottom(upper), lower.y];
  return { gap: (gapTop + gapBottom) / 2, gapTop, gapBottom };
}

/** The boxes of a link's two items, when neither shares its band with the other. */
function itemsApart(link: RowLink, items: ReadonlyMap<string, RowItem>): [Rect, Rect] | undefined {
  const source = items.get(link.sourceItem)?.rect;
  const target = items.get(link.targetItem)?.rect;
  return source && target && !shareBand(source, target) ? [source, target] : undefined;
}

const isStraight = ({ start, end }: { start: P; end: P }) =>
  Math.abs(start.x - end.x) < STRAIGHT_EPS;

/** Straight when the two ends line up, else a Z through the gap. */
export function routeBetween({ start, end, gap }: LinkEnds): P[] {
  if (isStraight({ start, end })) {
    return [start, { x: start.x, y: end.y }];
  }
  return [start, { x: start.x, y: gap }, { x: end.x, y: gap }, end];
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
  const best = slides.reduce((a, b) =>
    straight(b) > straight(a) || (straight(b) === straight(a) && Math.abs(b) < Math.abs(a)) ? b : a
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

export interface SideEnd {
  ends: LinkEnds;
  at: 'start' | 'end';
  node: Rect;
  /** The span across the flow that a frame's title takes above this side, if any. */
  title?: readonly [number, number];
}

/**
 * The stretch of a node's side the ends may use: clear of its corners, and clear of the title of
 * its frame when the rest of the side still holds them all.
 */
function freeRange({ x, width }: Rect, count: number, title?: readonly [number, number]) {
  const side: [number, number] = [x + END_SPACING, x + width - END_SPACING];
  if (!title || title[1] <= side[0] || title[0] >= side[1]) {
    return side;
  }
  const left: [number, number] = [side[0], Math.min(side[1], title[0])];
  const right: [number, number] = [Math.max(side[0], title[1]), side[1]];
  const wider = left[1] - left[0] >= right[1] - right[0] ? left : right;
  return wider[1] - wider[0] >= (count - 1) * END_SPACING ? wider : side;
}

/**
 * Spread the ends that meet on one side of one node, so their arrowheads stay apart. Each end
 * wishes to sit opposite the other end of its link, where its line can run straight; the ends are
 * kept at least {@link END_SPACING} apart and further where the side has room, and a node's side
 * with a single end keeps it in the middle.
 */
export function spreadSharedEnds(sides: ReadonlyMap<string, readonly SideEnd[]>): void {
  for (const ends of sides.values()) {
    if (ends.length < 2) {
      continue;
    }
    const [low, high] = freeRange(ends[0].node, ends.length, ends[0].title);
    const room = Math.max(high - low, 0);
    const spacing = Math.min(Math.max(END_SPACING, room / ends.length), room / (ends.length - 1));
    const wishes = ends.map(({ ends: link, at }) => (at === 'start' ? link.end.x : link.start.x));
    const gap = Math.max(spacing, END_SPACING);
    const inOrder = slideToWishes(packAlong(wishes, low, high, gap), wishes, low, high);
    const pinned = pinStraight(wishes, low, high, gap);
    const best = straightCount(pinned, wishes) > straightCount(inOrder, wishes) ? pinned : inOrder;
    best.forEach((position, index) => {
      const { ends: link, at } = ends[index];
      link[at] = { ...link[at], x: position };
    });
  }
}

/**
 * Orders two turning links of one gap from the upper lane to the lower. A link that runs left
 * turns below one that starts left of it, and a link that runs right below one that starts right
 * of it, so the horizontal run of one never cuts the vertical run of the other; links running
 * left take the upper lanes.
 */
function byLane(a: LinkEnds, b: LinkEnds): number {
  const [upperA, lowerA] = a.start.y < a.end.y ? [a.start, a.end] : [a.end, a.start];
  const [upperB, lowerB] = b.start.y < b.end.y ? [b.start, b.end] : [b.end, b.start];
  const leftA = lowerA.x < upperA.x;
  const leftB = lowerB.x < upperB.x;
  if (leftA !== leftB) {
    return leftA ? -1 : 1;
  }
  return leftA ? upperA.x - upperB.x : upperB.x - upperA.x;
}

/**
 * Give each link that turns in a gap its own lane, spread evenly across the gap, so no two
 * horizontal runs lie on top of each other. A gap with one turning link keeps it in the middle.
 */
export function assignLanes(all: readonly LinkEnds[]): void {
  const bundles = new Map<string, LinkEnds[]>();
  for (const ends of all.filter((ends) => !isStraight(ends))) {
    const key = `${ends.gapTop} ${ends.gapBottom}`;
    bundles.set(key, [...(bundles.get(key) ?? []), ends]);
  }
  for (const bundle of bundles.values()) {
    const { gapTop, gapBottom } = bundle[0];
    const step = (gapBottom - gapTop) / (bundle.length + 1);
    [...bundle].sort(byLane).forEach((ends, rank) => {
      ends.gap = gapTop + step * (rank + 1);
    });
  }
}

/** Group the ends of the links by the node and side they meet. */
function endsBySide(
  planned: readonly { link: RowLink; ends: LinkEnds; source: Rect; target: Rect }[],
  titles: ReadonlyMap<string, readonly [number, number]>
): Map<string, SideEnd[]> {
  const sides = new Map<string, SideEnd[]>();
  const add = (key: string, end: SideEnd) => sides.set(key, [...(sides.get(key) ?? []), end]);
  const titleOver = (point: P, node: Rect, item: string) =>
    point.y === node.y ? titles.get(item) : undefined;
  for (const { link, ends, source, target } of planned) {
    add(`${link.sourceNode} ${ends.start.y}`, {
      ends,
      at: 'start',
      node: source,
      title: titleOver(ends.start, source, link.sourceItem),
    });
    add(`${link.targetNode} ${ends.end.y}`, {
      ends,
      at: 'end',
      node: target,
      title: titleOver(ends.end, target, link.targetItem),
    });
  }
  return sides;
}

/**
 * Where each frame's title will sit across the flow, when titles sit on the side links come in
 * from (a top-to-bottom diagram): centred on the frame as it will be painted, which for stacked
 * frames is their common span.
 */
export function titleSpans(
  children: readonly ElkBox[],
  frames: ReadonlyMap<string, Rect>,
  direction: ElkDirection
): Map<string, readonly [number, number]> {
  const titles = new Map<string, readonly [number, number]>();
  if (direction !== 'DOWN') {
    return titles;
  }
  const spans = paintedSpans(frames);
  for (const child of children) {
    const span = spans.get(child.id);
    if (span) {
      const half = (child.labels?.[0]?.width ?? 0) / 2 + TITLE_CLEARANCE;
      const centre = span.start + span.size / 2;
      titles.set(child.id, [centre - half, centre + half]);
    }
  }
  return titles;
}

/** The span each frame will be painted with: the common one for stacked frames, else its own. */
function paintedSpans(
  frames: ReadonlyMap<string, Rect>
): Map<string, { start: number; size: number }> {
  const stacked = [...frames].filter(([id, rect]) =>
    [...frames].every(([other, otherRect]) => other === id || !shareBand(rect, otherRect))
  );
  const common = stacked.length > 1 ? commonSpan(stacked.map(([, rect]) => rect)) : undefined;
  return new Map(
    [...frames].map(([id, rect]) => [
      id,
      common && stacked.some(([other]) => other === id)
        ? common
        : { start: rect.x, size: rect.width },
    ])
  );
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
  labels?: { width?: number }[];
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
      sourceNode: sourceId,
      targetNode: targetId,
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
  const planned = links.flatMap(({ link, edge }) => {
    const ends = linkEnds(link, items, shifts);
    const at = (rect: Rect, item: string) => shifted(rect, shifts.get(item) ?? 0);
    return ends
      ? [
          {
            link,
            edge,
            ends,
            source: at(link.source, link.sourceItem),
            target: at(link.target, link.targetItem),
          },
        ]
      : [];
  });
  const frames = new Map(
    [...movedItems].filter(([id]) => separated.has(id)).map(([id, { rect }]) => [id, rect])
  );
  spreadSharedEnds(endsBySide(planned, titleSpans(children, frames, direction)));
  assignLanes(planned.map(({ ends }) => ends));
  for (const { link, edge, ends } of planned) {
    const route = routeBetween(ends);
    applyRoute(edge, route, frameCrossings(route, link, movedItems, separated), direction);
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
