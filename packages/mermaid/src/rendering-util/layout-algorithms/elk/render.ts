import {
  createCommonLayoutRenderer,
  defaultMeasureLayout,
  type CommonLayoutRenderContext,
} from '../common/index.js';
import type { LayoutData } from '../../types.js';
import { setConfig } from '../../../diagram-api/diagramAPI.js';
// @ts-ignore TODO: Investigate D3 issue
import { curveLinear } from 'd3';
import ELK from 'elkjs/lib/elk.bundled.js';
import { type TreeData, findCommonAncestor } from './find-common-ancestor.js';
import { applyElkLineJumps } from './lineHops.js';
import {
  EDGE_ROUTING_OPTIONS,
  PLACEMENT_OPTIONS,
  ROOT_EXPERIMENT_OVERRIDES,
  SUBGRAPH_EXPERIMENT_OVERRIDES,
} from './elkOptionCatalogue.js';

import {
  type P,
  type RectLike,
  outsideNode,
  computeNodeIntersection,
  outlineAttachPoint,
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
  /**
   * Where ELK put this container, kept when `evenGroupFrames` moves the drawn
   * frame. Edge sections resolve against this, never against the moved frame.
   */
  elkOrigin?: { posX: number; posY: number };
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
  straightenEdges?: boolean;
  preset?: string;
  layeringStrategy?: string;
  layeringLayerBound?: number;
  nodePlacementAlignment?: string;
  nodePlacementStrategy?: string;
}

interface ElkPreparedLayout {
  algorithm?: string;
}

