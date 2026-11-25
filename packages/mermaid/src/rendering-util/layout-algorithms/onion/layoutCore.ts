import type { LayoutData, Node } from '../../types.js';
import { boxOf, buildContext, type Context, type OnionArrangement } from './context.js';
import { boxCorners, hexagonPolygon, segmentsCross, type Box, type Vec } from './geometry.js';
import {
  arrangeOrder,
  FRAME_PAD,
  remapGroup,
  GRID_GAP,
  sectorOffset,
  sectorPitch,
  ellipsePoint,
  type Order,
  type OrderParams,
} from './ordering.js';
import {
  countConflicts,
  edgeSegment,
  makeFrameShape,
  placedLabels,
  scan,
  scanNewNode,
  type Frame,
  type FrameShape,
  type Scene,
} from './scene.js';
import type { PortKind } from './structure.js';

export type { OnionArrangement } from './context.js';
export { OnionLayoutError } from './structure.js';

/** Roof height as a share of the frame's half-width. */
const HEX_SLOPE_INNER = 0.15;
/** The core and adapters frames carry ports and adapters on their roofs, so a deep roof costs height there. */
const HEX_SLOPE_OUTER = 0.1;
/** How much of a band's thickness is also added across the spoke axis. */
const CROSS_BAND_SHARE = 0.3;
const TITLE_GAP = 12;
const DEFAULT_OPTIONS: OnionOptions = { swapPasses: 2, sweeps: 2 };
const ASPECT_RANGE = { min: 0.6, max: 1.6 } as const;

/** Starting point and the alternatives tried one at a time around it. */
/** Multiples of the port pitch tried when a layout still has overlaps. */
const PORT_SPREADS = [1.5, 2.2, 3.2] as const;

const BASE_PARAMS: OrderParams = {
  aspect: 2.2,
  phase: 0,
  roundness: 2,
  pitchScale: 1.2,
  portPull: 0,
};
const ALTERNATIVES: { [K in keyof OrderParams]: readonly number[] } = {
  aspect: [1.6, 3],
  phase: [],
  roundness: [3.5],
  pitchScale: [1, 1.7],
  portPull: [],
};

export interface OnionOptions {
  /** Passes of neighbour swaps that cut edge crossings and length; 0 keeps the barycentre order. */
  swapPasses: number;
  /** Sweeps over the groups' reorderings, each reordering laid out for real; 0 keeps the order from the neighbour-barycentre and swap passes. */
  sweeps: number;
}

export interface OnionResult {
  /** Chosen box of each labelled edge's label, in layout space. */
  labelBoxes: ReadonlyMap<string, Box>;
  /** Outline and title box of each ring frame that is painted. */
  frames: ReadonlyMap<string, { poly: readonly Vec[]; title: Box }>;
  /** Overlaps the chosen layout still has (0 means every rule held). */
  conflicts: number;
  /** Each remaining overlap, named. */
  conflictReport: readonly string[];
  /** Pairs of edges with no shared node that cross. */
  crossings: number;
  /** Summed straight edge length between visible ends. */
  edgeLengthPx: number;
  width: number;
  height: number;
}

interface Solution {
  boxes: Map<string, Box>;
  frames: Map<string, Frame>;
  labels: Map<string, Box>;
  conflicts: number;
  crossings: number;
  width: number;
  height: number;
  order: Order;
  scene: Scene;
}

