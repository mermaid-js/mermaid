/**
 * Attached grid-like layout: a grid-like core with its trees hung back onto it.
 *
 *     decompose (HOLA's undirected leaf peeling) → draw the core with grid-like →
 *     draw every peeled tree on its own with HOLA's symmetric tree layout →
 *     place the trees around the core with HOLA's face search → route the
 *     connectors → pack the components
 *
 * This is `grid-decomposed` with the last step reversed. There the parts were
 * packed beside each other as separate islands, which is what made the
 * decomposition visible but left the diagram in pieces. Here the trees go back
 * where they belong, and *which* place that is comes from HOLA (guide §17):
 * largest tree first, into the angular wedge of a face at its root, cardinal
 * before ordinal, external face before internal.
 *
 * Neither half is reimplemented:
 *
 *   - the core is laid out by grid-like. Nothing here solves, aligns or snaps
 *     anything: every position a core node ends up at is one grid-like put it at,
 *     with all of its alignments intact;
 *   - the trees are HOLA's: its decomposition, its symmetric tree layout, its
 *     candidate wedges, its selection order, its rank connectors.
 *
 * Three things about the core are this layout's own, and none of them re-solves it.
 *
 * **Which drawing to keep.** grid-like's beautification is greedy and never undone,
 * so on a small core the drawing it produces flips on sub-pixel changes to the
 * derived grid spacing — a four-cycle came out four different ways, only one of them
 * the obvious rectangle. So grid-like is asked several times, over the knobs the
 * paper leaves open, and the drawing with the fewest flaws is kept
 * (`coreCandidates.ts`). `grid-decomposed` keeps drawing its cores as it did.
 *
 * **How its edges are drawn.** grid-like joins two node centres with a straight
 * line, which is diagonal for any pair its alignment pass did not align — and a
 * diagonal is free to run through a third node's box. The routes are replaced with
 * orthogonal ones from HOLA's own router; the positions are not (`coreDrawing.ts`).
 *
 * **Enlargement.** HOLA makes room for a tree by expanding the face around it, which
 * moves core nodes and would destroy the alignments that make a grid-like drawing
 * grid-like. So instead every core node is moved away from the core's centre by a
 * common factor: every core edge gets longer, and nothing else about the drawing
 * changes. The ladder below walks that factor up only as far as it has to — until
 * every tree fits without being pushed away from its root, or until enlarging stops
 * helping.
 *
 * DOM-free by contract: it reads sizes measured earlier and writes `node.x/y` and
 * `edge.points`, so the same entry point drives the browser renderer and the
 * DOM-decoupled tests.
 */

import { log } from '../../../logger.js';
import type { Point } from '../../../types.js';
import type { Edge, LayoutData, Node } from '../../types.js';
import type { GridLikeLayoutResult } from '../grid-like/layoutCore.js';
import { flattenFlowchart } from '../hola-faithful/adapter/flattenFlowchart.js';
import type { EdgeLabelInfo, FlattenResult } from '../hola-faithful/adapter/flattenFlowchart.js';
import {
  packComponentsLeftToRight,
  weaklyConnectedComponents,
} from '../hola-faithful/components/components.js';
import { decompose } from '../hola-faithful/decomposition/peelCoreAndTrees.js';
import type { DecomposedTree } from '../hola-faithful/decomposition/peelCoreAndTrees.js';
import { DiagnosticCollector } from '../hola-faithful/diagnostics.js';
import type { HolaDiagnostic } from '../hola-faithful/diagnostics.js';
import type {
  Bounds,
  Cardinal,
  Direction,
  HolaGraph,
  HolaNode,
  Rect,
} from '../hola-faithful/model.js';
import { nodeBounds, pointBounds, unionBounds } from '../hola-faithful/model.js';
import { layoutForGrowth, ROTATION_FOR_GROWTH } from '../hola-faithful/placement/placeTrees.js';
import { layoutTree, transformTreeLayout } from '../hola-faithful/trees/symmetricTreeLayout.js';
import type { TreeLayout } from '../hola-faithful/trees/symmetricTreeLayout.js';
import { attachTrees, rankGapFor } from './attachTrees.js';
import type { AttachableTree, Attachment, AttachResult } from './attachTrees.js';
import {
  applyCoreScale,
  coreRects,
  coreSegments,
  drawCore,
  routeCoreEdges,
  routedCoreEdges,
} from './coreDrawing.js';
import type { CoreDrawing, CoreSegment } from './coreDrawing.js';
import { planariseRoutedCore } from './corePlanarisation.js';
import type { GridAttachedOptions } from './options.js';
import { resolveGridAttachedOptions } from './options.js';
import { prepareGridAttachedLayout } from './prepareLayout.js';
import { mergeTreesByRoot } from './treeGrouping.js';
import { placeLabels } from './labelPlacement.js';
import type { LabelObstacles, RouteSegment } from './labelPlacement.js';
import { segmentsCross } from './geometry.js';
import { combLevelsNeeded, routeComponentTrees, routeTreeSelfLoop } from './treeConnectors.js';
import type { TreeConnector, TreeRouteRequest } from './treeConnectors.js';

