// Based on Pele (https://github.com/obsidianmd/pele), src/layout/layered.ts.
// Copyright (c) 2026 kepano. MIT License: see packages/mermaid/THIRD_PARTY_NOTICES.
// Ported from mermaid-v13 `packages/core/src/layout/layered/layered.ts`.
// Changes from Pele: `const enum`s are `as const` objects, and index reads carry `!` for
// noUncheckedIndexedAccess. `NODE_INPUTS`/`EDGE_INPUTS`/`layoutInputs` are new. `ease` moved to
// rendering-elements/routeGeometry.ts (re-exported here) so edge drawing can share it without
// depending on the engine. The algorithm
// is unchanged.
// cspell:ignore kepano lnode lnodes indeg topo cand maxs Köpf
import { ease } from '../../rendering-elements/routeGeometry.js';

// Layered (Sugiyama-style) layout of one flat graph. Ranks run down the y axis; callers
// rotate the result for other directions.
//
// What the layout of edges aims for, most important first. Where two aims pull apart, the one
// higher up decides, and each names where it is carried out.
//
// 1. Lines can be told apart. No two touch or run along each other, and none runs through a
//    node or a label. Ends on one side of a node have places of their own (`spread`), and
//    curves that would pass within a few pixels turn at levels of their own (`assignTracks`).
// 2. Lines cross as little as the order of the nodes allows (`reduceCrossings`, and the order
//    of the levels in `assignTracks`).
// 3. An edge takes the shortest and simplest way: straight if it can, else one curve, else a
//    curve with a level run. One that passes several ranks runs in line with one of its ends
//    and turns once, at the other (`alignLabels`, `straighten`). Ends slide along their sides,
//    and nodes move a little, where that makes an edge straight (`settle`, `snap`).
// 4. An edge meets the middle of a side. An end with a side to itself stays there, and ends
//    that share a side sit around the middle in the order of where they lead. An end moves off
//    the middle only for the aims above (`settle`).
// 5. The drawing is balanced, and what is alike is drawn alike. A label sits midway along the
//    line that shows, the curves either side of it have much the same room to turn in, and a gap
//    whose curves mostly cross has them all as the same plain curve rather than each on a
//    level of its own (`headRoom` in `layered`, the crossed gaps in `assignTracks`).
// 6. An edge leaves and reaches a node square to it, and an arrowhead points straight at the
//    node (`routePath` in rendering-util, which draws the routes).
// 7. Nodes keep the order they were written in, where nothing above says otherwise.
// 8. The drawing stays compact. A gap between ranks grows only to hold the levels in it, or
//    to let curves that cross do so at a clear angle.

export const Kind = { Node: 0, Dummy: 1, Label: 2, StartPort: 3, EndPort: 4 } as const;
export type Kind = (typeof Kind)[keyof typeof Kind];

export interface LNode {
  w: number;
  h: number;
  kind: Kind;
  pin: number;
  // Port's cross-flow destination; NaN if unknown. Fully hinted port ranks keep this order.
  hint: number;
  // Initial cross-flow position; NaN if unknown. Used only when every node in a rank has one.
  key: number;
  // How much of the side that edges meet may be shared out between them; 0 keeps them all at its middle.
  span: number;
  x: number;
  y: number;
  rank: number;
}

export interface LEdge {
  tail: number;
  head: number;
  minlen: number;
  labelW: number;
  labelH: number;
  tailDx: number;
  headDx: number;
  // An end that is held where its offset puts it, and takes no part in sharing out a node's side.
  tailFixed: boolean;
  headFixed: boolean;
  reversed: boolean;
  points: number[];
  labelX: number;
  labelY: number;
}

export interface LayeredOptions {
  nodeSep: number;
  edgeSep: number;
  rankSep: number;
  portSep: number;
  // Route edges at right angles, each on a track of its own across the gap between two ranks.
  tracks?: boolean;
  // Draw every edge straight from point to point: none is given a level to turn onto.
  straight?: boolean;
  // The caller sets the ends of the edges on one side of a node apart itself, so two edges
  // between the same two nodes need no bend to keep them from being drawn as one.
  apart?: boolean;
  // The room that the marker at the head of an edge takes. A rank of labels whose edges all
  // head the same way sits half of this nearer their tails, so that each label is midway along
  // the line that shows, and the curves either side of it have the same room to turn in.
  headRoom?: number;
  // Keep each group contiguous within ranks. `of` maps nodes to groups; `parent` maps groups
  // to parents. Both use -1 for none.
  groups?: { of: Int32Array; parent: Int32Array };
  // Compute cross-flow positions in `x` without full routing.
  orderOnly?: boolean;
}

export interface LayeredResult {
  width: number;
  height: number;
  // With `orderOnly`: final crossings and crossings before grouping or reordering.
  crossings?: number;
  declared?: number;
}

/** The fields of {@link LNode} and {@link LEdge} that `layered` reads. The others are its output. */
export const NODE_INPUTS = [
  'w',
  'h',
  'kind',
  'pin',
  'hint',
  'key',
  'span',
] as const satisfies readonly (keyof LNode)[];
export const EDGE_INPUTS = [
  'tail',
  'head',
  'minlen',
  'labelW',
  'labelH',
  'tailDx',
  'headDx',
  'tailFixed',
  'headFixed',
] as const satisfies readonly (keyof LEdge)[];

/** Every input `layered` reads from `nodes` and `edges`. Equal inputs and options give equal layouts. */
export function layoutInputs(nodes: readonly LNode[], edges: readonly LEdge[]): number[] {
  const inputs: number[] = [];
  for (const n of nodes) for (const f of NODE_INPUTS) inputs.push(n[f]);
  for (const e of edges) for (const f of EDGE_INPUTS) inputs.push(+e[f]);
  return inputs;
}

export function lnode(w: number, h: number, kind: Kind = Kind.Node): LNode {
  return { w, h, kind, pin: 0, hint: NaN, key: NaN, span: 0, x: 0, y: 0, rank: 0 };
}

export function ledge(tail: number, head: number, minlen = 1, labelW = 0, labelH = 0): LEdge {
  return {
    tail,
    head,
    minlen,
    labelW,
    labelH,
    tailDx: 0,
    headDx: 0,
    tailFixed: false,
    headFixed: false,
    reversed: false,
    points: [],
    labelX: 0,
    labelY: 0,
  };
}

const MAX_SWEEPS = 24;

// An edge gets a bend point in every rank it skips. Past this many, the longest edges are
// drawn as one direct curve instead, which keeps huge graphs from exhausting time and memory.
const MAX_DUMMIES = 20000;

// The room between two edges that meet one side of a node, and the least that keeps their arrowheads apart.
const PORT_PITCH = 16;
const MIN_PITCH = 8;

// Where edges are not given levels, a gap between ranks grows to keep the edges that cross it at
// least this steep, up to this many times its usual height. Shallower than that, the edges of a
// wide rank are hard to tell apart.
const MIN_SLOPE = 0.125;
const MAX_GAP = 3;

// Tracks: the room kept clear between a rank and the nearest track, the room between two tracks
// when the gap has to grow to hold them, and the most they spread to when it has room to spare.
// Diverges from v13 (`pxProfile.engine.trackMargin` 18): mermaid's validateLayout counts a run
// across within 18px (+1px tolerance) of the node an edge arrives at as a bend at its end, where
// the arrowhead has no straight run to sit on, so the outer tracks keep 20px from the ranks.
const TRACK_MARGIN = 20;
const TRACK_PITCH = 10;
const TRACK_SPREAD = 14;
// A curve is one plain S unless it runs more than this many times as far across as the gap is
// high, and so does another that it would run along. Then each turns onto a level of its own
// to run across on. The levels of a gap keep this far from its ranks, to leave room to turn
// in, and from each other.
const LEVEL_WIDE = 2;
const LEVEL_MARGIN = 28;
const LEVEL_PITCH = 12;
// Two plain curves that would pass too near each other turn at levels of their own as well:
// nearer than LEVEL_CLEAR where one of them runs far across, since it stays near the other for
// a long way, and otherwise nearer than LEVEL_TOUCH. LEVEL_LEAD is the room a plain curve is
// taken to keep straight at each end of its gap.
const LEVEL_LEAD = 12;
const LEVEL_CLEAR = 8;
const LEVEL_TOUCH = 4;
// Levels tell apart curves that run alongside each other. Where the curves of a gap cross each
// other more often than that, runs along levels only make the crossings long and shallow, so
// each curve is one plain S instead, and the gap is made this many times as tall as its widest
// curve runs across (and no taller than MAX_GAP allows), for them to cross at a clear angle.
const CROSSED_SLOPE = 0.5;
// How far out of line two points may be and still count as in line.
const IN_LINE = 0.5;
// How far apart two edges may be at both ends and still count as twins.
const TWIN = 1;
// A node, with whatever it is already in line with, moves this far at most to bring one more of
// its edges into line.
const SNAP = 12;
// Bends with no node in line with them move this far at most to bring an edge into line.
const BEND_SNAP = 24;
// An end that cannot be brought into line leans towards where its edge goes, but keeps this far
// from the ends of the part of its side that edges spread along. On a narrow node that leaves
// it in the middle.
const LEAN_CLEAR = 40;
// Past this many edges across one gap, tracks are given out in a plain order: weighing every
// pair of edges against each other would take too long.
const MAX_WEIGHED = 400;
// Reuse curve-sampling buffers across layouts.
const SAMPLES = 16;
const LINE_A = new Float64Array(2 * SAMPLES + 2);
const LINE_B = new Float64Array(2 * SAMPLES + 2);

const End = { Held: 0, Leaves: 1, Arrives: 2 } as const;
type End = (typeof End)[keyof typeof End];

function isDummy(kind: number): boolean {
  return kind === Kind.Dummy || kind === Kind.Label;
}

// The room a label or bend keeps from its neighbour: a full gap from a node or between two of a
// kind, half of one otherwise.
function gapBetween(other: number, self: number, nodeSep: number, sep: number): number {
  if (other === Kind.Node) return nodeSep / 2 + sep / 2;
  return other === self ? sep : sep / 2;
}

function sortRange(
  list: Int32Array,
  from: number,
  to: number,
  key: Int32Array | Float64Array
): void {
  for (let i = from + 1; i < to; i++) {
    const item = list[i]!;
    const k = key[item]!;
    let j = i - 1;
    while (j >= from && (key[list[j]!]! > k || (key[list[j]!]! === k && list[j]! > item))) {
      list[j + 1] = list[j]!;
      j--;
    }
    list[j + 1] = item;
  }
}

// Avoid the comparator overhead of built-in sort.
function sortByBary(
  list: Int32Array,
  count: number,
  bary: Float64Array,
  pos: Int32Array,
  right: boolean,
  spare: Int32Array
): void {
  const before = (a: number, b: number): boolean =>
    bary[a]! < bary[b]! ||
    (bary[a]! === bary[b]! && (right ? pos[a]! > pos[b]! : pos[a]! < pos[b]!));
  const RUN = 8;
  for (let s = 0; s < count; s += RUN) {
    for (let i = s + 1, end = Math.min(count, s + RUN); i < end; i++) {
      const item = list[i]!;
      let j = i - 1;
      while (j >= s && before(item, list[j]!)) {
        list[j + 1] = list[j]!;
        j--;
      }
      list[j + 1] = item;
    }
  }
  let from = list;
  let to = spare;
  for (let width = RUN; width < count; width *= 2) {
    for (let s = 0; s < count; s += 2 * width) {
      const mid = Math.min(count, s + width);
      const end = Math.min(count, s + 2 * width);
      let i = s;
      let j = mid;
      let k = s;
      while (i < mid && j < end) to[k++] = before(from[j]!, from[i]!) ? from[j++]! : from[i++]!;
      while (i < mid) to[k++] = from[i++]!;
      while (j < end) to[k++] = from[j++]!;
    }
    const t = from;
    from = to;
    to = t;
  }
  if (from !== list) for (let i = 0; i < count; i++) list[i] = from[i]!;
}

