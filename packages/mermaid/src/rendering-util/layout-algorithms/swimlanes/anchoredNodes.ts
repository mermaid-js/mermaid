import type { LayoutData, Node } from '../../types.js';

type Direction = 'TB' | 'LR' | 'BT' | 'RL';

export type AnchorSide = 'top' | 'right' | 'bottom' | 'left';

const ANCHOR_SIDES = new Set(['top', 'right', 'bottom', 'left']);

const ANCHOR_GAP = 8;

// Far beyond any lane a diagram draws, and small enough that a stand-off keeps every
// coordinate it feeds finite.
export const MAX_ANCHOR_GAP = 10_000;

const OUTWARD: Record<AnchorSide, { x: number; y: number }> = {
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export interface NodeAnchor {
  hostId: string;

  side?: AnchorSide;

  slot?: number;

  gap?: number;
}

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
    ...(typeof gap === 'number' && Number.isFinite(gap) && gap > 0
      ? { gap: Math.min(gap, MAX_ANCHOR_GAP) }
      : {}),
  };
}

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

/** For a validator's `isAttached`: whether `nodeId` is pinned to `toId` through its anchor chain. */
export function isAnchoredTo(nodes: Node[]): (nodeId: string, toId: string) => boolean {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  return (nodeId, toId) => resolveAnchorHostId(nodeId, byId) === toId;
}

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

interface BucketEntry {
  node: Node;
  anchor: NodeAnchor;
  index: number;
  side: AnchorSide;
  hostId: string;
}

const hasUsableSize = (node: Node) =>
  [node.width, node.height].every((size) => size === undefined || Number.isFinite(size));

