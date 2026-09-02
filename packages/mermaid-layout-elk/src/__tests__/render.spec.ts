import { describe, it, expect } from 'vitest';
import {
  buildElkGraphFromLayoutData,
  buildSubgraphLayoutOptions,
  clearContainerAlgorithmOptions,
  dir2ElkDirection,
  ensureEndMarkerSegmentLength,
  evenGroupFrames,
  findCyclicEntryNodes,
  prepareLayoutForElk,
  resolveContainerAlgorithm,
  resolveElkPreset,
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

describe('resolveContainerAlgorithm', () => {
  it('accepts the supported ELK algorithms', () => {
    for (const algo of ['elk.layered', 'elk.box', 'elk.rectpacking', 'elk.mrtree']) {
      expect(resolveContainerAlgorithm(algo)).toBe(algo);
    }
  });

  it('rejects an unknown algorithm and warns instead of handing it to ELK', () => {
    const warnings: unknown[] = [];
    const spyLog = { ...log, warn: (...args: unknown[]) => warnings.push(args[0]) };
    expect(resolveContainerAlgorithm('garbage', spyLog)).toBeUndefined();
    expect(warnings).toHaveLength(1);
    expect(String(warnings[0])).toContain('garbage');
  });

  it('rejects non-string values without warning', () => {
    const warnings: unknown[] = [];
    const spyLog = { ...log, warn: (...args: unknown[]) => warnings.push(args[0]) };
    expect(resolveContainerAlgorithm(undefined, spyLog)).toBeUndefined();
    expect(resolveContainerAlgorithm({ elk: 'box' }, spyLog)).toBeUndefined();
    expect(warnings).toHaveLength(0);
  });
});

describe('buildSubgraphLayoutOptions', () => {
  it('derives a label-based minimum size for containers with their own algorithm', () => {
    const opts = buildSubgraphLayoutOptions(
      { padding: 8, labelData: { width: 44, height: 14 }, metadata: { algorithm: 'elk.box' } },
      { mergeEdges: true },
      'layered'
    );
    expect(opts['nodeSize.constraints']).toBe('[MINIMUM_SIZE, NODE_LABELS]');
    // Height clears the whole reserved strip — label (14) plus the 15px
    // padding above it and the 15px below — not just the label height.
    expect(opts['nodeSize.minimum']).toBe('(60, 44)');
    expect(opts['elk.padding']).toBe('[top=29,left=15,bottom=15,right=15]');
  });

  it('leaves the size of a plain subgraph to ELK, as before', () => {
    const opts = buildSubgraphLayoutOptions(
      { padding: 8, labelData: { width: 44, height: 14 } },
      { mergeEdges: true },
      'layered'
    );
    expect(opts['nodeSize.constraints']).toBeUndefined();
    expect(opts['nodeSize.minimum']).toBeUndefined();
  });

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

  it('ignores an unsupported metadata algorithm and falls back to the dir branch', () => {
    const opts = buildSubgraphLayoutOptions(
      { dir: 'LR', labelData: { width: 30, height: 14 }, metadata: { algorithm: 'elk.garbage' } },
      undefined,
      'layered'
    );
    expect(opts['elk.algorithm']).toBe('layered');
    expect(opts['elk.direction']).toBe('RIGHT');
    expect(opts['nodeSize.minimum']).toBeUndefined();
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
    expect(opts['elk.layered.nodePlacement.strategy']).toBe('BRANDES_KOEPF');
  });

  it('defaults nodePlacementAlignment to NONE', () => {
    const opts = buildSubgraphLayoutOptions({}, { mergeEdges: true }, 'layered');
    expect(opts['elk.layered.nodePlacement.bk.fixedAlignment']).toBe('NONE');
  });

  it('passes through nodePlacementAlignment from config', () => {
    const opts = buildSubgraphLayoutOptions({}, { nodePlacementAlignment: 'BALANCED' }, 'layered');
    expect(opts['elk.layered.nodePlacement.bk.fixedAlignment']).toBe('BALANCED');
  });

  it('handles undefined elkConfig gracefully', () => {
    const opts = buildSubgraphLayoutOptions({}, undefined, 'layered');
    expect(opts['elk.layered.mergeEdges']).toBeUndefined();
    // With no config at all the `default` preset supplies the placement
    // strategy. Containers are BRANDES_KOEPF while the root is NETWORK_SIMPLEX:
    // network simplex inside a frame produced routes that left a subgraph on
    // its bounding-box corner, so containers keep the strategy that does not.
    expect(opts['elk.layered.nodePlacement.strategy']).toBe('BRANDES_KOEPF');
    expect(opts['elk.layered.nodePlacement.bk.fixedAlignment']).toBe('NONE');
  });

  it('lets an explicit strategy beat the preset', () => {
    // A preset is a starting point, not a lock: naming one option explicitly
    // overrides that option and leaves the rest of the preset in place.
    const opts = buildSubgraphLayoutOptions(
      {},
      { preset: 'legacy', nodePlacementStrategy: 'SIMPLE' },
      'layered'
    );
    expect(opts['elk.layered.nodePlacement.strategy']).toBe('SIMPLE');
  });

  it('takes the container placement strategy from the named preset', () => {
    const placement = (preset: string) =>
      buildSubgraphLayoutOptions({}, { preset }, 'layered')['elk.layered.nodePlacement.strategy'];

    // `legacy` exists to reproduce what earlier versions rendered, so it has to
    // reach containers too — leaving them on the new strategy would make it a
    // half-restore that still lays subgraph contents out differently.
    expect(placement('legacy')).toBe('BRANDES_KOEPF');
    // `default` and `depthFirst` place the ROOT with NETWORK_SIMPLEX but keep
    // containers on BRANDES_KOEPF — the two sides are tuned separately on
    // purpose, so a change to one must not be assumed to carry to the other.
    expect(placement('depthFirst')).toBe('BRANDES_KOEPF');
    expect(placement('default')).toBe('BRANDES_KOEPF');
  });

  it('names the placement option once, fully qualified', () => {
    // ELK reads `nodePlacement.strategy` and `elk.layered.nodePlacement.strategy`
    // as the same option. Setting both left the container holding two values
    // for it with no say in which won, which silently ignored an explicit
    // `nodePlacementStrategy`.
    const opts = buildSubgraphLayoutOptions({}, { nodePlacementStrategy: 'SIMPLE' }, 'layered');

    expect(opts).not.toHaveProperty('nodePlacement.strategy');
    expect(opts['elk.layered.nodePlacement.strategy']).toBe('SIMPLE');
  });

  it('applies a per-group algorithm from metadata with SEPARATE_CHILDREN', () => {
    const opts = buildSubgraphLayoutOptions(
      { labelData: { width: 30, height: 14 }, metadata: { algorithm: 'elk.box' } },
      undefined,
      'layered'
    );
    expect(opts['elk.algorithm']).toBe('elk.box');
    expect(opts['elk.hierarchyHandling']).toBe('SEPARATE_CHILDREN');
    expect(opts['elk.padding']).toBe('[top=29,left=15,bottom=15,right=15]');
  });

  it('metadata algorithm takes precedence over dir', () => {
    const opts = buildSubgraphLayoutOptions(
      { dir: 'LR', metadata: { algorithm: 'elk.box' } },
      undefined,
      'layered'
    );
    expect(opts['elk.algorithm']).toBe('elk.box');
    expect(opts['elk.direction']).toBeUndefined();
  });

  it('applies tighter rectpacking options for elk.rectpacking groups', () => {
    const opts = buildSubgraphLayoutOptions(
      { labelData: { width: 30, height: 14 }, metadata: { algorithm: 'elk.rectpacking' } },
      undefined,
      'layered'
    );
    expect(opts['elk.rectpacking.trybox']).toBe('true');
    expect(opts['elk.padding']).toBe('[top=24,left=10,bottom=10,right=10]');
    // Minimum height clears the tighter rectpacking strip, not the default one.
    expect(opts['nodeSize.minimum']).toBe('(30, 34)');
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

  it('pins the true entry when a back-edge feeds it and it is not declared first (#79)', () => {
    // The chain starts at stockholm, but end_decision -> stockholm gives the
    // entry an in-degree of 1 while san_francisco is declared first. The
    // nomination must follow edge declaration order, not node declaration order.
    const nodes = [
      'san_francisco',
      'stockholm',
      'new_york',
      'decide',
      'end_decision',
      'format_json',
    ].map((id) => ({ id, parentId: 'world-clock' }));
    const edges = [
      { source: 'stockholm', target: 'new_york' },
      { source: 'new_york', target: 'san_francisco' },
      { source: 'san_francisco', target: 'decide' },
      { source: 'decide', target: 'end_decision' },
      { source: 'end_decision', target: 'format_json' },
      { source: 'end_decision', target: 'stockholm' },
    ];
    expect([...findCyclicEntryNodes(nodes, edges)]).toEqual(['stockholm']);
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

describe('small-node edge anchoring', () => {
  // A start/end state circle is 14px across — smaller than twice the 12px
  // ports-surrounding margin — so ELK's anchor for it lands off-centre and is
  // discarded in favour of aiming at the node centre. The whole route must
  // then run down the shared centre line.
  it('centres a single edge between two start/end state circles', async () => {
    const data = {
      direction: 'TB',
      config: { elk: {} },
      nodes: [
        {
          id: 'root_start',
          isGroup: false,
          width: 14,
          height: 14,
          label: 'root_start',
          shape: 'stateStart',
        },
        {
          id: 'root_end',
          isGroup: false,
          width: 14,
          height: 14,
          label: 'root_end',
          shape: 'stateEnd',
        },
      ],
      edges: [{ id: 'edge0', start: 'root_start', end: 'root_end', type: 'arrow_barb' }],
    } as any;

    await runElkLayoutCore(data, elkRenderContext);

    const start = data.nodes.find((node: any) => node.id === 'root_start');
    const edge = data.edges[0];
    expect(edge.points.length).toBeGreaterThanOrEqual(2);
    for (const point of edge.points) {
      expect(point.x).toBeCloseTo(start.x, 3);
    }
  });

  // The drop is side-specific: a fork/join bar is thin but long, and the side
  // its anchors spread along (the width, for a top/bottom attachment) is well
  // above the margin threshold. Its anchors carry real information — two
  // incoming edges must keep two distinct attachment points instead of being
  // funnelled to the bar's centre.
  it('keeps spread anchors on a wide, thin fork/join bar', async () => {
    const data = {
      direction: 'TB',
      config: { elk: {} },
      nodes: [
        { id: 'a', isGroup: false, width: 40, height: 20, label: 'a', shape: 'rect' },
        { id: 'b', isGroup: false, width: 40, height: 20, label: 'b', shape: 'rect' },
        { id: 'bar', isGroup: false, width: 120, height: 10, label: 'bar', shape: 'forkJoin' },
      ],
      edges: [
        { id: 'e1', start: 'a', end: 'bar', type: 'arrow_point' },
        { id: 'e2', start: 'b', end: 'bar', type: 'arrow_point' },
      ],
    } as any;

    await runElkLayoutCore(data, elkRenderContext);

    const bar = data.nodes.find((node: any) => node.id === 'bar');
    const arrivalXs = data.edges.map((edge: any) => edge.points.at(-1).x);
    expect(Math.abs(arrivalXs[0] - arrivalXs[1])).toBeGreaterThan(1);
    // ELK spreads the two anchors ~28px either side of the bar's centre. An
    // edge whose anchor was wrongly dropped aims at the centre instead and
    // arrives within ~5px of it, so require real clearance from the centre.
    for (const x of arrivalXs) {
      expect(Math.abs(x - bar.x)).toBeGreaterThan(10);
    }
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

describe('algorithms that place nodes but do not route edges', () => {
  // `elk.box` and `elk.rectpacking` are selectable as top-level `layout` values,
  // but neither routes edges, so ELK returns no `edge.sections`. Leaving
  // `edge.points` unset then crashed the paint step with
  // "Cannot read properties of undefined (reading 'filter')" — every diagram
  // with a single edge blanked.
  const nonRoutingData = () =>
    ({
      direction: 'TB',
      config: { elk: {} },
      nodes: [
        { id: 'A', isGroup: false, width: 40, height: 20, label: 'A', shape: 'rect' },
        { id: 'B', isGroup: false, width: 40, height: 20, label: 'B', shape: 'rect' },
      ],
      edges: [{ id: 'L_A_B_0', start: 'A', end: 'B', type: 'arrow_point' }],
    }) as any;

  it.each(['elk.box', 'elk.rectpacking'])('assigns edge points under %s', async (algorithm) => {
    const data = nonRoutingData();
    await runElkLayoutCore(data, { ...elkRenderContext, options: { algorithm } });

    const edge = data.edges[0];
    expect(edge.points).toBeDefined();
    expect(edge.points.length).toBeGreaterThanOrEqual(2);
    for (const point of edge.points) {
      expect(Number.isFinite(point.x)).toBe(true);
      expect(Number.isFinite(point.y)).toBe(true);
    }
  });

  // The straight line runs centre to centre, but this renderer paints with
  // `skipIntersect`, so nothing downstream clips it: unclipped, the line runs
  // under both nodes and the end marker sits inside the target instead of on
  // its border. The endpoints have to be on (or outside) the node boxes.
  it.each(['elk.box', 'elk.rectpacking'])(
    'clips the fallback endpoints back to the node borders under %s',
    async (algorithm) => {
      const data = nonRoutingData();
      await runElkLayoutCore(data, { ...elkRenderContext, options: { algorithm } });

      const nodeById = Object.fromEntries(data.nodes.map((node: any) => [node.id, node]));
      const points = data.edges[0].points;

      // "Not strictly inside" is too weak on its own — a point at (1e9, 1e9)
      // would satisfy it. Require the endpoint to sit *on* the node's boundary:
      // flush against one edge of the box and within the span of the other.
      const onNodeBorder = (node: any, point: { x: number; y: number }, tolerance = 0.5) => {
        if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
          return false;
        }
        const dx = Math.abs(point.x - node.x);
        const dy = Math.abs(point.y - node.y);
        const halfWidth = node.width / 2;
        const halfHeight = node.height / 2;
        const onVerticalEdge =
          Math.abs(dx - halfWidth) <= tolerance && dy <= halfHeight + tolerance;
        const onHorizontalEdge =
          Math.abs(dy - halfHeight) <= tolerance && dx <= halfWidth + tolerance;
        return onVerticalEdge || onHorizontalEdge;
      };

      expect(onNodeBorder(nodeById.A, points[0])).toBe(true);
      expect(onNodeBorder(nodeById.B, points[points.length - 1])).toBe(true);
    }
  );

  // ELK never routed the edge, so it produced no label position either.
  // `positionEdgeLabel` reads `edge.x` / `edge.y` straight into
  // `translate(${x}, ${y + margin})`, so leaving them unset rendered
  // `translate(undefined, NaN)` — an invalid transform that browsers drop,
  // dumping the label at the group origin instead of on the edge.
  it.each(['elk.box', 'elk.rectpacking'])(
    'positions the label of an unrouted edge under %s',
    async (algorithm) => {
      const data = nonRoutingData();
      data.edges[0].label = 'hello';
      await runElkLayoutCore(data, { ...elkRenderContext, options: { algorithm } });

      const edge = data.edges[0];
      expect(Number.isFinite(edge.x)).toBe(true);
      expect(Number.isFinite(edge.y)).toBe(true);

      // On the line it labels: midway between the two clipped endpoints.
      const [first] = edge.points;
      const last = edge.points[edge.points.length - 1];
      expect(edge.x).toBeCloseTo((first.x + last.x) / 2);
      expect(edge.y).toBeCloseTo((first.y + last.y) / 2);
    }
  );
});

describe('clearContainerAlgorithmOptions', () => {
  // A container whose edges cross its boundary falls back to the inherited
  // algorithm. Deleting only `elk.algorithm` left the rest of the algorithm's
  // options in place — none of which are inert under `elk.layered` — so the
  // container got a hybrid rather than the documented fallback.
  it('removes every option the algorithm branch added', () => {
    const options = buildSubgraphLayoutOptions(
      { padding: 8, labelData: { width: 44, height: 14 }, metadata: { algorithm: 'elk.box' } },
      { mergeEdges: true },
      'elk.layered'
    );
    clearContainerAlgorithmOptions(options);

    for (const key of [
      'elk.algorithm',
      'nodeSize.constraints',
      'nodeSize.minimum',
      'elk.aspectRatio',
      'elk.contentAlignment',
      'elk.expandNodes',
      'elk.padding',
    ]) {
      expect(options).not.toHaveProperty(key);
    }
  });

  it('removes the rectpacking overrides and restores the default base spacing', () => {
    const options = buildSubgraphLayoutOptions(
      {
        padding: 8,
        labelData: { width: 44, height: 14 },
        metadata: { algorithm: 'elk.rectpacking' },
      },
      { mergeEdges: true },
      'elk.layered'
    );
    expect(options['spacing.baseValue']).toBe(15);

    clearContainerAlgorithmOptions(options);

    // Back to DEFAULT_SUBGRAPH_SPACING_BASE_VALUE. It no longer buys the
    // approach run or the node gap — those are set on their own now — so it is
    // free to be small, and the container's padding follows it.
    expect(options['spacing.baseValue']).toBe(24);
    // Restored too, rather than left deleted: rectpacking overrode it, and
    // dropping it would hand the container ELK's node spacing instead of ours.
    expect(options['spacing.nodeNode']).toBe(50);
    expect(options).not.toHaveProperty('elk.rectpacking.trybox');
  });

  it('leaves the base options alone', () => {
    const options = buildSubgraphLayoutOptions(
      { padding: 8, labelData: { width: 44, height: 14 }, metadata: { algorithm: 'elk.box' } },
      { mergeEdges: true, nodePlacementStrategy: 'BRANDES_KOEPF' },
      'elk.layered'
    );
    clearContainerAlgorithmOptions(options);

    expect(options['elk.layered.mergeEdges']).toBe(true);
    expect(options['elk.layered.nodePlacement.strategy']).toBe('BRANDES_KOEPF');
    expect(options['nodeLabels.placement']).toBe('[H_CENTER V_TOP, INSIDE]');
  });

  describe('evenGroupFrames', () => {
    /**
     * Build the two structures the pass reads: the ELK tree (for `isGroup` and
     * `children`) and `nodeDb`, whose entries carry the absolute box that
     * `applyElkNodePositions` has already written.
     */
    function scene(groupBox: { x: number; y: number; w: number; h: number }, kids: number[][]) {
      const nodeDb: Record<string, any> = {
        g: {
          id: 'g',
          isGroup: true,
          offset: { posX: groupBox.x, posY: groupBox.y },
          width: groupBox.w,
          height: groupBox.h,
        },
      };
      const children = kids.map(([x, y, w, h], i) => {
        nodeDb[`n${i}`] = { id: `n${i}`, offset: { posX: x, posY: y }, width: w, height: h };
        return { id: `n${i}` };
      });
      const elk = [{ id: 'g', isGroup: true, children, labelData: { width: 0 }, labels: [] }];
      return { elk, nodeDb, layoutState: { nodeDb } as any };
    }

    it('pulls a frame in to even padding when a routing lane inflated one side', () => {
      // The reported shape: nodes 100 wide sitting 24 from the left of the frame,
      // with the frame running 76 past their right because ELK held a lane there
      // for an edge routed back around the outside.
      const { elk, nodeDb, layoutState } = scene({ x: 0, y: 0, w: 200, h: 148 }, [
        [24, 48, 100, 76],
      ]);

      evenGroupFrames(elk, layoutState, new Map());

      const g = nodeDb.g;
      expect(g.offset.posX).toBe(0);
      expect(g.width).toBe(148); // 24 + 100 + 24
      // Top is deliberately untouched: it carries the subgraph's title strip.
      expect(g.offset.posY).toBe(0);
      expect(g.height).toBe(148); // 48 title strip + 76 + 24
    });

    it('leaves a frame alone when its padding is already even', () => {
      const { elk, nodeDb, layoutState } = scene({ x: 0, y: 0, w: 148, h: 148 }, [
        [24, 48, 100, 76],
      ]);

      evenGroupFrames(elk, layoutState, new Map());

      expect(nodeDb.g.width).toBe(148);
      expect(nodeDb.g.height).toBe(148);
    });

    it('never squeezes a frame narrower than its own title', () => {
      // A one-node group under a long title. Pulling in to the node would cut
      // the title off, so the floor wins it back.
      const { elk, nodeDb, layoutState } = scene({ x: 0, y: 0, w: 300, h: 148 }, [
        [24, 48, 40, 76],
      ]);
      elk[0].labelData = { width: 200 };

      evenGroupFrames(elk, layoutState, new Map());

      expect(nodeDb.g.width).toBe(200);
      // Centring on the node's midpoint at x=44 would want to start at -56, but
      // the frame is clamped to what ELK gave. Pulling a frame IN is the only
      // thing this pass may do — a title too wide for its own frame is ELK's to
      // size, and widening it here would paper over that.
      expect(nodeDb.g.offset.posX).toBe(0);
    });

    it('measures a parent against children it has already pulled in', () => {
      // Nested groups: the inner frame is inflated by 76 on the right and the
      // outer one wraps it. Going deepest-first means the outer frame measures
      // the tightened inner box, not the original.
      const nodeDb: Record<string, any> = {
        outer: {
          id: 'outer',
          isGroup: true,
          offset: { posX: 0, posY: 0 },
          width: 300,
          height: 220,
        },
        inner: {
          id: 'inner',
          isGroup: true,
          offset: { posX: 24, posY: 48 },
          width: 200,
          height: 148,
        },
        leaf: { id: 'leaf', offset: { posX: 48, posY: 96 }, width: 100, height: 76 },
      };
      const elk = [
        {
          id: 'outer',
          isGroup: true,
          labelData: { width: 0 },
          labels: [],
          children: [
            {
              id: 'inner',
              isGroup: true,
              labelData: { width: 0 },
              labels: [],
              children: [{ id: 'leaf' }],
            },
          ],
        },
      ];

      evenGroupFrames(elk, { nodeDb } as any, new Map());

      expect(nodeDb.inner.width).toBe(148); // 24 + 100 + 24
      expect(nodeDb.outer.width).toBe(196); // 24 + 148 + 24
    });

    it("keeps a frame around a lane belonging to the group's own interior", () => {
      // The nested case. An edge from inside C to a sibling of C is routed around
      // C: that lane is OUTSIDE C, so C is pulled in past it, but it is INSIDE P
      // and P must stay drawn around it. Measuring P from child boxes alone left
      // the edge running outside a group it never leaves.
      const nodeDb: Record<string, any> = {
        P: { id: 'P', isGroup: true, offset: { posX: 0, posY: 0 }, width: 400, height: 220 },
        C: { id: 'C', isGroup: true, offset: { posX: 24, posY: 48 }, width: 200, height: 148 },
        leaf: { id: 'leaf', offset: { posX: 48, posY: 96 }, width: 100, height: 76 },
        sib: { id: 'sib', offset: { posX: 260, posY: 96 }, width: 60, height: 76 },
      };
      const elk = [
        {
          id: 'P',
          isGroup: true,
          labelData: { width: 0 },
          labels: [],
          children: [
            {
              id: 'C',
              isGroup: true,
              labelData: { width: 0 },
              labels: [],
              children: [{ id: 'leaf' }],
            },
            { id: 'sib' },
          ],
        },
      ];
      // Routed out of `leaf`, around C at x=350, and back to `sib`. Sections sit
      // in P's coordinate space, so `calcOffset` resolves them against P.
      const graph = {
        edges: [
          {
            id: 'e',
            sources: ['leaf'],
            targets: ['sib'],
            sections: [
              {
                startPoint: { x: 148, y: 134 },
                bendPoints: [
                  { x: 350, y: 134 },
                  { x: 350, y: 60 },
                ],
                endPoint: { x: 260, y: 134 },
              },
            ],
          },
        ],
      };
      const layoutState = {
        nodeDb,
        parentLookupDb: { parentById: { leaf: 'C', C: 'P', sib: 'P' } },
      };

      evenGroupFrames(elk, layoutState as any, new Map(), graph as any);

      // C ignores the lane — it leaves C — and pulls in to its one child.
      expect(nodeDb.C.width).toBe(148);
      // P keeps it: the lane reaches x=350, so the frame runs to 350 + 24.
      expect(nodeDb.P.offset.posX + nodeDb.P.width).toBe(374);
    });

    it("leaves ELK's own origin readable after moving a frame", () => {
      // Edge sections resolve against the container's ORIGINAL origin, so moving
      // a frame must not overwrite it or every edge inside would shift with it.
      const nodeDb: Record<string, any> = {
        g: { id: 'g', isGroup: true, offset: { posX: 0, posY: 0 }, width: 200, height: 148 },
        n: { id: 'n', offset: { posX: 40, posY: 48 }, width: 100, height: 76 },
      };

      evenGroupFrames(
        [{ id: 'g', isGroup: true, labelData: { width: 0 }, labels: [], children: [{ id: 'n' }] }],
        { nodeDb } as any,
        new Map()
      );

      expect(nodeDb.g.offset.posX).toBe(16); // frame moved in to 40 - 24
      expect(nodeDb.g.elkOrigin).toEqual({ posX: 0, posY: 0 });
    });

    it('never grows a frame beyond what ELK sized it to', () => {
      // ELK sized the container around everything it put inside, so a measurement
      // here that wants MORE room means this pass got something wrong. Clamp
      // rather than trust it.
      const nodeDb: Record<string, any> = {
        g: { id: 'g', isGroup: true, offset: { posX: 0, posY: 0 }, width: 120, height: 148 },
        n: { id: 'n', offset: { posX: 10, posY: 48 }, width: 100, height: 76 },
      };

      evenGroupFrames(
        [{ id: 'g', isGroup: true, labelData: { width: 0 }, labels: [], children: [{ id: 'n' }] }],
        { nodeDb } as any,
        new Map()
      );

      // 10 - 24 would put the left edge at -14 and 110 + 24 the right at 134;
      // both are clamped back to the frame ELK gave.
      expect(nodeDb.g.offset.posX).toBe(0);
      expect(nodeDb.g.width).toBe(120);
    });

    it('paints the clamped frame, not the wider title, into the layout node', () => {
      // Every other test here passes an empty `nodeById`, so the branch that
      // writes the node the renderer actually paints from went uncovered — and
      // that is where the clamp was being undone.
      //
      // A 100-wide frame under a 200-wide title. The clamp refuses to widen the
      // frame, so the layout node must not report 200 either: `clusters.js`
      // sizes the painted rect from `node.width`, so a 200 here paints a frame
      // 100 units wider than ELK reserved.
      const nodeDb: Record<string, any> = {
        g: { id: 'g', isGroup: true, offset: { posX: 0, posY: 0 }, width: 100, height: 148 },
        n: { id: 'n', offset: { posX: 10, posY: 48 }, width: 40, height: 76 },
      };
      const layoutNode = { id: 'g', x: 0, y: 0, width: 0, height: 0 } as any;

      evenGroupFrames(
        [
          {
            id: 'g',
            isGroup: true,
            labelData: { width: 200 },
            labels: [],
            children: [{ id: 'n' }],
          },
        ],
        { nodeDb } as any,
        new Map([['g', layoutNode]])
      );

      expect(nodeDb.g.width).toBe(100);
      expect(layoutNode.width).toBe(100);
      expect(layoutNode.width).toBe(nodeDb.g.width);
    });

    it('still reports the honoured title floor when ELK left room for it', () => {
      // The other side of the same branch: here the 200-wide title fits inside
      // the 300 ELK gave, so the floor is honoured and the layout node carries
      // it. Without this the fix above could pass by always shrinking.
      const nodeDb: Record<string, any> = {
        g: { id: 'g', isGroup: true, offset: { posX: 0, posY: 0 }, width: 300, height: 148 },
        n: { id: 'n', offset: { posX: 24, posY: 48 }, width: 40, height: 76 },
      };
      const layoutNode = { id: 'g', x: 0, y: 0, width: 0, height: 0 } as any;

      evenGroupFrames(
        [
          {
            id: 'g',
            isGroup: true,
            labelData: { width: 200 },
            labels: [],
            children: [{ id: 'n' }],
          },
        ],
        { nodeDb } as any,
        new Map([['g', layoutNode]])
      );

      expect(nodeDb.g.width).toBe(200);
      expect(layoutNode.width).toBe(200);
    });

    it('skips a group with no children rather than collapsing it', () => {
      const nodeDb: Record<string, any> = {
        g: { id: 'g', isGroup: true, offset: { posX: 0, posY: 0 }, width: 200, height: 100 },
      };

      evenGroupFrames([{ id: 'g', isGroup: true, children: [] }], { nodeDb } as any, new Map());

      expect(nodeDb.g.width).toBe(200);
      expect(nodeDb.g.height).toBe(100);
    });
  });
});

describe('resolveElkPreset', () => {
  it('breaks cycles depth first by default', () => {
    // Depth-first took over as the default because it gives shorter back edges
    // on graphs that loop; the greedy-model-order triple it displaced is still
    // reachable, under its own name.
    expect(resolveElkPreset(undefined).cycleBreaking).toBe('DEPTH_FIRST');
    expect(resolveElkPreset('default').cycleBreaking).toBe('DEPTH_FIRST');
    expect(resolveElkPreset('modelOrder').cycleBreaking).toBe('GREEDY_MODEL_ORDER');
    expect(resolveElkPreset('legacy').cycleBreaking).toBe('GREEDY');
  });

  it('keeps depthFirst as a name for what default already is', () => {
    // Not a distinct combination — a label, so a diagram can say depth-first
    // rather than depend on the default staying put.
    expect(resolveElkPreset('depthFirst')).toEqual(resolveElkPreset('default'));
  });

  it('differs from default in cycle breaking alone for modelOrder', () => {
    const { cycleBreaking: _a, ...restDefault } = resolveElkPreset('default');
    const { cycleBreaking: _b, ...restModelOrder } = resolveElkPreset('modelOrder');
    expect(restModelOrder).toEqual(restDefault);
  });

  it('falls back to default for an unknown name, including __proto__', () => {
    expect(resolveElkPreset('nope')).toEqual(resolveElkPreset('default'));
    expect(resolveElkPreset('__proto__')).toEqual(resolveElkPreset('default'));
  });
});
