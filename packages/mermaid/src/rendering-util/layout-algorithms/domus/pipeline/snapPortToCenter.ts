/**
 * iter-41 — Paint-diagonal port snap.
 *
 * Mermaid's rendering (`rendering-util/rendering-elements/edges.js:426–462`)
 * re-clips each edge endpoint by firing a ray from the NODE CENTER through
 * the polyline's first/last interior point. The polyline's p0/pLast is
 * discarded at paint time.
 *
 * When iter-9 C1 port distribution places a port at t ≠ 0.5 on a W/E side
 * (p0.y ≠ node.center.y), the ray center→firstInner is not horizontal, so
 * the clip lands at a y slightly offset from port.y. The rendered first
 * segment (clip → firstInner) is then DIAGONAL by `|port.y - clipped.y|`
 * units — sub-pixel, but a stale axis-aligned regression source.
 *
 * For a W-side port at (nodeLeft, p0.y) with firstInner at (firstInner.x,
 * p0.y) (horizontal exit), the rendered dy is:
 *   rendered_dy = (p0.y - center.y) * d / (halfW + d)
 * where d = (center.x - firstInner.x) is the horizontal distance from center
 * to firstInner. For rendered dy \< AXIS_EPS (0.5), the port must satisfy:
 *   |p0.y - center.y| \< AXIS_EPS * (halfW + d) / d
 *
 * Strategy: for each (node, side) group of edge endpoints, REDISTRIBUTE the
 * perpendicular-axis coords within a paint-clean band around node center,
 * maintaining ≥ EPS_PORT+1 (3u) gaps so `edge-same-port-departure` doesn't
 * fire. C1's off-center distinction is preserved in relative order; the
 * absolute offsets are compressed to paint-clean magnitudes.
 *
 * Paper anchor: None — Mermaid-specific paint-time adaptation.
 */
import type { LayoutData, Node, NonClusterNode } from '../../../types.js';

interface Point {
  x: number;
  y: number;
}

const AXIS_EPS = 0.5;
/** Keep \>EPS_PORT(2) gap between neighbouring ports to avoid validator's
 * `edge-same-port-departure` check. 3u matches validator tolerance + 1u. */
const MIN_PORT_GAP = 3;
/** Fallback distance from node center when firstInner sits ON the boundary
 * (d=0 case). Avoids 0/0 in threshold math. */
const DEFAULT_INNER_OFFSET = 10;

type Side = 'W' | 'E' | 'N' | 'S';

function classifySide(p: Point, cx: number, cy: number, hw: number, hh: number): Side | null {
  const left = cx - hw;
  const right = cx + hw;
  const top = cy - hh;
  const bottom = cy + hh;
  if (Math.abs(p.x - left) <= AXIS_EPS) {
    return 'W';
  }
  if (Math.abs(p.x - right) <= AXIS_EPS) {
    return 'E';
  }
  if (Math.abs(p.y - top) <= AXIS_EPS) {
    return 'N';
  }
  if (Math.abs(p.y - bottom) <= AXIS_EPS) {
    return 'S';
  }
  return null;
}

/**
 * Axis-aligned first segment check: true iff p0 and p1 share the
 * port-PARALLEL axis (i.e., first segment is perpendicular to the side).
 */
function hasAxisAlignedExit(port: Point, inner: Point, side: Side): boolean {
  if (side === 'W' || side === 'E') {
    return Math.abs(port.y - inner.y) < 1e-6;
  }
  return Math.abs(port.x - inner.x) < 1e-6;
}

/**
 * For a port on W/E side: paint-clean threshold for |port.y - center.y|.
 *   Let s = |center.x - firstInner.x|,  d = s - halfW (firstInner's
 *   distance outside the boundary — positive when firstInner is not on
 *   or inside the boundary).
 *   rendered_dy = |port.y - center.y| * d / (halfW + d) = offset * d / s
 *   rendered_dy \< AXIS_EPS  ⇔  |port.y - center.y| \< AXIS_EPS * s / d
 * Mirror for N/S with halfH.
 */
function paintCleanThreshold(
  side: Side,
  halfW: number,
  halfH: number,
  innerOffsetFromCenter: number
): number {
  const halfSize = side === 'W' || side === 'E' ? halfW : halfH;
  const s = Math.max(innerOffsetFromCenter, halfSize + 1);
  const d = Math.max(s - halfSize, 1);
  return (AXIS_EPS * s) / d;
}

interface EndpointRef {
  edgeIndex: number;
  endpointKind: 'start' | 'end';
  port: Point; // pts[0] for start, pts[n-1] for end
  inner: Point; // pts[1] for start, pts[n-2] for end
}

interface Options {
  spacing?: number;
}