/** One tree, as attached. */
export interface GridAttachedTreeResult {
  treeId: string;
  /** Core node the tree hangs from. */
  coreNodeId: string;
  growth: Cardinal;
  placementDirection: Direction;
  isExternalFace: boolean;
  flip: boolean;
  /** Dead stub on the root connector; zero when the tree sits at its natural distance. */
  slide: number;
  /** Root connectors that run into something they should have cleared. */
  violations: number;
  /** The placement kept a flaw rather than leave the tree undrawn (guide §25). */
  relaxed: boolean;
  nodeIds: string[];
  footprint: Bounds;
}

export interface GridAttachedComponentResult {
  id: string;
  /** `pure-tree` is a component with no cycle, so peeling left no core. */
  kind: 'core-with-trees' | 'pure-tree';
  /** Nodes drawn as the core. Empty for a pure tree. */
  coreNodeIds: string[];
  /** Enlargement the core needed. 1 means grid-like's drawing was used as-is. */
  coreScale: number;
  /** What grid-like reported for the core. Absent for a pure tree. */
  grid?: GridLikeLayoutResult;
  trees: GridAttachedTreeResult[];
  bounds: Bounds;
}

export interface GridAttachedResult {
  components: GridAttachedComponentResult[];
  componentCount: number;
  /**
   * Edges that reached no route. Normally empty: every edge is either inside the
   * core, inside a tree, or the peeling cut between the two.
   */
  droppedEdgeIds: string[];
  bounds?: Bounds;
  diagnostics: HolaDiagnostic[];
  options: GridAttachedOptions;
}

export function runGridAttachedLayoutCore(
  data: LayoutData,
  overrides?: Partial<GridAttachedOptions>
): GridAttachedResult {
  // The browser path has already done this before measuring; repeating it keeps
  // the DOM-free entry point on exactly the same graph.
  const prepared = prepareGridAttachedLayout(data);

  const options = resolveGridAttachedOptions(data, overrides);
  const diagnostics = new DiagnosticCollector();
  const flat = flattenFlowchart(data, diagnostics);

  if (flat.graph.nodes.size === 0) {
    return {
      components: [],
      componentCount: 0,
      droppedEdgeIds: [],
      diagnostics: [...prepared.diagnostics, ...diagnostics.all()],
      options,
    };
  }

  const flowGrowth = growthForDirection((data as { direction?: string }).direction);
  const laidOut = weaklyConnectedComponents(flat.graph).map((component) =>
    layoutComponent(data, flat, component.id, component.graph, flowGrowth, options, diagnostics)
  );

  const bounds = packComponentsLeftToRight(
    laidOut.map((component) => ({
      bounds: component.bounds,
      translate: (dx: number, dy: number) => translateComponent(component, dx, dy),
    })),
    options.componentGap
  );

  // Packing leaves the drawing against the origin; the margin every layout keeps
  // between content and origin is re-applied once, to the whole thing.
  for (const component of laidOut) {
    translateComponent(component, options.margin, options.margin);
  }

  const droppedEdgeIds = pruneToDrawn(data, laidOut);

  log.debug(
    `GRID-ATTACHED: ${laidOut.length} component(s), ` +
      `${laidOut.reduce((total, c) => total + c.result.trees.length, 0)} tree(s) attached, ` +
      `core scales ${laidOut.map((c) => c.result.coreScale.toFixed(2)).join(', ')}`
  );

  return {
    components: laidOut.map((component) => component.result),
    componentCount: laidOut.length,
    droppedEdgeIds,
    bounds: bounds && shiftBounds(bounds, options.margin, options.margin),
    diagnostics: [...prepared.diagnostics, ...diagnostics.all()],
    options,
  };
}

// ---------------------------------------------------------------------------
// One connected component
// ---------------------------------------------------------------------------

/** A component after layout, with everything a rigid translation has to move. */
interface LaidOutComponent {
  result: GridAttachedComponentResult;
  bounds: Bounds;
  nodes: Node[];
  edges: Edge[];
  labels: { originalEdgeId: string; x: number; y: number }[];
}