/** Hexagon centred on the origin that encloses the boxes and points, with the ring's title above. */
function fitFrame(
  ctx: Context,
  ring: Node | undefined,
  boxes: readonly Box[],
  points: readonly Vec[],
  padX: number,
  padY: number
): Frame {
  const titleW = ring?.labelBBox?.width ?? 0;
  const titleH = ring?.labelBBox?.height ?? 0;
  const margin = ring?.padding ?? 8;
  const corners = [...boxes.flatMap((b) => boxCorners(b)), ...points];
  const widest = Math.max(0, ...corners.map((p) => Math.abs(p.x)));
  const halfW = Math.max(widest + padX, titleW / 2 + margin, 1);
  const depth =
    (ring && (ring === ctx.structure.core || ring === ctx.structure.outer)
      ? HEX_SLOPE_OUTER
      : HEX_SLOPE_INNER) * halfW;
  const titleTop = Math.min(depth, (depth * (titleW + margin)) / (2 * halfW));
  const titleZone = titleW / 2 + margin;

  let halfH = 0;
  for (const p of corners) {
    halfH = Math.max(halfH, Math.abs(p.y) + padY + depth * (Math.abs(p.x) / halfW));
  }
  // Anything whose span reaches under the title pushes the roof up by the title's height.
  const reachesTitle = (xMin: number, xMax: number) => xMin < titleZone && xMax > -titleZone;
  if (titleH > 0) {
    for (const b of boxes) {
      if (reachesTitle(b.x - b.width / 2, b.x + b.width / 2)) {
        const top = b.y - b.height / 2;
        halfH = Math.max(halfH, titleTop + titleH + TITLE_GAP + (top < 0 ? -top : 0));
      }
    }
    for (const p of points) {
      if (reachesTitle(p.x, p.x) && p.y < 0) {
        halfH = Math.max(halfH, titleTop + titleH + TITLE_GAP - p.y);
      }
    }
  }
  halfH = Math.max(halfH, depth, 1);
  const width = 2 * halfW;
  const height = 2 * halfH;
  return {
    width,
    height,
    depth,
    poly: hexagonPolygon(width, height, depth),
    title: { x: 0, y: -halfH + titleTop + titleH / 2, width: titleW, height: titleH },
  };
}

/** The frame's outline pushed outwards by `band` px along the spoke axis and a share of it across. */
function bandOutline(frame: Frame, band: number, arrangement: OnionArrangement): Vec[] {
  const growX = arrangement === 'horizontal' ? band : band * CROSS_BAND_SHARE;
  const growY = arrangement === 'horizontal' ? band * CROSS_BAND_SHARE : band;
  return hexagonPolygon(frame.width + 2 * growX, frame.height + 2 * growY, frame.depth);
}

/** Where the straight spoke at `perp` (across the spoke axis) leaves the outline on its sector's side. */
function spokePoint(
  outline: readonly Vec[],
  arrangement: OnionArrangement,
  kind: PortKind,
  perp: number
): Vec {
  const vertical = arrangement === 'vertical';
  const across = (p: Vec) => (vertical ? p.x : p.y);
  const along = (p: Vec) => (vertical ? p.y : p.x);
  const lo = Math.min(...outline.map(across));
  const hi = Math.max(...outline.map(across));
  const at = Math.min(hi - 0.5, Math.max(lo + 0.5, perp));
  const hits: number[] = [];
  for (let i = 0; i < outline.length; i++) {
    const p = outline[i];
    const q = outline[(i + 1) % outline.length];
    const pa = across(p);
    const qa = across(q);
    if (pa === qa) {
      if (pa === at) {
        hits.push(along(p), along(q));
      }
    } else if ((at - pa) * (at - qa) <= 0) {
      hits.push(along(p) + ((at - pa) / (qa - pa)) * (along(q) - along(p)));
    }
  }
  const outer = kind === 'driving' ? Math.min(...hits) : Math.max(...hits);
  return vertical ? { x: at, y: outer } : { x: outer, y: at };
}

/**
 * Smallest value of a rising parameter whose trial clears every overlap beyond `allowed`; the
 * value with the fewest overlaps when none does. A coarse pass finds the neighbourhood, a fine
 * pass walks back to the first clear step inside it.
 */
function searchSmallest(
  from: number,
  to: number,
  step: number,
  conflictsAt: (value: number) => number,
  allowed: number
): number {
  const coarse = step * 5;
  let best = from;
  let bestCount = Number.POSITIVE_INFINITY;
  let hit: number | undefined;
  for (let v = from; v <= to; v += coarse) {
    const count = conflictsAt(v);
    if (count <= allowed) {
      hit = v;
      break;
    }
    if (count < bestCount) {
      bestCount = count;
      best = v;
    }
  }
  if (hit === undefined) {
    return best;
  }
  for (let v = Math.max(from, hit - coarse + step); v < hit; v += step) {
    if (conflictsAt(v) <= allowed) {
      return v;
    }
  }
  return hit;
}

