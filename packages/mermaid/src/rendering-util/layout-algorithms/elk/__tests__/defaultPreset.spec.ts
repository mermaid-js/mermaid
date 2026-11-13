import { afterEach, describe, expect, it } from 'vitest';
import mermaidAPI from '../../../../mermaidAPI.js';
import { getConfig } from '../../../../config.js';
import type { MermaidConfig } from '../../../../config.type.js';
import { buildElkGraphFromLayoutData, runElkLayoutCore } from '../render.js';

const log = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};
const context = {
  algorithm: 'elk.layered',
  common: { lineBreakRegex: /<br\s*\/?>/gi },
  getConfig,
  interpolateToCurve: (curve: unknown) => curve,
  log,
} as any;

afterEach(() => mermaidAPI.initialize({}));

const graphFor = (elk?: MermaidConfig['elk']) => {
  mermaidAPI.initialize(elk ? { elk } : {});
  return buildElkGraphFromLayoutData(
    {
      direction: 'TB',
      config: getConfig(),
      edges: [],
      nodes: [
        { id: 'group', isGroup: true, label: 'Group', padding: 8 },
        { id: 'child', parentId: 'group', label: 'Child', width: 100, height: 40 },
      ],
    } as any,
    context
  );
};

describe('ELK preset configuration through initialize', () => {
  it.each([undefined, 'default'] as const)('centers omitted/default preset (%s)', (preset) => {
    const { elkGraph, nodeDb } = graphFor(preset ? { preset } : undefined);
    for (const options of [elkGraph.layoutOptions, nodeDb.group.layoutOptions]) {
      expect(options?.['elk.layered.nodePlacement.strategy']).toBe('BRANDES_KOEPF');
      expect(options?.['elk.layered.nodePlacement.bk.fixedAlignment']).toBe('BALANCED');
    }
  });

  it.each([
    ['legacy', 'BRANDES_KOEPF', 'GREEDY'],
    ['modelOrder', 'NETWORK_SIMPLEX', 'GREEDY_MODEL_ORDER'],
    ['depthFirst', 'NETWORK_SIMPLEX', 'DEPTH_FIRST'],
  ] as const)('preserves the %s preset', (preset, placement, cycleBreaking) => {
    const { elkGraph, nodeDb } = graphFor({ preset });
    expect(elkGraph.layoutOptions['elk.layered.nodePlacement.strategy']).toBe(placement);
    expect(nodeDb.group.layoutOptions?.['elk.layered.nodePlacement.strategy']).toBe(
      'BRANDES_KOEPF'
    );
    expect(elkGraph.layoutOptions['elk.layered.layering.strategy']).toBe('NETWORK_SIMPLEX');
    for (const options of [elkGraph.layoutOptions, nodeDb.group.layoutOptions]) {
      expect(options?.['elk.layered.nodePlacement.bk.fixedAlignment']).toBe('NONE');
      expect(options?.['elk.layered.cycleBreaking.strategy']).toBe(cycleBreaking);
    }
  });

  it.each(['default', 'legacy', 'modelOrder', 'depthFirst'] as const)(
    'honors explicit placement and NONE alignment with %s',
    (preset) => {
      const { elkGraph, nodeDb } = graphFor({
        preset,
        nodePlacementStrategy: 'SIMPLE',
        nodePlacementAlignment: 'NONE',
      });
      for (const options of [elkGraph.layoutOptions, nodeDb.group.layoutOptions]) {
        expect(options?.['elk.layered.nodePlacement.strategy']).toBe('SIMPLE');
        expect(options?.['elk.layered.nodePlacement.bk.fixedAlignment']).toBe('NONE');
      }
    }
  );

  it('allows alignment to be overridden without replacing default placement', () => {
    const { elkGraph, nodeDb } = graphFor({ nodePlacementAlignment: 'LEFTUP' });
    for (const options of [elkGraph.layoutOptions, nodeDb.group.layoutOptions]) {
      expect(options?.['elk.layered.nodePlacement.strategy']).toBe('BRANDES_KOEPF');
      expect(options?.['elk.layered.nodePlacement.bk.fixedAlignment']).toBe('LEFTUP');
    }
  });

  it('passes layeringLayerBound to the root', () => {
    const { elkGraph } = graphFor({ layeringLayerBound: 2 });
    expect(elkGraph.layoutOptions['elk.layered.layering.coffmanGraham.layerBound']).toBe(2);
  });
});