export function snapPortsToCenterWhenPaintDiagonal(
  layout: LayoutData,
  _opts: Options = {}
): { snapped: number } {
  const byId = new Map<string, Node>();
  for (const n of layout.nodes ?? []) {
    if (n?.id != null) {
      byId.set(String(n.id), n);
    }
  }
  const edges = layout.edges ?? [];

  // ── 1. Collect edge endpoints per (node, side) ─────────────────
  type GroupKey = string; // `${nodeId}::${side}`
  const groups = new Map<GroupKey, EndpointRef[]>();
  const nodeInfo = new Map<
    string,
    { cx: number; cy: number; hw: number; hh: number; node: NonClusterNode }
  >();

  for (const [ei, edge] of edges.entries()) {
    const pts = (edge as { points?: Point[] }).points;
    if (!Array.isArray(pts) || pts.length < 2) {
      continue;
    }
    const startId =
      (edge as { start?: unknown }).start != null ? String((edge as any).start) : null;
    const endId = (edge as { end?: unknown }).end != null ? String((edge as any).end) : null;

    for (const [kind, nodeId, port, inner] of [
      ['start', startId, pts[0], pts[1]] as const,
      ['end', endId, pts[pts.length - 1], pts[pts.length - 2]] as const,
    ]) {
      if (!nodeId) {
        continue;
      }
      const node = byId.get(nodeId) as NonClusterNode | undefined;
      if (!node || (node as { isGroup?: boolean }).isGroup) {
        continue;
      }
      const cx = node.x ?? 0;
      const cy = node.y ?? 0;
      const hw = (node.width ?? 40) / 2;
      const hh = (node.height ?? 40) / 2;
      nodeInfo.set(nodeId, { cx, cy, hw, hh, node });
      const side = classifySide(port, cx, cy, hw, hh);
      if (!side) {
        continue;
      }
      if (!hasAxisAlignedExit(port, inner, side)) {
        continue;
      }
      const key = `${nodeId}::${side}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push({ edgeIndex: ei, endpointKind: kind, port, inner });
    }
  }

  let snapped = 0;

  // ── 2. For each group, redistribute within paint-clean band ────
  for (const [key, group] of groups) {
    const [nodeId, side] = key.split('::') as [string, Side];
    const info = nodeInfo.get(nodeId);
    if (!info) {
      continue;
    }
    const { cx, cy, hw, hh } = info;

    // Perpendicular-axis values (the ones we might snap).
    const isHorizSide = side === 'W' || side === 'E';
    const centerPerp = isHorizSide ? cy : cx;

    // Which members need correction? A member is paint-clean iff its
    // current port-perp coord is within threshold of center.
    const members = group.map((m) => {
      const portPerp = isHorizSide ? m.port.y : m.port.x;
      const innerPara = isHorizSide ? m.inner.x : m.inner.y;
      const innerOffset = Math.abs((isHorizSide ? cx : cy) - innerPara);
      const d = innerOffset > 0.01 ? innerOffset : DEFAULT_INNER_OFFSET;
      const thr = paintCleanThreshold(side, hw, hh, d);
      return { ref: m, portPerp, thr, d };
    });
    // If all are already paint-clean, skip.
    if (members.every((m) => Math.abs(m.portPerp - centerPerp) <= m.thr)) {
      continue;
    }

    // Use the tightest threshold across the group — must satisfy all.
    const bandThreshold = Math.min(...members.map((m) => m.thr));
    // Leave 1u margin below threshold so we stay strictly under AXIS_EPS.
    const maxOffset = Math.max(0, bandThreshold - 1);

    // Redistribute uniformly in [-maxOffset, +maxOffset], sorted by current portPerp.
    const sorted = [...members].sort((a, b) => a.portPerp - b.portPerp);
    const N = sorted.length;
    for (let i = 0; i < N; i++) {
      let newPerp: number;
      if (N === 1) {
        newPerp = centerPerp;
      } else {
        const t = N === 1 ? 0.5 : i / (N - 1);
        newPerp = centerPerp - maxOffset + t * (2 * maxOffset);
      }
      (sorted[i] as { newPerp?: number }).newPerp = newPerp;
    }

    // Ensure adjacent gaps >= MIN_PORT_GAP; if band is too tight, bail
    // (don't touch — would cause validator collision). This can happen on
    // very small nodes where the paint-clean band < (N-1)*MIN_PORT_GAP.
    const needed = (N - 1) * MIN_PORT_GAP;
    if (2 * maxOffset < needed) {
      continue;
    }

    // Apply. For each member, write the newPerp back into port + inner.
    for (const m of sorted) {
      const newPerp = (m as { newPerp?: number }).newPerp!;
      const edge = edges[m.ref.edgeIndex];
      const pts = (edge as { points: Point[] }).points;
      const n = pts.length;
      if (m.ref.endpointKind === 'start') {
        const p0 = pts[0];
        const p1 = pts[1];
        if (isHorizSide) {
          pts[0] = { x: p0.x, y: newPerp };
          pts[1] = { x: p1.x, y: newPerp };
        } else {
          pts[0] = { x: newPerp, y: p0.y };
          pts[1] = { x: newPerp, y: p1.y };
        }
      } else {
        const pLast = pts[n - 1];
        const pInner = pts[n - 2];
        if (isHorizSide) {
          pts[n - 1] = { x: pLast.x, y: newPerp };
          pts[n - 2] = { x: pInner.x, y: newPerp };
        } else {
          pts[n - 1] = { x: newPerp, y: pLast.y };
          pts[n - 2] = { x: newPerp, y: pInner.y };
        }
      }
      snapped++;
    }
  }

  return { snapped };
}
