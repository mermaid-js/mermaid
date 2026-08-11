import { describe, it, expect } from 'vitest';
import type { LayoutData, Node, Edge } from '../../types.js';
import { runOrthogonalEdgePipeline } from './pipeline.js';

function mkNode(id: string, x: number, y: number, width = 120, height = 80): Node {
  return { id, x, y, width, height, isGroup: false } as Node;
}

function mkEdge(id: string, start: string, end: string): Edge {
  // Points are ignored by the routing-graph backend (it computes new points),
  // but keep a minimal shape for type compatibility.
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

describe('Regression: HongKongCompany left-side inversion (minimal)', () => {
  it('orders ports on HK left side top-to-bottom by target direction, not edgeId', () => {
    // Place HK to the right of two targets (one above, one below) so both edges
    // should attach to HK's left side. Use edge IDs that would sort opposite
    // of geometric order to ensure we are not accidentally ordering by id.
    const HK = mkNode('HongKongCompany', 200, 0);
    const Wages = mkNode('Wages', 0, -80);
    const Incomehk = mkNode('Incomehk', 0, 80);

    const eToWages = mkEdge('z', 'HongKongCompany', 'Wages');
    const eToIncome = mkEdge('a', 'HongKongCompany', 'Incomehk');

    const data: LayoutData = {
      nodes: [HK, Wages, Incomehk],
      edges: [eToIncome, eToWages],
      config: {} as any,
    };

    runOrthogonalEdgePipeline(data, {
      routingBackend: 'routing-graph',
      routingGraphModel: 'channels',
      spacing: 10,
      clearance: 10,
    });

    const hkRect = {
      left: HK.x! - HK.width! / 2,
      right: HK.x! + HK.width! / 2,
      top: HK.y! - HK.height! / 2,
      bottom: HK.y! + HK.height! / 2,
    };
    const approx = (a: number, b: number) => Math.abs(a - b) <= 1e-6;

    const pW = (eToWages as any).points[0];
    const pI = (eToIncome as any).points[0];

    // Both should attach on the left side.
    expect(approx(pW.x, hkRect.left)).toBe(true);
    expect(approx(pI.x, hkRect.left)).toBe(true);

    // And be ordered top-to-bottom by target direction: Wages above Incomehk.
    expect(pW.y).toBeLessThan(pI.y);
  });
});
