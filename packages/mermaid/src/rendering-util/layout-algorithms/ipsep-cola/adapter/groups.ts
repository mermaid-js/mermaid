import type { LayoutData, Node } from '../../../types.js';

/**
 * The subgraph hierarchy, resolved into solver variables.
 *
 * A group is not a point, so it cannot be one variable the way a leaf node is.
 * It gets **two** per axis instead — the low edge and the high edge of its
 * frame — and every containment and separation requirement is then expressible
 * in the solver's only vocabulary, `position(left) + gap <= position(right)`
 * (§1). Because the x pass and the y pass are solved separately, one pair of
 * variable indices serves both: in the x pass they hold left and right, in the
 * y pass top and bottom.
 */
export interface GroupEntry {
  id: string;
  node: Node;
  /** Variable holding the low edge: left in the x pass, top in the y pass. */
  minIndex: number;
  /** Variable holding the high edge: right in the x pass, bottom in the y pass. */
  maxIndex: number;
  /** Direct leaf children, as leaf variable indices. */
  childLeaves: number[];
  /** Direct group children, as indices into the group array. */
  childGroups: number[];
  /** Enclosing group index, or `-1` when the group sits at the top level. */
  parent: number;
  /** Extra clearance reserved at the top of the frame for the cluster title. */
  titleHeight: number;
}

/** A leaf node or a group, for the purposes of sibling separation. */
export type Entity = { kind: 'leaf'; index: number } | { kind: 'group'; index: number };

export interface GroupModel {
  groups: GroupEntry[];
  /** Group array index by node id. */
  indexById: Map<string, number>;
  /** Children of the drawing itself — everything with no enclosing group. */
  topLevel: Entity[];
  /** Total solver variables: leaves plus two boundaries per group. */
  variableCount: number;
  /** Enclosing group of a leaf variable, or `-1` at the top level. */
  parentOfLeaf: (leaf: number) => number;
}

export interface BuildGroupModelOptions {
  /** When false the hierarchy is not modelled and every leaf is top level. */
  enabled: boolean;
  titleHeightOf: (group: Node) => number;
}

/**
 * Build the hierarchy from `parentId`, allocating boundary variables after the
 * leaf variables so leaf indices keep the meaning they already have.
 *
 * Only groups that actually enclose something get variables. An empty subgraph
 * has nothing to contain and nothing to separate, so it is left out of the
 * constraint system entirely and keeps whatever size it was measured with.
 */
export function buildGroupModel(
  data4Layout: LayoutData,
  leafIndexById: ReadonlyMap<string, number>,
  options: BuildGroupModelOptions
): GroupModel {
  const nodes = data4Layout.nodes ?? [];
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  if (!options.enabled) {
    return {
      groups: [],
      indexById: new Map(),
      topLevel: [...leafIndexById.values()].map((index): Entity => ({ kind: 'leaf', index })),
      variableCount: leafIndexById.size,
      parentOfLeaf: () => -1,
    };
  }

  const groupNodes = nodes.filter(
    (node) => node.isGroup && hasLeafDescendant(node, nodes, nodeById)
  );

  const groups: GroupEntry[] = [];
  const indexById = new Map<string, number>();
  let nextVariable = leafIndexById.size;

  for (const node of groupNodes) {
    indexById.set(node.id, groups.length);
    groups.push({
      id: node.id,
      node,
      minIndex: nextVariable++,
      maxIndex: nextVariable++,
      childLeaves: [],
      childGroups: [],
      parent: -1,
      titleHeight: options.titleHeightOf(node),
    });
  }

  const topLevel: Entity[] = [];

  for (const node of nodes) {
    // The nearest ancestor that made it into the model. A node parented to an
    // empty-but-skipped group still belongs somewhere, so walk up past any
    // group that was left out.
    const parentIndex = nearestModelledAncestor(node, nodeById, indexById);

    if (node.isGroup) {
      const own = indexById.get(node.id);
      if (own === undefined) {
        continue;
      }
      groups[own].parent = parentIndex;
      if (parentIndex === -1) {
        topLevel.push({ kind: 'group', index: own });
      } else {
        groups[parentIndex].childGroups.push(own);
      }
      continue;
    }

    const leaf = leafIndexById.get(node.id);
    if (leaf === undefined) {
      continue;
    }
    if (parentIndex === -1) {
      topLevel.push({ kind: 'leaf', index: leaf });
    } else {
      groups[parentIndex].childLeaves.push(leaf);
    }
  }

  const leafParent = new Map<number, number>();
  for (const [index, group] of groups.entries()) {
    for (const leaf of group.childLeaves) {
      leafParent.set(leaf, index);
    }
  }

  return {
    groups,
    indexById,
    topLevel,
    variableCount: nextVariable,
    parentOfLeaf: (leaf) => leafParent.get(leaf) ?? -1,
  };
}

/** Children of one group, in the form sibling separation consumes. */
export function childrenOf(group: GroupEntry): Entity[] {
  return [
    ...group.childLeaves.map((index): Entity => ({ kind: 'leaf', index })),
    ...group.childGroups.map((index): Entity => ({ kind: 'group', index })),
  ];
}

/** Every set of siblings in the drawing, the top level included. */
export function siblingSets(model: GroupModel): Entity[][] {
  return [model.topLevel, ...model.groups.map((group) => childrenOf(group))];
}

function nearestModelledAncestor(
  node: Node,
  nodeById: ReadonlyMap<string, Node>,
  indexById: ReadonlyMap<string, number>
): number {
  const visited = new Set<string>();
  let parentId = node.parentId;

  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const index = indexById.get(parentId);
    if (index !== undefined) {
      return index;
    }
    parentId = nodeById.get(parentId)?.parentId;
  }

  return -1;
}

function hasLeafDescendant(
  group: Node,
  nodes: readonly Node[],
  nodeById: ReadonlyMap<string, Node>
): boolean {
  return nodes.some((node) => !node.isGroup && isDescendantOf(node, group.id, nodeById));
}

export function isDescendantOf(
  node: Node,
  groupId: string,
  nodeById: ReadonlyMap<string, Node>
): boolean {
  const visited = new Set<string>();
  let parentId = node.parentId;

  while (parentId && !visited.has(parentId)) {
    if (parentId === groupId) {
      return true;
    }
    visited.add(parentId);
    parentId = nodeById.get(parentId)?.parentId;
  }

  return false;
}
