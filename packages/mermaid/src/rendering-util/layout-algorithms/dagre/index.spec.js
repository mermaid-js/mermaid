import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import { select } from 'd3';
import { Graph } from 'dagre-d3-es/src/graphlib/index.js';
import {
  applyDagreLayoutResult,
  getEdgesToRender,
  measureDagreLayout,
  prepareLayoutForDagre,
  runDagreLayoutCore,
} from './index.js';
import mermaid from '../../../mermaid.js';
import { mermaidAPI } from '../../../mermaidAPI.js';

const svgNumbers = (value) => (value.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi) || []).map(Number);

const translation = (element) => svgNumbers(element.getAttribute('transform') || '0 0');

const polygonPoints = (element) => {
  const coordinates = svgNumbers(element.getAttribute('points'));
  return Array.from({ length: coordinates.length / 2 }, (_, index) =>
    coordinates.slice(index * 2, index * 2 + 2)
  );
};

const distanceToSegment = (point, start, end) => {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const fraction = Math.max(
    0,
    Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy))
  );
  return Math.hypot(point[0] - start[0] - fraction * dx, point[1] - start[1] - fraction * dy);
};

const sourceBoundaryDistance = (node, point) => {
  const shape = node.querySelector(':scope > polygon, :scope > circle');
  const nodeOffset = translation(node);
  const shapeOffset = translation(shape);
  const localPoint = point.map((value, index) => value - nodeOffset[index] - shapeOffset[index]);
  if (shape.tagName === 'circle') {
    return Math.abs(
      Math.hypot(
        localPoint[0] - Number(shape.getAttribute('cx')),
        localPoint[1] - Number(shape.getAttribute('cy'))
      ) - Number(shape.getAttribute('r'))
    );
  }
  const points = polygonPoints(shape);
  return Math.min(
    ...points.map((start, index) =>
      distanceToSegment(localPoint, start, points[(index + 1) % points.length])
    )
  );
};

const setupDom = ({ measureSvgGeometry = false } = {}) => {
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  const oldMutationObserver = globalThis.MutationObserver;
  const dom = new JSDOM('<html lang="en"><body><div id="container"></div></body></html>', {
    url: 'http://localhost/',
    resources: 'usable',
    beforeParse(window) {
      window.Element.prototype.getBBox = function () {
        if (measureSvgGeometry && this.matches('g.node')) {
          const shape = this.querySelector(':scope > polygon, :scope > circle, :scope > rect');
          if (shape) {
            const bounds = shape.getBBox();
            const [x, y] = translation(shape);
            return { ...bounds, x: bounds.x + x, y: bounds.y + y };
          }
        }
        if (measureSvgGeometry && this.matches('polygon')) {
          const points = polygonPoints(this);
          const xs = points.map(([x]) => x);
          const ys = points.map(([, y]) => y);
          return {
            x: Math.min(...xs),
            y: Math.min(...ys),
            width: Math.max(...xs) - Math.min(...xs),
            height: Math.max(...ys) - Math.min(...ys),
          };
        }
        if (measureSvgGeometry && this.matches('circle')) {
          const radius = Number(this.getAttribute('r'));
          return {
            x: Number(this.getAttribute('cx')) - radius,
            y: Number(this.getAttribute('cy')) - radius,
            width: 2 * radius,
            height: 2 * radius,
          };
        }
        if (measureSvgGeometry && this.matches('rect')) {
          return {
            x: Number(this.getAttribute('x')),
            y: Number(this.getAttribute('y')),
            width: Number(this.getAttribute('width')),
            height: Number(this.getAttribute('height')),
          };
        }
        return { x: 0, y: 0, width: 100, height: 50 };
      };
      window.Element.prototype.getComputedTextLength = () => 50;
    },
  });

  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.MutationObserver = undefined;

  return () => {
    globalThis.window = oldWindow;
    globalThis.document = oldDocument;
    globalThis.MutationObserver = oldMutationObserver;
  };
};

const getCyclicPaths = (document) =>
  [...document.querySelectorAll('.edgePaths path')].filter((path) =>
    path.getAttribute('data-id')?.includes('cyclic-special')
  );