function layoutComponent(
  data: LayoutData,
  flat: FlattenResult,
  componentId: string,
  graph: Parameters<typeof decompose>[0],
  flowGrowth: Cardinal,
  options: GridAttachedOptions,
  diagnostics: DiagnosticCollector
): LaidOutComponent {
  const decomposition = decompose(graph);

  if (decomposition.pureTree) {
    return layoutPureTreeComponent(flat, componentId, decomposition.pureTree, flowGrowth, options);
  }

  const drawing = drawCore(data, flat, componentId, decomposition.core, options);
  // Everything hanging off one core node is one tree. HOLA's decomposition returns
  // one per forest component, so a node with five pendant leaves would otherwise get
  // five independent placements all competing for the same wedges.
  const peeled = mergeTreesByRoot(decomposition.trees);
  const sources = new Map(peeled.map((tree) => [tree.id, tree]));
  const placeable = peeled.map((tree) =>
    drawTree(tree.id, tree.graph, tree.rootCopyId, tree.coreNodeId, flat.labels, options)
  );

  const chosen = climbEnlargementLadder(
    drawing,
    decomposition.core,
    flat,
    placeable,
    sources,
    flowGrowth,
    options,
    diagnostics
  );

  reportPlacementDiagnostics(diagnostics, componentId, chosen.attempt, sources);

  const nodes = [...drawing.nodes];
  const rects = coreRects(drawing, decomposition.core);
  const trees: GridAttachedTreeResult[] = [];
  const labelRequests: { originalEdgeId: string; width: number; height: number; route: Point[] }[] =
    [];

  const core = writeCoreEdges(flat, drawing);
  const edges = [...core.edges];
  labelRequests.push(...core.labelRequests);

  const drawnById = new Map(placeable.map((tree) => [tree.id, tree]));
  const routeRequests: TreeRouteRequest[] = [];

  for (const attachment of chosen.attempt.attachments) {
    const tree = sources.get(attachment.treeId);
    const root = rects.get(attachment.coreNodeId);
    if (!tree || !root) {
      continue;
    }
    routeRequests.push({
      tree,
      transformed: attachment.transformed,
      rootRect: {
        x: root.x,
        y: root.y,
        width: root.width,
        height: root.height,
        silhouette: root.silhouette,
      },
      growth: attachment.growth,
      rankGap: rankGapFor(drawnById.get(attachment.treeId), attachment.growth, options),
    });
    const written = writeTree(flat, tree, attachment, options);
    nodes.push(...written.nodes);
    edges.push(...written.edges);
    trees.push({
      treeId: attachment.treeId,
      coreNodeId: attachment.coreNodeId,
      growth: attachment.growth,
      placementDirection: attachment.placementDirection,
      isExternalFace: attachment.isExternalFace,
      flip: attachment.flip,
      slide: attachment.slide,
      violations: attachment.violations,
      relaxed: attachment.relaxed,
      nodeIds: written.nodes.map((node) => node.id),
      footprint: attachment.footprint,
    });
  }

  // Connectors are routed once, for the whole component: two of the three ways two
  // of them end up drawn as one line are collisions *between* trees.
  const connected = writeConnectors(flat, routeRequests, options, drawing.ports);
  edges.push(...connected.edges);
  labelRequests.push(...connected.labelRequests);

  // Labels last, and for the whole component at once: a label has to keep off every
  // node and every route in the drawing, not just the ones on its own side of it.
  const labels = writeLabels(flat, labelRequests, nodes, edges, options);

  const bounds = boundsOfDrawing(nodes, edges);

  return {
    result: {
      id: componentId,
      kind: 'core-with-trees',
      coreNodeIds: drawing.nodes.map((node) => node.id),
      coreScale: chosen.scale,
      grid: drawing.grid,
      trees,
      bounds,
    },
    bounds,
    nodes,
    edges,
    labels,
  };
}

/**
 * A component with no cycle has no core to attach anything to, so HOLA draws the
 * whole component as one tree (guide §10.1) — its symmetric tree layout, rooted at
 * the tree centre, grown in the diagram's declared direction.
 */