function bucketByHostAndSide(
  nodes: Node[],
  sideOf: (anchor: NodeAnchor) => AnchorSide
): Map<string, BucketEntry[]> {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const buckets = new Map<string, BucketEntry[]>();
  nodes.forEach((node, index) => {
    const anchor = readAnchor(node);
    if (!anchor || !hasUsableSize(node)) {
      return;
    }
    const hostId = resolveAnchorHostId(node.id, byId);
    if (!hostId) {
      return;
    }
    const side = sideOf(anchor);
    const key = `${side}:${hostId}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push({ node, anchor, index, side, hostId });
    buckets.set(key, bucket);
  });
  for (const bucket of buckets.values()) {
    bucket.sort(compareBucketEntries);
  }
  return buckets;
}

/**
 * Where a node's centre lies along its host's border, measured from the host's centre.
 *
 * A flow runs through the middle of the node it joins, so a node standing off the left or
 * right of its host stands clear of that line rather than across it: it is moved towards
 * the start of the border by its own half-extent plus ANCHOR_GAP. Along the top or bottom
 * there is no such line to clear, and the run stays centred on the host.
 */
function centreAlongBorder(
  offset: number,
  horizontal: boolean,
  clearance: number,
  alongHalf: number
): number {
  const clearOfFlow = !horizontal && clearance > 0 ? -(alongHalf + ANCHOR_GAP) : 0;
  return offset + clearOfFlow;
}

export interface AnchorFootprint {
  /** Room needed on the start side of the host's centre, along its border. */
  before: number;
  /** Room needed on the end side of the host's centre, along its border. */
  after: number;
  /** Room needed outward from the host's border. */
  beyond: number;
}

function footprintOf(bucket: BucketEntry[], side: AnchorSide): AnchorFootprint {
  const horizontal = side === 'top' || side === 'bottom';
  const alongBorder = (node: Node) => (horizontal ? (node.width ?? 0) : (node.height ?? 0));
  const reach = (node: Node) => (horizontal ? (node.height ?? 0) : (node.width ?? 0));
  const { offsets } = packAlongBorder(bucket.map((entry) => alongBorder(entry.node)));
  let before = 0;
  let after = 0;
  let beyond = 0;
  bucket.forEach((entry, position) => {
    const clearance = entry.anchor.gap ?? 0;
    const half = alongBorder(entry.node) / 2;
    const centre = centreAlongBorder(offsets[position], horizontal, clearance, half);
    before = Math.max(before, half - centre);
    after = Math.max(after, centre + half);
    beyond = Math.max(beyond, clearance > 0 ? clearance + reach(entry.node) : 0);
  });
  return { before, after, beyond };
}

/**
 * The room each run of stood-off nodes needs, per host and per side the run stands on: a
 * node's own `side` when it has one, otherwise the side its direction defaults to.
 */
export function anchorFootprints(
  nodes: Node[],
  direction?: Direction
): Map<string, Partial<Record<AnchorSide, AnchorFootprint>>> {
  const fallback = defaultAnchorSide('final', direction ?? 'TB');
  const footprints = new Map<string, Partial<Record<AnchorSide, AnchorFootprint>>>();
  for (const bucket of bucketByHostAndSide(nodes, (anchor) => anchor.side ?? fallback).values()) {
    if (!bucket.some((entry) => entry.anchor.gap)) {
      continue;
    }
    const { hostId, side } = bucket[0];
    footprints.set(hostId, { ...footprints.get(hostId), [side]: footprintOf(bucket, side) });
  }
  return footprints;
}

const boxOf = (node: Node) => ({
  left: (node.x ?? 0) - (node.width ?? 0) / 2,
  right: (node.x ?? 0) + (node.width ?? 0) / 2,
  top: (node.y ?? 0) - (node.height ?? 0) / 2,
  bottom: (node.y ?? 0) + (node.height ?? 0) / 2,
});

const sharesSpace = (a: ReturnType<typeof boxOf>, b: ReturnType<typeof boxOf>) =>
  a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;

const CLEARING_STEP = 8;
const CLEARING_TRIES = 24;

/** Whether a group is a lane or a pool, going by the `laneRole` its producer set. */
export const hasLaneRole = (group: Node): boolean => {
  const role = group.metadata?.laneRole;
  return role === 'lane' || role === 'pool';
};

/**
 * Moves a stood-off node clear of what it overlaps, never out of the lane its host sits in.
 *
 * `isLane` says which group is a lane. The default reads `metadata.laneRole`, so a producer
 * must set it on its lanes and pools or pass a resolver of its own; a group that is not
 * recognised as a lane does not hold the node in.
 */
export function clearAnchoredOverlaps(
  layout: LayoutData,
  pins: AnchorPin[],
  isLane: (group: Node) => boolean = hasLaneRole
): AnchorPin[] {
  const nodes = layout.nodes ?? [];
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const pinned = new Set(pins.map((pin) => pin.nodeId));
  const settled = nodes.filter((node) => !node.isGroup && !pinned.has(node.id));
  const placed: Node[] = [];
  const cleared: AnchorPin[] = [];

  const bandFor = (hostId: string) => {
    let at = byId.get(hostId);
    const seen = new Set<string>();
    while (at?.parentId && !seen.has(at.parentId)) {
      seen.add(at.parentId);
      const parent = byId.get(at.parentId);
      if (!parent) {
        return undefined;
      }
      if (isLane(parent)) {
        return boxOf(parent);
      }
      at = parent;
    }
    return undefined;
  };

  for (const pin of pins) {
    const node = byId.get(pin.nodeId);
    const standsOff = (readAnchor(node)?.gap ?? 0) > 0;
    if (!node || !standsOff) {
      if (node) {
        placed.push(node);
      }
      cleared.push(pin);
      continue;
    }

    const obstacles = [...settled, ...placed].filter((other) => other.id !== pin.hostId);
    const band = bandFor(pin.hostId);
    const startX = node.x ?? 0;
    const startY = node.y ?? 0;
    let tries = 0;
    while (
      tries < CLEARING_TRIES &&
      obstacles.some((other) => sharesSpace(boxOf(node), boxOf(other)))
    ) {
      node.x = (node.x ?? 0) + pin.outward.x * CLEARING_STEP;
      node.y = (node.y ?? 0) + pin.outward.y * CLEARING_STEP;
      tries++;
      const moved = boxOf(node);
      if (
        band &&
        (moved.left < band.left ||
          moved.right > band.right ||
          moved.top < band.top ||
          moved.bottom > band.bottom)
      ) {
        node.x = startX;
        node.y = startY;
        tries = 0;
        break;
      }
    }

    placed.push(node);
    cleared.push(tries > 0 ? { ...pin, x: node.x ?? pin.x, y: node.y ?? pin.y } : pin);
  }

  return cleared;
}

export function pinAnchoredNodes(
  layout: LayoutData,
  opts: { space: 'canonical' | 'final'; direction: Direction }
): AnchorPin[] {
  const nodes = layout.nodes ?? [];
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const buckets = bucketByHostAndSide(nodes, (anchor) =>
    opts.space === 'canonical'
      ? defaultAnchorSide('canonical', opts.direction)
      : (anchor.side ?? defaultAnchorSide('final', opts.direction))
  );

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

    const horizontal = side === 'top' || side === 'bottom';
    const { offsets } = packAlongBorder(
      bucket.map((entry) => (horizontal ? entry.node.width : entry.node.height) ?? 0)
    );

    bucket.forEach((entry, position) => {
      const offset = offsets[position];
      const clearance = entry.anchor.gap ?? 0;
      const span = ((horizontal ? entry.node.height : entry.node.width) ?? 0) / 2;
      const push = clearance > 0 ? clearance + span : 0;
      const alongHalf = ((horizontal ? entry.node.width : entry.node.height) ?? 0) / 2;
      const along = centreAlongBorder(offset, horizontal, clearance, alongHalf);
      const x = horizontal ? hx + along : hx + (side === 'right' ? hw / 2 + push : -hw / 2 - push);
      const y = horizontal ? hy + (side === 'bottom' ? hh / 2 + push : -hh / 2 - push) : hy + along;
      entry.node.x = x;
      entry.node.y = y;
      pins.push({ nodeId: entry.node.id, hostId, side, x, y, outward: OUTWARD[side] });
    });
  }

  return pins;
}

const STUB_REACH = 16;

const BORDER_INSET = 8;

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

function attachFaceOf(node: Node | undefined): AnchorSide | undefined {
  const face = node?.metadata?.attachFace;
  return face === 'top' || face === 'bottom' || face === 'left' || face === 'right'
    ? face
    : undefined;
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const canRoute = (node: Node, host: Node) =>
  hasUsableSize(node) && [node.x, node.y, host.x, host.y].every(isFiniteNumber);

const pointAt = (alongX: boolean, along: number, across: number) =>
  alongX ? { x: along, y: across } : { x: across, y: along };

const sizeAlong = (node: Node, alongX: boolean) => (alongX ? node.width : node.height) ?? 0;

const leavesSideways = (face: AnchorSide | undefined, alongX: boolean) =>
  alongX ? face === 'left' || face === 'right' : face === 'top' || face === 'bottom';

function exitAlong(centre: number, half: number, face: AnchorSide | undefined, sideways: boolean) {
  if (!sideways) {
    return centre;
  }
  return centre + (face === 'left' || face === 'top' ? -(half + STUB_REACH) : half + STUB_REACH);
}

function stubToHost(node: Node, host: Node, pin: AnchorPin): { x: number; y: number }[] | null {
  if (!canRoute(node, host)) {
    return null;
  }
  const alongX = pin.side === 'top' || pin.side === 'bottom';
  const [nAlong, nAcross] = alongX ? [node.x!, node.y!] : [node.y!, node.x!];
  const [hAlong, hAcross] = alongX ? [host.x!, host.y!] : [host.y!, host.x!];
  const reach = Math.max(0, sizeAlong(host, alongX) / 2 - BORDER_INSET);

  const face = attachFaceOf(node);
  const sideways = leavesSideways(face, alongX);
  const exit = exitAlong(nAlong, sizeAlong(node, alongX) / 2, face, sideways);
  const enter = clamp(exit, hAlong - reach, hAlong + reach);
  const mid = (nAcross + hAcross) / 2;

  const path = [pointAt(alongX, nAlong, nAcross)];
  if (sideways) {
    path.push(pointAt(alongX, exit, nAcross));
  }
  if (Math.abs(enter - exit) >= 1) {
    path.push(pointAt(alongX, exit, mid), pointAt(alongX, enter, mid));
  }
  path.push(pointAt(alongX, enter, hAcross));
  return path;
}

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