/** Runs `fn` with extra boxes and frames in the scene, then takes them out again. */
function withTrial<T>(
  scene: Scene,
  boxes: ReadonlyMap<string, Box>,
  frames: FrameShape[],
  fn: () => T
): T {
  const previous = new Map<string, Box | undefined>();
  for (const [id, box] of boxes) {
    previous.set(id, scene.boxes.get(id));
    scene.boxes.set(id, box);
  }
  scene.frames.push(...frames);
  try {
    return fn();
  } finally {
    scene.frames.length -= frames.length;
    for (const [id, old] of previous) {
      if (old) {
        scene.boxes.set(id, old);
      } else {
        scene.boxes.delete(id);
      }
    }
  }
}

function frameShape(ctx: Context, ringId: string | undefined, frame: Frame): FrameShape {
  const members = ringId === undefined ? undefined : ctx.leafMembers.get(ringId);
  return makeFrameShape(frame, ringId ?? '', members ?? new Set());
}

function packInnermost(
  ctx: Context,
  ids: readonly string[],
  order: Order,
  gap: number
): Map<string, Box> {
  if (ids.length === 0) {
    return new Map();
  }
  const cols = Math.ceil(Math.sqrt(ids.length));
  const cell = ids.map((id) => {
    const slot = order.slot.get(id)!;
    return { id, row: Math.floor(slot / cols), col: slot % cols };
  });
  const rowCount = Math.max(...cell.map((c) => c.row)) + 1;
  const colWidth = Array.from({ length: cols }, (_, c) =>
    Math.max(0, ...cell.filter((x) => x.col === c).map((x) => ctx.size.get(x.id)!.width))
  );
  const rowHeight = Array.from({ length: rowCount }, (_, r) =>
    Math.max(0, ...cell.filter((x) => x.row === r).map((x) => ctx.size.get(x.id)!.height))
  );
  const offset = (sizes: readonly number[], i: number) =>
    sizes.slice(0, i).reduce((s, v) => s + v + gap, 0) + sizes[i] / 2;
  const totalW = colWidth.reduce((s, v) => s + v, 0) + gap * (cols - 1);
  const totalH = rowHeight.reduce((s, v) => s + v, 0) + gap * (rowCount - 1);
  const placed = cell.map((c) => ({
    id: c.id,
    x: offset(colWidth, c.col) - totalW / 2,
    y: offset(rowHeight, c.row) - totalH / 2,
  }));
  // Recentre on the mean of the node centres: the metric the domain's position is judged by.
  const meanX = placed.reduce((s, b) => s + b.x, 0) / placed.length;
  const meanY = placed.reduce((s, b) => s + b.y, 0) / placed.length;
  return new Map(placed.map((b) => [b.id, boxOf(ctx, b.id, b.x - meanX, b.y - meanY)]));
}

interface SpokeSide {
  kind: PortKind;
  perp: number;
}