interface ElkLayoutContext {
  algorithm?: string;
  /**
   * Extra root-graph `layoutOptions`, merged last over
   * {@link createRootElkGraph}'s defaults.
   *
   * NOT user-facing config: nothing in `config.schema.yaml` writes it and
   * production `render()` never sets it. It exists so the DDLT configuration
   * sweep can try ELK options that are currently hardcoded here — spacings,
   * edge routing, node placement — WITHOUT forking the layout pipeline. A
   * sweep that reimplemented `createRootElkGraph` would be measuring a graph
   * the browser never builds, which is the exact failure the single-pipeline
   * rule exists to prevent.
   *
   * Promote a winning option to a real default in `createRootElkGraph`, or to
   * a `config.elk.*` key if it should be author-controlled. Do not reach for
   * this from product code.
   */
  rootLayoutOptions?: Record<string, unknown>;
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

/**
 * Margin reserved at the ends of each side of a node, so that a port cannot be
 * placed on a corner. `alignDegenerateNodeToAnchor` treats a side shorter than
 * twice this as having no usable anchor span, so the option string below is
 * built from it — the two must not be able to disagree.
 */
const PORTS_SURROUNDING_MARGIN = 12;
/** The margin spelled as an ELK margin, because `spacing.portsSurrounding` takes one. */
const PORTS_SURROUNDING = `[top=${PORTS_SURROUNDING_MARGIN},left=${PORTS_SURROUNDING_MARGIN},bottom=${PORTS_SURROUNDING_MARGIN},right=${PORTS_SURROUNDING_MARGIN}]`;
/** Padding between a subgraph frame and its children. ELK's own default is 12. */
const SUBGRAPH_PADDING = 24;
/**
 * Default `spacing.baseValue` for a subgraph that has no algorithm of its own.
 *
 * Every unset spacing derives from this, which is why it used to be 50: the
 * gap ELK derives for an edge approaching a node comes out at roughly half,
 * and below about 40 the approach ran shorter than the 10px arrowhead, so the
 * turn read as happening underneath it.
 *
 * Paying for that approach out of the base value overcharged everything else.
 * An edge routed down the inside of a frame claims a lane the same width, so a
 * group with a couple of them was pushed 50px clear of its own border on that
 * side and nowhere else — visible as a subgraph padded on one side only, for
 * no reason a reader can see.
 *
 * The two are now set separately: this stays tight, and
 * `elk.layered.spacing.edgeNodeBetweenLayers` buys the approach on its own.
 * An earlier note here claimed ELK ignored an explicit edge-node spacing "in
 * every key form"; it does honour the layered-scoped key, and the attempt that
 * failed had used `elk.layered.spacing.edgeEdgeBetweenLayers`, which is
 * edge-to-edge and a different quantity.
 */
const DEFAULT_SUBGRAPH_SPACING_BASE_VALUE = 24;
/**
 * Gap between two sibling nodes in a subgraph.
 *
 * Also used to derive from `spacing.baseValue`, so lowering that pulled a
 * group's nodes together until they tripped the validator's
 * `node-node-padding` rule — three fixtures went invalid on it. 50 is what the
 * old base value yielded, restored here so the base value is free to be small.
 *
 * Deliberately spelled the same way as the `elk.rectpacking` override in
 * `RECTPACKING_OPTIONS`: ELK reads `spacing.nodeNode` and `elk.spacing.nodeNode`
 * as the same option, so using both forms would leave a rectpacking container
 * carrying two values for it and no say in which one won.
 */
const DEFAULT_SUBGRAPH_NODE_SPACING = 50;
/** Inner padding reserved around a container that runs its own algorithm. */
const CONTAINER_PADDING = 15;
/** Same, for `elk.rectpacking`, which packs tighter. */
const RECTPACKING_CONTAINER_PADDING = 10;

/**
 * Shared layout options for elk.rectpacking — applied at both root level
 * and per-group level to reduce wasted space.
 * trybox: attempt box-like packing first for tighter results.
 * SCANLINE: width approximation scans node sizes instead of using a fixed target.
 * EQUAL_BETWEEN_STRUCTURES: distributes remaining whitespace evenly between children.
 */
const RECTPACKING_OPTIONS: Record<string, string | number> = {
  'spacing.baseValue': 15,
  'spacing.nodeNode': 15,
  'elk.aspectRatio': '1.6',
  'elk.expandNodes': 'true',
  'elk.rectpacking.trybox': 'true',
  'elk.rectpacking.packing.compaction.rowHeightReevaluation': 'true',
  'elk.rectpacking.packing.compaction.iterations': 10,
  'elk.rectpacking.whiteSpaceElimination.strategy': 'EQUAL_BETWEEN_STRUCTURES',
  'elk.rectpacking.widthApproximation.strategy': 'SCANLINE',
};

/**
 * Every option `buildSubgraphLayoutOptions` sets *because* a container asked for
 * its own algorithm. When cross-boundary edges force the container back onto the
 * inherited algorithm, all of these have to go — they are not inert under
 * `elk.layered`, so leaving them behind produced a hybrid rather than the
 * documented fallback.
 */
const CONTAINER_ALGORITHM_SCOPED_OPTIONS = [
  'nodeSize.constraints',
  'nodeSize.minimum',
  'elk.algorithm',
  'elk.aspectRatio',
  'elk.contentAlignment',
  'elk.expandNodes',
  'elk.padding',
  ...Object.keys(RECTPACKING_OPTIONS),
];

/**
 * Undo the algorithm-scoped options on a container, restoring the values a
 * plain subgraph would have had.
 */
export function clearContainerAlgorithmOptions(layoutOptions: Record<string, unknown>): void {
  for (const key of CONTAINER_ALGORITHM_SCOPED_OPTIONS) {
    delete layoutOptions[key];
  }
  // `spacing.baseValue` and `spacing.nodeNode` are base options that the
  // rectpacking overrides stomp on, so restore the defaults rather than leaving
  // them unset. Missing the second one would silently hand the container back
  // ELK's own node spacing instead of ours.
  layoutOptions['spacing.baseValue'] = DEFAULT_SUBGRAPH_SPACING_BASE_VALUE;
  layoutOptions['spacing.nodeNode'] = DEFAULT_SUBGRAPH_NODE_SPACING;
}

/**
 * ELK algorithm ids a container may select through `@{ algorithm: … }`.
 *
 * The value comes from user-authored diagram metadata and would otherwise be
 * handed to ELK verbatim; an id ELK doesn't know aborts the whole layout and
 * blanks the diagram. Anything outside this list is ignored with a warning, so
 * a typo degrades to the default layout instead of losing the render.
 */
const CONTAINER_ALGORITHMS = new Set([
  'elk.layered',
  'elk.box',
  'elk.rectpacking',
  'elk.stress',
  'elk.force',
  'elk.mrtree',
  'elk.radial',
  'elk.sporeOverlap',
]);

/**
 * Resolve a container's requested layout algorithm, or `undefined` when the
 * request is absent, not a string, or not a supported ELK algorithm.
 */
export function resolveContainerAlgorithm(
  requested: unknown,
  log?: ElkLayoutContext['log']
): string | undefined {
  if (typeof requested !== 'string') {
    return undefined;
  }
  if (!CONTAINER_ALGORITHMS.has(requested)) {
    log?.warn(
      `Unknown container layout algorithm "${requested}". Supported values: ${[...CONTAINER_ALGORITHMS].join(', ')}. Falling back to the diagram's layout algorithm.`
    );
    return undefined;
  }
  return requested;
}

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
  node: {
    dir?: string;
    padding?: number;
    labelData?: LabelData;
    metadata?: { algorithm?: unknown } & Record<string, unknown>;
  },
  elkConfig: ElkSubgraphConfig | undefined,
  algorithm: string | undefined,
  log?: ElkLayoutContext['log']
): Record<string, unknown> {
  // Compute label-based minimum width so ELK sizes compound nodes to fit their
  // labels. nodeSize.minimum acts as a label-derived floor while ELK computes
  // the actual size from the children.
  const labelW = node.labelData?.width ?? 0;
  const pad = node.padding ?? 0;
  const minWidth = labelW + 2 * pad;
  const labelH = node.labelData?.height ?? 0;

  const layoutOptions: Record<string, unknown> = {
    'spacing.baseValue': DEFAULT_SUBGRAPH_SPACING_BASE_VALUE,
    // The straight run an edge gets before the node it enters, bought on its
    // own rather than out of `spacing.baseValue` — see the note there. This is
    // the layered-scoped key; the unscoped `spacing.edgeNodeBetweenLayers` is
    // not an ELK id at all and setting it does nothing.
    //
    // 30, which is where the approach run stops improving: 40 measured the same
    // 30px shortest approach and only widened the lane this value also pays
    // for. That lane used to be the reason to go lower — the value is charged
    // TWICE against a group with an edge routed inside its frame, once between
    // the nodes and the lane and again between the lane and the frame, so the
    // group's extra width came out at exactly `36 + 2x`. `evenGroupFrames` now
    // pulls the frame in past the lane regardless, so a wider lane no longer
    // shows as lopsided padding and the only cost left is overall diagram size.
    //
    // Do NOT lower it further on that reasoning. Over the DDLT corpus this is
    // not monotonic: 30 and 40 leave one fixture invalid (the deliberate
    // merge-edge counterexample), while 20 leaves two and 25 leaves three —
    // `right-angles-not-curves` starts tripping `edge-parallel-segment-too-close`
    // because this spacing also separates edges running alongside each other in
    // the layer gap. 30 is the lowest value that keeps the corpus clean.
    'elk.layered.spacing.edgeNodeBetweenLayers': 30,
    // Separation between edges sharing a lane. Also raised off the base value,
    // so that lowering the base does not leave parallel edges touching.
    'elk.spacing.edgeEdge': 20,
    // Node separation, likewise bought on its own — see the note on the constant.
    'spacing.nodeNode': DEFAULT_SUBGRAPH_NODE_SPACING,
    // Breathing room between a frame and its children. Set explicitly rather
    // than left to ELK's default of 12. The top gets the same value as the
    // rest: ELK reserves the subgraph's own title strip on top of whatever is
    // given here, so adding the label height again double-counts it.
    'elk.padding': `[top=${SUBGRAPH_PADDING},left=${SUBGRAPH_PADDING},bottom=${SUBGRAPH_PADDING},right=${SUBGRAPH_PADDING}]`,
    'nodeLabels.placement': '[H_CENTER V_TOP, INSIDE]',

    'elk.layered.mergeEdges': elkConfig?.mergeEdges,
    'elk.layered.nodePlacement.bk.fixedAlignment':
      elkConfig?.nodePlacementAlignment ?? DEFAULT_NODE_PLACEMENT_ALIGNMENT,
    // Containers place their own children, and the preset says how: by default
    // NETWORK_SIMPLEX, which balances a node against all of its neighbours and
    // so keeps a group's nodes aligned with each other instead of drifting,
    // while the root uses LINEAR_SEGMENTS. `legacy` keeps both on the strategy
    // that shipped before, so it still reproduces the old rendering.
    //
    // ONE key, fully qualified. ELK reads `nodePlacement.strategy` and
    // `elk.layered.nodePlacement.strategy` as the same option, so listing both
    // — as this did — leaves the container holding two values for it with no
    // say in which wins, and quietly ignores an explicit `nodePlacementStrategy`.
    'elk.layered.nodePlacement.strategy':
      elkConfig?.nodePlacementStrategy ?? resolveElkPreset(elkConfig?.preset).containerPlacement,
    // PORT_POSITION lets a node shift so an edge can leave straight rather than
    // bending immediately off the port.
    'elk.layered.nodePlacement.networkSimplex.nodeFlexibility': 'PORT_POSITION',
    // Keep a frame's ports off its own corners. See the note in
    // `createRootElkGraph`; a container is where this bites hardest, because a
    // cross-boundary edge attaches to the frame rather than to a node inside it.
    'elk.spacing.portsSurrounding': PORTS_SURROUNDING,
  };

  // Apply per-group algorithm from metadata (e.g. @{algorithm: elk.box}).
  // SEPARATE_CHILDREN is required so the subgraph's algorithm actually
  // runs instead of being swallowed by the root INCLUDE_CHILDREN policy.
  const algo = resolveContainerAlgorithm(node.metadata?.algorithm, log);
  if (algo) {
    // Label-derived minimum size, so ELK sizes the container to fit its label.
    // Scoped to containers that opt into their own algorithm: applying it to
    // every subgraph changes the dimensions of existing flowchart subgraphs.
    const padTop = labelH + CONTAINER_PADDING;
    layoutOptions['nodeSize.constraints'] = '[MINIMUM_SIZE, NODE_LABELS]';
    // The minimum has to clear the whole reserved strip — the label plus the
    // padding above and below it — not just the label height, or a container
    // whose children are shorter than its own chrome comes out too short.
    layoutOptions['nodeSize.minimum'] = `(${minWidth}, ${padTop + CONTAINER_PADDING})`;
    layoutOptions['elk.algorithm'] = algo;
    layoutOptions['elk.hierarchyHandling'] = 'SEPARATE_CHILDREN';
    layoutOptions['elk.aspectRatio'] = '2.0';
    layoutOptions['elk.contentAlignment'] = 'H_CENTER V_TOP';
    layoutOptions['elk.expandNodes'] = 'true';
    // Reserve top padding for the label so children don't overlap it
    layoutOptions['elk.padding'] =
      `[top=${padTop},left=${CONTAINER_PADDING},bottom=${CONTAINER_PADDING},right=${CONTAINER_PADDING}]`;

    // Tighter spacing for rectpacking — uses smaller padding for nested containers.
    if (algo === 'elk.rectpacking') {
      const rectPadTop = labelH + RECTPACKING_CONTAINER_PADDING;
      Object.assign(layoutOptions, RECTPACKING_OPTIONS, {
        'elk.padding': `[top=${rectPadTop},left=${RECTPACKING_CONTAINER_PADDING},bottom=${RECTPACKING_CONTAINER_PADDING},right=${RECTPACKING_CONTAINER_PADDING}]`,
        'nodeSize.minimum': `(${minWidth}, ${rectPadTop + RECTPACKING_CONTAINER_PADDING})`,
      });
    }
  } else if (node.dir) {
    // Directional subgraph without explicit algorithm — run the parent layered
    // algorithm in the subgraph's own coordinate system.
    layoutOptions['elk.algorithm'] = algorithm;
    layoutOptions['elk.direction'] = dir2ElkDirection(node.dir);
    layoutOptions['elk.hierarchyHandling'] = 'SEPARATE_CHILDREN';
  }

  // Container-scoped experiments. Spacing, padding and label placement only
  // bite here — an option set on the root never reaches inside a frame.
  Object.assign(layoutOptions, SUBGRAPH_EXPERIMENT_OVERRIDES);

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
 * contain a cycle. For such components we break cycles greedily in edge
 * declaration order: an edge that would close a directed cycle is treated as a
 * back-edge and skipped, and the entry is the first node in declaration order
 * that is a source of the remaining forward edges. Raw in-degree alone cannot
 * find it — a back-edge feeding the true entry hides it, and nominating by
 * node declaration order instead scrambles the layout (#79). Acyclic
 * components always have a source and nominate nothing, leaving their layout
 * untouched. The caller pins each nominee to the first layer with
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
    // Container-internal directed edges in declaration order, for the
    // cycle-breaking fallback below.
    const internalEdges: [string, string][] = [];

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
      internalEdges.push([source, target]);
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
    const hasSource = new Array<boolean>(componentCount).fill(false);
    for (const id of ids) {
      if ((inDegree.get(id) ?? 0) === 0) {
        hasSource[component.get(id)!] = true;
      }
    }
    if (!hasSource.includes(false)) {
      continue;
    }

    // Recover each source-less component's entry by breaking cycles greedily
    // in edge declaration order: skip any edge that would close a directed
    // cycle (a back-edge). The surviving forward edges are acyclic, so every
    // component regains at least one source; nominate the first one in
    // declaration order.
    const forward = new Map<string, string[]>(ids.map((id) => [id, []]));
    const residualInDegree = new Map<string, number>(ids.map((id) => [id, 0]));
    const reaches = (from: string, to: string): boolean => {
      const seen = new Set<string>([from]);
      const stack = [from];
      while (stack.length > 0) {
        const current = stack.pop()!;
        if (current === to) {
          return true;
        }
        for (const next of forward.get(current)!) {
          if (!seen.has(next)) {
            seen.add(next);
            stack.push(next);
          }
        }
      }
      return false;
    };
    for (const [source, target] of internalEdges) {
      if (reaches(target, source)) {
        continue;
      }
      forward.get(source)!.push(target);
      residualInDegree.set(target, (residualInDegree.get(target) ?? 0) + 1);
    }

    const nominated = new Array<boolean>(componentCount).fill(false);
    for (const id of ids) {
      const c = component.get(id)!;
      if (!hasSource[c] && !nominated[c] && residualInDegree.get(id) === 0) {
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
  syncHostConfig(elkContext);
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
  const elkGraph = createRootElkGraph(
    data4Layout,
    elkContext.algorithm,
    elkContext.rootLayoutOptions
  );

  const dir = (data4Layout as { direction?: string }).direction ?? 'DOWN';
  elkGraph.layoutOptions['elk.direction'] = dir2ElkDirection(dir);

  const parentLookupDb = addSubGraphs(data4Layout.nodes, elkContext.log);
  addVertices(data4Layout.nodes, elkGraph, nodeDb, elkContext);
  addEdgesToElkGraph(data4Layout, elkGraph, nodeDb, elkContext);
  configureSubgraphNodes(data4Layout, nodeDb, parentLookupDb, elkContext);
  configureCrossHierarchyEdges(elkGraph, nodeDb, parentLookupDb, elkContext.log);
  applyCyclicEntryConstraint(data4Layout, nodeDb);

  return { elkGraph, nodeDb, parentLookupDb };
}

export const render = createCommonLayoutRenderer<ElkLayoutResult, ElkPreparedLayout>({
  afterPaint: applyElkLineJumps,
  prepareLayout: prepareLayoutForElk,
  // ELK derives a compound node's minimum size from the measured cluster label,
  // so the label has to be measured the way `insertCluster` paints it —
  // unwrapped — rather than at the 200px flowchart wrapping width. Requested
  // here rather than sniffed for in core: core has no business knowing which
  // layout it is running.
  measureLayout: (data4Layout, context) =>
    defaultMeasureLayout(data4Layout, context, { unwrapGroupLabels: true }),
  runLayoutCore: runElkLayoutCore,
  paintOptions: {
    skipIntersect: true,
  },
});

/**
 * Copy the host's config into whichever config module this bundle is using —
 * except the secure keys, which `setConfig` strips.
 *
 * When this file is compiled into `@mermaid-js/layout-elk` the bundle carries
 * its own copy of the config module, and that copy never sees the host's
 * `initialize()` — so it reads schema defaults and paints, for example, edge
 * markers without `arrowMarkerAbsolute`. `setConfig` here resolves to the local
 * copy while `context.getConfig` comes from the host, so this repairs it.
 *
 * `setConfig` runs `sanitize()`, which deletes every key in
 * `['secure', ...siteConfig.secure]` — `securityLevel`, `startOnLoad`,
 * `maxTextSize`, `maxEdges`, `suppressErrorRendering` — so those never
 * propagate through this call. That is the safe direction: the plugin's local
 * copy stays at the schema default `strict` rather than inheriting a looser
 * host value. If the host's `securityLevel` ever genuinely needs to reach the
 * plugin's copy, `setSiteConfig` is the call that survives sanitization.
 *
 * Compiled into mermaid itself the two are the same module and this is a no-op.
 */
function syncHostConfig(elkContext: ElkLayoutContext): void {
  setConfig(elkContext.getConfig());
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
    rootLayoutOptions: (
      context.options as { rootLayoutOptions?: Record<string, unknown> } | undefined
    )?.rootLayoutOptions,
    common: helpers.common,
    getConfig: helpers.getConfig,
    interpolateToCurve: helpers.interpolateToCurve as (
      interpolate: string | undefined,
      defaultCurve: unknown
    ) => unknown,
    log: helpers.log,
  };
}

/**
 * Scratch overrides for local experimentation. MUST be empty on `develop`.
 *
 * Spread last into the root graph's `layoutOptions`, so anything here wins over
 * the defaults above — including the keys wired to `config.elk.*`. That is the
 * point: edit one line, let the dev server rebuild, and compare renders without
 * touching a diagram's frontmatter or the config schema.
 *
 * It is also why this must not ship. An entry here silently disables the
 * matching user-facing option for every diagram, and the symptom — "this config
 * key does nothing" — gives no hint where to look. `elk.cycleBreakingStrategy`
 * was dead this way, and it took a bisect against the raw ELK option to notice.
 */
/**
 * Named combinations of the three options that decide where nodes end up.
 *
 * Layering picks the column, node placement the coordinate within it, and cycle
 * breaking which edges are reversed and therefore which ones detour. They run in
 * different phases and do not interact, so a preset is a named triple rather
 * than a mode of its own.
 *
 * An explicit `elk.layeringStrategy` / `nodePlacementStrategy` /
 * `cycleBreakingStrategy` beats the preset for that one option — which is why
 * `defaultConfig` leaves all three undefined rather than giving them values.
 */
const ELK_PRESETS: Record<
  string,
  { layering: string; placement: string; containerPlacement: string; cycleBreaking: string }
> = {
  /**
   * Network simplex at the root, Brandes-Koepf inside frames, cycles broken
   * depth first.
   *
   * Depth-first cycle breaking gives shorter back edges on graphs that have
   * many of them, which is most flowcharts that loop at all. `modelOrder` is
   * the same triple with the greedy-model-order breaking this used to carry.
   *
   * Containers deliberately do NOT follow the root's placement. Network simplex
   * inside a frame produced routes that left a subgraph on its bounding-box
   * corner, so the two sides are tuned separately: changing one is not a reason
   * to change the other, and `legacy` keeps both on the strategy that shipped
   * before.
   */
  default: {
    layering: 'NETWORK_SIMPLEX',
    placement: 'NETWORK_SIMPLEX',
    containerPlacement: 'BRANDES_KOEPF',
    cycleBreaking: 'DEPTH_FIRST',
  },
  /**
   * What shipped before presets: straighter long edges, less alignment.
   *
   * `GREEDY`, not `GREEDY_MODEL_ORDER`, is deliberate. The schema advertised
   * the latter, but `defaultConfig` never listed `cycleBreakingStrategy`, so it
   * reached ELK as undefined and ELK's own default applied. This preset
   * reproduces what `develop` actually renders, not what its schema claimed.
   * Layering is ELK's default too — `develop` does not wire the option at all.
   */
  legacy: {
    layering: 'NETWORK_SIMPLEX',
    placement: 'BRANDES_KOEPF',
    containerPlacement: 'BRANDES_KOEPF',
    cycleBreaking: 'GREEDY',
  },
  /**
   * As `default`, but breaks cycles by greedy model order — which reverses the
   * edges that disturb declaration order least, at the cost of longer back
   * edges. This is the triple `default` named before depth-first took over.
   */
  modelOrder: {
    layering: 'NETWORK_SIMPLEX',
    placement: 'NETWORK_SIMPLEX',
    containerPlacement: 'BRANDES_KOEPF',
    cycleBreaking: 'GREEDY_MODEL_ORDER',
  },
  /**
   * Kept as a name for what `default` now is, so diagrams that asked for
   * depth-first breaking by name keep saying what they mean. Identical to
   * `default` on purpose — not a distinct combination.
   */
  depthFirst: {
    layering: 'NETWORK_SIMPLEX',
    placement: 'NETWORK_SIMPLEX',
    containerPlacement: 'BRANDES_KOEPF',
    cycleBreaking: 'DEPTH_FIRST',
  },
};

/**
 * Resolve a preset name, falling back to `default` for an unknown one.
 *
 * `Object.hasOwn` rather than a plain lookup: the schema's enum only guards the
 * config path, and a directive or a programmatic config can still put anything
 * here. `ELK_PRESETS['__proto__']` is truthy, so an indexed lookup would return
 * `Object.prototype` and every strategy read off it would come back `undefined`
 * — a silently strategy-less layout rather than the documented fallback.
 */
export function resolveElkPreset(name: string | undefined) {
  return name !== undefined && Object.hasOwn(ELK_PRESETS, name)
    ? ELK_PRESETS[name]
    : ELK_PRESETS.default;
}

function createRootElkGraph(
  data4Layout: LayoutData,
  algorithm: string | undefined,
  rootLayoutOptions?: Record<string, unknown>
): any {
  const preset = resolveElkPreset(data4Layout.config.elk?.preset);
  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.algorithm': algorithm,
      'elk.layered.nodePlacement.strategy':
        data4Layout.config.elk?.nodePlacementStrategy ?? preset.placement,
      'elk.layered.nodePlacement.bk.fixedAlignment':
        data4Layout.config.elk?.nodePlacementAlignment ?? DEFAULT_NODE_PLACEMENT_ALIGNMENT,
      'elk.layered.mergeEdges': data4Layout.config.elk?.mergeEdges,
      'elk.direction': 'DOWN',
      'spacing.baseValue': 40,

      'elk.layered.crossingMinimization.forceNodeModelOrder':
        data4Layout.config.elk?.forceNodeModelOrder,
      'elk.layered.considerModelOrder.strategy': data4Layout.config.elk?.considerModelOrder,
      'elk.layered.unnecessaryBendpoints': true,
      'elk.layered.cycleBreaking.strategy':
        data4Layout.config.elk?.cycleBreakingStrategy ?? preset.cycleBreaking,
      'elk.layered.layering.strategy': data4Layout.config.elk?.layeringStrategy ?? preset.layering,
      // Only COFFMAN_GRAHAM reads this; the others ignore it.
      'elk.layered.layering.coffmanGraham.layerBound': data4Layout.config.elk?.layeringLayerBound,

      // 'spacing.nodeNode': 120,
      // 'spacing.nodeNodeBetweenLayers': 25,
      // 'spacing.edgeNode': 20,
      // 'spacing.edgeNodeBetweenLayers': 10,
      // 'spacing.edgeEdge': 10,
      // 'spacing.edgeEdgeBetweenLayers': 20,
      // 'spacing.nodeSelfLoop': 20,

      // Tweaking options
      'elk.layered.wrapping.multiEdge.improveCuts': true,
      'elk.layered.wrapping.multiEdge.improveWrappedEdges': true,
      'elk.layered.edgeRouting.selfLoopDistribution': 'EQUALLY',
      'elk.layered.mergeHierarchyEdges': true,
      // Reserve a margin at the ends of every side so a port cannot land on a
      // corner. ELK's default is 0, which permits it — and a corner is the one
      // boundary point with no side to leave from, so the edge came out of the
      // vertex and then ran ALONG the box's own edge before turning away. It
      // showed up on subgraphs first because a cross-boundary edge attaches to
      // the frame, which is large enough for the corner to be visible.
      //
      // Chosen at 12 by measurement, not taste: it is the smallest value that
      // clears the corner on the `elk-edge-cases` corpus. 30 was tried and
      // reorders layers, so this is not a free parameter — raising it changes
      // more than clearance.
      'elk.spacing.portsSurrounding': PORTS_SURROUNDING,
    },
    children: [],
    edges: [],
  };

  // Optimize spacing when rectpacking is the root algorithm.
  if (algorithm === 'elk.rectpacking') {
    Object.assign(graph.layoutOptions, RECTPACKING_OPTIONS, {
      'elk.contentAlignment': 'H_CENTER V_TOP',
      'elk.padding': '[top=15,left=15,bottom=15,right=15]',
    });
  }

  // Last, so a sweep override beats every default above. See
  // `ElkLayoutContext.rootLayoutOptions` for why this exists.
  if (rootLayoutOptions) {
    Object.assign(graph.layoutOptions, rootLayoutOptions);
  }

  // Hand-run experiments from `elkOptionCatalogue.ts`, last so an option
  // switched on there wins over the preset, `config.elk.*` and the sweep.
  // MUST all be commented out on `develop` — this is the production path.
  Object.assign(
    graph.layoutOptions,
    PLACEMENT_OPTIONS,
    EDGE_ROUTING_OPTIONS,
    ROOT_EXPERIMENT_OVERRIDES
  );

  return graph;
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
      elkContext.algorithm,
      elkContext.log
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
      setIncludeChildrenPolicy(nodeDb, source, ancestorId, log);
      setIncludeChildrenPolicy(nodeDb, target, ancestorId, log);
    }
  });
}

