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
    ['legacy', 'BRANDES_KOEPF', 'GREEDY', 'GREEDY'],
    ['modelOrder', 'NETWORK_SIMPLEX', 'GREEDY_MODEL_ORDER', 'DEPTH_FIRST'],
    ['depthFirst', 'NETWORK_SIMPLEX', 'DEPTH_FIRST', 'DEPTH_FIRST'],
  ] as const)('preserves the %s preset', (preset, placement, cycleBreaking, groupCycleBreaking) => {
    const { elkGraph, nodeDb } = graphFor({ preset });
    expect(elkGraph.layoutOptions['elk.layered.nodePlacement.strategy']).toBe(placement);
    expect(nodeDb.group.layoutOptions?.['elk.layered.nodePlacement.strategy']).toBe(
      'BRANDES_KOEPF'
    );
    expect(elkGraph.layoutOptions['elk.layered.layering.strategy']).toBe('NETWORK_SIMPLEX');
    expect(elkGraph.layoutOptions['elk.layered.cycleBreaking.strategy']).toBe(cycleBreaking);
    expect(nodeDb.group.layoutOptions?.['elk.layered.cycleBreaking.strategy']).toBe(
      groupCycleBreaking
    );
    for (const options of [elkGraph.layoutOptions, nodeDb.group.layoutOptions]) {
      expect(options?.['elk.layered.nodePlacement.bk.fixedAlignment']).toBe('NONE');
    }
  });

  it.each(['MODEL_ORDER', 'GREEDY_MODEL_ORDER'] as const)(
    'keeps %s off a subgraph laid out with the root',
    (cycleBreakingStrategy) => {
      const { elkGraph, nodeDb } = graphFor({ cycleBreakingStrategy });
      expect(elkGraph.layoutOptions['elk.layered.cycleBreaking.strategy']).toBe(
        cycleBreakingStrategy
      );
      expect(nodeDb.group.layoutOptions?.['elk.layered.cycleBreaking.strategy']).toBe(
        'DEPTH_FIRST'
      );
    }
  );

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

describe('model order cycle breaking with subgraphs', () => {
  const node = (id: string, parentId: string) => ({
    id,
    parentId,
    label: id,
    width: 40,
    height: 40,
  });
  const group = (id: string, dir?: string) => ({ id, isGroup: true, label: id, padding: 8, dir });
  const edge = (id: string, start: string, end: string) => ({ id, start, end, label: '' });
  const layout = async (elk: MermaidConfig['elk'], nodes: any[], edges: any[]) => {
    mermaidAPI.initialize({ elk });
    const data = { nodes, edges, direction: 'TB', config: getConfig() } as any;
    await runElkLayoutCore(data, {
      helpers: context,
      options: { algorithm: 'elk.layered' },
    } as any);
    return data;
  };

  it('lays out a subgraph linked to another subgraph with MODEL_ORDER', async () => {
    const data = await layout(
      { cycleBreakingStrategy: 'MODEL_ORDER' },
      [group('S1'), node('a', 'S1'), node('b', 'S1'), group('S2'), node('c', 'S2')],
      [edge('e1', 'a', 'b'), edge('e2', 'a', 'c')]
    );
    expect(data.edges.every((e: any) => e.points?.length)).toBe(true);
  });

  it('lays out a cycle inside a subgraph with the modelOrder preset', async () => {
    const data = await layout(
      { preset: 'modelOrder' },
      [group('S'), node('a', 'S'), node('b', 'S'), node('c', 'S')],
      [edge('e1', 'a', 'b'), edge('e2', 'b', 'c'), edge('e3', 'c', 'a')]
    );
    expect(data.edges.every((e: any) => e.points?.length)).toBe(true);
  });

  it('keeps MODEL_ORDER on a subgraph with its own direction', () => {
    mermaidAPI.initialize({ elk: { cycleBreakingStrategy: 'MODEL_ORDER' } });
    const { nodeDb } = buildElkGraphFromLayoutData(
      {
        direction: 'TB',
        config: getConfig(),
        edges: [],
        nodes: [group('S', 'TB'), node('a', 'S')],
      } as any,
      context
    );
    expect(nodeDb.S.layoutOptions?.['elk.layered.cycleBreaking.strategy']).toBe('MODEL_ORDER');
  });
});
