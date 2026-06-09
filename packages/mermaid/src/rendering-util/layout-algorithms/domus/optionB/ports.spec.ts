import { describe, it, expect } from 'vitest';
import type { LayoutData, Node, Edge } from '../../../types.js';
import { postProcessDomusOptionBMilestone1 } from './postprocess.js';

function mkNode(id: string, x: number, y: number, width = 100, height = 100): Node {
  return { id, x, y, width, height, isGroup: false } as Node;
}

function mkEdge(id: string, start: string, end: string, points: { x: number; y: number }[]): Edge {
  return { id, start, end, type: 'arrow', points } as Edge;
}

describe('Option B port distribution ordering', () => {
  it('orders ports on a side by circular order / ray direction, not by edgeId', () => {
    // Node B connects to three nodes to its right: above, aligned, below.
    // Ports should be ordered consistently by target direction along whichever
    // side the port assignment chooses (anti-Z may pick N/S for corner hits).
    // Make B tall enough that rays to above/below targets hit the middle half
    // of the East side, so anti-Z corner reassignment does not kick in.
    const B = mkNode('B', 0, 0, 100, 1000);
    const D = mkNode('D', 200, -200);
    const E = mkNode('E', 200, 0);
    const F = mkNode('F', 200, 200);

    // Intentionally choose edge IDs that would sort opposite of geometric order.
    const eTop = mkEdge('z', 'B', 'D', [
      { x: B.x!, y: B.y! },
      { x: D.x!, y: D.y! },
    ]);
    const eMid = mkEdge('y', 'B', 'E', [
      { x: B.x!, y: B.y! },
      { x: E.x!, y: E.y! },
    ]);
    const eBot = mkEdge('x', 'B', 'F', [
      { x: B.x!, y: B.y! },
      { x: F.x!, y: F.y! },
    ]);

    const data: LayoutData = { nodes: [B, D, E, F], edges: [eTop, eMid, eBot], config: {} as any };
    postProcessDomusOptionBMilestone1(data, { spacing: 10, snapEps: 0, segmentKeySnap: 1 });

    const pTop = eTop.points![0];
    const pMid = eMid.points![0];
    const pBot = eBot.points![0];

    // Compare by y if ports are distributed on a vertical side, otherwise by x.
    const axis = Math.abs(pMid.x - B.x!) > Math.abs(pMid.y - B.y!) ? 'y' : 'x';
    const vTop = axis === 'y' ? pTop.y : pTop.x;
    const vMid = axis === 'y' ? pMid.y : pMid.x;
    const vBot = axis === 'y' ? pBot.y : pBot.x;

    expect(vTop).toBeLessThan(vMid);
    expect(vMid).toBeLessThan(vBot);
  });

  it('reconciles port order to match lane order just outside the node (prevents local inversions)', () => {
    // Construct two edges that share a vertical corridor (same x) but whose initial
    // endpoints would be in the opposite order on the left side of B.
    //
    // After postprocess, the ports on B's left side should be ordered to match the
    // lane order (y positions) just outside the node.
    const spacing = 10;
    const B = mkNode('B', 0, 0, 120, 140);
    const U = mkNode('U', -200, -80, 80, 60);
    const D = mkNode('D', -200, 80, 80, 60);

    // Two edges approaching B from the left, entering a shared vertical run near x=-80.
    // eTop should remain above eBot outside the node.
    const eTop = mkEdge('eTop', 'U', 'B', [
      { x: -120, y: -80 },
      { x: -80, y: -80 },
      { x: -80, y: -20 },
      { x: -60, y: -20 },
      { x: 0, y: 0 },
    ]);
    const eBot = mkEdge('eBot', 'D', 'B', [
      { x: -120, y: 80 },
      { x: -80, y: 80 },
      { x: -80, y: 20 },
      { x: -60, y: 20 },
      { x: 0, y: 0 },
    ]);

    const data: LayoutData = { nodes: [B, U, D], edges: [eBot, eTop], config: {} as any };
    postProcessDomusOptionBMilestone1(data, { spacing, snapEps: 0, segmentKeySnap: 1 });

    const pTop = eTop.points![eTop.points!.length - 1];
    const pBot = eBot.points![eBot.points!.length - 1];

    // Just outside the node, compare y of the second-to-last point (first point outside border).
    const oTop = eTop.points![Math.max(0, eTop.points!.length - 2)];
    const oBot = eBot.points![Math.max(0, eBot.points!.length - 2)];

    // Port order along the side should match outside order.
    expect(pTop.y < pBot.y === oTop.y < oBot.y).toBe(true);
  });

  it('keeps self-loop start and end ports separated after postprocess distribution', () => {
    const A = mkNode('A', 0, 0, 120, 80);
    const peers = Array.from({ length: 8 }, (_, i) => mkNode(`P${i}`, 200, -140 + i * 40));
    const loop = mkEdge('loop', 'A', 'A', [
      { x: 60, y: -1 },
      { x: 100, y: -1 },
      { x: 100, y: 1 },
      { x: 60, y: 1 },
    ]);
    const edges = [
      ...peers.map((peer, i) =>
        mkEdge(`e${i}`, 'A', String(peer.id), [
          { x: 0, y: 0 },
          { x: peer.x!, y: peer.y! },
        ])
      ),
      loop,
    ];
    const data: LayoutData = { nodes: [A, ...peers], edges, config: {} as any };

    postProcessDomusOptionBMilestone1(data, { spacing: 10, snapEps: 0, segmentKeySnap: 1 });

    const first = loop.points![0];
    const last = loop.points![loop.points!.length - 1];
    const portSpan = Math.max(Math.abs(first.x - last.x), Math.abs(first.y - last.y));
    const innerA = loop.points![1];
    const innerB = loop.points![loop.points!.length - 2];
    const innerSpan = Math.max(Math.abs(innerA.x - innerB.x), Math.abs(innerA.y - innerB.y));

    expect(portSpan).toBeGreaterThanOrEqual(20);
    expect(innerSpan).toBeGreaterThanOrEqual(20);
  });
});