function solve(ctx: Context, params: OrderParams, order: Order, spread = 1): Solution {
  const { structure, arrangement } = ctx;
  const scene: Scene = { boxes: new Map(), frames: [] };
  const frames = new Map<string, Frame>();
  const lastRing = structure.innerRings.length - 1;

  // Innermost ring: a packed grid on the centre. The grid opens up until the labels of edges
  // inside the ring fit between its nodes.
  const innermost = structure.innerRings[lastRing];
  const innermostIds = structure.innerLeafIds[lastRing];
  const fitInnermost = (gap: number) => {
    const boxes = packInnermost(ctx, innermostIds, order, gap);
    const frame = fitFrame(ctx, innermost, [...boxes.values()], [], FRAME_PAD, FRAME_PAD);
    return { boxes, frame };
  };
  const gridGap = searchSmallest(
    GRID_GAP,
    400,
    4,
    (gap) => {
      const trial = fitInnermost(gap);
      return withTrial(scene, trial.boxes, [frameShape(ctx, innermost.id, trial.frame)], () =>
        countConflicts(ctx, scene)
      );
    },
    0
  );
  const first = fitInnermost(gridGap);
  first.boxes.forEach((box, id) => scene.boxes.set(id, box));
  let inner = first.frame;
  frames.set(innermost.id, inner);
  scene.frames.push(frameShape(ctx, innermost.id, inner));

  // Middle rings: leaves on a generalised ellipse around the next ring in.
  for (let j = lastRing - 1; j >= 0; j--) {
    const ring = structure.innerRings[j];
    const ids = structure.innerLeafIds[j];
    const baseline = countConflicts(ctx, scene);
    const innerPoly = inner.poly;
    const ringAt = (t: number) => {
      const boxes = new Map<string, Box>(
        ids.map((id) => {
          const theta = order.ringAngles[j][order.slot.get(id)!];
          const p = ellipsePoint(theta, params.aspect * t, t, params.roundness);
          return [id, boxOf(ctx, id, p.x, p.y)];
        })
      );
      const frame = fitFrame(ctx, ring, [...boxes.values()], innerPoly, FRAME_PAD, FRAME_PAD);
      return { boxes, frame };
    };
    const t = searchSmallest(
      30,
      3000,
      6,
      (value) => {
        const trial = ringAt(value);
        return withTrial(scene, trial.boxes, [frameShape(ctx, ring.id, trial.frame)], () =>
          countConflicts(ctx, scene)
        );
      },
      baseline
    );
    const placed = ringAt(t);
    placed.boxes.forEach((box, id) => scene.boxes.set(id, box));
    inner = placed.frame;
    frames.set(ring.id, inner);
    scene.frames.push(frameShape(ctx, ring.id, inner));
  }

  // Ports sit in a row along their sector, evenly pitched, in the order the ordering stage found.
  const spoke = new Map<string, SpokeSide>();
  for (const kind of ['driving', 'driven'] as const) {
    const group = structure.ports
      .filter((p) => p.kind === kind)
      .sort((p, q) => order.slot.get(p.id)! - order.slot.get(q.id)!);
    const pitch = sectorPitch(ctx, kind, params) * spread;
    group.forEach((p, i) =>
      spoke.set(p.id, { kind, perp: sectorOffset(ctx, kind, i, group.length, pitch) })
    );
  }

  // Core: frame around the inner rings, ports centred on its border.
  const core = structure.core;
  const coreInner = inner.poly;
  const baselineCore = countConflicts(ctx, scene);
  const coreAt = (t: number) => {
    const padX = arrangement === 'horizontal' ? t : FRAME_PAD + t * CROSS_BAND_SHARE;
    const padY = arrangement === 'horizontal' ? FRAME_PAD + t * CROSS_BAND_SHARE : t;
    const frame = fitFrame(ctx, core, [], coreInner, padX, padY);
    const boxes = new Map<string, Box>();
    for (const port of structure.ports) {
      const side = spoke.get(port.id)!;
      const centre = spokePoint(frame.poly, arrangement, side.kind, side.perp);
      boxes.set(port.id, boxOf(ctx, port.id, centre.x, centre.y));
    }
    return { frame, boxes };
  };
  const coreT = searchSmallest(
    10,
    2500,
    6,
    (t) => {
      const trial = coreAt(t);
      return withTrial(scene, trial.boxes, [frameShape(ctx, core.id, trial.frame)], () =>
        countConflicts(ctx, scene)
      );
    },
    baselineCore
  );
  const placedCore = coreAt(coreT);
  placedCore.boxes.forEach((box, id) => scene.boxes.set(id, box));
  frames.set(core.id, placedCore.frame);
  scene.frames.push(frameShape(ctx, core.id, placedCore.frame));

  // Adapters: straight out from their port, on the core outline pushed outwards together.
  const adapterSpoke = new Map<string, SpokeSide>();
  const stray = (id: string): SpokeSide => {
    const known = (structure.neighbours.get(id) ?? []).flatMap(
      (n) => spoke.get(n) ?? adapterSpoke.get(n) ?? []
    );
    return known[0] ?? { kind: 'driven', perp: 0 };
  };
  for (const id of structure.adapterIds) {
    const port = structure.ports.find((p) => (structure.neighbours.get(id) ?? []).includes(p.id));
    adapterSpoke.set(id, port ? spoke.get(port.id)! : stray(id));
  }
  const baselineAdapters = countConflicts(ctx, scene);
  const adaptersAt = (band: number): Map<string, Box> => {
    const outline = bandOutline(placedCore.frame, band, arrangement);
    const out = new Map<string, Box>();
    for (const [id, side] of adapterSpoke) {
      const c = spokePoint(outline, arrangement, side.kind, side.perp);
      out.set(id, boxOf(ctx, id, c.x, c.y));
    }
    return out;
  };
  const adapterBand = searchSmallest(
    0,
    900,
    6,
    (band) => withTrial(scene, adaptersAt(band), [], () => countConflicts(ctx, scene)),
    baselineAdapters
  );
  adaptersAt(adapterBand).forEach((box, id) => scene.boxes.set(id, box));

  // Outer ring (when the diagram has one) around adapters and ports. Without it a frame is still
  // fitted, unpainted, to give the externals an outline to stand off from.
  const outerBoxes = [...structure.adapterIds, ...structure.ports.map((p) => p.id)].map(
    (id) => scene.boxes.get(id)!
  );
  const outer = fitFrame(
    ctx,
    structure.outer,
    outerBoxes,
    placedCore.frame.poly,
    FRAME_PAD,
    FRAME_PAD
  );
  if (structure.outer) {
    frames.set(structure.outer.id, outer);
    scene.frames.push(frameShape(ctx, structure.outer.id, outer));
  }

  // Externals: beyond the outer frame, in line with the adapters they reach.
  for (const id of structure.externalIds) {
    const reached = (structure.neighbours.get(id) ?? []).flatMap((n) => adapterSpoke.get(n) ?? []);
    const side: SpokeSide = reached[0]
      ? {
          kind: reached[0].kind,
          perp: reached.reduce((sum, r) => sum + r.perp, 0) / reached.length,
        }
      : stray(id);
    const settled = placedLabels(ctx, scene);
    const at = (band: number): Box => {
      const c = spokePoint(
        bandOutline(outer, band, arrangement),
        arrangement,
        side.kind,
        side.perp
      );
      return boxOf(ctx, id, c.x, c.y);
    };
    const band = searchSmallest(
      0,
      900,
      6,
      (value) =>
        withTrial(scene, new Map([[id, at(value)]]), [], () =>
          scanNewNode(ctx, scene, id, settled)
        ),
      0
    );
    scene.boxes.set(id, at(band));
  }

  const result = scan(ctx, scene, false);
  const xs: number[] = [];
  const ys: number[] = [];
  for (const b of scene.boxes.values()) {
    for (const c of boxCorners(b)) {
      xs.push(c.x);
      ys.push(c.y);
    }
  }
  for (const f of frames.values()) {
    for (const p of f.poly) {
      xs.push(p.x);
      ys.push(p.y);
    }
  }
  return {
    boxes: scene.boxes,
    frames,
    labels: result.labels,
    conflicts: result.count,
    crossings: edgeStats(ctx, scene.boxes).crossings,
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
    order,
    scene,
  };
}

