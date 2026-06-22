import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LayoutData, Edge, Node } from '../../types.js';
import type { CommonLayoutMeasure, CommonLayoutRenderContext } from './index.js';

interface PreparedLayout {
  graph: string;
}

const mocks = vi.hoisted(() => {
  const callOrder: string[] = [];
  const labelElement = { attr: vi.fn() };
  const terminalElement = { attr: vi.fn() };
  const edgeLabels = new Map<string, typeof labelElement>();
  const terminalLabels = new Map<string, Record<string, typeof terminalElement>>();

  return {
    callOrder,
    labelElement,
    terminalElement,
    edgeLabels,
    terminalLabels,
    calcLabelPosition: vi.fn(),
    calcTerminalLabelPosition: vi.fn(),
    clearClusters: vi.fn(() => callOrder.push('clearClusters')),
    clearEdges: vi.fn(() => callOrder.push('clearEdges')),
    clearGraphlib: vi.fn(() => callOrder.push('clearGraphlib')),
    clearNodes: vi.fn(() => callOrder.push('clearNodes')),
    createGraphWithElements: vi.fn(),
    getConfig: vi.fn(),
    getSubGraphTitleMargins: vi.fn(),
    insertCluster: vi.fn(),
    insertEdge: vi.fn(),
    insertEdgeLabel: vi.fn(),
    insertMarkers: vi.fn(() => callOrder.push('insertMarkers')),
    logDebug: vi.fn(),
    positionNode: vi.fn(),
  };
});

vi.mock('../../../logger.js', () => ({
  log: {
    debug: mocks.logDebug,
  },
}));

vi.mock('../../../config.js', () => ({
  getConfig: mocks.getConfig,
}));

vi.mock('../../../utils.js', () => ({
  default: {
    calcLabelPosition: mocks.calcLabelPosition,
    calcTerminalLabelPosition: mocks.calcTerminalLabelPosition,
  },
}));

vi.mock('../../../utils/subGraphTitleMargins.js', () => ({
  getSubGraphTitleMargins: mocks.getSubGraphTitleMargins,
}));

vi.mock('../../createGraph.js', () => ({
  createGraphWithElements: mocks.createGraphWithElements,
}));

vi.mock('../../rendering-elements/clusters.js', () => ({
  clear: mocks.clearClusters,
  insertCluster: mocks.insertCluster,
}));

vi.mock('../../rendering-elements/edges.js', () => ({
  clear: mocks.clearEdges,
  edgeLabels: mocks.edgeLabels,
  hasEdgeLabel: (edge: Edge) => Boolean(edge.label || edge.startLabelRight || edge.endLabelLeft),
  insertEdge: mocks.insertEdge,
  insertEdgeLabel: mocks.insertEdgeLabel,
  terminalLabels: mocks.terminalLabels,
}));

vi.mock('../../rendering-elements/markers.js', () => ({
  default: mocks.insertMarkers,
}));

vi.mock('../../rendering-elements/nodes.js', () => ({
  clear: mocks.clearNodes,
  positionNode: mocks.positionNode,
}));

vi.mock('../dagre/mermaid-graphlib.js', () => ({
  clear: mocks.clearGraphlib,
}));

function node(id: string, extra: Partial<Node> = {}): Node {
  return {
    id,
    isGroup: false,
    shape: 'rect',
    width: 40,
    height: 20,
    ...extra,
  } as Node;
}

function edge(id: string, extra: Partial<Edge> = {}): Edge {
  return {
    id,
    start: 'A',
    end: 'B',
    type: 'arrow',
    points: [
      { x: 0, y: 0 },
      { x: 20, y: 20 },
    ],
    ...extra,
  };
}

function layout(extra: Partial<LayoutData> = {}): LayoutData {
  return {
    nodes: [node('A'), node('B')],
    edges: [edge('e1')],
    config: {} as LayoutData['config'],
    diagramId: 'diagram-1',
    markers: ['arrow'],
    type: 'flowchart',
    ...extra,
  };
}

