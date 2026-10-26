import { describe, expect, it } from 'vitest';
import type { LayoutData, Node } from '../../../types.js';
import { runSwimlaneLayoutCore } from '../layoutCore.js';

const lane = (id: string): Node => ({ id, isGroup: true, padding: 20 }) as Node;
const box = (id: string, parentId: string): Node =>
  ({ id, isGroup: false, width: 100, height: 50, parentId }) as Node;

/** A chain that crosses from one lane to the other and back. */
function chain(swimlane: Record<string, unknown> | undefined, extra: Record<string, unknown> = {}) {
  return {
    nodes: [lane('L1'), lane('L2'), box('a', 'L1'), box('b', 'L2'), box('c', 'L1')],
    edges: [
      { id: 'eAB', start: 'a', end: 'b', type: 'normal' },
      { id: 'eBC', start: 'b', end: 'c', type: 'normal' },
    ],
    config: { flowchart: { nodeSpacing: 40, rankSpacing: 80 }, ...(swimlane ? { swimlane } : {}) },
    direction: 'TB',
    ...extra,
  } as unknown as LayoutData;
}

const rowsOf = (layout: LayoutData): number =>
  new Set(layout.nodes.filter((node) => !node.isGroup).map((node) => node.y)).size;

describe('the swimlane engine reads its options from the layout data', () => {
  it('shares a row between the lanes when it ignores cross-lane edges', () => {
    const layout = chain({ ignoreCrossLaneEdges: true });
    runSwimlaneLayoutCore(layout);
    expect(rowsOf(layout)).toBe(2);
  });

  it('puts each step of the chain in a row of its own when it does not', () => {
    const layout = chain({ ignoreCrossLaneEdges: false });
    runSwimlaneLayoutCore(layout);
    expect(rowsOf(layout)).toBe(3);
  });

  it('ignores cross-lane edges when the layout data does not say', () => {
    const layout = chain(undefined);
    runSwimlaneLayoutCore(layout);
    expect(rowsOf(layout)).toBe(2);
  });

  it('keeps a branch-wise layout out of one row, as the producer asked, whatever the default', () => {
    const layout = chain({ ignoreCrossLaneEdges: true }, { laneLayering: 'branches' });
    runSwimlaneLayoutCore(layout);
    expect(rowsOf(layout)).toBe(3);
  });

  it('lets the author choice override a branch-wise layout', () => {
    const layout = chain(
      { ignoreCrossLaneEdges: false },
      { laneLayering: 'branches', ignoreCrossLaneEdgesChosen: true }
    );
    runSwimlaneLayoutCore(layout);
    expect(rowsOf(layout)).toBe(2);
  });
});