describe('ELK graph wrapping configuration', () => {
  it('leaves wrapping and aspect ratio unset by default', () => {
    const { elkGraph, nodeDb } = graphFor();
    for (const options of [elkGraph.layoutOptions, nodeDb.group.layoutOptions]) {
      expect(options?.['elk.layered.wrapping.strategy']).toBeUndefined();
      expect(options?.['elk.aspectRatio']).toBeUndefined();
    }
  });

  it('passes wrappingStrategy and aspectRatio to the root and to layered containers', () => {
    const { elkGraph, nodeDb } = graphFor({ wrappingStrategy: 'MULTI_EDGE', aspectRatio: 1.78 });
    for (const options of [elkGraph.layoutOptions, nodeDb.group.layoutOptions]) {
      expect(options?.['elk.layered.wrapping.strategy']).toBe('MULTI_EDGE');
      expect(options?.['elk.aspectRatio']).toBe(1.78);
    }
  });

  const chainLength = 10;
  const targetAspectRatio = 1.78;
  const chain = (parentId?: string) => ({
    nodes: [
      ...(parentId ? [{ id: parentId, isGroup: true, label: parentId, padding: 8 }] : []),
      ...Array.from({ length: chainLength }, (_, i) => ({
        id: `n${i}`,
        parentId,
        isGroup: false,
        label: `n${i}`,
        shape: 'rect',
        padding: 8,
        width: 150,
        height: 80,
      })),
    ],
    edges: Array.from({ length: chainLength - 1 }, (_, i) => ({
      id: `e${i}`,
      start: `n${i}`,
      end: `n${i + 1}`,
      label: `step ${i}`,
      width: 60,
      height: 24,
    })),
  });
  const aspectRatioOf = (nodes: { x: number; y: number; width: number; height: number }[]) => {
    const left = Math.min(...nodes.map((n) => n.x - n.width / 2));
    const right = Math.max(...nodes.map((n) => n.x + n.width / 2));
    const top = Math.min(...nodes.map((n) => n.y - n.height / 2));
    const bottom = Math.max(...nodes.map((n) => n.y + n.height / 2));
    return (right - left) / (bottom - top);
  };
  const layOut = async (elk: MermaidConfig['elk'], parentId?: string) => {
    mermaidAPI.initialize({ elk });
    const data = { ...chain(parentId), direction: 'LR', config: getConfig() } as any;
    await runElkLayoutCore(data, {
      helpers: context,
      options: { algorithm: 'elk.layered' },
    } as any);
    return aspectRatioOf(data.nodes.filter((node: { isGroup: boolean }) => !node.isGroup));
  };

  it.each([undefined, 'group'])(
    'folds a long left-to-right chain into rows with MULTI_EDGE (parent: %s)',
    async (parentId) => {
      const strip = await layOut({}, parentId);
      const wrapped = await layOut(
        { wrappingStrategy: 'MULTI_EDGE', aspectRatio: targetAspectRatio },
        parentId
      );
      expect(strip).toBeGreaterThan(chainLength);
      expect(wrapped).toBeLessThan(strip / 2);
    }
  );

  const stepCount = 4;
  const framedChain = () => ({
    nodes: Array.from({ length: stepCount }, (_, i) => [
      { id: `s${i}`, isGroup: true, label: `Step ${i}`, padding: 8, labels: [{ height: 22 }] },
      {
        id: `n${i}`,
        parentId: `s${i}`,
        isGroup: false,
        label: `n${i}`,
        shape: 'rect',
        padding: 8,
        width: 152,
        height: 72,
      },
    ]).flat(),
    edges: Array.from({ length: stepCount - 1 }, (_, i) => ({
      id: `e${i}`,
      start: `n${i}`,
      end: `n${i + 1}`,
      label: `handover ${i}`,
      width: 90,
      height: 24,
    })),
  });
  const layOutFramedChain = async (elk: MermaidConfig['elk']) => {
    mermaidAPI.initialize({ elk });
    const data = { ...framedChain(), direction: 'LR', config: getConfig() } as any;
    await runElkLayoutCore(data, {
      helpers: context,
      options: { algorithm: 'elk.layered' },
    } as any);
    return aspectRatioOf(data.nodes.filter((node: { isGroup: boolean }) => node.isGroup));
  };

  it.each([
    [1, 0.8],
    [2, 1.2],
  ])(
    'folds a chain of framed steps towards aspectRatio %s rather than into one column',
    async (aspectRatio, atLeast) => {
      const ratio = await layOutFramedChain({ wrappingStrategy: 'MULTI_EDGE', aspectRatio });
      expect(ratio).toBeGreaterThan(atLeast);
    }
  );

  const boxContainerAspectRatio = '2.0';
  const boxContainer = (crossEdge: boolean) => {
    mermaidAPI.initialize({ elk: { wrappingStrategy: 'MULTI_EDGE', aspectRatio: 3 } });
    return buildElkGraphFromLayoutData(
      {
        direction: 'TB',
        config: getConfig(),
        edges: crossEdge ? [{ id: 'e0', start: 'outside', end: 'child' }] : [],
        nodes: [
          {
            id: 'group',
            isGroup: true,
            label: 'Group',
            padding: 8,
            metadata: { algorithm: 'elk.box' },
          },
          { id: 'child', parentId: 'group', label: 'Child', width: 100, height: 40 },
          { id: 'outside', label: 'Outside', width: 100, height: 40 },
        ],
      } as any,
      context
    ).nodeDb.group.layoutOptions;
  };

  it('keeps the container algorithm and its own aspect ratio without a cross-boundary edge', () => {
    const options = boxContainer(false);
    expect(options?.['elk.algorithm']).toBe('elk.box');
    expect(options?.['elk.aspectRatio']).toBe(boxContainerAspectRatio);
  });

  it('restores the configured aspect ratio on a container that falls back to layered', () => {
    const options = boxContainer(true);
    expect(options?.['elk.algorithm']).toBeUndefined();
    expect(options?.['elk.layered.wrapping.strategy']).toBe('MULTI_EDGE');
    expect(options?.['elk.aspectRatio']).toBe(3);
  });

  it.each([
    [undefined, '1.6'],
    [4, 4],
  ])('gives a rectpacking root the aspect ratio %s as %s', (aspectRatio, expected) => {
    mermaidAPI.initialize({ elk: { aspectRatio } });
    const { elkGraph } = buildElkGraphFromLayoutData(
      { direction: 'TB', config: getConfig(), edges: [], nodes: [] } as any,
      { ...context, algorithm: 'elk.rectpacking' }
    );
    expect(elkGraph.layoutOptions['elk.aspectRatio']).toBe(expected);
  });

  it('falls back to the default aspect ratios when the config has no elk section', () => {
    const { elkGraph, nodeDb } = buildElkGraphFromLayoutData(
      {
        direction: 'TB',
        config: {},
        edges: [{ id: 'e0', start: 'outside', end: 'child' }],
        nodes: [
          { id: 'group', isGroup: true, label: 'Group', metadata: { algorithm: 'elk.box' } },
          { id: 'child', parentId: 'group', label: 'Child', width: 100, height: 40 },
          { id: 'outside', label: 'Outside', width: 100, height: 40 },
        ],
      } as any,
      { ...context, algorithm: 'elk.rectpacking' }
    );
    expect(elkGraph.layoutOptions['elk.aspectRatio']).toBe('1.6');
    expect(nodeDb.group.layoutOptions).not.toHaveProperty('elk.aspectRatio');
  });

  const nestedEmptySubgraphs = () => ({
    direction: 'LR',
    config: getConfig(),
    edges: [],
    nodes: [
      { id: 'outer', isGroup: true, label: 'Outer', padding: 8 },
      { id: 'inner', parentId: 'outer', isGroup: true, label: 'Inner', padding: 8 },
    ],
  });

  it('leaves the wrapping correction unset for nested empty subgraphs', () => {
    mermaidAPI.initialize({ elk: { wrappingStrategy: 'MULTI_EDGE', aspectRatio: 2 } });
    const { elkGraph } = buildElkGraphFromLayoutData(nestedEmptySubgraphs() as any, context);
    expect(elkGraph.layoutOptions).not.toHaveProperty('elk.layered.wrapping.correctionFactor');
  });

  it('sets a finite wrapping correction above 1 for a chain of framed steps', () => {
    mermaidAPI.initialize({ elk: { wrappingStrategy: 'MULTI_EDGE', aspectRatio: 2 } });
    const { elkGraph } = buildElkGraphFromLayoutData(
      { ...framedChain(), direction: 'LR', config: getConfig() } as any,
      context
    );
    const factor = elkGraph.layoutOptions['elk.layered.wrapping.correctionFactor'];
    expect(Number.isFinite(factor) && factor > 1).toBe(true);
  });
});