export function layered(nodes: LNode[], edges: LEdge[], opt: LayeredOptions): LayeredResult {
  const real = nodes.length;
  if (real === 0) return { width: 0, height: 0 };
  const m = edges.length;
  if (real === 1 && m === 0 && nodes[0]!.kind === Kind.Node) {
    const node = nodes[0]!;
    node.rank = 0;
    node.x = node.w / 2;
    node.y = node.h / 2;
    return { width: node.w, height: node.h };
  }

  // Every edge gets a middle rank of its own when labels or parallel edges need the room.
  let step = 1;
  if (m > 0) {
    const seen = new Set<number>();
    for (const e of edges) {
      const a = Math.min(e.tail, e.head);
      const b = Math.max(e.tail, e.head);
      const key = a * real + b;
      if (e.labelW > 0 || seen.has(key)) {
        step = 2;
        break;
      }
      seen.add(key);
    }
  }

  orient(nodes, edges);
  rank(nodes, edges, step);

  const span = new Int32Array(m);
  let dummies = 0;
  for (let ei = 0; ei < m; ei++) {
    const e = edges[ei]!;
    span[ei] = Math.abs(nodes[e.head]!.rank - nodes[e.tail]!.rank);
    if (span[ei]! > 1) dummies += span[ei]! - 1;
  }
  const direct = new Uint8Array(m);
  if (dummies > MAX_DUMMIES) {
    const longest: number[] = [];
    for (let ei = 0; ei < m; ei++) if (span[ei]! > 1) longest.push(ei);
    longest.sort((a, b) => span[b]! - span[a]! || a - b);
    for (const ei of longest) {
      if (dummies <= MAX_DUMMIES) break;
      direct[ei] = 1;
      dummies -= span[ei]! - 1;
    }
  }

  const n = real + dummies;
  const W = new Float64Array(n);
  const H = new Float64Array(n);
  const KIND = new Uint8Array(n);
  const RANK = new Int32Array(n);
  let maxRank = 0;
  for (let i = 0; i < real; i++) {
    const node = nodes[i]!;
    W[i] = node.w;
    H[i] = node.h;
    KIND[i] = node.kind;
    RANK[i] = node.rank;
    if (node.rank > maxRank) maxRank = node.rank;
  }

  // The graph that gets ordered and positioned: every edge cut into rank-to-rank segments.
  let segments = 0;
  for (let ei = 0; ei < m; ei++) if (!direct[ei]!) segments += span[ei]!;
  const EF = new Int32Array(segments);
  const ET = new Int32Array(segments);
  const EFD = new Float64Array(segments);
  const ETD = new Float64Array(segments);
  const firstDummy = new Int32Array(m).fill(-1);
  // Which way the edges with a label in each rank head: 1 down, 2 up, 3 both.
  const heads = new Uint8Array(maxRank + 1);
  const labelNode = new Int32Array(m).fill(-1);
  let spans = false;
  for (let i = 0; i < real; i++)
    if (nodes[i]!.span > 0 && nodes[i]!.kind === Kind.Node) spans = true;
  // What each segment's end is to the node it meets, for the ends that may move along the node's side.
  const EFK = spans ? new Uint8Array(segments) : undefined;
  const ETK = spans ? new Uint8Array(segments) : undefined;
  const firstSeg = new Int32Array(m).fill(-1);
  const lastSeg = new Int32Array(m).fill(-1);
  const KEY = new Float64Array(n).fill(NaN);
  for (let i = 0; i < real; i++) KEY[i] = nodes[i]!.key;
  let offsets = false;
  {
    let next = real;
    let ce = 0;
    for (let ei = 0; ei < m; ei++) {
      if (direct[ei]!) continue;
      const e = edges[ei]!;
      const a = e.reversed ? e.head : e.tail;
      const b = e.reversed ? e.tail : e.head;
      const aDx = e.reversed ? e.headDx : e.tailDx;
      const bDx = e.reversed ? e.tailDx : e.headDx;
      if (aDx !== 0 || bDx !== 0) offsets = true;
      const ra = RANK[a]!;
      const rb = RANK[b]!;
      let labelRank = -1;
      if (e.labelW > 0) {
        // The label goes halfway along. An edge that passes ranks of nodes on its way has its
        // label in one of those, beside the nodes, where it takes no height of its own: the one
        // halfway, or of the two either side of halfway, the one nearer the node the edge starts
        // from, which is the lower when the edge runs against the flow. An edge between two
        // neighbouring ranks has its label in the rank between them.
        labelRank = ra + ((rb - ra) >> 1);
        if (step === 2 && rb - ra >= 4) {
          if ((labelRank & 1) === 1) labelRank += e.reversed ? 1 : -1;
        } else if (step === 2 && (labelRank & 1) === 0) labelRank += e.reversed ? 1 : -1;
      }
      let prev = a;
      if (rb - ra > 1) firstDummy[ei] = next;
      firstSeg[ei] = ce;
      if (EFK && !(e.reversed ? e.headFixed : e.tailFixed))
        EFK[ce] = e.reversed ? End.Arrives : End.Leaves;
      for (let r = ra + 1; r < rb; r++) {
        const d = next++;
        RANK[d] = r;
        KEY[d] = KEY[a]! + ((KEY[b]! - KEY[a]!) * (r - ra)) / (rb - ra);
        if (r === labelRank) {
          W[d] = e.labelW;
          H[d] = e.labelH;
          KIND[d] = Kind.Label;
          labelNode[ei] = d;
          heads[r]! |= e.reversed ? 2 : 1;
        } else {
          KIND[d] = Kind.Dummy;
        }
        EF[ce] = prev;
        ET[ce] = d;
        EFD[ce] = prev === a ? aDx : 0;
        ce++;
        prev = d;
      }
      EF[ce] = prev;
      ET[ce] = b;
      EFD[ce] = prev === a ? aDx : 0;
      ETD[ce] = bDx;
      if (ETK && !(e.reversed ? e.tailFixed : e.headFixed))
        ETK[ce] = e.reversed ? End.Leaves : End.Arrives;
      lastSeg[ei] = ce;
      ce++;
    }
  }

  // Bends belong to the innermost group containing both edge endpoints.
  let GRP: Int32Array | undefined;
  if (opt.groups) {
    const { of, parent } = opt.groups;
    GRP = new Int32Array(n);
    for (let i = 0; i < real; i++) GRP[i] = of[i]!;
    const depth = (gr: number): number => {
      let d = 0;
      for (; gr >= 0; gr = parent[gr]!) d++;
      return d;
    };
    const lca = (x: number, y: number): number => {
      let dx = depth(x);
      let dy = depth(y);
      for (; dx > dy; dx--) x = parent[x]!;
      for (; dy > dx; dy--) y = parent[y]!;
      while (x !== y) {
        x = parent[x]!;
        y = parent[y]!;
      }
      return x;
    };
    for (let ei = 0; ei < m; ei++) {
      if (firstDummy[ei]! < 0) continue;
      const e = edges[ei]!;
      const gr = lca(of[e.tail]!, of[e.head]!);
      for (let d = firstDummy[ei]!, end = d + span[ei]! - 1; d < end; d++) GRP[d] = gr;
    }
  }

  const succStart = new Int32Array(n + 1);
  const predStart = new Int32Array(n + 1);
  for (let e = 0; e < segments; e++) {
    succStart[EF[e]! + 1]!++;
    predStart[ET[e]! + 1]!++;
  }
  for (let i = 0; i < n; i++) {
    succStart[i + 1]! += succStart[i]!;
    predStart[i + 1]! += predStart[i]!;
  }
  const succE = new Int32Array(segments);
  const predE = new Int32Array(segments);
  {
    const sf = succStart.slice(0, n);
    const pf = predStart.slice(0, n);
    for (let e = 0; e < segments; e++) {
      succE[sf[EF[e]!]!++] = e;
      predE[pf[ET[e]!]!++] = e;
    }
  }

  const layerStart = new Int32Array(maxRank + 2);
  for (let i = 0; i < n; i++) layerStart[RANK[i]! + 1]!++;
  for (let r = 0; r <= maxRank; r++) layerStart[r + 1]! += layerStart[r]!;
  const order = new Int32Array(n);
  const pos = new Int32Array(n);

  // Initial order: depth-first from the top so that subtrees start out contiguous.
  {
    const byRank = new Int32Array(n);
    const fill = layerStart.slice(0, maxRank + 1);
    for (let i = 0; i < n; i++) byRank[fill[RANK[i]!]!++] = i;
    for (let r = 0; r <= maxRank; r++) fill[r] = layerStart[r]!;
    const visited = new Uint8Array(n);
    const stack: number[] = [];
    for (let k = 0; k < n; k++) {
      if (visited[byRank[k]!]!) continue;
      stack.push(byRank[k]!);
      while (stack.length > 0) {
        const v = stack.pop()!;
        if (visited[v]!) continue;
        visited[v] = 1;
        order[fill[RANK[v]!]!++] = v;
        for (let j = succStart[v + 1]! - 1; j >= succStart[v]!; j--) {
          const w = ET[succE[j]!]!;
          if (!visited[w]!) stack.push(w);
        }
      }
    }
  }

  const sortRank = (r: number, key: (v: number) => number): boolean => {
    const s = layerStart[r]!;
    const e = layerStart[r + 1]!;
    if (e - s < 2) return false;
    for (let i = s; i < e; i++) if (Number.isNaN(key(order[i]!))) return false;
    const layer = Array.from(order.subarray(s, e));
    const index = new Map<number, number>();
    layer.forEach((v, i) => index.set(v, i));
    layer.sort((a, b) => key(a) - key(b) || index.get(a)! - index.get(b)!);
    order.set(layer, s);
    return true;
  };
  for (let r = 0; r <= maxRank; r++) sortRank(r, (v) => KEY[v]!);

  let pinned = false;
  for (let i = 0; i < real; i++) if (nodes[i]!.pin !== 0) pinned = true;
  if (pinned) {
    for (let r = 0; r <= maxRank; r++) {
      const layer = Array.from(order.subarray(layerStart[r]!, layerStart[r + 1]!));
      const index = new Map<number, number>();
      layer.forEach((v, i) => index.set(v, i));
      const pinOf = (v: number): number => (v < real ? nodes[v]!.pin : 0);
      layer.sort((a, b) => pinOf(a) - pinOf(b) || index.get(a)! - index.get(b)!);
      order.set(layer, layerStart[r]!);
    }
  }
  // Preserve port order to avoid crossings outside the group.
  const fixed = new Uint8Array(maxRank + 1);
  const hint = (v: number): number =>
    v < real && (nodes[v]!.kind === Kind.StartPort || nodes[v]!.kind === Kind.EndPort)
      ? nodes[v]!.hint
      : NaN;
  for (const r of [0, maxRank]) if (sortRank(r, hint)) fixed[r] = 1;
  const setPositions = (): void => {
    for (let r = 0; r <= maxRank; r++) {
      const s = layerStart[r]!;
      for (let i = s, e = layerStart[r + 1]!; i < e; i++) pos[order[i]!] = i - s;
    }
  };
  setPositions();

  const g: Graph = {
    n,
    real,
    maxRank,
    W,
    KIND,
    RANK,
    EF,
    ET,
    EFD,
    ETD,
    succStart,
    succE,
    predStart,
    predE,
    layerStart,
    order,
    pos,
    offsets,
    fixed,
    GRP,
    groupParent: opt.groups?.parent,
  };

  let crossings = 0;
  let declared = 0;
  if (segments > 0 && maxRank > 0) {
    [crossings, declared] = reduceCrossings(g, nodes);
    setPositions();
  }
  if (opt.orderOnly) {
    // Points are (rank, cross-flow position) pairs.
    const at = position(g, opt);
    for (let i = 0; i < real; i++) nodes[i]!.x = at[i]!;
    for (let ei = 0; ei < m; ei++) {
      const e = edges[ei]!;
      const a = e.reversed ? e.head : e.tail;
      const b = e.reversed ? e.tail : e.head;
      const pts = [RANK[a]!, at[a]!];
      if (!direct[ei]! && firstDummy[ei]! >= 0)
        for (let d = firstDummy[ei]!, end = d + span[ei]! - 1; d < end; d++)
          pts.push(RANK[d]!, at[d]!);
      pts.push(RANK[b]!, at[b]!);
      e.points = pts;
    }
    return { width: 0, height: 0, crossings, declared };
  }

  if (EFK && ETK) spread(g, nodes, EFK, ETK);

  const xs = position(g, opt);

  const empty = emptyRanks(g);
  if (EFK && ETK) {
    const free = freeEnds(g, EFK, ETK);
    alignLabels(g, nodes, xs, free, opt, empty);
    settle(g, nodes, xs, EFK, ETK, free, empty);
    snap(g, xs, empty, opt);
    for (let ei = 0; ei < m; ei++) {
      if (direct[ei]!) continue;
      const e = edges[ei]!;
      const aDx = EFD[firstSeg[ei]!]!;
      const bDx = ETD[lastSeg[ei]!]!;
      e.tailDx = e.reversed ? bDx : aDx;
      e.headDx = e.reversed ? aDx : bDx;
    }
  }

  alignPorts(g, xs, empty);

  // A rank that holds nothing but the bends of edges is only there because some other edge has a
  // label or a twin. Its bends move onto the straight line between the ends of their edges, and
  // one that gets there is left out of the route, so that the edge is drawn as a single curve.
  const onLine = new Uint8Array(n);
  if (empty && !opt.tracks)
    straighten(g, xs, empty, firstDummy, span, opt.apart ? 0 : opt.edgeSep, onLine);
  if (!opt.tracks) pastLabels(g, xs, firstDummy, span, opt.edgeSep, onLine);
  // An edge is cut where it passes a rank that holds something, and each piece crosses one gap.
  // With `tracks`, every piece that does not run straight gets a track to run across on at
  // right angles. Otherwise, where edges spread along their nodes, a piece gets one only if it
  // needs a level to turn onto. `pieceStart` gives every edge's run of pieces.
  const pieceStart = new Int32Array(m + 1);
  const pieces: Pieces | undefined =
    opt.tracks || (EFK && !opt.straight)
      ? { from: [], to: [], rank: [], lower: [], track: [], levels: [], wide: [] }
      : undefined;
  const trackCount = new Int32Array(maxRank + 1);
  if (pieces) {
    for (let ei = 0; ei < m; ei++) {
      pieceStart[ei] = pieces.from.length;
      if (direct[ei]!) continue;
      const d0 = firstDummy[ei]!;
      // An edge that keeps a bend to stay clear of its twin is drawn through the bend, as it is.
      let twin = false;
      for (let d = d0, end = d0 < 0 ? d0 : d0 + span[ei]! - 1; d < end; d++) {
        // So is one that has a bend left out in a rank of labels: its curve crosses that rank.
        const bare = empty !== undefined && empty[RANK[d]!]! === 1;
        if (!opt.tracks && bare !== (onLine[d]! === 1)) twin = true;
      }
      if (twin) continue;
      let x = xs[EF[firstSeg[ei]!]!]! + EFD[firstSeg[ei]!]!;
      let rank = RANK[EF[firstSeg[ei]!]!]!;
      for (let d = d0, end = d0 < 0 ? d0 : d0 + span[ei]! - 1; d < end; d++) {
        if (empty && empty[RANK[d]!]!) continue;
        pieces.from.push(x);
        pieces.to.push(xs[d]!);
        pieces.rank.push(rank);
        pieces.lower.push(d);
        x = xs[d]!;
        rank = RANK[d]!;
      }
      pieces.from.push(x);
      pieces.to.push(xs[ET[lastSeg[ei]!]!]! + ETD[lastSeg[ei]!]!);
      pieces.rank.push(rank);
      pieces.lower.push(-1);
    }
    pieceStart[m] = pieces.from.length;
  }

  // Ranks that hold only border ports or their pass-through dummies need little room of their own.
  const portOnly = (r: number, kind: Kind): boolean => {
    let found = false;
    for (let i = layerStart[r]!; i < layerStart[r + 1]!; i++) {
      const k = KIND[order[i]!]!;
      if (k === kind) found = true;
      else if (k !== Kind.Dummy) return false;
    }
    return found;
  };
  const startRanks = portOnly(0, Kind.StartPort) ? step : 0;
  const endRanks = portOnly(maxRank, Kind.EndPort) ? step : 0;
  // The longest way across that any edge travels in the gap below each rank.
  const run = new Float64Array(maxRank + 1);
  for (let e = 0; e < segments; e++) {
    const across = Math.abs(xs[EF[e]!]! + EFD[e]! - xs[ET[e]!]! - ETD[e]!);
    if (across > run[RANK[EF[e]!]!]!) run[RANK[EF[e]!]!] = across;
  }
  const bandTop = new Float64Array(maxRank + 1);
  const bandBottom = new Float64Array(maxRank + 1);
  const usual = (r: number): number =>
    (r < startRanks || r >= maxRank - endRanks ? opt.portSep : opt.rankSep) / step;
  // The room under each rank. Edges that are not cut into pieces need more where they run far across.
  const gapUnder = new Float64Array(maxRank + 1);
  for (let r = 0; r < maxRank; r++) {
    gapUnder[r] = pieces
      ? usual(r)
      : Math.max(usual(r), Math.min((MAX_GAP * opt.rankSep) / step, run[r]! * MIN_SLOPE));
  }
  // A rank between two ranks of nodes, which holds labels and bends only.
  const between = new Uint8Array(maxRank + 1).fill(1);
  for (let i = 0; i < real; i++) between[RANK[i]!] = 0;
  for (let r = 1; r < maxRank; r++) {
    if (opt.tracks || !between[r]! || (heads[r]! !== 1 && heads[r]! !== 2)) continue;
    const shift = Math.min((opt.headRoom ?? 0) / 2, gapUnder[heads[r]! === 1 ? r - 1 : r]! / 2);
    gapUnder[r - 1]! += heads[r]! === 1 ? -shift : shift;
    gapUnder[r]! += heads[r]! === 1 ? shift : -shift;
  }
  // The part of its rank that an edge runs straight through at a bend or label. A bare bend
  // beside labels keeps to the middle half, which leaves the curves either side of it more room
  // and still keeps them clear of the labels' corners.
  const inset = (d: number): number =>
    KIND[d]! === Kind.Dummy && between[RANK[d]!]! && !opt.tracks
      ? (bandBottom[RANK[d]!]! - bandTop[RANK[d]!]!) / 4
      : 0;
  // The rank that the pieces leaving each rank arrive at, past any that hold only bends, and
  // the room between the two, which grows to hold the gap's tracks or levels: these keep
  // `margin` from the ranks, and between `leastPitch` and `mostPitch` from each other.
  const margin = opt.tracks ? TRACK_MARGIN : LEVEL_MARGIN;
  const leastPitch = opt.tracks ? TRACK_PITCH : LEVEL_PITCH;
  const mostPitch = opt.tracks ? TRACK_SPREAD : LEVEL_PITCH;
  const below = new Int32Array(maxRank + 1);
  if (pieces) {
    const room = new Float64Array(maxRank + 1);
    for (let r = 0; r < maxRank; r++) {
      if (empty && empty[r]!) continue;
      let next = r + 1;
      room[r] = gapUnder[r]!;
      while (next < maxRank && empty && empty[next]!) room[r]! += gapUnder[next++]!;
      below[r] = next;
    }
    for (let k = 0; k < pieces.from.length; k++)
      pieces.wide.push(
        Math.abs(pieces.from[k]! - pieces.to[k]!) > LEVEL_WIDE * room[pieces.rank[k]!]! ? 1 : 0
      );
    const tall = new Float64Array(maxRank + 1);
    assignTracks(pieces, trackCount, !opt.tracks, room, tall);
    for (let r = 0; r < maxRank; r++) {
      if (trackCount[r]! > 0)
        gapUnder[r]! += Math.max(0, 2 * margin + (trackCount[r]! - 1) * leastPitch - room[r]!);
      else if (tall[r]! > 0)
        gapUnder[r]! += Math.max(0, Math.min(MAX_GAP * opt.rankSep, tall[r]!) - room[r]!);
    }
  }
  let y = 0;
  for (let r = 0; r <= maxRank; r++) {
    let h = 0;
    for (let i = layerStart[r]!; i < layerStart[r + 1]!; i++)
      if (H[order[i]!]! > h) h = H[order[i]!]!;
    bandTop[r] = y;
    bandBottom[r] = y + h;
    y += h + gapUnder[r]!;
  }
  const height = y;
  // Where a piece runs across its gap, or would on another track of its group: its tracks sit
  // in the middle of the gap, the first at the top.
  const trackY = (piece: number, onTrack = pieces!.track[piece]!): number => {
    const r = pieces!.rank[piece]!;
    const top = bandBottom[r]!;
    const bottom = bandTop[below[r]!]!;
    const count = opt.tracks ? trackCount[r]! : pieces!.levels[piece]!;
    const pitch = count > 1 ? Math.min(mostPitch, (bottom - top - 2 * margin) / (count - 1)) : 0;
    return (top + bottom) / 2 + (onTrack - (count - 1) / 2) * pitch;
  };

  let minX = Infinity;
  let maxX = -Infinity;
  for (let i = 0; i < n; i++) {
    const half = W[i]! / 2;
    if (xs[i]! - half < minX) minX = xs[i]! - half;
    if (xs[i]! + half > maxX) maxX = xs[i]! + half;
  }
  // Where edges spread along their nodes, a rank whose nodes only send edges on stands on one
  // line, and a rank whose nodes only receive them hangs from one, so that the edges of nodes of
  // different heights set out from, or arrive at, the same level. In any other rank the nodes
  // are centered.
  const arrives = new Uint8Array(maxRank + 1);
  const leaves = new Uint8Array(maxRank + 1);
  for (let i = 0; i < real; i++) {
    if (KIND[i]! !== Kind.Node || !EFK) continue;
    if (predStart[i + 1]! > predStart[i]!) arrives[RANK[i]!] = 1;
    if (succStart[i + 1]! > succStart[i]!) leaves[RANK[i]!] = 1;
  }
  for (let i = 0; i < real; i++) {
    const node = nodes[i]!;
    const r = node.rank;
    node.x = xs[i]! - minX;
    if (KIND[i]! === Kind.Node && leaves[r]! && !arrives[r]!) node.y = bandBottom[r]! - node.h / 2;
    else if (KIND[i]! === Kind.Node && arrives[r]! && !leaves[r]!)
      node.y = bandTop[r]! + node.h / 2;
    else node.y = (bandTop[r]! + bandBottom[r]!) / 2;
  }

  for (let ei = 0; ei < m; ei++) {
    const e = edges[ei]!;
    const first = nodes[e.reversed ? e.head : e.tail]!;
    const last = nodes[e.reversed ? e.tail : e.head]!;
    const pts: number[] = [first.x + (e.reversed ? e.headDx : e.tailDx), first.y + first.h / 2];
    const d0 = firstDummy[ei]!;
    if (pieces && pieceStart[ei + 1]! > pieceStart[ei]!) {
      for (let k = pieceStart[ei]!; k < pieceStart[ei + 1]!; k++) {
        if (pieces.track[k]! >= 0 && (opt.tracks || pieces.wide[k]! === 1)) {
          const across = trackY(k);
          pts.push(pieces.from[k]! - minX, across, pieces.to[k]! - minX, across);
        } else if (pieces.track[k]! > 0) {
          // A short piece among levels runs straight until it is past the level before its
          // own, and turns in one S from there, so that it crosses none of them.
          pts.push(pieces.from[k]! - minX, trackY(k, pieces.track[k]! - 1));
        }
        const d = pieces.lower[k]!;
        if (d < 0) continue;
        pts.push(xs[d]! - minX, bandTop[RANK[d]!]! + inset(d));
        if (bandBottom[RANK[d]!]! > bandTop[RANK[d]!]!)
          pts.push(xs[d]! - minX, bandBottom[RANK[d]!]! - inset(d));
      }
    } else if (d0 >= 0) {
      for (let d = d0, end = d0 + span[ei]! - 1; d < end; d++) {
        if (onLine[d]!) continue;
        const x = xs[d]! - minX;
        const top = bandTop[RANK[d]!]!;
        const bottom = bandBottom[RANK[d]!]!;
        pts.push(x, top + inset(d));
        if (bottom > top) pts.push(x, bottom - inset(d));
      }
    }
    pts.push(last.x + (e.reversed ? e.tailDx : e.headDx), last.y - last.h / 2);
    if (e.reversed) {
      for (let i = 0, j = pts.length - 2; i < j; i += 2, j -= 2) {
        const tx = pts[i]!;
        const ty = pts[i + 1]!;
        pts[i] = pts[j]!;
        pts[i + 1] = pts[j + 1]!;
        pts[j] = tx;
        pts[j + 1] = ty;
      }
    }
    e.points = pts;
    const ln = labelNode[ei]!;
    if (ln >= 0) {
      e.labelX = xs[ln]! - minX;
      e.labelY = (bandTop[RANK[ln]!]! + bandBottom[RANK[ln]!]!) / 2;
    } else if (e.labelW > 0) {
      e.labelX = (pts[0]! + pts[pts.length - 2]!) / 2;
      e.labelY = (pts[1]! + pts[pts.length - 1]!) / 2;
    }
  }

  return { width: maxX - minX, height };
}

