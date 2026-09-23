import { describe, expect, it } from 'vitest';
import type { Edge, LayoutData, Node } from '../../types.js';
import {
  createGridEdgeLabelInstrumentation,
  positionGridEdgeLabels,
  prepareGridLayout,
} from './edgeLabels.js';
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

function manualNode(id: string, x: number, y: number, width = 40, height = 40): Node {
  return {
    id,
    x,
    y,
    width,
    height,
    isGroup: false,
    shape: 'rect',
  } as Node;
}

function manualEdge(
  id: string,
  start: string,
  end: string,
  points: { x: number; y: number }[],
  label?: string
): Edge {
  return {
    id,
    start,
    end,
    points,
    label,
    arrowTypeStart: 'none',
    arrowTypeEnd: 'arrow_point',
    curve: 'linear',
    type: 'arrow_point',
  } as Edge;
}

function denseLabelRoutingLayout(): LayoutData {
  const horizontalLabels = 12;
  const verticalCrossings = 18;
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const firstRowY = 120;
  const rowStep = 56;
  const leftX = 60;
  const rightX = 980;
  const topY = 40;
  const bottomY = firstRowY + (horizontalLabels - 1) * rowStep + 80;
  const firstColumnX = 190;
  const columnStep = 36;

  for (let row = 0; row < horizontalLabels; row++) {
    const y = firstRowY + row * rowStep;
    nodes.push(
      manualNode(`h-left-${row}`, leftX, y, 20, 20),
      manualNode(`h-right-${row}`, rightX, y, 20, 20)
    );
    edges.push(
      manualEdge(
        `h-${row}`,
        `h-left-${row}`,
        `h-right-${row}`,
        [
          { x: leftX + 20, y },
          { x: rightX - 20, y },
        ],
        `label-${row}`
      )
    );
  }

  for (let column = 0; column < verticalCrossings; column++) {
    const x = firstColumnX + column * columnStep;
    nodes.push(
      manualNode(`v-top-${column}`, x, topY, 20, 20),
      manualNode(`v-bottom-${column}`, x, bottomY, 20, 20)
    );
    edges.push(
      manualEdge(`v-${column}`, `v-top-${column}`, `v-bottom-${column}`, [
        { x, y: topY + 20 },
        { x, y: bottomY - 20 },
      ])
    );
  }

  return {
    nodes,
    edges,
    config: {
      layout: 'grid',
    } as LayoutData['config'],
  };
}

