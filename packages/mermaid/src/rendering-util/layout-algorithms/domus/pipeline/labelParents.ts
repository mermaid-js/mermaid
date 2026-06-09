import type { Edge, Node } from '../../../types.js';
import { log } from '../../../../logger.js';
import { ORTHO_DEBUG } from '../debug.js';
import { rectForNode } from '../core/helpers.js';
import { isEdgeLabelNodeId } from '../core/labels.js';
import { ancestorGroupIds } from './groups.js';

export function inferEdgeLabelParentIds(nodesById: Map<string, Node>, edges: Edge[]): void {
  // Edge-label nodes are an internal representation detail (labels as nodes).
  // Their parent context should be the LCA (lowest common ancestor group) of
  // the adjacent *real* endpoints. This prevents cross-boundary labels (e.g. D->F)
  // from being incorrectly treated as inside the cluster.
  //
  // We infer by looking at all edges incident to the label node (typically 2):
  // - D -> label
  // - label -> F
  const neighborsByLabelId = new Map<string, Set<string>>();
  for (const e of edges ?? []) {
    const s = (e as any).start != null ? String((e as any).start) : null;
    const t = (e as any).end != null ? String((e as any).end) : null;
    if (!s || !t) {
      continue;
    }
    if (isEdgeLabelNodeId(s) && !isEdgeLabelNodeId(t)) {
      const set = neighborsByLabelId.get(s) ?? new Set<string>();
      set.add(t);
      neighborsByLabelId.set(s, set);
    } else if (!isEdgeLabelNodeId(s) && isEdgeLabelNodeId(t)) {
      const set = neighborsByLabelId.get(t) ?? new Set<string>();
      set.add(s);
      neighborsByLabelId.set(t, set);
    }
  }

  for (const [labelId, neighborIds] of neighborsByLabelId) {
    const label = nodesById.get(labelId);
    if (!label) {
      continue;
    }

    const neighbors: Node[] = [];
    for (const nid of neighborIds) {
      const n = nodesById.get(nid);
      if (!n) {
        continue;
      }
      if (isEdgeLabelNodeId(String((n as any).id ?? ''))) {
        continue;
      }
      neighbors.push(n);
    }
    if (neighbors.length === 0) {
      continue;
    }

    // Compute LCA of ancestor chains (outermost -> innermost).
    const chains = neighbors.map((n) => ancestorGroupIds(n, nodesById));
    let common: string[] = chains[0];
    for (let i = 1; i < chains.length; i++) {
      const c = chains[i];
      const n = Math.min(common.length, c.length);
      let j = 0;
      while (j < n && common[j] === c[j]) {
        j++;
      }
      common = common.slice(0, j);
      if (common.length === 0) {
        break;
      }
    }
    const lca = common.length > 0 ? common[common.length - 1] : null;

    // If the label is geometrically inside a group that at least one neighbor belongs to,
    // prefer assigning it to that (deepest) group. This avoids treating a label that is
    // drawn inside a subgraph as "outside" and forcing a boundary enter/exit just to reach it.
    const labelPos = { x: Number((label as any).x ?? 0), y: Number((label as any).y ?? 0) };
    const neighborGroups = new Set<string>();
    for (const chain of chains) {
      for (const gid of chain) {
        neighborGroups.add(gid);
      }
    }

    let bestGeoGroup: string | null = null;
    let bestDepth = -1;
    for (const [gid, g] of nodesById) {
      if (!(g as any)?.isGroup) {
        continue;
      }
      if (!neighborGroups.has(gid)) {
        continue;
      }
      const r = rectForNode(g);
      // Inclusive-with-epsilon containment: in real Mermaid layouts, edge-label centers
      // can land exactly on a cluster border due to rounding/snapping. Treat those as
      // "inside" so we don't force a boundary enter/exit just to reach the label.
      const eps = 1e-6;
      if (
        labelPos.x < r.left - eps ||
        labelPos.x > r.right + eps ||
        labelPos.y < r.top - eps ||
        labelPos.y > r.bottom + eps
      ) {
        continue;
      }
      const depth = ancestorGroupIds(g, nodesById).length;
      if (
        depth > bestDepth ||
        (depth === bestDepth && (bestGeoGroup == null || gid.localeCompare(bestGeoGroup) < 0))
      ) {
        bestDepth = depth;
        bestGeoGroup = gid;
      }
    }

    const chosen = bestGeoGroup ?? lca ?? undefined;
    (label as any).parentId = chosen;
    log.debug(ORTHO_DEBUG, 'EDGE_LABEL_INFER', {
      labelId,
      neighborIds: [...neighborIds].sort((a, b) => a.localeCompare(b)),
      lca,
      bestGeoGroup,
      chosen,
      labelPos,
    });
  }
}
