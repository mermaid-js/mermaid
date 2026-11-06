import type { TreeData } from './find-common-ancestor.js';
import type { ElkDirection, ElkEdgeLike } from './groupPorts.js';

/** A node of the laid-out ELK graph, by its position relative to its parent. */
export interface JustifyBox {
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  children?: JustifyBox[];
}

/** The axis across the flow, along which rows are spread: its position and its size. */
interface Axis {
  pos: 'x' | 'y';
  size: 'width' | 'height';
  /** The other axis, along the flow. */
  along: 'x' | 'y';
  depth: 'width' | 'height';
}

/** Rows are spread across a downward or rightward flow; the reversed flows are left as they are. */
const AXES: Partial<Record<ElkDirection, Axis>> = {
  DOWN: { pos: 'x', size: 'width', along: 'y', depth: 'height' },
  RIGHT: { pos: 'y', size: 'height', along: 'x', depth: 'width' },
};

/** Room kept on each side of a label that sits in the gap between two columns. */
export const LABEL_GAP_PADDING = 12;
/**
 * The widest gap between two nodes of a row that holds a link, in widths of its widest node: a row
 * spread wider is centred instead, so a short link does not become a line across the diagram.
 */
export const MAX_LINKED_GAP_NODE_WIDTHS = 3;
const EPS = 0.01;

const start = (box: JustifyBox, axis: Axis) => box[axis.pos] ?? 0;
const end = (box: JustifyBox, axis: Axis) => start(box, axis) + (box[axis.size] ?? 0);

/**
 * Group boxes into slots across the flow: boxes whose spans across it overlap share a slot, so a
 * node stacked above another in a row moves with it.
 */
export function slotsOf(boxes: readonly JustifyBox[], axis: Axis): JustifyBox[][] {
  const sorted = [...boxes].sort((a, b) => start(a, axis) - start(b, axis));
  const slots: JustifyBox[][] = [];
  for (const box of sorted) {
    const last = slots[slots.length - 1];
    if (last && start(box, axis) < Math.max(...last.map((other) => end(other, axis))) - EPS) {
      last.push(box);
    } else {
      slots.push([box]);
    }
  }
  return slots;
}

const slotStart = (slot: readonly JustifyBox[], axis: Axis) =>
  Math.min(...slot.map((box) => start(box, axis)));
const slotSize = (slot: readonly JustifyBox[], axis: Axis) =>
  Math.max(...slot.map((box) => end(box, axis))) - slotStart(slot, axis);

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

/** The room kept inside a frame before its first slot and after its last, or one for both. */
export type Padding = number | readonly [number, number];
const padsOf = (pad: Padding): readonly [number, number] =>
  typeof pad === 'number' ? [pad, pad] : pad;

/**
 * The size a frame needs across the flow to hold its slots inside its padding, with at least
 * `gaps[i]` between slot `i` and the next; a missing gap is 0.
 */
export function neededSize(
  slots: readonly JustifyBox[][],
  pad: Padding,
  gaps: readonly number[],
  axis: Axis
): number {
  const inner = sum(gaps.slice(0, Math.max(slots.length - 1, 0)));
  return sum(slots.map((slot) => slotSize(slot, axis))) + inner + sum(padsOf(pad));
}

/**
 * Share `room` out over gaps as equally as their least sizes allow: every gap gets one common
 * size, except a gap whose least size is larger, which keeps that.
 */
export function shareGaps(least: readonly number[], room: number): number[] {
  const fixed = new Set<number>();
  const commonSize = () => {
    const free = least.length - fixed.size;
    return free > 0 ? (room - sum([...fixed].map((index) => least[index]))) / free : 0;
  };
  let grown = least.findIndex((size) => size > commonSize());
  while (grown >= 0) {
    fixed.add(grown);
    grown = least.findIndex((size, index) => !fixed.has(index) && size > commonSize());
  }
  const common = commonSize();
  return least.map((size, index) => (fixed.has(index) ? size : common));
}

/**
 * How far to move each box across the flow so the slots span a frame of `size` inside its
 * padding, with gaps as equal as their least sizes in `gaps` allow. No gap grows past `maxGap` unless
 * its least size needs it; slots that then fall short of the span are centred in it, as a single
 * slot is.
 *
 * @returns the move of each box, by its id
 */