// Measurements from the courier-font TV/Console fixture. Run the real ELK core;
// assert the visible attachment relationship rather than exact layout coordinates.
const compositeFixture = {
  nodes: [
    {
      id: 'root_start',
      isGroup: false,
      label: 'root_start',
      shape: 'stateStart',
      padding: 8,
      width: 14,
      height: 14,
    },
    {
      id: 'TV',
      isGroup: true,
      label: 'TV',
      shape: 'roundedWithTitle',
      dir: 'TB',
      padding: 8,
      labelBBox: {
        width: 19.203125,
        height: 24,
      },
    },
    {
      id: 'TV_start',
      parentId: 'TV',
      isGroup: false,
      label: 'TV_start',
      shape: 'stateStart',
      padding: 8,
      width: 14,
      height: 14,
    },
    {
      id: 'Off',
      parentId: 'TV',
      isGroup: false,
      label: 'Off',
      shape: 'roundedRect',
      padding: 8,
      width: 136,
      height: 40,
    },
    {
      id: 'On',
      parentId: 'TV',
      isGroup: false,
      label: 'On',
      shape: 'roundedRect',
      padding: 8,
      width: 136,
      height: 40,
    },
    {
      id: 'Console',
      isGroup: true,
      label: 'Console',
      shape: 'roundedWithTitle',
      dir: 'TB',
      padding: 8,
      labelBBox: {
        width: 67.21875,
        height: 24,
      },
    },
    {
      id: 'Console_start',
      parentId: 'Console',
      isGroup: false,
      label: 'Console_start',
      shape: 'stateStart',
      padding: 8,
      width: 14,
      height: 14,
    },
    {
      id: 'Off2',
      parentId: 'Console',
      isGroup: false,
      label: 'Off2',
      shape: 'roundedRect',
      padding: 8,
      width: 136,
      height: 40,
    },
    {
      id: 'On2',
      parentId: 'Console',
      isGroup: false,
      label: 'On2',
      shape: 'roundedRect',
      padding: 8,
      width: 136,
      height: 40,
    },
    {
      id: 'Playing',
      parentId: 'Console',
      isGroup: true,
      label: 'Playing',
      shape: 'roundedWithTitle',
      dir: 'TB',
      padding: 8,
      labelBBox: {
        width: 67.21875,
        height: 24,
      },
    },
    {
      id: 'Alive',
      parentId: 'Playing',
      isGroup: false,
      label: 'Alive',
      shape: 'roundedRect',
      padding: 8,
      width: 136,
      height: 40,
    },
    {
      id: 'Dead',
      parentId: 'Playing',
      isGroup: false,
      label: 'Dead',
      shape: 'roundedRect',
      padding: 8,
      width: 136,
      height: 40,
    },
  ],
  edges: [
    {
      id: 'edge0',
      start: 'root_start',
      end: 'TV',
      label: '',
      arrowTypeEnd: 'arrow_barb',
    },
    {
      id: 'edge1',
      start: 'TV_start',
      end: 'Off',
      label: 'Off to start with',
      width: 163.234375,
      height: 24,
      arrowTypeEnd: 'arrow_barb',
    },
    {
      id: 'edge2',
      start: 'On',
      end: 'Off',
      label: 'Turn off',
      width: 76.8125,
      height: 24,
      arrowTypeEnd: 'arrow_barb',
    },
    {
      id: 'edge3',
      start: 'Off',
      end: 'On',
      label: 'Turn on',
      width: 67.21875,
      height: 24,
      arrowTypeEnd: 'arrow_barb',
    },
    {
      id: 'edge4',
      start: 'TV',
      end: 'Console',
      label: '',
      arrowTypeEnd: 'arrow_barb',
    },
    {
      id: 'edge5',
      start: 'Console_start',
      end: 'Off2',
      label: 'Off to start with',
      width: 163.234375,
      height: 24,
      arrowTypeEnd: 'arrow_barb',
    },
    {
      id: 'edge6',
      start: 'On2',
      end: 'Off2',
      label: 'Turn off',
      width: 76.8125,
      height: 24,
      arrowTypeEnd: 'arrow_barb',
    },
    {
      id: 'edge7',
      start: 'Off2',
      end: 'On2',
      label: 'Turn on',
      width: 67.21875,
      height: 24,
      arrowTypeEnd: 'arrow_barb',
    },
    {
      id: 'edge8',
      start: 'On2',
      end: 'Playing',
      label: '',
      arrowTypeEnd: 'arrow_barb',
    },
    {
      id: 'edge9',
      start: 'Alive',
      end: 'Dead',
      label: '',
      arrowTypeEnd: 'arrow_barb',
    },
    {
      id: 'edge10',
      start: 'Dead',
      end: 'Alive',
      label: '',
      arrowTypeEnd: 'arrow_barb',
    },
  ],
};

it('centers the initial transition to TV with defaults and keeps the entry straight', async () => {
  mermaidAPI.initialize({});
  const data = {
    ...structuredClone(compositeFixture),
    direction: 'TB',
    config: getConfig(),
  } as any;
  await runElkLayoutCore(data, { helpers: context, options: { algorithm: 'elk.layered' } } as any);
  const tv = data.nodes.find((node: any) => node.id === 'TV');
  const start = data.nodes.find((node: any) => node.id === 'root_start');
  const points = data.edges.find((edge: any) => edge.start === 'root_start').points;
  // Frame trimming moves the painted midpoint slightly after ELK routing.
  expect(Math.abs(points.at(-1).x - tv.x)).toBeLessThan(2);
  expect(start.x).toBeCloseTo(points[0].x, 3);
  for (const point of points) {
    expect(point.x).toBeCloseTo(points[0].x, 3);
  }
});