function setIncludeChildrenPolicy(
  nodeDb: Record<string, NodeWithVertex>,
  nodeId: string,
  ancestorId: string,
  log: ElkLayoutContext['log']
): void {
  const node = nodeDb[nodeId];

  if (!node) {
    return;
  }
  node.layoutOptions ??= {};

  // If this node has a user-specified custom algorithm (e.g. elk.box) with
  // SEPARATE_CHILDREN, clear it — cross-boundary edges are incompatible with
  // isolated layout algorithms.  Nodes using the default layered algorithm
  // (set via the dir branch) keep theirs so they still lay out correctly.
  if (
    node.layoutOptions['elk.hierarchyHandling'] === 'SEPARATE_CHILDREN' &&
    resolveContainerAlgorithm(node.metadata?.algorithm)
  ) {
    log.debug('Dropping explicit algorithm for node', node.id, 'due to cross-boundary edges');
    clearContainerAlgorithmOptions(node.layoutOptions);
  }

  node.layoutOptions['elk.hierarchyHandling'] = 'INCLUDE_CHILDREN';
  if (node.id !== ancestorId && node.parentId) {
    setIncludeChildrenPolicy(nodeDb, node.parentId, ancestorId, log);
  }
}

async function runElkLayout(
  elk: { layout: (graph: any) => Promise<ElkLayoutResult> },
  elkGraph: any,
  log: ElkLayoutContext['log']
): Promise<ElkLayoutResult> {
  // Time the actual external elkjs call ("layoutCore") separately from our
  // wrapper. The render profiler isn't importable from this external package, so
  // read the single shared instance off the global — present only in
  // dev/profiling builds, undefined (and thus a no-op) otherwise.
  const profiler = (
    globalThis as typeof globalThis & {
      __mermaidProfiler?: { begin(name: string): void; end(): void };
    }
  ).__mermaidProfiler;
  try {
    // Time the actual external elkjs call ("layoutCore") on its own.
    profiler?.begin('layoutCore');
    let graph: ElkLayoutResult;
    try {
      graph = await elk.layout(elkGraph);
    } finally {
      profiler?.end();
    }
    log.debug('APA01 after - success');
    // Pass the object, not a pre-serialised string: `JSON.stringify` of the
    // whole laid-out graph ran on every render regardless of log level.
    log.debug('APA01 layout result:', graph);
    return graph;
  } catch (error) {
    log.error('ELK layout error:', error);
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
  // Between positions and edges on purpose: `boundsFor` reads the box set
  // above, and `cutter2` clips an edge that ends on a group against it, so an
  // edge attaching to a frame follows the frame when it moves.
  evenGroupFrames(graph.children ?? [], layoutState, nodeById, graph);
  applyElkEdgeLayout(data4Layout, graph, layoutState, log);
}

/**
 * Sit each group's frame an even distance from its own contents.
 *
 * ELK sizes a container around everything it put inside, edges included. An
 * edge that runs against the flow of the layout gets routed back around the
 * outside, and when that happens inside a frame the frame grows to hold the
 * lane — on one side only, since that is where the edge leaves. The result is a
 * group with 76px of space on the right and 24px on the left, which reads as a
 * mistake because nothing visible occupies it.
 *
 * The lane is real and the edge still needs it, so the fix is not to reclaim
 * the space but to stop drawing the frame around it. The frame is pulled in to
 * `SUBGRAPH_PADDING` from the children on the left, right and bottom, and the
 * edge keeps its lane just outside — which is what an edge routed around a
 * group should look like anyway.
 *
 * The top is left exactly as ELK set it. It carries the subgraph's title strip,
 * and there is no way from here to tell how much of that padding is the label
 * and how much is spare, so tightening it risks clipping the title.
 *
 * Runs deepest-first, so a parent measures against children that have already
 * been pulled in rather than against their original boxes.
 */
export function collectDescendantIds(elkNode: any, into = new Set<string>()): Set<string> {
  for (const child of elkNode.children ?? []) {
    into.add(child.id);
    collectDescendantIds(child, into);
  }
  return into;
}

/**
 * Absolute points of every edge ELK routed INSIDE this group — meaning both of
 * its endpoints are descendants of the group.
 *
 * An edge with one endpoint outside is the case this whole pass exists for: its
 * lane belongs to the layout around the group, not to the group, so the frame
 * should not be drawn around it. An edge with both endpoints inside is the
 * opposite — its lane is part of the group's interior, and a frame pulled in
 * past it would leave the edge running outside a group it never leaves.
 */
function internalEdgePoints(
  graph: ElkLayoutResult,
  descendants: Set<string>,
  layoutState: ElkLayoutState
): P[] {
  const points: P[] = [];
  for (const edge of graph.edges ?? []) {
    const source = edge.sources?.[0] ?? edge.start;
    const target = edge.targets?.[0] ?? edge.end;
    if (!descendants.has(source) || !descendants.has(target)) {
      continue;
    }
    const offset = calcOffset(source, target, layoutState.parentLookupDb, layoutState.nodeDb);
    for (const section of edge.sections ?? []) {
      for (const p of [section.startPoint, ...(section.bendPoints ?? []), section.endPoint]) {
        if (p) {
          points.push({ x: p.x + offset.x, y: p.y + offset.y });
        }
      }
    }
  }
  return points;
}

export function evenGroupFrames(
  elkNodes: any[],
  layoutState: ElkLayoutState,
  nodeById: Map<string, Node>,
  graph: ElkLayoutResult = {}
): void {
  for (const elkNode of elkNodes) {
    if (!elkNode?.isGroup) {
      continue;
    }
    const children = elkNode.children ?? [];
    evenGroupFrames(children, layoutState, nodeById, graph);

    const group = layoutState.nodeDb[elkNode.id];
    const boxes = children
      .map((child: { id: string }) => layoutState.nodeDb[child.id])
      .filter((child: NodeWithVertex | undefined) => child?.offset && child.width && child.height);
    if (!group?.offset || boxes.length === 0) {
      continue;
    }

    const lane = internalEdgePoints(graph, collectDescendantIds(elkNode), layoutState);
    const xs = [
      ...boxes.map((b: NodeWithVertex) => b.offset!.posX),
      ...boxes.map((b: NodeWithVertex) => b.offset!.posX + b.width!),
      ...lane.map((p) => p.x),
    ];
    const ys = [
      ...boxes.map((b: NodeWithVertex) => b.offset!.posY),
      ...boxes.map((b: NodeWithVertex) => b.offset!.posY + b.height!),
      ...lane.map((p) => p.y),
    ];

    // Only ever pull a frame IN. ELK sized it to hold everything it put there,
    // so growing one would mean this pass had measured something ELK had not —
    // more likely a bug here than a gap there.
    const origin = group.offset;
    const left = Math.max(origin.posX, Math.min(...xs) - SUBGRAPH_PADDING);
    const right = Math.min(origin.posX + group.width!, Math.max(...xs) + SUBGRAPH_PADDING);
    const bottom = Math.min(origin.posY + group.height!, Math.max(...ys) + SUBGRAPH_PADDING);
    const top = origin.posY;

    // A frame narrower than its own title would cut the title off. Both the
    // drawn rect and `getEffectiveGroupWidth` have their own idea of the floor,
    // so honour the larger and keep the frame centred on its contents.
    const labelFloor = Math.max(
      elkNode.labelData?.width ?? 0,
      (elkNode.labels?.[0]?.width ?? 0) + (elkNode.padding ?? 0)
    );
    let x = left;
    let width = right - left;
    if (width < labelFloor) {
      x -= (labelFloor - width) / 2;
      width = labelFloor;
      // Still only ever pull IN. A title wider than the frame ELK sized is a
      // frame ELK did not reserve for its own title, and widening it here would
      // paper over that while breaking the one guarantee this pass makes.
      const origRight = origin.posX + group.width!;
      x = Math.max(origin.posX, Math.min(x, origRight - width));
      width = Math.min(width, group.width!);
    }
    const height = bottom - top;
    if (height <= 0 || width <= 0) {
      continue;
    }

    // `calcOffset` resolves an edge's section against the origin of the
    // container that owns it, so moving a frame would drag every edge routed
    // inside it. Keep what ELK chose and let `calcOffset` read that instead.
    group.elkOrigin ??= { posX: origin.posX, posY: origin.posY };
    group.offset.posX = x;
    group.offset.width = width;
    group.offset.height = height;
    group.width = width;
    group.height = height;
    group.x = x + width / 2;
    group.y = top + height / 2;

    const layoutNode = nodeById.get(elkNode.id);
    if (layoutNode) {
      layoutNode.x = group.x;
      layoutNode.y = group.y;
      // The clamp above, not the label floor. `width` has already honoured the
      // floor wherever ELK left room for it; the only case where the label is
      // still wider is the one the clamp just refused, so taking the max here
      // would quietly undo it — and this is the width the frame is PAINTED at
      // (`clusters.js` sizes the rect from `node.width`), so the frame would
      // spill outside the bounds ELK reserved.
      layoutNode.width = width;
      layoutNode.height = height;
    }
  }
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

/**
 * Largest port-to-channel jog worth collapsing.
 *
 * ELK layered spreads an edge's port evenly along the node's side, then routes
 * the edge down an inter-layer channel whose row rarely lines up with that port
 * exactly. The leftover is a staircase right at the border: leave the port, run
 * a few pixels, step perpendicular onto the channel, carry on. With rounded
 * corners the two micro-bends sit on top of each other and read as a glitch.
 *
 * A step this close to the border can only be that connector — a genuine
 * obstacle dodge bends much further out — so moving the terminal onto the
 * channel row cannot introduce an overlap. The rest of the route is untouched.
 */
const TERMINAL_JOG_MAX = 16;

/**
 * How far from the node the step may sit and still count as the connector.
 *
 * Size alone does not identify a port-to-channel step: a small step a long way
 * down the route is a routing decision, and collapsing it drags the port along
 * for no reason. On the sample corpus every genuine connector turns 20–25 from
 * the border, while the ones worth leaving alone turn at 48, 112 and 173 — one
 * of which slid a port 15px into an occupied row and produced a crossing that
 * was not there before.
 */
const TERMINAL_RUN_MAX = 30;

/**
 * Tolerance for deciding whether a segment counts as axis-aligned, and whether
 * a step is a step at all.
 *
 * Deliberately much smaller than the shared `EPS` of 1, which exists for "is
 * this point on a border" and is far too coarse here: ELK routinely leaves a
 * sub-pixel step between the port row and the channel row, and at `EPS` those
 * are not even recognised as segments. They still paint as two rounded corners
 * stacked on each other, which is the artefact this pass removes — an
 * `infra -> auth` edge stepped 0.858 and rendered exactly that way.
 */
const JOG_EPS = 0.01;

/** Axis of an axis-aligned segment: `h`, `v`, or undefined when diagonal. */
function axisOf(a: P, b: P): 'h' | 'v' | undefined {
  const dx = Math.abs(b.x - a.x);
  const dy = Math.abs(b.y - a.y);
  if (dx > JOG_EPS && dy <= JOG_EPS) {
    return 'h';
  }
  if (dy > JOG_EPS && dx <= JOG_EPS) {
    return 'v';
  }
  return undefined;
}

/**
 * Straighten the port-to-channel staircase at either end of a clipped route,
 * leaving both ports where they are.
 *
 * Returns the original array when nothing applies, so callers can compare by
 * identity.
 */
export function straightenTerminalJogs(points: P[]): P[] {
  let pts = straightenFront(points) ?? points;
  const reversed = [...pts].reverse();
  const fixedEnd = straightenFront(reversed);
  if (fixedEnd) {
    pts = fixedEnd.reverse();
  }
  return pts;
}

/**
 * Straighten the staircase at the front of `pts`, or return null when it does
 * not apply.
 *
 * The step is removed by pulling the CHANNEL onto the port's row, never by
 * pulling the port onto the channel's. Moving the port slides the attachment
 * along the node border, and a node whose other edges are still at their spread
 * positions then looks lopsided — the reason this was rewritten. Moving the
 * channel instead keeps every port exactly where ELK placed it, at the cost of
 * displacing one run, which is why the caller checks the result for crossings.
 *
 * The run is only moved when the point after it is not the far terminal, since
 * that would move the other end's port and reintroduce the same problem there.
 */
function straightenFront(pts: P[]): P[] | null {
  if (pts.length < 5) {
    return null;
  }
  const [p0, p1, p2, p3] = pts;
  const axis = axisOf(p0, p1);
  if (!axis || axisOf(p2, p3) !== axis || axisOf(p1, p2) !== (axis === 'h' ? 'v' : 'h')) {
    return null;
  }
  // The step has to be next to the node to be the port-to-channel connector.
  if (Math.hypot(p1.x - p0.x, p1.y - p0.y) > TERMINAL_RUN_MAX) {
    return null;
  }
  const jog = axis === 'h' ? Math.abs(p2.y - p1.y) : Math.abs(p2.x - p1.x);
  if (jog < JOG_EPS || jog > TERMINAL_JOG_MAX) {
    return null;
  }
  // The route has to keep travelling the same way after the step, otherwise
  // this is a real turn rather than a connector.
  const forward =
    axis === 'h'
      ? Math.sign(p1.x - p0.x) === Math.sign(p3.x - p2.x)
      : Math.sign(p1.y - p0.y) === Math.sign(p3.y - p2.y);
  if (!forward) {
    return null;
  }
  // The WHOLE run has to move, not just its first segment: the channel carries
  // on past p3 until the route turns, and shifting only part of it leaves a
  // diagonal where the moved and unmoved halves meet.
  let last = 3;
  while (last + 1 < pts.length && axisOf(pts[last], pts[last + 1]) === axis) {
    last++;
  }
  // The far terminal must not be inside the run — moving it would drag the
  // other end's port, which is the thing this avoids.
  if (last === pts.length - 1) {
    return null;
  }

  // No border check is needed: the port is untouched, so it stays exactly where
  // ELK put it, and the run moves onto that same row — which the first segment
  // already occupied on its way out of the node.
  const moved = [...pts];
  for (let i = 2; i <= last; i++) {
    moved[i] = axis === 'h' ? { x: pts[i].x, y: p0.y } : { x: p0.x, y: pts[i].y };
  }
  // p1 and p2 are now collinear with p0 and the rest of the run.
  moved.splice(1, 2);
  return moved;
}

/** Do two axis-aligned segments cross at a point interior to both? */
function segmentsCrossStrict(a1: P, a2: P, b1: P, b2: P): boolean {
  const side = (o: P, p: P, q: P) => (p.x - o.x) * (q.y - o.y) - (p.y - o.y) * (q.x - o.x);
  const d1 = side(b1, b2, a1);
  const d2 = side(b1, b2, a2);
  const d3 = side(a1, a2, b1);
  const d4 = side(a1, a2, b2);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

/** How many times one polyline crosses another. */
function crossingCount(a: P[], b: P[]): number {
  let n = 0;
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < b.length - 1; j++) {
      if (segmentsCrossStrict(a[i], a[i + 1], b[j], b[j + 1])) {
        n++;
      }
    }
  }
  return n;
}

/**
 * Straighten the port-to-channel step on every edge that has one, but only
 * where doing so does not buy a crossing.
 *
 * Runs once over the finished layout rather than per edge, because the decision
 * needs the other edges: the step is removed by displacing one of this edge's
 * runs onto the port's row, and that run can land in a lane something else
 * already occupies. Trading a barely-visible step for a new crossing is a bad
 * deal, so an edge that would cause one is left exactly as ELK routed it.
 */
function straightenEdgeTerminals(edges: Edge[]): void {
  const routes = edges.map((edge) => (edge as { points?: P[] }).points ?? []);

  for (const [index, edge] of edges.entries()) {
    const original = routes[index];
    if (original.length < 5) {
      continue;
    }
    const candidate = straightenTerminalJogs(original);
    if (candidate === original) {
      continue;
    }

    let before = 0;
    let after = 0;
    for (const [other, route] of routes.entries()) {
      if (other === index || route.length < 2) {
        continue;
      }
      before += crossingCount(original, route);
      after += crossingCount(candidate, route);
    }
    if (after > before) {
      continue;
    }

    (edge as { points?: P[] }).points = candidate;
    routes[index] = candidate;
  }
}

function applyElkEdgeLayout(
  data4Layout: LayoutData,
  graph: ElkLayoutResult,
  layoutState: ElkLayoutState,
  log: ElkLayoutContext['log']
): void {
  const edgeById = new Map(data4Layout.edges.map((edge) => [edge.id, edge]));
  // Opt-out rather than opt-in: the step this removes is never intentional.
  const straightenEdges = data4Layout.config.elk?.straightenEdges !== false;

  // Alignment pre-pass: move degenerately-anchored small nodes onto their routed
  // lines BEFORE any edge points are built, so every edge — whichever side of the
  // node it attaches to, in whatever order the loop visits it — sees the node at
  // its final position. See `alignDegenerateNodeToAnchor` for why the node moves
  // and the edge does not.
  const layoutNodeById = new Map(data4Layout.nodes.map((node) => [node.id, node]));
  const alignedNodes = new Set<string>();
  graph.edges?.forEach((edge) => {
    if (!edge.sections?.length) {
      return;
    }
    const startNode = layoutState.nodeDb[edge.sources?.[0] ?? edge.start];
    const endNode = layoutState.nodeDb[edge.targets?.[0] ?? edge.end];
    if (!startNode || !endNode) {
      return;
    }
    const sourceId = edge.start ?? edge.sourceId ?? edge.sources?.[0];
    const targetId = edge.end ?? edge.targetId ?? edge.targets?.[0];
    const offset = calcOffset(sourceId, targetId, layoutState.parentLookupDb, layoutState.nodeDb);
    const section = edge.sections[0];
    if (startNode.shape !== 'rect33') {
      alignDegenerateNodeToAnchor(
        startNode,
        { x: section.startPoint.x + offset.x, y: section.startPoint.y + offset.y },
        layoutNodeById,
        alignedNodes
      );
    }
    if (endNode.shape !== 'rect33') {
      alignDegenerateNodeToAnchor(
        endNode,
        { x: section.endPoint.x + offset.x, y: section.endPoint.y + offset.y },
        layoutNodeById,
        alignedNodes
      );
    }
  });

  graph.edges?.forEach((edge) => {
    const layoutEdge = edgeById.get(edge.id);
    if (!layoutEdge) {
      return;
    }

    const startId = edge.sources?.[0] ?? edge.start;
    const endId = edge.targets?.[0] ?? edge.end;
    const startNode = layoutState.nodeDb[startId];
    const endNode = layoutState.nodeDb[endId];
    if (!startNode || !endNode) {
      return;
    }

    // `elk.box` and `elk.rectpacking` place nodes but never route edges, so ELK
    // returns no sections. Guarded on length, not presence: an empty array would
    // otherwise skip the fallback and hand `undefined` to
    // `createEdgePointsFromSection`, which dereferences `section.startPoint`.
    // `points` is not optional downstream — the paint step
    // filters it — so fall back to a straight line between the two node centres
    // rather than leaving the edge unlaid. The centres are then clipped back to
    // the node borders: this renderer paints with `skipIntersect`, so nothing
    // downstream would do it, and an unclipped line runs under both nodes with
    // its end marker buried inside the target.
    if (!edge.sections?.length) {
      const centre = (node: NodeWithVertex) => ({
        x: (node.offset?.posX ?? node.x ?? 0) + (node.width ?? 0) / 2,
        y: (node.offset?.posY ?? node.y ?? 0) + (node.height ?? 0) / 2,
      });
      const from = centre(startNode);
      const to = centre(endNode);
      startNode.x = from.x;
      startNode.y = from.y;
      endNode.x = to.x;
      endNode.y = to.y;
      const straightPoints = sanitizeElkEdgePoints([from, to], startNode, endNode, log);
      layoutEdge.points = straightPoints;
      layoutEdge.curve = 'linear';
      // No routing means no label position either: ELK only fills in
      // `edge.labels[*].x/y` for edges it laid out. `positionEdgeLabel` reads
      // `edge.x` / `edge.y` straight into a `translate(...)`, so leaving them
      // unset emits `translate(undefined, NaN)` — dropped by the browser, which
      // parks the label at the group origin. Put it on the line's midpoint.
      const lineStart = straightPoints[0];
      const lineEnd = straightPoints[straightPoints.length - 1];
      layoutEdge.x = (lineStart.x + lineEnd.x) / 2;
      layoutEdge.y = (lineStart.y + lineEnd.y) / 2;
      log.debug('APA18 no edge sections, using a straight line', edge.id, layoutEdge.points);
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

    const clipped = sanitizeElkEdgePoints(points, startNode, endNode, log);
    layoutEdge.points = ensureEndMarkerSegmentLength(
      clipped,
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

  if (straightenEdges) {
    straightenEdgeTerminals(data4Layout.edges);
  }
}

/**
 * ELK reserves `PORTS_SURROUNDING_MARGIN` at both ends of a node side before
 * distributing edge anchors along it (see `PORTS_SURROUNDING`). On a side
 * shorter than twice that margin the usable span is negative and ELK's clamping
 * parks the anchor off-centre — a 14px start/end state circle gets its edge
 * attached ~3px off the dot's centre, and no node-level option overrides it
 * (the spacing is only read per hierarchy level).
 *
 * The anchor's position along the side is garbage, but its LINE is not: with
 * `nodeFlexibility: PORT_POSITION` ELK has already placed the node so this
 * clamped port sits on a straight route — so it is the node that stands
 * off-centre, not the edge. An earlier fix repointed the edge at the node's
 * centre, which bent ELK's straight verticals visibly diagonal (every fixture
 * with `[*] --> SomeState` showed it). Move the NODE instead: shift it along
 * the side's axis until its centre sits on the anchor line. The edge stays
 * exactly as routed, and the appended centre point is collinear with it.
 *
 * The shift is at most half the side (≲4px on a state dot), first anchor wins
 * (later anchors on a degenerate side land on the same clamped point), and both
 * the nodeDb entry and the layout node move so painting and clipping agree.
 */
function alignDegenerateNodeToAnchor(
  node: NodeWithVertex,
  anchor: P,
  layoutNodeById: Map<string, Node>,
  alignedNodes: Set<string>
): void {
  const width = node.width ?? 0;
  const height = node.height ?? 0;
  const top = node.offset!.posY;
  const bottom = top + height;
  // ELK puts the anchor exactly on the border; the slack only absorbs float
  // error from the offset arithmetic. Same tolerance `onBorder` uses.
  const tol = 0.5;
  // An anchor on the top or bottom border spreads along the width; one on the
  // left or right border spreads along the height.
  const alongWidth = Math.abs(anchor.y - top) <= tol || Math.abs(anchor.y - bottom) <= tol;
  if ((alongWidth ? width : height) >= 2 * PORTS_SURROUNDING_MARGIN) {
    return;
  }
  if (alignedNodes.has(node.id)) {
    return;
  }
  alignedNodes.add(node.id);

  const delta = alongWidth
    ? anchor.x - (node.offset!.posX + width / 2)
    : anchor.y - (node.offset!.posY + height / 2);
  if (Math.abs(delta) < 0.01) {
    return;
  }
  if (alongWidth) {
    node.offset!.posX += delta;
    node.x = node.offset!.posX + width / 2;
  } else {
    node.offset!.posY += delta;
    node.y = node.offset!.posY + height / 2;
  }
  const layoutNode = layoutNodeById.get(node.id);
  if (layoutNode) {
    layoutNode.x = node.offset!.posX + width / 2;
    layoutNode.y = node.offset!.posY + height / 2;
  }
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

  // `elkOrigin` when present: `evenGroupFrames` may have moved the frame, but a
  // section's coordinates are relative to where ELK put the container, not to
  // where the frame is now drawn.
  const node = nodeDb[ancestor];
  const ancestorOffset = node?.elkOrigin ?? node?.offset;
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

/**
 * Attachment point for the terminal at `portIndex`, on the axis the edge
 * departs along.
 *
 * `step` is +1 at the start of the polyline and -1 at the end, i.e. the
 * direction that walks AWAY from the node, which is what gives the departure
 * direction. Groups are excluded: their frame already is their outline, and the
 * caller has its own on-border handling for them.
 */
function attachAlongDepartureAxis(
  node: NodeWithVertex,
  bounds: RectLike,
  points: P[],
  portIndex: number,
  step: 1 | -1
): P | null {
  if (node?.isGroup) {
    return null;
  }
  const port = points[portIndex];
  const next = points[portIndex + step];
  if (!port || !next) {
    return null;
  }
  return outlineAttachPoint(node, bounds, port, next);
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
    const startIntersection =
      // Prefer an attachment on the edge's own departure axis; see
      // `outlineAttachPoint`. Falls back to the centre-ray intersection, which
      // is all a non-axis-aligned or shapeless endpoint can offer.
      attachAlongDepartureAxis(startNode, startBounds, points, firstOutsideStartIndex, 1) ??
      computeNodeIntersection(startNode, startBounds, outsidePointForStart, startCenter);
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
    const endIntersection =
      attachAlongDepartureAxis(endNode, endBounds, points, outsideIndexForEnd, -1) ??
      computeNodeIntersection(endNode, endBounds, outsidePointForEnd, endCenter);
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
