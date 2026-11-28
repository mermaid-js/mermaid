import type { Context } from './context.js';
import {
  angleOf,
  assignToSlots,
  circularMean,
  segmentHitsBox,
  segmentsCross,
  type Vec,
} from './geometry.js';
import { NODE_GAP } from './scene.js';
import type { PortKind } from './structure.js';

export const FRAME_PAD = 22;
export const GRID_GAP = 28;
/** One crossing costs as much as this many px of edge length when two orders are compared. */
const CROSSING_COST_PX = 400;

export interface OrderParams {
  /** Width over height of the ellipse the leaves of a middle ring sit on. */
  aspect: number;
  /** Where the first slot of a middle ring sits, as a fraction of one slot step. */
  phase: number;
  /** Exponent of the generalised ellipse: 2 is an ellipse, higher fills the corners. */
  roundness: number;
  /** Port pitch as a multiple of the tightest pitch that keeps neighbouring ports apart. */
  pitchScale: number;
  /** 1 lets ports that reach one external through their adapters pull on each other; 0 does not. */
  portPull: number;
}

interface SlotGroup {
  ids: string[];
  positions: Vec[];
  angles: number[];
  /** Adjacent slots wrap around (a ring) rather than end (a sector). */
  cyclic: boolean;
  /** Try every pair of slots, not only neighbours: for the few cells of the innermost grid. */
  everyPair: boolean;
}

export interface OrderGroup {
  ids: readonly string[];
  /** Adjacent slots wrap around (a ring) rather than end (a sector). */
  cyclic: boolean;
}

export interface Order {
  /** Rings first (same order as `structure.innerRings`), then the driving and driven sectors. */
  groups: readonly OrderGroup[];
  /** Slot of each ring leaf within its ring, and of each port within its sector (low to high across). */
  slot: ReadonlyMap<string, number>;
  /** Slot angles per inner ring, same order as `structure.innerRings`. */
  ringAngles: readonly (readonly number[])[];
  /** Cell centres of the innermost ring's grid, indexed by slot. */
  gridCells: readonly Vec[];
  crossings: number;
  edgeLengthPx: number;
}

/** Point on a generalised ellipse of half-axes (a, b) at polar angle `theta`. */
export function ellipsePoint(theta: number, a: number, b: number, exponent: number): Vec {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const k = 2 / exponent;
  return { x: a * Math.sign(c) * Math.abs(c) ** k, y: b * Math.sign(s) * Math.abs(s) ** k };
}