// The pieces of edges that each cross one gap: where they leave the rank above and reach the
// one below, the rank above, the bend they end at (or -1 at the edge's last node), and the
// track they run across on (or -1 when they have none). Where only some pieces are given a
// level to turn onto, `wide` marks those that run far across, `levels` is how many tracks the
// group a piece belongs to takes, or 0 for a piece that needs none, and each piece's track
// counts from its group's first. A piece that is not `wide` curves from the level above its own.
interface Pieces {
  from: number[];
  to: number[];
  rank: number[];
  lower: number[];
  track: number[];
  levels: number[];
  wide: number[];
}

interface Graph {
  n: number;
  real: number;
  maxRank: number;
  W: Float64Array;
  KIND: Uint8Array;
  RANK: Int32Array;
  // Segment endpoints, and where each segment attaches on them.
  EF: Int32Array;
  ET: Int32Array;
  EFD: Float64Array;
  ETD: Float64Array;
  succStart: Int32Array;
  succE: Int32Array;
  predStart: Int32Array;
  predE: Int32Array;
  layerStart: Int32Array;
  order: Int32Array;
  pos: Int32Array;
  offsets: boolean;
  // Ranks whose order must remain fixed.
  fixed: Uint8Array;
  GRP?: Int32Array;
  groupParent?: Int32Array;
}

