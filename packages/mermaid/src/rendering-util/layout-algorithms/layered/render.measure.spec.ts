import { describe, expect, it, vi } from 'vitest';
import type * as Common from '../common/index.js';

const defined = vi.hoisted(() => ({
  definition: undefined as Parameters<typeof Common.createCommonLayoutRenderer>[0] | undefined,
  measure: vi.fn(),
}));
vi.mock('../common/index.js', () => ({
  clearLayoutRenderState: vi.fn(),
  createCommonLayoutRenderer: (definition: typeof defined.definition) => {
    defined.definition = definition;
    return vi.fn();
  },
  defaultMeasureLayout: defined.measure,
}));

import { applyLayeredLineJumps } from './lineHops.js';
import './render.js';

describe('layered renderer: measuring', () => {
  // `insertCluster` paints a plain subgraph title on one line. Measured wrapped (at
  // `flowchart.wrappingWidth`), a long title is wider than the box the engine sizes for it.
  it('measures subgraph titles unwrapped, as they are painted', async () => {
    const data = { nodes: [], edges: [] };
    const context = { element: {} };
    defined.measure.mockResolvedValue('measured');

    const result = await defined.definition!.measureLayout!(data as never, context as never);

    expect(result).toBe('measured');
    expect(defined.measure).toHaveBeenCalledWith(data, context, { unwrapGroupLabels: true });
  });
});

// Issue #8835: crossings get hops once every edge is drawn, as ELK draws them.
describe('layered renderer: edge crossings', () => {
  it('draws line hops after painting', () => {
    expect(defined.definition!.afterPaint).toBe(applyLayeredLineJumps);
  });
});

// Issue #8821: subgraphs are painted in turn, each one's filled box over what came before, so a
// subgraph listed after the ones inside it would hide them.
describe('layered renderer: painting subgraphs', () => {
  const item = (id: string, isGroup: boolean, parentId?: string) => ({ id, isGroup, parentId });
  const order = (nodes: ReturnType<typeof item>[]): string[] => {
    const getNodes = defined.definition!.paintOptions?.getNodes;
    expect(getNodes).toBeDefined();
    return [...getNodes!({ nodes, edges: [] } as never, {} as never)].map((n) => n.id);
  };

  it('paints each subgraph before the subgraphs inside it', () => {
    // As flowchart lists `O` holds `A` holds `B`, declared B, A, then O.
    const painted = order([
      item('A', true, 'O'),
      item('B', true, 'A'),
      item('O', true),
      item('b', false, 'A'),
      item('a', false, 'A'),
      item('c', false, 'B'),
    ]);

    expect(painted.indexOf('O')).toBeLessThan(painted.indexOf('A'));
    expect(painted.indexOf('A')).toBeLessThan(painted.indexOf('B'));
    expect(painted).toHaveLength(6);
  });

  it('keeps the given order otherwise', () => {
    const painted = order([
      item('x', false),
      item('P', true),
      item('y', false, 'P'),
      item('Q', true),
      item('R', true, 'P'),
      item('z', false),
    ]);
    const groups = new Set(['P', 'Q', 'R']);

    // Subgraphs at one depth, and the other nodes, each in the order given.
    expect(painted.filter((id) => groups.has(id))).toEqual(['P', 'Q', 'R']);
    expect(painted.filter((id) => !groups.has(id))).toEqual(['x', 'y', 'z']);
    expect(painted).toHaveLength(6);
  });

  it('paints a subgraph whose parent is not a subgraph at the top, and stops on a loop', () => {
    expect(order([item('A', true, 'B'), item('B', true, 'A'), item('C', true, 'missing')])).toEqual(
      ['C', 'A', 'B']
    );
  });
});
