import type { LayoutData, Node } from '../../types.js';
import { log } from '../../../logger.js';
import { ORTHO_DEBUG } from './debug.js';
import { rectForNode } from './core/helpers.js';

export interface LabelNudgeResult {
  changed: boolean;
  moves: number;
  iterations: number;
  remainingOverlaps: number;
}

function isEdgeLabelNode(n: Node): boolean {
  const id = n?.id != null ? String(n.id) : '';
  return Boolean((n as any).isEdgeLabel) || id.startsWith('edge-label-');
}

function overlapAmount(
  a: ReturnType<typeof rectForNode>,
  b: ReturnType<typeof rectForNode>
): { x: number; y: number } | null {
  const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  if (overlapX <= 0 || overlapY <= 0) {
    return null;
  }
  return { x: overlapX, y: overlapY };
}

/**
 * Gated safety net: when label nodes overlap other nodes, nudge only the label nodes
 * minimally until overlaps are resolved or we hit an iteration limit.
 *
 * This is intentionally conservative:
 * - never moves non-label nodes
 * - deterministic direction choices
 */
export function nudgeEdgeLabelNodesToAvoidOverlaps(
  layout: LayoutData,
  opts: { padding?: number; maxIterations?: number } = {}
): LabelNudgeResult {
  const padding = opts.padding ?? 2;
  const maxIterations = opts.maxIterations ?? 25;

  const nodes = layout.nodes ?? [];
  const byId = new Map<string, Node>();
  for (const n of nodes) {
    if (n?.id != null) {
      byId.set(String(n.id), n);
    }
  }

  const labelIds = [...byId.keys()].filter((id) => {
    const n = byId.get(id)!;
    return !n.isGroup && isEdgeLabelNode(n);
  });

  if (labelIds.length === 0) {
    return { changed: false, moves: 0, iterations: 0, remainingOverlaps: 0 };
  }

  let moves = 0;
  let iterations = 0;

  const computeRemaining = (): number => {
    let rem = 0;
    for (const lid of labelIds) {
      const ln = byId.get(lid);
      if (!ln) {
        continue;
      }
      const lr = rectForNode(ln);
      for (const [oid, on] of byId) {
        if (oid === lid) {
          continue;
        }
        if (on.isGroup) {
          continue;
        }
        const ov = overlapAmount(lr, rectForNode(on));
        if (ov) {
          rem++;
        }
      }
    }
    return rem;
  };

  for (iterations = 0; iterations < maxIterations; iterations++) {
    let movedThisIter = 0;

    for (const lid of labelIds) {
      const label = byId.get(lid);
      if (!label) {
        continue;
      }
      const lr = rectForNode(label);

      // Find the "worst" overlap partner to resolve first (deterministic: max area, then id).
      let worst: { otherId: string; ov: { x: number; y: number }; other: Node } | null = null;
      for (const [oid, other] of byId) {
        if (oid === lid) {
          continue;
        }
        if (other.isGroup) {
          continue;
        }
        const ov = overlapAmount(lr, rectForNode(other));
        if (!ov) {
          continue;
        }
        const area = ov.x * ov.y;
        if (!worst) {
          worst = { otherId: oid, ov, other };
          continue;
        }
        const worstArea = worst.ov.x * worst.ov.y;
        if (area > worstArea || (area === worstArea && oid.localeCompare(worst.otherId) < 0)) {
          worst = { otherId: oid, ov, other };
        }
      }

      if (!worst) {
        continue;
      }

      // Minimal separation: move along the smaller overlap axis.
      const dx = worst.ov.x + padding;
      const dy = worst.ov.y + padding;

      const lx = Number((label as any).x ?? 0);
      const ly = Number((label as any).y ?? 0);
      const ox = Number((worst.other as any).x ?? 0);
      const oy = Number((worst.other as any).y ?? 0);

      if (dx <= dy) {
        // Move in x away from other (tie -> move right).
        const sign = lx >= ox ? 1 : -1;
        (label as any).x = lx + sign * dx;
      } else {
        // Move in y away from other (tie -> move down).
        const sign = ly >= oy ? 1 : -1;
        (label as any).y = ly + sign * dy;
      }

      moves++;
      movedThisIter++;
    }

    if (movedThisIter === 0) {
      break;
    }
  }

  const remaining = computeRemaining();
  if (moves > 0) {
    log.debug(ORTHO_DEBUG, 'LABEL_NUDGE', {
      moves,
      iterations,
      remainingOverlaps: remaining,
      padding,
    });
  }
  return { changed: moves > 0, moves, iterations, remainingOverlaps: remaining };
}
