/**
 * Facing-pair straightening (winner-only, score-gated).
 *
 * A 2-endpoint edge whose nodes face each other across a free corridor — their
 * side spans overlap on one axis and their boxes are disjoint on the other —
 * can be drawn as a single straight segment between the facing sides. DOMUS's
 * router regularly ships such edges with 3–4 bends instead (co-pilot-extension:
 * n7→n9 and n7→n11 both have centers at exactly y=238 yet route over the top
 * with 3 bends each; n10→endNode shares x=1593.7 and takes 4).
 *
 * The candidate replaces the whole polyline with the straight, riding the
 * overlay label to its midpoint. Straightness compounds: the removed bends stop
 * paying bend penalty, a 2-point edge earns the bendless `port-near-corner`
 * waiver, and when the shared center line passes through both side midpoints a
 * diamond endpoint lands exactly on its drawn vertex (clearing
 * `port-off-diamond-corner`, 40 each). Every candidate is kept only when the
 * unified score strictly improves, so a straight that would cross an obstacle,
 * strand its label, or collide with a sibling rail is rejected wholesale.
 *
 * Literature: post-routing terminal re-assignment is the three-phase method's
 * port phase (Biedl/Madden/Tollis §3.4); KLay applies "local post-adjustments
 * [that] may remove bends" (jvlc13). See the diamond-vertex snap pass for the
 * full paper trail — this pass is the straight-line arm of the same family.
 */
import type { LayoutData, Node } from '../../../types.js';
import { rectForNode } from '../core/helpers.js';
import { checkLayout } from '../validateLayoutProxy.js';
import { log } from '../../../../logger.js';

interface Point {
  x: number;
  y: number;
}

interface StraightEdge {
  id?: string;
  start?: string;
  end?: string;
  points?: Point[];
  x?: number;
  y?: number;
  label?: unknown;
}

/** Minimum side-span overlap that still leaves room for a port on each side. */
const MIN_OVERLAP = 8;
/** Centers within this distance count as one shared center line. */
const CENTER_EPS = 1;

export function straightenFacingPairsWhenScoreImproves(layout: LayoutData): void {
  let current = checkLayout(layout);
  if (!current.ok || current.score === 0) {
    return; // strictly score-gated; a clamped/zero score cannot grade a candidate
  }

  const nodeById = new Map<string, Node>();
  for (const n of layout.nodes ?? []) {
    if (n?.id != null) {
      nodeById.set(String(n.id), n);
    }
  }

  for (const e of (layout.edges ?? []) as StraightEdge[]) {
    const pts = e.points;
    if (
      e.start == null ||
      e.end == null ||
      String(e.start) === String(e.end) ||
      !Array.isArray(pts) ||
      pts.length <= 2 // already straight (or degenerate)
    ) {
      continue;
    }
    const s = nodeById.get(String(e.start));
    const t = nodeById.get(String(e.end));
    if (!s || !t || s.isGroup || t.isGroup) {
      continue;
    }
    const sr = rectForNode(s);
    const tr = rectForNode(t);

    // Facing axis: boxes disjoint on `axis`, side spans overlapping on the
    // other. Both orientations checked; at most one can hold.
    let axis: 'x' | 'y' | null = null;
    if (sr.right < tr.left || tr.right < sr.left) {
      axis = 'x';
    } else if (sr.bottom < tr.top || tr.bottom < sr.top) {
      axis = 'y';
    }
    if (axis === null) {
      continue;
    }
    const lo = axis === 'x' ? Math.max(sr.top, tr.top) : Math.max(sr.left, tr.left);
    const hi = axis === 'x' ? Math.min(sr.bottom, tr.bottom) : Math.min(sr.right, tr.right);
    if (hi - lo < MIN_OVERLAP) {
      continue;
    }

    const sc = axis === 'x' ? (s.y ?? 0) : (s.x ?? 0);
    const tc = axis === 'x' ? (t.y ?? 0) : (t.x ?? 0);
    // Shared center line first (diamond vertices live there), overlap middle
    // as the fallback for offset-but-overlapping pairs.
    const lineCandidates: number[] = [];
    if (Math.abs(sc - tc) <= CENTER_EPS && sc >= lo && sc <= hi) {
      lineCandidates.push((sc + tc) / 2);
    }
    lineCandidates.push((lo + hi) / 2);

    const snapshotPts = pts.map((p) => ({ ...p }));
    const snapshotAnchor = { x: e.x, y: e.y };
    let committed = false;
    const tried = new Set<string>();
    for (const line of lineCandidates) {
      const key = line.toFixed(3);
      if (tried.has(key)) {
        continue;
      }
      tried.add(key);
      let a: Point;
      let b: Point;
      if (axis === 'x') {
        const sLeftOfT = sr.right < tr.left;
        a = { x: sLeftOfT ? sr.right : sr.left, y: line };
        b = { x: sLeftOfT ? tr.left : tr.right, y: line };
      } else {
        const sAboveT = sr.bottom < tr.top;
        a = { x: line, y: sAboveT ? sr.bottom : sr.top };
        b = { x: line, y: sAboveT ? tr.top : tr.bottom };
      }
      e.points = [a, b];
      if (typeof e.label === 'string' && e.label.length > 0) {
        e.x = (a.x + b.x) / 2;
        e.y = (a.y + b.y) / 2;
      }
      const next = checkLayout(layout);
      if (next.ok && next.score > current.score) {
        current = next;
        committed = true;
        log.debug(
          `FSTRAIGHT: commit edge=${String(e.id)} axis=${axis} line=${line.toFixed(1)} pts ${snapshotPts.length}->2 score=${next.score.toFixed(1)}`
        );
        break;
      }
      e.points = snapshotPts.map((p) => ({ ...p }));
      e.x = snapshotAnchor.x;
      e.y = snapshotAnchor.y;
    }
    if (!committed) {
      // restored above; nothing else to do
    }
  }
}
