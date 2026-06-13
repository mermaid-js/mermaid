/**
 * Score-gated node-vs-group spacing (finalize stage).
 *
 * `validateLayout` flags `node-too-close-to-group` (a graded soft penalty) when
 * a non-member leaf node faces a foreign subgraph frame across too small a gap
 * (e.g. subgraph-variation's P5 only 10px off the P1.5 frame). This pass repairs
 * it by sliding the offending node directly away from the frame until it clears
 * NODE_GROUP_CLEARANCE, carrying each incident edge endpoint along (and
 * translating a perpendicular terminal segment so it stays orthogonal).
 *
 * Fully score-gated: a candidate slide is kept only when the unified validator
 * score strictly improves, so a move that would collide the node with something
 * or break one of its edges is rejected. Nodes are spaced worst-gap first.
 */
import type { LayoutData, Node } from '../../../types.js';
import { rectForNode } from '../core/helpers.js';
import { validateLayout } from '../../layout-utils/validateLayout.js';

interface Point {
  x: number;
  y: number;
}

const EPS = 1e-6;
/** Matches validateLayout's NODE_GROUP_CLEARANCE. */
const CLEARANCE = 20;

export function spaceNodesOffGroupFramesWhenScoreImproves(layout: LayoutData): void {
  let current = validateLayout(layout);
  const flags = current.issues.filter((i) => i.type === 'node-too-close-to-group');
  if (flags.length === 0) {
    return;
  }

  const nodeById = new Map<string, Node>();
  for (const n of layout.nodes ?? []) {
    if (n?.id != null) {
      nodeById.set(String(n.id), n);
    }
  }
  const edges = (layout.edges ?? []) as {
    id?: string;
    start?: string;
    end?: string;
    points?: Point[];
  }[];

  // Worst (smallest gap) first.
  const sorted = [...flags].sort(
    (a, b) => ((a.details?.gap as number) ?? 0) - ((b.details?.gap as number) ?? 0)
  );

  for (const issue of sorted) {
    const [nId, gId] = issue.nodeIds ?? [];
    const node = nId != null ? nodeById.get(nId) : undefined;
    const group = gId != null ? nodeById.get(gId) : undefined;
    if (!node || !group) {
      continue;
    }
    const nr = rectForNode(node);
    const gr = rectForNode(group);
    const gap = (issue.details?.gap as number) ?? 0;

    // Slide along the separation axis, away from the group.
    const xOverlap = nr.left < gr.right && gr.left < nr.right;
    const yOverlap = nr.top < gr.bottom && gr.top < nr.bottom;
    let axis: 'x' | 'y';
    let sign: number;
    if (xOverlap && !yOverlap) {
      axis = 'y';
      sign = nr.bottom <= gr.top ? -1 : 1;
    } else if (yOverlap && !xOverlap) {
      axis = 'x';
      sign = nr.right <= gr.left ? -1 : 1;
    } else {
      continue;
    }

    const need = CLEARANCE - gap;
    for (const extra of [2, 6, 12]) {
      const delta = sign * (need + extra);
      const snapNx = node.x;
      const snapNy = node.y;
      const snapPts = edges.map((e) => e.points?.map((p) => ({ ...p })));

      if (axis === 'x') {
        (node as { x?: number }).x = (node.x ?? 0) + delta;
      } else {
        (node as { y?: number }).y = (node.y ?? 0) + delta;
      }
      for (const e of edges) {
        const pts = e.points;
        if (!Array.isArray(pts) || pts.length < 2) {
          continue;
        }
        const idxs: number[] = [];
        if (String(e.start) === nId) {
          idxs.push(0);
        }
        if (String(e.end) === nId) {
          idxs.push(pts.length - 1);
        }
        for (const idx of idxs) {
          const pN = pts[idx];
          const pAdj = pts[idx === 0 ? 1 : pts.length - 2];
          // Parallel terminal segment just lengthens; a perpendicular one must
          // translate (shift its far end too) to stay orthogonal.
          const parallel =
            axis === 'x' ? Math.abs(pN.y - pAdj.y) <= EPS : Math.abs(pN.x - pAdj.x) <= EPS;
          if (axis === 'x') {
            pN.x += delta;
            if (!parallel) {
              pAdj.x += delta;
            }
          } else {
            pN.y += delta;
            if (!parallel) {
              pAdj.y += delta;
            }
          }
        }
      }

      const next = validateLayout(layout);
      if (next.score > current.score) {
        current = next;
        break;
      }
      // Restore.
      (node as { x?: number }).x = snapNx;
      (node as { y?: number }).y = snapNy;
      edges.forEach((e, i) => {
        if (snapPts[i]) {
          e.points = snapPts[i];
        }
      });
    }
  }
}