function measure(): CommonLayoutMeasure {
  return {
    graph: {},
    groups: {
      clusters: { name: 'clusters' },
      edgePaths: { name: 'edgePaths' },
      edgeLabels: { name: 'edgeLabels' },
      nodes: { name: 'nodes' },
      rootGroups: { name: 'rootGroups' },
    },
    nodeElements: new Map(),
  } as unknown as CommonLayoutMeasure;
}

beforeEach(() => {
  mocks.callOrder.length = 0;
  mocks.edgeLabels.clear();
  mocks.terminalLabels.clear();
  mocks.labelElement.attr.mockClear();
  mocks.terminalElement.attr.mockClear();

  for (const fn of [
    mocks.calcLabelPosition,
    mocks.calcTerminalLabelPosition,
    mocks.clearClusters,
    mocks.clearEdges,
    mocks.clearGraphlib,
    mocks.clearNodes,
    mocks.createGraphWithElements,
    mocks.getConfig,
    mocks.getSubGraphTitleMargins,
    mocks.insertCluster,
    mocks.insertEdge,
    mocks.insertEdgeLabel,
    mocks.insertMarkers,
    mocks.logDebug,
    mocks.positionNode,
  ]) {
    fn.mockClear();
  }

  mocks.getConfig.mockReturnValue({ flowchart: {} });
  mocks.getSubGraphTitleMargins.mockReturnValue({ subGraphTitleTotalMargin: 4 });
  mocks.calcLabelPosition.mockReturnValue({ x: 10, y: 20 });
  mocks.calcTerminalLabelPosition.mockReturnValue({ x: 5, y: 6 });
  mocks.insertEdge.mockReturnValue({
    updatedPath: [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ],
  });
  mocks.insertEdgeLabel.mockImplementation((_rootGroups: unknown, renderedEdge: Edge) => {
    mocks.edgeLabels.set(renderedEdge.id, mocks.labelElement);
    mocks.terminalLabels.set(renderedEdge.id, {
      startLeft: mocks.terminalElement,
      startRight: mocks.terminalElement,
      endLeft: mocks.terminalElement,
      endRight: mocks.terminalElement,
    });
    return Promise.resolve({});
  });
});

describe('createCommonLayoutRenderer', () => {
  it('runs setup, prepare, measure, core, paint, and post-paint hooks in order', async () => {
    const { createCommonLayoutRenderer } = await import('./index.js');
    const data = layout();
    const element = { name: 'root-g' };
    const svg = { select: vi.fn().mockReturnValue(element) };
    const measured = measure();
    const options = { algorithm: 'elk.layered' };
    const preparedLayout: PreparedLayout = { graph: 'prepared-layout' };
    const seenContexts: CommonLayoutRenderContext<PreparedLayout>[] = [];

    const render = createCommonLayoutRenderer<string, PreparedLayout>({
      prepareLayout: (_layoutData, context) => {
        expect(context.preparedLayout).toBeUndefined();
        seenContexts.push(context);
        mocks.callOrder.push('prepare');
        return preparedLayout;
      },
      measureLayout: (_layoutData, context) => {
        expect(context.preparedLayout).toBe(preparedLayout);
        seenContexts.push(context);
        mocks.callOrder.push('measure');
        return Promise.resolve(measured);
      },
      runLayoutCore: (_layoutData, context) => {
        expect(context.preparedLayout).toBe(preparedLayout);
        seenContexts.push(context);
        mocks.callOrder.push('core');
        return 'core-result';
      },
      paintLayout: (_layoutData, context, coreResult) => {
        expect(context.measure).toBe(measured);
        expect(context.preparedLayout).toBe(preparedLayout);
        expect(coreResult).toBe('core-result');
        mocks.callOrder.push('paint');
      },
      afterPaint: (_layoutData, context, coreResult) => {
        expect(context.measure).toBe(measured);
        expect(context.preparedLayout).toBe(preparedLayout);
        expect(coreResult).toBe('core-result');
        mocks.callOrder.push('after');
      },
    });

    await render(data, svg as never, undefined, options);

    expect(svg.select).toHaveBeenCalledWith('g');
    expect(mocks.insertMarkers).toHaveBeenCalledWith(
      element,
      data.markers,
      data.type,
      data.diagramId
    );
    expect(mocks.callOrder).toEqual([
      'insertMarkers',
      'clearNodes',
      'clearEdges',
      'clearClusters',
      'clearGraphlib',
      'prepare',
      'measure',
      'core',
      'paint',
      'after',
    ]);
    for (const context of seenContexts) {
      expect(context.element).toBe(element);
      expect(context.options).toBe(options);
      expect(context.preparedLayout).toBe(preparedLayout);
    }
  });

  it('passes custom measure results to custom paint hooks', async () => {
    const { createCommonLayoutRenderer } = await import('./index.js');
    const data = layout();
    const element = { name: 'root-g' };
    const svg = { select: vi.fn().mockReturnValue(element) };
    const measured = { dagreGraph: 'graph' };

    const render = createCommonLayoutRenderer<string, void, typeof measured>({
      measureLayout: () => Promise.resolve(measured),
      runLayoutCore: () => 'core-result',
      paintLayout: (_layoutData, context, coreResult) => {
        expect(context.measure).toBe(measured);
        expect(coreResult).toBe('core-result');
      },
    });

    await render(data, svg as never);
  });
});

