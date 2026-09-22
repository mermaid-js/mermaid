import { describe, it, expect } from 'vitest';
import type { LayoutData, Node as MermaidNode, Edge as MermaidEdge } from '../../types.js';
import { toGraphView } from './helpers.js';
import { assignLayers_LaneAwareCompact } from './phase2.laneAwareCompact.js';

function group(id: string): MermaidNode {
  return { id, isGroup: true } as any;
}
function node(id: string, lane: string): MermaidNode {
  return { id, isGroup: false, parentId: lane } as any;
}
function edge(id: string, start: string, end: string): MermaidEdge {
  return { id, start, end, type: 'arrow' } as any;
}

describe('Lane-aware compact layering', () => {
  it('keeps sibling cross-lane branches before downstream branches in the same lane', () => {
    const lanes = ['S', 'T', 'Tester', 'D'].map(group);
    const nodes: MermaidNode[] = [
      ...lanes,
      node('T5', 'S'),
      node('T4', 'T'),
      node('T6', 'T'),
      node('Te2', 'Tester'),
      node('D4', 'Tester'),
      node('D1', 'D'),
      node('D2', 'D'),
      node('D3', 'D'),
      { ...node('label-Te2-D1', 'D'), isEdgeLabel: true, isDummy: true } as MermaidNode,
      { ...node('label-Te2-T4', 'T'), isEdgeLabel: true, isDummy: true } as MermaidNode,
      { ...node('label-D4-T6', 'T'), isEdgeLabel: true, isDummy: true } as MermaidNode,
    ];
    const edges: MermaidEdge[] = [
      edge('e1', 'Te2', 'label-Te2-D1'),
      edge('e2', 'label-Te2-D1', 'D1'),
      edge('e3', 'D1', 'D2'),
      edge('e4', 'D2', 'D3'),
      edge('e5', 'D3', 'D4'),
      edge('e6', 'Te2', 'label-Te2-T4'),
      edge('e7', 'label-Te2-T4', 'T4'),
      edge('e8', 'D4', 'label-D4-T6'),
      edge('e9', 'label-D4-T6', 'T6'),
      edge('e10', 'T6', 'T5'),
    ];
    const layout: LayoutData = { nodes, edges, config: {} as any };
    const g = toGraphView(layout);
    const layering = assignLayers_LaneAwareCompact(g, {
      ignoreCrossLaneEdges: true,
      direction: 'LR',
    });

    expect(layering.rankOf['label-Te2-T4']).toBeLessThan(layering.rankOf['label-D4-T6']);
    expect(layering.rankOf.T4).toBeLessThan(layering.rankOf.T6);
  });

  it('assigns expected layers for the provided swimlanes diagram', () => {
    // Lanes (top-level groups)
    const Car = group('Car');
    const Sales = group('Sales');
    const Legal = group('Legal');
    const Constr = group('Constr');
    const Fun = group('Fun');

    // Nodes and lane membership
    const A = node('A', 'Car');
    const B = node('B', 'Sales');
    const C = node('C', 'Constr');
    const D = node('D', 'Constr');
    const E = node('E', 'Constr');
    const F = node('F', 'Fun');
    const G = node('G', 'Fun');
    const H = node('H', 'Constr');
    const I = node('I', 'Legal');
    const J = node('J', 'Legal');
    const K = node('K', 'Legal');
    const L = node('L', 'Constr');
    const M = node('M', 'Sales');
    const N = node('N', 'Constr');

    const nodes: MermaidNode[] = [
      // lanes first (order not important)
      Car,
      Sales,
      Legal,
      Constr,
      Fun,
      // actual vertices
      A,
      B,
      C,
      D,
      E,
      F,
      G,
      H,
      I,
      J,
      K,
      L,
      M,
      N,
    ];

    // Edges from the diagram
    const edges: MermaidEdge[] = [
      edge('e1', 'A', 'B'),
      edge('e2', 'B', 'C'),
      edge('e3', 'C', 'D'),
      edge('e4', 'D', 'E'),
      edge('e5', 'E', 'F'),
      edge('e6', 'F', 'G'),
      edge('e7', 'D', 'H'),
      edge('e8', 'H', 'I'),
      edge('e9', 'I', 'J'),
      edge('e10', 'J', 'E'),
      edge('e11', 'I', 'K'),
      edge('e12', 'K', 'L'),
      edge('e13', 'L', 'M'),
      edge('e14', 'L', 'N'),
    ];

    const layout: LayoutData = {
      nodes,
      edges,
      // Config not required for this unit; layering is called directly with options
      config: {} as any,
    };

    const g = toGraphView(layout);
    const layering = assignLayers_LaneAwareCompact(g, { ignoreCrossLaneEdges: true });
    const r = layering.rankOf;

    // Expected layers
    const expected: Record<string, number> = {
      A: 0,
      B: 0,
      C: 0,
      D: 1,
      E: 3,
      F: 3,
      G: 4,
      H: 2,
      I: 2,
      J: 3,
      L: 4,
      M: 4,
      N: 5,
    };

    for (const [id, layer] of Object.entries(expected)) {
      expect(r[id], `node ${id}`).toBe(layer);
    }
  });
});
