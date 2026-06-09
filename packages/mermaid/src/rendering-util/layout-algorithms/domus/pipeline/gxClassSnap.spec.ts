/**
 * Unit tests for `applyGxClassSnap` (iter-47 Gx/Gy equivalence-class snap).
 */
import { describe, it, expect } from 'vitest';
import type { LayoutData } from '../../../types.js';
import type { DomusGraph, Shape } from '../domus/types.js';
import { applyGxClassSnap } from './gxClassSnap.js';

function makeGraph(
  edges: { id: string; from: string; to: string }[],
  vertices: string[]
): DomusGraph {
  const edgeMap = new Map<
    string,
    { id: string; from: string; to: string; originalEdgeId?: string }
  >();
  for (const e of edges) {
    edgeMap.set(e.id, { ...e, originalEdgeId: e.id });
  }
  return {
    vertices: new Set(vertices),
    edges: edgeMap,
    vertexToIncoming: new Map(),
    vertexToOutgoing: new Map(),
  } as unknown as DomusGraph;
}

function makeShape(labels: Record<string, 'L' | 'R' | 'U' | 'D'>): Shape {
  const labelMap = new Map<string, 'L' | 'R' | 'U' | 'D'>();
  for (const [k, v] of Object.entries(labels)) {
    labelMap.set(k, v);
  }
  return {
    labels: labelMap,
    canonicalDirections: new Map(),
    getLabel: (id: string) => labelMap.get(id),
    setLabel: (id: string, label: 'L' | 'R' | 'U' | 'D') => {
      labelMap.set(id, label);
    },
  } as unknown as Shape;
}

function makeLayout(
  nodes: { id: string; x: number; y: number; w?: number; h?: number }[]
): LayoutData {
  return {
    nodes: nodes.map(
      (n) =>
        ({
          id: n.id,
          x: n.x,
          y: n.y,
          width: n.w ?? 100,
          height: n.h ?? 40,
          shape: 'rect',
        }) as never
    ),
    edges: [],
  } as unknown as LayoutData;
}

