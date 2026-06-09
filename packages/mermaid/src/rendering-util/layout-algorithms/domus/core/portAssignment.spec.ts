import { describe, it, expect } from 'vitest';
import type { LayoutData, Node, Edge } from '../../../types.js';
import { assignPortsForGraph } from './portAssignment.js';

function mkNode(id: string, x: number, y: number, width = 120, height = 80): Node {
  return { id, x, y, width, height, isGroup: false } as Node;
}

function mkEdge(id: string, start: string, end: string): Edge {
  return {
    id,
    start,
    end,
    type: 'arrow',
    points: [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ],
  } as Edge;
}

describe('core/portAssignment: graph-level assignment', () => {
  it('includes label-split edge-ends in the same side ordering pass', () => {
    // A --label--> B becomes A -> edge-label -> B.
    // Port assignment must include the A->edge-label endpoint along with other A->* endpoints,
    // otherwise we can get local inversions when auxiliary nodes exist.
    const A = mkNode('A', 0, 0);
    const B = mkNode('B', 300, 0);
    const L = mkNode('edge-label-0', 150, -60, 60, 30);

    const e1 = mkEdge('e1', 'A', 'B');
    const e2 = mkEdge('e2', 'A', 'edge-label-0');
    const e3 = mkEdge('e3', 'edge-label-0', 'B');

    const data: LayoutData = { nodes: [A, B, L], edges: [e1, e2, e3], config: {} as any };
    const nodesById = new Map<string, Node>([
      ['A', A],
      ['B', B],
      ['edge-label-0', L],
    ]);

    const plan = assignPortsForGraph(data, nodesById, 10);

    const a1 = plan.startByEdgeId.get('e1');
    const a2 = plan.startByEdgeId.get('e2');
    expect(a1).toBeTruthy();
    expect(a2).toBeTruthy();

    // Both endpoints must be part of port assignment (label endpoints included),
    // and they must not share the same geometric port.
    expect(a1!.side).toBeTruthy();
    expect(a2!.side).toBeTruthy();
    expect(a1!.t === a2!.t && a1!.side === a2!.side).toBe(false);
    expect(a1!.port.x === a2!.port.x && a1!.port.y === a2!.port.y).toBe(false);
  });

  it('keeps self-loop start and end ports separated on a busy side', () => {
    const A = mkNode('A', 0, 0, 120, 80);
    const peers = Array.from({ length: 8 }, (_, i) => mkNode(`P${i}`, 200, -140 + i * 40));
    const loop = mkEdge('loop', 'A', 'A');
    const edges = [
      ...peers.map((peer, i) => mkEdge(`e${i}`, 'A', String(peer.id))),
      loop,
    ] as Edge[];
    const nodes = [A, ...peers];
    const data: LayoutData = { nodes, edges, config: {} as any };
    const nodesById = new Map<string, Node>(nodes.map((node) => [String(node.id), node]));

    const plan = assignPortsForGraph(data, nodesById, 10);

    const start = plan.startByEdgeId.get('loop');
    const end = plan.endByEdgeId.get('loop');
    expect(start).toBeTruthy();
    expect(end).toBeTruthy();
    expect(start!.side).toBe(end!.side);
    expect(Math.abs(start!.t - end!.t)).toBeGreaterThanOrEqual(0.5);
  });
});