/** Slot centres of the packed grid used for the innermost ring, relative to the grid centre. */
export function gridSlotCentres(ctx: Context, leafIds: readonly string[]): Vec[] {
  if (leafIds.length === 0) {
    return [];
  }
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
 * Offset across the spoke axis of the `i`-th of `n` ports in a sector. A top sector with an odd
 * count would put a port under the ring titles at the apex, so its row is shifted half a pitch.
 */
export function sectorOffset(
  ctx: Context,
  kind: PortKind,
  i: number,
  n: number,
  pitch: number
): number {
  const centred = (i - (n - 1) / 2) * pitch;
  return ctx.arrangement === 'vertical' && kind === 'driving' && n % 2 === 1
    ? centred + pitch / 2
    : centred;
}

export function sectorPitch(ctx: Context, kind: PortKind, params: OrderParams): number {
  const ports = ctx.structure.ports.filter((p) => p.kind === kind);
  const extent = Math.max(
    0,
    ...ports.map((p) =>
      ctx.arrangement === 'vertical' ? ctx.size.get(p.id)!.width : ctx.size.get(p.id)!.height
    )
  );
  return (extent + 2 * NODE_GAP) * params.pitchScale;
}

/** Rough positions of every node for a given slot assignment: enough to compare orders. */
function buildGroups(
  ctx: Context,
  params: OrderParams
): { groups: SlotGroup[]; ringGroups: number; titleYs: number[] } {
  const { structure, arrangement } = ctx;
  const groups: SlotGroup[] = [];
  const ringCount = structure.innerLeafIds.length;
  const cells = gridSlotCentres(ctx, structure.innerLeafIds[ringCount - 1] ?? []);
  const innerIds = structure.innerLeafIds[ringCount - 1] ?? [];
  let halfW =
    Math.max(0, ...cells.map((c) => Math.abs(c.x))) +
    Math.max(0, ...innerIds.map((id) => ctx.size.get(id)!.width / 2)) +
    FRAME_PAD;
  let halfH =
    Math.max(0, ...cells.map((c) => Math.abs(c.y))) +
    Math.max(0, ...innerIds.map((id) => ctx.size.get(id)!.height / 2)) +
    FRAME_PAD;
  const ringGroups: SlotGroup[] = [];
  // Nominal heights of the ring titles, which sit just inside each frame's top apex.
  const titleYs: number[] = [-halfH + 30];
  ringGroups[ringCount - 1] = {
    ids: [...innerIds],
    positions: cells,
    angles: cells.map(angleOf),
    cyclic: false,
    everyPair: true,
  };
  for (let j = ringCount - 2; j >= 0; j--) {
    const ids = structure.innerLeafIds[j];
    const maxW = Math.max(0, ...ids.map((id) => ctx.size.get(id)!.width / 2));
    const maxH = Math.max(0, ...ids.map((id) => ctx.size.get(id)!.height / 2));
    const t = halfH + NODE_GAP + maxH + 10;
    const a = Math.max(params.aspect * t, halfW + NODE_GAP + maxW);
    const angles = ids.map(
      (_, k) => (params.phase + k) * ((2 * Math.PI) / Math.max(1, ids.length))
    );
    ringGroups[j] = {
      ids: [...ids],
      positions: angles.map((th) => ellipsePoint(th, a, t, params.roundness)),
      angles,
      cyclic: true,
      everyPair: false,
    };
    halfW = a + maxW + FRAME_PAD;
    halfH = t + maxH + FRAME_PAD;
    titleYs.push(-halfH + 30);
  }
  titleYs.push(-(halfH + 80) + 30);
  groups.push(...ringGroups);
  for (const kind of ['driving', 'driven'] as const) {
    const ids = structure.ports.filter((p) => p.kind === kind).map((p) => p.id);
    const pitch = sectorPitch(ctx, kind, params);
    const along =
      (kind === 'driving' ? -1 : 1) * (arrangement === 'vertical' ? halfH + 80 : halfW + 130);
    const positions = ids.map((_, i) => {
      const perp = sectorOffset(ctx, kind, i, ids.length, pitch);
      return arrangement === 'vertical' ? { x: perp, y: along } : { x: along, y: perp };
    });
    groups.push({
      ids,
      positions,
      angles: positions.map(angleOf),
      cyclic: false,
      everyPair: false,
    });
  }
  return { groups, ringGroups: ringCount, titleYs };
}

export function arrangeOrder(ctx: Context, params: OrderParams, swapPasses: number): Order {
  const { structure, arrangement } = ctx;
  const { groups, ringGroups, titleYs } = buildGroups(ctx, params);
  const slot = new Map<string, number>();
  for (const g of groups) {
    g.ids.forEach((id, i) => slot.set(id, i));
  }
  const groupOf = new Map<string, SlotGroup>();
  for (const g of groups) {
    for (const id of g.ids) {
      groupOf.set(id, g);
    }
  }

  // Ports that reach the same external through their adapters pull on each other.
  const portOf = new Map<string, string>();
  for (const id of structure.adapterIds) {
    const port = (structure.neighbours.get(id) ?? []).find(
      (n) => groupOf.has(n) && structure.ports.some((p) => p.id === n)
    );
    if (port) {
      portOf.set(id, port);
    }
  }
  const linked = new Map<string, string[]>();
  for (const ext of structure.externalIds) {
    const ports = (structure.neighbours.get(ext) ?? []).flatMap((a) => portOf.get(a) ?? []);
    for (const p of ports) {
      linked.set(p, [...(linked.get(p) ?? []), ...ports.filter((q) => q !== p)]);
    }
  }

  const positionOf = (id: string): Vec | undefined => {
    const g = groupOf.get(id);
    return g ? g.positions[slot.get(id)!] : undefined;
  };
  const wiredTo = (id: string): string[] => [
    ...(structure.neighbours.get(id) ?? []),
    ...(params.portPull > 0 ? (linked.get(id) ?? []) : []),
  ];

  for (let pass = 0; pass < 6; pass++) {
    for (const g of groups) {
      if (g.ids.length < 2) {
        continue;
      }
      const targets = g.ids.map((id) => {
        const angles: number[] = [];
        for (const n of wiredTo(id)) {
          const p = n === id ? undefined : positionOf(n);
          if (p) {
            angles.push(angleOf(p));
          }
        }
        return circularMean(angles);
      });
      const picked = assignToSlots(targets, g.angles);
      g.ids.forEach((id, i) => slot.set(id, picked[i]));
    }
  }

  // Full nominal positions, adapters and externals included, to score crossings and length.
  const spokeSign = (kind: PortKind) => (kind === 'driving' ? -1 : 1);
  const edgePositions = (): Map<string, Vec> => {
    const out = new Map<string, Vec>();
    for (const g of groups) {
      g.ids.forEach((id) => out.set(id, g.positions[slot.get(id)!]));
    }
    const kindOf = new Map(structure.ports.map((p) => [p.id, p.kind]));
    const adapterAt = new Map<string, { perp: number; kind: PortKind }>();
    for (const [adapter, port] of portOf) {
      const p = out.get(port)!;
      const kind = kindOf.get(port)!;
      const perp = arrangement === 'vertical' ? p.x : p.y;
      adapterAt.set(adapter, { perp, kind });
      const along = (arrangement === 'vertical' ? p.y : p.x) + spokeSign(kind) * 260;
      out.set(adapter, arrangement === 'vertical' ? { x: perp, y: along } : { x: along, y: perp });
    }
    for (const ext of structure.externalIds) {
      const reached = (structure.neighbours.get(ext) ?? []).flatMap((a) => adapterAt.get(a) ?? []);
      if (reached.length === 0) {
        continue;
      }
      const perp = reached.reduce((s, r) => s + r.perp, 0) / reached.length;
      const kind = reached[0].kind;
      const along = spokeSign(kind) * (arrangement === 'vertical' ? 900 : 1300);
      out.set(ext, arrangement === 'vertical' ? { x: perp, y: along } : { x: along, y: perp });
    }
    return out;
  };
  const cost = (): { crossings: number; length: number; total: number } => {
    const pos = edgePositions();
    const routes = ctx.edges
      .map((e) => ({ e, a: pos.get(e.start), b: pos.get(e.end) }))
      .filter((s): s is { e: (typeof ctx.edges)[number]; a: Vec; b: Vec } => !!s.a && !!s.b);
    let crossings = 0;
    for (let i = 0; i < routes.length; i++) {
      for (let j = i + 1; j < routes.length; j++) {
        const p = routes[i];
        const q = routes[j];
        if (
          p.e.start === q.e.start ||
          p.e.start === q.e.end ||
          p.e.end === q.e.start ||
          p.e.end === q.e.end
        ) {
          continue;
        }
        if (segmentsCross(p.a, p.b, q.a, q.b)) {
          crossings++;
        }
      }
    }
    const length = routes.reduce((s, x) => s + Math.hypot(x.a.x - x.b.x, x.a.y - x.b.y), 0);
    // Edges through an unrelated node, or through a ring title at the top apex, cost as much as a crossing.
    let hazards = 0;
    for (const s of routes) {
      for (const [id, g] of groupOf) {
        if (id !== s.e.start && id !== s.e.end) {
          const size = ctx.size.get(id)!;
          const c = g.positions[slot.get(id)!];
          if (
            segmentHitsBox(s.a, s.b, { x: c.x, y: c.y, width: size.width, height: size.height })
          ) {
            hazards++;
          }
        }
      }
      if (s.a.x < 0 !== s.b.x < 0) {
        const y0 = s.a.y + ((0 - s.a.x) / (s.b.x - s.a.x)) * (s.b.y - s.a.y);
        if (titleYs.some((ty) => Math.abs(y0 - ty) < 40)) {
          hazards++;
        }
      }
    }
    return { crossings, length, total: (crossings + hazards) * CROSSING_COST_PX + length };
  };

  let current = cost();
  for (let pass = 0; pass < swapPasses; pass++) {
    let improved = false;
    for (const g of groups) {
      const n = g.ids.length;
      const bySlot = (s: number) => g.ids.find((id) => slot.get(id) === s)!;
      const pairs: [number, number][] = [];
      for (let s = 0; s < n; s++) {
        for (let t = s + 1; t < n; t++) {
          const adjacent = t === s + 1 || (g.cyclic && s === 0 && t === n - 1);
          if (adjacent || g.everyPair) {
            pairs.push([s, t]);
          }
        }
      }
      // Whole-group moves: turn a ring a step either way, mirror a ring, reverse a sector.
      const remaps: ((s: number) => number)[] = g.cyclic
        ? [(s) => (s + 1) % n, (s) => (s + n - 1) % n, (s) => (n - s) % n]
        : [(s) => n - 1 - s];
      for (const remap of remaps) {
        if (n < 2) {
          break;
        }
        const before = new Map(g.ids.map((id) => [id, slot.get(id)!]));
        g.ids.forEach((id) => slot.set(id, remap(before.get(id)!)));
        const trial = cost();
        if (trial.total < current.total - 1e-6) {
          current = trial;
          improved = true;
        } else {
          before.forEach((v, id) => slot.set(id, v));
        }
      }
      for (const [s, t] of pairs) {
        const a = bySlot(s);
        const b = bySlot(t);
        slot.set(a, t);
        slot.set(b, s);
        const trial = cost();
        if (trial.total < current.total - 1e-6) {
          current = trial;
          improved = true;
        } else {
          slot.set(a, s);
          slot.set(b, t);
        }
      }
    }
    if (!improved) {
      break;
    }
  }

  const innerGrid = groups[ringGroups - 1];
  return {
    groups: groups.map((g) => ({ ids: g.ids, cyclic: g.cyclic })),
    slot,
    ringAngles: groups.slice(0, ringGroups).map((g) => g.angles),
    gridCells: innerGrid ? innerGrid.positions : [],
    crossings: current.crossings,
    edgeLengthPx: current.length,
  };
}

/** The same order with every member of group `g` moved to slot `remap(slot)`. */
export function remapGroup(order: Order, g: number, remap: (slot: number) => number): Order {
  const slot = new Map(order.slot);
  for (const id of order.groups[g].ids) {
    slot.set(id, remap(order.slot.get(id)!));
  }
  return { ...order, slot };
}
