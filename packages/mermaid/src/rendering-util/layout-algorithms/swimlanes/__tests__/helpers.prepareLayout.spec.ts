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

  // Neither omission fails loudly: no `look` renders classic in a handDrawn diagram, and
  // slot 0 collides with the first declared lane.
  it('gives the synthetic default lane the diagram look and a free colour slot', () => {
    const layout: LayoutData = {
      nodes: [
        { id: 'lane1', isGroup: true, colorIndex: 0, look: 'handDrawn' } as any,
        { id: 'nested', isGroup: true, parentId: 'lane1', colorIndex: 1 } as any,
        { id: 'lane2', isGroup: true, colorIndex: 2, look: 'handDrawn' } as any,
        { id: 'loose', isGroup: false } as any,
      ],
      edges: [],
      config: { look: 'handDrawn' } as any,
    };

    prepareLayoutForSwimlanes(layout);

    const defaultLane = layout.nodes.find((node) => node.id === DEFAULT_SWIMLANE_ID);

    expect(defaultLane?.look).toBe('handDrawn');
    // One past the highest slot handed out.
    expect(defaultLane?.colorIndex).toBe(3);
  });

  it('starts the default lane at slot 0 when no container carries a colour slot', () => {
    const layout: LayoutData = {
      nodes: [{ id: 'loose', isGroup: false } as any],
      edges: [],
      config: {} as any,
    };

    prepareLayoutForSwimlanes(layout);

    const defaultLane = layout.nodes.find((node) => node.id === DEFAULT_SWIMLANE_ID);

    expect(defaultLane?.colorIndex).toBe(0);
    expect(defaultLane?.look).toBeUndefined();
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
