import mermaid, {
  createCommonLayoutRenderer,
  type CommonLayoutRenderContext,
  type LayoutData,
} from 'mermaid';
// @ts-ignore TODO: Investigate D3 issue
import { curveLinear } from 'd3';
import ELK from 'elkjs/lib/elk.bundled.js';
import { type TreeData, findCommonAncestor } from './find-common-ancestor.js';

import {
  type P,
  type RectLike,
  outsideNode,
  computeNodeIntersection,
  replaceEndpoint,
  onBorder,
} from './geometry.js';

type Node = LayoutData['nodes'][number];
type Edge = LayoutData['edges'][number];

interface LabelData {
  width: number;
  height: number;
  wrappingWidth?: number;
}

interface ElkNodeOffset {
  posX: number;
  posY: number;
  x: number;
  y: number;
  depth: number;
  width: number;
  height: number;
}

interface NodeWithVertex {
  id: string;
  dir?: string;
  height?: number;
  intersect?: (point: P) => P | null;
  isGroup?: boolean;
  padding?: number;
  parentId?: string;
  shape?: string;
  width?: number;
  x?: number;
  y?: number;
  [key: string]: any;
  children?: NodeWithVertex[];
  labelData?: LabelData;
  labels?: { text?: string; width: number; height: number }[];
  layoutOptions?: Record<string, unknown>;
  offset?: ElkNodeOffset;
}

interface ElkSubgraphConfig {
  mergeEdges?: boolean;
  nodePlacementAlignment?: string;
  nodePlacementStrategy?: string;
}

interface ElkPreparedLayout {
  algorithm?: string;
}

interface ElkLayoutContext {
  algorithm?: string;
  common: { lineBreakRegex: RegExp };
  getConfig: () => any;
  interpolateToCurve: (interpolate: string | undefined, defaultCurve: unknown) => unknown;
  log: {
    debug: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
  };
}

interface ElkLayoutState {
  elkGraph: any;
  nodeDb: Record<string, NodeWithVertex>;
  parentLookupDb: TreeData;
}

interface ElkLayoutResult {
  children?: any[];
  edges?: any[];
}

type Side = 'start' | 'end';

const END_MARKER_PATH_OFFSETS: Record<string, number> = {
  arrow_point: 4,
};
const MIN_END_MARKER_SEGMENT_LENGTH = 8;

const ARROW_MAP: Record<string, [string, string]> = {
  arrow_open: ['arrow_open', 'arrow_open'],
  arrow_cross: ['arrow_open', 'arrow_cross'],
  double_arrow_cross: ['arrow_cross', 'arrow_cross'],
  arrow_point: ['arrow_open', 'arrow_point'],
  double_arrow_point: ['arrow_point', 'arrow_point'],
  arrow_circle: ['arrow_open', 'arrow_circle'],
  double_arrow_circle: ['arrow_circle', 'arrow_circle'],
};
const DEFAULT_NODE_PLACEMENT_ALIGNMENT = 'NONE';

export function dir2ElkDirection(dir: unknown): 'RIGHT' | 'LEFT' | 'DOWN' | 'UP' {
  switch (dir) {
    case 'LR':
      return 'RIGHT';
    case 'RL':
      return 'LEFT';
    case 'TB':
    case 'TD': // TD is an alias for TB in Mermaid
      return 'DOWN';
    case 'BT':
      return 'UP';
    default:
      return 'DOWN';
  }
}

export function buildSubgraphLayoutOptions(
  node: { dir?: string },
  elkConfig: ElkSubgraphConfig | undefined,
  algorithm: string | undefined
): Record<string, unknown> {
  const layoutOptions: Record<string, unknown> = {
    'spacing.baseValue': 30,
    'nodeLabels.placement': '[H_CENTER V_TOP, INSIDE]',
    'elk.layered.mergeEdges': elkConfig?.mergeEdges,
    'nodePlacement.strategy': elkConfig?.nodePlacementStrategy,
    'elk.layered.nodePlacement.bk.fixedAlignment':
      elkConfig?.nodePlacementAlignment ?? DEFAULT_NODE_PLACEMENT_ALIGNMENT,
  };
  if (node.dir) {
    layoutOptions['elk.algorithm'] = algorithm;
    layoutOptions['elk.direction'] = dir2ElkDirection(node.dir);
    layoutOptions['elk.hierarchyHandling'] = 'SEPARATE_CHILDREN';
  }
  return layoutOptions;
}

/**
 * Identify the entry node of each recursive flow so it can be pinned to the top.
 *
 * `elk.layered` must break cycles before it can rank nodes, and its default
 * cycle-breaking heuristic is purely degree-based — it has no notion of an
 * "entry point". So as soon as a flow loops back on itself (recursion), the
 * first-declared node can be ranked in the middle of the layout, scrambling the
 * reading order and hiding where the flow starts.
 *
 * For each container (grouped by `parentId`) we look only at edges internal to
 * that container and find its weakly-connected components. A component with no
 * natural source — no node with in-degree 0 once self-loops are ignored — must
 * contain a cycle, so we nominate its first node in declaration order as the
 * entry. Acyclic components always have a source and nominate nothing, leaving
 * their layout untouched. The caller pins each nominee to the first layer with
 * `elk.layered.layering.layerConstraint = FIRST`.
 *
 * @param nodes - layout nodes in declaration order
 * @param edges - layout edges referencing node ids via `source`/`target`
 * @returns the ids of nodes to constrain to the first layer
 */
