/**
 * DOMUS-specific check: a node must not overlap a subgraph frame it does not
 * belong to — from ANY side (top, bottom, left, right).
 *
 * A subgraph is drawn as a filled/bordered rectangle. Any node that is not a
 * descendant of that subgraph but whose rectangle intrudes into the frame reads
 * as "inside the box" even though it belongs elsewhere (e.g. `deploy-pipeline`:
 * the external "Notify Developer" node crossing the "Deploy Pipeline" frame).
 * Sibling-subgraph intrusions are caught the same way: a node inside subgraph A
 * whose rect pokes into sibling subgraph B is not a descendant of B, so it is
 * flagged for B.
 *
 * The core validator treated group frames as inert for foreign nodes (only a
 * SOFT `node-too-close-to-group` proximity nudge existed, and it stops at the
 * frame edge — it never fired on an actual crossing). This makes the crossing a
 * HARD constraint. It complements `groupTitleNodeOverlapExtension`, which covers
 * a group's OWN child intruding into its title band.
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

/** Overlap smaller than this (px) is rounding noise, not a real intrusion. */
const OVERLAP_EPS = 0.5;

function rectOf(n: Node) {
  return {
    left: (n.x ?? 0) - (n.width ?? 0) / 2,
    right: (n.x ?? 0) + (n.width ?? 0) / 2,
    top: (n.y ?? 0) - (n.height ?? 0) / 2,
    bottom: (n.y ?? 0) + (n.height ?? 0) / 2,
  };
}

/** True when `node` is `groupId` itself or nested (at any depth) inside it. */
function isSelfOrDescendant(node: Node, groupId: string, byId: Map<string, Node>): boolean {
  if (String(node.id) === groupId) {
    return true;
  }
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
    cur = byId.get(pid);
    if (!cur?.isGroup) {
      break;
    }
  }
  return false;
}

export const foreignNodeGroupOverlapExtension: LayoutValidationExtension = {
  id: 'domus:foreignNodeGroupOverlap',

  check(layout: LayoutData, _core: Readonly<ValidateLayoutResult>): Issue[] {
    const nodes = layout.nodes ?? [];
    const byId = new Map<string, Node>();
    for (const n of nodes) {
      if (n?.id != null) {
        byId.set(String(n.id), n);
      }
    }

    const issues: Issue[] = [];
    for (const group of nodes) {
      if (!group.isGroup || typeof group.x !== 'number' || typeof group.y !== 'number') {
        continue;
      }
      const gr = rectOf(group);
      for (const node of nodes) {
        if (node.isGroup || isEdgeLabelNode(node)) {
          continue;
        }
        if (typeof node.x !== 'number' || typeof node.y !== 'number') {
          continue;
        }
        if (isSelfOrDescendant(node, String(group.id), byId)) {
          continue;
        }
        const r = rectOf(node);
        const overlapX = Math.min(r.right, gr.right) - Math.max(r.left, gr.left);
        const overlapY = Math.min(r.bottom, gr.bottom) - Math.max(r.top, gr.top);
        if (overlapX > OVERLAP_EPS && overlapY > OVERLAP_EPS) {
          issues.push({
            type: 'node-overlaps-foreign-group',
            message: `Node "${node.id}" overlaps subgraph "${group.id}" it does not belong to`,
            nodeIds: [String(node.id), String(group.id)],
            details: { overlapX, overlapY },
          });
        }
      }
    }
    return issues;
  },
};
