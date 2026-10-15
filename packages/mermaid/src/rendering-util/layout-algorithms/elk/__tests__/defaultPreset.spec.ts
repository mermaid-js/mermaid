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
