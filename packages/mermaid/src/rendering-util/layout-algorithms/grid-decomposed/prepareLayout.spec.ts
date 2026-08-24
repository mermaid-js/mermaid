import { describe, expect, it } from 'vitest';
import type { Edge, LayoutData, Node } from '../../types.js';
import { prepareGridDecomposedLayout } from './prepareLayout.js';
import { rootCopyOf } from './rootCopy.js';

function node(id: string, overrides: Partial<Node> = {}): Node {
  return {
    id,
    label: id,
    isGroup: false,
    shape: 'rect',
    domId: `flowchart-${id}`,
    ...overrides,
  } as Node;
}

function labelledEdge(start: string, end: string, label?: string): Edge {
  return { id: `${start}-${end}`, start, end, label } as Edge;
}

function layoutData(nodes: Node[], edges: Edge[]): LayoutData {
  return { nodes, edges, direction: 'TB', config: {} } as unknown as LayoutData;
}

/** A triangle core with one pendant node hanging off `A`. */
function coreWithOneTree(): LayoutData {
  return layoutData(
    ['A', 'B', 'C', 'p'].map((id) => node(id)),
    [
      labelledEdge('A', 'B'),
      labelledEdge('B', 'C'),
      labelledEdge('C', 'A'),
      labelledEdge('A', 'p', 'cut here'),
    ]
  );
}

describe('grid-decomposed prepareLayout', () => {
  /**
   * Sizes are not available at this stage, which is the point: leaf peeling reads
   * adjacency only, so the decomposition can be applied before anything is
   * measured — and it has to be, because the duplicated root must be measured and
   * painted like any other node.
   */
  it('re-roots a peeled tree on a duplicate of the core node it hung from', () => {
    const data = coreWithOneTree();

    const prepared = prepareGridDecomposedLayout(data);

    expect(prepared.duplicatedRoots).toHaveLength(1);
    const [duplicate] = prepared.duplicatedRoots;
    expect(duplicate.coreNodeId).toBe('A');
    expect(duplicate.rewiredEdgeIds).toEqual(['A-p']);

    const copy = data.nodes.find((n) => n.id === duplicate.copyId)!;
    expect(rootCopyOf(copy)).toBe('A');
    expect(copy.label).toBe('A');
    expect(copy.domId).not.toBe('flowchart-A');
    // A dashed outline marks it as a copy without touching shape, label or size.
    expect(copy.cssStyles?.join(';')).toMatch(/stroke-dasharray/);
  });

  it('rewires the cut edge instead of deleting it, label and all', () => {
    const data = coreWithOneTree();

    const prepared = prepareGridDecomposedLayout(data);
    const [duplicate] = prepared.duplicatedRoots;

    expect(data.edges.map((e) => e.id)).toEqual(['A-B', 'B-C', 'C-A', 'A-p']);
    const cut = data.edges.find((e) => e.id === 'A-p')!;
    expect(cut.start).toBe(duplicate.copyId);
    expect(cut.end).toBe('p');
    expect(cut.label, 'the label travels with the edge').toBe('cut here');

    // The core keeps its own node and its own edges untouched.
    expect(data.edges.filter((e) => e.start === 'A' || e.end === 'A').map((e) => e.id)).toEqual([
      'A-B',
      'C-A',
    ]);
  });

  it('rewires an edge that names the core node as its target', () => {
    const data = layoutData(
      ['A', 'B', 'C', 'p'].map((id) => node(id)),
      [
        labelledEdge('A', 'B'),
        labelledEdge('B', 'C'),
        labelledEdge('C', 'A'),
        labelledEdge('p', 'A'),
      ]
    );

    const prepared = prepareGridDecomposedLayout(data);
    const [duplicate] = prepared.duplicatedRoots;

    const cut = data.edges.find((e) => e.id === 'p-A')!;
    expect(cut.start).toBe('p');
    expect(cut.end).toBe(duplicate.copyId);
  });

  it('is idempotent: a re-rooted tree is not peeled again', () => {
    const data = coreWithOneTree();

    prepareGridDecomposedLayout(data);
    const nodesAfterFirst = data.nodes.map((n) => n.id);
    const second = prepareGridDecomposedLayout(data);

    expect(second.duplicatedRoots).toEqual([]);
    expect(data.nodes.map((n) => n.id)).toEqual(nodesAfterFirst);
  });

  it('flattens subgraph containers, as hola-faithful does', () => {
    const data = layoutData(
      [node('g', { isGroup: true }), node('a', { parentId: 'g' }), node('b', { parentId: 'g' })],
      [labelledEdge('a', 'b'), labelledEdge('a', 'g', 'names a container')]
    );

    const prepared = prepareGridDecomposedLayout(data);

    expect(prepared.removedGroupIds).toEqual(['g']);
    expect(data.nodes.map((n) => n.id)).toEqual(['a', 'b']);
    expect(data.edges.map((e) => e.id)).toEqual(['a-b']);
  });

  it('leaves an acyclic diagram alone: there is no core to peel from', () => {
    const data = layoutData(
      ['r', 'a', 'b'].map((id) => node(id)),
      [labelledEdge('r', 'a'), labelledEdge('a', 'b')]
    );

    const prepared = prepareGridDecomposedLayout(data);

    expect(prepared.duplicatedRoots).toEqual([]);
    expect(data.nodes.map((n) => n.id)).toEqual(['r', 'a', 'b']);
    expect(data.edges.map((e) => [e.start, e.end])).toEqual([
      ['r', 'a'],
      ['a', 'b'],
    ]);
  });
});