function fullSpanFallbackLayout(): LayoutData {
  return {
    nodes: [
      manualNode('start', 40, 150, 20, 20),
      manualNode('end', 460, 150, 20, 20),
      manualNode('blocker', 250, 150, 80, 80),
    ],
    edges: [
      manualEdge(
        'wide-label',
        'start',
        'end',
        [
          { x: 50, y: 150 },
          { x: 450, y: 150 },
        ],
        'wide label'
      ),
    ],
    config: {
      layout: 'grid',
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

  it('keeps parallel/reverse route arrays and routing metrics byte-equivalent across 100 runs', () => {
    const baseline = representativeParallelLayout();
    const baselineMetrics = createGridRoutingInstrumentation();
    runGridLayoutCore(baseline, baselineMetrics);
    const expected = JSON.stringify({
      layout: signature(baseline),
      expandedStates: baselineMetrics.expandedStates,
      routeLength: baselineMetrics.routeLength,
      bendCount: baselineMetrics.bendCount,
      crossingCount: baselineMetrics.crossingCount,
      sharedLength: baselineMetrics.sharedLength,
      routeOrder: baselineMetrics.routeOrder,
      routes: baselineMetrics.routes,
      resourceLimitFallbacks: baselineMetrics.resourceLimitFallbacks,
      fallbackReasons: baselineMetrics.fallbackReasons,
    });

    for (let index = 0; index < 100; index++) {
      const next = structuredClone(representativeParallelLayout());
      const metrics = createGridRoutingInstrumentation();
      runGridLayoutCore(next, metrics);
      expect(
        JSON.stringify({
          layout: signature(next),
          expandedStates: metrics.expandedStates,
          routeLength: metrics.routeLength,
          bendCount: metrics.bendCount,
          crossingCount: metrics.crossingCount,
          sharedLength: metrics.sharedLength,
          routeOrder: metrics.routeOrder,
          routes: metrics.routes,
          resourceLimitFallbacks: metrics.resourceLimitFallbacks,
          fallbackReasons: metrics.fallbackReasons,
        })
      ).toBe(expected);
    }
  });

  it.fails('lays out 1000 nodes and 500 edges within the deferred 500ms budget', () => {
    const layout = largeSyntheticLayout();
    const start = performance.now();
    runGridLayoutCore(layout);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
  });

  // Coverage instrumentation pushes this test past Vitest's 5-second default;
  // non-coverage runs remain below it.
  it('keeps the 1000-node/500-edge case below structural and resource caps', () => {
    const layout = largeSyntheticLayout();
    const metrics = createGridRoutingInstrumentation();

    runGridLayoutCore(layout, metrics);

    expect(metrics.resourceLimitFallbacks).toBe(0);
    expect(metrics.fallbackValidationFailures).toBe(0);
    expect(metrics.baseVertices).toBeLessThan(50_000);
    expect(metrics.baseAdjacencyEntries).toBeLessThan(200_000);
    expect(metrics.endpointOverlayVertices).toBeLessThanOrEqual(metrics.endpointOverlayBuilds * 32);
    expect(metrics.expandedStates).toBeLessThan(2_000_000);
    expect(metrics.estimatedBytes).toBeLessThan(64 * 1024 * 1024);
  }, 10_000);

  it('uses coordinate-compressed label queries for very large coordinate spans', () => {
    const layout = fullSpanFallbackLayout();
    for (const node of layout.nodes) {
      if (typeof node.x === 'number') {
        node.x += 1_000_000_000;
      }
    }
    for (const edge of layout.edges) {
      edge.points = edge.points?.map((point) => ({ ...point, x: point.x + 1_000_000_000 }));
    }
    prepareGridLayout(layout);
    const labelNode = layout.nodes.find((node) => node.id === layout.edges[0].labelNodeId);
    if (labelNode) {
      labelNode.width = 320;
      labelNode.height = 28;
    }

    const metrics = createGridEdgeLabelInstrumentation();
    positionGridEdgeLabels(layout, metrics);

    expect(Number.isFinite(labelNode?.x)).toBe(true);
    expect(Number.isFinite(labelNode?.y)).toBe(true);
    expect(layout.edges[0].points?.length).toBeGreaterThan(2);
    expect(metrics.fullNodeObstacleScans).toBe(0);
    expect(metrics.fullEdgeScans).toBe(0);
    expect(metrics.indexCoordinateCount).toBe(100);
    expect(metrics.indexSpanAllocations).toBe(0);
  });

  it('indexes dense label routing instead of rescanning all nodes and edges per candidate', () => {
    const layout = denseLabelRoutingLayout();
    prepareGridLayout(layout);
    for (const node of layout.nodes) {
      if ((node as Node & { isEdgeLabel?: boolean }).isEdgeLabel) {
        node.width = 56;
        node.height = 24;
      }
    }

    const metrics = createGridEdgeLabelInstrumentation();
    positionGridEdgeLabels(layout, metrics);

    expect(
      layout.nodes
        .filter((node) => (node as Node & { isEdgeLabel?: boolean }).isEdgeLabel)
        .every((node) => Number.isFinite(node.x) && Number.isFinite(node.y))
    ).toBe(true);
    expect(
      layout.edges
        .filter((item) => item.id.startsWith('v-'))
        .some((item) => (item.points?.length ?? 0) > 2)
    ).toBe(true);
    expect(metrics.foreignEdgeLookups).toBeGreaterThan(0);
    expect(metrics.segmentRectQueries + metrics.segmentBandQueries).toBeGreaterThan(0);
    expect(metrics.obstacleRectQueries + metrics.obstacleBandQueries).toBeGreaterThan(0);
    expect(metrics.fullNodeObstacleScans).toBe(0);
    expect(metrics.fullEdgeScans).toBe(0);
    expect(metrics.labelPasses).toBeLessThanOrEqual(2);
    expect(metrics.maxReroutesPerEdgePerPass).toBe(1);
  });
});