// Reverses the edges that close a cycle, found by depth-first search in declaration order.
export function orient(nodes: LNode[], edges: LEdge[]): void {
  const n = nodes.length;
  const m = edges.length;
  const start = new Int32Array(n + 1);
  for (let i = 0; i < m; i++) {
    const e = edges[i]!;
    e.reversed = nodes[e.head]!.kind === Kind.StartPort || nodes[e.tail]!.kind === Kind.EndPort;
    if (!e.reversed) start[e.tail + 1]!++;
  }
  for (let i = 0; i < n; i++) start[i + 1]! += start[i]!;
  const out = new Int32Array(start[n]!);
  {
    const fill = start.slice(0, n);
    for (let i = 0; i < m; i++) if (!edges[i]!.reversed) out[fill[edges[i]!.tail]!++] = i;
  }
  const state = new Uint8Array(n);
  const cursor = start.slice(0, n);
  const stack: number[] = [];
  for (let root = 0; root < n; root++) {
    if (state[root]! !== 0) continue;
    stack.push(root);
    state[root] = 1;
    while (stack.length > 0) {
      const v = stack[stack.length - 1]!;
      if (cursor[v]! < start[v + 1]!) {
        const e = edges[out[cursor[v]!++]!]!;
        const w = e.head;
        if (state[w]! === 1) e.reversed = true;
        else if (state[w]! === 0) {
          state[w] = 1;
          stack.push(w);
        }
      } else {
        state[v] = 2;
        stack.pop();
      }
    }
  }
}

export function rank(nodes: LNode[], edges: LEdge[], step: number): void {
  const n = nodes.length;
  const m = edges.length;
  const from = new Int32Array(m);
  const to = new Int32Array(m);
  const len = new Int32Array(m);
  const outStart = new Int32Array(n + 1);
  const inStart = new Int32Array(n + 1);
  for (let i = 0; i < m; i++) {
    const e = edges[i]!;
    const a = e.reversed ? e.head : e.tail;
    const b = e.reversed ? e.tail : e.head;
    from[i] = a;
    to[i] = b;
    len[i] = Math.max(1, e.minlen) * step;
    outStart[a + 1]!++;
    inStart[b + 1]!++;
  }
  for (let i = 0; i < n; i++) {
    outStart[i + 1]! += outStart[i]!;
    inStart[i + 1]! += inStart[i]!;
  }
  const outE = new Int32Array(m);
  const inE = new Int32Array(m);
  {
    const of = outStart.slice(0, n);
    const inf = inStart.slice(0, n);
    for (let i = 0; i < m; i++) {
      outE[of[from[i]!]!++] = i;
      inE[inf[to[i]!]!++] = i;
    }
  }

  const r = new Int32Array(n);
  // Start ports go above every node later, so they don't push their targets down a rank.
  for (let i = 0; i < n; i++) if (nodes[i]!.kind === Kind.StartPort) r[i] = -step;
  const indeg = new Int32Array(n);
  for (let i = 0; i < n; i++) indeg[i] = inStart[i + 1]! - inStart[i]!;
  const topo = new Int32Array(n);
  let count = 0;
  for (let i = 0; i < n; i++) if (indeg[i]! === 0) topo[count++] = i;
  for (let q = 0; q < count; q++) {
    const v = topo[q]!;
    for (let k = outStart[v]!; k < outStart[v + 1]!; k++) {
      const ei = outE[k]!;
      const w = to[ei]!;
      if (r[v]! + len[ei]! > r[w]!) r[w] = r[v]! + len[ei]!;
      if (--indeg[w]! === 0) topo[count++] = w;
    }
  }

  // Longest-path ranking leaves loosely attached nodes far from their neighbours.
  // Move each node toward the side that has more edges.
  for (let pass = 0; pass < 8; pass++) {
    let changed = false;
    for (let q = count - 1; q >= 0; q--) {
      const v = topo[q]!;
      const ins = inStart[v + 1]! - inStart[v]!;
      const outs = outStart[v + 1]! - outStart[v]!;
      if (ins === 0 && outs === 0) continue;
      let lo = -Infinity;
      let hi = Infinity;
      for (let k = inStart[v]!; k < inStart[v + 1]!; k++) {
        const ei = inE[k]!;
        lo = Math.max(lo, r[from[ei]!]! + len[ei]!);
      }
      for (let k = outStart[v]!; k < outStart[v + 1]!; k++) {
        const ei = outE[k]!;
        hi = Math.min(hi, r[to[ei]!]! - len[ei]!);
      }
      let next = r[v]!;
      if (outs > ins && hi !== Infinity) next = hi;
      else if (ins > outs && lo !== -Infinity) next = lo;
      if (next !== r[v]!) {
        r[v] = next;
        changed = true;
      }
    }
    if (!changed) break;
  }

  let min = Infinity;
  let max = -Infinity;
  let startPorts = false;
  for (let i = 0; i < n; i++) {
    const kind = nodes[i]!.kind;
    if (kind === Kind.StartPort) startPorts = true;
    if (kind === Kind.StartPort || kind === Kind.EndPort) continue;
    if (r[i]! < min) min = r[i]!;
    if (r[i]! > max) max = r[i]!;
  }
  if (min === Infinity) {
    min = 0;
    max = 0;
  }
  for (let i = 0; i < n; i++) {
    if (nodes[i]!.kind === Kind.StartPort) r[i] = min - step;
    else if (nodes[i]!.kind === Kind.EndPort) r[i] = max + step;
  }
  if (startPorts) min -= step;
  for (let i = 0; i < n; i++) nodes[i]!.rank = r[i]! - min;
}

// The ends of edges that may move along one side of a node (0 the side its edges arrive at, 1 the
// other), ordered by their opposite nodes to avoid crossings. `ids` and `room` must start empty.
// `ids` receives the ends; `room` receives their minimum gaps. Returns the sum of the gaps.
// When there is too little room for a full pitch between each pair, the edges that leave side by
// side move closer together, since they have no arrowheads to keep apart. With less room still,
// neighbours that run the same way share a place, which keeps an arrowhead apart from an edge
// that leaves beside it.
function sideEnds(
  g: Graph,
  v: number,
  side: number,
  span: number,
  kinds: Uint8Array,
  ids: number[],
  room: number[]
): number {
  const start = side === 0 ? g.predStart : g.succStart;
  const list = side === 0 ? g.predE : g.succE;
  const other = side === 0 ? g.EF : g.ET;
  const pos = g.pos;
  for (let k = start[v]!; k < start[v + 1]!; k++)
    if (kinds[list[k]!]! !== End.Held) ids.push(list[k]!);
  if (ids.length < 2) return 0;
  ids.sort((a, b) => pos[other[a]!]! - pos[other[b]!]! || a - b);
  const fill = (share: (leaves: boolean, same: boolean) => number): number => {
    let total = 0;
    room[0] = 0;
    for (let k = 1; k < ids.length; k++) {
      const same = kinds[ids[k]!]! === kinds[ids[k - 1]!]!;
      room[k] = share(same && kinds[ids[k]!]! === End.Leaves, same);
      total += room[k]!;
    }
    return total;
  };
  let total = fill(() => 1);
  if (span / total < MIN_PITCH) total = fill((leaves) => (leaves ? 0.5 : 1));
  if (span / total < MIN_PITCH) total = fill((_leaves, same) => (same ? 0 : 1));
  if (total === 0) return 0;
  const pitch = Math.min(PORT_PITCH, span / total);
  for (let k = 1; k < ids.length; k++) room[k]! *= pitch;
  return total * pitch;
}

// Gives the edges that meet one side of a node places of their own along it, around its middle.
function spread(g: Graph, nodes: LNode[], EFK: Uint8Array, ETK: Uint8Array): void {
  const { real, W, EFD, ETD } = g;
  for (let v = 0; v < real; v++) {
    const span = Math.min(nodes[v]!.span, W[v]!);
    if (span <= 0 || nodes[v]!.kind !== Kind.Node) continue;
    for (let side = 0; side < 2; side++) {
      const ids: number[] = [];
      const room: number[] = [];
      const total = sideEnds(g, v, side, span, side === 0 ? ETK : EFK, ids, room);
      if (total === 0) continue;
      const dx = side === 0 ? ETD : EFD;
      let at = -total / 2;
      for (let k = 0; k < ids.length; k++) {
        at += room[k]!;
        dx[ids[k]!] = at;
      }
    }
  }
}

// The segment of an edge that reaches the next point held in place, on the way up from segment
// `e` (side 0) or down: past the bends in ranks that hold nothing else.
function follow(g: Graph, empty: Uint8Array | undefined, e: number, side: number): number {
  if (!empty) return e;
  const { KIND, RANK, EF, ET, succStart, succE, predStart, predE } = g;
  for (let hops = 0; hops < 100000; hops++) {
    const u = side === 0 ? EF[e]! : ET[e]!;
    if (KIND[u]! !== Kind.Dummy || !empty[RANK[u]!]!) break;
    e = side === 0 ? predE[predStart[u]!]! : succE[succStart[u]!]!;
  }
  return e;
}

// Aligns border ports with the ends on their nodes so edges run straight across the gap.
// Ports are kept `edgeSep` apart while placed, more than ends on a short side get, so
// without this an edge turns outside the border and again in the gap.
// Leaves a rank alone unless every port can move without passing or meeting its neighbors.
function alignPorts(g: Graph, xs: Float64Array, empty: Uint8Array | undefined): void {
  const { maxRank, KIND, EF, ET, EFD, ETD, succStart, succE, predStart, predE, layerStart, order } =
    g;
  for (const [r, kind] of [
    [0, Kind.StartPort],
    [maxRank, Kind.EndPort],
  ] as const) {
    const s = layerStart[r]!;
    const end = layerStart[r + 1]!;
    const to: number[] = [];
    for (let i = s; i < end; i++) {
      const v = order[i]!;
      const start = kind === Kind.StartPort;
      if (
        KIND[v]! !== kind ||
        (start ? succStart[v + 1]! - succStart[v]! : predStart[v + 1]! - predStart[v]!) !== 1
      )
        break;
      const e = follow(
        g,
        empty,
        start ? succE[succStart[v]!]! : predE[predStart[v]!]!,
        start ? 1 : 0
      );
      const at = start ? xs[ET[e]!]! + ETD[e]! : xs[EF[e]!]! + EFD[e]!;
      if (to.length > 0 && at < to[to.length - 1]! + TWIN) break;
      to.push(at);
    }
    if (to.length === 0 || to.length !== end - s) continue;
    for (let i = s; i < end; i++) xs[order[i]!] = to[i - s]!;
  }
}

// How many ends that may move along it each node has on the side its edges arrive at, and on
// the other. An end that has a side to itself keeps to the middle; ends that share one cannot
// all be there, so those may move.
function freeEnds(g: Graph, EFK: Uint8Array, ETK: Uint8Array): [Int32Array, Int32Array] {
  const free: [Int32Array, Int32Array] = [new Int32Array(g.n), new Int32Array(g.n)];
  for (let e = 0; e < g.EF.length; e++) {
    if (ETK[e]! !== End.Held) free[0][g.ET[e]!]!++;
    if (EFK[e]! !== End.Held) free[1][g.EF[e]!]!++;
  }
  return free;
}

// `ease` (the S-curve handle factor) lives in rendering-elements/routeGeometry.ts; see the
// import above.
export { ease };

