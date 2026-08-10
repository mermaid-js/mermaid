/**
 * Spreading the connectors that leave one side of one node (guide §15.2, §19.8):
 * a branching tree node must not fire every arrow from the same point, and the
 * spread must not introduce a crossing or push a port off its side.
 */

import { describe, expect, it } from 'vitest';
import type { HolaNode, Side } from '../model.js';
import { resolveOptions } from '../options.js';
import { makeEntity } from '../state.js';
import { distributeFanPorts } from './finalRouting.js';
import type { FinalEdge } from './finalRouting.js';

const OPTIONS = resolveOptions();

function edge(source: string, target: string, side?: Side): FinalEdge {
  return {
    originalEdgeId: `${source}->${target}`,
    source,
    target,
    mandatoryWaypoints: [],
    parallelIndex: 0,
    parallelCount: 1,
    lockedSourceSide: side,
    lockedTargetSide: side === 'right' ? 'left' : undefined,
  };
}

function nodeMap(...nodes: HolaNode[]): Map<string, HolaNode> {
  return new Map(nodes.map((node) => [node.id, node]));
}

describe('spreading a fan of connectors along one node side', () => {
  it('gives each child its own point, keeping the middle one on the centre line', () => {
    const nodes = nodeMap(
      makeEntity('P', 0, 0, 40, 54),
      makeEntity('up', 200, -100, 40, 20),
      makeEntity('mid', 200, 0, 40, 20),
      makeEntity('down', 200, 100, 40, 20)
    );
    const edges = [edge('P', 'mid', 'right'), edge('P', 'down', 'right'), edge('P', 'up', 'right')];

    distributeFanPorts(nodes, edges, OPTIONS);

    const offsetOf = (target: string): number =>
      edges.find((e) => e.target === target)!.sourcePortOffset!;
    // Side 54 high, 8px margin either end → 38 usable, so the full 14px spacing.
    expect(offsetOf('up')).toBe(-14);
    expect(offsetOf('mid')).toBe(0);
    expect(offsetOf('down')).toBe(14);
  });

  it('orders the ports by the far ends, so the spread cannot cross', () => {
    const nodes = nodeMap(
      makeEntity('P', 0, 0, 40, 54),
      makeEntity('low', 200, 90, 40, 20),
      makeEntity('high', 200, -90, 40, 20)
    );
    // Declared low-first; the ports must still come out high-first.
    const edges = [edge('P', 'low', 'right'), edge('P', 'high', 'right')];

    distributeFanPorts(nodes, edges, OPTIONS);

    expect(edges.find((e) => e.target === 'high')!.sourcePortOffset).toBeLessThan(
      edges.find((e) => e.target === 'low')!.sourcePortOffset!
    );
  });

  it('offsets along x on the top and bottom sides', () => {
    const nodes = nodeMap(
      makeEntity('P', 0, 0, 54, 40),
      makeEntity('left', -200, -100, 40, 20),
      makeEntity('right', 200, -100, 40, 20)
    );
    const edges = [edge('P', 'left', 'top'), edge('P', 'right', 'top')];

    distributeFanPorts(nodes, edges, OPTIONS);

    expect(edges.find((e) => e.target === 'left')!.sourcePortOffset).toBe(-7);
    expect(edges.find((e) => e.target === 'right')!.sourcePortOffset).toBe(7);
  });

  it('tightens the spread rather than run off a short side', () => {
    // A 24px side leaves 12 usable after the margins, shared by three ports.
    const nodes = nodeMap(
      makeEntity('P', 0, 0, 40, 24),
      makeEntity('a', 200, -100, 40, 20),
      makeEntity('b', 200, 0, 40, 20),
      makeEntity('c', 200, 100, 40, 20)
    );
    const edges = [edge('P', 'a', 'right'), edge('P', 'b', 'right'), edge('P', 'c', 'right')];

    distributeFanPorts(nodes, edges, OPTIONS);

    for (const e of edges) {
      expect(Math.abs(e.sourcePortOffset!)).toBeLessThanOrEqual(12 - 1e-9);
    }
    expect(edges.find((e) => e.target === 'b')!.sourcePortOffset).toBe(0);
  });

  it('leaves an edge whose side the router still has to choose alone', () => {
    const nodes = nodeMap(
      makeEntity('P', 0, 0, 40, 54),
      makeEntity('a', 200, -100, 40, 20),
      makeEntity('b', 200, 100, 40, 20)
    );
    const edges = [edge('P', 'a'), edge('P', 'b')];

    distributeFanPorts(nodes, edges, OPTIONS);

    expect(edges[0].sourcePortOffset).toBeUndefined();
    expect(edges[1].sourcePortOffset).toBeUndefined();
  });

  it('leaves a lone connector on the centre line', () => {
    const nodes = nodeMap(makeEntity('P', 0, 0, 40, 54), makeEntity('a', 200, 100, 40, 20));
    const edges = [edge('P', 'a', 'right')];

    distributeFanPorts(nodes, edges, OPTIONS);

    expect(edges[0].sourcePortOffset).toBeUndefined();
  });

  it('treats the two sides of one node as separate fans', () => {
    const nodes = nodeMap(
      makeEntity('P', 0, 0, 40, 54),
      makeEntity('r1', 200, -100, 40, 20),
      makeEntity('r2', 200, 100, 40, 20),
      makeEntity('l1', -200, 0, 40, 20)
    );
    const edges = [edge('P', 'r1', 'right'), edge('P', 'r2', 'right'), edge('P', 'l1', 'left')];

    distributeFanPorts(nodes, edges, OPTIONS);

    expect(edges.find((e) => e.target === 'r1')!.sourcePortOffset).toBe(-7);
    expect(edges.find((e) => e.target === 'r2')!.sourcePortOffset).toBe(7);
    expect(edges.find((e) => e.target === 'l1')!.sourcePortOffset).toBeUndefined();
  });
});
