import type { Box, Dir, LayoutEdge, LayoutGraph, LayoutGroup, LayoutNode } from './types.js';

export interface LayoutFixture {
  name: string;
  graph: LayoutGraph;
}

// v12 flowchart defaults: nodeSpacing 50, rankSpacing 50, diagramPadding 8, cluster padding 8.
const SPACING = { node: 50, rank: 50, edge: 20 };
const PAD: Box = { top: 8, right: 8, bottom: 8, left: 8 };
const TITLE = { width: 80, height: 24 };

function node(id: string, label = id, parent?: string): LayoutNode {
  return {
    id,
    width: Math.max(60, 9 * label.length + 30),
    height: 54,
    ...(parent ? { parent } : {}),
  };
}

function edge(source: string, target: string, label?: string, minLen = 1): LayoutEdge {
  return {
    id: `${source}->${target}${label ? `:${label}` : ''}#${minLen}`,
    source,
    target,
    minLen,
    ...(label ? { label: { width: 9 * label.length + 12, height: 28 } } : {}),
  };
}

function group(id: string, parent?: string, direction?: Dir): LayoutGroup {
  return {
    id,
    padding: PAD,
    title: TITLE,
    ...(parent ? { parent } : {}),
    ...(direction ? { direction } : {}),
  };
}

function graph(
  direction: Dir,
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  groups: LayoutGroup[] = []
): LayoutGraph {
  return { direction, nodes, edges, groups, spacing: SPACING, diagramPadding: 8, headRoom: 8 };
}

const ids = (s: string): LayoutNode[] => s.split(' ').map((id) => node(id));

function tree(n: number): LayoutGraph {
  const nodes = Array.from({ length: n }, (_, i) => node(`n${i}`, `Node ${i}`));
  const edges = Array.from({ length: n - 1 }, (_, k) => edge(`n${Math.floor(k / 3)}`, `n${k + 1}`));
  return graph('TB', nodes, edges);
}

export function handBuiltFixtures(): LayoutFixture[] {
  return [
    { name: 'single node', graph: graph('TB', ids('A'), []) },
    { name: 'empty graph', graph: graph('TB', [], []) },
    { name: 'chain TB', graph: graph('TB', ids('A B C'), [edge('A', 'B'), edge('B', 'C')]) },
    { name: 'chain BT', graph: graph('BT', ids('A B C'), [edge('A', 'B'), edge('B', 'C')]) },
    { name: 'chain RL', graph: graph('RL', ids('A B C'), [edge('A', 'B'), edge('B', 'C')]) },
    {
      name: 'docs decision flow',
      graph: graph(
        'TB',
        [
          node('Start'),
          node('Q', 'Is it working?'),
          node('Ship', 'Ship it'),
          node('Debug'),
          node('Fix'),
          node('Celebrate'),
          node('Done'),
        ],
        [
          edge('Start', 'Q'),
          edge('Q', 'Ship', 'Yes'),
          edge('Q', 'Debug', 'No'),
          edge('Debug', 'Fix'),
          edge('Fix', 'Q'),
          edge('Ship', 'Celebrate'),
          edge('Celebrate', 'Done'),
        ]
      ),
    },
    {
      name: 'cycle',
      graph: graph('TB', ids('A B C D'), [
        edge('A', 'B'),
        edge('B', 'C'),
        edge('C', 'A'),
        edge('C', 'D'),
      ]),
    },
    {
      name: 'labelled LR with minLen',
      graph: graph('LR', ids('A B C D'), [
        edge('A', 'B', 'go'),
        edge('B', 'C', 'a longer label'),
        edge('A', 'D', undefined, 3),
        edge('C', 'D'),
      ]),
    },
    {
      name: 'parallel edges',
      graph: graph('TB', ids('A B'), [
        edge('A', 'B'),
        edge('A', 'B', 'again'),
        edge('B', 'A', 'back'),
      ]),
    },
    {
      name: 'self loops',
      graph: graph('TB', ids('A B'), [edge('A', 'A'), edge('A', 'B'), edge('B', 'B', 'retry')]),
    },
    {
      name: 'self loop LR',
      graph: graph('LR', ids('A B'), [edge('A', 'B'), edge('B', 'B', 'retry')]),
    },
    {
      name: 'K3,3',
      graph: graph(
        'TB',
        ids('a b c x y z'),
        ['a', 'b', 'c'].flatMap((s) => ['x', 'y', 'z'].map((t) => edge(s, t)))
      ),
    },
    {
      name: 'disconnected parts',
      graph: graph('TB', ids('A B C D E'), [edge('A', 'B'), edge('C', 'D')]),
    },
    {
      name: 'subgraphs',
      graph: graph(
        'TB',
        [
          node('c1'),
          node('a1', 'a1', 'one'),
          node('a2', 'a2', 'one'),
          node('b1', 'b1', 'two'),
          node('b2', 'b2', 'two'),
        ],
        [
          edge('c1', 'a2'),
          edge('a1', 'a2'),
          edge('b1', 'b2'),
          edge('a2', 'b1'),
          edge('one', 'two'),
        ],
        [group('one'), group('two')]
      ),
    },
    {
      name: 'nested subgraphs with own direction',
      graph: graph(
        'TB',
        [
          node('top'),
          node('i1', 'i1', 'inner'),
          node('i2', 'i2', 'inner'),
          node('i3', 'i3', 'inner'),
          node('o1', 'o1', 'outer'),
          node('bottom'),
        ],
        [
          edge('i1', 'i2'),
          edge('i2', 'i3'),
          edge('top', 'o1'),
          edge('o1', 'bottom'),
          edge('outer', 'bottom'),
        ],
        [group('outer'), group('inner', 'outer', 'LR')]
      ),
    },
    {
      name: 'edge crossing into a directed group',
      graph: graph(
        'LR',
        [node('A'), node('B', 'B', 'g'), node('C', 'C', 'g'), node('D')],
        [edge('A', 'B'), edge('B', 'C'), edge('C', 'D'), edge('A', 'D', 'skip')],
        [group('g', undefined, 'TB')]
      ),
    },
    {
      name: 'empty group',
      graph: graph('TB', ids('A B'), [edge('A', 'B')], [group('nothing')]),
    },
    {
      name: 'stepped routing',
      graph: {
        ...graph('TB', ids('A B C D'), [
          edge('A', 'B'),
          edge('A', 'C'),
          edge('A', 'D'),
          edge('B', 'D'),
        ]),
        routing: 'stepped',
      },
    },
    {
      name: 'straight routing',
      graph: {
        ...graph('TB', ids('A B C D'), [
          edge('A', 'B'),
          edge('A', 'C'),
          edge('A', 'D'),
          edge('B', 'D'),
        ]),
        routing: 'straight',
      },
    },
    { name: 'tree 50', graph: tree(50) },
    { name: 'tree 500', graph: tree(500) },
  ];
}
