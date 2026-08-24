import { describe, expect, it } from 'vitest';
import type { Edge, LayoutData, Node } from '../../types.js';
import { runGridDecomposedLayoutCore } from './layoutCore.js';
import type { GridDecomposedPartResult } from './layoutCore.js';
import { rootCopyOf } from './rootCopy.js';

const NODE_WIDTH = 80;
const NODE_HEIGHT = 40;

function node(id: string, overrides: Partial<Node> = {}): Node {
  return {
    id,
    label: id,
    isGroup: false,
    shape: 'rect',
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    ...overrides,
  } as Node;
}

function edge(start: string, end: string): Edge {
  return { id: `${start}-${end}`, start, end } as Edge;
}

function layoutData(nodes: Node[], edges: Edge[], direction = 'TB'): LayoutData {
  return {
    nodes,
    edges,
    direction,
    config: { flowchart: { nodeSpacing: 50, rankSpacing: 50 } },
  } as unknown as LayoutData;
}

/**
 * A four-cycle core with two trees hanging off it: `t1 → t2` from `A`, and a
 * single pendant `s1` from `C`. Leaf peeling prunes `t2`/`s1`, then `t1`, and
 * leaves `A B C D` as the core.
 */
function coreWithTwoTrees(): LayoutData {
  return layoutData(
    ['A', 'B', 'C', 'D', 't1', 't2', 's1'].map((id) => node(id)),
    [
      edge('A', 'B'),
      edge('B', 'C'),
      edge('C', 'D'),
      edge('D', 'A'),
      edge('A', 't1'),
      edge('t1', 't2'),
      edge('C', 's1'),
    ]
  );
}

function onePart(
  parts: GridDecomposedPartResult[],
  predicate: (p: GridDecomposedPartResult) => boolean
) {
  const found = parts.filter(predicate);
  expect(found).toHaveLength(1);
  return found[0];
}

function expectPartsDisjoint(parts: GridDecomposedPartResult[]): void {
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      const a = parts[i].bounds;
      const b = parts[j].bounds;
      const overlaps =
        a.minX < b.maxX - 1e-6 &&
        b.minX < a.maxX - 1e-6 &&
        a.minY < b.maxY - 1e-6 &&
        b.minY < a.maxY - 1e-6;
      expect(overlaps, `${parts[i].id} and ${parts[j].id} overlap`).toBe(false);
    }
  }
}

function nodeById(data: LayoutData): Map<string, Node> {
  return new Map(data.nodes.map((n) => [n.id, n]));
}

