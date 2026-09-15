import type { LayoutData, Node } from '../../types.js';

type Direction = 'TB' | 'LR' | 'BT' | 'RL';

/** Which border of the host a node sits on. */
export type AnchorSide = 'top' | 'right' | 'bottom' | 'left';

const ANCHOR_SIDES = new Set(['top', 'right', 'bottom', 'left']);

/** Clearance between two nodes sharing a border, matching the router's node padding. */
const ANCHOR_GAP = 8;

const OUTWARD: Record<AnchorSide, { x: number; y: number }> = {
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/**
 * Pins a node's centre onto another node's border instead of laying it out.
 *
 * Carried in `node.metadata.anchorTo` rather than as a field on `Node`, so the shared
 * layout contract is unchanged for diagrams that never anchor anything.
 */
export interface NodeAnchor {
  /** The node whose border this node's centre sits on. */
  hostId: string;
  /** Which border, in the diagram's final orientation. Omitted lets the layout choose. */
  side?: AnchorSide;
  /** Order among the nodes sharing a host and a side; ties fall back to declaration order. */
  slot?: number;
}

/** The validated anchor on a node, or undefined when it is not anchored. */
export function readAnchor(node: Node | undefined): NodeAnchor | undefined {
  const raw = node?.metadata?.anchorTo;
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const { hostId, side, slot } = raw as Record<string, unknown>;
  if (typeof hostId !== 'string' || hostId.length === 0 || hostId === node?.id) {
    return undefined;
  }
  return {
    hostId,
    ...(typeof side === 'string' && ANCHOR_SIDES.has(side) ? { side: side as AnchorSide } : {}),
    ...(typeof slot === 'number' && Number.isFinite(slot) ? { slot } : {}),
  };
}

/**
 * The node this one is ultimately pinned to, or undefined when the host is missing or
 * the anchors form a cycle. Chains resolve to the first host that is itself laid out.
 */
export function resolveAnchorHostId(id: string, byId: Map<string, Node>): string | undefined {
  const seen = new Set<string>([id]);
  let hostId = readAnchor(byId.get(id))?.hostId;
  while (hostId && !seen.has(hostId)) {
    const host = byId.get(hostId);
    if (!host) {
      return undefined;
    }
    const next = readAnchor(host)?.hostId;
    if (!next) {
      return hostId;
    }
    seen.add(hostId);
    hostId = next;
  }
  return undefined;
}

/**
 * Ids of the nodes the layout must skip.
 *
 * A node whose host is missing or cyclic is absent from this set, so it keeps its
 * ordinary place in the layout rather than disappearing.
 */
export function collectAnchoredIds(nodes: Node[]): Set<string> {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const ids = new Set<string>();
  for (const node of nodes) {
    if (readAnchor(node) && resolveAnchorHostId(node.id, byId)) {
      ids.add(node.id);
    }
  }
  return ids;
}

/**
 * The border to use when a node does not name one.
 *
 * `canonical` is the pre-image of the final side under the direction transforms, which
 * is always the right-hand border; `final` is the side as drawn.
 */
export function defaultAnchorSide(space: 'canonical' | 'final', direction: Direction): AnchorSide {
  if (space === 'canonical') {
    return 'right';
  }
  return direction === 'LR' || direction === 'RL' ? 'bottom' : 'right';
}

export interface AnchorPin {
  nodeId: string;
  hostId: string;
  side: AnchorSide;
  x: number;
  y: number;
  /** Unit normal pointing away from the host, used to place the edge port. */
  outward: { x: number; y: number };
}

function compareBucketEntries(
  a: { anchor: NodeAnchor; index: number },
  b: { anchor: NodeAnchor; index: number }
): number {
  const slotA = a.anchor.slot;
  const slotB = b.anchor.slot;
  if (slotA !== undefined && slotB !== undefined && slotA !== slotB) {
    return slotA - slotB;
  }
  if (slotA !== undefined && slotB === undefined) {
    return -1;
  }
  if (slotA === undefined && slotB !== undefined) {
    return 1;
  }
  return a.index - b.index;
}

/**
 * Places every anchored node on its host's border.
 *
 * Positions are derived from the host's current geometry and never from the anchored
 * node's own, so calling this twice is the same as calling it once. That is what lets
 * it run in canonical space, to give the router a real port, and again in final space
 * once the direction transform has settled the host's position.
 *
 * The centre sits exactly on the border line, which is where BPMN draws a boundary
 * event, and means the caller does not have to know how tall the anchored node is.
 */
export function pinAnchoredNodes(
  layout: LayoutData,
  opts: { space: 'canonical' | 'final'; direction: Direction }
): AnchorPin[] {
  const nodes = layout.nodes ?? [];
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const buckets = new Map<
    string,
    { node: Node; anchor: NodeAnchor; index: number; side: AnchorSide; hostId: string }[]
  >();

  nodes.forEach((node, index) => {
    const anchor = readAnchor(node);
    if (!anchor) {
      return;
    }
    const hostId = resolveAnchorHostId(node.id, byId);
    if (!hostId) {
      return;
    }
    const side =
      opts.space === 'canonical'
        ? defaultAnchorSide('canonical', opts.direction)
        : (anchor.side ?? defaultAnchorSide('final', opts.direction));
    const key = `${side}:${hostId}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push({ node, anchor, index, side, hostId });
    buckets.set(key, bucket);
  });

  const pins: AnchorPin[] = [];
  for (const bucket of buckets.values()) {
    const { hostId, side } = bucket[0];
    const host = byId.get(hostId);
    const hx = host?.x;
    const hy = host?.y;
    const hw = host?.width;
    const hh = host?.height;
    if (
      typeof hx !== 'number' ||
      typeof hy !== 'number' ||
      typeof hw !== 'number' ||
      typeof hh !== 'number' ||
      !Number.isFinite(hx) ||
      !Number.isFinite(hy) ||
      !Number.isFinite(hw) ||
      !Number.isFinite(hh)
    ) {
      continue;
    }

    bucket.sort(compareBucketEntries);
    const horizontal = side === 'top' || side === 'bottom';
    const pitch = Math.max(
      ...bucket.map(
        (entry) => ((horizontal ? entry.node.width : entry.node.height) ?? 0) + ANCHOR_GAP
      )
    );
    const count = bucket.length;

    bucket.forEach((entry, position) => {
      const offset = (position - (count - 1) / 2) * pitch;
      const x = horizontal ? hx + offset : hx + (side === 'right' ? hw / 2 : -hw / 2);
      const y = horizontal ? hy + (side === 'bottom' ? hh / 2 : -hh / 2) : hy + offset;
      entry.node.x = x;
      entry.node.y = y;
      pins.push({ nodeId: entry.node.id, hostId, side, x, y, outward: OUTWARD[side] });
    });
  }

  return pins;
}