export function findCyclicEntryNodes(
  nodes: { id: string; parentId?: string }[],
  edges: { source?: string | number; target?: string | number }[]
): Set<string> {
  const entries = new Set<string>();

  // Group node ids by container, preserving declaration order within each group.
  const groups = new Map<string | undefined, string[]>();
  for (const { id, parentId } of nodes) {
    const group = groups.get(parentId);
    if (group) {
      group.push(id);
    } else {
      groups.set(parentId, [id]);
    }
  }

  for (const ids of groups.values()) {
    const idSet = new Set(ids);
    const inDegree = new Map<string, number>(ids.map((id) => [id, 0]));
    // Undirected adjacency, used only to find weakly-connected components.
    const neighbors = new Map<string, string[]>(ids.map((id) => [id, []]));

    for (const edge of edges) {
      const source = edge.source == null ? undefined : String(edge.source);
      const target = edge.target == null ? undefined : String(edge.target);
      // Restrict to edges internal to this container; ignore self-loops.
      if (!source || !target || source === target) {
        continue;
      }
      if (!idSet.has(source) || !idSet.has(target)) {
        continue;
      }
      inDegree.set(target, (inDegree.get(target) ?? 0) + 1);
      neighbors.get(source)!.push(target);
      neighbors.get(target)!.push(source);
    }

    // Label weakly-connected components.
    const component = new Map<string, number>();
    let componentCount = 0;
    for (const id of ids) {
      if (component.has(id)) {
        continue;
      }
      const stack = [id];
      component.set(id, componentCount);
      while (stack.length > 0) {
        const current = stack.pop()!;
        for (const next of neighbors.get(current)!) {
          if (!component.has(next)) {
            component.set(next, componentCount);
            stack.push(next);
          }
        }
      }
      componentCount++;
    }

    // A component with no in-degree-0 node necessarily contains a cycle.
    // Nominate the first such node in declaration order as its entry.
    const hasSource = new Array<boolean>(componentCount).fill(false);
    for (const id of ids) {
      if ((inDegree.get(id) ?? 0) === 0) {
        hasSource[component.get(id)!] = true;
      }
    }
    const nominated = new Array<boolean>(componentCount).fill(false);
    for (const id of ids) {
      const c = component.get(id)!;
      if (!hasSource[c] && !nominated[c]) {
        entries.add(id);
        nominated[c] = true;
      }
    }
  }

  return entries;
}

/**
 * When `elk.keepEntryNodeOnTop` is enabled, pin each recursive flow's entry node
 * to the first layer so the diagram reads from its entry instead of an arbitrary
 * point in the loop. No-op when the option is off or the graph is acyclic, so
 * existing ELK diagrams are unaffected unless they opt in.
 */
function applyCyclicEntryConstraint(
  data4Layout: LayoutData,
  nodeDb: Record<string, NodeWithVertex>
): void {
  if (!data4Layout.config.elk?.keepEntryNodeOnTop) {
    return;
  }

  const entryNodeIds = findCyclicEntryNodes(
    data4Layout.nodes,
    data4Layout.edges.map((edge) => ({ source: edge.start, target: edge.end }))
  );

  for (const id of entryNodeIds) {
    const elkNode = nodeDb[id];
    if (elkNode) {
      elkNode.layoutOptions = {
        ...elkNode.layoutOptions,
        'elk.layered.layering.layerConstraint': 'FIRST',
      };
    }
  }
}

export function prepareLayoutForElk(
  data4Layout: LayoutData,
  context: CommonLayoutRenderContext<ElkPreparedLayout>
): ElkPreparedLayout {
  const elkContext = getElkLayoutContext(context);
  syncElkPackageConfig(elkContext);
  applyElkEdgeRenderData(data4Layout, elkContext);
  return { algorithm: elkContext.algorithm };
}

export async function runElkLayoutCore(
  data4Layout: LayoutData,
  context: CommonLayoutRenderContext<ElkPreparedLayout>
): Promise<ElkLayoutResult> {
  const elkContext = getElkLayoutContext(context);
  const layoutState = buildElkGraphFromLayoutData(data4Layout, elkContext);

  // @ts-ignore - ELK is not typed
  const elk = new ELK();
  elkContext.log.info('Drawing flowchart using v4 renderer', elk);

  const graph = await runElkLayout(elk, layoutState.elkGraph, elkContext.log);
  applyElkLayoutResult(data4Layout, graph, layoutState, elkContext.log);
  orderNodesForElkPaint(data4Layout.nodes);
  return graph;
}

export function buildElkGraphFromLayoutData(
  data4Layout: LayoutData,
  elkContext: ElkLayoutContext
): ElkLayoutState {
  const nodeDb: Record<string, NodeWithVertex> = {};
  const elkGraph = createRootElkGraph(data4Layout, elkContext.algorithm);

  const dir = (data4Layout as { direction?: string }).direction ?? 'DOWN';
  elkGraph.layoutOptions['elk.direction'] = dir2ElkDirection(dir);

  const parentLookupDb = addSubGraphs(data4Layout.nodes, elkContext.log);
  addVertices(data4Layout.nodes, elkGraph, nodeDb, elkContext);
  addEdgesToElkGraph(data4Layout, elkGraph, nodeDb, elkContext);
  configureSubgraphNodes(data4Layout, nodeDb, parentLookupDb, elkContext);
  configureCrossHierarchyEdges(elkGraph, nodeDb, parentLookupDb, elkContext.log);
  applyCyclicEntryConstraint(data4Layout, nodeDb);
  logElkGraphForDebug(elkGraph, elkContext.log);

  return { elkGraph, nodeDb, parentLookupDb };
}

export const render = createCommonLayoutRenderer<ElkLayoutResult, ElkPreparedLayout>({
  // Note that defaultMeasureLayout and createGraphWithElements is called by the factory function
  prepareLayout: prepareLayoutForElk,
  runLayoutCore: runElkLayoutCore,
  paintOptions: {
    skipIntersect: true,
  },
});