const expectFinitePaths = (paths) => {
  for (const path of paths) {
    const pathData = path.getAttribute('d');
    expect(pathData).toBeTruthy();
    expect(pathData).not.toMatch(/NaN|undefined/);
  }
};

describe('getEdgesToRender', () => {
  beforeAll(async () => {
    await mermaid.registerExternalDiagrams([]);
    mermaid.initialize({
      deterministicIds: true,
      deterministicIDSeed: '',
      flowchart: { htmlLabels: false },
      logLevel: 5,
    });
  });

  it('copies DAGRE node and edge layout back onto LayoutData', () => {
    const graph = new Graph({ multigraph: true, compound: true });
    graph.setGraph({ rankdir: 'TB' });
    graph.setNode('A', { id: 'A', x: 10, y: 20, width: 30, height: 40 });
    graph.setNode('B', { id: 'B', x: 100, y: 120, width: 30, height: 40 });
    graph.setEdge(
      'A',
      'B',
      {
        id: 'A-B',
        start: 'A',
        end: 'B',
        points: [
          { x: 10, y: 20 },
          { x: 100, y: 120 },
        ],
        x: 55,
        y: 70,
      },
      'A-B'
    );
    const data4Layout = {
      nodes: [
        { id: 'A', isGroup: false },
        { id: 'B', isGroup: false },
      ],
      edges: [{ id: 'A-B', start: 'A', end: 'B' }],
    };

    applyDagreLayoutResult(data4Layout, {
      graph,
      mergeSelfLoops: true,
      subGraphTitleTotalMargin: 10,
    });

    expect(data4Layout.nodes[0]).toMatchObject({ x: 10, y: 25, width: 30, height: 40 });
    expect(data4Layout.nodes[1]).toMatchObject({ x: 100, y: 125, width: 30, height: 40 });
    expect(graph.node('A')).toMatchObject({ x: 10, y: 25, width: 30, height: 40 });
    expect(graph.node('B')).toMatchObject({ x: 100, y: 125, width: 30, height: 40 });
    expect(data4Layout.edges).toEqual([
      expect.objectContaining({
        id: 'A-B',
        start: 'A',
        end: 'B',
        points: [
          { x: 10, y: 25 },
          { x: 100, y: 125 },
        ],
        x: 55,
        y: 70,
      }),
    ]);
  });

  it('normalizes merged self-loops back onto LayoutData', () => {
    const graph = new Graph({ multigraph: true, compound: true });
    graph.setNode('A', { id: 'A', x: 10, y: 10, width: 20, height: 20 });
    graph.setNode('A---A---1', { id: 'A---A---1' });
    graph.setNode('A---A---2', { id: 'A---A---2' });

    const originalEdge = {
      id: 'A-A',
      start: 'A',
      end: 'A',
      label: 'loop',
    };
    const segment1 = {
      ...originalEdge,
      id: 'A-cyclic-special-1',
      selfLoop: { id: 'A-A', order: 0 },
      originalEdge,
      points: [],
    };
    const segmentMid = {
      ...originalEdge,
      id: 'A-cyclic-special-mid',
      selfLoop: { id: 'A-A', order: 1 },
      originalEdge,
      points: [],
    };
    const segment2 = {
      ...originalEdge,
      id: 'A-cyclic-special-2',
      selfLoop: { id: 'A-A', order: 2 },
      originalEdge,
      points: [],
    };

    graph.setEdge('A', 'A---A---1', segment1, 'A-cyclic-special-0');
    graph.setEdge('A---A---1', 'A---A---2', segmentMid, 'A-cyclic-special-1');
    graph.setEdge('A---A---2', 'A', segment2, 'A-cyclic-special-2');
    const data4Layout = {
      nodes: [{ id: 'A', isGroup: false }],
      edges: [originalEdge],
    };

    applyDagreLayoutResult(data4Layout, {
      graph,
      mergeSelfLoops: true,
      subGraphTitleTotalMargin: 0,
    });

    expect(data4Layout.edges).toHaveLength(1);
    expect(data4Layout.edges[0]).toMatchObject({
      id: 'A-A',
      start: 'A',
      end: 'A',
      label: 'loop',
      points: [
        { x: -8, y: 0 },
        { x: -8, y: -24 },
        { x: 28, y: -24 },
        { x: 28, y: 0 },
      ],
    });
    expect(data4Layout.edges[0].selfLoop).toBeUndefined();
  });

  // Documents a known limitation: normalization only covers the top-level graph. Cluster
  // children and intra-cluster edges live in the nested cluster graph (own coordinate space,
  // rendered by the recursive paint path) and are not written back onto LayoutData.
  it('leaves recursive cluster children untouched and drops intra-cluster edges from LayoutData', () => {
    const graph = new Graph({ multigraph: true, compound: true });
    graph.setGraph({ rankdir: 'TB' });
    // Top-level graph after cluster extraction: the cluster is a single clusterNode whose
    // children were moved into its nested graph.
    graph.setNode('cluster1', {
      id: 'cluster1',
      clusterNode: true,
      x: 50,
      y: 60,
      width: 80,
      height: 70,
    });
    graph.setNode('X', { id: 'X', x: 50, y: 200, width: 30, height: 40 });
    graph.setEdge(
      'X',
      'cluster1',
      {
        id: 'X-cluster1',
        start: 'X',
        end: 'cluster1',
        points: [{ x: 50, y: 150 }],
      },
      'X-cluster1'
    );
    const data4Layout = {
      nodes: [
        { id: 'cluster1', isGroup: true },
        { id: 'X', isGroup: false },
        { id: 'child1', isGroup: false, parentId: 'cluster1' },
      ],
      edges: [
        { id: 'X-cluster1', start: 'X', end: 'cluster1' },
        { id: 'child1-child2', start: 'child1', end: 'child2' },
      ],
    };

    applyDagreLayoutResult(data4Layout, {
      graph,
      mergeSelfLoops: true,
      subGraphTitleTotalMargin: 10,
    });

    // Top-level nodes are normalized (cluster gets the full margin, regular nodes half).
    expect(data4Layout.nodes[0]).toMatchObject({ x: 50, y: 70, width: 80, height: 70 });
    expect(data4Layout.nodes[1]).toMatchObject({ x: 50, y: 205, width: 30, height: 40 });
    // The cluster child is not in the top-level graph — it keeps its pre-layout values.
    expect(data4Layout.nodes[2].x).toBeUndefined();
    expect(data4Layout.nodes[2].y).toBeUndefined();
    // Intra-cluster edges are absent from the normalized edges.
    expect(data4Layout.edges.map((edge) => edge.id)).toEqual(['X-cluster1']);
  });

  it('creates one compact render edge from self-loop layout segments', () => {
    const graph = new Graph({ multigraph: true, compound: true });
    graph.setNode('A', { id: 'A', x: 10, y: 10, width: 20, height: 20 });

    const originalEdge = {
      id: 'A-A',
      start: 'A',
      end: 'A',
      label: 'loop',
      arrowTypeStart: 'normal',
      arrowTypeEnd: 'normal',
    };

    const segment1 = {
      ...originalEdge,
      id: 'A-cyclic-special-1',
      selfLoop: { id: 'A-A', order: 0 },
      originalEdge,
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ],
    };
    const segmentMid = {
      ...originalEdge,
      id: 'A-cyclic-special-mid',
      selfLoop: { id: 'A-A', order: 1 },
      originalEdge,
      points: [
        { x: 10, y: 0 },
        { x: 20, y: 10 },
      ],
    };
    const segment2 = {
      ...originalEdge,
      id: 'A-cyclic-special-2',
      selfLoop: { id: 'A-A', order: 2 },
      originalEdge,
      points: [
        { x: 20, y: 10 },
        { x: 30, y: 10 },
      ],
    };

    graph.setNode('A---A---1', { id: 'A---A---1' });
    graph.setNode('A---A---2', { id: 'A---A---2' });
    graph.setEdge('A', 'A---A---1', segment1, 'A-cyclic-special-0');
    graph.setEdge('A---A---1', 'A---A---2', segmentMid, 'A-cyclic-special-1');
    graph.setEdge('A---A---2', 'A', segment2, 'A-cyclic-special-2');

    const edgesToRender = getEdgesToRender(graph);

    expect(edgesToRender).toHaveLength(1);
    expect(edgesToRender[0].edge.id).toBe('A-A');
    expect(edgesToRender[0].edge.selfLoop).toBeUndefined();
    expect(edgesToRender[0].edge.points).toEqual([
      { x: -8, y: 0 },
      { x: -8, y: -24 },
      { x: 28, y: -24 },
      { x: 28, y: 0 },
    ]);
    expect(edgesToRender[0].edge.x).toBe(10);
    expect(edgesToRender[0].edge.y).toBe(-28);
    expect(edgesToRender[0].edge.label).toBe('loop');
  });

  it('places compact self-loops on the side chosen by the layout', () => {
    const graph = new Graph({ multigraph: true, compound: true });
    graph.setNode('A', { id: 'A', x: 10, y: 10, width: 20, height: 20 });
    graph.setNode('A---A---1', { id: 'A---A---1', x: 80, y: 5 });
    graph.setNode('A---A---2', { id: 'A---A---2', x: 80, y: 15 });

    const originalEdge = {
      id: 'A-A',
      start: 'A',
      end: 'A',
      label: 'loop',
      arrowTypeStart: 'normal',
      arrowTypeEnd: 'normal',
    };
    const segment1 = {
      ...originalEdge,
      id: 'A-cyclic-special-1',
      selfLoop: { id: 'A-A', order: 0 },
      originalEdge,
      points: [],
    };
    const segmentMid = {
      ...originalEdge,
      id: 'A-cyclic-special-mid',
      selfLoop: { id: 'A-A', order: 1 },
      originalEdge,
      points: [],
      width: 20,
      height: 10,
    };
    const segment2 = {
      ...originalEdge,
      id: 'A-cyclic-special-2',
      selfLoop: { id: 'A-A', order: 2 },
      originalEdge,
      points: [],
    };

    graph.setEdge('A', 'A---A---1', segment1, 'A-cyclic-special-0');
    graph.setEdge('A---A---1', 'A---A---2', segmentMid, 'A-cyclic-special-1');
    graph.setEdge('A---A---2', 'A', segment2, 'A-cyclic-special-2');

    const edgesToRender = getEdgesToRender(graph);

    expect(edgesToRender[0].edge.points).toEqual([
      { x: 20, y: -8 },
      { x: 44, y: -8 },
      { x: 44, y: 28 },
      { x: 20, y: 28 },
    ]);
    expect(edgesToRender[0].edge.x).toBe(58);
    expect(edgesToRender[0].edge.y).toBe(10);
  });

  it('keeps regular edges unchanged', () => {
    const graph = new Graph({ multigraph: true, compound: true });
    graph.setNode('A', { id: 'A' });
    graph.setNode('B', { id: 'B' });
    const edge = {
      id: 'A-B',
      start: 'A',
      end: 'B',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ],
    };
    graph.setEdge('A', 'B', edge, 'A-B');

    const edgesToRender = getEdgesToRender(graph);

    expect(edgesToRender).toHaveLength(1);
    expect(edgesToRender[0]).toEqual({ edge, start: 'A', end: 'B' });
  });

  it('keeps self-loop layout segments unchanged when merging is disabled', () => {
    const graph = new Graph({ multigraph: true, compound: true });
    graph.setNode('A', { id: 'A', x: 10, y: 10, width: 20, height: 20 });
    graph.setNode('A---A---1', { id: 'A---A---1' });
    graph.setNode('A---A---2', { id: 'A---A---2' });

    const originalEdge = {
      id: 'A-A',
      start: 'A',
      end: 'A',
      label: 'loop',
    };
    const segment1 = {
      ...originalEdge,
      id: 'A-cyclic-special-1',
      selfLoop: { id: 'A-A', order: 0 },
      originalEdge,
    };
    const segmentMid = {
      ...originalEdge,
      id: 'A-cyclic-special-mid',
      selfLoop: { id: 'A-A', order: 1 },
      originalEdge,
    };
    const segment2 = {
      ...originalEdge,
      id: 'A-cyclic-special-2',
      selfLoop: { id: 'A-A', order: 2 },
      originalEdge,
    };

    graph.setEdge('A', 'A---A---1', segment1, 'A-cyclic-special-0');
    graph.setEdge('A---A---1', 'A---A---2', segmentMid, 'A-cyclic-special-1');
    graph.setEdge('A---A---2', 'A', segment2, 'A-cyclic-special-2');

    const edgesToRender = getEdgesToRender(graph, 0, { mergeSelfLoops: false });

    expect(edgesToRender).toEqual([
      { edge: segment1, start: 'A', end: 'A---A---1' },
      { edge: segmentMid, start: 'A---A---1', end: 'A---A---2' },
      { edge: segment2, start: 'A---A---2', end: 'A' },
    ]);
  });

  it('measures DAGRE DOM separately from running the layout core', async () => {
    const restoreDom = setupDom();

    try {
      const data4Layout = {
        type: 'flowchart',
        diagramId: 'dagre-phase-test',
        direction: 'TB',
        config: {
          flowchart: {
            htmlLabels: false,
            nodeSpacing: 50,
            rankSpacing: 50,
          },
        },
        nodes: [
          {
            id: 'A',
            domId: 'dagre-phase-test-A',
            label: 'A',
            shape: 'rect',
            isGroup: false,
            padding: 0,
          },
          {
            id: 'B',
            domId: 'dagre-phase-test-B',
            label: 'B',
            shape: 'rect',
            isGroup: false,
            padding: 0,
          },
        ],
        edges: [
          {
            id: 'A-B',
            start: 'A',
            end: 'B',
            label: '',
            arrowTypeStart: 'none',
            arrowTypeEnd: 'arrow_point',
          },
        ],
      };
      const preparedLayout = prepareLayoutForDagre(data4Layout);
      const element = select(document.querySelector('#container')).append('svg').append('g');

      const measuredLayout = await measureDagreLayout(data4Layout, { element, preparedLayout });

      expect(measuredLayout.graph.node('A').width).toBeGreaterThan(0);
      expect(measuredLayout.graph.node('A').x).toBeUndefined();

      runDagreLayoutCore(data4Layout, { element, preparedLayout });

      expect(measuredLayout.graph.node('A').x).toEqual(expect.any(Number));
      expect(measuredLayout.graph.node('B').y).toEqual(expect.any(Number));
      expect(data4Layout.nodes[0].x).toEqual(expect.any(Number));
      expect(data4Layout.nodes[1].y).toEqual(expect.any(Number));
      expect(data4Layout.edges[0].points).toEqual(expect.any(Array));
    } finally {
      restoreDom();
    }
  });

  it('requires DAGRE measurement before running the layout core', () => {
    const data4Layout = {
      type: 'flowchart',
      diagramId: 'dagre-phase-contract-test',
      direction: 'TB',
      config: {},
      nodes: [],
      edges: [],
    };

    expect(() => runDagreLayoutCore(data4Layout, {})).toThrow(
      'runDagreLayoutCore requires measureDagreLayout to run first'
    );
  });

  it('renders a flowchart self-loop as one SVG path', async () => {
    const restoreDom = setupDom();

    try {
      const { svg } = await mermaidAPI.render(
        'self-loop-test',
        `flowchart TD
A[Christmas] -->|Get money| B(Go shopping)
C --> C`
      );
      const dom = new JSDOM(svg);
      const edgePaths = dom.window.document.querySelectorAll('.edgePaths path.flowchart-link');
      const selfLoopPath = [...edgePaths].find((path) =>
        path.getAttribute('data-id')?.includes('C')
      );

      expect(edgePaths).toHaveLength(2);
      expect(selfLoopPath).toBeTruthy();
      expect(selfLoopPath?.getAttribute('d')).toBeTruthy();
      expect(
        dom.window.document.querySelectorAll('.edgePaths path[data-id*="cyclic-special"]')
      ).toHaveLength(0);
    } finally {
      restoreDom();
    }
  });

  it('keeps reverse-order nested flowchart subgraphs visible through shared paint', async () => {
    const restoreDom = setupDom();

    try {
      const { svg } = await mermaidAPI.render(
        'reverse-order-subgraph-test',
        `flowchart LR
        a -->b
        subgraph A
        B
        end
        subgraph B
        b
        end`
      );
      const dom = new JSDOM(svg);
      const clusters = [...dom.window.document.querySelectorAll('.cluster')];

      expect(clusters).toHaveLength(2);
      expect(clusters.map((cluster) => cluster.id)).toEqual(
        expect.arrayContaining([
          expect.stringContaining('reverse-order-subgraph-test-A'),
          expect.stringContaining('reverse-order-subgraph-test-B'),
        ])
      );
    } finally {
      restoreDom();
    }
  });

  it('renders a recursive ER relationship as one logical self-loop path', async () => {
    const restoreDom = setupDom();

    try {
      const { svg } = await mermaidAPI.render(
        'er-recursive-self-loop-test',
        `erDiagram
        CUSTOMER ||..o{ CUSTOMER : refers`
      );
      const dom = new JSDOM(svg);
      const cyclicPaths = getCyclicPaths(dom.window.document);
      const relationshipPaths = dom.window.document.querySelectorAll(
        '.edgePaths path.relationshipLine'
      );

      expect(cyclicPaths).toHaveLength(0);
      expect(relationshipPaths).toHaveLength(1);
      expect(relationshipPaths[0].getAttribute('data-id')).not.toContain('cyclic-special');
      expect(relationshipPaths[0].getAttribute('id')).toContain('entity-CUSTOMER-0');
      expect(relationshipPaths[0].getAttribute('id')).not.toContain('cyclic-special');
      expectFinitePaths(relationshipPaths);
    } finally {
      restoreDom();
    }
  });

  it('preserves class self-loop multiplicity terminal labels when merging', () => {
    const graph = new Graph({ multigraph: true, compound: true });
    graph.setNode('SelfReferential', {
      id: 'SelfReferential',
      x: 50,
      y: 50,
      width: 100,
      height: 60,
    });
    graph.setNode('SelfReferential---SelfReferential---1', {
      id: 'SelfReferential---SelfReferential---1',
      x: 120,
      y: 50,
    });
    graph.setNode('SelfReferential---SelfReferential---2', {
      id: 'SelfReferential---SelfReferential---2',
      x: 120,
      y: 90,
    });

    const originalEdge = {
      id: 'SelfReferential-SelfReferential',
      start: 'SelfReferential',
      end: 'SelfReferential',
      label: 'referenced',
      arrowTypeStart: 'none',
      arrowTypeEnd: 'extension',
      startLabelRight: '1',
      endLabelLeft: '0..1',
    };
    const segment1 = {
      ...originalEdge,
      id: 'SelfReferential-cyclic-special-1',
      selfLoop: { id: originalEdge.id, order: 0 },
      originalEdge,
      points: [],
    };
    const segmentMid = {
      ...originalEdge,
      id: 'SelfReferential-cyclic-special-mid',
      selfLoop: { id: originalEdge.id, order: 1 },
      originalEdge,
      points: [],
      width: 52,
      height: 14,
      labelStyle: 'label-style',
    };
    const segment2 = {
      ...originalEdge,
      id: 'SelfReferential-cyclic-special-2',
      selfLoop: { id: originalEdge.id, order: 2 },
      originalEdge,
      points: [],
    };

    graph.setEdge(
      'SelfReferential',
      'SelfReferential---SelfReferential---1',
      segment1,
      'SelfReferential-cyclic-special-0'
    );
    graph.setEdge(
      'SelfReferential---SelfReferential---1',
      'SelfReferential---SelfReferential---2',
      segmentMid,
      'SelfReferential-cyclic-special-1'
    );
    graph.setEdge(
      'SelfReferential---SelfReferential---2',
      'SelfReferential',
      segment2,
      'SelfReferential-cyclic-special-2'
    );

    const edgesToRender = getEdgesToRender(graph);

    expect(edgesToRender).toHaveLength(1);
    expect(edgesToRender[0].edge).toMatchObject({
      id: 'SelfReferential-SelfReferential',
      start: 'SelfReferential',
      end: 'SelfReferential',
      label: 'referenced',
      arrowTypeStart: 'none',
      arrowTypeEnd: 'extension',
      startLabelRight: '1',
      endLabelLeft: '0..1',
      labelStyle: 'label-style',
    });
    expect(edgesToRender[0].edge.selfLoop).toBeUndefined();
    expect(edgesToRender[0].edge.originalEdge).toBeUndefined();
  });

  it('renders a recursive class relationship as one path with multiplicity labels', async () => {
    const restoreDom = setupDom();

    try {
      const { svg } = await mermaidAPI.render(
        'class-self-loop-shared-paint-test',
        `classDiagram
class SelfReferential{
  +int id
  +int self_referential_id
  +SelfReferential referenced
}
SelfReferential "1" --> "0..1" SelfReferential : referenced`
      );
      const dom = new JSDOM(svg);
      const document = dom.window.document;
      const cyclicPaths = getCyclicPaths(document);
      const edgePaths = document.querySelectorAll('.edgePaths path[data-edge="true"]');
      const terminalLabels = [...document.querySelectorAll('.edgeTerminals')].map((label) =>
        label.textContent?.trim()
      );

      expect(cyclicPaths).toHaveLength(0);
      expect(edgePaths).toHaveLength(1);
      expect(terminalLabels).toContain('1');
      expect(terminalLabels).toContain('0..1');
      expectFinitePaths(edgePaths);
    } finally {
      restoreDom();
    }
  });

  it.each(
    ['LR', 'RL', 'TB', 'BT'].flatMap((direction) =>
      ['f{9}', 'f((9))'].flatMap((source) =>
        ['', 'h --> outside'].map((externalConnection) => ({
          direction,
          source,
          externalConnection,
        }))
      )
    )
  )(
    'keeps the rendered source boundary for $direction $source with external link $externalConnection (#6626)',
    async ({ direction, source, externalConnection }) => {
      const restoreDom = setupDom({ measureSvgGeometry: true });

      try {
        const { svg } = await mermaidAPI.render(
          'shape-to-subgraph-test',
          `---
config:
  layout: dagre
---
flowchart ${direction}
subgraph c
  i --> h
end
${source} --> x{d}
f --> c
${externalConnection}`
        );
        const dom = new JSDOM(svg);
        const document = dom.window.document;
        const path = document.querySelector('.edgePaths path[data-id="L_f_c_0"]');
        const coordinates = svgNumbers(path.getAttribute('d'));
        const node = document.querySelector('.node[id*="-flowchart-f-"]');

        expectFinitePaths([path]);
        expect(sourceBoundaryDistance(node, coordinates.slice(0, 2))).toBeLessThan(0.51);
        if (externalConnection) {
          const cluster = document.querySelector('.cluster[id$="-c"] > rect');
          const end = coordinates.slice(-2);
          const x = Number(cluster.getAttribute('x'));
          const y = Number(cluster.getAttribute('y'));
          const width = Number(cluster.getAttribute('width'));
          const height = Number(cluster.getAttribute('height'));
          if (direction === 'LR' || direction === 'RL') {
            expect(end[0] + (direction === 'LR' ? 4 : -4)).toBeCloseTo(
              direction === 'LR' ? x : x + width,
              3
            );
            expect(end[1]).toBeGreaterThan(y);
            expect(end[1]).toBeLessThan(y + height);
          } else {
            expect(end[1] + (direction === 'TB' ? 4 : -4)).toBeCloseTo(
              direction === 'TB' ? y : y + height,
              3
            );
            expect(end[0]).toBeGreaterThan(x);
            expect(end[0]).toBeLessThan(x + width);
          }
          expect(path.getAttribute('marker-end')).toContain('pointEnd');
        }
      } finally {
        restoreDom();
      }
    }
  );

  it.each(['LR', 'RL', 'TB', 'BT'])(
    'keeps cluster connections and self-loops finite in %s (#6626)',
    async (direction) => {
      const restoreDom = setupDom({ measureSvgGeometry: true });
      try {
        const { svg } = await mermaidAPI.render(
          'shape-to-subgraph-controls',
          `---
config:
  layout: dagre
---
flowchart ${direction}
subgraph c
  i --> h
end
subgraph d
  j --> k
end
f{9} <--> c
c --> f
c --> d
c --> c
f --> f
h --> outside
k --> outside2`
        );
        const dom = new JSDOM(svg);
        const paths = dom.window.document.querySelectorAll('.edgePaths path');
        expect(paths).toHaveLength(9);
        expectFinitePaths(paths);
      } finally {
        restoreDom();
      }
    }
  );

  it('renders a flowchart subgraph through the shared paint path', async () => {
    const restoreDom = setupDom();

    try {
      const { svg } = await mermaidAPI.render(
        'shared-paint-subgraph-test',
        `flowchart TD
subgraph clusterA[Cluster A]
A --> B
end
clusterA --> C`
      );
      const dom = new JSDOM(svg);

      expect(dom.window.document.querySelectorAll('.cluster')).toHaveLength(1);
      expect(dom.window.document.querySelectorAll('.node')).toHaveLength(3);
      expect(dom.window.document.querySelectorAll('.edgePaths path.flowchart-link')).toHaveLength(
        2
      );
    } finally {
      restoreDom();
    }
  });

  it('renders hand-drawn class diagrams with nested namespaces', async () => {
    const restoreDom = setupDom();

    try {
      const dotNotation = await mermaidAPI.render(
        'class-nested-namespace-dot-test',
        `%%{init: {"look": "handDrawn", "htmlLabels": true}}%%
classDiagram
namespace Company.Engineering.Backend {
  class Developer {
    +writeCode()
  }
}
namespace Company.Engineering.Frontend {
  class Designer {
    +createMockup()
  }
}
namespace Company.Engineering {
  class TechLead {
    +planSprint()
  }
}
TechLead --> Developer : leads
TechLead --> Designer : leads`
      );
      const syntactic = await mermaidAPI.render(
        'class-nested-namespace-syntax-test',
        `%%{init: {"look": "handDrawn", "htmlLabels": true}}%%
classDiagram
namespace Platform {
  namespace Auth {
    class UserService {
      +login()
      +logout()
    }
  }
  namespace Data {
    class Repository {
      +find()
      +save()
    }
  }
  class Gateway {
    +route()
  }
}
Gateway --> UserService : delegates
Gateway --> Repository : delegates`
      );

      expect(new JSDOM(dotNotation.svg).window.document.querySelector('svg')).toBeTruthy();
      expect(new JSDOM(syntactic.svg).window.document.querySelector('svg')).toBeTruthy();
    } finally {
      restoreDom();
    }
  });
});