export function justifySlots(
  slots: readonly JustifyBox[][],
  size: number,
  pad: Padding,
  axis: Axis,
  gaps: readonly number[] = [],
  maxGap = Infinity
): Map<string, number> {
  const [before, after] = padsOf(pad);
  const sizes = slots.map((slot) => slotSize(slot, axis));
  const least = slots.slice(1).map((_, index) => gaps[index] ?? 0);
  const room = size - before - after - sum(sizes);
  const shared = shareGaps(least, room).map((gap, index) =>
    Math.min(gap, Math.max(maxGap, least[index]))
  );
  const moves = new Map<string, number>();
  let at = before + (room - sum(shared)) / 2;
  slots.forEach((slot, index) => {
    const delta = at - slotStart(slot, axis);
    for (const box of slot) {
      moves.set(box.id, delta);
    }
    at += sizes[index] + (shared[index] ?? 0);
  });
  return moves;
}

/**
 * Move the links ELK routed inside a frame with the nodes they join. A link whose two ends move
 * alike moves whole; a straight link between two slots stretches. Any other link cannot follow.
 *
 * @returns false, changing nothing, when some link inside the frame cannot follow
 */
export function moveInnerEdges(
  edges: readonly ElkEdgeLike[],
  frameId: string,
  moves: ReadonlyMap<string, number>,
  axis: Axis
): boolean {
  const inner = edges.filter((edge) => edge.container === frameId);
  const plans = inner.map((edge) => edgeMove(edge, moves));
  if (plans.includes(undefined)) {
    return false;
  }
  inner.forEach((edge, index) => applyEdgeMove(edge, plans[index] ?? [0, 0], axis));
  return true;
}

/** How far the two ends of an inner link move, if the link can follow them. */
function edgeMove(
  edge: ElkEdgeLike,
  moves: ReadonlyMap<string, number>
): [number, number] | undefined {
  const from = moves.get(edge.sources[0]) ?? 0;
  const to = moves.get(edge.targets[0]) ?? 0;
  return Math.abs(from - to) < EPS || bendCount(edge) === 0 ? [from, to] : undefined;
}

function bendCount(edge: ElkEdgeLike): number {
  return edge.sections?.[0]?.bendPoints?.length ?? 0;
}

function applyEdgeMove(edge: ElkEdgeLike, [from, to]: [number, number], { pos }: Axis): void {
  const section = edge.sections?.[0];
  if (section) {
    section.startPoint = { ...section.startPoint, [pos]: section.startPoint[pos] + from };
    section.endPoint = { ...section.endPoint, [pos]: section.endPoint[pos] + to };
    section.bendPoints = section.bendPoints?.map((point) => ({
      ...point,
      [pos]: point[pos] + from,
    }));
  }
  for (const label of edge.labels ?? []) {
    label[pos] = (label[pos] ?? 0) + (from + to) / 2;
  }
}

/** Is `id` the frame `frameId` or anything inside it? */
function isInside(id: string, frameId: string, tree: TreeData): boolean {
  for (let current: string | undefined = id; current; current = tree.parentById[current]) {
    if (current === frameId) {
      return true;
    }
  }
  return false;
}

/** The widest main label of a link with an end inside `frameId`, or 0. */
function widestLabel(
  frameId: string,
  edges: readonly ElkEdgeLike[],
  tree: TreeData,
  axis: Axis
): number {
  const inside = (id: string) => isInside(id, frameId, tree);
  const widths = edges
    .filter((edge) => inside(edge.sources[0]) || inside(edge.targets[0]))
    .map((edge) => edge.labels?.[0]?.[axis.size] ?? 0);
  return Math.max(0, ...widths);
}

/**
 * The least gap after each slot of a row: room for the widest label of a link inside the row
 * between that slot and the next, or 0 where no labelled link joins them.
 */
function labelGaps(
  frameId: string,
  slots: readonly JustifyBox[][],
  edges: readonly ElkEdgeLike[],
  axis: Axis
): number[] {
  const slotIndex = new Map(slots.flatMap((slot, index) => slot.map(({ id }) => [id, index])));
  const gaps = slots.slice(1).map(() => 0);
  for (const edge of edges.filter(({ container }) => container === frameId)) {
    const gap = gapBetween(slotIndex.get(edge.sources[0]), slotIndex.get(edge.targets[0]));
    const width = edge.labels?.[0]?.[axis.size] ?? 0;
    if (gap !== undefined && width > 0) {
      gaps[gap] = Math.max(gaps[gap], width + 2 * LABEL_GAP_PADDING);
    }
  }
  return gaps;
}

/** The gap between two neighbouring slots, by the index of the first; none for any other pair. */
function gapBetween(from?: number, to?: number): number | undefined {
  return from !== undefined && to !== undefined && Math.abs(from - to) === 1
    ? Math.min(from, to)
    : undefined;
}

