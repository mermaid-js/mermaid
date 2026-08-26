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

/** Returns the last validation it computed (current geometry), or null when no
 * edge qualified geometrically — callers chain it into the next pass to save a
 * full checkLayout (the shared-validation pattern from the band/corner pair). */
export function straightenFacingPairsWhenScoreImproves(
  layout: LayoutData,
  opts: { shapes?: 'straight' | 'all' } = {}
): ReturnType<typeof checkLayout> | null {
  // The L-rebuild runs ONLY from the end-of-layout call site. Run from the
  // polish block it wins its per-candidate gate and then steers every
  // downstream pass onto worse endpoints (measured: architecture4 -20 with a
  // fresh grid-misalignment, co-pilot -3 — net -18 corpus-wide while every
  // individual commit was a local improvement). The straight arm has no such
  // effect and stays early, where the diamond snap can build on it.
  const shapes = opts.shapes ?? 'straight';
  // The entry validation is paid LAZILY, on the first geometrically
  // qualifying edge — most fixtures have none, and a full checkLayout per
  // fixture per call site is real money on the cost ledger.
  let current: ReturnType<typeof checkLayout> | null = null;
  const gateOpen = (): boolean => {
    current ??= checkLayout(layout);
    return current.ok && current.score > 0;
  };
  // Edge ids whose terminals the validator flags for port placement. A 3-point
  // L is already bend-optimal, but when a terminal sits off the diamond vertex
  // or hugs a corner, the center-line rebuild can clear the flag — so flagged
  // 3-point routes join the L-rebuild candidate set (unflagged ones stay
  // skipped: nothing to win, one checkLayout to lose).
  const portFlaggedEdgeIds = (): Set<string> => {
    const ids = new Set<string>();
    for (const i of current?.issues ?? []) {
      if (
        (i.type === 'port-off-diamond-corner' || i.type === 'port-near-corner') &&
        i.edgeId != null
      ) {
        ids.add(String(i.edgeId));
      }
    }
    return ids;
  };

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

    const disjointX = sr.right < tr.left || tr.right < sr.left;
    const disjointY = sr.bottom < tr.top || tr.bottom < sr.top;

    // Diagonal pair (disjoint on BOTH axes): the optimal orthogonal shape is a
    // single-bend L through the two center lines — which on diamonds passes
    // through the drawn vertices. Try both elbow orientations; only routes
    // with 2+ bends are worth rebuilding.
    if (disjointX && disjointY) {
      if (shapes !== 'all' || pts.length <= 2) {
        continue; // L-rebuild only at end-of-layout
      }
      if (!gateOpen()) {
        return current;
      }
      // A 3-point route is already bend-optimal — rebuild it only when one of
      // its terminals carries a port flag the center-line L could clear.
      if (pts.length === 3 && !portFlaggedEdgeIds().has(String(e.id))) {
        continue;
      }
      const scx = s.x ?? 0;
      const scy = s.y ?? 0;
      const tcx = t.x ?? 0;
      const tcy = t.y ?? 0;
      const sLeft = sr.right < tr.left;
      const sAbove = sr.bottom < tr.top;
      const snapshotPtsL = pts.map((p) => ({ ...p }));
      const snapshotAnchorL = { x: e.x, y: e.y };
      const variants: Point[][] = [
        // Exit horizontal from s, arrive vertical at t.
        [
          { x: sLeft ? sr.right : sr.left, y: scy },
          { x: tcx, y: scy },
          { x: tcx, y: sAbove ? tr.top : tr.bottom },
        ],
        // Exit vertical from s, arrive horizontal at t.
        [
          { x: scx, y: sAbove ? sr.bottom : sr.top },
          { x: scx, y: tcy },
          { x: sLeft ? tr.left : tr.right, y: tcy },
        ],
      ];
      for (const cand of variants) {
        e.points = cand.map((p) => ({ ...p }));
        if (typeof e.label === 'string' && e.label.length > 0) {
          // Anchor on the longer leg's midpoint — more room for the rect.
          const leg1 = Math.abs(cand[1].x - cand[0].x) + Math.abs(cand[1].y - cand[0].y);
          const leg2 = Math.abs(cand[2].x - cand[1].x) + Math.abs(cand[2].y - cand[1].y);
          const a = leg1 >= leg2 ? cand[0] : cand[1];
          const b = leg1 >= leg2 ? cand[1] : cand[2];
          e.x = (a.x + b.x) / 2;
          e.y = (a.y + b.y) / 2;
        }
        const next = checkLayout(layout);
        if (next.ok && next.score > current!.score) {
          current = next;
          log.debug(
            `FSTRAIGHT: commit-L edge=${String(e.id)} pts ${snapshotPtsL.length}->3 score=${next.score.toFixed(1)}`
          );
          break;
        }
        e.points = snapshotPtsL.map((p) => ({ ...p }));
        e.x = snapshotAnchorL.x;
        e.y = snapshotAnchorL.y;
      }
      continue;
    }

    // Facing axis: boxes disjoint on `axis`, side spans overlapping on the
    // other. At most one orientation can hold.
    let axis: 'x' | 'y' | null = null;
    if (disjointX) {
      axis = 'x';
    } else if (disjointY) {
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
    if (!gateOpen()) {
      return current;
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
      if (next.ok && next.score > current!.score) {
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
  return current;
}
