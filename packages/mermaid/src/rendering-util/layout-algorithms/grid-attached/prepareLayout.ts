/**
 * Pre-measurement rewrite.
 *
 * Nothing is added to the diagram here — unlike `grid-decomposed`, which has to
 * create a duplicate of every core node before the measure stage because it draws
 * the peeled trees as separate islands. This layout attaches each tree back to the
 * core node it hung from, so the copied root HOLA's decomposition produces is
 * never drawn: the real core node stands in for it.
 *
 * Nothing is *removed* here either, which is where this parts company with
 * `hola-faithful`. That layout applies guide §3.2 — drop subgraph containers, and
 * any edge naming one, before measuring — because it does not draw containers at
 * all. This layout does, so the containers have to survive: a frame's own title is
 * measured during the measure stage like any other label, and a container deleted
 * before then would have no size to draw with later.
 *
 * The containers stay out of the *topology* regardless. `flattenFlowchart` skips
 * every `isGroup` node when it builds the graph, so the decomposition, the core and
 * the trees see exactly the leaves they saw before, and `parentId` is read only
 * where containment is actually decided.
 */

import type { LayoutData } from '../../types.js';
import { DiagnosticCollector } from '../hola-faithful/diagnostics.js';
import type { HolaDiagnostic } from '../hola-faithful/diagnostics.js';

export interface PreparedGridAttachedLayout {
  /** Ids of the subgraph containers this layout will draw a frame for. */
  groupIds: string[];
  /**
   * Ids of containers kept but not framed, because nothing is inside them to
   * frame. They keep whatever size they were measured with.
   */
  emptyGroupIds: string[];
  diagnostics: HolaDiagnostic[];
}

export function prepareGridAttachedLayout(data: LayoutData): PreparedGridAttachedLayout {
  const diagnostics = new DiagnosticCollector();
  const nodes = data.nodes ?? [];
  const groups = nodes.filter((node) => node.isGroup === true);

  if (groups.length === 0) {
    return { groupIds: [], emptyGroupIds: [], diagnostics: diagnostics.all() };
  }

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const hasLeaf = new Set<string>();
  for (const node of nodes) {
    if (node.isGroup === true) {
      continue;
    }
    // Every ancestor of a leaf has something to frame, not just its parent.
    const seen = new Set<string>();
    let parentId = node.parentId;
    while (parentId && !seen.has(parentId)) {
      seen.add(parentId);
      hasLeaf.add(parentId);
      parentId = byId.get(parentId)?.parentId;
    }
  }

  const emptyGroupIds = groups.filter((group) => !hasLeaf.has(group.id)).map((group) => group.id);

  return {
    groupIds: groups.map((group) => group.id),
    emptyGroupIds,
    diagnostics: diagnostics.all(),
  };
}
