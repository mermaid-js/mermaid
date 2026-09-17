import type { LayoutData, Node } from '../../types.js';

type Direction = 'TB' | 'LR' | 'BT' | 'RL';

export type AnchorSide = 'top' | 'right' | 'bottom' | 'left';

const ANCHOR_SIDES = new Set(['top', 'right', 'bottom', 'left']);

const ANCHOR_GAP = 8;

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
    ...(typeof gap === 'number' && Number.isFinite(gap) && gap > 0 ? { gap } : {}),
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

export function anchorFootprints(
  nodes: Node[],
  direction?: Direction
): Map<string, { across: number; beyond: number }> {
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

  const outwardIsVertical = direction === 'LR' || direction === 'RL';
  const reach = (node: Node) => (outwardIsVertical ? (node.height ?? 0) : (node.width ?? 0));
  const alongBorder = (node: Node) => (outwardIsVertical ? (node.width ?? 0) : (node.height ?? 0));

  const footprints = new Map<string, { across: number; beyond: number }>();
  for (const [hostId, bucket] of buckets) {
    const { total } = packAlongBorder(bucket.map((node) => alongBorder(node)));
    const beyond = Math.max(...bucket.map((node) => (readAnchor(node)?.gap ?? 0) + reach(node)));
    footprints.set(hostId, { across: total / 2, beyond });
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

export function clearAnchoredOverlaps(layout: LayoutData, pins: AnchorPin[]): AnchorPin[] {
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
      const role = (parent as { metadata?: { laneRole?: string } }).metadata?.laneRole;
      if (role === 'lane' || role === 'pool') {
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
      const clearance = entry.anchor.gap ?? 0;
      const span = ((horizontal ? entry.node.height : entry.node.width) ?? 0) / 2;
      const push = clearance > 0 ? clearance + span : 0;
      const alongSide = ((horizontal ? entry.node.width : entry.node.height) ?? 0) / 2;
      const clearOfFlow = !horizontal && clearance > 0 ? -(alongSide + ANCHOR_GAP) : 0;
      const x = horizontal ? hx + offset : hx + (side === 'right' ? hw / 2 + push : -hw / 2 - push);
      const y = horizontal
        ? hy + (side === 'bottom' ? hh / 2 + push : -hh / 2 - push)
        : hy + offset + clearOfFlow;
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

function stubToHost(node: Node, host: Node, pin: AnchorPin): { x: number; y: number }[] | null {
  const nx = node.x;
  const ny = node.y;
  const hx = host.x;
  const hy = host.y;
  if (![nx, ny, hx, hy].every((v) => typeof v === 'number' && Number.isFinite(v))) {
    return null;
  }
  const alongX = pin.side === 'top' || pin.side === 'bottom';
  const hostAlong = alongX ? hx! : hy!;
  const hostHalf = ((alongX ? host.width : host.height) ?? 0) / 2;
  const reach = Math.max(0, hostHalf - BORDER_INSET);

  const face = attachFaceOf(node);
  const sideways = alongX
    ? face === 'left' || face === 'right'
    : face === 'top' || face === 'bottom';
  const half = ((alongX ? node.width : node.height) ?? 0) / 2;
  const exit = sideways
    ? (alongX ? nx! : ny!) +
      (face === 'left' || face === 'top' ? -(half + STUB_REACH) : half + STUB_REACH)
    : alongX
      ? nx!
      : ny!;
  const enter = clamp(exit, hostAlong - reach, hostAlong + reach);
  const mid = alongX ? (ny! + hy!) / 2 : (nx! + hx!) / 2;

  const at = (along: number, across: number) =>
    alongX ? { x: along, y: across } : { x: across, y: along };

  const path = [at(alongX ? nx! : ny!, alongX ? ny! : nx!)];
  if (sideways) {
    path.push(at(exit, alongX ? ny! : nx!));
  }
  if (Math.abs(enter - exit) >= 1) {
    path.push(at(exit, mid), at(enter, mid));
  }
  path.push(at(enter, alongX ? hy! : hx!));
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
