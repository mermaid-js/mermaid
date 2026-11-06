import { describe, expect, it } from 'vitest';
import ELK, { type ELK as ElkInstance, type ElkNode } from 'elkjs/lib/elk.bundled.js';
import { buildElkGraphFromLayoutData } from '../render.js';

const context = {
  algorithm: 'elk.layered',
  common: { lineBreakRegex: /<br\s*\/?>/gi },
  getConfig: () => ({ flowchart: { wrappingWidth: 200 } }),
  interpolateToCurve: (curve: unknown) => curve,
  log: {
    debug: () => undefined,
    error: () => undefined,
    info: () => undefined,
    warn: () => undefined,
  },
} as any;

const measuredData = (direction: string, nested: boolean) =>
  ({
    direction,
    config: { elk: { mergeEdges: false } },
    nodes: [
      ...(nested ? [{ id: 'group', isGroup: true, label: 'Group', padding: 8 }] : []),
      ...['start', 'Ready', 'end'].map((id) => ({
        id,
        label: id,
        isGroup: false,
        width: id === 'Ready' ? 136 : 14,
        height: id === 'Ready' ? 40 : 14,
        ...(nested ? { parentId: 'group' } : {}),
      })),
    ],
    edges: [
      { id: 'in', start: 'start', end: 'Ready' },
      {
        id: 'first',
        start: 'Ready',
        end: 'Ready',
        label: 'send (subscribe)',
        width: 116,
        height: 24,
      },
      {
        id: 'second',
        start: 'Ready',
        end: 'Ready',
        label: 'receive + notify observers',
        width: 186,
        height: 24,
      },
      { id: 'out', start: 'Ready', end: 'end' },
    ],
  }) as any;

describe('ELK self-loop distribution (#8706)', () => {
  it.each(['TB', 'LR'])('separates two labeled self-loops with %s layout', async (direction) => {
    const state = buildElkGraphFromLayoutData(measuredData(direction, false), context);
    // elkjs exposes a CommonJS constructor whose declaration is a default export.
    const ElkConstructor = ELK as unknown as new () => ElkInstance;
    const graph: ElkNode = await new ElkConstructor().layout<ElkNode>(state.elkGraph);
    const node = graph.children!.find((n) => n.id === 'Ready')!;
    const loops = graph.edges!.filter((e) => e.id === 'first' || e.id === 'second');
    const axis = direction === 'TB' ? 'x' : 'y';
    const center = node[axis]! + (axis === 'x' ? node.width! : node.height!) / 2;
    const sides = loops.map((edge) => Math.sign(edge.sections![0].startPoint[axis] - center));
    expect(sides.sort()).toEqual([-1, 1]);
  });

  it('sets the distribution on a nested loop node and preserves its other options', () => {
    const data = measuredData('TB', true);
    data.nodes.find((n: any) => n.id === 'Ready').layoutOptions = {
      'elk.portAlignment.default': 'CENTER',
    };
    const state = buildElkGraphFromLayoutData(data, context);
    expect(state.nodeDb.Ready.layoutOptions).toMatchObject({
      'elk.layered.edgeRouting.selfLoopDistribution': 'EQUALLY',
      'elk.portAlignment.default': 'CENTER',
    });
  });

  it('preserves an explicit node-level self-loop distribution', () => {
    const data = measuredData('TB', false);
    data.nodes[1].layoutOptions = { 'elk.layered.edgeRouting.selfLoopDistribution': 'NORTH' };
    const state = buildElkGraphFromLayoutData(data, context);
    expect(state.nodeDb.Ready.layoutOptions!['elk.layered.edgeRouting.selfLoopDistribution']).toBe(
      'NORTH'
    );
  });
});
