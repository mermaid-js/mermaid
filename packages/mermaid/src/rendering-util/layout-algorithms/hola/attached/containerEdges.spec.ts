import { describe, expect, it } from 'vitest';
import type { Edge, LayoutData, Node } from '../../../types.js';
import type { Bounds } from '../core/model.js';
import { polylineHitsBounds } from './geometry.js';
import { rerouteEdgesAroundForeignFrames } from './containerEdges.js';
import { resolveGridAttachedOptions } from './options.js';

function leaf(id: string, x: number, y: number, parentId?: string): Node {
  return { id, isGroup: false, x, y, width: 80, height: 50, ...(parentId ? { parentId } : {}) };
}

function group(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  parentId?: string
): Node {
  return { id, isGroup: true, x, y, width, height, ...(parentId ? { parentId } : {}) };
}

function edge(id: string, start: string, end: string, points: { x: number; y: number }[]): Edge {
  return { id, start, end, points };
}

describe('post-frame subgraph routing', () => {
  it('spreads ports when two re-routed edges meet the same node', () => {
    const nodes = [
      group('project', 150, 125, 320, 250),
      group('subnet1', 45, 130, 90, 100, 'project'),
      group('subnet2', 140, 130, 90, 140, 'project'),
      leaf('nat', 260, 130, 'project'),
      leaf('internet', 260, 20),
    ];
    const inbound = edge('subnet1-nat', 'subnet1', 'nat', [
      { x: 90, y: 130 },
      { x: 220, y: 130 },
    ]);
    const outbound = edge('nat-internet', 'nat', 'internet', [
      { x: 220, y: 130 },
      { x: 140, y: 130 },
      { x: 140, y: 20 },
      { x: 220, y: 20 },
    ]);
    const data = {
      nodes,
      edges: [inbound, outbound],
      config: { flowchart: { nodeSpacing: 50, rankSpacing: 50 } },
    } as unknown as LayoutData;
    const subnet2: Bounds = { minX: 95, minY: 60, maxX: 185, maxY: 200 };

    rerouteEdgesAroundForeignFrames(
      data.edges,
      new Map([
        ['project', { minX: -10, minY: 0, maxX: 310, maxY: 250 }],
        ['subnet1', { minX: 0, minY: 80, maxX: 90, maxY: 180 }],
        ['subnet2', subnet2],
      ]),
      data.nodes,
      resolveGridAttachedOptions(data)
    );

    expect(polylineHitsBounds(inbound.points!, subnet2)).toBe(false);
    expect(polylineHitsBounds(outbound.points!, subnet2)).toBe(false);
    const inboundAtNat = inbound.points!.at(-1)!;
    const outboundAtNat = outbound.points![0];
    expect(
      Math.hypot(inboundAtNat.x - outboundAtNat.x, inboundAtNat.y - outboundAtNat.y)
    ).toBeGreaterThanOrEqual(8);
  });
});
