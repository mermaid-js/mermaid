/**
 * Score-gated sibling-port reorder with a directed orthogonal port-router.
 *
 * When two edges share a node side but their ports are ordered opposite to
 * their far endpoints, the edges cross (Company: on Income's N side the
 * USCompany port sits LEFT of the Tax port, yet USCompany is further RIGHT than
 * Tax). The rail-shift crossing-repair cannot fix this — the ports must be
 * REORDERED and the edges re-routed.
 *
 * The router (`routeDirected`) is the piece the earlier naive attempt lacked: a
 * candidate route is only valid if its FIRST segment leaves along the port's
 * outward normal and its LAST segment enters the far port along that side's
 * normal — so it never silently flips a port to a different side. When the far
 * node has a single incident edge, the router may also slide the far port along
 * its side to line up a straight run.
 *
 * Fully score-gated: a reorder is kept only when the unified validator score
 * strictly improves.
 */
import type { LayoutData, Node } from '../../../types.js';
import { rectForNode } from '../core/helpers.js';
import { checkLayout } from '../validateLayoutProxy.js';
import { findRoutingGraphPathBetweenPorts } from '../core/routing.js';

interface Point {
  x: number;
  y: number;
}
type Rect = ReturnType<typeof rectForNode>;
type Side = 'N' | 'S' | 'E' | 'W';

const EPS = 1e-6;
const ON = 2;
const MARGIN = 8;
const MIN_SEP = 12;

const OUTWARD: Record<Side, Point> = {
  N: { x: 0, y: -1 },
  S: { x: 0, y: 1 },
  E: { x: 1, y: 0 },
  W: { x: -1, y: 0 },
};

function sideOf(r: Rect, p: Point): Side | null {
  const inX = p.x >= r.left - ON && p.x <= r.right + ON;
  const inY = p.y >= r.top - ON && p.y <= r.bottom + ON;
  if (inX && Math.abs(p.y - r.top) <= ON) {
    return 'N';
  }
  if (inX && Math.abs(p.y - r.bottom) <= ON) {
    return 'S';
  }
  if (inY && Math.abs(p.x - r.left) <= ON) {
    return 'W';
  }
  if (inY && Math.abs(p.x - r.right) <= ON) {
    return 'E';
  }
  return null;
}

function sgn(v: number): number {
  return v > EPS ? 1 : v < -EPS ? -1 : 0;
}
function segDir(a: Point, b: Point): Point {
  return { x: sgn(b.x - a.x), y: sgn(b.y - a.y) };
}
function dirEq(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}
function orthogonal(route: Point[]): boolean {
  for (let i = 0; i + 1 < route.length; i++) {
    const a = route[i];
    const b = route[i + 1];
    const h = Math.abs(a.y - b.y) <= EPS && Math.abs(a.x - b.x) > EPS;
    const v = Math.abs(a.x - b.x) <= EPS && Math.abs(a.y - b.y) > EPS;
    if (!h && !v) {
      return false;
    }
  }
  return true;
}

/**
 * Orthogonal routes from `p` (leaving along `dP`) to `q` (entering along the
 * far side's inward normal `-dQ`). Straight / L / Z shapes, filtered so the
 * first and last segments honour the port directions.
 */
function routeDirected(p: Point, dP: Point, q: Point, dQ: Point): Point[][] {
  const wantFirst = dP;
  const wantLast = { x: -dQ.x, y: -dQ.y };
  const mx = (p.x + q.x) / 2;
  const my = (p.y + q.y) / 2;
  const raw: Point[][] = [
    [p, q],
    [p, { x: q.x, y: p.y }, q],
    [p, { x: p.x, y: q.y }, q],
    [p, { x: mx, y: p.y }, { x: mx, y: q.y }, q],
    [p, { x: p.x, y: my }, { x: q.x, y: my }, q],
  ];
  const out: Point[][] = [];
  for (const rt of raw) {
    // Drop zero-length leading/trailing collinearity by requiring distinct pts.
    if (
      rt.some(
        (pt, i) =>
          i > 0 && Math.abs(pt.x - rt[i - 1].x) <= EPS && Math.abs(pt.y - rt[i - 1].y) <= EPS
      )
    ) {
      continue;
    }
    if (!orthogonal(rt)) {
      continue;
    }
    if (!dirEq(segDir(rt[0], rt[1]), wantFirst)) {
      continue;
    }
    if (!dirEq(segDir(rt[rt.length - 2], rt[rt.length - 1]), wantLast)) {
      continue;
    }
    out.push(rt.map((pt) => ({ ...pt })));
  }
  return out;
}