/** Do two boxes overlap along the flow, so that they lie side by side rather than stacked? */
function sideBySide(a: JustifyBox, b: JustifyBox, axis: Axis): boolean {
  const [a0, a1] = [a[axis.along] ?? 0, (a[axis.along] ?? 0) + (a[axis.depth] ?? 0)];
  const [b0, b1] = [b[axis.along] ?? 0, (b[axis.along] ?? 0) + (b[axis.depth] ?? 0)];
  return a0 < b1 - EPS && b0 < a1 - EPS;
}

export interface JustifyInput {
  children: JustifyBox[];
  edges: readonly ElkEdgeLike[];
  separated: ReadonlyMap<string, ElkDirection>;
  /** The groups of arranged frames; a frame holding one is a band of columns. */
  groups: readonly { frames: string[] }[];
  direction: ElkDirection;
  tree: TreeData;
  /** Which frames to spread, by id and whether the frame is a band; all of them when absent. */
  include?: (id: string, band: boolean) => boolean;
}

interface Row {
  frame: JustifyBox;
  band: boolean;
  slots: JustifyBox[][];
  /**
   * The room ELK left before the first slot, and after the last: no more than before it, since a
   * frame wider than its slots has slack there, not padding, while a frame's title can make the
   * room before the first slot the larger.
   */
  pad: readonly [number, number];
  /** The least gap after each slot but the last. */
  gaps: number[];
  /** The widest a gap may grow when the row is spread. */
  maxGap: number;
  needed: number;
}

/** A stacked frame's slots: its columns when it is a band, else its nodes, and what it needs. */
function rowOf(frame: JustifyBox, input: JustifyInput, axis: Axis): Row | undefined {
  const children = frame.children ?? [];
  const band = input.groups.some(({ frames }) =>
    frames.every((id) => children.some((child) => child.id === id))
  );
  if (children.length === 0) {
    return undefined;
  }
  const slots = slotsOf(children, axis);
  const before = Math.min(...children.map((child) => start(child, axis)));
  const left = (frame[axis.size] ?? 0) - Math.max(...children.map((child) => end(child, axis)));
  const pad: readonly [number, number] = [before, Math.min(before, left)];
  const gaps = band
    ? slots
        .slice(1)
        .map(() => widestLabel(frame.id, input.edges, input.tree, axis) + 2 * LABEL_GAP_PADDING)
    : labelGaps(frame.id, slots, input.edges, axis);
  const linked = !band && input.edges.some(({ container }) => container === frame.id);
  const maxGap = linked
    ? MAX_LINKED_GAP_NODE_WIDTHS * Math.max(...slots.map((slot) => slotSize(slot, axis)))
    : Infinity;
  return { frame, band, slots, pad, gaps, maxGap, needed: neededSize(slots, pad, gaps, axis) };
}

/** The arranged frames sitting directly in the diagram one under another, as rows to spread. */
function stackedRows(input: JustifyInput, axis: Axis): Row[] {
  const frames = input.children.filter((child) => input.separated.has(child.id));
  const stacked = frames.filter((frame) =>
    frames.every((other) => other === frame || !sideBySide(frame, other, axis))
  );
  return stacked.flatMap((frame) => rowOf(frame, input, axis) ?? []);
}

/** The frames {@link justifyFrames} would spread, and whether each is a band of columns. */
/**
 * The frames {@link justifyFrames} would spread, whether each is a band of columns, and whether
 * it is a row it would put over the columns of the band beside it.
 */
export function rowsToJustify(
  input: JustifyInput
): { id: string; band: boolean; overBand: boolean }[] {
  const axis = AXES[input.direction];
  const rows = axis ? stackedRows(input, axis) : [];
  return rows.map((row) => ({
    id: row.frame.id,
    band: row.band,
    overBand: !!axis && !row.band && overBandCentres(row, rows, input, axis) !== undefined,
  }));
}

/**
 * Spread the arranged frames that sit directly in the diagram, one under another, over one common
 * span across the flow, and spread what each holds over its whole span with equal gaps: the
 * columns of a band, the nodes of a row. A band is widened first, if need be, so that the gap
 * between two of its columns holds the widest label of a link into it, and a row so that the gap
 * between two of its nodes holds the label of the link between them. A row whose inner links
 * cannot follow its nodes keeps its layout.
 *
 * @returns the frames spread; the others are left to be shifted into line with their links
 */
export function justifyFrames(input: JustifyInput): Set<string> {
  const axis = AXES[input.direction];
  const rows = axis ? stackedRows(input, axis) : [];
  if (!axis || rows.length === 0) {
    return new Set();
  }
  const from = Math.min(...rows.map(({ frame }) => start(frame, axis)));
  const size = Math.max(
    ...rows.map(({ frame, needed }) => Math.max(end(frame, axis) - from, needed))
  );
  const include = input.include ?? (() => true);
  const chosen = rows.filter((row) => include(row.frame.id, row.band));
  const spread = (row: Row, moves?: Map<string, number>) =>
    spreadRow(row, [from, size], input.edges, axis, moves) ? [row.frame.id] : [];
  const bands = chosen.filter(({ band }) => band).flatMap((row) => spread(row));
  const plain = chosen
    .filter(({ band }) => !band)
    .flatMap((row) => spread(row, columnMoves(row, rows, size, input, axis)));
  return new Set([...bands, ...plain]);
}