// Brings the labels and bends of each edge into line with an end of the edge, so that it runs
// straight from that end and turns once, at the other: with the end that has fewer edges beside
// it on its node, which is the one nearer the middle of its side, or else with the other, and
// as near to that as what is beside them in their ranks leaves room. The other end may then move
// along its node to meet the line. Bends in ranks that hold nothing else are left to `straighten`.
// An edge with no one line that all of its labels and bends have room on has each brought into
// line with the nearest point above or below that is held in place.
function alignLabels(
  g: Graph,
  nodes: LNode[],
  xs: Float64Array,
  free: [Int32Array, Int32Array],
  opt: LayeredOptions,
  empty: Uint8Array | undefined
): void {
  const sep = opt.edgeSep;
  const {
    n,
    real,
    maxRank,
    KIND,
    RANK,
    W,
    EF,
    ET,
    EFD,
    ETD,
    succStart,
    succE,
    predStart,
    predE,
    layerStart,
    order,
    pos,
  } = g;
  const placed = (v: number): boolean =>
    KIND[v]! === Kind.Label ||
    (KIND[v]! === Kind.Dummy && !(empty !== undefined && empty[RANK[v]!]! === 1));
  // Where segment `e` ends on the way up (side 0) or down, and how many ends share that side of
  // the node there: none for a point that is not on a node.
  const end = (e: number, side: number): [number, number] => {
    const u = side === 0 ? EF[e]! : ET[e]!;
    const x = side === 0 ? xs[u]! + EFD[e]! : xs[u]! + ETD[e]!;
    return [x, u < real && nodes[u]!.kind === Kind.Node ? free[1 - side]![u]! : 0];
  };
  // The room the neighbours in its rank leave a label or bend: a full gap from a node or between
  // two labels, half of one between a label and a line that passes it.
  const room = (v: number): [number, number] => {
    const s = layerStart[RANK[v]!]!;
    const i = s + pos[v]!;
    const clear = (other: number): number =>
      W[other]! / 2 + W[v]! / 2 + gapBetween(KIND[other]!, KIND[v]!, opt.nodeSep, sep);
    return [
      i > s ? xs[order[i - 1]!]! + clear(order[i - 1]!) : -Infinity,
      i + 1 < layerStart[RANK[v]! + 1]! ? xs[order[i + 1]!]! - clear(order[i + 1]!) : Infinity,
    ];
  };
  // The place between `lo` and `hi` that is in line with one of two ends, or else nearest the first choice.
  const choose = (
    x: number,
    up: [number, number],
    down: [number, number],
    lo: number,
    hi: number
  ): number => {
    const upFirst =
      up[1] !== down[1] ? up[1] < down[1] : Math.abs(up[0] - x) <= Math.abs(down[0] - x);
    const choices = upFirst ? [up[0], down[0]] : [down[0], up[0]];
    return (
      choices.find((choice) => choice >= lo && choice <= hi) ??
      Math.max(lo, Math.min(hi, choices[0]!))
    );
  };
  const done = new Uint8Array(n);
  const chain: number[] = [];
  for (let r = 1; r < maxRank; r++) {
    for (let i = layerStart[r]!; i < layerStart[r + 1]!; i++) {
      if (!placed(order[i]!) || done[order[i]!]!) continue;
      // The edge's labels and bends from its first node to its last, and the room they share.
      let top = order[i]!;
      while (isDummy(KIND[EF[predE[predStart[top]!]!]!]!)) top = EF[predE[predStart[top]!]!]!;
      let bottom = top;
      let lo = -Infinity;
      let hi = Infinity;
      chain.length = 0;
      for (let d = top; isDummy(KIND[d]!); d = ET[succE[succStart[d]!]!]!) {
        bottom = d;
        if (!placed(d)) continue;
        done[d] = 1;
        chain.push(d);
        const [least, most] = room(d);
        if (least > lo) lo = least;
        if (most < hi) hi = most;
      }
      if (lo <= hi) {
        const x = choose(
          xs[chain[0]!]!,
          end(predE[predStart[top]!]!, 0),
          end(succE[succStart[bottom]!]!, 1),
          lo,
          hi
        );
        for (const d of chain) xs[d] = x;
        continue;
      }
      for (const d of chain) {
        const [least, most] = room(d);
        if (least > most) continue;
        xs[d] = choose(
          xs[d]!,
          end(follow(g, empty, predE[predStart[d]!]!, 0), 0),
          end(follow(g, empty, succE[succStart[d]!]!, 1), 1),
          least,
          most
        );
      }
    }
  }
}

// Once the nodes have their places, moves an end along its side when that lets its edge run
// straight: when the point the edge runs to, or some part of the side it runs to, is in line
// with the end's own side. Any other end leans towards the point its edge runs to, where its
// side is long enough, and an end with a side to itself stays in the middle. On a group, the
// ends keep clear of the points where other edges pass through its border.
function settle(
  g: Graph,
  nodes: LNode[],
  xs: Float64Array,
  EFK: Uint8Array,
  ETK: Uint8Array,
  free: [Int32Array, Int32Array],
  empty: Uint8Array | undefined
): void {
  const { real, W, EF, ET, EFD, ETD, succStart, succE, predStart, predE, pos } = g;
  // Where the end of segment `e` on node `v` should be, from the middle of its side. The edge is
  // followed up from the segment (side 0) or down, past the bends in ranks that hold nothing
  // else, to where it next comes to a point that is held in place or to another node's side.
  const wanted = (e: number, side: number, v: number, span: number, again: boolean): number => {
    if (free[side]![v]! < 2) return 0;
    e = follow(g, empty, e, side);
    const u = side === 0 ? EF[e]! : ET[e]!;
    const point = side === 0 ? xs[u]! + EFD[e]! : xs[u]! + ETD[e]!;
    // Once the other end has its place, this one comes into line with it if it can.
    if (again && Math.abs(point - xs[v]!) <= span / 2 + IN_LINE)
      return Math.max(-span / 2, Math.min(span / 2, point - xs[v]!));
    // The part of the other side that its end may move along, if it may move.
    let middle = point;
    let width = 0;
    if (
      u < real &&
      nodes[u]!.kind === Kind.Node &&
      (side === 0 ? EFK : ETK)[e]! !== End.Held &&
      free[1 - side]![u]! >= 2
    ) {
      width = Math.max(0, Math.min(nodes[u]!.span, W[u]!));
      if (width > 0) middle = xs[u]!;
    }
    const lo = Math.max(xs[v]! - span / 2, middle - width / 2);
    const hi = Math.min(xs[v]! + span / 2, middle + width / 2);
    // Two sides with no part in line: the end leans towards the other, if its side is long enough.
    if (lo > hi + IN_LINE) {
      const lean = Math.max(0, span / 2 - LEAN_CLEAR);
      return Math.max(-lean, Math.min(lean, point - xs[v]!));
    }
    // Both ends settle on one place in the part the two sides share: nearer the middle of the narrower.
    const place = (xs[v]! * width + middle * span) / (width + span);
    return Math.max(lo, Math.min(hi, place)) - xs[v]!;
  };
  // End order and spacing stay fixed across passes; held ends divide free ends into runs.
  const sides: {
    v: number;
    side: number;
    span: number;
    ids: number[];
    room: number[];
    all: number[];
  }[] = [];
  for (let v = 0; v < real; v++) {
    const span = Math.min(nodes[v]!.span, W[v]!);
    if (span <= 0 || nodes[v]!.kind !== Kind.Node) continue;
    for (let side = 0; side < 2; side++) {
      const other = side === 0 ? EF : ET;
      const start = side === 0 ? predStart : succStart;
      const list = side === 0 ? predE : succE;
      const ids: number[] = [];
      const room: number[] = [];
      sideEnds(g, v, side, span, side === 0 ? ETK : EFK, ids, room);
      if (ids.length === 0) continue;
      if (ids.length === 1) room[0] = 0;
      const all: number[] = [];
      for (let k = start[v]!; k < start[v + 1]!; k++) all.push(list[k]!);
      all.sort((a, b) => pos[other[a]!]! - pos[other[b]!]! || a - b);
      sides.push({ v, side, span, ids, room, all });
    }
  }
  // The ends of an edge follow each other, so the nodes are gone over until none moves: a few
  // times at most, in practice.
  for (let pass = 0, moved = true; moved && pass < 6; pass++) {
    moved = false;
    for (const { v, side, span, ids, room, all } of sides) {
      const kinds = side === 0 ? ETK : EFK;
      const dx = side === 0 ? ETD : EFD;
      let k = 0;
      let lo = -span / 2;
      for (let i = 0; i <= all.length; i++) {
        const held = i < all.length && kinds[all[i]!]! === End.Held;
        if (i < all.length && !held) continue;
        // Free ends since the last held end occupy ids[k..k + size).
        let size = 0;
        for (let j = i - 1; j >= 0 && kinds[all[j]!]! !== End.Held; j--) size++;
        const hi = held ? dx[all[i]!]! - PORT_PITCH : span / 2;
        if (size > 0) {
          // Isotonic fitting preserves order and spacing by pooling neighbours that are too close.
          const sum: number[] = [];
          const count: number[] = [];
          let before = 0;
          for (let j = 0; j < size; j++) {
            if (j > 0) before += room[k + j]!;
            sum.push(wanted(ids[k + j]!, side, v, span, pass > 0) - before);
            count.push(1);
            // Keep ends together when spacing forced them to share a place.
            let together = j > 0 && room[k + j]! === 0;
            while (
              sum.length > 1 &&
              (together ||
                sum[sum.length - 2]! / count[count.length - 2]! >
                  sum[sum.length - 1]! / count[count.length - 1]!)
            ) {
              together = false;
              const top = sum.pop()!;
              const pooled = count.pop()!;
              sum[sum.length - 1]! += top;
              count[count.length - 1]! += pooled;
            }
          }
          const total = before;
          let j = 0;
          before = 0;
          for (let b = 0; b < sum.length; b++) {
            // Center the run if it cannot fit between held ends.
            const level =
              hi - total < lo
                ? (lo + hi - total) / 2
                : Math.max(lo, Math.min(hi - total, sum[b]! / count[b]!));
            for (let c = 0; c < count[b]!; c++, j++) {
              if (j > 0) before += room[k + j]!;
              if (Math.abs(dx[ids[k + j]!]! - level - before) > 0.01) moved = true;
              dx[ids[k + j]!] = level + before;
            }
          }
          k += size;
        }
        if (held) lo = dx[all[i]!]! + PORT_PITCH;
      }
    }
  }
}

// Brings edges that are nearly straight into line, by moving a node or bend a little across the
// flow along with everything it is in line with already, where the nodes beside them leave room.
// What is in line stays in line, so each move leaves one more edge straight.
function snap(
  g: Graph,
  xs: Float64Array,
  empty: Uint8Array | undefined,
  opt: LayeredOptions
): void {
  const { n, KIND, RANK, EF, ET, EFD, ETD, layerStart, order, pos } = g;
  const passed = (u: number): boolean =>
    empty !== undefined && KIND[u]! === Kind.Dummy && empty[RANK[u]!]! === 1;
  // Each edge from one point that is held in place to the next, past the bends in ranks that hold nothing else.
  const a: number[] = [];
  const b: number[] = [];
  const da: number[] = [];
  const db: number[] = [];
  for (let e = 0; e < EF.length; e++) {
    if (passed(EF[e]!)) continue;
    const f = follow(g, empty, e, 1);
    a.push(EF[e]!);
    b.push(ET[f]!);
    da.push(EFD[e]!);
    db.push(ETD[f]!);
  }
  const off = (k: number): number => xs[b[k]!]! + db[k]! - xs[a[k]!]! - da[k]!;
  // The nodes in line with each other move as one.
  const block = new Int32Array(n);
  const members: number[][] = [];
  for (let i = 0; i < n; i++) {
    block[i] = i;
    members.push([i]);
  }
  const join = (x: number, y: number): void => {
    let keep = block[x]!;
    let drop = block[y]!;
    if (keep === drop) return;
    if (members[keep]!.length < members[drop]!.length) [keep, drop] = [drop, keep];
    for (const v of members[drop]!) {
      block[v] = keep;
      members[keep]!.push(v);
    }
    members[drop] = [];
  };
  const near: number[] = [];
  for (let k = 0; k < a.length; k++) {
    const d = Math.abs(off(k));
    if (d < 0.01) join(a[k]!, b[k]!);
    else if (d <= BEND_SNAP) near.push(k);
  }
  if (near.length === 0) return;
  near.sort((x, y) => Math.abs(off(x)) - Math.abs(off(y)) || x - y);
  const gap = (v: number): number => halfRoom(g, opt, v);
  // Whether every node of a block can move by `shift` and keep its room from those beside it.
  const free = (id: number, shift: number): boolean => {
    for (const v of members[id]!) {
      const s = layerStart[RANK[v]!]!;
      const end = layerStart[RANK[v]! + 1]!;
      const i = s + pos[v]!;
      if (
        i > s &&
        block[order[i - 1]!]! !== id &&
        xs[v]! + shift - xs[order[i - 1]!]! < gap(v) + gap(order[i - 1]!) - 0.01
      )
        return false;
      if (
        i + 1 < end &&
        block[order[i + 1]!]! !== id &&
        xs[order[i + 1]!]! - xs[v]! - shift < gap(v) + gap(order[i + 1]!) - 0.01
      )
        return false;
    }
    return true;
  };
  for (const k of near) {
    const d = off(k);
    if (Math.abs(d) < 0.01) {
      join(a[k]!, b[k]!);
      continue;
    }
    if (Math.abs(d) > BEND_SNAP || block[a[k]!]! === block[b[k]!]!) continue;
    // The smaller of the two blocks moves, if it can; else the other.
    const upper = block[a[k]!]!;
    const lower = block[b[k]!]!;
    const first = members[upper]!.length <= members[lower]!.length ? upper : lower;
    for (const id of [first, first === upper ? lower : upper]) {
      const shift = id === upper ? d : -d;
      if (Math.abs(d) > SNAP && !members[id]!.every((v) => KIND[v]! === Kind.Dummy)) continue;
      if (!free(id, shift)) continue;
      for (const v of members[id]!) xs[v]! += shift;
      join(a[k]!, b[k]!);
      break;
    }
  }
}

// Marks the ranks that hold nothing but the bends of edges, if there are any.
function emptyRanks(g: Graph): Uint8Array | undefined {
  const { maxRank, KIND, layerStart, order } = g;
  const empty = new Uint8Array(maxRank + 1);
  let any = false;
  for (let r = 1; r < maxRank; r++) {
    let only = layerStart[r + 1]! > layerStart[r]!;
    for (let i = layerStart[r]!; only && i < layerStart[r + 1]!; i++)
      if (KIND[order[i]!]! !== Kind.Dummy) only = false;
    if (only) {
      empty[r] = 1;
      any = true;
    }
  }
  return any ? empty : undefined;
}