function syncElkPackageConfig(elkContext: ElkLayoutContext): void {
  mermaid.mermaidAPI.setConfig(elkContext.getConfig());
}

function orderNodesForElkPaint(nodes: LayoutData['nodes']): void {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  nodes.sort((a, b) => {
    if (a.isGroup !== b.isGroup) {
      return a.isGroup ? -1 : 1;
    }

    if (a.isGroup && b.isGroup) {
      return getGroupDepth(a, nodeById) - getGroupDepth(b, nodeById);
    }

    return 0;
  });
}

function getGroupDepth(
  node: LayoutData['nodes'][number],
  nodeById: Map<string, LayoutData['nodes'][number]>
): number {
  let depth = 0;
  const visited = new Set<string>();
  let parentId = node.parentId;

  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = nodeById.get(parentId);
    if (!parent?.isGroup) {
      break;
    }
    depth++;
    parentId = parent.parentId;
  }

  return depth;
}

function getElkLayoutContext(
  context: CommonLayoutRenderContext<ElkPreparedLayout>
): ElkLayoutContext {
  const helpers = context.helpers;
  if (!helpers) {
    throw new Error('ELK layout requires Mermaid internal helpers');
  }

  return {
    algorithm:
      context.preparedLayout?.algorithm ??
      (context.options as { algorithm?: string } | undefined)?.algorithm,
    common: helpers.common,
    getConfig: helpers.getConfig,
    interpolateToCurve: helpers.interpolateToCurve as (
      interpolate: string | undefined,
      defaultCurve: unknown
    ) => unknown,
    log: helpers.log,
  };
}

function createRootElkGraph(data4Layout: LayoutData, algorithm: string | undefined): any {
  return {
    id: 'root',
    layoutOptions: {
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.algorithm': algorithm,
      'nodePlacement.strategy': data4Layout.config.elk?.nodePlacementStrategy,
      'elk.layered.nodePlacement.bk.fixedAlignment':
        data4Layout.config.elk?.nodePlacementAlignment ?? DEFAULT_NODE_PLACEMENT_ALIGNMENT,
      'elk.layered.mergeEdges': data4Layout.config.elk?.mergeEdges,
      'elk.direction': 'DOWN',
      'spacing.baseValue': 40,
      'elk.layered.crossingMinimization.forceNodeModelOrder':
        data4Layout.config.elk?.forceNodeModelOrder,
      'elk.layered.considerModelOrder.strategy': data4Layout.config.elk?.considerModelOrder,
      'elk.layered.unnecessaryBendpoints': true,
      'elk.layered.cycleBreaking.strategy': data4Layout.config.elk?.cycleBreakingStrategy,

      // 'elk.layered.cycleBreaking.strategy': 'GREEDY_MODEL_ORDER',
      // 'elk.layered.cycleBreaking.strategy': 'MODEL_ORDER',
      // 'spacing.nodeNode': 20,
      // 'spacing.nodeNodeBetweenLayers': 25,
      // 'spacing.edgeNode': 20,
      // 'spacing.edgeNodeBetweenLayers': 10,
      // 'spacing.edgeEdge': 10,
      // 'spacing.edgeEdgeBetweenLayers': 20,
      // 'spacing.nodeSelfLoop': 20,

      // Tweaking options
      // 'nodePlacement.favorStraightEdges': true,
      // 'elk.layered.nodePlacement.favorStraightEdges': true,
      // 'nodePlacement.feedbackEdges': true,
      'elk.layered.wrapping.multiEdge.improveCuts': true,
      'elk.layered.wrapping.multiEdge.improveWrappedEdges': true,
      // 'elk.layered.wrapping.strategy': 'MULTI_EDGE',
      // 'elk.layered.wrapping.strategy': 'SINGLE_EDGE',
      'elk.layered.edgeRouting.selfLoopDistribution': 'EQUALLY',
      'elk.layered.mergeHierarchyEdges': true,

      // 'elk.layered.feedbackEdges': true,
      // 'elk.layered.crossingMinimization.semiInteractive': true,
      // 'elk.layered.edgeRouting.splines.sloppy.layerSpacingFactor': 1,
      // 'elk.layered.edgeRouting.polyline.slopedEdgeZoneWidth': 4.0,
      // 'elk.layered.wrapping.validify.strategy': 'LOOK_BACK',
      // 'elk.insideSelfLoops.activate': true,
      // 'elk.separateConnectedComponents': true,
      // 'elk.alg.layered.options.EdgeStraighteningStrategy': 'NONE',
      // 'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      // 'elk.layered.considerModelOrder.strategy': 'EDGES',
      // 'elk.layered.wrapping.cutting.strategy': 'ARD',
    },
    children: [],
    edges: [],
  };
}

function addSubGraphs(nodeArr: Node[], log: ElkLayoutContext['log']): TreeData {
  const parentLookupDb: TreeData = { parentById: {}, childrenById: {} };
  const subgraphs = nodeArr.filter((node) => node.isGroup);
  log.info('Subgraphs - ', subgraphs);
  subgraphs.forEach((subgraph) => {
    const children = nodeArr.filter((node) => node.parentId === subgraph.id);
    children.forEach((node) => {
      parentLookupDb.parentById[node.id] = subgraph.id;
      parentLookupDb.childrenById[subgraph.id] ??= [];
      parentLookupDb.childrenById[subgraph.id].push(node.id);
    });
  });

  return parentLookupDb;
}

