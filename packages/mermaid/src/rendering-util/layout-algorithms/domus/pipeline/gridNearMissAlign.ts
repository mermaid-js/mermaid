/**
 * Grid near-miss alignment (winner-only, score-gated).
 *
 * `validateLayout` flags `grid-misalignment` (soft 5) when two edge-connected
 * leaves sit ALMOST in line — "either aligned or clearly apart reads as
 * deliberate". The repair nudges one of the pair onto the other's center line
 * (both directions tried, either node may be the one that is free to move),
 * dragging incident edge geometry so routes stay orthogonal. Strict
 * whole-layout score gate per nudge: a move that deforms a straight edge,
 * lands on a neighbour, or trades the 5 for anything worse is rejected.
 */
import type { LayoutData, Node } from '../../../types.js';
import { checkLayout } from '../validateLayoutProxy.js';
import { log } from '../../../../logger.js';

interface Point {
  x: number;
  y: number;
}

interface AlignEdge {
  id?: string;
  start?: string;
  end?: string;
  points?: Point[];
  x?: number;
  y?: number;
  label?: unknown;
}

const EPS = 1e-6;

export function alignGridNearMissesWhenScoreImproves(layout: LayoutData): void {
  let current = checkLayout(layout);
  if (!current.ok || current.score === 0) {
    return; // score-gated only; a 5-point lever cannot open a clamped gate
  }
  const flagged = current.issues.filter((i) => i.type === 'grid-misalignment');
  if (flagged.length === 0) {
    return;
  }

  const nodeById = new Map<string, Node>();
  for (const n of layout.nodes ?? []) {
    if (n?.id != null) {
      nodeById.set(String(n.id), n);
    }
  }
  const edges = (layout.edges ?? []) as AlignEdge[];

  /** Move one node by `delta` on `axis`, dragging its incident edge terminals;
   * commit iff the score strictly improves, else restore in place. */
  const tryNudge = (id: string, delta: number, axis: 'x' | 'y'): boolean => {
    const n = nodeById.get(id);
    if (!n || Math.abs(delta) <= EPS) {
      return false;
    }
    const snapPos = { x: n.x ?? 0, y: n.y ?? 0 };
    const touched: { p: Point; x: number; y: number }[] = [];
    const labelSnaps: { e: AlignEdge; x?: number; y?: number }[] = [];
    const movePoint = (p: Point): void => {
      touched.push({ p, x: p.x, y: p.y });
      if (axis === 'x') {
        p.x += delta;
      } else {
        p.y += delta;
      }
    };

    if (axis === 'x') {
      (n as { x?: number }).x = snapPos.x + delta;
    } else {
      (n as { y?: number }).y = snapPos.y + delta;
    }
    for (const e of edges) {
      const pts = e.points;
      if (!Array.isArray(pts) || pts.length < 2) {
        continue;
      }
      const idxs: number[] = [];
      if (e.start != null && String(e.start) === id) {
        idxs.push(0);
      }
      if (e.end != null && String(e.end) === id) {
        idxs.push(pts.length - 1);
      }
      for (const idx of idxs) {
        const pN = pts[idx];
        const pAdj = pts[idx === 0 ? 1 : pts.length - 2];
        const parallel =
          axis === 'x' ? Math.abs(pN.y - pAdj.y) <= EPS : Math.abs(pN.x - pAdj.x) <= EPS;
        movePoint(pN);
        if (!parallel && pAdj !== pN) {
          movePoint(pAdj);
        }
        labelSnaps.push({ e, x: e.x, y: e.y });
        if (typeof e.label === 'string' && e.label.length > 0) {
          if (axis === 'x' && typeof e.x === 'number') {
            e.x += delta / 2;
          } else if (axis === 'y' && typeof e.y === 'number') {
            e.y += delta / 2;
          }
        }
      }
    }

    const next = checkLayout(layout);
    if (next.ok && next.score > current.score) {
      current = next;
      log.debug(`GRIDALIGN: commit node=${id} axis=${axis} delta=${delta.toFixed(2)}`);
      return true;
    }
    (n as { x?: number }).x = snapPos.x;
    (n as { y?: number }).y = snapPos.y;
    for (const t of touched) {
      t.p.x = t.x;
      t.p.y = t.y;
    }
    for (const s of labelSnaps) {
      s.e.x = s.x;
      s.e.y = s.y;
    }
    return false;
  };

  for (const issue of flagged) {
    const [aId, bId] = issue.nodeIds ?? [];
    const axis = issue.details?.axis as 'x' | 'y' | undefined;
    const a = aId != null ? nodeById.get(aId) : undefined;
    const b = bId != null ? nodeById.get(bId) : undefined;
    if (!a || !b || (axis !== 'x' && axis !== 'y') || aId == null || bId == null) {
      continue;
    }
    const av = (axis === 'x' ? a.x : a.y) ?? 0;
    const bv = (axis === 'x' ? b.x : b.y) ?? 0;
    // Either node may be the movable one — try both directions.
    if (!tryNudge(aId, bv - av, axis)) {
      tryNudge(bId, av - bv, axis);
    }
  }
}
