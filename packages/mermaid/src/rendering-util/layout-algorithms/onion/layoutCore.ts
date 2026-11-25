import type { LayoutData, Node } from '../../types.js';
import {
  angleOf,
  assignToSlots,
  boxCorners,
  boxIntersectsConvex,
  boxesOverlap,
  circularMean,
  clipSegmentToBox,
  hexagonPolygon,
  inflateBox,
  segmentHitsBox,
  type Box,
  type Vec,
} from './geometry.js';
import { analyseOnion, type OnionStructure, type PortKind } from './structure.js';

export type OnionArrangement = 'horizontal' | 'vertical';

/** Clear space kept between two nodes, and between a node and an edge label. */
const NODE_GAP = 16;
/** Slack added around a label's measured box; the painter pulls edge ends back by an arrowhead, which shifts the label along the spoke. */
const LABEL_SLACK = 20;
const GRID_GAP = 28;
/** Roof height as a share of the frame's half-width; one slope is used for every ring of a layout. */
const HEX_SLOPES = [0.06, 0.1, 0.16] as const;
/** How much of a band's thickness is also added across the spoke axis. */
const CROSS_BAND_SHARE = 0.3;
const FRAME_PAD = 22;
const TITLE_GAP = 12;
/** Ports only need an order from the angle machinery, so the nominal slot spread is one fixed value. */
const NOMINAL_SECTOR_STEP_DEG = 30;
const PITCH_SCALES = [1, 1.15, 1.35, 1.6, 2] as const;
const ELLIPSE_ASPECTS = [1.4, 1.9, 2.4, 3, 3.8] as const;
const PHASE_FRACTIONS = [0, 0.25, 0.5, 0.75] as const;

interface Frame {
  width: number;
  height: number;
  depth: number;
  poly: Vec[];
  title: Box;
}

interface FrameShape extends Frame {
  id: string;
  members: ReadonlySet<string>;
}

interface Scene {
  boxes: Map<string, Box>;
  frames: FrameShape[];
}

interface Params {
  aspect: number;
  phase: number;
  /** Port pitch as a multiple of the tightest pitch that keeps neighbouring ports apart. */
  pitchScale: number;
  slope: number;
}

interface Solution {
  boxes: Map<string, Box>;
  frames: Map<string, Frame>;
  area: number;
  aspect: number;
  conflicts: number;
}

interface LabeledEdge {
  id: string;
  start: string;
  end: string;
  label: Box | undefined;
}

interface Context {
  arrangement: OnionArrangement;
  structure: OnionStructure;
  size: Map<string, { width: number; height: number }>;
  edges: LabeledEdge[];
  leafMembers: Map<string, Set<string>>;
  groupById: Map<string, Node>;
  /** Per side, how far a slanted shape's outline sits inside its box at mid-height. */
  slantInset: Map<string, number>;
}

/** Part of the segment a→b between the two boxes, and its midpoint: where the painter puts the label. */
export function visibleSegment(src: Box, dst: Box): { from: Vec; to: Vec; mid: Vec } {
  const a = { x: src.x, y: src.y };
  const b = { x: dst.x, y: dst.y };
  const leaving = clipSegmentToBox(a, b, src);
  const entering = clipSegmentToBox(a, b, dst);
  const t0 = leaving ? leaving[1] : 0;
  const t1 = entering ? entering[0] : 1;
  const [lo, hi] = t0 <= t1 ? [t0, t1] : [(t0 + t1) / 2, (t0 + t1) / 2];
  const at = (t: number): Vec => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  return { from: at(lo), to: at(hi), mid: at((lo + hi) / 2) };
}

function labelBoxFor(edge: LabeledEdge, src: Box, dst: Box): Box | undefined {
  if (!edge.label) {
    return undefined;
  }
  const mid = visibleSegment(src, dst).mid;
  return { x: mid.x, y: mid.y, width: edge.label.width, height: edge.label.height };
}

