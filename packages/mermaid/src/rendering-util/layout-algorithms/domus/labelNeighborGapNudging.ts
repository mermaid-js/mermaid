import type { LayoutData, Node } from '../../types.js';
import { log } from '../../../logger.js';
import { ORTHO_DEBUG } from './debug.js';
import { rectForNode } from './core/helpers.js';

export interface LabelNeighborGapResult {
  changed: boolean;
  moves: number;
  remainingTooClose: number;
}

function isLabelNode(n: Node): boolean {
  const id = n?.id != null ? String(n.id) : '';
  return Boolean((n as any).isEdgeLabel) || id.startsWith('edge-label-');
}

function rectGapX(a: ReturnType<typeof rectForNode>, b: ReturnType<typeof rectForNode>): number {
  if (a.right <= b.left) {
    return b.left - a.right;
  }
  if (b.right <= a.left) {
    return a.left - b.right;
  }
  return 0;
}

function rectGapY(a: ReturnType<typeof rectForNode>, b: ReturnType<typeof rectForNode>): number {
  if (a.bottom <= b.top) {
    return b.top - a.bottom;
  }
  if (b.bottom <= a.top) {
    return a.top - b.bottom;
  }
  return 0;
}

function overlapX(a: ReturnType<typeof rectForNode>, b: ReturnType<typeof rectForNode>): number {
  return Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
}

function overlapY(a: ReturnType<typeof rectForNode>, b: ReturnType<typeof rectForNode>): number {
  return Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
}

/**
 * Ensure edge-label *nodes* (created by `createGraphWithElements`) are not placed
 * too close to their adjacent real endpoints (`edgeStart`, `edgeEnd`).
 *
 * DOMUS treats label nodes as regular vertices; this pass injects a small
 * post-placement clearance rule for readability.
 */
export function nudgeEdgeLabelNodesAwayFromNeighbors(
  layout: LayoutData,
  opts: { minGap: number; preferAxis?: 'x' | 'y' }
): LabelNeighborGapResult {
  const minGap = opts.minGap;
  const preferAxis = opts.preferAxis;
  const dir = String((layout as any)?.direction ?? '');
  const verticalFlow = dir === 'TB' || dir === 'BT' || dir === 'TD' || dir === 'DT';

  const nodes = layout.nodes ?? [];
  const byId = new Map<string, Node>();
  for (const n of nodes) {
    if (n?.id != null) {
      byId.set(String(n.id), n);
    }
  }

  let moves = 0;
  let remainingTooClose = 0;

  const labelIds = [...byId.keys()].filter((id) => {
    const n = byId.get(id)!;
    return !n.isGroup && isLabelNode(n);
  });

  for (const lid of labelIds) {
    const label = byId.get(lid)!;
    const sId = String((label as any).edgeStart ?? '');
    const tId = String((label as any).edgeEnd ?? '');
    const neighbors = [sId, tId].filter(Boolean);
    if (neighbors.length === 0) {
      continue;
    }

    for (const nid of neighbors) {
      const other = byId.get(nid);
      if (!other || other.isGroup) {
        continue;
      }

      const rl = rectForNode(label);
      const ro = rectForNode(other);

      // If they overlap in Y, enforce horizontal gap; if overlap in X, enforce vertical gap.
      const oy = overlapY(rl, ro);
      const ox = overlapX(rl, ro);

      const lx = Number((label as any).x ?? 0);
      const ly = Number((label as any).y ?? 0);
      const oxC = Number((other as any).x ?? 0);
      const oyC = Number((other as any).y ?? 0);

      // Special case (gated): for vertical flowcharts, prefer placing the label node
      // above/below its *edgeEnd* neighbor (the target) instead of hugging left/right.
      //
      // Trigger when the label overlaps the endpoint in Y (i.e. it is beside the node).
      if (verticalFlow && nid === tId && oy > 0) {
        const otherH = Number((other as any).height ?? 0);
        const labelH = Number((label as any).height ?? 0);
        if (otherH > 0 && labelH > 0) {
          const desiredSign = dir === 'BT' || dir === 'DT' ? 1 : -1; // TB/TD => above target
          // User-facing aesthetics: "above the endpoint" still reads too tight at ~20px.
          // Use a slightly larger vertical clearance when we choose this mode.
          const vGap = Math.max(minGap, 40);
          const targetY = oyC + desiredSign * (otherH / 2 + labelH / 2 + vGap);
          // Center horizontally over the endpoint for readability (still a node).
          (label as any).x = oxC;
          (label as any).y = targetY;
          moves++;
          continue;
        }
      }

      let needX = 0;
      if (oy > 0) {
        const gx = rectGapX(rl, ro);
        if (gx < minGap) {
          needX = minGap - gx;
        }
      }
      let needY = 0;
      if (ox > 0) {
        const gy = rectGapY(rl, ro);
        if (gy < minGap) {
          needY = minGap - gy;
        }
      }

      if (needX <= 0 && needY <= 0) {
        continue;
      }
      remainingTooClose++;

      const wantX = preferAxis === 'x';
      const wantY = preferAxis === 'y';

      // Determination of nudge direction:
      // 1. If we have a preference and a violation in that axis, use it.
      // 2. Otherwise, if we have a violation in the other axis, use that.
      // 3. If both have violations, use the larger one or the preferred one.
      if (wantX && needX > 0) {
        const sign = lx >= oxC ? 1 : -1;
        (label as any).x = lx + sign * needX;
        moves++;
      } else if (wantY && needY > 0) {
        const sign = ly >= oyC ? 1 : -1;
        (label as any).y = ly + sign * needY;
        moves++;
      } else if (needX > 0 && needX >= needY) {
        const sign = lx >= oxC ? 1 : -1;
        (label as any).x = lx + sign * needX;
        moves++;
      } else if (needY > 0) {
        const sign = ly >= oyC ? 1 : -1;
        (label as any).y = ly + sign * needY;
        moves++;
      }
    }
  }

  const payload = { moves, remainingTooClose, minGap, preferAxis };
  log.debug(ORTHO_DEBUG, 'LABEL_NEIGHBOR_GAP_NUDGE', payload, JSON.stringify(payload));
  return { changed: moves > 0, moves, remainingTooClose };
}