function addVertices(
  nodeArr: Node[],
  graph: { children: NodeWithVertex[] },
  nodeDb: Record<string, NodeWithVertex>,
  elkContext: ElkLayoutContext,
  parentId?: string
): { children: NodeWithVertex[] } {
  const siblings = nodeArr.filter((node) => node?.parentId === parentId);
  elkContext.log.info('addVertices APA12', siblings, parentId);

  siblings.forEach((node) => {
    addVertex(graph, nodeArr, node, nodeDb, elkContext);
  });
  return graph;
}

function addVertex(
  graph: { children: NodeWithVertex[] },
  nodeArr: Node[],
  node: Node,
  nodeDb: Record<string, NodeWithVertex>,
  elkContext: ElkLayoutContext
): void {
  const child = createElkNode(node);
  graph.children.push(child);
  nodeDb[node.id] = child;

  if (node.isGroup) {
    child.children = [];
    addVertices(nodeArr, child as { children: NodeWithVertex[] }, nodeDb, elkContext, node.id);
    child.labelData = getMeasuredLabelData(node, elkContext.getConfig());
  }
}

function createElkNode(node: Node): NodeWithVertex {
  const child = { ...node } as NodeWithVertex;
  delete (child as { domId?: unknown }).domId;

  if (node.isGroup) {
    child.children = [];
  } else {
    child.width = node.width ?? 0;
    child.height = node.height ?? 0;
  }

  return child;
}

function getMeasuredLabelData(node: Node, config: any): LabelData {
  const existing = (node as unknown as { labelData?: LabelData }).labelData;
  if (existing) {
    return existing;
  }

  if (node.labelBBox) {
    return {
      width: node.labelBBox.width,
      height: Math.max(0, node.labelBBox.height - 2),
      wrappingWidth: config.flowchart?.wrappingWidth,
    };
  }

  return {
    width: 0,
    height: 0,
    wrappingWidth: config.flowchart?.wrappingWidth,
  };
}

function addEdgesToElkGraph(
  dataForLayout: LayoutData,
  graph: { edges: any[] },
  nodeDb: Record<string, NodeWithVertex>,
  elkContext: ElkLayoutContext
): { edges: any[] } {
  elkContext.log.info('abc78 DAGA edges = ', dataForLayout);
  const linkIdCnt: Record<string, number> = {};

  dataForLayout.edges.forEach((edge) => {
    const linkIdBase = edge.id;
    linkIdCnt[linkIdBase] = (linkIdCnt[linkIdBase] ?? -1) + 1;
    const linkId = linkIdBase;
    edge.id = linkId;
    elkContext.log.info(
      'abc78 new link id to be used is',
      linkIdBase,
      linkId,
      linkIdCnt[linkIdBase]
    );

    const { source, target, sourceId, targetId } = getEdgeStartEndPoint(edge, nodeDb);
    elkContext.log.debug('abc78 source and target', source, target);

    graph.edges.push({
      ...edge,
      sources: [source],
      targets: [target],
      sourceId,
      targetId,
      labels: [
        {
          width: edge.width ?? 0,
          height: edge.height ?? 0,
          orgWidth: edge.width ?? 0,
          orgHeight: edge.height ?? 0,
          text: edge.label ?? '',
          layoutOptions: {
            'edgeLabels.inline': 'true',
            'edgeLabels.placement': 'CENTER',
          },
        },
      ],
    });
  });

  return graph;
}

function getEdgeStartEndPoint(edge: Edge, nodeDb: Record<string, NodeWithVertex>) {
  const sourceId = edge.start;
  const targetId = edge.end;
  const source = sourceId;
  const target = targetId;

  const startNode = sourceId ? nodeDb[sourceId] : undefined;
  const endNode = targetId ? nodeDb[targetId] : undefined;

  if (!startNode || !endNode) {
    return { source, target };
  }

  return { source, target, sourceId, targetId };
}

function configureSubgraphNodes(
  data4Layout: LayoutData,
  nodeDb: Record<string, NodeWithVertex>,
  parentLookupDb: TreeData,
  elkContext: ElkLayoutContext
): void {
  data4Layout.nodes.forEach((n) => {
    const node = nodeDb[n.id];
    if (!node || parentLookupDb.childrenById[node.id] === undefined) {
      return;
    }

    node.labels = [
      {
        text: node.label,
        width: node?.labelData?.width ?? 50,
        height: node?.labelData?.height ?? 50,
      },
    ];
    elkContext.log.debug('UIO node label', node?.labelData?.width, node.padding);
    node.layoutOptions = buildSubgraphLayoutOptions(
      node,
      data4Layout.config.elk,
      elkContext.algorithm
    );
    delete node.x;
    delete node.y;
    delete node.width;
    delete node.height;
  });
}

function configureCrossHierarchyEdges(
  elkGraph: { edges: any[] },
  nodeDb: Record<string, NodeWithVertex>,
  parentLookupDb: TreeData,
  log: ElkLayoutContext['log']
): void {
  log.debug('APA01 processing edges, count:', elkGraph.edges.length);
  elkGraph.edges.forEach((edge: any, index: number) => {
    log.debug('APA01 processing edge', index, ':', edge);
    const source = edge.sources[0];
    const target = edge.targets[0];
    log.debug('APA01 source:', source, 'target:', target);
    log.debug('APA01 nodeDb[source]:', nodeDb[source]);
    log.debug('APA01 nodeDb[target]:', nodeDb[target]);

    if (nodeDb[source] && nodeDb[target] && nodeDb[source].parentId !== nodeDb[target].parentId) {
      const ancestorId = findCommonAncestor(source, target, parentLookupDb);
      setIncludeChildrenPolicy(nodeDb, source, ancestorId);
      setIncludeChildrenPolicy(nodeDb, target, ancestorId);
    }
  });
}

