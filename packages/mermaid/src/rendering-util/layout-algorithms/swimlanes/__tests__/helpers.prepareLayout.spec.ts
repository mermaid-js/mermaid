import { describe, it, expect } from 'vitest';
import type { LayoutData } from '../../../types.js';
import { DEFAULT_SWIMLANE_ID, prepareLayoutForSwimlanes } from '../helpers.js';

describe('prepareLayoutForSwimlanes', () => {
  it('marks group nodes with swimlane cluster shape', () => {
    const layout: LayoutData = {
      nodes: [{ id: 'g1', isGroup: true } as any, { id: 'n1', isGroup: false } as any],
      edges: [],
      // The rest of the properties are not used by prepareLayoutForSwimlanes
      // and can be safely mocked for this unit test.
      config: {} as any,
    };

    prepareLayoutForSwimlanes(layout);

    expect(layout.nodes[0].shape).toBe('swimlane');
    expect((layout.nodes[1] as any).shape).toBeUndefined();
  });

  it('assigns ungrouped content nodes to a synthetic default lane', () => {
    const layout: LayoutData = {
      nodes: [
        { id: 'lane1', isGroup: true } as any,
        { id: 'grouped', isGroup: false, parentId: 'lane1' } as any,
        { id: 'loose', isGroup: false } as any,
      ],
      edges: [],
      config: {} as any,
    };

    prepareLayoutForSwimlanes(layout);

    const defaultLane = layout.nodes.find((node) => node.id === DEFAULT_SWIMLANE_ID);
    const loose = layout.nodes.find((node) => node.id === 'loose');
    const grouped = layout.nodes.find((node) => node.id === 'grouped');

    expect(defaultLane).toMatchObject({
      id: DEFAULT_SWIMLANE_ID,
      isGroup: true,
      shape: 'swimlane',
    });
    expect(loose?.parentId).toBe(DEFAULT_SWIMLANE_ID);
    expect(grouped?.parentId).toBe('lane1');
  });

  it('only treats top-level groups as swimlane lanes', () => {
    const layout: LayoutData = {
      nodes: [
        { id: 'lane1', isGroup: true } as any,
        { id: 'nested', isGroup: true, parentId: 'lane1', shape: 'rect' } as any,
        { id: 'child', isGroup: false, parentId: 'nested' } as any,
      ],
      edges: [],
      config: {} as any,
    };

    prepareLayoutForSwimlanes(layout);

    const lane = layout.nodes.find((node) => node.id === 'lane1');
    const nested = layout.nodes.find((node) => node.id === 'nested');

    expect(lane?.shape).toBe('swimlane');
    expect(nested?.shape).toBe('rect');
  });
});
