import { describe, it, expect } from 'vitest';
import {
  buildElkGraphFromLayoutData,
  buildSubgraphLayoutOptions,
  dir2ElkDirection,
  ensureEndMarkerSegmentLength,
  findCyclicEntryNodes,
  prepareLayoutForElk,
  runElkLayoutCore,
} from '../render.js';

const log = {
  debug: () => undefined,
  error: () => undefined,
  info: () => undefined,
  warn: () => undefined,
};

const elkRenderContext = {
  helpers: {
    common: { lineBreakRegex: /<br\s*\/?>/gi },
    getConfig: () => ({ flowchart: { wrappingWidth: 200 }, curve: undefined }),
    interpolateToCurve: (curve: unknown) => curve,
    log,
  },
  options: { algorithm: 'elk.layered' },
} as any;

describe('buildSubgraphLayoutOptions', () => {
  it('propagates mergeEdges to subgraphs without an explicit direction', () => {
    const opts = buildSubgraphLayoutOptions({}, { mergeEdges: true }, 'layered');
    expect(opts['elk.layered.mergeEdges']).toBe(true);
  });

  it('propagates mergeEdges to subgraphs with an explicit direction', () => {
    const opts = buildSubgraphLayoutOptions({ dir: 'LR' }, { mergeEdges: true }, 'layered');
    expect(opts['elk.layered.mergeEdges']).toBe(true);
    expect(opts['elk.direction']).toBe('RIGHT');
    expect(opts['elk.algorithm']).toBe('layered');
    expect(opts['elk.hierarchyHandling']).toBe('SEPARATE_CHILDREN');
  });

  it('omits direction-specific options when node has no dir', () => {
    const opts = buildSubgraphLayoutOptions({}, { mergeEdges: true }, 'layered');
    expect(opts['elk.algorithm']).toBeUndefined();
    expect(opts['elk.direction']).toBeUndefined();
    expect(opts['elk.hierarchyHandling']).toBeUndefined();
  });

  it('passes through nodePlacementStrategy from config', () => {
    const opts = buildSubgraphLayoutOptions(
      {},
      { nodePlacementStrategy: 'BRANDES_KOEPF' },
      'layered'
    );
    expect(opts['nodePlacement.strategy']).toBe('BRANDES_KOEPF');
  });

  it('defaults nodePlacementAlignment to NONE', () => {
    const opts = buildSubgraphLayoutOptions({}, { mergeEdges: true }, 'layered');
    expect(opts['elk.layered.nodePlacement.bk.fixedAlignment']).toBe('NONE');
  });

  it('passes through nodePlacementAlignment from config', () => {
    const opts = buildSubgraphLayoutOptions({}, { nodePlacementAlignment: 'NONE' }, 'layered');
    expect(opts['elk.layered.nodePlacement.bk.fixedAlignment']).toBe('NONE');
  });

  it('handles undefined elkConfig gracefully', () => {
    const opts = buildSubgraphLayoutOptions({}, undefined, 'layered');
    expect(opts['elk.layered.mergeEdges']).toBeUndefined();
    expect(opts['nodePlacement.strategy']).toBeUndefined();
    expect(opts['elk.layered.nodePlacement.bk.fixedAlignment']).toBe('NONE');
  });
});