function setIncludeChildrenPolicy(
  nodeDb: Record<string, NodeWithVertex>,
  nodeId: string,
  ancestorId: string
): void {
  const node = nodeDb[nodeId];

  if (!node) {
    return;
  }
  node.layoutOptions ??= {};
  node.layoutOptions['elk.hierarchyHandling'] = 'INCLUDE_CHILDREN';
  if (node.id !== ancestorId && node.parentId) {
    setIncludeChildrenPolicy(nodeDb, node.parentId, ancestorId);
  }
}

function logElkGraphForDebug(elkGraph: any, log: ElkLayoutContext['log']): void {
  log.debug('APA01 before');
  log.debug('APA01 elkGraph structure:', JSON.stringify(elkGraph, null, 2));
  log.debug('APA01 elkGraph.children length:', elkGraph.children?.length);
  log.debug('APA01 elkGraph.edges length:', elkGraph.edges?.length);

  elkGraph.edges?.forEach((edge: any, index: number) => {
    log.debug(`APA01 validating edge ${index}:`, edge);
    if (edge.sources) {
      edge.sources.forEach((sourceId: any) => {
        const sourceExists = elkGraph.children?.some((child: any) => child.id === sourceId);
        log.debug(`APA01 source ${sourceId} exists:`, sourceExists);
      });
    }
    if (edge.targets) {
      edge.targets.forEach((targetId: any) => {
        const targetExists = elkGraph.children?.some((child: any) => child.id === targetId);
        log.debug(`APA01 target ${targetId} exists:`, targetExists);
      });
    }
  });
}

async function runElkLayout(
  elk: { layout: (graph: any) => Promise<ElkLayoutResult> },
  elkGraph: any,
  log: ElkLayoutContext['log']
): Promise<ElkLayoutResult> {
  try {
    const graph = await elk.layout(elkGraph);
    log.debug('APA01 after - success');
    log.info('APA01 layout result:', JSON.stringify(graph, null, 2));
    return graph;
  } catch (error) {
    log.error('APA01 ELK layout error:', error);
    log.error('APA01 elkGraph that caused error:', JSON.stringify(elkGraph, null, 2));
    throw error;
  }
}

function applyElkLayoutResult(
  data4Layout: LayoutData,
  graph: ElkLayoutResult,
  layoutState: ElkLayoutState,
  log: ElkLayoutContext['log']
): void {
  const nodeById = new Map(data4Layout.nodes.map((node) => [node.id, node]));
  applyElkNodePositions(graph.children ?? [], layoutState, nodeById, 0, 0, 0, log);
  applyElkEdgeLayout(data4Layout, graph, layoutState, log);
}

function applyElkNodePositions(
  nodeArray: any[],
  layoutState: ElkLayoutState,
  nodeById: Map<string, Node>,
  relX: number,
  relY: number,
  depth: number,
  log: ElkLayoutContext['log']
): void {
  nodeArray.forEach((node) => {
    if (!node) {
      return;
    }

    const graphNode = layoutState.nodeDb[node.id] ?? node;
    const width = Math.max(node.width, node.labels ? node.labels[0]?.width || 0 : 0);
    const offset = {
      posX: node.x + relX,
      posY: node.y + relY,
      x: relX,
      y: relY,
      depth,
      width,
      height: node.height,
    };
    graphNode.offset = offset;
    graphNode.x = offset.posX + node.width / 2;
    graphNode.y = offset.posY + node.height / 2;
    graphNode.width = node.width;
    graphNode.height = node.height;

    const layoutNode = nodeById.get(node.id);
    if (layoutNode) {
      layoutNode.x = graphNode.x;
      layoutNode.y = graphNode.y;
      layoutNode.width = node.isGroup
        ? Math.max(node.width, node.labelData?.width ?? 0)
        : node.width;
      layoutNode.height = node.height;
      const layoutNodeLabels = layoutNode as unknown as {
        labelData?: LabelData;
        labels?: unknown[];
      };
      layoutNodeLabels.labelData = node.labelData;
      layoutNodeLabels.labels = node.labels;
    }

    if (node.isGroup) {
      log.debug('Id abc88 subgraph = ', node.id, node.x, node.y, node.labelData);
      applyElkNodePositions(
        node.children ?? [],
        layoutState,
        nodeById,
        offset.posX,
        offset.posY,
        depth + 1,
        log
      );
    } else {
      log.info(
        'Id NODE = ',
        node.id,
        node.x,
        node.y,
        relX,
        relY,
        `translate(${graphNode.x}, ${graphNode.y})`
      );
    }
  });
}

function applyElkEdgeLayout(
  data4Layout: LayoutData,
  graph: ElkLayoutResult,
  layoutState: ElkLayoutState,
  log: ElkLayoutContext['log']
): void {
  const edgeById = new Map(data4Layout.edges.map((edge) => [edge.id, edge]));

  graph.edges?.forEach((edge) => {
    const layoutEdge = edgeById.get(edge.id);
    if (!layoutEdge) {
      return;
    }

    const startId = edge.sources?.[0] ?? edge.start;
    const endId = edge.targets?.[0] ?? edge.end;
    const startNode = layoutState.nodeDb[startId];
    const endNode = layoutState.nodeDb[endId];
    if (!startNode || !endNode || !edge.sections) {
      return;
    }

    const sourceId = edge.start ?? edge.sourceId ?? startId;
    const targetId = edge.end ?? edge.targetId ?? endId;
    const offset = calcOffset(sourceId, targetId, layoutState.parentLookupDb, layoutState.nodeDb);
    log.debug('APA18 offset', offset, sourceId, ' ==> ', targetId, 'edge:', edge, startNode);

    const section = edge.sections[0];
    const points = createEdgePointsFromSection(section, offset);
    startNode.x = startNode.offset!.posX + startNode.width! / 2;
    startNode.y = startNode.offset!.posY + startNode.height! / 2;
    endNode.x = endNode.offset!.posX + endNode.width! / 2;
    endNode.y = endNode.offset!.posY + endNode.height! / 2;

    if (startNode.shape !== 'rect33') {
      points.unshift({ x: startNode.x, y: startNode.y });
    }

    if (endNode.shape !== 'rect33') {
      points.push({ x: endNode.x, y: endNode.y });
    }

    layoutEdge.points = ensureEndMarkerSegmentLength(
      sanitizeElkEdgePoints(points, startNode, endNode, log),
      boundsFor(endNode),
      getEndMarkerPathOffset(layoutEdge),
      log
    );
    layoutEdge.curve = 'rounded';

    const label = edge.labels?.[0];
    if (label) {
      layoutEdge.x = label.x + offset.x + label.width / 2;
      layoutEdge.y = label.y + offset.y + label.height / 2;
    }
  });
}

