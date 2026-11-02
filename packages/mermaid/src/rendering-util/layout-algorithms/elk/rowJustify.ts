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

/** The size a frame needs across the flow to hold its slots `gap` apart inside its padding. */
export function neededSize(
  slots: readonly JustifyBox[][],
  pad: number,
  gap: number,
  axis: Axis
): number {
  const total = slots.reduce((sum, slot) => sum + slotSize(slot, axis), 0);
  return total + Math.max(slots.length - 1, 0) * gap + 2 * pad;
}

/**
 * How far to move each box across the flow so the slots span a frame of `size` with equal gaps
 * between them and `pad` at both ends; a single slot is centred.
 *
 * @returns the move of each box, by its id
 */
export function justifySlots(
  slots: readonly JustifyBox[][],
  size: number,
  pad: number,
  axis: Axis
): Map<string, number> {
  const sizes = slots.map((slot) => slotSize(slot, axis));
  const total = sizes.reduce((sum, value) => sum + value, 0);
  const gap = slots.length > 1 ? (size - 2 * pad - total) / (slots.length - 1) : 0;
  const moves = new Map<string, number>();
  let at = slots.length > 1 ? pad : (size - total) / 2;
  slots.forEach((slot, index) => {
    const delta = at - slotStart(slot, axis);
    for (const box of slot) {
      moves.set(box.id, delta);
    }
    at += sizes[index] + gap;
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

/** The widest main label of a link with an end inside `frameId`, or 0. */
function widestLabel(
  frameId: string,
  edges: readonly ElkEdgeLike[],
  tree: TreeData,
  axis: Axis
): number {
  const inside = (id: string) => {
    for (let current: string | undefined = id; current; current = tree.parentById[current]) {
      if (current === frameId) {
        return true;
      }
    }
    return false;
  };
  const widths = edges
    .filter((edge) => inside(edge.sources[0]) || inside(edge.targets[0]))
    .map((edge) => edge.labels?.[0]?.[axis.size] ?? 0);
  return Math.max(0, ...widths);
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
  pad: number;
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
  const pad = Math.min(...children.map((child) => start(child, axis)));
  const gap = band
    ? widestLabel(frame.id, input.edges, input.tree, axis) + 2 * LABEL_GAP_PADDING
    : 0;
  return { frame, band, slots, pad, needed: neededSize(slots, pad, gap, axis) };
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
export function rowsToJustify(input: JustifyInput): { id: string; band: boolean }[] {
  const axis = AXES[input.direction];
  return axis ? stackedRows(input, axis).map(({ frame, band }) => ({ id: frame.id, band })) : [];
}

/**
 * Spread the arranged frames that sit directly in the diagram, one under another, over one common
 * span across the flow, and spread what each holds over its whole span with equal gaps: the
 * columns of a band, the nodes of a row. A band is widened first, if need be, so that the gap
 * between two of its columns holds the widest label of a link into it. A row whose inner links
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
  return new Set(
    chosen.flatMap((row) => (spreadRow(row, [from, size], input.edges, axis) ? [row.frame.id] : []))
  );
}

/** Spread one row over `span`, unless a link inside it cannot follow its nodes. */
function spreadRow(
  { frame, slots, pad }: Row,
  [from, size]: readonly [number, number],
  edges: readonly ElkEdgeLike[],
  axis: Axis
): boolean {
  const moves = justifySlots(slots, size, pad, axis);
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