function layoutPureTreeComponent(
  flat: FlattenResult,
  componentId: string,
  pureTree: { graph: Parameters<typeof decompose>[0]; rootId: string },
  flowGrowth: Cardinal,
  options: GridAttachedOptions
): LaidOutComponent {
  const drawn = drawTree(
    `${componentId}/pure-tree`,
    pureTree.graph,
    pureTree.rootId,
    pureTree.rootId,
    flat.labels,
    options
  );
  const transformed = transformTreeLayout(
    layoutForGrowth(drawn, flowGrowth),
    ROTATION_FOR_GROWTH[flowGrowth],
    false,
    { x: 0, y: 0 }
  );

  // A pure tree has no copied root: the root *is* a real node, so it is written
  // like every other node and stands in for itself when its connectors are routed.
  const pseudoTree: DecomposedTree = {
    id: `${componentId}/pure-tree`,
    graph: pureTree.graph,
    rootCopyId: pureTree.rootId,
    coreNodeId: pureTree.rootId,
  };
  const rootNode = transformed.nodes.get(pureTree.rootId);
  const rootRect: Rect = rootNode
    ? { x: rootNode.x, y: rootNode.y, width: rootNode.width, height: rootNode.height }
    : { x: 0, y: 0, width: 0, height: 0 };

  const attachment: Attachment = {
    treeId: pseudoTree.id,
    coreNodeId: pureTree.rootId,
    placementDirection: flowGrowth,
    growth: flowGrowth,
    flip: false,
    faceIndex: -1,
    isExternalFace: true,
    anchor: { x: 0, y: 0 },
    slide: 0,
    violations: 0,
    transformed,
    footprint: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    relaxed: false,
    cost: 0,
  };

  const written = writeTree(flat, pseudoTree, attachment, options);
  const connected = writeConnectors(
    flat,
    [
      {
        tree: pseudoTree,
        transformed,
        rootRect,
        growth: flowGrowth,
        rankGap: rankGapFor(drawn, flowGrowth, options),
      },
    ],
    options
  );
  const edges = [...written.edges, ...connected.edges];
  const labels = writeLabels(flat, connected.labelRequests, written.nodes, edges, options);

  const bounds = boundsOfDrawing(written.nodes, edges);

  return {
    result: {
      id: componentId,
      kind: 'pure-tree',
      coreNodeIds: [],
      coreScale: 1,
      trees: [
        {
          treeId: pseudoTree.id,
          coreNodeId: pureTree.rootId,
          growth: flowGrowth,
          placementDirection: flowGrowth,
          isExternalFace: true,
          flip: false,
          slide: 0,
          violations: 0,
          relaxed: false,
          nodeIds: written.nodes.map((node) => node.id),
          footprint: bounds,
        },
      ],
      bounds,
    },
    bounds,
    nodes: written.nodes,
    edges,
    labels,
  };
}

/**
 * Draw one tree on its own (HOLA Step 3a), with a rank gap wide enough for the
 * connectors that will have to run through it.
 *
 * `layoutTree` reserves `rankGap` between the boundaries of two successive ranks,
 * and that gap is also the corridor the rank connectors turn in. A chain needs
 * almost none of it; a parent with a fan of eight children needs room for four
 * nested levels of comb, or the levels are squeezed together and the arrows end up
 * on top of each other again. The gap is therefore *derived*, not configured: draw
 * once, count the levels the fans actually need, and redraw with a gap that holds
 * them. The count is stable across the redraw because sibling packing — which is
 * what decides the fan shapes — does not depend on the rank gap at all.
 *
 * Both of HOLA's two drawings are built with the same derived gap, so a tree looks
 * the same whichever axis placement ends up turning it onto.
 */
function drawTree(
  id: string,
  graph: HolaGraph,
  rootId: string,
  coreNodeId: string,
  labels: Map<string, EdgeLabelInfo>,
  options: GridAttachedOptions
): AttachableTree {
  const drawOne = (rankGap: number, growthAxis: 'vertical' | 'horizontal'): TreeLayout =>
    layoutTree(graph, rootId, { rankGap, siblingGap: options.treeSiblingGap, growthAxis });

  // Room a label needs *along* the rank axis, which is its height for a tree grown
  // vertically and its width for one grown horizontally. A label is drawn centred on
  // the connector, so the gap has to hold the label plus clearance at both ends or
  // the label ends up touching the two ranks it sits between.
  let labelHeight = 0;
  let labelWidth = 0;
  for (const edge of graph.edges.values()) {
    for (const originalEdgeId of edge.originalEdgeIds) {
      const label = labels.get(originalEdgeId);
      if (label) {
        labelHeight = Math.max(labelHeight, label.height);
        labelWidth = Math.max(labelWidth, label.width);
      }
    }
  }
  const forLabel = (extent: number): number =>
    extent > 0 ? extent + 2 * options.labelClearance : 0;

  // One draw at the base gap, to count the comb levels the fans need. The count is
  // stable across a redraw because sibling packing — which is what decides the fan
  // shapes — does not depend on the rank gap at all.
  const probeVertical = drawOne(options.treeRankGap, 'vertical');
  const probeHorizontal = drawOne(options.treeRankGap, 'horizontal');
  const combVertical = (combLevelsNeeded(probeVertical, graph, 'S') + 1) * options.treeBendSpacing;
  const combHorizontal =
    (combLevelsNeeded(probeHorizontal, graph, 'E') + 1) * options.treeBendSpacing;

  // The two drawings get their own gaps: they are used for different growth
  // directions, so reserving a tall label's height in the horizontal drawing — where
  // its *width* is what has to fit — would stretch it for nothing.
  const rankGapVertical = Math.max(options.treeRankGap, combVertical, forLabel(labelHeight));
  const rankGapHorizontal = Math.max(options.treeRankGap, combHorizontal, forLabel(labelWidth));

  return {
    id,
    coreNodeId,
    rootCopyId: rootId,
    rankGapVertical,
    rankGapHorizontal,
    layout:
      rankGapVertical === options.treeRankGap
        ? probeVertical
        : drawOne(rankGapVertical, 'vertical'),
    layoutForHorizontalGrowth:
      rankGapHorizontal === options.treeRankGap
        ? probeHorizontal
        : drawOne(rankGapHorizontal, 'horizontal'),
  };
}