/** The band stacked right after `row` along the flow, or else the one right before it. */
function neighbourBand(row: Row, rows: readonly Row[], axis: Axis): Row | undefined {
  const along = [...rows].sort((a, b) => (a.frame[axis.along] ?? 0) - (b.frame[axis.along] ?? 0));
  const index = along.indexOf(row);
  return [along[index + 1], along[index - 1]].find((other) => other?.band);
}

/**
 * Where to centre each slot of a row stacked next to a band: over the band's column of the same
 * place when the row has as many slots as the band has columns, or else over the one column each
 * slot links to, when every slot links to exactly one and they keep their order.
 */
function columnCentres(row: Row, band: Row, input: JustifyInput, axis: Axis): number[] | undefined {
  const columns = band.slots.map((slot) => slotStart(slot, axis) + slotSize(slot, axis) / 2);
  if (row.slots.length === columns.length) {
    return columns;
  }
  const linked = row.slots.map((slot) => linkedColumns(slot, band, input));
  const picks = linked.map((indexes) => (indexes.length === 1 ? indexes[0] : -1));
  const ordered = picks.every(
    (pick, index) => pick >= 0 && (index === 0 || pick > picks[index - 1])
  );
  return ordered ? picks.map((pick) => columns[pick]) : undefined;
}

/** The places of the band's columns that a node of `slot` links to. */
function linkedColumns(slot: readonly JustifyBox[], band: Row, { edges, tree }: JustifyInput) {
  const inSlot = (id: string) => slot.some((box) => isInside(id, box.id, tree));
  const columnOf = (id: string) =>
    band.slots.findIndex((column) => column.some((box) => isInside(id, box.id, tree)));
  const places = edges.flatMap(({ sources, targets }) => {
    const [a, b] = [sources[0], targets[0]];
    return [inSlot(a) ? columnOf(b) : -1, inSlot(b) ? columnOf(a) : -1].filter((at) => at >= 0);
  });
  return [...new Set(places)];
}

/** Where to centre the slots of a row over the band next to it, if it has one. */
function overBandCentres(row: Row, rows: readonly Row[], input: JustifyInput, axis: Axis) {
  const band = neighbourBand(row, rows, axis);
  return band && columnCentres(row, band, input, axis);
}

/**
 * The moves that centre a row's slots over the columns of the band next to it, if they keep
 * every gap at least its least size and the slots inside the frame's padding.
 */
function columnMoves(
  row: Row,
  rows: readonly Row[],
  size: number,
  input: JustifyInput,
  axis: Axis
): Map<string, number> | undefined {
  const centres = overBandCentres(row, rows, input, axis);
  if (!centres) {
    return undefined;
  }
  const starts = row.slots.map((slot, index) => centres[index] - slotSize(slot, axis) / 2);
  const ends = row.slots.map((slot, index) => starts[index] + slotSize(slot, axis));
  const fits =
    starts[0] >= row.pad[0] - EPS &&
    ends[ends.length - 1] <= size - row.pad[1] + EPS &&
    starts.slice(1).every((at, index) => at - ends[index] >= (row.gaps[index] ?? 0) - EPS);
  return fits ? slotMoves(row.slots, starts, axis) : undefined;
}

function slotMoves(slots: readonly JustifyBox[][], starts: readonly number[], axis: Axis) {
  return new Map(
    slots.flatMap((slot, index) =>
      slot.map((box) => [box.id, starts[index] - slotStart(slot, axis)] as const)
    )
  );
}

/** Spread one row over `span`, or move its slots by `moves`, unless a link inside it cannot follow its nodes. */
function spreadRow(
  { frame, slots, pad, gaps, maxGap }: Row,
  [from, size]: readonly [number, number],
  edges: readonly ElkEdgeLike[],
  axis: Axis,
  given?: Map<string, number>
): boolean {
  const moves = given ?? justifySlots(slots, size, pad, axis, gaps, maxGap);
  if (!moveInnerEdges(edges, frame.id, moves, axis)) {
    return false;
  }
  for (const child of frame.children ?? []) {
    child[axis.pos] = start(child, axis) + (moves.get(child.id) ?? 0);
  }
  frame[axis.pos] = from;
  frame[axis.size] = size;
  return true;
}