function createEdgePointsFromSection(section: any, offset: { x: number; y: number }): P[] {
  const src = section.startPoint;
  const dest = section.endPoint;
  const segments = section.bendPoints ? section.bendPoints : [];
  const segPoints = segments.map((segment: { x: number; y: number }) => ({
    x: segment.x + offset.x,
    y: segment.y + offset.y,
  }));

  return [
    { x: src.x + offset.x, y: src.y + offset.y },
    ...segPoints,
    { x: dest.x + offset.x, y: dest.y + offset.y },
  ];
}

function calcOffset(
  src: string,
  dest: string,
  parentLookupDb: TreeData,
  nodeDb: Record<string, NodeWithVertex>
): { x: number; y: number } {
  const ancestor = findCommonAncestor(src, dest, parentLookupDb);
  if (ancestor === undefined || ancestor === 'root') {
    return { x: 0, y: 0 };
  }

  const ancestorOffset = nodeDb[ancestor]?.offset;
  return {
    x: ancestorOffset?.posX ?? 0,
    y: ancestorOffset?.posY ?? 0,
  };
}

function sanitizeElkEdgePoints(
  points: P[],
  startNode: NodeWithVertex,
  endNode: NodeWithVertex,
  log: ElkLayoutContext['log']
): P[] {
  const prevPoints = Array.isArray(points) ? [...points] : [];
  const endBounds = boundsFor(endNode);
  log.debug(
    'PPP cutter2: Points before cutter2:',
    JSON.stringify(points),
    'endBounds:',
    endBounds,
    onBorder(endBounds, points[points.length - 1])
  );

  let clippedPoints: P[];
  {
    const startBounds = boundsFor(startNode);
    const endBounds = boundsFor(endNode);

    const startIsGroup = !!startNode?.isGroup;
    const endIsGroup = !!endNode?.isGroup;

    const { candidate: startCandidate, centerApprox: startCenterApprox } = getCandidateBorderPoint(
      prevPoints,
      startNode,
      'start'
    );
    const { candidate: endCandidate, centerApprox: endCenterApprox } = getCandidateBorderPoint(
      prevPoints,
      endNode,
      'end'
    );

    const skipStart = startIsGroup && onBorder(startBounds, startCandidate);
    const skipEnd = endIsGroup && onBorder(endBounds, endCandidate);

    dropAutoCenterPoint(prevPoints, 'start', skipStart && startCenterApprox);
    dropAutoCenterPoint(prevPoints, 'end', skipEnd && endCenterApprox);

    if (skipStart || skipEnd) {
      if (!skipStart) {
        applyStartIntersectionIfNeeded(prevPoints, startNode, startBounds, log);
      }
      if (!skipEnd) {
        applyEndIntersectionIfNeeded(prevPoints, endNode, endBounds, log);
      }

      log.debug('PPP cutter2: skipping cutter2 due to on-border group endpoint(s)', {
        skipStart,
        skipEnd,
        startCenterApprox,
        endCenterApprox,
        startCandidate,
        endCandidate,
      });
      clippedPoints = prevPoints;
    } else {
      clippedPoints = cutter2(startNode, endNode, prevPoints, log);
    }
  }

  log.debug('PPP cutter2: Points after cutter2:', JSON.stringify(clippedPoints));
  if (!Array.isArray(clippedPoints) || clippedPoints.length < 2 || hasInvalidPoint(clippedPoints)) {
    log.warn('POI cutter2: Invalid points from cutter2, falling back to prevPoints', clippedPoints);
    const cleaned = prevPoints.filter((p) => Number.isFinite(p?.x) && Number.isFinite(p?.y));
    clippedPoints = cleaned.length >= 2 ? cleaned : prevPoints;
  }

  log.debug('UIO cutter2: Points after cutter2 (sanitized):', clippedPoints);
  return dedupeConsecutivePoints(clippedPoints, log);
}

function hasInvalidPoint(points: P[]): boolean {
  return points?.some((point) => !Number.isFinite(point?.x) || !Number.isFinite(point?.y));
}

function dedupeConsecutivePoints(points: P[], log: ElkLayoutContext['log']): P[] {
  const deduped = points.filter((point, index, arr) => {
    if (index === 0) {
      return true;
    }
    const prev = arr[index - 1];
    return Math.abs(point.x - prev.x) > 1e-6 || Math.abs(point.y - prev.y) > 1e-6;
  });

  if (deduped.length !== points.length) {
    log.debug('UIO cutter2: removed consecutive duplicate points', {
      before: points,
      after: deduped,
    });
  }
  return deduped;
}

function getEndMarkerPathOffset(edge: Edge): number {
  const arrowTypeEnd = (edge as { arrowTypeEnd?: unknown }).arrowTypeEnd;
  return typeof arrowTypeEnd === 'string' ? (END_MARKER_PATH_OFFSETS[arrowTypeEnd] ?? 0) : 0;
}

