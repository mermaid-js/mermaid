import { describe, it, expect } from 'vitest';
import {
  type DirectionGroup,
  type ElkEdgeLike,
  containerOrigins,
  findSeparatedGroups,
  splitAtGroupPorts,
  stitchPortSegments,
} from '../groupPorts.js';
import type { TreeData } from '../find-common-ancestor.js';

/** A parent lookup from `child: parent` pairs. */
const treeOf = (parentById: Record<string, string>): TreeData => {
  const childrenById: Record<string, string[]> = {};
  for (const [child, parent] of Object.entries(parentById)) {
    (childrenById[parent] ??= []).push(child);
  }
  return { parentById, childrenById };
};

// Two groups of three chained nodes, side by side.
const twoGroups = treeOf({ a1: 'g1', a2: 'g1', a3: 'g1', b1: 'g2', b2: 'g2', b3: 'g2' });
const chains = [
  { source: 'a1', target: 'a2' },
  { source: 'a2', target: 'a3' },
  { source: 'b1', target: 'b2' },
  { source: 'b2', target: 'b3' },
];
const groupsWith = (direction?: DirectionGroup['direction'], ownAlgorithm = false) => [
  { id: 'g1', direction, ownAlgorithm },
  { id: 'g2', direction, ownAlgorithm },
];

describe('findSeparatedGroups', () => {
  it('separates groups whose direction differs from the diagram', () => {
    const separated = findSeparatedGroups(groupsWith('DOWN'), 'RIGHT', chains, twoGroups);
    expect([...separated]).toEqual([
      ['g1', 'DOWN'],
      ['g2', 'DOWN'],
    ]);
  });

  it('separates nothing when the direction matches, or is not given', () => {
    expect(findSeparatedGroups(groupsWith('RIGHT'), 'RIGHT', chains, twoGroups).size).toBe(0);
    expect(findSeparatedGroups(groupsWith(undefined), 'RIGHT', chains, twoGroups).size).toBe(0);
  });

  it('leaves a group that runs its own algorithm alone', () => {
    expect(findSeparatedGroups(groupsWith('DOWN', true), 'RIGHT', chains, twoGroups).size).toBe(0);
  });

  it('leaves a group with no edge between its own nodes alone', () => {
    const across = [{ source: 'a1', target: 'b1' }];
    expect(findSeparatedGroups(groupsWith('DOWN'), 'RIGHT', across, twoGroups).size).toBe(0);
  });

  it('leaves a group holding an edge to itself alone, and keeps the other', () => {
    const separated = findSeparatedGroups(
      groupsWith('DOWN'),
      'RIGHT',
      [...chains, { source: 'a1', target: 'g1' }],
      twoGroups
    );
    expect([...separated.keys()]).toEqual(['g2']);
  });

  it('leaves a group alone whose edge to its own member starts at the group', () => {
    const separated = findSeparatedGroups(
      groupsWith('DOWN'),
      'RIGHT',
      [...chains, { source: 'g2', target: 'b1' }],
      twoGroups
    );
    expect([...separated.keys()]).toEqual(['g1']);
  });

  it('leaves a nested group alone whose direction matches a plain parent in the diagram direction', () => {
    const tree = treeOf({ inner: 'outer', c1: 'inner', c2: 'inner' });
    const groups = [
      { id: 'outer', ownAlgorithm: false },
      { id: 'inner', parentId: 'outer', direction: 'RIGHT' as const, ownAlgorithm: false },
    ];
    const edges = [{ source: 'c1', target: 'c2' }];
    expect(findSeparatedGroups(groups, 'RIGHT', edges, tree).size).toBe(0);
  });

  it('separates a plain nested group an edge only passes into', () => {
    const tree = treeOf({ inner: 'outer', c1: 'inner', o1: 'outer', o2: 'outer' });
    const groups = [
      { id: 'outer', direction: 'DOWN' as const, ownAlgorithm: false },
      { id: 'inner', parentId: 'outer', ownAlgorithm: false },
    ];
    const edges = [
      { source: 'o1', target: 'o2' },
      { source: 'x', target: 'c1' },
    ];
    expect([...findSeparatedGroups(groups, 'RIGHT', edges, tree)]).toEqual([
      ['outer', 'DOWN'],
      ['inner', 'DOWN'],
    ]);
  });

  it('compares a nested group with the direction its parent is laid out in', () => {
    const tree = treeOf({ inner: 'outer', c1: 'inner', c2: 'inner', o1: 'outer' });
    const groups = [
      { id: 'inner', parentId: 'outer', direction: 'RIGHT' as const, ownAlgorithm: false },
      { id: 'outer', direction: 'DOWN' as const, ownAlgorithm: false },
    ];
    const edges = [{ source: 'c1', target: 'c2' }];
    expect([...findSeparatedGroups(groups, 'RIGHT', edges, tree)]).toEqual([
      ['outer', 'DOWN'],
      ['inner', 'RIGHT'],
    ]);
  });

  it('separates a plain group nested in a separated one when an edge enters it', () => {
    const tree = treeOf({ inner: 'outer', c1: 'inner', c2: 'inner', o1: 'outer' });
    const groups = [
      { id: 'outer', direction: 'DOWN' as const, ownAlgorithm: false },
      { id: 'inner', parentId: 'outer', ownAlgorithm: false },
    ];
    const edges = [
      { source: 'c1', target: 'c2' },
      { source: 'o1', target: 'c1' },
    ];
    expect([...findSeparatedGroups(groups, 'RIGHT', edges, tree)]).toEqual([
      ['outer', 'DOWN'],
      ['inner', 'DOWN'],
    ]);
  });
});