describe('defaultMeasureLayout', () => {
  it('delegates to createGraphWithElements', async () => {
    const { defaultMeasureLayout } = await import('./index.js');
    const data = layout();
    const element = { name: 'root-g' };
    const measured = measure();
    mocks.createGraphWithElements.mockResolvedValue(measured);

    await expect(defaultMeasureLayout(data, { element } as never)).resolves.toBe(measured);
    expect(mocks.createGraphWithElements).toHaveBeenCalledWith(element, data);
  });
});

describe('paintLayoutData', () => {
  it('paints clusters and nodes, skips layout-only/skipped edges, and forwards skipIntersect', async () => {
    const { paintLayoutData } = await import('./index.js');
    const group = node('G', { isGroup: true, shape: 'roundedWithTitle' });
    const nodeA = node('A');
    const nodeB = node('B');
    const renderEdge = edge('render');
    const skippedEdge = edge('skip');
    const layoutOnlyEdge = edge('layout-only', { isLayoutOnly: true });
    const data = layout({
      nodes: [group, nodeA, nodeB],
      edges: [layoutOnlyEdge, skippedEdge, renderEdge],
    });
    const measured = measure();
    const clusterDb = new Map([[group.id, { node: group }]]);

    await paintLayoutData(data, { measure: measured } as never, {
      clusterDb,
      skipEdge: (candidate) => candidate.id === skippedEdge.id,
      skipIntersect: (candidate) => candidate.id === renderEdge.id,
    });

    expect(mocks.insertCluster).toHaveBeenCalledWith(measured.groups.clusters, group);
    expect(mocks.positionNode).toHaveBeenCalledWith(nodeA);
    expect(mocks.positionNode).toHaveBeenCalledWith(nodeB);
    expect(mocks.insertEdge).toHaveBeenCalledTimes(1);
    expect(mocks.insertEdge).toHaveBeenCalledWith(
      measured.groups.edgePaths,
      { ...renderEdge },
      clusterDb,
      data.type,
      nodeA,
      nodeB,
      data.diagramId,
      true
    );
  });

  it('positions pre-rendered cluster nodes without inserting another cluster', async () => {
    const { paintLayoutData } = await import('./index.js');
    const clusterNode = node('G', { clusterNode: true, isGroup: true } as never);
    const data = layout({
      nodes: [clusterNode],
      edges: [],
    });
    const measured = measure();

    await paintLayoutData(data, { measure: measured } as never);

    expect(mocks.insertCluster).not.toHaveBeenCalled();
    expect(mocks.positionNode).toHaveBeenCalledWith(clusterNode);
  });

  it('lets layout algorithms decide which group nodes are clusters', async () => {
    const { paintLayoutData } = await import('./index.js');
    const leafGroup = node('G', { isGroup: true, shape: 'roundedWithTitle' });
    const data = layout({
      nodes: [leafGroup],
      edges: [],
    });
    const measured = measure();

    await paintLayoutData(data, { measure: measured } as never, {
      isCluster: () => false,
    });

    expect(mocks.insertCluster).not.toHaveBeenCalled();
    expect(mocks.positionNode).toHaveBeenCalledWith(leafGroup);
  });

  it('lets layout algorithms skip nodes that were already painted elsewhere', async () => {
    const { paintLayoutData } = await import('./index.js');
    const rootNode = node('root');
    const extractedNode = node('nested');
    const data = layout({
      nodes: [rootNode, extractedNode],
      edges: [],
    });
    const measured = measure();

    await paintLayoutData(data, { measure: measured } as never, {
      skipNode: (candidate) => candidate.id === extractedNode.id,
    });

    expect(mocks.positionNode).toHaveBeenCalledTimes(1);
    expect(mocks.positionNode).toHaveBeenCalledWith(rootNode);
    expect(mocks.positionNode).not.toHaveBeenCalledWith(extractedNode);
  });

  it('lets layout algorithms provide graph-backed paint nodes and edge endpoints', async () => {
    const { paintLayoutData } = await import('./index.js');
    const nodeB = node('B');
    const graphOnlyNode = node('dummy');
    const renderEdge = edge('render', { start: graphOnlyNode.id, end: nodeB.id });
    const data = layout({
      nodes: [nodeB],
      edges: [renderEdge],
    });
    const measured = measure();

    await paintLayoutData(data, { measure: measured } as never, {
      getNodes: () => [graphOnlyNode, nodeB],
      getEdgeNode: (id) => (id === graphOnlyNode.id ? graphOnlyNode : undefined),
    });

    expect(mocks.positionNode).toHaveBeenNthCalledWith(1, graphOnlyNode);
    expect(mocks.positionNode).toHaveBeenNthCalledWith(2, nodeB);
    expect(mocks.insertEdge).toHaveBeenCalledWith(
      measured.groups.edgePaths,
      { ...renderEdge },
      expect.any(Map),
      data.type,
      graphOnlyNode,
      nodeB,
      data.diagramId,
      false
    );
  });

  it('inserts and positions edge labels after drawing labelled edges', async () => {
    const { paintLayoutData } = await import('./index.js');
    const labelledEdge = edge('labelled', { label: 'Yes', x: 0, y: 0 } as Partial<Edge>);
    const data = layout({ edges: [labelledEdge] });
    const measured = measure();

    await paintLayoutData(data, { measure: measured } as never);

    expect(mocks.insertEdgeLabel).toHaveBeenCalledWith(measured.groups.edgeLabels, labelledEdge);
    expect(mocks.labelElement.attr).toHaveBeenCalledWith('transform', 'translate(10, 22)');
  });

  it('inserts and positions terminal labels without a center edge label', async () => {
    const { paintLayoutData } = await import('./index.js');
    const terminalEdge = edge('terminal', {
      label: '',
      x: 0,
      y: 0,
      startLabelRight: 'source',
      endLabelLeft: 'target',
    } as Partial<Edge>);
    const data = layout({ edges: [terminalEdge] });
    const measured = measure();

    await paintLayoutData(data, { measure: measured } as never);

    expect(mocks.insertEdgeLabel).toHaveBeenCalledWith(measured.groups.edgeLabels, terminalEdge);
    expect(mocks.terminalElement.attr).toHaveBeenCalledWith('transform', 'translate(5, 6)');
  });
});