export function ensureEndMarkerSegmentLength(
  points: P[],
  endBounds: RectLike,
  markerOffset: number,
  log: { debug: (...args: unknown[]) => void }
): P[] {
  if (markerOffset <= 0 || points.length < 3) {
    return points;
  }

  const end = points[points.length - 1];
  const entry = points[points.length - 2];
  const segmentLength = Math.hypot(end.x - entry.x, end.y - entry.y);
  if (segmentLength >= Math.max(MIN_END_MARKER_SEGMENT_LENGTH, markerOffset * 2)) {
    return points;
  }

  if (!onBorder(endBounds, entry, 1)) {
    return points;
  }

  const adjusted = [...points.slice(0, -2), end];
  log.debug('UIO cutter2: removed short end marker segment', {
    before: points,
    after: adjusted,
    markerOffset,
    segmentLength,
  });
  return adjusted;
}

function applyElkEdgeRenderData(data4Layout: LayoutData, elkContext: ElkLayoutContext): void {
  const defaultInterpolate = (data4Layout.edges as unknown as { defaultInterpolate?: unknown })
    .defaultInterpolate;
  const defaultStyle = (data4Layout.edges as unknown as { defaultStyle?: string[] }).defaultStyle;
  const conf = elkContext.getConfig();

  data4Layout.edges.forEach((edge) => {
    const edgeData = buildEdgeData(
      edge,
      {
        defaultStyle,
        defaultInterpolate,
        confCurve: conf.curve,
      },
      elkContext
    );
    Object.assign(edge, edgeData);
  });
}

function buildFallbackEdgeClasses(edge: Edge): string | undefined {
  if (edge.classes !== undefined) {
    return edge.classes;
  }
  if (edge.start && edge.end) {
    return `flowchart-link LS_${edge.start} LE_${edge.end}`;
  }
  return undefined;
}

function computeStroke(
  stroke: string | undefined,
  defaultStyle?: string[],
  defaultLabelStyle?: string[]
) {
  let thickness = 'normal';
  let pattern = 'solid';
  let style: string[] = [];
  let labelStyle: string[] = [];

  if (stroke === 'dotted') {
    pattern = 'dotted';
    style = ['fill:none', 'stroke-width:2px', 'stroke-dasharray:3'];
  } else if (stroke === 'thick') {
    thickness = 'thick';
    style = ['stroke-width: 3.5px', 'fill:none'];
  } else {
    style = defaultStyle ?? ['fill:none'];
    if (defaultLabelStyle !== undefined) {
      labelStyle = defaultLabelStyle;
    }
  }
  return { thickness, pattern, style, labelStyle };
}

function getCurve(edgeInterpolate: unknown, edgesDefaultInterpolate: unknown, confCurve: unknown) {
  if (edgeInterpolate !== undefined) {
    return edgeInterpolate;
  }
  if (edgesDefaultInterpolate !== undefined) {
    return edgesDefaultInterpolate;
  }
  return confCurve;
}

function buildEdgeData(
  edge: Edge,
  defaults: {
    defaultStyle?: string[];
    defaultLabelStyle?: string[];
    defaultInterpolate?: unknown;
    confCurve: unknown;
  },
  elkContext: ElkLayoutContext
) {
  const edgeData: any = {};
  edgeData.minlen = edge.minlen ?? edge.length ?? 1;
  edgeData.text = edge.text ?? edge.label;

  edgeData.arrowhead = edge.arrowhead ?? (edge.type === 'arrow_open' ? 'none' : 'normal');

  const arrowMap = ARROW_MAP[edge.type ?? 'arrow_open'] ?? ARROW_MAP.arrow_open;
  edgeData.arrowTypeStart = edge.arrowTypeStart ?? arrowMap[0];
  edgeData.arrowTypeEnd = edge.arrowTypeEnd ?? arrowMap[1];

  edgeData.startLabelRight = edge.startLabelRight;
  edgeData.endLabelLeft = edge.endLabelLeft;

  const strokeRes = computeStroke(edge.stroke, defaults.defaultStyle, defaults.defaultLabelStyle);
  edgeData.thickness = edge.thickness ?? strokeRes.thickness;
  edgeData.pattern = edge.pattern ?? strokeRes.pattern;
  edgeData.style = edge.style ?? strokeRes.style;
  edgeData.labelStyle = edge.labelStyle ?? strokeRes.labelStyle;
  edgeData.classes = buildFallbackEdgeClasses(edge);

  edgeData.curve = elkContext.interpolateToCurve(
    getCurve(edge.curve ?? edge.interpolate, defaults.defaultInterpolate, defaults.confCurve) as
      | string
      | undefined,
    curveLinear
  );

  const hasText = (edgeData.text ?? '') !== '';
  if (edge.arrowheadStyle !== undefined) {
    edgeData.arrowheadStyle = edge.arrowheadStyle;
  } else if (hasText || edge.style !== undefined) {
    edgeData.arrowheadStyle = 'fill: #333';
  }
  edgeData.labelpos = edge.labelpos ?? (hasText ? 'c' : undefined);

  edgeData.labelType = edge.labelType;
  edgeData.label = (edge.label ?? edgeData.text ?? '').replace(
    elkContext.common.lineBreakRegex,
    '\n'
  );

  return edgeData;
}

function getEffectiveGroupWidth(node: NodeWithVertex): number {
  const labelW = node?.labels?.[0]?.width ?? 0;
  const padding = node?.padding ?? 0;
  return Math.max(node.width ?? 0, labelW + padding);
}

