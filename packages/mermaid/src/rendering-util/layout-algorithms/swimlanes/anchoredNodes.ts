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
  /**
   * Clearance between the host's border and this node's nearest edge.
   *
   * Zero, the default, puts the centre on the border, which is where the notation draws
   * a boundary event. A positive value stands the node off the border instead, for
   * something that belongs beside its host rather than on it.
   */
  gap?: number;
}

/** The validated anchor on a node, or undefined when it is not anchored. */
export function readAnchor(node: Node | undefined): NodeAnchor | undefined {
  const raw = node?.metadata?.anchorTo;
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const { hostId, side, slot, gap } = raw as Record<string, unknown>;
  if (typeof hostId !== 'string' || hostId.length === 0 || hostId === node?.id) {
    return undefined;
  }
  return {
    hostId,
    ...(typeof side === 'string' && ANCHOR_SIDES.has(side) ? { side: side as AnchorSide } : {}),
    ...(typeof slot === 'number' && Number.isFinite(slot) ? { slot } : {}),
    ...(typeof gap === 'number' && Number.isFinite(gap) && gap > 0 ? { gap } : {}),
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
 * Centres for a run of nodes packed end to end along a border, keeping the run centred
 * on the host. Sizing each place to its own node rather than to the widest one is what
 * stops a single wide member spreading the rest of them apart.
 */
function packAlongBorder(spans: number[]): { offsets: number[]; total: number } {
  const total =
    spans.reduce((sum, span) => sum + span, 0) + ANCHOR_GAP * Math.max(0, spans.length - 1);
  const offsets: number[] = [];
  let cursor = -total / 2;
  for (const span of spans) {
    offsets.push(cursor + span / 2);
    cursor += span + ANCHOR_GAP;
  }
  return { offsets, total };
}

/**
 * The room the nodes standing off a host need beyond its border, by host id.
 *
 * `across` is half the span they occupy along the border and `beyond` how far past it
 * they reach. Only nodes asking for a gap are counted: one sitting on the border is
 * already inside its host's own box as far as anything measuring the host can tell.
 *
 * The span follows the same pitch rule `pinAnchoredNodes` places them by, so a caller
 * reserving room and the pass that fills it cannot disagree.
 */
export function anchorFootprints(nodes: Node[]): Map<string, { across: number; beyond: number }> {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const buckets = new Map<string, Node[]>();
  for (const node of nodes) {
    if (!readAnchor(node)?.gap) {
      continue;
    }
    const hostId = resolveAnchorHostId(node.id, byId);
    if (!hostId) {
      continue;
    }
    buckets.set(hostId, [...(buckets.get(hostId) ?? []), node]);
  }

  const footprints = new Map<string, { across: number; beyond: number }>();
  for (const [hostId, bucket] of buckets) {
    const { total } = packAlongBorder(bucket.map((node) => node.width ?? 0));
    const beyond = Math.max(
      ...bucket.map((node) => (readAnchor(node)?.gap ?? 0) + (node.height ?? 0))
    );
    footprints.set(hostId, { across: total / 2, beyond });
  }
  return footprints;
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
    const { offsets } = packAlongBorder(
      bucket.map((entry) => (horizontal ? entry.node.width : entry.node.height) ?? 0)
    );

    bucket.forEach((entry, position) => {
      const offset = offsets[position];
      // A node standing off the border clears it by its own half-extent along the
      // outward axis plus the clearance asked for. Its size does not change between
      // calls, so deriving the position this way stays idempotent.
      const clearance = entry.anchor.gap ?? 0;
      const span = ((horizontal ? entry.node.height : entry.node.width) ?? 0) / 2;
      const push = clearance > 0 ? clearance + span : 0;
      const x = horizontal ? hx + offset : hx + (side === 'right' ? hw / 2 + push : -hw / 2 - push);
      const y = horizontal
        ? hy + (side === 'bottom' ? hh / 2 + push : -hh / 2 - push)
        : hy + offset;
      entry.node.x = x;
      entry.node.y = y;
      pins.push({ nodeId: entry.node.id, hostId, side, x, y, outward: OUTWARD[side] });
    });
  }

  return pins;
}

/** How far a line runs straight out of a border before it may turn. */
const STUB_REACH = 16;

/** How close to a corner a line may leave a border before it reads as missing it. */
const BORDER_INSET = 8;

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

/**
 * The border a node insists a line arrives on.
 *
 * A shape whose outline is open on three sides has only one border to arrive on, and
 * says so here so the layout can bring the line in square to it.
 */
function attachFaceOf(node: Node | undefined): AnchorSide | undefined {
  const face = node?.metadata?.attachFace;
  return face === 'top' || face === 'bottom' || face === 'left' || face === 'right'
    ? face
    : undefined;
}

/** The square path from a node standing off a border to the host it stands off from. */
function stubToHost(node: Node, host: Node, pin: AnchorPin): { x: number; y: number }[] | null {
  const nx = node.x;
  const ny = node.y;
  const hx = host.x;
  const hy = host.y;
  if (![nx, ny, hx, hy].every((v) => typeof v === 'number' && Number.isFinite(v))) {
    return null;
  }
  // The host's border runs along one axis and the line travels along the other.
  const alongX = pin.side === 'top' || pin.side === 'bottom';
  const hostAlong = alongX ? (hx as number) : (hy as number);
  const hostHalf = ((alongX ? host.width : host.height) ?? 0) / 2;
  const reach = Math.max(0, hostHalf - BORDER_INSET);

  // Leaving abreast of the node is what keeps several lines on one border apart; a node
  // too far along for that leaves as near to it as the border allows, and steps across.
  const face = attachFaceOf(node);
  const sideways = alongX
    ? face === 'left' || face === 'right'
    : face === 'top' || face === 'bottom';
  const half = ((alongX ? node.width : node.height) ?? 0) / 2;
  const exit = sideways
    ? (alongX ? (nx as number) : (ny as number)) +
      (face === 'left' || face === 'top' ? -(half + STUB_REACH) : half + STUB_REACH)
    : alongX
      ? (nx as number)
      : (ny as number);
  const enter = clamp(exit, hostAlong - reach, hostAlong + reach);
  const mid = alongX
    ? ((ny as number) + (hy as number)) / 2
    : ((nx as number) + (hx as number)) / 2;

  const at = (along: number, across: number) =>
    alongX ? { x: along, y: across } : { x: across, y: along };

  const path = [
    at(alongX ? (nx as number) : (ny as number), alongX ? (ny as number) : (nx as number)),
  ];
  if (sideways) {
    path.push(at(exit, alongX ? (ny as number) : (nx as number)));
  }
  if (Math.abs(enter - exit) >= 1) {
    path.push(at(exit, mid), at(enter, mid));
  }
  path.push(at(enter, alongX ? (hy as number) : (hx as number)));
  return path;
}

/**
 * Squares up the line between a node standing off a border and its host.
 *
 * The node was held out of the layout, so the router aimed at the host instead and never
 * saw where the node ended up. The two are adjacent by construction with nothing between
 * them to route around, so the line has only to leave one border square and reach the
 * other square, rather than keep whatever path was found to somewhere else.
 */
export function squareAnchoredEdges(layout: LayoutData, pins: AnchorPin[]): void {
  const byId = new Map((layout.nodes ?? []).map((node) => [node.id, node]));
  const pinById = new Map(pins.map((pin) => [pin.nodeId, pin]));
  for (const edge of layout.edges ?? []) {
    const start = typeof edge.start === 'string' ? edge.start : undefined;
    const end = typeof edge.end === 'string' ? edge.end : undefined;
    if (!start || !end) {
      continue;
    }
    const pin = pinById.get(start) ?? pinById.get(end);
    if (!pin) {
      continue;
    }
    // Only the line joining the node to the host it stands off from. Anything else it is
    // joined to is a real route the layout still has to find.
    if ((pin.nodeId === start ? end : start) !== pin.hostId) {
      continue;
    }
    const node = byId.get(pin.nodeId);
    const host = byId.get(pin.hostId);
    const path = node && host ? stubToHost(node, host, pin) : null;
    if (path) {
      edge.points = pin.nodeId === start ? path : [...path].reverse();
    }
  }
}
