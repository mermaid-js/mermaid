import type { LayoutData, Node } from '../../types.js';
import { log } from '../../../logger.js';
import { ORTHO_DEBUG } from './debug.js';
import { rectForNode } from './core/helpers.js';

export interface MinSpacingResult {
  changed: boolean;
  moves: number;
  iterations: number;
  remainingTooClose: number;
}

function isLeaf(n: Node): boolean {
  return Boolean(n) && !n.isGroup;
}

function tooCloseAmount(
  a: ReturnType<typeof rectForNode>,
  b: ReturnType<typeof rectForNode>,
  minGap: number
): { x: number; y: number } | null {
  // If rectangles overlap in Y, enforce min horizontal gap.
  const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));

  // Horizontal gap (only meaningful when they are disjoint in X).
  let needX = 0;
  if (overlapY > 0) {
    const gapX = a.right <= b.left ? b.left - a.right : b.right <= a.left ? a.left - b.right : 0;
    if (gapX > 0 && gapX < minGap) {
      needX = minGap - gapX;
    }
  }

  // Vertical gap (only meaningful when they are disjoint in Y).
  let needY = 0;
  if (overlapX > 0) {
    const gapY = a.bottom <= b.top ? b.top - a.bottom : b.bottom <= a.top ? a.top - b.bottom : 0;
    if (gapY > 0 && gapY < minGap) {
      needY = minGap - gapY;
    }
  }

  if (needX <= 0 && needY <= 0) {
    return null;
  }
  return { x: needX, y: needY };
}

/**
 * Safety net / aesthetics hardening:
 * Increase clearance between leaf node rectangles when they are "too close"
 * (`gap < minGap`) while overlapping in the other axis.
 *
 * This does NOT try to globally optimize; it is a deterministic local repair.
 */
export function nudgeLeafNodesForMinimumSpacing(
  layout: LayoutData,
  opts: { minGap: number; maxIterations?: number; preferAxis?: 'x' | 'y' }
): MinSpacingResult {
  const minGap = opts.minGap;
  const maxIterations = opts.maxIterations ?? 60;
  const preferAxis = opts.preferAxis;

  const nodes = layout.nodes ?? [];
  const leaves = nodes
    .filter((n) => n?.id != null && isLeaf(n))
    .map((n) => String(n.id))
    .sort((a, b) => a.localeCompare(b));

  const byId = new Map<string, Node>();
  for (const n of nodes) {
    if (n?.id != null) {
      byId.set(String(n.id), n);
    }
  }

  const computeRemaining = (): number => {
    let rem = 0;
    for (let i = 0; i < leaves.length; i++) {
      const a = byId.get(leaves[i]);
      if (!a) {
        continue;
      }
      const ra = rectForNode(a);
      for (let j = i + 1; j < leaves.length; j++) {
        const b = byId.get(leaves[j]);
        if (!b) {
          continue;
        }
        if (tooCloseAmount(ra, rectForNode(b), minGap)) {
          rem++;
        }
      }
    }
    return rem;
  };

  let moves = 0;
  let iterations = 0;

  for (iterations = 0; iterations < maxIterations; iterations++) {
    // Pick worst "too close" pair by max required movement, tie-break by ids.
    let worst: { aId: string; bId: string; need: { x: number; y: number }; score: number } | null =
      null;

    for (let i = 0; i < leaves.length; i++) {
      const aId = leaves[i];
      const a = byId.get(aId);
      if (!a) {
        continue;
      }
      const ra = rectForNode(a);
      for (let j = i + 1; j < leaves.length; j++) {
        const bId = leaves[j];
        const b = byId.get(bId);
        if (!b) {
          continue;
        }
        const need = tooCloseAmount(ra, rectForNode(b), minGap);
        if (!need) {
          continue;
        }
        const score = Math.max(need.x, need.y);
        if (
          !worst ||
          score > worst.score ||
          (score === worst.score &&
            (aId.localeCompare(worst.aId) < 0 ||
              (aId === worst.aId && bId.localeCompare(worst.bId) < 0)))
        ) {
          worst = { aId, bId, need, score };
        }
      }
    }

    if (!worst) {
      break;
    }

    const a = byId.get(worst.aId)!;
    const b = byId.get(worst.bId)!;

    const ax = Number((a as any).x ?? 0);
    const ay = Number((a as any).y ?? 0);
    const bx = Number((b as any).x ?? 0);
    const by = Number((b as any).y ?? 0);

    const wantX = preferAxis === 'x';
    const wantY = preferAxis === 'y';

    // For layered flowcharts (TB/BT) we often want to preserve y-levels; callers can
    // set preferAxis='x' to avoid “jumping” nodes vertically.
    if (
      (wantX && worst.need.x > 0) ||
      (!wantY && worst.need.x >= worst.need.y && worst.need.x > 0)
    ) {
      // Separate along x.
      const pushA = worst.aId.localeCompare(worst.bId) <= 0 ? -1 : 1;
      const pushB = -pushA;
      (a as any).x = ax + (pushA * worst.need.x) / 2;
      (b as any).x = bx + (pushB * worst.need.x) / 2;
    } else if ((wantY && worst.need.y > 0) || (!wantX && worst.need.y > 0)) {
      // Separate along y.
      const pushA = worst.aId.localeCompare(worst.bId) <= 0 ? -1 : 1;
      const pushB = -pushA;
      (a as any).y = ay + (pushA * worst.need.y) / 2;
      (b as any).y = by + (pushB * worst.need.y) / 2;
    } else {
      break;
    }

    moves++;
  }

  const remaining = computeRemaining();
  // This pass is gated at callsites; always log so real executions can confirm it ran,
  // even if no moves were needed (moves===0).
  //
  // Include a JSON string as well because some environments/tools drop object payloads.
  const payload = { moves, iterations, remainingTooClose: remaining, minGap, preferAxis };
  log.debug(ORTHO_DEBUG, 'MIN_SPACING_NUDGE', payload, JSON.stringify(payload));
  return { changed: moves > 0, moves, iterations, remainingTooClose: remaining };
}
