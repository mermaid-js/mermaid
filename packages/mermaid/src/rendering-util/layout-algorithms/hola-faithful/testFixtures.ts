/**
 * Test fixtures (guide §22). Each one isolates a single algorithmic
 * requirement, so a failure names the stage that broke.
 *
 * Kept out of a `.spec.ts` file so several specs can share it.
 */

import type { Edge, LayoutData, Node } from '../../types.js';

export interface FixtureSpec {
  nodes: string[];
  /** `[source, target]` or `[source, target, label]`. */
  edges: [string, string] | [string, string, string];
}

const NODE_WIDTH = 80;
const NODE_HEIGHT = 40;

export function makeNode(id: string, options: Partial<Node> = {}): Node {
  return {
    id,
    label: id,
    isGroup: false,
    shape: 'rect',
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    padding: 8,
    cssStyles: [],
    cssCompiledStyles: [],
    look: 'classic',
    ...options,
  } as Node;
}

export function makeGroup(id: string, options: Partial<Node> = {}): Node {
  return {
    id,
    label: id,
    isGroup: true,
    shape: 'rect',
    cssStyles: [],
    cssCompiledStyles: [],
    look: 'classic',
    ...options,
  } as Node;
}

export function makeEdge(
  id: string,
  start: string,
  end: string,
  options: Partial<Edge> = {}
): Edge {
  return {
    id,
    start,
    end,
    type: 'arrow_point',
    arrowTypeStart: 'none',
    arrowTypeEnd: 'arrow_point',
    thickness: 'normal',
    pattern: 'solid',
    look: 'classic',
    style: [],
    labelStyle: [],
    cssCompiledStyles: [],
    ...options,
  };
}

/** Build LayoutData from a compact `A-->B` edge list. */
export function buildLayoutData(
  edgeSpecs: [string, string][],
  extraNodes: string[] = [],
  options: { groups?: { id: string; children: string[] }[]; labels?: Record<string, string> } = {}
): LayoutData {
  const ids: string[] = [];
  const seen = new Set<string>();
  const addId = (id: string): void => {
    if (!seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  };
  for (const [a, b] of edgeSpecs) {
    addId(a);
    addId(b);
  }
  for (const id of extraNodes) {
    addId(id);
  }

  const parentOf = new Map<string, string>();
  for (const group of options.groups ?? []) {
    for (const child of group.children) {
      parentOf.set(child, group.id);
    }
  }

  const nodes: Node[] = ids.map((id) => makeNode(id, { parentId: parentOf.get(id) }));
  for (const group of options.groups ?? []) {
    nodes.push(makeGroup(group.id));
  }

  const edges: Edge[] = edgeSpecs.map(([a, b], index) => {
    const id = `e${index}:${a}-${b}`;
    const label = options.labels?.[id];
    return makeEdge(id, a, b, label ? { label, width: 40, height: 18 } : {});
  });

  return { nodes, edges, config: {} } as LayoutData;
}

// ---------------------------------------------------------------------------
// Named topology fixtures
// ---------------------------------------------------------------------------

export const FIXTURES = {
  singleNode: (): LayoutData => buildLayoutData([], ['A']),
  singleEdge: (): LayoutData => buildLayoutData([['A', 'B']]),
  threeNodePath: (): LayoutData =>
    buildLayoutData([
      ['A', 'B'],
      ['B', 'C'],
    ]),
  balancedBinaryTree: (): LayoutData =>
    buildLayoutData([
      ['R', 'L'],
      ['R', 'Q'],
      ['L', 'L1'],
      ['L', 'L2'],
      ['Q', 'Q1'],
      ['Q', 'Q2'],
    ]),
  triangleCycle: (): LayoutData =>
    buildLayoutData([
      ['A', 'B'],
      ['B', 'C'],
      ['C', 'A'],
    ]),
  squareCycle: (): LayoutData =>
    buildLayoutData([
      ['A', 'B'],
      ['B', 'C'],
      ['C', 'D'],
      ['D', 'A'],
    ]),
  lollipop: (): LayoutData =>
    buildLayoutData([
      ['A', 'B'],
      ['B', 'C'],
      ['C', 'A'],
      ['C', 'D'],
      ['D', 'E'],
    ]),
  twoCyclesBridge: (): LayoutData =>
    buildLayoutData([
      ['A', 'B'],
      ['B', 'C'],
      ['C', 'A'],
      ['C', 'D'],
      ['D', 'E'],
      ['E', 'F'],
      ['F', 'D'],
    ]),
  hubDegreeFive: (): LayoutData =>
    buildLayoutData([
      ['H', 'N1'],
      ['H', 'N2'],
      ['H', 'N3'],
      ['H', 'N4'],
      ['H', 'N5'],
      ['N1', 'N2'],
      ['N3', 'N4'],
    ]),
  openDegreeTwoChain: (): LayoutData =>
    buildLayoutData([
      ['A', 'B'],
      ['B', 'C'],
      ['C', 'D'],
      ['D', 'A'],
      ['A', 'X'],
      ['X', 'Y'],
      ['Y', 'Z'],
      ['Z', 'C'],
    ]),
  closedDegreeTwoCycle: (): LayoutData =>
    buildLayoutData([
      ['A', 'B'],
      ['B', 'C'],
      ['C', 'D'],
      ['D', 'A'],
    ]),
  parallelEdges: (): LayoutData => {
    const data = buildLayoutData([
      ['A', 'B'],
      ['A', 'B'],
    ]);
    return data;
  },
  selfLoop: (): LayoutData =>
    buildLayoutData([
      ['A', 'A'],
      ['A', 'B'],
    ]),
  trianglePlusPath: (): LayoutData =>
    buildLayoutData([
      ['A', 'B'],
      ['B', 'C'],
      ['C', 'A'],
      ['P', 'Q'],
    ]),
  threeIsolatedNodes: (): LayoutData => buildLayoutData([], ['A', 'B', 'C']),
  largeComponentPlusSingleton: (): LayoutData =>
    buildLayoutData(
      [
        ['A', 'B'],
        ['B', 'C'],
        ['C', 'A'],
        ['C', 'D'],
      ],
      ['Z']
    ),
  subgraphWithExit: (): LayoutData =>
    buildLayoutData(
      [
        ['A', 'B'],
        ['B', 'C'],
      ],
      [],
      { groups: [{ id: 'S', children: ['A', 'B'] }] }
    ),
  edgeToSubgraph: (): LayoutData =>
    buildLayoutData(
      [
        ['A', 'B'],
        ['C', 'S'],
      ],
      [],
      { groups: [{ id: 'S', children: ['A', 'B'] }] }
    ),
};
