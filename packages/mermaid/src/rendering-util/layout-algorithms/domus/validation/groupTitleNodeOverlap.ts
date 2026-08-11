/**
 * DOMUS-specific check: a subgraph's child node must not intrude into the frame's
 * title band.
 *
 * A titled subgraph paints its title in a band at the top of its frame
 * (`clusters.js`, at `top + subGraphTitleTopMargin`). If a child node sits inside
 * that band the title is drawn over the node — the exact defect seen on
 * `domus/decoupled-subgraph` ("hello" over node D) and `domus/edge-from-subgraph`.
 *
 * The core validator was blind to this: it only scored geometry it could see, and
 * nothing modelled the title band for DOMUS, so both fixtures scored a perfect
 * 1000 while visibly broken. DOMUS now reserves the band during layout
 * (`cluster.ts`); this extension turns that band into a HARD constraint so a
 * title-over-node overlap can no longer hide behind a clean score.
 *
 * The band is computed from `subgraphTitleBandRect` (frame top + `titleBandHeight`),
 * NOT stored as `node.groupTitleRect`. Storing it there would also arm the core
 * `edge-intersects-group-title` check, which conflicts with subgraph→external edges
 * that must legitimately leave through the top strip. Checking only child NODES —
 * which the layout genuinely keeps out of the band — has no such side effect.
 *
 * Scope: DOMUS only; never touches swimlanes / cose-bilkent scoring.
 */
import type { LayoutData, Node } from '../../../types.js';
import type {
  Issue,
  LayoutValidationExtension,
  ValidateLayoutResult,
} from '../../layout-utils/validateLayout.js';
import { isEdgeLabelNode } from '../core/labels.js';
import { subgraphTitleBandRect } from '../cluster.js';

/** Overlap smaller than this (px) is rounding noise, not a real intrusion. */
const OVERLAP_EPS = 0.5;

function childBelongsToGroup(node: Node, groupId: string, nodesById: Map<string, Node>): boolean {
  let cur: Node | undefined = node;
  const seen = new Set<string>();
  while (cur?.parentId != null) {
    const pid = String(cur.parentId);
    if (seen.has(pid)) {
      break;
    }
    seen.add(pid);
    if (pid === groupId) {
      return true;
    }
    cur = nodesById.get(pid);
    if (!cur?.isGroup) {
      break;
    }
  }
  return false;
}

export const groupTitleNodeOverlapExtension: LayoutValidationExtension = {
  id: 'domus:groupTitleNodeOverlap',

  check(layout: LayoutData, _core: Readonly<ValidateLayoutResult>): Issue[] {
    const nodes = layout.nodes ?? [];
    const nodesById = new Map<string, Node>();
    for (const n of nodes) {
      if (n?.id != null) {
        nodesById.set(String(n.id), n);
      }
    }

    const issues: Issue[] = [];
    for (const group of nodes) {
      if (!group.isGroup) {
        continue;
      }
      const band = subgraphTitleBandRect(group);
      if (!band) {
        continue;
      }

      for (const node of nodes) {
        if (node.isGroup || isEdgeLabelNode(node)) {
          continue;
        }
        if (typeof node.x !== 'number' || typeof node.y !== 'number') {
          continue;
        }
        if (!childBelongsToGroup(node, String(group.id), nodesById)) {
          continue;
        }

        const left = node.x - (node.width ?? 0) / 2;
        const right = node.x + (node.width ?? 0) / 2;
        const top = node.y - (node.height ?? 0) / 2;
        const bottom = node.y + (node.height ?? 0) / 2;

        const overlapX = Math.min(right, band.right) - Math.max(left, band.left);
        const overlapY = Math.min(bottom, band.bottom) - Math.max(top, band.top);
        if (overlapX > OVERLAP_EPS && overlapY > OVERLAP_EPS) {
          issues.push({
            type: 'node-overlaps-group-title',
            message: `Node "${node.id}" overlaps the title band of subgraph "${group.id}"`,
            nodeIds: [String(node.id), String(group.id)],
            details: { overlapX, overlapY },
          });
        }
      }
    }
    return issues;
  },
};