const elkEdge = (id: string, source: string, target: string, labels = [{}]): ElkEdgeLike => ({
  id,
  sources: [source],
  targets: [target],
  labels,
});

describe('splitAtGroupPorts', () => {
  const separated = new Map([
    ['g1', 'DOWN' as const],
    ['g2', 'DOWN' as const],
  ]);

  it('splits a crossing edge at a port on each frame, sided by the diagram direction', () => {
    const { edges, ports } = splitAtGroupPorts(
      [elkEdge('x', 'a3', 'b1')],
      twoGroups,
      separated,
      'RIGHT'
    );
    expect(edges.map(({ id }) => id)).toEqual(['x--segment--0', 'x--segment--1', 'x--segment--2']);
    expect(edges.map(({ sources, targets }) => [sources[0], targets[0]])).toEqual([
      ['a3', 'g1--out--x'],
      ['g1--out--x', 'g2--in--x'],
      ['g2--in--x', 'b1'],
    ]);
    expect(ports.get('g1')?.map((port) => port.layoutOptions['elk.port.side'])).toEqual(['EAST']);
    expect(ports.get('g2')?.map((port) => port.layoutOptions['elk.port.side'])).toEqual(['WEST']);
  });

  it('sides the ports south and north in a TB diagram', () => {
    const { ports } = splitAtGroupPorts(
      [elkEdge('x', 'a3', 'b1')],
      twoGroups,
      new Map([
        ['g1', 'RIGHT' as const],
        ['g2', 'RIGHT' as const],
      ]),
      'DOWN'
    );
    expect(ports.get('g1')?.[0].layoutOptions['elk.port.side']).toBe('SOUTH');
    expect(ports.get('g2')?.[0].layoutOptions['elk.port.side']).toBe('NORTH');
  });

  it.each([
    ['RIGHT', 'EAST', 'WEST'],
    ['LEFT', 'WEST', 'EAST'],
    ['DOWN', 'SOUTH', 'NORTH'],
    ['UP', 'NORTH', 'SOUTH'],
  ] as const)(
    'in a %s diagram leaves on the %s side and enters on the %s side',
    (root, out, entry) => {
      const { ports } = splitAtGroupPorts(
        [elkEdge('x', 'a3', 'b1')],
        twoGroups,
        new Map([
          ['g1', root === 'DOWN' ? ('RIGHT' as const) : ('DOWN' as const)],
          ['g2', root === 'DOWN' ? ('RIGHT' as const) : ('DOWN' as const)],
        ]),
        root
      );
      expect(ports.get('g1')?.[0].layoutOptions['elk.port.side']).toBe(out);
      expect(ports.get('g2')?.[0].layoutOptions['elk.port.side']).toBe(entry);
    }
  );

  it('gives every crossing edge its own port, even into the same node', () => {
    const { ports } = splitAtGroupPorts(
      [elkEdge('x', 'a3', 'b1'), elkEdge('y', 'a2', 'b1')],
      twoGroups,
      separated,
      'RIGHT'
    );
    expect(ports.get('g2')?.map((port) => port.id)).toEqual(['g2--in--x', 'g2--in--y']);
  });

  it('leaves inner edges, self loops and edges between groups whole', () => {
    const whole = [
      elkEdge('inner', 'a1', 'a2'),
      elkEdge('loop', 'a1', 'a1'),
      elkEdge('frames', 'g1', 'g2'),
    ];
    const { edges, ports } = splitAtGroupPorts(whole, twoGroups, separated, 'RIGHT');
    expect(edges).toEqual(whole);
    expect(ports.size).toBe(0);
  });

  it('splits an edge into a group itself only at the frame it leaves', () => {
    const { edges } = splitAtGroupPorts([elkEdge('x', 'a3', 'g2')], twoGroups, separated, 'RIGHT');
    expect(edges.map(({ targets }) => targets[0])).toEqual(['g1--out--x', 'g2']);
  });

  it('adds no port to a frame laid out with the diagram', () => {
    const tree = treeOf({ a3: 'g1', g1: 'wrap', b1: 'g2' });
    const { edges, ports } = splitAtGroupPorts(
      [elkEdge('x', 'a3', 'b1')],
      tree,
      separated,
      'RIGHT'
    );
    expect(edges.map(({ targets }) => targets[0])).toEqual(['g1--out--x', 'g2--in--x', 'b1']);
    expect([...ports.keys()]).toEqual(['g1', 'g2']);
  });

  it('chains ports through every separated frame the edge leaves', () => {
    const tree = treeOf({ inner: 'outer', c1: 'inner', x: 'side' });
    const { edges, ports } = splitAtGroupPorts(
      [elkEdge('e', 'c1', 'x')],
      tree,
      new Map([
        ['outer', 'DOWN' as const],
        ['inner', 'RIGHT' as const],
      ]),
      'RIGHT'
    );
    expect(edges.map(({ targets }) => targets[0])).toEqual(['inner--out--e', 'outer--out--e', 'x']);
    expect(ports.get('inner')?.[0].layoutOptions['elk.port.side']).toBe('SOUTH');
    expect(ports.get('outer')?.[0].layoutOptions['elk.port.side']).toBe('EAST');
  });

  it('enters nested separated frames outermost first', () => {
    const tree = treeOf({ inner: 'outer', c1: 'inner' });
    const { edges } = splitAtGroupPorts(
      [elkEdge('e', 'x', 'c1')],
      tree,
      new Map([
        ['outer', 'DOWN' as const],
        ['inner', 'RIGHT' as const],
      ]),
      'RIGHT'
    );
    expect(edges.map(({ targets }) => targets[0])).toEqual(['outer--in--e', 'inner--in--e', 'c1']);
  });

  it('puts the label between the frames and the end labels at their ends', () => {
    const tail = { layoutOptions: { 'edgeLabels.placement': 'TAIL' } };
    const head = { layoutOptions: { 'edgeLabels.placement': 'HEAD' } };
    const centre = { layoutOptions: { 'edgeLabels.placement': 'CENTER' } };
    const { edges } = splitAtGroupPorts(
      [elkEdge('x', 'a3', 'b1', [centre, tail, head])],
      twoGroups,
      separated,
      'RIGHT'
    );
    expect(edges.map(({ labels }) => labels)).toEqual([[tail], [centre], [head]]);
  });
});