describe('grid-decomposed layout', () => {
  it('splits a core-plus-trees graph into one core part and one part per peeled tree', () => {
    const data = coreWithTwoTrees();

    const result = runGridDecomposedLayoutCore(data);

    expect(result.componentCount).toBe(3);
    expect(result.parts.map((part) => part.kind).sort()).toEqual(['core', 'tree', 'tree']);

    const core = onePart(result.parts, (part) => part.kind === 'core');
    expect([...core.nodeIds].sort()).toEqual(['A', 'B', 'C', 'D']);

    const treeOfA = onePart(result.parts, (part) => part.rootCopyOf === 'A');
    expect(treeOfA.nodeIds.filter((id) => !id.startsWith('~')).sort()).toEqual(['t1', 't2']);

    const treeOfC = onePart(result.parts, (part) => part.rootCopyOf === 'C');
    expect(treeOfC.nodeIds.filter((id) => !id.startsWith('~'))).toEqual(['s1']);
  });

  it('draws a duplicated root per peeled tree and keeps every edge', () => {
    const data = coreWithTwoTrees();

    const result = runGridDecomposedLayoutCore(data);

    // Nothing is dropped: the two cut edges are rewired onto the duplicates.
    expect(result.droppedEdgeIds).toEqual([]);
    expect(data.edges.map((e) => e.id).sort()).toEqual([
      'A-B',
      'A-t1',
      'B-C',
      'C-D',
      'C-s1',
      'D-A',
      't1-t2',
    ]);
    for (const kept of data.edges) {
      expect(kept.points?.length ?? 0, `${kept.id} has no route`).toBeGreaterThan(0);
    }

    const copies = data.nodes.filter((n) => rootCopyOf(n) !== undefined);
    expect(copies.map((n) => rootCopyOf(n)).sort()).toEqual(['A', 'C']);
    // Seven real nodes plus one duplicate per tree, each drawn exactly once.
    expect(data.nodes).toHaveLength(9);

    // The rewired edges now leave the duplicates, not the core nodes.
    const copyIds = new Set(copies.map((n) => n.id));
    expect(data.edges.find((e) => e.id === 'A-t1')!.start).toSatisfy((id: string) =>
      copyIds.has(id)
    );
    expect(data.edges.find((e) => e.id === 'C-s1')!.start).toSatisfy((id: string) =>
      copyIds.has(id)
    );
  });

  it('positions every node, duplicates included', () => {
    const data = coreWithTwoTrees();

    runGridDecomposedLayoutCore(data);

    for (const n of data.nodes) {
      expect(Number.isFinite(n.x), `${n.id} has no x`).toBe(true);
      expect(Number.isFinite(n.y), `${n.id} has no y`).toBe(true);
    }
  });

  it('draws a cyclic core in two dimensions rather than as a line', () => {
    const data = coreWithTwoTrees();

    const result = runGridDecomposedLayoutCore(data);
    const core = onePart(result.parts, (part) => part.kind === 'core');
    const nodes = nodeById(data);

    const distinctX = new Set(core.nodeIds.map((id) => Math.round(nodes.get(id)!.x!))).size;
    const distinctY = new Set(core.nodeIds.map((id) => Math.round(nodes.get(id)!.y!))).size;
    expect(distinctX, 'the cycle should not collapse into one column').toBeGreaterThan(1);
    expect(distinctY, 'the cycle should not collapse into one row').toBeGreaterThan(1);
  });

  it('packs the parts as separated islands, each node inside its own part', () => {
    const data = coreWithTwoTrees();

    const result = runGridDecomposedLayoutCore(data);

    expectPartsDisjoint(result.parts);

    const nodes = nodeById(data);
    for (const part of result.parts) {
      for (const id of part.nodeIds) {
        const n = nodes.get(id)!;
        expect(n.x! - n.width! / 2).toBeGreaterThanOrEqual(part.bounds.minX - 1e-6);
        expect(n.x! + n.width! / 2).toBeLessThanOrEqual(part.bounds.maxX + 1e-6);
        expect(n.y! - n.height! / 2).toBeGreaterThanOrEqual(part.bounds.minY - 1e-6);
        expect(n.y! + n.height! / 2).toBeLessThanOrEqual(part.bounds.maxY + 1e-6);
      }
    }
  });

  it('leaves at least the configured gap between consecutive parts', () => {
    const data = coreWithTwoTrees();

    const result = runGridDecomposedLayoutCore(data, { partGap: 200 });

    const ordered = [...result.parts].sort((a, b) => a.bounds.minX - b.bounds.minX);
    for (let i = 1; i < ordered.length; i++) {
      expect(ordered[i].bounds.minX - ordered[i - 1].bounds.maxX).toBeGreaterThanOrEqual(
        200 - 1e-6
      );
    }
  });

  it('treats an acyclic component as a single tree part with nothing peeled', () => {
    const data = layoutData(
      ['r', 'a', 'b', 'c'].map((id) => node(id)),
      [edge('r', 'a'), edge('r', 'b'), edge('b', 'c')]
    );

    const result = runGridDecomposedLayoutCore(data);

    expect(result.parts.map((part) => part.kind)).toEqual(['pure-tree']);
    expect(result.duplicatedRoots).toEqual([]);
    expect(data.nodes).toHaveLength(4);
    expect(data.edges).toHaveLength(3);
  });

  it('decomposes each connected component independently', () => {
    const data = layoutData(
      ['A', 'B', 'C', 'p', 'X', 'Y'].map((id) => node(id)),
      [edge('A', 'B'), edge('B', 'C'), edge('C', 'A'), edge('A', 'p'), edge('X', 'Y')]
    );

    const result = runGridDecomposedLayoutCore(data);

    expect(result.parts.map((part) => part.kind).sort()).toEqual(['core', 'pure-tree', 'tree']);
    expect(result.duplicatedRoots.map((root) => root.coreNodeId)).toEqual(['A']);
    expectPartsDisjoint(result.parts);
  });

  it('keeps a self-loop with the part that owns its node', () => {
    const data = layoutData(
      ['A', 'B', 'C', 'p'].map((id) => node(id)),
      [
        edge('A', 'B'),
        edge('B', 'C'),
        edge('C', 'A'),
        edge('A', 'p'),
        { id: 'p-p', start: 'p', end: 'p' } as Edge,
      ]
    );

    const result = runGridDecomposedLayoutCore(data);

    const tree = onePart(result.parts, (part) => part.kind === 'tree');
    expect(tree.edgeIds).toContain('p-p');
    expect(data.edges.find((e) => e.id === 'p-p')?.points?.length ?? 0).toBeGreaterThan(0);
  });

  it('returns an empty result for an empty diagram', () => {
    const data = layoutData([], []);

    const result = runGridDecomposedLayoutCore(data);

    expect(result.parts).toEqual([]);
    expect(result.componentCount).toBe(0);
  });
});