function isOutsideAspectRange(s: Solution): number {
  const aspect = s.width / s.height;
  return aspect < ASPECT_RANGE.min || aspect > ASPECT_RANGE.max ? 1 : 0;
}

/** Bounding area, with each edge crossing counted as this many px² of it: a tie-break between near-equal areas. */
const CROSSING_AREA_PX2 = 40_000;
/** Each overlap the layout could not clear is priced as this share of its area. */
const CONFLICT_AREA_SHARE = 0.5;

function layoutCost(s: Solution): number {
  return (
    (s.width * s.height + s.crossings * CROSSING_AREA_PX2) * (1 + CONFLICT_AREA_SHARE * s.conflicts)
  );
}

/** Fewer conflicts first, then an aspect inside the target range, then the lower area-plus-crossings cost. */
function compareSolutions(a: Solution, b: Solution): number {
  return isOutsideAspectRange(a) - isOutsideAspectRange(b) || layoutCost(a) - layoutCost(b);
}

/** Largest area growth the crossing polish may pay for removing a crossing. */
const CROSSING_POLISH_AREA_SLACK = 1.04;

/** Whether variant `i` of `variantsOf(order, g)` swaps two neighbouring slots (or turns a ring by one). */
function isNeighbourSwap(order: Order, g: number, i: number): boolean {
  const n = order.groups[g].ids.length;
  return order.groups[g].cyclic ? i === 0 || i === n - 2 : i >= 1;
}

