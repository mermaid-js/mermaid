import type { Node } from '../../../types.js';
import type { Point, Rect } from '../types.js';
import { approxEqual, rectForNode } from '../core/helpers.js';
import { ancestorGroupIds, commonPrefixLen } from './groups.js';

export function pointOnRectBoundary(p: Point, r: Rect): boolean {
  const onVertical =
    (approxEqual(p.x, r.left) || approxEqual(p.x, r.right)) &&
    p.y >= r.top - 1e-6 &&
    p.y <= r.bottom + 1e-6;
  const onHorizontal =
    (approxEqual(p.y, r.top) || approxEqual(p.y, r.bottom)) &&
    p.x >= r.left - 1e-6 &&
    p.x <= r.right + 1e-6;
  return onVertical || onHorizontal;
}

export function insertBoundaryWaypointsForCrossBoundaryEdge(
  points: Point[],
  startNode: Node,
  endNode: Node,
  nodesById: Map<string, Node>
): Point[] {
  if (!points || points.length < 2) {
    return points;
  }

  const chain = (n: Node): string[] => {
    const anc = ancestorGroupIds(n, nodesById);
    if (anc.length === 0) {
      const pid = (n as any).parentId != null ? String((n as any).parentId) : null;
      const g = pid ? nodesById.get(pid) : null;
      if (pid && g?.isGroup) {
        return [pid];
      }
    }
    return anc;
  };

  const sAnc = chain(startNode);
  const eAnc = chain(endNode);
  const cp = commonPrefixLen(sAnc, eAnc);
  const leaving = sAnc.slice(cp).reverse();
  const entering = eAnc.slice(cp);
  const targetGroups = [...leaving, ...entering];
  if (targetGroups.length === 0) {
    return points;
  }

  const between = (v: number, a: number, b: number) =>
    v >= Math.min(a, b) - 1e-6 && v <= Math.max(a, b) + 1e-6;

  let out = [...points];
  for (const gid of targetGroups) {
    const g = nodesById.get(gid);
    if (!g || !(g as any)?.isGroup) {
      continue;
    }
    const r = rectForNode(g);
    // Already has an explicit boundary waypoint? keep.
    if (out.some((p) => pointOnRectBoundary(p, r))) {
      continue;
    }

    for (let i = 0; i < out.length - 1; i++) {
      const a = out[i];
      const b = out[i + 1];
      let hit: Point | null = null;

      if (approxEqual(a.x, b.x)) {
        const x = a.x;
        if (x >= r.left - 1e-6 && x <= r.right + 1e-6) {
          if (between(r.top, a.y, b.y)) {
            hit = { x, y: r.top };
          } else if (between(r.bottom, a.y, b.y)) {
            hit = { x, y: r.bottom };
          }
        }
      } else if (approxEqual(a.y, b.y)) {
        const y = a.y;
        if (y >= r.top - 1e-6 && y <= r.bottom + 1e-6) {
          if (between(r.left, a.x, b.x)) {
            hit = { x: r.left, y };
          } else if (between(r.right, a.x, b.x)) {
            hit = { x: r.right, y };
          }
        }
      }

      if (!hit) {
        continue;
      }
      const already =
        (approxEqual(hit.x, a.x) && approxEqual(hit.y, a.y)) ||
        (approxEqual(hit.x, b.x) && approxEqual(hit.y, b.y));
      if (already) {
        continue;
      }

      out = [...out.slice(0, i + 1), hit, ...out.slice(i + 1)];
      break;
    }
  }
  return out;
}

export function normalizePolyline(points: Point[], groupsById?: Map<string, Node>): Point[] {
  if (!points || points.length <= 2) {
    return points;
  }
  const out: Point[] = [];

  // 1) Drop consecutive duplicates.
  for (const p of points) {
    const last = out[out.length - 1];
    if (last && approxEqual(last.x, p.x) && approxEqual(last.y, p.y)) {
      continue;
    }
    out.push(p);
  }

  if (out.length <= 2) {
    return out;
  }

  // 2) Drop collinear interior points.
  const out2: Point[] = [out[0]];
  for (let i = 1; i < out.length - 1; i++) {
    const a = out2[out2.length - 1];
    const b = out[i];
    const c = out[i + 1];
    // Preserve semantic boundary waypoints (e.g. cluster entry/exit points),
    // even if they are collinear, so debugging/tests can reliably detect crossings.
    let preserve = false;
    if (groupsById && groupsById.size > 0) {
      for (const g of groupsById.values()) {
        if (!(g as any).isGroup) {
          continue;
        }
        if (pointOnRectBoundary(b, rectForNode(g))) {
          preserve = true;
          break;
        }
      }
    }
    const collinearX = approxEqual(a.x, b.x) && approxEqual(b.x, c.x);
    const collinearY = approxEqual(a.y, b.y) && approxEqual(b.y, c.y);
    if (!preserve && (collinearX || collinearY)) {
      continue;
    }
    out2.push(b);
  }
  out2.push(out[out.length - 1]);
  return out2;
}