describe('prepareLayoutForDagre spacing precedence (#7932)', () => {
  const base = { direction: 'TB', nodes: [], edges: [] };

  it('honours the spacing the diagram renderer set on data4Layout over the flowchart config defaults', () => {
    const { graph } = prepareLayoutForDagre({
      ...base,
      nodeSpacing: 120,
      rankSpacing: 130,
      // The resolved site config always carries the flowchart schema defaults.
      config: { flowchart: { nodeSpacing: 50, rankSpacing: 50 } },
    });
    expect(graph.graph().nodesep).toBe(120);
    expect(graph.graph().ranksep).toBe(130);
  });

  it('lets an explicit top-level config override win over the diagram value', () => {
    const { graph } = prepareLayoutForDagre({
      ...base,
      nodeSpacing: 120,
      rankSpacing: 130,
      config: {
        nodeSpacing: 200,
        rankSpacing: 210,
        flowchart: { nodeSpacing: 50, rankSpacing: 50 },
      },
    });
    expect(graph.graph().nodesep).toBe(200);
    expect(graph.graph().ranksep).toBe(210);
  });

  it('falls back to the flowchart config when the diagram sets no spacing', () => {
    const { graph } = prepareLayoutForDagre({
      ...base,
      config: { flowchart: { nodeSpacing: 60, rankSpacing: 70 } },
    });
    expect(graph.graph().nodesep).toBe(60);
    expect(graph.graph().ranksep).toBe(70);
  });
});