// Gives every piece that does not run straight down a track across its gap, and counts the
// tracks of each gap. Two pieces in one gap share a track only where they cannot be mistaken
// for each other: where they do not overlap, or where they leave from or arrive at the same
// point, as the branches of a tree do. Which of two goes above the other is whichever makes
// them cross less. With `curved`, the tracks are levels for curves to turn onto, and only the
// pieces that would run along or too near another get one: each group of those counts its
// tracks from its own first. `room` is the height of the gap under each rank, and `tall`
// receives the height that a gap whose curves mostly cross each other should have instead of levels.
function assignTracks(
  pieces: Pieces,
  trackCount: Int32Array,
  curved: boolean,
  room: Float64Array,
  tall: Float64Array
): void {
  const { from, to, rank, track, levels, wide } = pieces;
  const total = from.length;
  const byRank = new Map<number, number[]>();
  for (let k = 0; k < total; k++) {
    track.push(-1);
    levels.push(0);
    if (Math.abs(from[k]! - to[k]!) < IN_LINE) continue;
    const list = byRank.get(rank[k]!);
    if (list) list.push(k);
    else byRank.set(rank[k]!, [k]);
  }
  if (byRank.size === 0) return;
  // The pieces are compared pair by pair, so where each begins and ends across the flow is worked out once.
  const LO = new Float64Array(total);
  const HI = new Float64Array(total);
  for (let k = 0; k < total; k++) {
    LO[k] = Math.min(from[k]!, to[k]!);
    HI[k] = Math.max(from[k]!, to[k]!);
  }
  const within = (x: number, k: number): number =>
    x >= LO[k]! - IN_LINE && x <= HI[k]! + IN_LINE ? 1 : 0;
  const mates = (a: number, b: number): boolean =>
    Math.abs(from[a]! - from[b]!) < IN_LINE || Math.abs(to[a]! - to[b]!) < IN_LINE;
  const overlap = (a: number, b: number): boolean =>
    LO[a]! < HI[b]! - IN_LINE && LO[b]! < HI[a]! - IN_LINE;
  // Whether a and b need tracks of their own.
  const clash = (a: number, b: number): boolean => overlap(a, b) && !mates(a, b);
  // Whether one of a and b could cross the other, depending on which is above.
  const meet = (a: number, b: number): boolean =>
    overlap(a, b) ||
    within(to[a]!, b) + within(from[b]!, a) + within(to[b]!, a) + within(from[a]!, b) > 0;
  // How often a and b cross with a on the higher track: a's way down through b, and b's way down to itself through a.
  const crossings = (a: number, b: number): number => within(to[a]!, b) + within(from[b]!, a);
  // Returns pairs of list indices, smaller first. Omitted pairs cannot meet or clash.
  const nearPairs = (list: number[]): number[] => {
    const byLo = list.map((_, i) => i).sort((a, b) => LO[list[a]!]! - LO[list[b]!]!);
    const pairs: number[] = [];
    for (let x = 0; x < byLo.length; x++) {
      const i = byLo[x]!;
      const reach = HI[list[i]!]! + 4 * IN_LINE;
      for (let y = x + 1; y < byLo.length && LO[list[byLo[y]!]!]! <= reach; y++) {
        const j = byLo[y]!;
        pairs.push(Math.min(i, j), Math.max(i, j));
      }
    }
    return pairs;
  };

  // Gives the pieces of one gap in `list` their tracks, and each the number of tracks that the
  // pieces it has to do with take between them, counting its own from the first of those.
  // Returns the number of tracks. The pieces come without tracks.
  const lay = (list: number[]): number => {
    // A plain order to start from, and to keep where nothing says otherwise: the pieces that
    // reach furthest go first, so that those of one fan nest.
    list.sort((a, b) => HI[b]! - LO[b]! - (HI[a]! - LO[a]!) || LO[a]! - LO[b]! || a - b);
    const count = list.length;
    const above: number[][] = [];
    const group = list.map((_, i) => i);
    const find = (i: number): number => {
      while (group[i]! !== i) i = group[i] = group[group[i]!]!;
      return i;
    };
    const weighed = count <= MAX_WEIGHED;
    // Avoid storing quadratically many pairs in dense gaps.
    const pairs = weighed ? nearPairs(list) : [];
    const clashes: number[][] = weighed ? list.map(() => []) : [];
    for (let p = 0; p < pairs.length; p += 2) {
      const i = pairs[p]!;
      const j = pairs[p + 1]!;
      if (!clash(list[i]!, list[j]!)) continue;
      clashes[i]!.push(j);
      clashes[j]!.push(i);
    }
    let sequence = list.map((_, i) => i);
    if (weighed) {
      // above[j] lists the pieces that should be above list[j]. The order follows as many of
      // these as it can: a piece is placed once all that should be above it are, and when
      // none is free, the one with the fewest still waiting.
      const waiting = new Int32Array(count);
      const after: number[][] = [];
      for (let i = 0; i < count; i++) {
        above.push([]);
        after.push([]);
      }
      for (let p = 0; p < pairs.length; p += 2) {
        const i = pairs[p]!;
        const j = pairs[p + 1]!;
        const a = list[i]!;
        const b = list[j]!;
        if (!meet(a, b)) continue;
        group[find(i)] = find(j);
        const ab = crossings(a, b);
        const ba = crossings(b, a);
        if (ab === ba) continue;
        const first = ab < ba ? i : j;
        const second = ab < ba ? j : i;
        above[second]!.push(first);
        after[first]!.push(second);
        waiting[second]!++;
      }
      const placed = new Uint8Array(count);
      sequence = [];
      for (let done = 0; done < count; done++) {
        let pick = -1;
        for (let i = 0; i < count; i++) {
          if (placed[i]!) continue;
          if (pick < 0 || waiting[i]! < waiting[pick]!) pick = i;
          if (waiting[i]! === 0) break;
        }
        placed[pick] = 1;
        sequence.push(pick);
        for (const j of after[pick]!) waiting[j]!--;
      }
    }
    const taken = new Set<number>();
    const onTrack: number[][] = [];
    let rows = 0;
    for (const at of sequence) {
      const k = list[at]!;
      let t = 0;
      for (const i of above[at]! ?? []) if (track[list[i]!]! >= t) t = track[list[i]!]! + 1;
      if (weighed) {
        taken.clear();
        for (const i of clashes[at]!) taken.add(track[list[i]!]!);
        while (taken.has(t)) t++;
      } else {
        while (onTrack[t]?.some((other) => clash(k, other))) t++;
        (onTrack[t] ??= []).push(k);
      }
      track[k] = t;
      if (t >= rows) rows = t + 1;
    }
    const first = new Int32Array(count).fill(rows);
    const last = new Int32Array(count).fill(-1);
    for (let i = 0; i < count; i++) {
      const root = find(i);
      first[root] = Math.min(first[root]!, track[list[i]!]!);
      last[root] = Math.max(last[root]!, track[list[i]!]!);
    }
    for (let i = 0; i < count; i++) {
      const root = find(i);
      levels[list[i]!] = last[root]! - first[root]! + 1;
      if (curved) track[list[i]!]! -= first[root]!;
    }
    return rows;
  };

  const sample = (k: number, h: number, out: Float64Array): void => {
    const c = ease(to[k]! - from[k]!, h);
    for (let i = 0; i <= SAMPLES; i++) {
      const t = i / SAMPLES;
      const u = 1 - t;
      out[2 * i] = from[k]! + (to[k]! - from[k]!) * t * t * (3 - 2 * t);
      out[2 * i + 1] = h * (3 * c * t * u * u + 3 * (1 - c) * t * t * u + t * t * t);
    }
  };
  const reaches = (points: Float64Array, line: Float64Array, limit: number): boolean => {
    // Allow rounding error in the cheap distance check before calling Math.hypot.
    const bound = limit * limit * (1 + 1e-9);
    for (let i = 0; i <= SAMPLES; i++) {
      const px = points[2 * i]!;
      const py = points[2 * i + 1]!;
      for (let j = 0; j < SAMPLES; j++) {
        const dx = line[2 * j + 2]! - line[2 * j]!;
        const dy = line[2 * j + 3]! - line[2 * j + 1]!;
        const t = Math.max(
          0,
          Math.min(
            1,
            ((px - line[2 * j]!) * dx + (py - line[2 * j + 1]!) * dy) / (dx * dx + dy * dy || 1)
          )
        );
        const ex = px - line[2 * j]! - t * dx;
        const ey = py - line[2 * j + 1]! - t * dy;
        if (ex * ex + ey * ey < bound && Math.hypot(ex, ey) < limit) return true;
      }
    }
    return false;
  };
  const near = (a: number, b: number, height: number, limit: number): boolean => {
    const h = Math.max(height / 2, height - 2 * LEVEL_LEAD);
    sample(a, h, LINE_A);
    sample(b, h, LINE_B);
    return reaches(LINE_A, LINE_B, limit) || reaches(LINE_B, LINE_A, limit);
  };

  for (const [r, all] of byRank) {
    if (!curved) {
      trackCount[r] = lay(all);
      continue;
    }
    if (all.length > MAX_WEIGHED) continue;
    // The pieces that turn onto levels: first those that run far across and have another such
    // piece to be told apart from, then any two that would pass too near each other as plain
    // curves.
    const far = all.filter((k) => wide[k]! === 1);
    lay(far);
    const level = new Set(far.filter((k) => levels[k]! > 1));
    const pairs = nearPairs(all);
    for (let p = 0; p < pairs.length; p += 2) {
      const a = all[pairs[p]!]!;
      const b = all[pairs[p + 1]!]!;
      if ((level.has(a) && level.has(b)) || !clash(a, b) || from[a]! < to[a]! !== from[b]! < to[b]!)
        continue;
      if (near(a, b, room[r]!, wide[a]! === 1 || wide[b]! === 1 ? LEVEL_CLEAR : LEVEL_TOUCH))
        level.add(a).add(b);
    }
    for (const k of far) {
      track[k] = -1;
      levels[k] = 0;
    }
    if (level.size === 0) continue;
    let crossing = 0;
    let alongside = 0;
    const beside = new Set<number>();
    for (let p = 0; p < pairs.length; p += 2) {
      const a = all[pairs[p]!]!;
      const b = all[pairs[p + 1]!]!;
      if (level.has(a) && level.has(b)) {
        if (!overlap(a, b)) continue;
        if (from[a]! < to[a]! !== from[b]! < to[b]!) crossing++;
        else if (!mates(a, b)) alongside++;
      } else if ((level.has(a) || level.has(b)) && meet(a, b)) beside.add(a).add(b);
    }
    if (crossing > alongside) {
      for (const k of all)
        if ((HI[k]! - LO[k]!) * CROSSED_SLOPE > tall[r]!)
          tall[r] = (HI[k]! - LO[k]!) * CROSSED_SLOPE;
      continue;
    }
    // With them go the short pieces that could cross one of them, so that each has its place
    // among the levels and crosses none.
    const members = all.filter((k) => level.has(k) || (wide[k]! !== 1 && beside.has(k)));
    lay(members);
    let most = 0;
    for (const k of members) if (levels[k]! > most) most = levels[k]!;
    trackCount[r] = most;
  }
}

// Moves the bends in ranks that hold only bends onto the straight line between the nearest points
// of their edges that are held in place, and marks the ones that can be left out of the route.
// `firstDummy` and `span` give each edge's run of bends, one in every rank. `sep` is the room
// kept between the bends of twin edges, or 0 to leave those out as well.
function straighten(
  g: Graph,
  xs: Float64Array,
  empty: Uint8Array,
  firstDummy: Int32Array,
  span: Int32Array,
  sep: number,
  onLine: Uint8Array
): void {
  const { maxRank, EF, ET, EFD, ETD, succStart, succE, predStart, predE, layerStart, order } = g;

  const want = new Float64Array(xs.length);
  // The points that each bend's edge runs between, across the ranks that hold only bends.
  const from = new Float64Array(xs.length);
  const to = new Float64Array(xs.length);
  for (let ei = 0; ei < firstDummy.length; ei++) {
    const d0 = firstDummy[ei]!;
    if (d0 < 0) continue;
    const end = d0 + span[ei]! - 1;
    // A bend's rank is its place in the run, counted from the rank after the edge's first node.
    const base = g.RANK[d0]!;
    for (let d = d0; d < end; d++) {
      if (!empty[base + d - d0]!) continue;
      let last = d;
      while (last + 1 < end && empty[base + last + 1 - d0]!) last++;
      const above = predE[predStart[d]!]!;
      const below = succE[succStart[last]!]!;
      const x0 = xs[EF[above]!]! + EFD[above]!;
      const x1 = xs[ET[below]!]! + ETD[below]!;
      const steps = last - d + 2;
      for (let k = d; k <= last; k++) {
        want[k] = x0 + ((x1 - x0) * (k - d + 1)) / steps;
        from[k] = x0;
        to[k] = x1;
      }
      d = last;
    }
  }

  // Nothing in such a rank is in a bend's way, so each one goes onto its line and out of the
  // route. Only twins stay: bends of edges that run between the same two points, which would
  // otherwise be drawn as one. They take places a little apart, around the line.
  const twins: number[] = [];
  for (let r = 1; r < maxRank; r++) {
    if (!empty[r]!) continue;
    const s = layerStart[r]!;
    const end = layerStart[r + 1]!;
    const row = Array.from(order.subarray(s, end)).sort(
      (a, b) => from[a]! - from[b]! || to[a]! - to[b]! || a - b
    );
    for (let i = 0; i < row.length; ) {
      twins.length = 0;
      let j = i;
      for (
        ;
        j < row.length &&
        Math.abs(from[row[j]!]! - from[row[i]!]!) < TWIN &&
        Math.abs(to[row[j]!]! - to[row[i]!]!) < TWIN;
        j++
      )
        twins.push(row[j]!);
      // The twins keep the order the rank gave them, so that two edges do not swap sides on the way.
      twins.sort((a, b) => g.pos[a]! - g.pos[b]!);
      for (let k = 0; k < twins.length; k++) {
        const d = twins[k]!;
        xs[d] = want[d]! + (k - (twins.length - 1) / 2) * sep;
        if (twins.length === 1 || sep === 0) onLine[d] = 1;
      }
      i = j;
    }
  }
}

