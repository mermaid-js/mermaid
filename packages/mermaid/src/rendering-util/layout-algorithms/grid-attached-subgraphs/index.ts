/**
 * Grid-attached layout with synthetic subgraph connectivity.
 *
 * `grid-attached` draws subgraph frames after it has laid out the leaf topology.
 * A subgraph whose members have no ordinary path between them can therefore be
 * split into unrelated components before a frame is fitted. This backend supplies
 * the missing topology without changing what Mermaid renders: each direct
 * subgraph membership gets the minimum number of invisible, layout-only edges
 * needed to connect its members.
 *
 * The approach relies on a leaf having at most one direct subgraph parent. Under
 * that condition no synthetic chain ambiguously claims a node for two groups.
 */

import type { Edge, LayoutData, Node } from '../../types.js';
import { createCommonLayoutRenderer } from '../common/index.js';
import { prepareGridAttachedLayout } from '../grid-attached/prepareLayout.js';
import { runGridAttachedLayoutCore, type GridAttachedResult } from '../grid-attached/layoutCore.js';
import { resolveGridAttachedOptions } from '../grid-attached/options.js';

const SYNTHETIC_EDGE_PREFIX = '__grid-attached-subgraph__:';
const ROUNDED_CORNER_RADIUS = 12;

type SyntheticSubgraphEdge = Edge & {
  isGridAttachedSubgraphEdge?: true;
};

export interface PreparedGridAttachedSubgraphsLayout {
  syntheticEdgeIds: string[];
}

/**
 * Add one spanning chain for every direct subgraph membership.
 *
 * A chain is sufficient to keep the group connected and, unlike a clique, does
 * not manufacture cycles that would force all of a subgraph into the core.
 */
export function prepareGridAttachedSubgraphsLayout(
  data: LayoutData
): PreparedGridAttachedSubgraphsLayout {
  prepareGridAttachedLayout(data);

  const groupIds = new Set(
    (data.nodes ?? []).filter((node) => node.isGroup === true).map((node) => node.id)
  );
  const membersByGroup = new Map<string, Node[]>();

  for (const node of data.nodes ?? []) {
    if (node.isGroup === true || !node.parentId || !groupIds.has(node.parentId)) {
      continue;
    }
    const members = membersByGroup.get(node.parentId);
    if (members) {
      members.push(node);
    } else {
      membersByGroup.set(node.parentId, [node]);
    }
  }

  const existingIds = new Set((data.edges ?? []).map((edge) => edge.id));
  const existingPairs = new Set(
    (data.edges ?? [])
      .filter((edge) => edge.start && edge.end)
      .map((edge) => pairKey(edge.start!, edge.end!))
  );
  const syntheticEdgeIds: string[] = [];

  for (const [groupId, members] of membersByGroup) {
    for (let index = 1; index < members.length; index++) {
      const start = members[index - 1].id;
      const end = members[index].id;
      if (existingPairs.has(pairKey(start, end))) {
        continue;
      }

      const id = nextSyntheticId(groupId, index, existingIds);
      const edge: SyntheticSubgraphEdge = {
        id,
        start,
        end,
        isLayoutOnly: true,
        isGridAttachedSubgraphEdge: true,
        thickness: 'invisible',
      };
      data.edges.push(edge);
      existingIds.add(id);
      existingPairs.add(pairKey(start, end));
      syntheticEdgeIds.push(id);
    }
  }

  return { syntheticEdgeIds };
}

/**
 * Run the existing grid-attached pipeline with synthetic edges present, then
 * remove only this backend's edges before the shared painter sees the result.
 */
export function runGridAttachedSubgraphsLayoutCore(data: LayoutData): GridAttachedResult {
  const syntheticEdgeIds = new Set(
    (data.edges ?? [])
      .filter((edge) => (edge as SyntheticSubgraphEdge).isGridAttachedSubgraphEdge === true)
      .map((edge) => edge.id)
  );
  for (const edgeId of prepareGridAttachedSubgraphsLayout(data).syntheticEdgeIds) {
    syntheticEdgeIds.add(edgeId);
  }
  try {
    const options = resolveGridAttachedOptions(data, { modelCoreGroups: true });
    // A frame title occupies the final part of every rank gap that enters a
    // subgraph. A label belongs in that same gap, so the normal tree spacing can
    // shrink to a few pixels once the frame is fitted. Reserve the title band
    // and two label-clearance bands: one lets a label clear the frame heading,
    // the other leaves room for neighbouring labelled connectors to choose a
    // separate run. This is scoped to the subgraph backend; ordinary
    // grid-attached diagrams keep their compact tree ranks unchanged.
    const largestTitleBand = Math.max(
      0,
      ...(data.nodes ?? [])
        .filter((node) => node.isGroup === true)
        .map((node) => (node.labelBBox?.height ?? 0) + options.groupPadding)
    );
    const largestEdgeLabel = Math.max(
      0,
      ...(data.edges ?? []).filter((edge) => Boolean(edge.label)).map((edge) => edge.height ?? 0)
    );
    const titleLabelRunway =
      largestEdgeLabel === 0
        ? 0
        : largestTitleBand + 2 * (largestEdgeLabel + options.labelClearance);
    const result = runGridAttachedLayoutCore(data, {
      modelCoreGroups: true,
      treeRankGap: options.treeRankGap + titleLabelRunway,
      roundShortTerminalTurns: true,
    });
    result.droppedEdgeIds = result.droppedEdgeIds.filter((edgeId) => !syntheticEdgeIds.has(edgeId));
    // Keep every route orthogonal, but replace each sharp 90° turn with a larger
    // in-corridor arc at paint time. `rounded` consumes only the two segments
    // leading into a corner, so it does not change which obstacles the route avoids.
    for (const edge of data.edges ?? []) {
      if (!syntheticEdgeIds.has(edge.id)) {
        edge.curve = 'rounded';
        edge.roundedCornerRadius = ROUNDED_CORNER_RADIUS;
      }
    }
    return result;
  } finally {
    data.edges = (data.edges ?? []).filter(
      (edge) => (edge as SyntheticSubgraphEdge).isGridAttachedSubgraphEdge !== true
    );
  }
}

export const render = createCommonLayoutRenderer({
  prepareLayout: prepareGridAttachedSubgraphsLayout,
  runLayoutCore: runGridAttachedSubgraphsLayoutCore,
  // Tree connectors already carry the exact boundary ports selected by the
  // grid-attached router. Preserve them when this variant paints rounded bends:
  // generic endpoint clipping would replace the root fan's distinct ports with
  // one centre-directed diagonal per edge.
  paintOptions: {
    skipIntersect: (edge: Edge) => edge.hasIntersectionPoints === true,
  },
});

function pairKey(first: string, second: string): string {
  return first < second ? `${first}\u0000${second}` : `${second}\u0000${first}`;
}

function nextSyntheticId(groupId: string, index: number, existingIds: ReadonlySet<string>): string {
  const base = `${SYNTHETIC_EDGE_PREFIX}${groupId}:${index}`;
  let id = base;
  let collision = 1;
  while (existingIds.has(id)) {
    id = `${base}:${collision++}`;
  }
  return id;
}
