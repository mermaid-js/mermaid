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

/** The distance between the first two rows of the chain, laid out one step per row. */
function rowStep(config: Record<string, unknown>, extra: Record<string, unknown> = {}): number {
  const layout = chain({ ignoreCrossLaneEdges: false }, extra);
  layout.config = { ...layout.config, ...config };
  runSwimlaneLayoutCore(layout);
  const y = (id: string) => layout.nodes.find((node) => node.id === id)?.y ?? Number.NaN;
  return y('b') - y('a');
}

describe('the swimlane engine reads its spacing from the layout data', () => {
  const ZERO = { flowchart: { nodeSpacing: 0, rankSpacing: 0 } };
  const DEFAULTS = { flowchart: {} };

  it('takes a rank spacing of zero as written rather than falling back', () => {
    expect(rowStep(ZERO)).toBeLessThan(rowStep(DEFAULTS));
  });

  it('takes a rank spacing of zero from the layout data itself', () => {
    expect(rowStep(DEFAULTS, { rankSpacing: 0 })).toBe(rowStep(ZERO));
  });

  it('falls back for a negative or non-finite spacing', () => {
    expect(rowStep({ flowchart: { rankSpacing: -10 } })).toBe(rowStep(DEFAULTS));
    expect(rowStep({ flowchart: { rankSpacing: Number.NaN } })).toBe(rowStep(DEFAULTS));
  });

  it('falls back to the defaults when the layout data has no flowchart config', () => {
    const layout = chain({ ignoreCrossLaneEdges: false });
    layout.config = { swimlane: { ignoreCrossLaneEdges: false } };
    runSwimlaneLayoutCore(layout);
    const y = (id: string) => layout.nodes.find((node) => node.id === id)?.y ?? Number.NaN;
    expect(y('b') - y('a')).toBe(rowStep(DEFAULTS));
  });
});
