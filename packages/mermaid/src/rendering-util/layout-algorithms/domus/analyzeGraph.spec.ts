import { describe, it, expect } from 'vitest';
import type { LayoutData, Edge, Node } from '../../types.js';
import { analyzeGraph } from './analyzeGraph.js';

function mkNode(id: string): Node {
  return { id, x: 0, y: 0, width: 10, height: 10, isGroup: false } as any;
}

function mkEdge(id: string, start: string, end: string): Edge {
  return { id, start, end, type: 'arrow' } as any;
}

describe('analyzeGraph', () => {
  it('detects no cycle for a simple chain', () => {
    const layout: LayoutData = {
      nodes: [mkNode('A'), mkNode('B'), mkNode('C')],
      edges: [mkEdge('e1', 'A', 'B'), mkEdge('e2', 'B', 'C')],
      config: {} as any,
    };
    const a = analyzeGraph(layout);
    expect(a.hasCycle).toBe(false);
    expect(a.antiParallelPairs.length).toBe(0);
    expect(a.multiEdgeGroups.length).toBe(0);
  });

  it('detects a 2-cycle and an anti-parallel pair', () => {
    const layout: LayoutData = {
      nodes: [mkNode('A'), mkNode('B')],
      edges: [mkEdge('eAB', 'A', 'B'), mkEdge('eBA', 'B', 'A')],
      config: {} as any,
    };
    const a = analyzeGraph(layout);
    expect(a.hasCycle).toBe(true);
    expect(a.antiParallelPairs).toEqual([
      { u: 'A', v: 'B', uvEdgeIds: ['eAB'], vuEdgeIds: ['eBA'] },
    ]);
    expect(a.multiEdgeGroups.length).toBe(1);
    expect(a.multiEdgeGroups[0].edgeIds.sort()).toEqual(['eAB', 'eBA']);
  });

  it('detects parallel multi-edges without cycles', () => {
    const layout: LayoutData = {
      nodes: [mkNode('A'), mkNode('B')],
      edges: [mkEdge('e1', 'A', 'B'), mkEdge('e2', 'A', 'B')],
      config: {} as any,
    };
    const a = analyzeGraph(layout);
    expect(a.hasCycle).toBe(false);
    expect(a.antiParallelPairs.length).toBe(0);
    expect(a.multiEdgeGroups).toEqual([
      {
        u: 'A',
        v: 'B',
        edgeIds: ['e1', 'e2'],
        uvEdgeIds: ['e1', 'e2'],
        vuEdgeIds: [],
      },
    ]);
  });

  it('treats self-loops as cycles', () => {
    const layout: LayoutData = {
      nodes: [mkNode('A')],
      edges: [mkEdge('loop', 'A', 'A')],
      config: {} as any,
    };
    const a = analyzeGraph(layout);
    expect(a.hasCycle).toBe(true);
  });

  it('detects anti-parallel pairs even when labeled edges are split via edge-label nodes', () => {
    const labelNodeId = 'edge-label-USCompany-HongKongCompany-L_USCompany_HongKongCompany_0';
    const layout: LayoutData = {
      nodes: [
        mkNode('USCompany'),
        mkNode('HongKongCompany'),
        {
          id: labelNodeId,
          isGroup: false,
          isEdgeLabel: true,
          edgeStart: 'USCompany',
          edgeEnd: 'HongKongCompany',
          x: 0,
          y: 0,
          width: 10,
          height: 10,
        } as any,
      ],
      edges: [
        // Split representation of USCompany -> HongKongCompany
        {
          id: 'L_USCompany_HongKongCompany_0-to-label',
          start: 'USCompany',
          end: labelNodeId,
          isLabelEdge: true,
        } as any,
        {
          id: 'L_USCompany_HongKongCompany_0-from-label',
          start: labelNodeId,
          end: 'HongKongCompany',
          isLabelEdge: true,
        } as any,
        // Reverse edge (unlabeled)
        mkEdge('L_HongKongCompany_USCompany_0', 'HongKongCompany', 'USCompany'),
      ],
      config: {} as any,
    };

    const a = analyzeGraph(layout);
    expect(a.hasCycle).toBe(true);
    expect(a.antiParallelPairs).toEqual([
      {
        u: 'HongKongCompany',
        v: 'USCompany',
        uvEdgeIds: ['L_HongKongCompany_USCompany_0'],
        vuEdgeIds: ['L_USCompany_HongKongCompany_0'],
      },
    ]);
  });
});