// In a rank that holds labels and bends but no nodes, a bend is there to take its edge straight
// through between the labels. Where the edge would pass clear of every label anyway, the bend
// is left out, and the edge turns in the whole height between the ranks on either side.
function pastLabels(
  g: Graph,
  xs: Float64Array,
  firstDummy: Int32Array,
  span: Int32Array,
  clear: number,
  onLine: Uint8Array
): void {
  const {
    maxRank,
    W,
    KIND,
    RANK,
    EF,
    ET,
    EFD,
    ETD,
    succStart,
    succE,
    predStart,
    predE,
    layerStart,
    order,
  } = g;
  const labelled = new Uint8Array(maxRank + 1);
  let any = false;
  for (let r = 1; r < maxRank; r++) {
    let labels = false;
    let others = false;
    for (let i = layerStart[r]!; i < layerStart[r + 1]!; i++) {
      const kind = KIND[order[i]!]!;
      if (kind === Kind.Label) labels = true;
      else if (kind !== Kind.Dummy) others = true;
    }
    if (labels && !others) {
      labelled[r] = 1;
      any = true;
    }
  }
  if (!any) return;
  for (let ei = 0; ei < firstDummy.length; ei++) {
    const d0 = firstDummy[ei]!;
    if (d0 < 0) continue;
    for (let d = d0, end = d0 + span[ei]! - 1; d < end; d++) {
      if (KIND[d]! !== Kind.Dummy || !labelled[RANK[d]!]!) continue;
      // The points on either side that the edge is held at, past any bends already left out.
      let first = d;
      let last = d;
      while (first > d0 && onLine[first - 1]!) first--;
      while (last + 1 < end && onLine[last + 1]!) last++;
      const above = predE[predStart[first]!]!;
      const below = succE[succStart[last]!]!;
      const from = xs[EF[above]!]! + EFD[above]!;
      const to = xs[ET[below]!]! + ETD[below]!;
      const lo = Math.min(from, to) - clear;
      const hi = Math.max(from, to) + clear;
      let free = true;
      const r = RANK[d]!;
      for (let i = layerStart[r]!; free && i < layerStart[r + 1]!; i++) {
        const label = order[i]!;
        if (
          KIND[label]! === Kind.Label &&
          xs[label]! + W[label]! / 2 > lo &&
          xs[label]! - W[label]! / 2 < hi
        )
          free = false;
      }
      if (!free) continue;
      onLine[d] = 1;
      // The bends left out between the two points lie on the line between them.
      const steps = last - first + 2;
      for (let k = first; k <= last; k++) xs[k] = from + ((to - from) * (k - first + 1)) / steps;
    }
  }
}

// Returns [final crossings, crossings before grouping or reordering].
function reduceCrossings(g: Graph, nodes: LNode[]): [number, number] {
  const {
    n,
    real,
    maxRank,
    W,
    EF,
    ET,
    EFD,
    ETD,
    succStart,
    succE,
    predStart,
    predE,
    layerStart,
    order,
    pos,
    offsets,
    fixed,
    GRP,
    groupParent,
  } = g;
  let widest = 0;
  for (let r = 0; r <= maxRank; r++) widest = Math.max(widest, layerStart[r + 1]! - layerStart[r]!);
  if (widest < 2) return [0, 0];
  // With offsets, edges that reach one node at different offsets take separate places along it.
  const place = offsets ? new Int32Array(EF.length) : undefined;
  // Local offset indices and counts do not depend on node order.
  const placeIn = new Int32Array(place ? EF.length : 0);
  const places = new Int32Array(place ? n : 0);
  const leaving = place ? succE.slice() : succE;
  const mixed = new Uint8Array(place ? n : 0);
  if (place) {
    const arriving = predE.slice();
    const byOffset = (list: Int32Array, from: number, to: number, dx: Float64Array): boolean => {
      for (let k = from + 1; k < to; k++) {
        if (dx[list[k]!]! === dx[list[from]!]!) continue;
        list.subarray(from, to).sort((a, b) => dx[a]! - dx[b]!);
        return true;
      }
      return false;
    };
    for (let v = 0; v < n; v++) {
      places[v] = 1;
      if (byOffset(arriving, predStart[v]!, predStart[v + 1]!, ETD)) {
        for (let k = predStart[v]! + 1; k < predStart[v + 1]!; k++) {
          if (ETD[arriving[k]!]! !== ETD[arriving[k - 1]!]!) places[v]!++;
          placeIn[arriving[k]!] = places[v]! - 1;
        }
      }
      if (byOffset(leaving, succStart[v]!, succStart[v + 1]!, EFD)) mixed[v] = 1;
    }
  }
  let size = 1;
  while (size < (place ? widest + EF.length : widest)) size <<= 1;
  const tree = new Int32Array(2 * size);
  const targets = new Int32Array(EF.length);

  const count = (): number => {
    let total = 0;
    for (let r = 0; r < maxRank; r++) {
      let southLen = layerStart[r + 2]! - layerStart[r + 1]!;
      if (place) {
        let next = 0;
        for (let i = layerStart[r + 1]!; i < layerStart[r + 2]!; i++) {
          const v = order[i]!;
          for (let k = predStart[v]!; k < predStart[v + 1]!; k++)
            place[predE[k]!] = next + placeIn[predE[k]!]!;
          next += places[v]!;
        }
        southLen = next;
      }
      if (southLen < 2) continue;
      let t = 0;
      for (let i = layerStart[r]!; i < layerStart[r + 1]!; i++) {
        const v = order[i]!;
        const from = succStart[v]!;
        const to = succStart[v + 1]!;
        const t0 = t;
        for (let k = from; k < to; k++)
          targets[t++] = place ? place[leaving[k]!]! : pos[ET[succE[k]!]!]!;
        const d = t - t0;
        if (d < 2) continue;
        if (place && mixed[v]!) {
          // Sort equal-offset edges by destination to avoid counting shared endpoints as crossings.
          for (let a = t0 + 1; a < t; a++) {
            const item = targets[a]!;
            const dx = EFD[leaving[from + a - t0]!]!;
            let b = a - 1;
            while (b >= t0 && EFD[leaving[from + b - t0]!]! === dx && targets[b]! > item) {
              targets[b + 1] = targets[b]!;
              b--;
            }
            targets[b + 1] = item;
          }
        } else if (d <= 12) {
          for (let a = t0 + 1; a < t; a++) {
            const item = targets[a]!;
            let b = a - 1;
            while (b >= t0 && targets[b]! > item) {
              targets[b + 1] = targets[b]!;
              b--;
            }
            targets[b + 1] = item;
          }
        } else {
          targets.subarray(t0, t).sort();
        }
      }
      if (t < 2) continue;
      let leaves = 1;
      while (leaves < southLen) leaves <<= 1;
      tree.fill(0, 0, 2 * leaves);
      for (let k = 0; k < t; k++) {
        let i = targets[k]! + leaves;
        tree[i]!++;
        while (i > 1) {
          if ((i & 1) === 0) total += tree[i + 1]!;
          i >>= 1;
          tree[i]!++;
        }
      }
    }
    return total;
  };

  const declared = count();
  const bary = new Float64Array(n);
  const moving = new Int32Array(widest);
  const spare = new Int32Array(widest);

  // Keep groups contiguous, ordering each by its mean key.
  const groups = groupParent ? groupParent.length : 0;
  const depth = new Int32Array(groups);
  for (let gr = 0; gr < groups; gr++) for (let p = gr; p >= 0; p = groupParent![p]!) depth[gr]!++;
  const groupSum = new Float64Array(groups);
  const groupCount = new Int32Array(groups);
  const groupFirst = new Int32Array(groups);
  const arrange = (r: number, key: Float64Array): void => {
    const s = layerStart[r]!;
    const e = layerStart[r + 1]!;
    for (let i = s; i < e; i++) {
      for (let gr = GRP![order[i]!]!; gr >= 0; gr = groupParent![gr]!) {
        groupSum[gr] = 0;
        groupCount[gr] = 0;
      }
    }
    for (let i = s; i < e; i++) {
      const v = order[i]!;
      for (let gr = GRP![v]!; gr >= 0; gr = groupParent![gr]!) {
        if (groupCount[gr]! === 0) groupFirst[gr] = i;
        groupSum[gr]! += key[v]!;
        groupCount[gr]!++;
      }
    }
    // Compare siblings in their nearest common group; group items use n + group ID.
    const value = (item: number): number =>
      item >= n ? groupSum[item - n]! / groupCount[item - n]! : key[item]!;
    const first = (item: number): number => (item >= n ? groupFirst[item - n]! : s + pos[item]!);
    const compare = (a: number, b: number): number => {
      let ia = a;
      let ib = b;
      let ca = GRP![a]!;
      let cb = GRP![b]!;
      let da = ca < 0 ? 0 : depth[ca]!;
      let db = cb < 0 ? 0 : depth[cb]!;
      for (; da > db; da--) {
        ia = n + ca;
        ca = groupParent![ca]!;
      }
      for (; db > da; db--) {
        ib = n + cb;
        cb = groupParent![cb]!;
      }
      while (ca !== cb) {
        ia = n + ca;
        ca = groupParent![ca]!;
        ib = n + cb;
        cb = groupParent![cb]!;
      }
      return value(ia) - value(ib) || first(ia) - first(ib);
    };
    const row = Array.from(order.subarray(s, e)).sort(compare);
    order.set(row, s);
    for (let i = s; i < e; i++) pos[order[i]!] = i - s;
  };
  if (GRP) {
    const at = new Float64Array(n);
    for (let r = 0; r <= maxRank; r++) {
      for (let i = layerStart[r]!; i < layerStart[r + 1]!; i++) at[order[i]!] = i - layerStart[r]!;
      arrange(r, at);
    }
  }
  let best = GRP ? count() : declared;
  if (best === 0) return [0, declared];
  const bestOrder = order.slice();
  // Require improvements over both the grouped and ungrouped starting orders.
  const start = Math.min(best, declared);

  const sweep = (down: boolean, biasRight: boolean): void => {
    const start = down ? predStart : succStart;
    const list = down ? predE : succE;
    const other = down ? EF : ET;
    const otherDx = down ? EFD : ETD;
    for (let step = 1; step <= maxRank; step++) {
      const r = down ? step : maxRank - step;
      if (fixed[r]!) continue;
      const s = layerStart[r]!;
      const e = layerStart[r + 1]!;
      let movable = 0;
      for (let i = s; i < e; i++) {
        const v = order[i]!;
        const pin = v < real ? nodes[v]!.pin : 0;
        if (pin !== 0) {
          bary[v] = pin * 1e9;
          moving[movable++] = v;
          continue;
        }
        const from = start[v]!;
        const to = start[v + 1]!;
        if (from === to) {
          if (GRP) {
            // Preserve relative position when there are no neighbours in the adjacent rank.
            const across = down
              ? layerStart[r]! - layerStart[r - 1]!
              : layerStart[r + 2]! - layerStart[r + 1]!;
            bary[v] = ((i - s) * across) / (e - s);
            continue;
          }
          bary[v] = -1;
          continue;
        }
        let sum = 0;
        for (let k = from; k < to; k++) {
          const u = other[list[k]!]!;
          sum += pos[u]!;
          if (offsets && W[u]! > 0) sum += otherDx[list[k]!]! / W[u]!;
        }
        bary[v] = sum / (to - from);
        moving[movable++] = v;
      }
      if (GRP) {
        arrange(r, bary);
        continue;
      }
      if (movable < 2) continue;
      sortByBary(moving, movable, bary, pos, biasRight, spare);
      let k = 0;
      for (let i = s; i < e; i++) if (bary[order[i]!]! !== -1) order[i] = moving[k++]!;
      for (let i = s; i < e; i++) pos[order[i]!] = i - s;
    }
  };

  // How many pairs of nodes in one rank are not in the order they were given.
  const outOfOrder = (): number => {
    let total = 0;
    for (let r = 0; r <= maxRank; r++) {
      for (let i = layerStart[r]!; i < layerStart[r + 1]!; i++) {
        if (order[i]! >= real) continue;
        for (let j = i + 1; j < layerStart[r + 1]!; j++) if (order[j]! < order[i]!) total++;
      }
    }
    return total;
  };
  const settlePositions = (): void => {
    for (let r = 0; r <= maxRank; r++)
      for (let i = layerStart[r]!; i < layerStart[r + 1]!; i++) pos[order[i]!] = i - layerStart[r]!;
  };

  // Adjacent swaps can remove crossings missed by barycenter sweeps.
  const pinOf = (v: number): number => (v < real ? nodes[v]!.pin : 0);
  const at = (e: number, up: boolean): number => {
    const u = up ? EF[e]! : ET[e]!;
    return offsets && W[u]! > 0 ? pos[u]! + (up ? EFD[e]! : ETD[e]!) / W[u]! : pos[u]!;
  };
  // Crossings between a and b, assuming a is left of b.
  const between = (a: number, b: number): number => {
    let c = 0;
    for (let k = predStart[a]!; k < predStart[a + 1]!; k++) {
      const x = at(predE[k]!, true);
      for (let j = predStart[b]!; j < predStart[b + 1]!; j++) if (x > at(predE[j]!, true)) c++;
    }
    for (let k = succStart[a]!; k < succStart[a + 1]!; k++) {
      const x = at(succE[k]!, false);
      for (let j = succStart[b]!; j < succStart[b + 1]!; j++) if (x > at(succE[j]!, false)) c++;
    }
    return c;
  };
  const transpose = (): void => {
    for (let pass = 0; pass < 8; pass++) {
      let improved = false;
      for (let r = 0; r <= maxRank; r++) {
        if (fixed[r]!) continue;
        const s = layerStart[r]!;
        for (let i = s; i + 1 < layerStart[r + 1]!; i++) {
          const a = order[i]!;
          const b = order[i + 1]!;
          if (pinOf(a) !== pinOf(b) || (GRP && GRP[a]! !== GRP[b]!)) continue;
          if (between(b, a) >= between(a, b)) continue;
          order[i] = b;
          order[i + 1] = a;
          pos[b] = i - s;
          pos[a] = i + 1 - s;
          improved = true;
        }
      }
      if (!improved) break;
    }
  };

  // The sweeps are run twice from the same start, going down first and going up first. They
  // often end with as few crossings either way but a different order, and then the one that
  // keeps more of the nodes in the order they were given is the less surprising.
  // Only for graphs small enough to be read node by node: a second run costs as much as the first.
  const initial = order.slice();
  const small = n <= 600;
  let chosen = bestOrder;
  let chosenOut = Infinity;
  for (let attempt = 0; attempt < (small ? 2 : 1); attempt++) {
    if (attempt > 0) {
      order.set(initial);
      settlePositions();
    }
    let found = start;
    const foundOrder = initial.slice();
    for (let i = 0, stale = 0; stale < 4 && i < MAX_SWEEPS; i++, stale++) {
      sweep((i + attempt) % 2 === 0, i % 4 >= 2);
      const c = count();
      if (c < found) {
        found = c;
        foundOrder.set(order);
        stale = 0;
        if (c === 0) break;
      }
    }
    order.set(foundOrder);
    if (small && found > 0) {
      settlePositions();
      transpose();
      const c = count();
      if (c < found) {
        found = c;
        foundOrder.set(order);
      }
    }
    const out = small ? outOfOrder() : 0;
    if (attempt === 0 || found < best || (found === best && out < chosenOut)) {
      best = found;
      chosen = foundOrder;
      chosenOut = out;
    }
  }
  order.set(chosen);
  settlePositions();
  bestOrder.set(chosen);
  // The retained grouped order may exceed the ungrouped threshold; recount it.
  if (GRP) best = count();

  // A drawing and its mirror image cross as often too. Of those two, likewise.
  if (!small) return [best, declared];
  for (let i = 0; i < real; i++) if (nodes[i]!.pin !== 0) return [best, declared];
  if (chosenOut === 0 || fixed[0]! || fixed[maxRank]!) return [best, declared];
  for (let r = 0; r <= maxRank; r++) order.subarray(layerStart[r]!, layerStart[r + 1]!).reverse();
  settlePositions();
  if (count() > best || outOfOrder() >= chosenOut) order.set(bestOrder);
  return [best, declared];
}