// ---------------------------------------------------------------------------
// The enlargement ladder
// ---------------------------------------------------------------------------

interface LadderRung {
  scale: number;
  attempt: AttachResult;
  /** Crossings between the drawn edges at this scale. */
  crossings: number;
  /** Crossings and dead stubs, plus what this much enlargement costs, in pixels. */
  penalty: number;
}

/**
 * Stretch the core's edges only as far as the trees actually pay for.
 *
 * Rung 0 is grid-like's own drawing. Each rung is scored on three keys, in order:
 * trees drawn at all, trees drawn without a flaw, then a genuine trade — the dead
 * stubs the placement had to leave against the size the enlargement costs. Both
 * sides of that trade are pixels, so it is a real comparison rather than a tuned
 * threshold: a tree 30px off its root is not worth widening the whole core for, a
 * tree pushed a screen away is.
 *
 * The climb stops as soon as a rung needs nothing (every tree placed, none
 * relaxed, no stub at all), when the cap is reached, or when stretching has failed
 * to improve anything `coreScalePatience` times — a core that is already big
 * enough does not get better by growing.
 */
function climbEnlargementLadder(
  drawing: CoreDrawing,
  core: Parameters<typeof coreRects>[1],
  flat: FlattenResult,
  trees: AttachableTree[],
  sources: Map<string, DecomposedTree>,
  flowGrowth: Cardinal,
  options: GridAttachedOptions,
  diagnostics: DiagnosticCollector
): LadderRung {
  // What one unit of enlargement costs: the core's own extent, so a 25% stretch
  // of a wide core is priced as more than a 25% stretch of a small one.
  const baseBounds = boundsOfDrawing(drawing.nodes, []);
  const coreSpan = baseBounds.maxX - baseBounds.minX + (baseBounds.maxY - baseBounds.minY);

  const byId = new Map(trees.map((tree) => [tree.id, tree]));
  let best: LadderRung = {
    scale: 1,
    attempt: EMPTY_ATTEMPT,
    crossings: Number.POSITIVE_INFINITY,
    penalty: Number.POSITIVE_INFINITY,
  };
  let sinceImprovement = 0;

  for (let rung = 0; ; rung++) {
    const scale = Math.min(1 + rung * options.coreScaleStep, options.maxCoreScale);
    applyCoreScale(drawing, scale);
    // A route is only as good as the positions it was found for, so each rung is
    // routed afresh. Everything downstream — the faces, the obstacles a tree has
    // to clear, the corridor its connector runs through — then sees the geometry
    // that is actually drawn rather than a straight line between two centres.
    routeCoreEdges(drawing, core, flat, options, diagnostics);

    const rects = coreRects(drawing, core);
    const attempt = attachTrees({
      coreRects: rects,
      coreSegments: coreSegments(drawing, core),
      planar: planariseRoutedCore(rects, routedCoreEdges(drawing, core)),
      reservedPorts: drawing.ports,
      trees,
      sources,
      flowGrowth,
      options,
    });
    // Count the crossings in the geometry that would actually be *drawn*, which means
    // routing this rung's connectors. Placement scores each tree against the ones
    // already committed, but the final routing settles ports and turns across every
    // tree at once, so a crossing can exist only in the finished drawing — and that is
    // the one a reader sees.
    const crossings = countDrawnCrossings(
      coreSegments(drawing, core),
      routeComponentTrees(
        connectorRequests(attempt, rects, sources, byId, options),
        options,
        drawing.ports
      )
    );
    const penalty =
      attempt.stubPenalty +
      crossings * options.crossingPenalty +
      options.enlargementPenaltyWeight * (scale - 1) * coreSpan;
    const rungResult: LadderRung = { scale, attempt, crossings, penalty };

    log.debug(
      `GRID-ATTACHED: rung scale=${scale.toFixed(2)} unplaced=${attempt.unplaced.length} ` +
        `relaxed=${attempt.relaxedCount} crossings=${crossings} ` +
        `stub=${attempt.stubPenalty.toFixed(0)} penalty=${penalty.toFixed(0)}`
    );

    if (rung === 0 || isBetterRung(rungResult, best)) {
      best = rungResult;
      sinceImprovement = 0;
    } else {
      sinceImprovement++;
    }

    const settled =
      attempt.unplaced.length === 0 &&
      attempt.relaxedCount === 0 &&
      attempt.stubPenalty <= 0 &&
      crossings === 0;
    if (settled || scale >= options.maxCoreScale || sinceImprovement >= options.coreScalePatience) {
      break;
    }
  }

  // Leave the core at the geometry the winning rung was measured against, so the
  // attachments and the core agree.
  applyCoreScale(drawing, best.scale);
  routeCoreEdges(drawing, core, flat, options, diagnostics);
  return best;
}