/** Reorderings of one group of an order: every turn and mirror of a ring, every neighbour swap and the reversal of a sector. */
function variantsOf(order: Order, g: number, grid: boolean): ((slot: number) => number)[] {
  const n = order.groups[g].ids.length;
  if (n < 2) {
    return [];
  }
  if (grid) {
    // The innermost grid is small: try every pair of cells.
    return Array.from({ length: n * n }, (_, k) => [Math.floor(k / n), k % n] as const)
      .filter(([i, j]) => i < j)
      .map(
        ([i, j]) =>
          (s: number) =>
            s === i ? j : s === j ? i : s
      );
  }
  if (order.groups[g].cyclic) {
    return [
      ...Array.from({ length: n - 1 }, (_, k) => (s: number) => (s + k + 1) % n),
      ...Array.from({ length: n }, (_, k) => (s: number) => (k + n - s) % n),
    ];
  }
  return [
    (s) => n - 1 - s,
    ...Array.from(
      { length: n - 1 },
      (_, i) => (s: number) => (s === i ? i + 1 : s === i + 1 ? i : s)
    ),
  ];
}

/**
 * Starts from the neighbour-barycentre order and sweeps each group once: every reordering of it is
 * laid out for real, and the best is kept. The innermost grid is tried cell pair by cell pair.
 */
function searchFrom(ctx: Context, options: OnionOptions, start: OrderParams): Solution {
  let params = start;
  let order = arrangeOrder(ctx, params, options.swapPasses);
  let best = solve(ctx, params, order);
  const lastRing = ctx.structure.innerRings.length - 1;
  for (let sweep = 0; sweep < options.sweeps; sweep++) {
    let improved = false;
    for (let g = 0; g < order.groups.length; g++) {
      const start = order;
      for (const remap of variantsOf(start, g, g === lastRing)) {
        const trialOrder = remapGroup(start, g, remap);
        const trial = solve(ctx, params, trialOrder);
        if (compareSolutions(trial, best) < 0) {
          best = trial;
          order = trialOrder;
          improved = true;
        }
      }
    }
    if (!improved) {
      break;
    }
  }
  for (const key of ['aspect', 'pitchScale', 'roundness'] as const) {
    for (const value of ALTERNATIVES[key]) {
      const trialParams = { ...params, [key]: value };
      const trial = solve(ctx, trialParams, order);
      if (compareSolutions(trial, best) < 0) {
        best = trial;
        params = trialParams;
      }
    }
  }
  // Polish: accept a neighbour swap that removes a crossing for at most a little more area.
  if (options.sweeps > 0 && best.crossings > 0) {
    const areaBudget = best.width * best.height * CROSSING_POLISH_AREA_SLACK;
    for (let g = 0; g < order.groups.length; g++) {
      if (best.crossings === 0) {
        continue;
      }
      const start = order;
      for (const remap of variantsOf(start, g, false).filter((_, i) =>
        isNeighbourSwap(start, g, i)
      )) {
        const trialOrder = remapGroup(start, g, remap);
        const trial = solve(ctx, params, trialOrder);
        if (
          trial.conflicts <= best.conflicts &&
          trial.crossings < best.crossings &&
          trial.width * trial.height <= areaBudget
        ) {
          best = trial;
          order = trialOrder;
        }
      }
    }
  }
  // Fallback: when some overlap is left, spread the port rows further apart and lay out again.
  for (const spread of best.conflicts > 0 ? PORT_SPREADS : []) {
    const trial = solve(ctx, params, order, spread);
    if (compareSolutions(trial, best) < 0) {
      best = trial;
    }
  }
  return best;
}

/** Where the first slot of a middle ring sits, tried in turn while the layout still has overlaps. */
const RESTART_PHASES = [0.5, 0.25, 0.75] as const;

function searchLayouts(ctx: Context, options: OnionOptions): Solution {
  let best = searchFrom(ctx, options, BASE_PARAMS);
  for (const phase of best.conflicts > 0 && options.sweeps > 0 ? RESTART_PHASES : []) {
    const trial = searchFrom(ctx, options, { ...BASE_PARAMS, phase });
    if (compareSolutions(trial, best) < 0) {
      best = trial;
    }
  }
  return best;
}