// Half the room a node, bend or port takes across the flow, with its share of the gap beside it.
// A port on a group's border is a point that an edge passes through, and needs no more than a bend.
function halfRoom(g: Graph, opt: LayeredOptions, v: number): number {
  return g.W[v]! / 2 + (g.KIND[v]! === Kind.Node ? opt.nodeSep : opt.edgeSep) / 2;
}

// Brandes-Köpf horizontal coordinate assignment: four aligned layouts, balanced.
function position(g: Graph, opt: LayeredOptions): Float64Array {
  const {
    n,
    maxRank,
    W,
    KIND,
    EF,
    ET,
    EFD,
    ETD,
    succStart,
    succE,
    predStart,
    predE,
    layerStart,
    order,
    pos,
  } = g;
  const segments = EF.length;
  const gap = new Float64Array(n);
  for (let i = 0; i < n; i++) gap[i] = halfRoom(g, opt, i);

  // Neighbours in left-to-right order, so the medians can be read off directly.
  const key = new Int32Array(segments);
  for (let e = 0; e < segments; e++) key[e] = pos[ET[e]!]!;
  for (let v = 0; v < n; v++)
    if (succStart[v + 1]! - succStart[v]! > 1)
      sortRange(succE, succStart[v]!, succStart[v + 1]!, key);
  for (let e = 0; e < segments; e++) key[e] = pos[EF[e]!]!;
  for (let v = 0; v < n; v++)
    if (predStart[v + 1]! - predStart[v]! > 1)
      sortRange(predE, predStart[v]!, predStart[v + 1]!, key);

  // An edge between two real nodes may not cross a dummy-to-dummy segment; mark those that would.
  const conflict = new Uint8Array(segments);
  for (let r = 1; r <= maxRank; r++) {
    const prevLen = layerStart[r]! - layerStart[r - 1]!;
    const s = layerStart[r]!;
    const end = layerStart[r + 1]!;
    let k0 = 0;
    let scan = s;
    for (let i = s; i < end; i++) {
      const v = order[i]!;
      let inner = -1;
      if (isDummy(KIND[v]!)) {
        const u = EF[predE[predStart[v]!]!]!;
        if (isDummy(KIND[u]!)) inner = u;
      }
      const k1 = inner >= 0 ? pos[inner]! : prevLen;
      if (inner >= 0 || i === end - 1) {
        for (let j = scan; j <= i; j++) {
          const w = order[j]!;
          const wDummy = isDummy(KIND[w]!);
          for (let k = predStart[w]!; k < predStart[w + 1]!; k++) {
            const e = predE[k]!;
            const up = pos[EF[e]!]!;
            if ((up < k0 || k1 < up) && !(wDummy && isDummy(KIND[EF[e]!]!))) conflict[e] = 1;
          }
        }
        scan = i + 1;
        k0 = k1;
      }
    }
  }

  const results: Float64Array[] = [];
  const root = new Int32Array(n);
  const align = new Int32Array(n);
  // Offset of each node from its block's root, so that aligned edges meet at their attachment points.
  const shift = new Float64Array(n);
  const eFrom = new Int32Array(n);
  const eTo = new Int32Array(n);
  const eW = new Float64Array(n);
  const indeg = new Int32Array(n);
  const outStart = new Int32Array(n + 1);
  const outE = new Int32Array(n);
  const fill = new Int32Array(n);
  const topo = new Int32Array(n);
  const x = new Float64Array(n);

  for (let variant = 0; variant < 4; variant++) {
    const up = variant < 2;
    const right = (variant & 1) === 1;
    const start = up ? predStart : succStart;
    const list = up ? predE : succE;
    const other = up ? EF : ET;
    const ownDx = up ? ETD : EFD;
    const otherDx = up ? EFD : ETD;
    for (let i = 0; i < n; i++) {
      root[i] = i;
      align[i] = i;
      shift[i] = 0;
      indeg[i] = 0;
      outStart[i + 1] = 0;
      x[i] = 0;
    }

    for (let step = 0; step <= maxRank; step++) {
      const r = up ? step : maxRank - step;
      const s = layerStart[r]!;
      const end = layerStart[r + 1]!;
      const adjacent = up ? r - 1 : r + 1;
      const adjacentLast =
        adjacent >= 0 && adjacent <= maxRank
          ? layerStart[adjacent + 1]! - layerStart[adjacent]! - 1
          : 0;
      let prevIdx = -1;
      for (let i = right ? end - 1 : s; right ? i >= s : i < end; right ? i-- : i++) {
        const v = order[i]!;
        const from = start[v]!;
        const d = start[v + 1]! - from;
        if (d === 0) continue;
        const lo = from + ((d - 1) >> 1);
        const hi = from + (d >> 1);
        for (let pass = 0; pass < 2; pass++) {
          if (pass === 1 && lo === hi) break;
          const e = list[(pass === 0) !== right ? lo : hi]!;
          const w = other[e]!;
          const idx = right ? adjacentLast - pos[w]! : pos[w]!;
          if (align[v]! === v && prevIdx < idx && conflict[e]! === 0) {
            align[w] = v;
            align[v] = root[v] = root[w]!;
            shift[v] = shift[w]! + otherDx[e]! - ownDx[e]!;
            prevIdx = idx;
          }
        }
      }
    }

    let blockEdges = 0;
    for (let r = 0; r <= maxRank; r++) {
      const s = layerStart[r]!;
      const end = layerStart[r + 1]!;
      for (let i = s + 1; i < end; i++) {
        const a = right ? order[i]! : order[i - 1]!;
        const b = right ? order[i - 1]! : order[i]!;
        const sep = gap[a]! + gap[b]!;
        eFrom[blockEdges] = root[a]!;
        eTo[blockEdges] = root[b]!;
        eW[blockEdges] = right ? sep - shift[a]! + shift[b]! : sep + shift[a]! - shift[b]!;
        indeg[root[b]!]!++;
        outStart[root[a]! + 1]!++;
        blockEdges++;
      }
    }
    for (let i = 0; i < n; i++) outStart[i + 1]! += outStart[i]!;
    for (let i = 0; i < n; i++) fill[i] = outStart[i]!;
    for (let e = 0; e < blockEdges; e++) outE[fill[eFrom[e]!]!++] = e;

    let count = 0;
    for (let i = 0; i < n; i++) if (root[i]! === i && indeg[i]! === 0) topo[count++] = i;
    for (let q = 0; q < count; q++) {
      const v = topo[q]!;
      for (let k = outStart[v]!; k < outStart[v + 1]!; k++) {
        const e = outE[k]!;
        const w = eTo[e]!;
        if (x[v]! + eW[e]! > x[w]!) x[w] = x[v]! + eW[e]!;
        if (--indeg[w]! === 0) topo[count++] = w;
      }
    }
    for (let q = count - 1; q >= 0; q--) {
      const v = topo[q]!;
      let min = Infinity;
      for (let k = outStart[v]!; k < outStart[v + 1]!; k++) {
        const e = outE[k]!;
        const cand = x[eTo[e]!]! - eW[e]!;
        if (cand < min) min = cand;
      }
      if (min !== Infinity && min > x[v]!) x[v] = min;
    }
    const xs = new Float64Array(n);
    for (let i = 0; i < n; i++) xs[i] = (right ? -x[root[i]!]! : x[root[i]!]!) + shift[i]!;
    results.push(xs);
  }

  let narrowest = 0;
  let bestWidth = Infinity;
  const mins: number[] = [];
  const maxs: number[] = [];
  for (let k = 0; k < 4; k++) {
    let lo = Infinity;
    let hi = -Infinity;
    const xs = results[k]!;
    for (let i = 0; i < n; i++) {
      const half = W[i]! / 2;
      if (xs[i]! - half < lo) lo = xs[i]! - half;
      if (xs[i]! + half > hi) hi = xs[i]! + half;
    }
    mins.push(lo);
    maxs.push(hi);
    if (hi - lo < bestWidth) {
      bestWidth = hi - lo;
      narrowest = k;
    }
  }
  for (let k = 0; k < 4; k++) {
    const delta = (k & 1) === 0 ? mins[narrowest]! - mins[k]! : maxs[narrowest]! - maxs[k]!;
    if (delta !== 0) {
      const xs = results[k]!;
      for (let i = 0; i < n; i++) xs[i]! += delta;
    }
  }

  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let a = results[0]![i]!;
    let b = results[1]![i]!;
    let c = results[2]![i]!;
    let d = results[3]![i]!;
    let t: number;
    if (a > b) {
      t = a;
      a = b;
      b = t;
    }
    if (c > d) {
      t = c;
      c = d;
      d = t;
    }
    if (a > c) {
      t = a;
      a = c;
      c = t;
    }
    if (b > d) {
      t = b;
      b = d;
      d = t;
    }
    if (b > c) {
      t = b;
      b = c;
      c = t;
    }
    out[i] = (b + c) / 2;
  }
  return out;
}