describe('findCyclicEntryNodes', () => {
  it('returns nothing for an acyclic flow (natural source exists)', () => {
    const nodes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const edges = [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
    ];
    expect(findCyclicEntryNodes(nodes, edges).size).toBe(0);
  });

  it('nominates the first-declared node of a source-less cycle', () => {
    // a -> b -> c -> a : pure recursion, no in-degree-0 node
    const nodes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const edges = [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
      { source: 'c', target: 'a' },
    ];
    expect([...findCyclicEntryNodes(nodes, edges)]).toEqual(['a']);
  });

  it('pins the entry of a recursive flow (reported recursion case)', () => {
    // brief -> web -> academic -> expert -> synthesize -> decision,
    // decision -> format_output2, decision -> brief (the recursion edge).
    // format_output is an orphan; format_output2 is the real sink.
    const nodes = [
      'brief',
      'web',
      'academic',
      'expert',
      'synthesize',
      'format_output',
      'decision',
      'format_output2',
    ].map((id) => ({ id, parentId: 'research' }));
    const edges = [
      { source: 'brief', target: 'web' },
      { source: 'web', target: 'academic' },
      { source: 'academic', target: 'expert' },
      { source: 'expert', target: 'synthesize' },
      { source: 'synthesize', target: 'decision' },
      { source: 'decision', target: 'format_output2' },
      { source: 'decision', target: 'brief' },
    ];
    const entries = findCyclicEntryNodes(nodes, edges);
    expect(entries.has('brief')).toBe(true);
    // The orphan has in-degree 0, so its component already has a source.
    expect(entries.has('format_output')).toBe(false);
    expect(entries.size).toBe(1);
  });

  it('scopes detection per container (parentId)', () => {
    // A self-contained cycle inside subgraph "sub"; an acyclic chain at root.
    const nodes = [
      { id: 'root_a' },
      { id: 'root_b' },
      { id: 'x', parentId: 'sub' },
      { id: 'y', parentId: 'sub' },
    ];
    const edges = [
      { source: 'root_a', target: 'root_b' },
      { source: 'x', target: 'y' },
      { source: 'y', target: 'x' },
    ];
    expect([...findCyclicEntryNodes(nodes, edges)]).toEqual(['x']);
  });

  it('ignores self-loops when deciding whether a node is a source', () => {
    const nodes = [{ id: 'a' }, { id: 'b' }];
    const edges = [
      { source: 'a', target: 'a' }, // self-loop, not a real incoming edge
      { source: 'a', target: 'b' },
    ];
    // 'a' is still a source, so nothing is nominated.
    expect(findCyclicEntryNodes(nodes, edges).size).toBe(0);
  });
});

describe('dir2ElkDirection', () => {
  it('maps LR to RIGHT', () => expect(dir2ElkDirection('LR')).toBe('RIGHT'));
  it('maps RL to LEFT', () => expect(dir2ElkDirection('RL')).toBe('LEFT'));
  it('maps TB and TD to DOWN', () => {
    expect(dir2ElkDirection('TB')).toBe('DOWN');
    expect(dir2ElkDirection('TD')).toBe('DOWN');
  });
  it('maps BT to UP', () => expect(dir2ElkDirection('BT')).toBe('UP'));
  it('defaults to DOWN for unknown', () => expect(dir2ElkDirection('xyz')).toBe('DOWN'));
});

describe('prepareLayoutForElk', () => {
  it('preserves diagram-specific edge classes and styles', () => {
    const data = {
      config: {},
      nodes: [],
      edges: [
        {
          id: 'er-edge',
          start: 'A',
          end: 'B',
          label: 'owns',
          classes: 'relationshipLine',
          thickness: 'normal',
          pattern: 'dashed',
          arrowTypeStart: 'zero_or_one',
          arrowTypeEnd: 'only_one',
          labelType: 'markdown',
        },
        {
          id: 'class-edge',
          start: 'Controller',
          end: 'Model',
          label: 'uses',
          classes: 'relation',
          style: ['stroke:red', 'stroke-width:4px'],
          labelStyle: ['display: inline-block'],
          thickness: 'normal',
          pattern: 'solid',
          arrowTypeStart: 'none',
          arrowTypeEnd: 'extension',
          labelType: 'markdown',
        },
      ],
    } as any;

    prepareLayoutForElk(data, elkRenderContext);

    expect(data.edges[0]).toMatchObject({
      classes: 'relationshipLine',
      thickness: 'normal',
      pattern: 'dashed',
      arrowTypeStart: 'zero_or_one',
      arrowTypeEnd: 'only_one',
    });
    expect(data.edges[1]).toMatchObject({
      classes: 'relation',
      style: ['stroke:red', 'stroke-width:4px'],
      labelStyle: ['display: inline-block'],
      arrowTypeStart: 'none',
      arrowTypeEnd: 'extension',
    });
  });
});

