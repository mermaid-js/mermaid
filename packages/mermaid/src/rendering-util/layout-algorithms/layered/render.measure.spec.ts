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