function boundsFor(node: NodeWithVertex): RectLike {
  const width = node?.isGroup ? getEffectiveGroupWidth(node) : node.width;
  return {
    x: node.offset!.posX + node.width! / 2,
    y: node.offset!.posY + node.height! / 2,
    width: width ?? 0,
    height: node.height ?? 0,
    padding: node.padding,
  };
}

function approxEq(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) < eps;
}

function isCenterApprox(point: P, node: { x?: number; y?: number }): boolean {
  return approxEq(point.x, node.x ?? 0) && approxEq(point.y, node.y ?? 0);
}

function getCandidateBorderPoint(
  points: P[],
  node: NodeWithVertex,
  side: Side
): { candidate: P; centerApprox: boolean } {
  if (!points?.length) {
    return { candidate: { x: node.x ?? 0, y: node.y ?? 0 }, centerApprox: true };
  }
  if (side === 'start') {
    const first = points[0];
    const centerApprox = isCenterApprox(first, node);
    const candidate = centerApprox && points.length > 1 ? points[1] : first;
    return { candidate, centerApprox };
  } else {
    const last = points[points.length - 1];
    const centerApprox = isCenterApprox(last, node);
    const candidate = centerApprox && points.length > 1 ? points[points.length - 2] : last;
    return { candidate, centerApprox };
  }
}

function dropAutoCenterPoint(points: P[], side: Side, doDrop: boolean): void {
  if (!doDrop) {
    return;
  }
  if (side === 'start') {
    if (points.length > 0) {
      points.shift();
    }
  } else {
    if (points.length > 0) {
      points.pop();
    }
  }
}

function applyStartIntersectionIfNeeded(
  points: P[],
  startNode: NodeWithVertex,
  startBounds: RectLike,
  log: ElkLayoutContext['log']
): void {
  let firstOutsideStartIndex = -1;
  for (const [index, point] of points.entries()) {
    if (outsideNode(startBounds, point)) {
      firstOutsideStartIndex = index;
      break;
    }
  }
  if (firstOutsideStartIndex !== -1) {
    const outsidePointForStart = points[firstOutsideStartIndex];
    const startCenter = points[0];
    const startIntersection = computeNodeIntersection(
      startNode,
      startBounds,
      outsidePointForStart,
      startCenter
    );
    replaceEndpoint(points, 'start', startIntersection);
    log.debug('UIO cutter2: start-only intersection applied', { startIntersection });
  }
}

function applyEndIntersectionIfNeeded(
  points: P[],
  endNode: NodeWithVertex,
  endBounds: RectLike,
  log: ElkLayoutContext['log']
): void {
  let outsideIndexForEnd = -1;
  for (let index = points.length - 1; index >= 0; index--) {
    if (outsideNode(endBounds, points[index])) {
      outsideIndexForEnd = index;
      break;
    }
  }
  if (outsideIndexForEnd !== -1) {
    const outsidePointForEnd = points[outsideIndexForEnd];
    const endCenter = points[points.length - 1];
    const endIntersection = computeNodeIntersection(
      endNode,
      endBounds,
      outsidePointForEnd,
      endCenter
    );
    replaceEndpoint(points, 'end', endIntersection);
    log.debug('UIO cutter2: end-only intersection applied', { endIntersection });
  }
}

function cutter2(
  startNode: NodeWithVertex,
  endNode: NodeWithVertex,
  originalPoints: P[],
  log: ElkLayoutContext['log']
): P[] {
  const startBounds = boundsFor(startNode);
  const endBounds = boundsFor(endNode);

  if (originalPoints.length === 0) {
    return [];
  }

  const points = [...originalPoints];
  const startCenter = points[0];
  const endCenter = points[points.length - 1];

  log.debug('PPP cutter2: bounds', { startBounds, endBounds });
  log.debug('PPP cutter2: original points', originalPoints);

  let firstOutsideStartIndex = -1;

  for (const [index, point] of points.entries()) {
    if (firstOutsideStartIndex === -1 && outsideNode(startBounds, point)) {
      firstOutsideStartIndex = index;
    }
  }

  if (firstOutsideStartIndex !== -1) {
    const outsidePointForStart = points[firstOutsideStartIndex];
    const startIntersection = computeNodeIntersection(
      startNode,
      startBounds,
      outsidePointForStart,
      startCenter
    );
    log.debug('UIO cutter2: start intersection', startIntersection);
    replaceEndpoint(points, 'start', startIntersection);
  }

  let outsidePointForEnd = null;
  let outsideIndexForEnd = -1;

  for (let index = points.length - 1; index >= 0; index--) {
    if (outsideNode(endBounds, points[index])) {
      outsidePointForEnd = points[index];
      outsideIndexForEnd = index;
      break;
    }
  }

  if (!outsidePointForEnd && points.length > 1) {
    outsidePointForEnd = points[points.length - 2];
    outsideIndexForEnd = points.length - 2;
  }

  if (outsidePointForEnd) {
    const endIntersection = computeNodeIntersection(
      endNode,
      endBounds,
      outsidePointForEnd,
      endCenter
    );
    log.debug('UIO cutter2: end intersection', { endIntersection, outsideIndexForEnd });
    replaceEndpoint(points, 'end', endIntersection);
  }

  if (points.length > 1) {
    const lastPoint = points[points.length - 1];
    const secondLastPoint = points[points.length - 2];
    const distance = Math.sqrt(
      (lastPoint.x - secondLastPoint.x) ** 2 + (lastPoint.y - secondLastPoint.y) ** 2
    );
    if (distance < 2) {
      log.debug('UIO cutter2: trimming tail point (too close)', {
        distance,
        lastPoint,
        secondLastPoint,
      });
      points.pop();
    }
  }

  log.debug('UIO cutter2: final points', points);

  return points;
}
