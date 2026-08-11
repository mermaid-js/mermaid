import type { LayoutData, Node, Edge } from '../../types.js';
import { log } from '../../../logger.js';
import { ORTHO_DEBUG } from './debug.js';
import { rectForNode } from './core/helpers.js';

export interface EdgeGapNudgeResult {
  changed: boolean;
  moves: number;
  remainingTooClose: number;
}

function isLeaf(n: Node): boolean {
  return Boolean(n) && !n.isGroup;
}

function isLabelId(id: string): boolean {
  return id.startsWith('edge-label-');
}

function horizontalGap(
  a: ReturnType<typeof rectForNode>,
  b: ReturnType<typeof rectForNode>
): number {
  if (a.right <= b.left) {
    return b.left - a.right;
  }
  if (b.right <= a.left) {
    return a.left - b.right;
  }
  return 0; // overlap or touch
}

function overlapY(a: ReturnType<typeof rectForNode>, b: ReturnType<typeof rectForNode>): number {
  return Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
}

/**
 * Ensure a minimum horizontal gap for node pairs that are directly connected by an edge.
 * This prevents “no room for arrowhead” situations when two boxes end up adjacent.
 *
 * Conservative: only moves nodes (no edges), deterministic, and typically followed by rerouting.
 */
export function nudgeConnectedPairsForMinGap(
  layout: LayoutData,
  opts: { minGap: number; preferAxis?: 'x' | 'y' }
): EdgeGapNudgeResult {
  const minGap = opts.minGap;
  const preferAxis = opts.preferAxis;

  const nodes = layout.nodes ?? [];
  const edges = (layout.edges ?? []) as unknown as Edge[];

  const byId = new Map<string, Node>();
  for (const n of nodes) {
    if (n?.id != null) {
      byId.set(String(n.id), n);
    }
  }

  // Build unique unordered endpoint pairs for semantic edges (skip label-split endpoints).
  const pairs = new Map<string, { a: string; b: string }>();
  for (const e of edges) {
    const s = e.start != null ? String(e.start) : '';
    const t = e.end != null ? String(e.end) : '';
    if (!s || !t) {
      continue;
    }
    if (isLabelId(s) || isLabelId(t)) {
      continue;
    }
    if (s === t) {
      continue;
    }
    const a = s.localeCompare(t) <= 0 ? s : t;
    const b = s.localeCompare(t) <= 0 ? t : s;
    pairs.set(`${a}||${b}`, { a, b });
  }

  let moves = 0;
  let remainingTooClose = 0;
  const movedPairs: {
    a: string;
    b: string;
    gapBefore: number;
    gapAfter: number;
    need: number;
    movedLeftId: string;
    movedRightId: string;
  }[] = [];

  // Prefer axis: for TB/TD we only enforce horizontal gap (x). If preferAxis is not x,
  // we still only do horizontal gap here (this pass is specifically for arrowhead clearance).
  const enforceX = preferAxis !== 'y';

  for (const { a, b } of pairs.values()) {
    const na = byId.get(a);
    const nb = byId.get(b);
    if (!na || !nb) {
      continue;
    }
    if (!isLeaf(na) || !isLeaf(nb)) {
      continue;
    }

    let ra = rectForNode(na);
    let rb = rectForNode(nb);
    // The pair has to actually be SIDE BY SIDE for a horizontal gap to be the
    // thing it needs. Any y-overlap at all used to qualify, which let a
    // *vertically stacked* pair in — and then the fix below pushed it apart
    // sideways, which does nothing for the arrowhead on a vertical edge and
    // destroys the x-alignment that a `U`/`D` shape label requires.
    //
    // This is what made the algorithm sensitive to `look`. The graph is the same
    // in every look; only box sizes change. On `edge-types`, `M1` sits directly
    // above `C`: at `look=neo` (h=48) their rects are 8px apart so nothing fires,
    // at `look=classic` (h=54) they overlap by 2px, this pass fired, split them
    // 34px in x, and `applyGxClassSnap`'s 20px threshold then refused to put them
    // back — leaving `M1 --> C` doubling back across M1's own border and the whole
    // layout invalid. Requiring the overlap to be a real share of the box height
    // rather than a sliver is scale-invariant, so the decision no longer depends
    // on how tall the boxes happen to be.
    const sameRowOverlap = Math.min(ra.bottom - ra.top, rb.bottom - rb.top) / 2;
    if (overlapY(ra, rb) <= sameRowOverlap) {
      continue;
    }

    const gapBefore = horizontalGap(ra, rb);
    const gap = gapBefore;
    if (gap >= minGap) {
      continue;
    }

    const need = minGap - gap;
    remainingTooClose++;

    if (!enforceX) {
      continue;
    }

    // Push apart along x based on actual geometry (not id ordering):
    // move the left node left and the right node right, guaranteeing increased gap.
    let leftId = a;
    let rightId = b;
    if (ra.right <= rb.left) {
      leftId = a;
      rightId = b;
    } else if (rb.right <= ra.left) {
      leftId = b;
      rightId = a;
    } else {
      // Overlapping/touching: decide by centroid.
      if ((ra.cx ?? 0) > (rb.cx ?? 0)) {
        leftId = b;
        rightId = a;
      }
    }

    const left = byId.get(leftId)!;
    const right = byId.get(rightId)!;
    (left as any).x = Number((left as any).x ?? 0) - need / 2;
    (right as any).x = Number((right as any).x ?? 0) + need / 2;

    // Recompute after move for debug visibility.
    ra = rectForNode(byId.get(a)!);
    rb = rectForNode(byId.get(b)!);
    const gapAfter = horizontalGap(ra, rb);

    moves++;
    movedPairs.push({
      a,
      b,
      gapBefore,
      gapAfter,
      need,
      movedLeftId: leftId,
      movedRightId: rightId,
    });
  }

  const payload = { moves, remainingTooClose, minGap, preferAxis, movedPairs };
  log.debug(ORTHO_DEBUG, 'EDGE_GAP_NUDGE', payload, JSON.stringify(payload));
  return { changed: moves > 0, moves, remainingTooClose };
}