/** The box a slanted shape is actually drawn in where an edge meets it. */
function narrowed(ctx: Context, id: string, box: Box): Box {
  return { ...box, width: box.width - 2 * (ctx.slantInset.get(id) ?? 0) };
}

/** Overlaps between nodes, frames, titles, edge labels and edges in the scene, each named. */
export function findConflicts(ctx: Context, scene: Scene): string[] {
  const found: string[] = [];
  const ids = [...scene.boxes.keys()];
  for (let i = 0; i < ids.length; i++) {
    const a = scene.boxes.get(ids[i])!;
    for (let j = i + 1; j < ids.length; j++) {
      if (
        boxesOverlap(
          inflateBox(a, NODE_GAP / 2),
          inflateBox(scene.boxes.get(ids[j])!, NODE_GAP / 2)
        )
      ) {
        found.push(`node ${ids[i]} x node ${ids[j]}`);
      }
    }
    for (const frame of scene.frames) {
      if (
        !frame.members.has(ids[i]) &&
        boxIntersectsConvex(inflateBox(a, NODE_GAP / 2), frame.poly)
      ) {
        found.push(`node ${ids[i]} x frame ${frame.id}`);
      }
      if (boxesOverlap(inflateBox(a, NODE_GAP / 2), frame.title)) {
        found.push(`node ${ids[i]} x title ${frame.id}`);
      }
    }
  }
  const labels: { edge: LabeledEdge; box: Box }[] = [];
  for (const edge of ctx.edges) {
    const src = scene.boxes.get(edge.start);
    const dst = scene.boxes.get(edge.end);
    if (!src || !dst) {
      continue;
    }
    const seg = visibleSegment(narrowed(ctx, edge.start, src), narrowed(ctx, edge.end, dst));
    for (const [id, box] of scene.boxes) {
      if (
        id !== edge.start &&
        id !== edge.end &&
        segmentHitsBox(seg.from, seg.to, inflateBox(box, 2))
      ) {
        found.push(`edge ${edge.id} through node ${id}`);
      }
    }
    for (const frame of scene.frames) {
      if (segmentHitsBox(seg.from, seg.to, frame.title)) {
        found.push(`edge ${edge.id} through title ${frame.id}`);
      }
    }
    const label = labelBoxFor(edge, narrowed(ctx, edge.start, src), narrowed(ctx, edge.end, dst));
    if (label) {
      const padded = inflateBox(label, LABEL_SLACK / 2);
      labels.push({ edge, box: padded });
      for (const [id, box] of scene.boxes) {
        if (boxesOverlap(padded, inflateBox(box, NODE_GAP / 4))) {
          found.push(`label ${edge.id} x node ${id}`);
        }
      }
      for (const frame of scene.frames) {
        if (boxesOverlap(padded, frame.title)) {
          found.push(`label ${edge.id} x title ${frame.id}`);
        }
      }
    }
  }
  for (let i = 0; i < labels.length; i++) {
    for (let j = i + 1; j < labels.length; j++) {
      if (boxesOverlap(labels[i].box, labels[j].box)) {
        found.push(`label ${labels[i].edge.id} x label ${labels[j].edge.id}`);
      }
    }
  }
  return found;
}

function countConflicts(ctx: Context, scene: Scene): number {
  return findConflicts(ctx, scene).length;
}

