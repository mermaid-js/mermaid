import { describe, it, expect } from 'vitest';
import { computeAntiparallelCorridorHints } from './antiparallelCorridorHint.js';
import type { LayoutData, Node } from '../../../types.js';
import type { AntiParallelPair } from '../analyzeGraph.js';

// iter-37 — DOMUS §7 anti-parallel corridor side-constraint hint.
// Helper emits `allowedLabels` (not `requiredLabel`) so the SAT solver
// picks which edge is U vs D. This avoids silent UNSAT when placement
// conflicts with a hard-coded label.

function makeNode(id: string, x = 0, y = 0): Node {
  return { id, isGroup: false, x, y, width: 100, height: 40 } as Node;
}

describe('computeAntiparallelCorridorHints', () => {
  it('returns an empty array when no anti-parallel pairs exist', () => {
    const layout: LayoutData = { nodes: [], edges: [] } as any;
    const hints = computeAntiparallelCorridorHints(layout, [], new Map());
    expect(hints).toEqual([]);
  });

  it('emits vertical-corridor allowedLabels for anti-parallel pair (default direction)', () => {
    const HKC = makeNode('HKC');
    const USC = makeNode('USC');
    const pair: AntiParallelPair = {
      u: 'HKC',
      v: 'USC',
      uvEdgeIds: ['L_HKC_USC_0'],
      vuEdgeIds: ['L_USC_HKC_0'],
    };
    const nodesById = new Map([
      ['HKC', HKC],
      ['USC', USC],
    ]);
    const layout: LayoutData = { nodes: [HKC, USC], edges: [] } as any;
    const hints = computeAntiparallelCorridorHints(layout, [pair], nodesById);
    expect(hints).toEqual([
      { edgeId: 'L_HKC_USC_0', allowedLabels: ['U', 'D'] },
      { edgeId: 'L_USC_HKC_0', allowedLabels: ['U', 'D'] },
    ]);
  });

  it('emits vertical-corridor for TB / TD / BT direction', () => {
    const A = makeNode('A');
    const B = makeNode('B');
    const pair: AntiParallelPair = {
      u: 'A',
      v: 'B',
      uvEdgeIds: ['e_ab'],
      vuEdgeIds: ['e_ba'],
    };
    const nodesById = new Map([
      ['A', A],
      ['B', B],
    ]);
    for (const dir of ['TB', 'TD', 'BT', 'DT']) {
      const layout: LayoutData = { nodes: [A, B], edges: [], direction: dir } as any;
      const hints = computeAntiparallelCorridorHints(layout, [pair], nodesById);
      expect(hints[0].allowedLabels).toEqual(['U', 'D']);
      expect(hints[1].allowedLabels).toEqual(['U', 'D']);
    }
  });

  it('emits horizontal-corridor for LR / RL direction', () => {
    const A = makeNode('A');
    const B = makeNode('B');
    const pair: AntiParallelPair = {
      u: 'A',
      v: 'B',
      uvEdgeIds: ['e_ab'],
      vuEdgeIds: ['e_ba'],
    };
    const nodesById = new Map([
      ['A', A],
      ['B', B],
    ]);
    for (const dir of ['LR', 'RL']) {
      const layout: LayoutData = { nodes: [A, B], edges: [], direction: dir } as any;
      const hints = computeAntiparallelCorridorHints(layout, [pair], nodesById);
      expect(hints[0].allowedLabels).toEqual(['L', 'R']);
      expect(hints[1].allowedLabels).toEqual(['L', 'R']);
    }
  });

  it('skips multi-edge anti-parallel pairs (scope limit)', () => {
    const A = makeNode('A');
    const B = makeNode('B');
    const pair: AntiParallelPair = {
      u: 'A',
      v: 'B',
      uvEdgeIds: ['e1', 'e2'],
      vuEdgeIds: ['e3'],
    };
    const nodesById = new Map([
      ['A', A],
      ['B', B],
    ]);
    const layout: LayoutData = { nodes: [A, B], edges: [] } as any;
    const hints = computeAntiparallelCorridorHints(layout, [pair], nodesById);
    expect(hints).toEqual([]);
  });

  it('honours an explicit opts.corridor override', () => {
    const A = makeNode('A');
    const B = makeNode('B');
    const pair: AntiParallelPair = {
      u: 'A',
      v: 'B',
      uvEdgeIds: ['e_ab'],
      vuEdgeIds: ['e_ba'],
    };
    const nodesById = new Map([
      ['A', A],
      ['B', B],
    ]);
    const layout: LayoutData = { nodes: [A, B], edges: [], direction: 'TB' } as any;
    const hints = computeAntiparallelCorridorHints(layout, [pair], nodesById, {
      corridor: 'horizontal',
    });
    expect(hints[0].allowedLabels).toEqual(['L', 'R']);
    expect(hints[1].allowedLabels).toEqual(['L', 'R']);
  });
});
