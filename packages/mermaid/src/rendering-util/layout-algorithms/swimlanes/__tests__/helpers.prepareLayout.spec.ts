import { afterEach, describe, it, expect, vi } from 'vitest';
import { log } from '../../../../logger.js';
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

describe('prepareLayoutForSwimlanes lane lint', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const shared = { node: 'a', keptBy: 'lane1', droppedFrom: 'phase1' };
  const layoutWith = (nodes: object[], extra: Partial<LayoutData> = {}): LayoutData => ({
    nodes: nodes as LayoutData['nodes'],
    edges: [],
    config: {},
    ...extra,
  });
  const ids = (layout: LayoutData) => layout.nodes.map((node) => node.id);

  it('warns about a node listed in two lanes and removes the lane it emptied', () => {
    const warn = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
    const layout = layoutWith(
      [
        { id: 'lane1', isGroup: true },
        { id: 'phase1', isGroup: true },
        { id: 'a', isGroup: false, parentId: 'lane1' },
      ],
      { other: { droppedSubGraphMembers: [shared] } }
    );

    prepareLayoutForSwimlanes(layout);

    expect(ids(layout)).toEqual(['lane1', 'a']);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toBe(
      'Swimlane node "a" is listed in lanes "lane1" and "phase1"; it is drawn in "lane1" only.'
    );
  });

  it('keeps a lane the author left empty', () => {
    const warn = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
    const layout = layoutWith([
      { id: 'lane1', isGroup: true },
      { id: 'placeholder', isGroup: true },
      { id: 'a', isGroup: false, parentId: 'lane1' },
    ]);

    prepareLayoutForSwimlanes(layout);

    expect(ids(layout)).toEqual(['lane1', 'placeholder', 'a']);
    expect(warn).not.toHaveBeenCalled();
  });

  it('keeps a lane that still has members after losing one', () => {
    vi.spyOn(log, 'warn').mockImplementation(() => undefined);
    const layout = layoutWith(
      [
        { id: 'lane1', isGroup: true },
        { id: 'phase1', isGroup: true },
        { id: 'a', isGroup: false, parentId: 'lane1' },
        { id: 'b', isGroup: false, parentId: 'phase1' },
      ],
      { other: { droppedSubGraphMembers: [shared] } }
    );

    prepareLayoutForSwimlanes(layout);

    expect(ids(layout)).toEqual(['lane1', 'phase1', 'a', 'b']);
  });

  it('keeps an emptied lane that an edge points at', () => {
    vi.spyOn(log, 'warn').mockImplementation(() => undefined);
    const layout = layoutWith(
      [
        { id: 'lane1', isGroup: true },
        { id: 'phase1', isGroup: true },
        { id: 'a', isGroup: false, parentId: 'lane1' },
      ],
      {
        other: { droppedSubGraphMembers: [shared] },
        edges: [{ id: 'e1', start: 'a', end: 'phase1' } as LayoutData['edges'][number]],
      }
    );

    prepareLayoutForSwimlanes(layout);

    expect(ids(layout)).toContain('phase1');
  });

  it('ignores a node shared with a subgraph that is not a lane', () => {
    const warn = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
    const layout = layoutWith(
      [
        { id: 'lane1', isGroup: true },
        { id: 'inner', isGroup: true, parentId: 'lane1' },
        { id: 'a', isGroup: false, parentId: 'inner' },
      ],
      { other: { droppedSubGraphMembers: [{ node: 'a', keptBy: 'inner', droppedFrom: 'lane1' }] } }
    );

    prepareLayoutForSwimlanes(layout);

    expect(ids(layout)).toEqual(['lane1', 'inner', 'a']);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('nested in "lane1"');
  });

  it('warns about a subgraph nested in a lane and still draws it', () => {
    const warn = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
    const layout = layoutWith([
      { id: 'lane1', isGroup: true },
      { id: 'inner', isGroup: true, parentId: 'lane1', shape: 'rect' },
      { id: 'a', isGroup: false, parentId: 'inner' },
    ]);

    prepareLayoutForSwimlanes(layout);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toBe(
      'Swimlane subgraph "inner" is nested in "lane1"; only top-level subgraphs are lanes, so it is drawn as a plain box.'
    );
    expect(layout.nodes.find((node) => node.id === 'inner')?.shape).toBe('rect');
  });
});