function edgeStats(
  ctx: Context,
  boxes: ReadonlyMap<string, Box>
): { crossings: number; length: number } {
  const routes = ctx.edges.flatMap((e) => {
    const a = boxes.get(e.start);
    const b = boxes.get(e.end);
    return a && b ? [{ e, seg: edgeSegment(ctx, e, a, b) }] : [];
  });
  let crossings = 0;
  for (let i = 0; i < routes.length; i++) {
    for (let j = i + 1; j < routes.length; j++) {
      const p = routes[i];
      const q = routes[j];
      const shared =
        p.e.start === q.e.start ||
        p.e.start === q.e.end ||
        p.e.end === q.e.start ||
        p.e.end === q.e.end;
      if (!shared && segmentsCross(p.seg.from, p.seg.to, q.seg.from, q.seg.to)) {
        crossings++;
      }
    }
  }
  const length = routes.reduce(
    (s, x) => s + Math.hypot(x.seg.to.x - x.seg.from.x, x.seg.to.y - x.seg.from.y),
    0
  );
  return { crossings, length };
}

/** Writes node centres, frame sizes and straight edge routes onto `data`; reads only measured sizes. */
export function runOnionLayoutCore(
  data: LayoutData,
  arrangement: OnionArrangement,
  options: OnionOptions = DEFAULT_OPTIONS
): OnionResult {
  const ctx = buildContext(data, arrangement);
  const best = searchLayouts(ctx, options);
  const byId = new Map(data.nodes.map((n) => [n.id, n]));
  best.boxes.forEach((box, id) => {
    const node = byId.get(id);
    if (node) {
      node.x = box.x;
      node.y = box.y;
    }
  });
  const framesOut = new Map<string, { poly: readonly Vec[]; title: Box }>();
  best.frames.forEach((frame, id) => {
    const node = byId.get(id);
    if (node?.isGroup) {
      node.x = 0;
      node.y = 0;
      node.width = frame.width;
      node.height = frame.height;
      node.hexagonPointDepth = frame.depth;
      framesOut.set(id, { poly: frame.poly, title: frame.title });
    }
  });
  for (const id of ctx.structure.sideGroupIds) {
    const node = byId.get(id);
    const members = data.nodes.filter((n) => n.parentId === id && best.boxes.has(n.id));
    if (node && members.length > 0) {
      const boxes = members.map((n) => best.boxes.get(n.id)!);
      const xs = boxes.flatMap((b) => [b.x - b.width / 2, b.x + b.width / 2]);
      const ys = boxes.flatMap((b) => [b.y - b.height / 2, b.y + b.height / 2]);
      node.x = (Math.min(...xs) + Math.max(...xs)) / 2;
      node.y = (Math.min(...ys) + Math.max(...ys)) / 2;
      node.width = Math.max(...xs) - Math.min(...xs);
      node.height = Math.max(...ys) - Math.min(...ys);
    }
  }
  const edgeById = new Map(data.edges.map((e) => [e.id, e]));
  for (const e of ctx.edges) {
    const edge = edgeById.get(e.id);
    const src = best.boxes.get(e.start);
    const dst = best.boxes.get(e.end);
    if (!edge || !src || !dst) {
      continue;
    }
    const seg = edgeSegment(ctx, e, src, dst);
    // Three collinear points: the shared painter drops the first and last and clips the middle.
    edge.points = [{ x: src.x, y: src.y }, seg.anchor, { x: dst.x, y: dst.y }];
    const label = best.labels.get(e.id);
    // The painter lands the label at edge.x/y plus how far clipping moved the path midpoint.
    edge.x = (label?.x ?? seg.mid.x) - (seg.mid.x - seg.anchor.x);
    edge.y = (label?.y ?? seg.mid.y) - (seg.mid.y - seg.anchor.y);
  }
  for (const e of ctx.loops) {
    const edge = edgeById.get(e.id);
    const box = best.boxes.get(e.start);
    if (!edge || !box) {
      continue;
    }
    // A small loop off the right side; the painter clips its first and last points to the shape.
    const rx = box.x + box.width / 2;
    edge.points = [
      { x: box.x, y: box.y },
      { x: rx + 34, y: box.y - 18 },
      { x: rx + 52, y: box.y },
      { x: rx + 34, y: box.y + 18 },
      { x: box.x, y: box.y },
    ];
    edge.x = rx + 52 + (e.label?.width ?? 0) / 2;
    edge.y = box.y;
  }
  const stats = edgeStats(ctx, best.boxes);
  return {
    labelBoxes: best.labels,
    frames: framesOut,
    conflicts: best.conflicts,
    conflictReport: best.conflicts > 0 ? scan(ctx, best.scene, true).report : [],
    crossings: stats.crossings,
    edgeLengthPx: stats.length,
    width: best.width,
    height: best.height,
  };
}