describe('stitchPortSegments', () => {
  const graph = {
    children: [
      { id: 'g1', x: 10, y: 20, children: [{ id: 'a3' }] },
      { id: 'g2', x: 200, y: 50, children: [{ id: 'b1' }] },
    ],
  };
  const section = (...points: [number, number][]) => {
    const [start, ...rest] = points.map(([x, y]) => ({ x, y }));
    return [{ startPoint: start, bendPoints: rest.slice(0, -1), endPoint: rest.at(-1)! }];
  };
  const laidOut = (): ElkEdgeLike[] => {
    const { edges } = splitAtGroupPorts(
      [elkEdge('x', 'a3', 'b1', [{}]), elkEdge('inner', 'a1', 'a2')],
      twoGroups,
      new Map([
        ['g1', 'DOWN' as const],
        ['g2', 'DOWN' as const],
      ]),
      'RIGHT'
    );
    const [first, middle, last, inner] = edges;
    return [
      { ...first, container: 'g1', sections: section([40, 30], [40, 60], [100, 60]) },
      {
        ...middle,
        container: 'root',
        sections: section([110, 80], [200, 80]),
        labels: [{ x: 140, y: 70 }],
      },
      { ...last, container: 'g2', sections: section([0, 30], [50, 30], [50, 45]) },
      { ...inner, container: 'g1', sections: section([40, 0], [40, 10]) },
    ];
  };

  it('joins the segments into one route in diagram coordinates, dropping straight joints', () => {
    const [stitched] = stitchPortSegments(laidOut(), containerOrigins(graph), twoGroups);
    const [{ startPoint, bendPoints, endPoint }] = stitched.sections!;
    expect([startPoint, ...(bendPoints ?? []), endPoint]).toEqual([
      { x: 50, y: 50 },
      { x: 50, y: 80 },
      { x: 250, y: 80 },
      { x: 250, y: 95 },
    ]);
    expect(stitched.crossings).toEqual([
      { groupId: 'g1', point: { x: 110, y: 80 } },
      { groupId: 'g2', point: { x: 200, y: 80 } },
    ]);
  });

  it('gives the edge back its own id, ends and label, and keeps other edges', () => {
    const edges = stitchPortSegments(laidOut(), containerOrigins(graph), twoGroups);
    expect(edges.map((edge) => edge.id)).toEqual(['x', 'inner']);
    const [stitched, inner] = edges;
    expect(stitched).toMatchObject({ sources: ['a3'], targets: ['b1'], container: 'root' });
    expect(stitched.splitOf).toBeUndefined();
    expect(stitched.labels).toEqual([{ x: 140, y: 70 }]);
    expect(inner).toEqual(laidOut()[3]);
  });

  it('keeps a joint where the route turns, and puts segments back in order', () => {
    const edges = laidOut();
    edges[1].sections = section([110, 80], [150, 80], [150, 90], [200, 90]);
    edges[2].sections = section([0, 40], [0, 70]);
    const [stitched] = stitchPortSegments(
      [edges[2], edges[0], edges[1], edges[3]],
      containerOrigins(graph),
      twoGroups
    );
    const [{ startPoint, bendPoints, endPoint }] = stitched.sections!;
    expect([startPoint, ...(bendPoints ?? []), endPoint]).toEqual([
      { x: 50, y: 50 },
      { x: 50, y: 80 },
      { x: 150, y: 80 },
      { x: 150, y: 90 },
      { x: 200, y: 90 },
      { x: 200, y: 120 },
    ]);
  });

  it('drops a straight joint on a vertical run', () => {
    const edges = laidOut();
    edges[0].sections = section([40, 30], [40, 60]);
    edges[1].sections = section([50, 80], [50, 100], [200, 100]);
    edges[2].sections = section([0, 50], [50, 50], [50, 70]);
    const [stitched] = stitchPortSegments(edges, containerOrigins(graph), twoGroups);
    const [{ startPoint, bendPoints, endPoint }] = stitched.sections!;
    expect([startPoint, ...(bendPoints ?? []), endPoint]).toEqual([
      { x: 50, y: 50 },
      { x: 50, y: 100 },
      { x: 250, y: 100 },
      { x: 250, y: 120 },
    ]);
  });

  it('returns the edges unchanged when nothing was split', () => {
    const edges = [laidOut()[3]];
    expect(stitchPortSegments(edges, containerOrigins(graph), twoGroups)).toEqual(edges);
  });

  it('leaves the edge unrouted when ELK did not route a segment', () => {
    const edges = laidOut();
    edges[1].sections = [];
    edges[2].sections = undefined;
    const [stitched] = stitchPortSegments(edges, containerOrigins(graph), twoGroups);
    expect(stitched.sections).toEqual([]);
    expect(stitched.crossings).toEqual([]);
  });

  it('expresses the route relative to the lowest common subgraph', () => {
    const tree = treeOf({ g1: 'box', g2: 'box', a3: 'g1', b1: 'g2' });
    const boxed = { children: [{ id: 'box', x: 5, y: 5, children: graph.children }] };
    const edges = laidOut().map((edge) =>
      edge.container === 'root' ? { ...edge, container: 'box' } : edge
    );
    const [stitched] = stitchPortSegments(edges, containerOrigins(boxed), tree);
    expect(stitched.container).toBe('box');
    expect(stitched.sections![0].startPoint).toEqual({ x: 50, y: 50 });
  });
});
