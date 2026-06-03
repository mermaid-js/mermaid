import type { Graph, NodeId } from './helpers.js';
import {
  buildPredecessorSuccessorMaps,
  normalizeGraph,
  topoSortIfAcyclic,
} from './phase0.helpers.js';
// cspell:ignore preorder postorder preds topo

export interface DrivingTreeBlock {
  id: number;
  nodes: NodeId[];
  edges: [NodeId, NodeId][];
}

export interface DrivingTree {
  parent: Map<NodeId, NodeId | null>;
  children: Map<NodeId, NodeId[]>;
  roots: NodeId[];
  componentOf: Map<NodeId, number>;
  blocks: DrivingTreeBlock[];
  nodeBlocks: Map<NodeId, number[]>;
  adjacency: Map<NodeId, NodeId[]>;
  preorder: NodeId[];
  postorder: NodeId[];
  topologicalOrder: NodeId[];
}

export interface DrivingTreeBuildOptions {
  rankHint?: Record<NodeId, number>;
  laneOf?: (id: NodeId) => string | null;
}

// Build the spanning forest and traversal metadata used by tree ordering.
export function buildDrivingTree(graph: Graph, opts?: DrivingTreeBuildOptions): DrivingTree {
  const g = normalizeGraph(graph);
  const laneOf = opts?.laneOf ?? (() => null);
  const rankHint = opts?.rankHint;

  const { preds } = buildPredecessorSuccessorMaps(g);
  for (const arr of preds.values()) {
    arr.sort((a, b) => a.localeCompare(b));
  }

  const topoOrder = topoSortIfAcyclic(g) ?? [...g.nodes].sort((a, b) => a.localeCompare(b));
  const topoIndex = new Map<NodeId, number>();
  for (const [idx, id] of topoOrder.entries()) {
    topoIndex.set(id, idx);
  }

  const parent = new Map<NodeId, NodeId | null>();
  const children = new Map<NodeId, NodeId[]>();
  for (const node of g.nodes) {
    children.set(node, []);
  }

  for (const node of topoOrder) {
    const candidates = (preds.get(node) ?? []).filter((p) => parent.has(p));
    if (candidates.length > 0) {
      const chosen = chooseParent(node, candidates, {
        laneOf,
        rankHint,
        topoIndex,
      });
      parent.set(node, chosen);
      children.get(chosen)!.push(node);
    } else if (!parent.has(node)) {
      parent.set(node, null);
    }
  }

  for (const node of g.nodes) {
    if (!parent.has(node)) {
      parent.set(node, null);
    }
  }

  const rootSet = new Set<NodeId>();
  for (const node of g.nodes) {
    if ((parent.get(node) ?? null) === null) {
      rootSet.add(node);
    }
  }
  const roots = [...rootSet].sort((a, b) => {
    const ta = topoIndex.get(a) ?? 0;
    const tb = topoIndex.get(b) ?? 0;
    if (ta === tb) {
      return a.localeCompare(b);
    }
    return ta - tb;
  });

  const adjacency = buildAdjacency(g);
  const adjacencyList = new Map<NodeId, NodeId[]>();
  for (const [node, set] of adjacency.entries()) {
    adjacencyList.set(
      node,
      [...set].sort((a, b) => a.localeCompare(b))
    );
  }

  const componentOf = assignComponents(adjacencyList);
  const blocks = computeBlocks(adjacencyList);
  const nodeBlocks = new Map<NodeId, number[]>();
  for (const node of g.nodes) {
    nodeBlocks.set(node, []);
  }
  for (const block of blocks) {
    for (const node of block.nodes) {
      const list = nodeBlocks.get(node);
      if (list) {
        list.push(block.id);
      } else {
        nodeBlocks.set(node, [block.id]);
      }
    }
  }

  const preorder: NodeId[] = [];
  const postorder: NodeId[] = [];
  const seen = new Set<NodeId>();

  const walk = (node: NodeId) => {
    if (seen.has(node)) {
      return;
    }
    seen.add(node);
    preorder.push(node);
    for (const child of children.get(node) ?? []) {
      walk(child);
    }
    postorder.push(node);
  };

  for (const root of roots) {
    walk(root);
  }
  for (const node of topoOrder) {
    walk(node);
  }

  return {
    parent,
    children,
    roots,
    componentOf,
    blocks,
    nodeBlocks,
    adjacency: adjacencyList,
    preorder,
    postorder,
    topologicalOrder: topoOrder,
  };
}