/**
 * The requests that would route this rung's trees, so the ladder can count the
 * crossings in the drawing it would produce.
 */
function connectorRequests(
  attempt: AttachResult,
  rects: Map<string, HolaNode>,
  sources: Map<string, DecomposedTree>,
  byId: Map<string, AttachableTree>,
  options: GridAttachedOptions
): TreeRouteRequest[] {
  const requests: TreeRouteRequest[] = [];
  for (const attachment of attempt.attachments) {
    const tree = sources.get(attachment.treeId);
    const drawn = byId.get(attachment.treeId);
    const root = rects.get(attachment.coreNodeId);
    if (!tree || !drawn || !root) {
      continue;
    }
    requests.push({
      tree,
      transformed: attachment.transformed,
      rootRect: {
        x: root.x,
        y: root.y,
        width: root.width,
        height: root.height,
        silhouette: root.silhouette,
      },
      growth: attachment.growth,
      rankGap: rankGapFor(drawn, attachment.growth, options),
    });
  }
  return requests;
}

/**
 * Crossings between drawn edges, counting only the pairs a bigger core could
 * separate: two tree connectors, or a connector and a core edge. Two core edges
 * crossing is the core's own business — a uniform scale moves every core node by the
 * same factor, so those crossings scale along with it and never go away.
 */
function countDrawnCrossings(coreEdges: CoreSegment[], connectors: TreeConnector[]): number {
  const treeSegments: { id: string; a: Point; b: Point }[] = [];
  for (const connector of connectors) {
    for (let i = 1; i < connector.points.length; i++) {
      treeSegments.push({
        id: connector.originalEdgeId,
        a: connector.points[i - 1],
        b: connector.points[i],
      });
    }
  }

  let crossings = 0;
  for (let i = 0; i < treeSegments.length; i++) {
    for (let j = i + 1; j < treeSegments.length; j++) {
      if (treeSegments[i].id === treeSegments[j].id) {
        continue;
      }
      if (segmentsCross(treeSegments[i], treeSegments[j])) {
        crossings++;
      }
    }
    for (const core of coreEdges) {
      if (segmentsCross(treeSegments[i], { a: core.a, b: core.b })) {
        crossings++;
      }
    }
  }
  return crossings;
}

/** Placeholder incumbent, so rung 0 has something to beat. */
const EMPTY_ATTEMPT: AttachResult = {
  attachments: [],
  unplaced: [],
  relaxedCount: Number.POSITIVE_INFINITY,
  maxSlide: 0,
  stubPenalty: Number.POSITIVE_INFINITY,
};

/** Lexicographic: trees drawn at all, then drawn without a flaw, then the trade. */
function isBetterRung(candidate: LadderRung, incumbent: LadderRung): boolean {
  if (candidate.attempt.unplaced.length !== incumbent.attempt.unplaced.length) {
    return candidate.attempt.unplaced.length < incumbent.attempt.unplaced.length;
  }
  if (candidate.attempt.relaxedCount !== incumbent.attempt.relaxedCount) {
    return candidate.attempt.relaxedCount < incumbent.attempt.relaxedCount;
  }
  return candidate.penalty < incumbent.penalty - 1e-6;
}

