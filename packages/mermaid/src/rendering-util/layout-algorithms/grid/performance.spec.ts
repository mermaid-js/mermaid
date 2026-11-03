import { describe, expect, it } from 'vitest';
import type { Edge, LayoutData, Node } from '../../types.js';
import { runGridLayoutCore } from './layoutCore.js';
import { createGridRoutingInstrumentation } from './routerInstrumentation.js';

function node(id: string, metadata?: Record<string, unknown>): Node {
  return {
    id,
    isGroup: false,
    shape: 'rect',
    width: 80,
    height: 40,
    metadata,
  } as Node;
}

function edge(id: string, start: string, end: string): Edge {
  return {
    id,
    start,
    end,
    arrowTypeStart: 'none',
    arrowTypeEnd: 'arrow_point',
  } as Edge;
}

function signature(layout: LayoutData) {
  return JSON.stringify({
    nodes: layout.nodes.map((item) => ({
      id: item.id,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
    })),
    edges: layout.edges.map((item) => ({
      id: item.id,
      points: item.points,
    })),
  });
}

function representativeLayout(): LayoutData {
  return {
    nodes: [
      node('A', { row: 1, column: 1 }),
      node('B', { row: 2, column: 1 }),
      node('C', { row: 2, column: 2 }),
      node('D', { row: 3, column: 2 }),
      node('E', { row: 4, column: 1 }),
    ],
    edges: [edge('e1', 'A', 'B'), edge('e2', 'B', 'C'), edge('e3', 'C', 'D'), edge('e4', 'B', 'E')],
    config: {
      layout: 'grid',
      grid: { rowGap: 32, columnGap: 36 },
    } as LayoutData['config'],
  };
}

function representativeParallelLayout(): LayoutData {
  return {
    nodes: [node('A', { row: 1, column: 1 }), node('B', { row: 1, column: 2 })],
    edges: [
      edge('loop-1', 'A', 'A'),
      edge('loop-2', 'A', 'A'),
      edge('e1', 'A', 'B'),
      edge('e2', 'A', 'B'),
      edge('e3', 'A', 'B'),
      edge('e4', 'B', 'A'),
    ],
    config: {
      layout: 'grid',
      grid: { columnGap: 60 },
    } as LayoutData['config'],
  };
}

function largeSyntheticLayout(): LayoutData {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  for (let index = 0; index < 1000; index++) {
    nodes.push(node(`N${index}`));
  }
  for (let index = 0; index < 500; index++) {
    edges.push(edge(`E${index}`, `N${index}`, `N${index + 500}`));
  }
  return {
    nodes,
    edges,
    config: {
      layout: 'grid',
      grid: { columns: 32 },
    } as LayoutData['config'],
  };
}

function largeSearchLayout(): LayoutData {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  for (let index = 0; index < 200; index++) {
    const row = index * 2 + 1;
    nodes.push(
      node(`L${index}`, { row, column: 1 }),
      node(`R${index}`, { row, column: 3 }),
      node(`B${index}`, { row: row + 1, column: 2 })
    );
    edges.push(edge(`E${index}`, `L${index}`, `R${index}`));
  }
  return {
    nodes,
    edges,
    config: {
      layout: 'grid',
      grid: { rowGap: 32, columnGap: 36 },
    } as LayoutData['config'],
  };
}

describe('grid determinism and performance', () => {
  it('produces byte-equivalent geometry across repeated runs', () => {
    const baseline = representativeLayout();
    runGridLayoutCore(baseline);
    const expected = signature(baseline);

    for (let index = 0; index < 100; index++) {
      const next = structuredClone(representativeLayout());
      runGridLayoutCore(next);
      expect(signature(next)).toBe(expected);
    }
  });

  it('keeps parallel/reverse route arrays byte-equivalent across 100 runs', () => {
    const baseline = representativeParallelLayout();
    runGridLayoutCore(baseline);
    const expected = signature(baseline);

    for (let index = 0; index < 100; index++) {
      const next = structuredClone(representativeParallelLayout());
      runGridLayoutCore(next);
      expect(signature(next)).toBe(expected);
    }
  });

  // TODO: Move this wall-clock assertion to a benchmark harness when the repository has one.
  // CI runs unit tests with V8 coverage instrumentation, which adds substantial routing overhead.
  it.skipIf(Boolean(process.env.CI))(
    'lays out 1000 nodes and 500 edges within the 1-second budget',
    () => {
      const layout = largeSyntheticLayout();
      const start = performance.now();
      runGridLayoutCore(layout);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(1000);
    }
  );

  // Coverage instrumentation can push these large structural tests past Vitest's 5-second default;
  // non-coverage runs remain below it.
  it('keeps the 1000-node/500-edge case below structural and resource caps', () => {
    const layout = largeSyntheticLayout();
    const metrics = createGridRoutingInstrumentation();

    runGridLayoutCore(layout, { metrics });

    // These counters enforce the large-case complexity and resource contract; valid geometry alone
    // would not detect a regression to per-edge topology construction or graph search.
    expect(metrics.resourceLimitFallbacks).toBe(0);
    expect(metrics.fallbackValidationFailures).toBe(0);
    expect(metrics.baseTopologyBuilds).toBe(0);
    expect(metrics.searches).toBe(0);
    expect(metrics.baseVertices).toBeLessThan(50_000);
    expect(metrics.baseAdjacencyEntries).toBeLessThan(200_000);
    expect(metrics.endpointOverlayVertices).toBeLessThanOrEqual(metrics.endpointOverlayBuilds * 32);
    expect(metrics.expandedStates).toBeLessThan(2_000_000);
    expect(metrics.estimatedBytes).toBeLessThan(64 * 1024 * 1024);
  }, 10_000);

  it('keeps a large search-routed case below structural and resource caps', () => {
    const layout = largeSearchLayout();
    const metrics = createGridRoutingInstrumentation();

    runGridLayoutCore(layout, { metrics });

    // These counters prove the large fixture exercises bounded search while sharing one topology;
    // output geometry alone cannot expose accidental per-edge topology or unbounded search growth.
    expect(metrics.resourceLimitFallbacks).toBe(0);
    expect(metrics.fallbackValidationFailures).toBe(0);
    expect(metrics.baseTopologyBuilds).toBe(1);
    expect(metrics.searches).toBeGreaterThan(0);
    expect(metrics.searches).toBeLessThanOrEqual(200);
    expect(metrics.baseVertices).toBeLessThan(50_000);
    expect(metrics.baseAdjacencyEntries).toBeLessThan(200_000);
    expect(metrics.endpointOverlayVertices).toBeLessThanOrEqual(metrics.endpointOverlayBuilds * 32);
    expect(metrics.expandedStates).toBeLessThan(2_000_000);
    expect(metrics.estimatedBytes).toBeLessThan(64 * 1024 * 1024);
  }, 10_000);
});