describe('applyGxClassSnap', () => {
  it('snaps 3 U-chain nodes with 5u splay to the class median', () => {
    // a →U→ b →U→ c : all three should share x
    const graph = makeGraph(
      [
        { id: 'e1', from: 'a', to: 'b' },
        { id: 'e2', from: 'b', to: 'c' },
      ],
      ['a', 'b', 'c']
    );
    const shape = makeShape({ e1: 'U', e2: 'U' });
    const layout = makeLayout([
      { id: 'a', x: 100, y: 300 },
      { id: 'b', x: 95, y: 200 },
      { id: 'c', x: 100, y: 100 },
    ]);
    const stats = applyGxClassSnap(layout, graph, shape, 20);
    expect(stats.xClassesSnapped).toBe(1);
    expect(stats.xNodesMoved).toBe(1);
    expect((layout.nodes[0] as { x: number }).x).toBe(100); // a: median is 100
    expect((layout.nodes[1] as { x: number }).x).toBe(100); // b: moved from 95 to 100
    expect((layout.nodes[2] as { x: number }).x).toBe(100);
  });

  it('does NOT snap a class whose spread exceeds the threshold', () => {
    const graph = makeGraph([{ id: 'e1', from: 'a', to: 'b' }], ['a', 'b']);
    const shape = makeShape({ e1: 'U' });
    const layout = makeLayout([
      { id: 'a', x: 100, y: 300 },
      { id: 'b', x: 200, y: 100 }, // 100u spread, threshold 20 → no snap
    ]);
    const stats = applyGxClassSnap(layout, graph, shape, 20);
    expect(stats.xClassesSnapped).toBe(0);
    expect((layout.nodes[0] as { x: number }).x).toBe(100);
    expect((layout.nodes[1] as { x: number }).x).toBe(200);
  });

  it('snaps L/R chains on the Y axis (Gy class)', () => {
    const graph = makeGraph(
      [
        { id: 'e1', from: 'a', to: 'b' },
        { id: 'e2', from: 'b', to: 'c' },
      ],
      ['a', 'b', 'c']
    );
    const shape = makeShape({ e1: 'R', e2: 'R' });
    const layout = makeLayout([
      { id: 'a', x: 100, y: 200 },
      { id: 'b', x: 300, y: 195 },
      { id: 'c', x: 500, y: 200 },
    ]);
    const stats = applyGxClassSnap(layout, graph, shape, 20);
    expect(stats.yClassesSnapped).toBe(1);
    expect((layout.nodes[1] as { y: number }).y).toBe(200);
  });

  it('does not cross-contaminate: U/D and L/R classes are independent', () => {
    // a →U→ b (Gx class); a →R→ c (Gy class with a)
    const graph = makeGraph(
      [
        { id: 'eU', from: 'a', to: 'b' },
        { id: 'eR', from: 'a', to: 'c' },
      ],
      ['a', 'b', 'c']
    );
    const shape = makeShape({ eU: 'U', eR: 'R' });
    // x-splay between a and b (Gx class) — should snap
    // y-splay between a and c (Gy class) — should snap
    const layout = makeLayout([
      { id: 'a', x: 100, y: 200 },
      { id: 'b', x: 97, y: 100 }, // Gx with a
      { id: 'c', x: 300, y: 197 }, // Gy with a
    ]);
    const stats = applyGxClassSnap(layout, graph, shape, 20);
    expect(stats.xClassesSnapped).toBe(1);
    expect(stats.yClassesSnapped).toBe(1);
    // Gx class {a, b}: median of [100, 97] = 98.5 → both snap to 98.5
    expect((layout.nodes[0] as { x: number }).x).toBe(98.5);
    expect((layout.nodes[1] as { x: number }).x).toBe(98.5);
    // Gy class {a, c}: median of [200, 197] = 198.5 → both snap to 198.5
    expect((layout.nodes[0] as { y: number }).y).toBe(198.5);
    expect((layout.nodes[2] as { y: number }).y).toBe(198.5);
  });

  it('does nothing on a class with only 1 member', () => {
    const graph = makeGraph([], ['a']);
    const shape = makeShape({});
    const layout = makeLayout([{ id: 'a', x: 100, y: 100 }]);
    const stats = applyGxClassSnap(layout, graph, shape, 20);
    expect(stats.xClassesSnapped).toBe(0);
    expect(stats.yClassesSnapped).toBe(0);
  });

  it('iter-48: resolves DOMUS `_core` vertex suffix back to LayoutData node', () => {
    // When a DOMUS vertex has multiple edges on one side, `vertexExpansion.ts`
    // splits it into `${id}_core` + `${id}_port_{side}_{idx}`. Only the
    // `_core` vertex maps back to the LayoutData node (see
    // `collapseExpandedVertices` at `vertexExpansion.ts:262-305`). Prior
    // to iter-48 the snap looked up the vertex id verbatim in
    // `data.nodes`, missed the `_core` suffix, and dropped the node from
    // the class — leaving a real drift (e.g. company-simp HKC 5u LEFT of
    // its U-chain siblings) unsnapped because the class size collapsed
    // to < 2 resolvable members.
    const graph = makeGraph(
      [
        { id: 'e1', from: 'a', to: 'b_core' },
        { id: 'e2', from: 'b_core', to: 'c' },
      ],
      ['a', 'b_core', 'b_port_L_0', 'c']
    );
    const shape = makeShape({ e1: 'U', e2: 'U' });
    // Note: LayoutData has `b` (not `b_core`). HKC drifted 5u left.
    const layout = makeLayout([
      { id: 'a', x: 100, y: 300 },
      { id: 'b', x: 95, y: 200 },
      { id: 'c', x: 100, y: 100 },
    ]);
    const stats = applyGxClassSnap(layout, graph, shape, 20);
    expect(stats.xClassesSnapped).toBe(1);
    expect(stats.xNodesMoved).toBe(1);
    expect((layout.nodes[1] as { x: number }).x).toBe(100);
  });

  it('medians correctly on 4-member class with mixed positions', () => {
    const graph = makeGraph(
      [
        { id: 'e1', from: 'a', to: 'b' },
        { id: 'e2', from: 'b', to: 'c' },
        { id: 'e3', from: 'c', to: 'd' },
      ],
      ['a', 'b', 'c', 'd']
    );
    const shape = makeShape({ e1: 'U', e2: 'U', e3: 'U' });
    const layout = makeLayout([
      { id: 'a', x: 100, y: 400 },
      { id: 'b', x: 100, y: 300 },
      { id: 'c', x: 100, y: 200 },
      { id: 'd', x: 95, y: 100 }, // odd one out
    ]);
    const stats = applyGxClassSnap(layout, graph, shape, 20);
    // median of [100, 100, 100, 95] = 100. All 4 should be at 100.
    expect(stats.xNodesMoved).toBe(1);
    expect((layout.nodes[3] as { x: number }).x).toBe(100);
  });
});