interface ParentSelectionContext {
  laneOf: (id: NodeId) => string | null;
  rankHint?: Record<NodeId, number>;
  topoIndex: Map<NodeId, number>;
}

function chooseParent(node: NodeId, candidates: NodeId[], ctx: ParentSelectionContext): NodeId {
  const laneNode = ctx.laneOf(node);
  const sorted = [...candidates].sort((a, b) => {
    const laneA = ctx.laneOf(a);
    const laneB = ctx.laneOf(b);
    const sameLaneA = laneA != null && laneA === laneNode;
    const sameLaneB = laneB != null && laneB === laneNode;
    if (sameLaneA !== sameLaneB) {
      return sameLaneA ? -1 : 1;
    }

    const rankA = ctx.rankHint?.[a];
    const rankB = ctx.rankHint?.[b];
    if (rankA != null && rankB != null && rankA !== rankB) {
      return rankB - rankA;
    }

    const idxA = ctx.topoIndex.get(a) ?? 0;
    const idxB = ctx.topoIndex.get(b) ?? 0;
    if (idxA !== idxB) {
      return idxA - idxB;
    }

    return a.localeCompare(b);
  });
  return sorted[0];
}

function buildAdjacency(g: Graph): Map<NodeId, Set<NodeId>> {
  const adjacency = new Map<NodeId, Set<NodeId>>();
  for (const node of g.nodes) {
    adjacency.set(node, new Set<NodeId>());
  }
  for (const e of g.edges) {
    adjacency.get(e.src)!.add(e.dst);
    adjacency.get(e.dst)!.add(e.src);
  }
  return adjacency;
}

function assignComponents(adjacency: Map<NodeId, NodeId[]>): Map<NodeId, number> {
  const componentOf = new Map<NodeId, number>();
  let componentId = 0;
  for (const node of adjacency.keys()) {
    if (componentOf.has(node)) {
      continue;
    }
    const stack: NodeId[] = [node];
    while (stack.length > 0) {
      const cur = stack.pop()!;
      if (componentOf.has(cur)) {
        continue;
      }
      componentOf.set(cur, componentId);
      for (const next of adjacency.get(cur) ?? []) {
        if (!componentOf.has(next)) {
          stack.push(next);
        }
      }
    }
    componentId++;
  }
  return componentOf;
}

function computeBlocks(adjacency: Map<NodeId, NodeId[]>): DrivingTreeBlock[] {
  const discovery = new Map<NodeId, number>();
  const low = new Map<NodeId, number>();
  const edgeStack: [NodeId, NodeId][] = [];
  const blocks: DrivingTreeBlock[] = [];
  let time = 0;

  const visit = (node: NodeId, parent: NodeId | null) => {
    discovery.set(node, ++time);
    low.set(node, time);

    for (const next of adjacency.get(node) ?? []) {
      if (next === parent) {
        continue;
      }
      if (!discovery.has(next)) {
        edgeStack.push([node, next]);
        visit(next, node);
        low.set(node, Math.min(low.get(node) ?? time, low.get(next) ?? time));
        if ((low.get(next) ?? 0) >= (discovery.get(node) ?? 0)) {
          blocks.push(popBlock(node, next, edgeStack, blocks.length));
        }
      } else if ((discovery.get(next) ?? 0) < (discovery.get(node) ?? 0)) {
        edgeStack.push([node, next]);
        low.set(node, Math.min(low.get(node) ?? time, discovery.get(next) ?? time));
      }
    }
  };

  for (const node of adjacency.keys()) {
    if (!discovery.has(node)) {
      visit(node, null);
    }
  }

  return blocks;
}

function popBlock(u: NodeId, v: NodeId, stack: [NodeId, NodeId][], id: number): DrivingTreeBlock {
  const edges: [NodeId, NodeId][] = [];
  const nodes = new Set<NodeId>();
  while (stack.length > 0) {
    const edge = stack.pop()!;
    edges.push(edge);
    nodes.add(edge[0]);
    nodes.add(edge[1]);
    if ((edge[0] === u && edge[1] === v) || (edge[0] === v && edge[1] === u)) {
      break;
    }
  }
  return { id, edges, nodes: [...nodes] };
}