function reportPlacementDiagnostics(
  diagnostics: DiagnosticCollector,
  componentId: string,
  attempt: AttachResult,
  sources: Map<string, DecomposedTree>
): void {
  for (const treeId of attempt.unplaced) {
    diagnostics.report({
      code: 'HOLA_TREE_PLACEMENT_FAILED',
      stage: 'tree-placement',
      componentId,
      nodeIds: [sources.get(treeId)?.coreNodeId ?? treeId],
      message:
        `No placement could be evaluated for tree ${treeId}, so it is not drawn. ` +
        'The core was already enlarged as far as it may be.',
    });
  }
  for (const attachment of attempt.attachments) {
    if (attachment.relaxed) {
      diagnostics.report({
        code: 'HOLA_TREE_SLID_FROM_ROOT',
        stage: 'tree-placement',
        componentId,
        nodeIds: [attachment.coreNodeId],
        message:
          `Tree ${attachment.treeId} was attached with a flaw kept rather than left ` +
          `undrawn: it sits ${attachment.slide.toFixed(1)}px beyond its natural ` +
          'attachment, or its connector passes something it should clear.',
        detail: { slide: attachment.slide, growth: attachment.growth },
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Write-back
// ---------------------------------------------------------------------------

interface WrittenTree {
  nodes: Node[];
  /** Self-loops only; a tree's connectors are written for the whole component. */
  edges: Edge[];
}

/**
 * The geometry that belongs to one tree alone: where its nodes sit, and its
 * self-loops.
 *
 * Its connectors are deliberately *not* written here. Two trees can hang off the
 * same core node, and their connectors then compete for room on the same side of
 * it, so the ports and the turns have to be settled across the whole component at
 * once — see `writeConnectors`.
 */
function writeTree(
  flat: FlattenResult,
  tree: DecomposedTree,
  attachment: Attachment,
  options: GridAttachedOptions
): WrittenTree {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const rootIsReal = tree.rootCopyId === tree.coreNodeId;
  for (const node of attachment.transformed.nodes.values()) {
    if (!rootIsReal && node.id === tree.rootCopyId) {
      continue;
    }
    const mermaidNode = flat.originalNodes.get(node.id);
    if (!mermaidNode) {
      continue;
    }
    mermaidNode.x = node.x;
    mermaidNode.y = node.y;
    nodes.push(mermaidNode);
  }

  // Self-loops never took part in the topology, so nothing has routed them yet.
  const loopIndexByNode = new Map<string, number>();
  for (const loop of flat.selfLoops) {
    const node = attachment.transformed.nodes.get(loop.source);
    if (!node || (!rootIsReal && loop.source === tree.rootCopyId)) {
      continue;
    }
    const edge = flat.originalEdges.get(loop.originalEdgeId);
    if (!edge) {
      continue;
    }
    const index = loopIndexByNode.get(loop.source) ?? 0;
    loopIndexByNode.set(loop.source, index + 1);
    edge.points = routeTreeSelfLoop(
      { ...node, silhouette: tree.graph.nodes.get(loop.source)?.silhouette },
      attachment.growth,
      index,
      options.routingClearance
    );
    edge.curve = 'linear';
    edge.hasIntersectionPoints = true;
    // The label goes on the middle of the detour's outer run, which is the one
    // segment of the loop that no connector can be running along.
    edge.x = (edge.points[1].x + edge.points[2].x) / 2;
    edge.y = (edge.points[1].y + edge.points[2].y) / 2;
    edges.push(edge);
  }

  return { nodes, edges };
}

/**
 * The core's routed edges, written back.
 *
 * Both endpoints of an orthogonal route already sit on a node boundary, so the
 * route is marked as carrying its own intersection points and the painter leaves
 * it alone; re-clipping would bend the terminal segment the arrowhead is drawn
 * along. An edge the router gave up on keeps the straight endpoint pair it fell
 * back to, which is still a drawable line — `routeCoreEdges` has already reported
 * it.
 */
function writeCoreEdges(flat: FlattenResult, drawing: CoreDrawing): WrittenConnectors {
  const edges: Edge[] = [];
  const labelRequests: WrittenConnectors['labelRequests'] = [];

  for (const edge of drawing.edges) {
    const route = drawing.routes.get(edge.id);
    if (!route || route.length < 2) {
      continue;
    }
    edge.points = route;
    edge.curve = 'linear';
    edge.hasIntersectionPoints = true;
    edges.push(edge);

    const label = flat.labels.get(edge.id);
    if (label) {
      labelRequests.push({
        originalEdgeId: edge.id,
        width: label.width,
        height: label.height,
        route,
      });
    }
  }

  return { edges, labelRequests };
}

interface WrittenConnectors {
  edges: Edge[];
  labelRequests: { originalEdgeId: string; width: number; height: number; route: Point[] }[];
}

/** Every tree connector in one component, routed together and written back. */
function writeConnectors(
  flat: FlattenResult,
  requests: TreeRouteRequest[],
  options: GridAttachedOptions,
  /** Where the core's own edges attach; a tree connector must not land on one. */
  reserved?: Map<string, number[]>
): WrittenConnectors {
  const edges: Edge[] = [];
  const labelRequests: WrittenConnectors['labelRequests'] = [];

  for (const connector of routeComponentTrees(requests, options, reserved)) {
    const edge = flat.originalEdges.get(connector.originalEdgeId);
    if (!edge) {
      continue;
    }
    edge.points = orientRoute(connector.points, edge, connector.parentId, connector.childId);
    // Every route is a deliberate orthogonal polyline whose vertices are its bends;
    // Mermaid's default `basis` curve would smooth them into a spline.
    edge.curve = 'linear';
    // Both endpoints already sit on a node boundary, so re-clipping at paint time
    // would bend the terminal segment that carries the arrowhead.
    edge.hasIntersectionPoints = true;
    edges.push(edge);

    const label = flat.labels.get(connector.originalEdgeId);
    if (label) {
      labelRequests.push({
        originalEdgeId: connector.originalEdgeId,
        width: label.width,
        height: label.height,
        route: edge.points,
      });
    }
  }

  return { edges, labelRequests };
}

/**
 * A route runs from the parent node to the child node. An original Mermaid edge
 * declared the other way round must still be handed back running from its own
 * start to its own end: the first point is the tail and the last is where the
 * arrowhead goes.
 */
function orientRoute(points: Point[], edge: Edge, parentId: string, childId: string): Point[] {
  return edge.start === childId && edge.end === parentId ? [...points].reverse() : points;
}

/**
 * Place every label of one component and write it onto its edge.
 *
 * The obstacle set is the whole component — every node box, every route — because a
 * label belonging to a tree connector can just as easily land on a core edge as on
 * one of its own.
 */
function writeLabels(
  flat: FlattenResult,
  requests: { originalEdgeId: string; width: number; height: number; route: Point[] }[],
  nodes: Node[],
  edges: Edge[],
  options: GridAttachedOptions
): { originalEdgeId: string; x: number; y: number }[] {
  if (requests.length === 0) {
    return [];
  }

  const segments: RouteSegment[] = [];
  for (const edge of edges) {
    const points = edge.points ?? [];
    for (let i = 1; i < points.length; i++) {
      segments.push({ edgeId: edge.id, a: points[i - 1], b: points[i] });
    }
  }
  const obstacles: LabelObstacles = {
    nodes: nodes.map((node) =>
      nodeBounds({
        x: node.x ?? 0,
        y: node.y ?? 0,
        width: node.width ?? 0,
        height: node.height ?? 0,
      })
    ),
    segments,
  };

  const labels = placeLabels(requests, obstacles, options);
  for (const label of labels) {
    const edge = flat.originalEdges.get(label.originalEdgeId);
    if (edge) {
      edge.x = label.x;
      edge.y = label.y;
    }
  }
  return labels;
}

// ---------------------------------------------------------------------------
// Packing and write-back
// ---------------------------------------------------------------------------

/** Rigid translation. Nothing is re-laid-out or re-routed across components. */
function translateComponent(component: LaidOutComponent, dx: number, dy: number): void {
  for (const node of component.nodes) {
    node.x = (node.x ?? 0) + dx;
    node.y = (node.y ?? 0) + dy;
  }
  for (const edge of component.edges) {
    edge.points = (edge.points ?? []).map((point) => ({ x: point.x + dx, y: point.y + dy }));
    if (edge.x !== undefined) {
      edge.x += dx;
    }
    if (edge.y !== undefined) {
      edge.y += dy;
    }
  }
  for (const label of component.labels) {
    label.x += dx;
    label.y += dy;
  }

  component.bounds = shiftBounds(component.bounds, dx, dy);
  component.result.bounds = component.bounds;
  for (const tree of component.result.trees) {
    tree.footprint = shiftBounds(tree.footprint, dx, dy);
  }
}

function boundsOfDrawing(nodes: Node[], edges: Edge[]): Bounds {
  const parts: Bounds[] = nodes.map((node) =>
    nodeBounds({
      x: node.x ?? 0,
      y: node.y ?? 0,
      width: node.width ?? 0,
      height: node.height ?? 0,
    })
  );
  for (const edge of edges) {
    const bounds = pointBounds(edge.points ?? []);
    if (bounds) {
      parts.push(bounds);
    }
  }
  return unionBounds(parts) ?? { minX: 0, minY: 0, maxX: 0, maxY: 0 };
}

function shiftBounds(bounds: Bounds, dx: number, dy: number): Bounds {
  return {
    minX: bounds.minX + dx,
    maxX: bounds.maxX + dx,
    minY: bounds.minY + dy,
    maxY: bounds.maxY + dy,
  };
}

/**
 * Safety net: keep only what was actually drawn.
 *
 * Every node belongs to exactly one component and every edge is either inside the
 * core, inside a tree, or the peeling cut between them, so this normally removes
 * nothing. It still runs, because an edge with no route would be painted as a line
 * from nowhere — and because an edge that lands here is a decomposition bug worth
 * reporting rather than hiding.
 */
function pruneToDrawn(data: LayoutData, components: LaidOutComponent[]): string[] {
  const drawnNodeIds = new Set(components.flatMap((c) => c.nodes.map((node) => node.id)));
  const drawnEdgeIds = new Set(components.flatMap((c) => c.edges.map((edge) => edge.id)));

  const droppedEdgeIds: string[] = [];
  data.edges = (data.edges ?? []).filter((edge) => {
    if (drawnEdgeIds.has(edge.id)) {
      return true;
    }
    droppedEdgeIds.push(edge.id);
    return false;
  });

  data.nodes = (data.nodes ?? []).filter((node) => drawnNodeIds.has(node.id));
  for (const node of data.nodes) {
    node.parentId = undefined;
  }

  if (droppedEdgeIds.length > 0) {
    log.debug(`GRID-ATTACHED: ${droppedEdgeIds.length} edge(s) reached no route and are not drawn`);
  }

  return droppedEdgeIds;
}

/** The direction a tree grows in when it follows the diagram's declared flow. */
export function growthForDirection(direction: string | undefined): Cardinal {
  switch (direction) {
    case 'BT':
      return 'N';
    case 'LR':
      return 'E';
    case 'RL':
      return 'W';
    default:
      return 'S';
  }
}
