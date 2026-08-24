import { describe, expect, it } from 'vitest';
import type { Edge, LayoutData, Node } from '../../types.js';
import { countEdgeCrossings, countEdgesThroughForeignNodes } from './partQuality.js';

function node(id: string, x: number, y: number): Node {
  return { id, label: id, isGroup: false, shape: 'rect', width: 80, height: 40, x, y } as Node;
}

function edge(start: string, end: string, points: { x: number; y: number }[]): Edge {
  return { id: `${start}-${end}`, start, end, points } as Edge;
}

function layoutData(nodes: Node[], edges: Edge[]): LayoutData {
  return { nodes, edges, config: {} } as unknown as LayoutData;
}

describe('countEdgesThroughForeignNodes', () => {
  it('counts an edge drawn straight through a node it does not connect', () => {
    // `A` at the top, `B` in the middle, `C` at the bottom, all in one column: the
    // A—C edge passes exactly through B. This is the collapsed-cycle symptom.
    const data = layoutData(
      [node('A', 100, 0), node('B', 100, 100), node('C', 100, 200)],
      [
        edge('A', 'C', [
          { x: 100, y: 0 },
          { x: 100, y: 200 },
        ]),
      ]
    );

    expect(countEdgesThroughForeignNodes(data)).toBe(1);
  });

  it('does not count an edge that only passes near a node', () => {
    const data = layoutData(
      [node('A', 100, 0), node('B', 100, 100), node('C', 100, 200)],
      [
        // Routed clear of `B`: 60px away, beyond its 20px half-height.
        edge('A', 'C', [
          { x: 100, y: 0 },
          { x: 160, y: 100 },
          { x: 100, y: 200 },
        ]),
      ]
    );

    expect(countEdgesThroughForeignNodes(data)).toBe(0);
  });

  it('does not count an edge running into its own endpoints', () => {
    const data = layoutData(
      [node('A', 0, 0), node('B', 200, 0)],
      [
        // Centre-to-centre, so it starts and ends inside its own endpoint nodes.
        edge('A', 'B', [
          { x: 0, y: 0 },
          { x: 200, y: 0 },
        ]),
      ]
    );

    expect(countEdgesThroughForeignNodes(data)).toBe(0);
  });
});

describe('countEdgeCrossings', () => {
  it('counts a crossing between two independent edges', () => {
    const data = layoutData(
      [node('A', 0, 0), node('B', 200, 200), node('C', 200, 0), node('D', 0, 200)],
      [
        edge('A', 'B', [
          { x: 0, y: 0 },
          { x: 200, y: 200 },
        ]),
        edge('C', 'D', [
          { x: 200, y: 0 },
          { x: 0, y: 200 },
        ]),
      ]
    );

    expect(countEdgeCrossings(data)).toBe(1);
  });

  it('does not count edges that meet at a shared node', () => {
    const data = layoutData(
      [node('A', 0, 0), node('B', 200, 0), node('C', 100, 200)],
      [
        edge('A', 'C', [
          { x: 0, y: 0 },
          { x: 100, y: 200 },
        ]),
        edge('B', 'C', [
          { x: 200, y: 0 },
          { x: 100, y: 200 },
        ]),
      ]
    );

    expect(countEdgeCrossings(data)).toBe(0);
  });

  it('counts the reported life-choices shape: a vertical edge across a horizontal one', () => {
    // `nr → nh` runs down the column at x=748 while `n5 → ne` runs along the row at
    // y=1282 between them — the crossing reported on life-choices.
    const data = layoutData(
      [node('nr', 748, 1013), node('nh', 748, 1330), node('ne', 431, 1282), node('n5', 1065, 1282)],
      [
        edge('nr', 'nh', [
          { x: 748, y: 1013 },
          { x: 748, y: 1330 },
        ]),
        edge('n5', 'ne', [
          { x: 1065, y: 1282 },
          { x: 431, y: 1282 },
        ]),
      ]
    );

    expect(countEdgeCrossings(data)).toBe(1);
  });
});