function segmentMidpoints(pts: Point[]): Point[] {
  const mids: { x: number; y: number; len: number }[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    mids.push({
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
      len: Math.abs(b.x - a.x) + Math.abs(b.y - a.y),
    });
  }
  mids.sort((u, v) => v.len - u.len);
  return mids.map((m) => ({ x: m.x, y: m.y }));
}

function ccw(a: Point, b: Point, c: Point): number {
  return (c.y - a.y) * (b.x - a.x) - (b.y - a.y) * (c.x - a.x);
}
function segCross(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const d1 = ccw(p3, p4, p1);
  const d2 = ccw(p3, p4, p2);
  const d3 = ccw(p1, p2, p3);
  const d4 = ccw(p1, p2, p4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}
function edgesCross(a: Point[], b: Point[]): boolean {
  for (let i = 0; i + 1 < a.length; i++) {
    for (let j = 0; j + 1 < b.length; j++) {
      if (segCross(a[i], a[i + 1], b[j], b[j + 1])) {
        return true;
      }
    }
  }
  return false;
}

interface Edge {
  id?: string;
  start?: string;
  end?: string;
  points?: Point[];
  x?: number;
  y?: number;
  label?: unknown;
}
interface PortRef {
  edge: Edge;
  atStart: boolean;
  farId: string;
  farRect: Rect;
  farTangent: number;
}

export function reorderSiblingPortsToUncrossWhenScoreImproves(layout: LayoutData): void {
  let current = checkLayout(layout);
  if (current.breakdown.crossings === 0) {
    return;
  }

  const nodeById = new Map<string, Node>();
  for (const n of layout.nodes ?? []) {
    if (n?.id != null) {
      nodeById.set(String(n.id), n);
    }
  }
  const edges = (layout.edges ?? []) as Edge[];
  const degree = new Map<string, number>();
  for (const e of edges) {
    for (const id of [e.start, e.end]) {
      if (id != null) {
        degree.set(String(id), (degree.get(String(id)) ?? 0) + 1);
      }
    }
  }

  for (const node of layout.nodes ?? []) {
    if (node?.id == null || node.isGroup || (node as { isEdgeLabel?: boolean }).isEdgeLabel) {
      continue;
    }
    const nodeId = String(node.id);
    const r = rectForNode(node);

    const bySide = new Map<Side, PortRef[]>();
    for (const e of edges) {
      const pts = e.points;
      if (!Array.isArray(pts) || pts.length < 2) {
        continue;
      }
      for (const atStart of [true, false]) {
        if (String(atStart ? e.start : e.end) !== nodeId) {
          continue;
        }
        const port = atStart ? pts[0] : pts[pts.length - 1];
        const side = sideOf(r, port);
        const farId = atStart ? e.end : e.start;
        const farNode = farId != null ? nodeById.get(String(farId)) : undefined;
        if (!side || !farNode) {
          continue;
        }
        const farRect = rectForNode(farNode);
        const horiz = side === 'N' || side === 'S';
        const list = bySide.get(side) ?? [];
        list.push({
          edge: e,
          atStart,
          farId: String(farId),
          farRect,
          farTangent: horiz ? farRect.cx : farRect.cy,
        });
        bySide.set(side, list);
      }
    }

    for (const [side, ports] of bySide) {
      if (ports.length < 2) {
        continue;
      }
      let crossing = false;
      for (let i = 0; i < ports.length && !crossing; i++) {
        for (let j = i + 1; j < ports.length; j++) {
          if (edgesCross(ports[i].edge.points!, ports[j].edge.points!)) {
            crossing = true;
            break;
          }
        }
      }
      if (!crossing) {
        continue;
      }

      const horiz = side === 'N' || side === 'S';
      const sideCoord =
        side === 'N' ? r.top : side === 'S' ? r.bottom : side === 'W' ? r.left : r.right;
      const dP = OUTWARD[side];
      const ordered = [...ports].sort((a, b) => a.farTangent - b.farTangent);
      const lo = (horiz ? r.left : r.top) + MARGIN;
      const hi = (horiz ? r.right : r.bottom) - MARGIN;
      if (hi - lo < MIN_SEP * (ordered.length - 1)) {
        continue;
      }
      const pos: number[] = [];
      for (const [i, ref0] of ordered.entries()) {
        let t = Math.max(lo, Math.min(hi, ref0.farTangent));
        if (i > 0) {
          t = Math.max(t, pos[i - 1] + MIN_SEP);
        }
        pos.push(t);
      }
      const overflow = pos[pos.length - 1] - hi;
      if (overflow > 0) {
        for (const [i, value] of pos.entries()) {
          pos[i] = Math.max(lo, value - overflow);
        }
      }

      const snap = edges.map((e) => ({ pts: e.points?.map((p) => ({ ...p })), x: e.x, y: e.y }));

      let allOk = true;
      ordered.forEach((ref, idx) => {
        const t = pos[idx];
        const newPort: Point = horiz ? { x: t, y: sideCoord } : { x: sideCoord, y: t };
        const farPts = ref.edge.points!;
        const farPort = ref.atStart ? farPts[farPts.length - 1] : farPts[0];
        const farSide = sideOf(ref.farRect, farPort);
        if (!farSide) {
          allOk = false;
          return;
        }
        const dQ = OUTWARD[farSide];
        const farHoriz = farSide === 'N' || farSide === 'S';
        const farCoord =
          farSide === 'N'
            ? ref.farRect.top
            : farSide === 'S'
              ? ref.farRect.bottom
              : farSide === 'W'
                ? ref.farRect.left
                : ref.farRect.right;
        // Far port candidates: keep it, or (if the far node has only this edge)
        // slide it to line up with the new port.
        const farMovable = degree.get(ref.farId) === 1;
        const farPortOptions: Point[] = [{ x: farPort.x, y: farPort.y }];
        if (farMovable) {
          const fLo = (farHoriz ? ref.farRect.left : ref.farRect.top) + MARGIN;
          const fHi = (farHoriz ? ref.farRect.right : ref.farRect.bottom) - MARGIN;
          const aligned = Math.max(fLo, Math.min(fHi, farHoriz ? newPort.x : newPort.y));
          farPortOptions.push(farHoriz ? { x: aligned, y: farCoord } : { x: farCoord, y: aligned });
        }

        const savedPts = ref.edge.points;
        const savedX = ref.edge.x;
        const savedY = ref.edge.y;
        const hasLabel = ref.edge.label != null && Number.isFinite(ref.edge.x);
        const startId = String(ref.edge.start);
        const endId = String(ref.edge.end);
        const STUB = 20;
        // Stub just outside the reordered node, so the obstacle router never
        // chooses to leave the port on the wrong side.
        const nearStub: Point = { x: newPort.x + dP.x * STUB, y: newPort.y + dP.y * STUB };

        // Score a candidate route, choosing the best on-edge label anchor.
        const scoreRoute = (route: Point[]): { score: number; x?: number; y?: number } => {
          ref.edge.points = route;
          let bs = -1;
          let bx = savedX;
          let by = savedY;
          const anchors = hasLabel ? segmentMidpoints(route) : [{ x: savedX ?? 0, y: savedY ?? 0 }];
          for (const a of anchors) {
            if (hasLabel) {
              ref.edge.x = a.x;
              ref.edge.y = a.y;
            }
            const probe = checkLayout(layout);
            if (probe.score > bs) {
              bs = probe.score;
              bx = hasLabel ? a.x : savedX;
              by = hasLabel ? a.y : savedY;
            }
          }
          return { score: bs, x: bx, y: by };
        };

        let bestScore = -1;
        let bestPts: Point[] | null = null;
        let bestX = savedX;
        let bestY = savedY;
        for (const fc of farPortOptions) {
          const farStub: Point = { x: fc.x + dQ.x * STUB, y: fc.y + dQ.y * STUB };
          const routes: Point[][] = [];
          // Proper obstacle-avoiding route between the two stub ends.
          const mid = findRoutingGraphPathBetweenPorts(
            nearStub,
            farStub,
            nodeById,
            startId,
            endId,
            10,
            {
              model: 'channels',
              clearance: 8,
            }
          );
          if (mid && mid.length >= 2) {
            const m = mid.map((p) => ({ ...p }));
            routes.push(
              ref.atStart
                ? [{ ...newPort }, ...m, { ...fc }]
                : [{ ...fc }, ...m.reverse(), { ...newPort }]
            );
          }
          // Fallback shapes for the no-obstacle case (router returns null).
          for (const route of routeDirected(newPort, dP, fc, dQ)) {
            routes.push(ref.atStart ? route : [...route].reverse());
          }
          for (const route of routes) {
            const res = scoreRoute(route);
            if (res.score > bestScore) {
              bestScore = res.score;
              bestPts = route;
              bestX = res.x;
              bestY = res.y;
            }
          }
        }
        if (bestPts) {
          ref.edge.points = bestPts;
          ref.edge.x = bestX;
          ref.edge.y = bestY;
        } else {
          ref.edge.points = savedPts;
          ref.edge.x = savedX;
          ref.edge.y = savedY;
          allOk = false;
        }
      });

      const next = checkLayout(layout);
      if (allOk && next.ok && next.score > current.score) {
        current = next;
      } else {
        edges.forEach((e, i) => {
          e.points = snap[i].pts;
          e.x = snap[i].x;
          e.y = snap[i].y;
        });
      }
    }
  }
}
