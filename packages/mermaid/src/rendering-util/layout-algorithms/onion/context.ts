import type { LayoutData, Node } from '../../types.js';
import type { Box, Vec } from './geometry.js';
import { nodeOutline } from './outline.js';
import { analyseOnion, type OnionStructure } from './structure.js';

export type OnionArrangement = 'horizontal' | 'vertical';

/** Distance between two parallel edges of one node pair. */
export const PARALLEL_EDGE_STEP = 26;

export interface LabeledEdge {
  readonly id: string;
  readonly start: string;
  readonly end: string;
  readonly label: { readonly width: number; readonly height: number } | undefined;
  /** Sideways shift in px, along the normal of start→end; non-zero only for parallel edges. */
  readonly shift: number;
}

export interface Context {
  readonly arrangement: OnionArrangement;
  readonly structure: OnionStructure;
  readonly size: ReadonlyMap<string, { readonly width: number; readonly height: number }>;
  /** Edges between two distinct nodes. */
  readonly edges: readonly LabeledEdge[];
  /** Edges that start and end on one node. */
  readonly loops: readonly LabeledEdge[];
  readonly leafMembers: ReadonlyMap<string, ReadonlySet<string>>;
  readonly groupById: ReadonlyMap<string, Node>;
  /** Outline each leaf is drawn with, relative to its centre: where its edges start and end. */
  readonly outline: ReadonlyMap<string, readonly Vec[]>;
}

export function boxOf(ctx: Context, id: string, x: number, y: number): Box {
  const { width, height } = ctx.size.get(id)!;
  return { x, y, width, height };
}

/** Unit normal of the segment a→b (pointing to the right of the direction of travel). */
export function normalOf(a: Vec, b: Vec): Vec {
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: -(b.y - a.y) / len, y: (b.x - a.x) / len };
}

export function buildContext(data: LayoutData, arrangement: OnionArrangement): Context {
  const structure = analyseOnion(data);
  const size = new Map<string, { width: number; height: number }>();
  const outline = new Map<string, Vec[]>();
  const groupById = new Map<string, Node>();
  for (const n of data.nodes) {
    if (n.isGroup) {
      groupById.set(n.id, n);
    } else {
      size.set(n.id, { width: n.width ?? 0, height: n.height ?? 0 });
      outline.set(n.id, nodeOutline(n, n.width ?? 0, n.height ?? 0));
    }
  }
  const byId = new Map(data.nodes.map((n) => [n.id, n]));
  const leafMembers = new Map<string, Set<string>>();
  for (const ring of [structure.outer, structure.core, ...structure.innerRings]) {
    if (!ring) {
      continue;
    }
    const members = new Set<string>();
    for (const n of data.nodes) {
      let cursor: Node | undefined = n.isGroup ? undefined : n;
      while (cursor) {
        if (cursor.parentId === ring.id) {
          members.add(n.id);
          break;
        }
        cursor = byId.get(cursor.parentId ?? '');
      }
    }
    leafMembers.set(ring.id, members);
  }

  const pairKey = (e: { start: string; end: string }) =>
    e.start < e.end ? `${e.start}\u0000${e.end}` : `${e.end}\u0000${e.start}`;
  const all = data.edges
    .filter((e) => e.start && e.end && size.has(e.start) && size.has(e.end))
    .map((e) => ({
      id: e.id,
      start: e.start!,
      end: e.end!,
      label: e.label && e.width && e.height ? { width: e.width, height: e.height } : undefined,
    }));
  const groups = new Map<string, typeof all>();
  for (const e of all) {
    if (e.start !== e.end) {
      groups.set(pairKey(e), [...(groups.get(pairKey(e)) ?? []), e]);
    }
  }
  const edges: LabeledEdge[] = [];
  for (const members of groups.values()) {
    members.forEach((e, i) => {
      const slot = (i - (members.length - 1) / 2) * PARALLEL_EDGE_STEP;
      // Slots are measured against start<end so a reversed edge lands on the same side.
      edges.push({ ...e, shift: e.start < e.end ? slot : -slot });
    });
  }
  const order = new Map(all.map((e, i) => [e.id, i]));
  edges.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
  return {
    arrangement,
    structure,
    size,
    groupById,
    outline,
    leafMembers,
    edges,
    loops: all.filter((e) => e.start === e.end).map((e) => ({ ...e, shift: 0 })),
  };
}