/** Hexagon centred on the origin that encloses the boxes and points with the ring's title above. */
function fitFrame(
  ctx: Context,
  slope: number,
  ringId: string,
  boxes: readonly Box[],
  points: readonly Vec[],
  padX: number,
  padY: number
): Frame {
  const ring = ctx.groupById.get(ringId)!;
  const titleW = ring.labelBBox?.width ?? 0;
  const titleH = ring.labelBBox?.height ?? 0;
  const margin = ring.padding ?? 8;
  const corners = [...boxes.flatMap((b) => boxCorners(b)), ...points];
  const widest = Math.max(...corners.map((p) => Math.abs(p.x)));
  const halfW = Math.max(widest + padX, titleW / 2 + margin);
  const depth = slope * halfW;
  const titleTop = Math.min(depth, (depth * (titleW + margin)) / (2 * halfW));
  const titleZone = titleW / 2 + margin;

  let halfH = 0;
  for (const p of corners) {
    halfH = Math.max(halfH, Math.abs(p.y) + padY + depth * (Math.abs(p.x) / halfW));
  }
  // Anything whose span reaches under the title pushes the roof up by the title's height.
  const reachesTitle = (xMin: number, xMax: number) => xMin < titleZone && xMax > -titleZone;
  for (const b of boxes) {
    if (reachesTitle(b.x - b.width / 2, b.x + b.width / 2)) {
      halfH = Math.max(
        halfH,
        titleTop + titleH + TITLE_GAP + (b.y - b.height / 2 < 0 ? -(b.y - b.height / 2) : 0)
      );
    }
  }
  for (const p of points) {
    if (reachesTitle(p.x, p.x) && p.y < 0) {
      halfH = Math.max(halfH, titleTop + titleH + TITLE_GAP - p.y);
    }
  }
  halfH = Math.max(halfH, depth);
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

function frameShape(ctx: Context, ringId: string, frame: Frame): FrameShape {
  return { ...frame, id: ringId, members: ctx.leafMembers.get(ringId)! };
}

function sectorCentre(arrangement: OnionArrangement, kind: 'driving' | 'driven'): number {
  const drivingAt = arrangement === 'horizontal' ? Math.PI : -Math.PI / 2;
  return kind === 'driving' ? drivingAt : drivingAt + Math.PI;
}

function sectorSlots(centre: number, count: number, stepRad: number): number[] {
  return Array.from({ length: count }, (_, i) => centre + (i - (count - 1) / 2) * stepRad);
}

function meanAngleOfNeighbours(
  ctx: Context,
  id: string,
  angles: ReadonlyMap<string, number>
): number | undefined {
  const known: number[] = [];
  for (const n of ctx.structure.neighbours.get(id) ?? []) {
    const a = angles.get(n);
    if (a !== undefined) {
      known.push(a);
    }
  }
  return circularMean(known);
}

/** Slot centres of the packed grid used for the innermost ring, relative to the grid centre. */
function gridSlotCentres(ctx: Context, leafIds: readonly string[]): Vec[] {
  const cols = Math.ceil(Math.sqrt(leafIds.length));
  const rows = Math.ceil(leafIds.length / cols);
  const cellW = Math.max(...leafIds.map((id) => ctx.size.get(id)!.width)) + GRID_GAP;
  const cellH = Math.max(...leafIds.map((id) => ctx.size.get(id)!.height)) + GRID_GAP;
  return Array.from({ length: leafIds.length }, (_, i) => ({
    x: ((i % cols) - (cols - 1) / 2) * cellW,
    y: (Math.floor(i / cols) - (rows - 1) / 2) * cellH,
  }));
}

/**
 * Orders every ring's leaves and the ports by the angle of their neighbours, a few passes over:
 * each node moves to the free slot closest to the mean direction of the nodes it is wired to.
 */
function orderByNeighbourAngle(ctx: Context, params: Params): Map<string, number> {
  const { structure, arrangement } = ctx;
  const stepRad = (NOMINAL_SECTOR_STEP_DEG * Math.PI) / 180;
  const angles = new Map<string, number>();
  const portSlots = new Map<string, number[]>();
  for (const kind of ['driving', 'driven'] as const) {
    const group = structure.ports.filter((p) => p.kind === kind);
    portSlots.set(kind, sectorSlots(sectorCentre(arrangement, kind), group.length, stepRad));
    group.forEach((p, i) => angles.set(p.id, portSlots.get(kind)![i]));
  }
  const ringSlots = structure.innerLeafIds.map((ids, j) => {
    const innermost = j === structure.innerLeafIds.length - 1;
    if (innermost) {
      return gridSlotCentres(ctx, ids).map(angleOf);
    }
    return ids.map((_, k) => params.phase + (k * 2 * Math.PI) / ids.length);
  });
  structure.innerLeafIds.forEach((ids, j) =>
    ids.forEach((id, k) => angles.set(id, ringSlots[j][k]))
  );

  for (let pass = 0; pass < 6; pass++) {
    structure.innerLeafIds.forEach((ids, j) => {
      const slots = ringSlots[j];
      const picked = assignToSlots(
        ids.map((id) => meanAngleOfNeighbours(ctx, id, angles)),
        slots
      );
      ids.forEach((id, k) => angles.set(id, slots[picked[k]]));
    });
    for (const kind of ['driving', 'driven'] as const) {
      const group = structure.ports.filter((p) => p.kind === kind);
      const slots = portSlots.get(kind)!;
      const picked = assignToSlots(
        group.map((p) => meanAngleOfNeighbours(ctx, p.id, angles)),
        slots
      );
      group.forEach((p, k) => angles.set(p.id, slots[picked[k]]));
    }
  }
  return angles;
}

function sizeBox(ctx: Context, id: string, x: number, y: number): Box {
  const { width, height } = ctx.size.get(id)!;
  return { x, y, width, height };
}

/** First value of a rising parameter that clears every overlap, or the one with the fewest. */
function searchSmallest(
  from: number,
  to: number,
  step: number,
  conflictsAt: (value: number) => number,
  allowed: number
): number {
  let best = from;
  let bestCount = Number.POSITIVE_INFINITY;
  for (let v = from; v <= to; v += step) {
    const count = conflictsAt(v);
    if (count <= allowed) {
      return v;
    }
    if (count < bestCount) {
      bestCount = count;
      best = v;
    }
  }
  return best;
}

function packInnermost(
  ctx: Context,
  ids: readonly string[],
  angles: ReadonlyMap<string, number>,
  gap: number
): Map<string, Box> {
  const cols = Math.ceil(Math.sqrt(ids.length));
  const slotAngles = gridSlotCentres(ctx, ids).map(angleOf);
  const slotOf = ids.map((id) => {
    const angle = angles.get(id)!;
    return slotAngles.findIndex((a) => Math.abs(a - angle) < 1e-9);
  });
  const cell = ids.map((id, k) => ({
    id,
    row: Math.floor(slotOf[k] / cols),
    col: slotOf[k] % cols,
  }));
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
  const boxes = cell.map((c) => ({
    id: c.id,
    x: offset(colWidth, c.col) - totalW / 2,
    y: offset(rowHeight, c.row) - totalH / 2,
  }));
  // Recentre on the mean of the node centres: the metric the domain's position is judged by.
  const meanX = boxes.reduce((s, b) => s + b.x, 0) / boxes.length;
  const meanY = boxes.reduce((s, b) => s + b.y, 0) / boxes.length;
  return new Map(boxes.map((b) => [b.id, sizeBox(ctx, b.id, b.x - meanX, b.y - meanY)]));
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

/** Sort key that runs along a sector the same way as the perpendicular offset does. */
function acrossKey(arrangement: OnionArrangement, angle: number): number {
  return arrangement === 'vertical' ? Math.cos(angle) : Math.sin(angle);
}

interface SpokeSide {
  kind: PortKind;
  perp: number;
}

function solve(ctx: Context, params: Params): Solution {
  const { structure, arrangement } = ctx;
  const rings = structure.rings;
  const angles = orderByNeighbourAngle(ctx, params);
  const scene: Scene = { boxes: new Map(), frames: [] };
  const frames = new Map<string, Frame>();
  const ringCount = rings.length;

  // Innermost ring: a packed grid on the centre. The grid opens up until the labels of edges
  // inside the ring fit between its nodes.
  const innermostIds = structure.innerLeafIds.at(-1)!;
  const gridGap = searchSmallest(
    GRID_GAP,
    400,
    4,
    (gap) =>
      countConflicts(ctx, { boxes: packInnermost(ctx, innermostIds, angles, gap), frames: [] }),
    0
  );
  const packed = packInnermost(ctx, innermostIds, angles, gridGap);
  packed.forEach((box, id) => scene.boxes.set(id, box));
  const innermostId = rings[ringCount - 1].id;
  let inner = fitFrame(
    ctx,
    params.slope,
    innermostId,
    [...packed.values()],
    [],
    FRAME_PAD,
    FRAME_PAD
  );
  frames.set(innermostId, inner);
  scene.frames.push(frameShape(ctx, innermostId, inner));

  // Middle rings: leaves on an ellipse around the next ring in.
  for (let i = ringCount - 2; i >= 2; i--) {
    const ids = structure.innerLeafIds[i - 2];
    const ringId = rings[i].id;
    const baseline = countConflicts(ctx, scene);
    const place = (t: number): Map<string, Box> =>
      new Map(
        ids.map((id) => {
          const a = angles.get(id)!;
          return [id, sizeBox(ctx, id, params.aspect * t * Math.cos(a), t * Math.sin(a))];
        })
      );
    const t = searchSmallest(
      30,
      3000,
      6,
      (value) => {
        const trial: Scene = { boxes: new Map(scene.boxes), frames: scene.frames };
        place(value).forEach((box, id) => trial.boxes.set(id, box));
        return countConflicts(ctx, trial);
      },
      baseline
    );
    const placed = place(t);
    placed.forEach((box, id) => scene.boxes.set(id, box));
    inner = fitFrame(
      ctx,
      params.slope,
      ringId,
      [...placed.values()],
      inner.poly,
      FRAME_PAD,
      FRAME_PAD
    );
    frames.set(ringId, inner);
    scene.frames.push(frameShape(ctx, ringId, inner));
  }

  // Ports sit in a row along their sector, evenly pitched, in the order of their neighbours' angles.
  const spoke = new Map<string, SpokeSide>();
  for (const kind of ['driving', 'driven'] as const) {
    const group = structure.ports
      .filter((p) => p.kind === kind)
      .sort(
        (p, q) =>
          acrossKey(arrangement, angles.get(p.id)!) - acrossKey(arrangement, angles.get(q.id)!)
      );
    const extent = Math.max(
      ...group.map((p) =>
        arrangement === 'vertical' ? ctx.size.get(p.id)!.width : ctx.size.get(p.id)!.height
      )
    );
    const pitch = (extent + 2 * NODE_GAP) * params.pitchScale;
    group.forEach((p, i) => spoke.set(p.id, { kind, perp: (i - (group.length - 1) / 2) * pitch }));
  }

  // Core: frame around the inner rings, ports centred on its border.
  const coreId = rings[1].id;
  const innerPoly = inner.poly;
  const baselineCore = countConflicts(ctx, scene);
  const coreAt = (t: number) => {
    const padX = arrangement === 'horizontal' ? t : FRAME_PAD + t * CROSS_BAND_SHARE;
    const padY = arrangement === 'horizontal' ? FRAME_PAD + t * CROSS_BAND_SHARE : t;
    const frame = fitFrame(ctx, params.slope, coreId, [], innerPoly, padX, padY);
    const trial: Scene = {
      boxes: new Map(scene.boxes),
      frames: [...scene.frames, frameShape(ctx, coreId, frame)],
    };
    for (const port of structure.ports) {
      const side = spoke.get(port.id)!;
      const centre = spokePoint(frame.poly, arrangement, side.kind, side.perp);
      trial.boxes.set(port.id, sizeBox(ctx, port.id, centre.x, centre.y));
    }
    return { frame, trial };
  };
  const coreT = searchSmallest(
    10,
    2500,
    6,
    (t) => countConflicts(ctx, coreAt(t).trial),
    baselineCore
  );
  const core = coreAt(coreT);
  frames.set(coreId, core.frame);
  core.trial.boxes.forEach((box, id) => scene.boxes.set(id, box));
  scene.frames.push(frameShape(ctx, coreId, core.frame));

  // Adapters: straight out from their port, on the core outline pushed outwards together.
  const outerId = rings[0].id;
  const adapterSpoke = new Map<string, SpokeSide>();
  for (const id of structure.adapterIds) {
    const port = structure.ports.find((p) => (structure.neighbours.get(id) ?? []).includes(p.id));
    const side = port ? spoke.get(port.id) : undefined;
    if (side) {
      adapterSpoke.set(id, side);
    }
  }
  const baselineAdapters = countConflicts(ctx, scene);
  const adaptersAt = (band: number): Scene => {
    const outline = bandOutline(core.frame, band, arrangement);
    const trial: Scene = { boxes: new Map(scene.boxes), frames: scene.frames };
    for (const [id, side] of adapterSpoke) {
      const c = spokePoint(outline, arrangement, side.kind, side.perp);
      trial.boxes.set(id, sizeBox(ctx, id, c.x, c.y));
    }
    return trial;
  };
  const adapterBand = searchSmallest(
    0,
    900,
    6,
    (band) => countConflicts(ctx, adaptersAt(band)),
    baselineAdapters
  );
  adaptersAt(adapterBand).boxes.forEach((box, id) => scene.boxes.set(id, box));
  const outerBoxes = [...adapterSpoke.keys(), ...structure.ports.map((p) => p.id)].map(
    (id) => scene.boxes.get(id)!
  );
  const outer = fitFrame(
    ctx,
    params.slope,
    outerId,
    outerBoxes,
    core.frame.poly,
    FRAME_PAD,
    FRAME_PAD
  );
  frames.set(outerId, outer);
  scene.frames.push(frameShape(ctx, outerId, outer));

  // Externals: beyond the outermost frame, in line with the adapters they reach.
  for (const id of structure.externalIds) {
    const reached = (structure.neighbours.get(id) ?? []).flatMap((n) => adapterSpoke.get(n) ?? []);
    const side: SpokeSide = reached[0]
      ? {
          kind: reached[0].kind,
          perp: reached.reduce((sum, r) => sum + r.perp, 0) / reached.length,
        }
      : { kind: 'driven', perp: 0 };
    const baseline = countConflicts(ctx, scene);
    const at = (band: number): Box => {
      const c = spokePoint(
        bandOutline(outer, band, arrangement),
        arrangement,
        side.kind,
        side.perp
      );
      return sizeBox(ctx, id, c.x, c.y);
    };
    const band = searchSmallest(
      0,
      900,
      6,
      (value) => {
        const trial: Scene = { boxes: new Map(scene.boxes), frames: scene.frames };
        trial.boxes.set(id, at(value));
        return countConflicts(ctx, trial);
      },
      baseline
    );
    scene.boxes.set(id, at(band));
  }

  const conflicts = countConflicts(ctx, scene);
  const extent = layoutExtent(scene, frames);
  return {
    boxes: scene.boxes,
    frames,
    area: extent.width * extent.height,
    aspect: extent.width / extent.height,
    conflicts,
  };
}

function layoutExtent(
  scene: Scene,
  frames: ReadonlyMap<string, Frame>
): { width: number; height: number } {
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
  return { width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
}

const ASPECT_RANGE = { min: 0.6, max: 1.6 } as const;

function isOutsideAspectRange(s: Solution): number {
  return s.aspect < ASPECT_RANGE.min || s.aspect > ASPECT_RANGE.max ? 1 : 0;
}

/** Fewer conflicts first, then an aspect inside the target range, then the smaller bounding area. */
function compareSolutions(a: Solution, b: Solution): number {
  return (
    a.conflicts - b.conflicts ||
    isOutsideAspectRange(a) - isOutsideAspectRange(b) ||
    a.area - b.area
  );
}

function buildContext(data: LayoutData, arrangement: OnionArrangement): Context {
  const structure = analyseOnion(data);
  const size = new Map<string, { width: number; height: number }>();
  const slantInset = new Map<string, number>();
  const groupById = new Map<string, Node>();
  for (const n of data.nodes) {
    if (n.isGroup) {
      groupById.set(n.id, n);
    } else {
      size.set(n.id, { width: n.width ?? 0, height: n.height ?? 0 });
      if (n.shape === 'lean_right' || n.shape === 'lean_left' || n.shape === 'hexagon') {
        slantInset.set(n.id, 0.2 * (n.height ?? 0));
      }
    }
  }
  const leafMembers = new Map<string, Set<string>>();
  for (const ring of structure.rings) {
    const members = new Set<string>();
    for (const n of data.nodes) {
      let cursor: Node | undefined = n;
      while (cursor && !n.isGroup) {
        if (cursor.parentId === ring.id) {
          members.add(n.id);
          break;
        }
        cursor =
          cursor.parentId === undefined
            ? undefined
            : data.nodes.find((x) => x.id === cursor!.parentId);
      }
    }
    leafMembers.set(ring.id, members);
  }
  return {
    arrangement,
    structure,
    size,
    groupById,
    slantInset,
    leafMembers,
    edges: data.edges
      .filter((e) => e.start && e.end)
      .map((e) => ({
        id: e.id,
        start: e.start!,
        end: e.end!,
        label:
          e.label && e.width && e.height
            ? { x: 0, y: 0, width: e.width, height: e.height }
            : undefined,
      })),
  };
}

/** Writes node centres, frame sizes and straight edge routes onto `data`; reads only measured sizes. */
export function runOnionLayoutCore(data: LayoutData, arrangement: OnionArrangement): void {
  const ctx = buildContext(data, arrangement);
  let best: Solution | undefined;
  for (const aspect of ELLIPSE_ASPECTS) {
    for (const fraction of PHASE_FRACTIONS) {
      const phase =
        (fraction * (2 * Math.PI)) / Math.max(1, ctx.structure.innerLeafIds.at(-2)?.length ?? 1);
      for (const pitchScale of PITCH_SCALES) {
        for (const slope of HEX_SLOPES) {
          const solution = solve(ctx, { aspect, phase, pitchScale, slope });
          if (!best || compareSolutions(solution, best) < 0) {
            best = solution;
          }
        }
      }
    }
  }
  if (!best) {
    return;
  }
  const byId = new Map(data.nodes.map((n) => [n.id, n]));
  best.boxes.forEach((box, id) => {
    const node = byId.get(id);
    if (node) {
      node.x = box.x;
      node.y = box.y;
    }
  });
  best.frames.forEach((frame, id) => {
    const node = byId.get(id);
    if (node?.isGroup) {
      node.x = 0;
      node.y = 0;
      node.width = frame.width;
      node.height = frame.height;
      node.hexagonPointDepth = frame.depth;
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
  for (const edge of data.edges) {
    const src = edge.start ? best.boxes.get(edge.start) : undefined;
    const dst = edge.end ? best.boxes.get(edge.end) : undefined;
    if (src && dst) {
      const mid = { x: (src.x + dst.x) / 2, y: (src.y + dst.y) / 2 };
      // Three collinear points: the shared painter drops the first and last and clips the middle.
      edge.points = [{ x: src.x, y: src.y }, mid, { x: dst.x, y: dst.y }];
      edge.x = mid.x;
      edge.y = mid.y;
    }
  }
}