describe('buildElkGraphFromLayoutData', () => {
  it('builds an ELK graph from measured layout data without DOM handles', () => {
    const data = {
      direction: 'LR',
      config: { elk: { mergeEdges: true } },
      nodes: [
        {
          id: 'group',
          isGroup: true,
          label: 'Group',
          padding: 12,
          labelBBox: { width: 44, height: 16 },
        },
        { id: 'A', isGroup: false, parentId: 'group', width: 50, height: 20, label: 'A' },
        { id: 'B', isGroup: false, width: 60, height: 24, label: 'B' },
      ],
      edges: [
        {
          id: 'edge-A-B',
          start: 'A',
          end: 'B',
          label: 'go',
          width: 22,
          height: 10,
          type: 'arrow_point',
        },
      ],
    } as any;

    const state = buildElkGraphFromLayoutData(data, {
      algorithm: 'layered',
      common: { lineBreakRegex: /<br\s*\/?>/gi },
      getConfig: () => ({ flowchart: { wrappingWidth: 100 } }),
      interpolateToCurve: (curve: unknown) => curve,
      log,
    } as any);

    expect(state.elkGraph.layoutOptions['elk.direction']).toBe('RIGHT');
    expect(state.elkGraph.layoutOptions['elk.layered.nodePlacement.bk.fixedAlignment']).toBe(
      'NONE'
    );
    expect(state.elkGraph.children).toHaveLength(2);

    const group = state.nodeDb.group;
    expect(group.children).toHaveLength(1);
    expect(group.labels?.[0]).toMatchObject({ text: 'Group', width: 44, height: 14 });
    expect((group as { domId?: unknown }).domId).toBeUndefined();

    const edge = state.elkGraph.edges[0];
    expect(edge.labels[0]).toMatchObject({ width: 22, height: 10, text: 'go' });
    expect(edge.labelEl).toBeUndefined();
  });

  it('passes through nodePlacementAlignment to the root graph', () => {
    const state = buildElkGraphFromLayoutData(
      {
        direction: 'TB',
        config: { elk: { nodePlacementAlignment: 'BALANCED' } },
        nodes: [],
        edges: [],
      } as any,
      {
        algorithm: 'layered',
        common: { lineBreakRegex: /<br\s*\/?>/gi },
        getConfig: () => ({ flowchart: { wrappingWidth: 100 } }),
        interpolateToCurve: (curve: unknown) => curve,
        log,
      } as any
    );

    expect(state.elkGraph.layoutOptions['elk.layered.nodePlacement.bk.fixedAlignment']).toBe(
      'BALANCED'
    );
  });

  const recursiveLayoutData = (elk: Record<string, unknown>) =>
    ({
      direction: 'TB',
      config: { elk },
      nodes: [
        { id: 'a', isGroup: false, width: 50, height: 20, label: 'a' },
        { id: 'b', isGroup: false, width: 50, height: 20, label: 'b' },
        { id: 'c', isGroup: false, width: 50, height: 20, label: 'c' },
      ],
      edges: [
        { id: 'e1', start: 'a', end: 'b', type: 'arrow_point' },
        { id: 'e2', start: 'b', end: 'c', type: 'arrow_point' },
        { id: 'e3', start: 'c', end: 'a', type: 'arrow_point' }, // recursion edge
      ],
    }) as any;

  const elkContext = {
    algorithm: 'layered',
    common: { lineBreakRegex: /<br\s*\/?>/gi },
    getConfig: () => ({ flowchart: { wrappingWidth: 100 } }),
    interpolateToCurve: (curve: unknown) => curve,
    log,
  } as any;

  it('pins the cyclic entry node to the first layer when keepEntryNodeOnTop is enabled', () => {
    const state = buildElkGraphFromLayoutData(
      recursiveLayoutData({ keepEntryNodeOnTop: true }),
      elkContext
    );
    expect(state.nodeDb.a.layoutOptions?.['elk.layered.layering.layerConstraint']).toBe('FIRST');
    expect(state.nodeDb.b.layoutOptions?.['elk.layered.layering.layerConstraint']).toBeUndefined();
    expect(state.nodeDb.c.layoutOptions?.['elk.layered.layering.layerConstraint']).toBeUndefined();
  });

  it('does not constrain any node when keepEntryNodeOnTop is disabled (default)', () => {
    const state = buildElkGraphFromLayoutData(recursiveLayoutData({}), elkContext);
    for (const id of ['a', 'b', 'c']) {
      expect(
        state.nodeDb[id].layoutOptions?.['elk.layered.layering.layerConstraint']
      ).toBeUndefined();
    }
  });
});

describe('runElkLayoutCore', () => {
  it('orders parent clusters before child clusters after ELK layout for common painting', async () => {
    const data = {
      direction: 'TB',
      config: { elk: {} },
      nodes: [
        {
          id: 'child',
          isGroup: true,
          parentId: 'parent',
          label: 'child',
          padding: 8,
          labelBBox: { width: 30, height: 16 },
        },
        {
          id: 'parent',
          isGroup: true,
          label: 'parent',
          padding: 8,
          labelBBox: { width: 40, height: 16 },
        },
        {
          id: 'leaf',
          isGroup: false,
          parentId: 'child',
          width: 40,
          height: 20,
          label: 'leaf',
          shape: 'rect',
        },
      ],
      edges: [],
    } as any;

    await runElkLayoutCore(data, elkRenderContext);

    expect(data.nodes.map((node: any) => node.id)).toEqual(['parent', 'child', 'leaf']);
  });

  it('keeps child node positions relative to the subgraph top-left', async () => {
    const data = {
      direction: 'TB',
      config: {
        elk: {
          mergeEdges: false,
          nodePlacementStrategy: 'BRANDES_KOEPF',
          forceNodeModelOrder: false,
          considerModelOrder: 'NODES_AND_EDGES',
        },
      },
      nodes: [
        {
          id: 'hello',
          isGroup: true,
          label: 'hello',
          padding: 8,
          labelBBox: { width: 29.59375, height: 21 },
        },
        {
          id: 'C',
          isGroup: false,
          parentId: 'hello',
          width: 42.125,
          height: 45,
          label: 'C',
          shape: 'rect',
        },
        {
          id: 'D',
          isGroup: false,
          parentId: 'hello',
          width: 42.125,
          height: 45,
          label: 'D',
          shape: 'rect',
        },
        { id: 'A', isGroup: false, width: 41.34375, height: 45, label: 'A', shape: 'rect' },
        { id: 'B', isGroup: false, width: 41.34375, height: 45, label: 'B', shape: 'rect' },
      ],
      edges: [
        { id: 'L_A_B_0', start: 'A', end: 'B', type: 'arrow_point' },
        { id: 'L_C_D_0', start: 'C', end: 'D', type: 'arrow_point' },
      ],
    } as any;

    const context = {
      helpers: {
        common: { lineBreakRegex: /<br\s*\/?>/gi },
        getConfig: () => ({ flowchart: { wrappingWidth: 200 }, curve: undefined }),
        interpolateToCurve: (curve: unknown) => curve,
        log,
      },
      options: { algorithm: 'elk.layered' },
    } as any;

    const graph = await runElkLayoutCore(data, context);
    const group = graph.children?.find((node: any) => node.id === 'hello');
    const child = group?.children?.find((node: any) => node.id === 'C');
    const layoutChild = data.nodes.find((node: any) => node.id === 'C');

    expect(group).toBeDefined();
    expect(child).toBeDefined();
    expect(child.offset.x).toBeCloseTo(group.offset.posX);
    expect(child.offset.y).toBeCloseTo(group.offset.posY);
    expect(layoutChild.x).toBeCloseTo(child.offset.posX + child.width / 2);
    expect(layoutChild.y).toBeCloseTo(child.offset.posY + child.height / 2);
  });
});

describe('ensureEndMarkerSegmentLength', () => {
  const log = { debug: () => undefined };
  const circleBounds = {
    x: 138.88020833333334,
    y: 607.4296875,
    width: 140.265625,
    height: 140.265625,
  };

  it('removes the target bbox entry point when the final marker segment is too short', () => {
    const points = [
      { x: 162.2578125, y: 497.296875 },
      { x: 162.2578125, y: 537.296875 },
      { x: 161.05815095468608, y: 540.8958596359416 },
    ];

    expect(ensureEndMarkerSegmentLength(points, circleBounds, 4, log)).toEqual([
      points[0],
      points[2],
    ]);
  });

  it('keeps real bends that are not on the target bounds', () => {
    const points = [
      { x: 120, y: 500 },
      { x: 130, y: 532 },
      { x: 132, y: 535 },
    ];

    expect(ensureEndMarkerSegmentLength(points, circleBounds, 4, log)).toEqual(points);
  });

  it('keeps target entry segments that already have marker runway', () => {
    const points = [
      { x: 162.2578125, y: 497.296875 },
      { x: 162.2578125, y: 537.296875 },
      { x: 162.2578125, y: 550 },
    ];

    expect(ensureEndMarkerSegmentLength(points, circleBounds, 4, log)).toEqual(points);
  });
});
