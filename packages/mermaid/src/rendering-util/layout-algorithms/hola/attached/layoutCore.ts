/**
 * Attached grid-like layout: a grid-like core with its trees hung back onto it.
 *
 *     decompose (HOLA's undirected leaf peeling) → draw the core with grid-like →
 *     draw every peeled tree on its own with HOLA's symmetric tree layout →
 *     place the trees around the core with HOLA's face search → route the
 *     connectors → pack the components
 *
 * This is the `parts/` stage with its last step reversed. There the parts were
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
 * (`coreCandidates.ts`). The `parts/` stage keeps drawing its cores as it did.
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

import { log } from '../../../../logger.js';
import type { Point } from '../../../../types.js';
import type { Edge, LayoutData, Node } from '../../../types.js';
import type { GridLikeLayoutResult } from '../grid/layoutCore.js';
import { flattenFlowchart } from '../core/adapter/flattenFlowchart.js';
import type { EdgeLabelInfo, FlattenResult } from '../core/adapter/flattenFlowchart.js';
import {
  packComponentsLeftToRight,
  weaklyConnectedComponents,
} from '../core/components/components.js';
import { decompose } from '../core/decomposition/peelCoreAndTrees.js';
import type { DecomposedTree } from '../core/decomposition/peelCoreAndTrees.js';
import { DiagnosticCollector } from '../core/diagnostics.js';
import type { HolaDiagnostic } from '../core/diagnostics.js';
import type { Bounds, Cardinal, Direction, HolaGraph, HolaNode, Rect } from '../core/model.js';
import { nodeBounds, pointBounds, rectsOverlap, unionBounds } from '../core/model.js';
import { layoutForGrowth, ROTATION_FOR_GROWTH } from '../core/placement/placeTrees.js';
import { layoutTree, transformTreeLayout } from '../core/trees/symmetricTreeLayout.js';
import type { TreeLayout } from '../core/trees/symmetricTreeLayout.js';
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
import {
  collectSubgraphs,
  fitSubgraphFrames,
  frameIsClean,
  nodesToKeepInCore,
  orderComponentsBySubgraph,
  placeEmptyFrames,
  subgraphMembership,
} from './subgraphs.js';
import type { FittedFrame, SubgraphModel } from './subgraphs.js';
import type { LabelObstacles, RouteSegment } from './labelPlacement.js';
import {
  redirectContainerEdges,
  rerouteEdgesAroundForeignFrames,
  restoreContainerEdges,
} from './containerEdges.js';
import { polylineHitsBounds, segmentsCross } from './geometry.js';
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

  // Before the topology: an edge naming a container is moved onto one of its members
  // so the graph keeps it. Put back, and cut at the frame, once everything is drawn.
  const containerEdges = redirectContainerEdges(data);
  for (const edge of containerEdges.unresolvable) {
    diagnostics.report({
      code: 'GRID_ATTACHED_SUBGRAPH_EDGE_UNRESOLVED',
      stage: 'prepare',
      edgeIds: [edge.id],
      message:
        `Edge "${edge.id}" runs between a subgraph and something it already contains, or names ` +
        'an empty one, so there are not two places for it to run between.',
    });
  }

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

  // Packed in container order, not discovery order. An edge naming a container is
  // not in the topology, so a container's members can fall into several components,
  // and a frame can only close on them if the packer keeps those components
  // together — this is where most of the scattering came from, not from how a tree
  // is placed around a core.
  const packOrder = orderComponentsBySubgraph(
    laidOut,
    (component) => component.nodes.map((node) => node.id),
    subgraphMembership(data)
  );
  const bounds = packComponentsLeftToRight(
    packOrder.map((component) => ({
      bounds: component.bounds,
      translate: (dx: number, dy: number) => translateComponent(component, dx, dy),
    })),
    options.componentGap
  );

  // Frames are fitted here, after packing, because a container's members can end up
  // in different components and a frame is only meaningful once every member is at
  // its final offset. It is still before the margin shift, so the frames travel with
  // the content instead of needing a second correction.
  const subgraphs = collectSubgraphs(data);
  const drawnNodes = laidOut.flatMap((component) => component.nodes);
  const frames = fitSubgraphFrames(subgraphs, drawnNodes, options);
  const framed = keepCleanFrames(data, subgraphs, frames, diagnostics);

  // A frame reaches outside its members by its padding and its title, so the shift
  // that puts the drawing at `margin` has to be measured from the frames too.
  const framedBoxes = frames.filter((frame) => framed.has(frame.id)).map((frame) => frame.bounds);
  const overhangX = Math.min(0, ...framedBoxes.map((box) => box.minX));
  const overhangY = Math.min(0, ...framedBoxes.map((box) => box.minY));

  // Packing leaves the drawing against the origin; the margin every layout keeps
  // between content and origin is re-applied once, to the whole thing.
  const shiftX = options.margin - overhangX;
  const shiftY = options.margin - overhangY;
  for (const component of laidOut) {
    translateComponent(component, shiftX, shiftY);
  }
  for (const frame of frames) {
    const group = subgraphs.byId.get(frame.id);
    if (group) {
      group.node.x = (group.node.x ?? 0) + shiftX;
      group.node.y = (group.node.y ?? 0) + shiftY;
    }
  }

  // Read off the container nodes, not off `frames`: a fitted frame's bounds predate
  // the shift that put the drawing at its margin, and a box in the wrong coordinate
  // space contains nothing, so every trim would quietly do nothing.
  const frameBoxes = new Map<string, Bounds>();
  for (const frame of frames) {
    const node = framed.has(frame.id) ? subgraphs.byId.get(frame.id)?.node : undefined;
    if (node?.x !== undefined && node.y !== undefined) {
      const width = node.width ?? 0;
      const height = node.height ?? 0;
      frameBoxes.set(frame.id, {
        minX: node.x - width / 2,
        minY: node.y - height / 2,
        maxX: node.x + width / 2,
        maxY: node.y + height / 2,
      });
    }
  }
  restoreContainerEdges(containerEdges.redirected, frameBoxes);
  rerouteEdgesAroundForeignFrames(data.edges, frameBoxes, data.nodes, options);
  // Container routes are cut only now, after their endpoints and frames have their
  // final coordinates. A label placed before that cut can be left on the tiny run
  // that meets a frame, which is exactly where the frame title is painted.
  repositionLabelsAwayFromFrameTitles(flat, data.edges, drawnNodes, frameBoxes, subgraphs, options);

  const droppedEdgeIds = pruneToDrawn(data, laidOut, framed);

  // A frame invented for an empty container is positioned last, once the rest of the
  // drawing has stopped moving and there is something for it to sit beside.
  const drawnFrames = frames.filter((frame) => framed.has(frame.id));
  const shifted =
    bounds && unionWithFrames(shiftBounds(bounds, shiftX, shiftY), frames, framed, shiftX, shiftY);
  const finalBounds =
    shifted && drawnFrames.some((frame) => frame.needsPlacing)
      ? placeEmptyFrames(subgraphs, drawnFrames, shifted, options)
      : shifted;

  log.debug(
    `GRID-ATTACHED: ${laidOut.length} component(s), ` +
      `${laidOut.reduce((total, c) => total + c.result.trees.length, 0)} tree(s) attached, ` +
      `core scales ${laidOut.map((c) => c.result.coreScale.toFixed(2)).join(', ')}`
  );

  return {
    components: laidOut.map((component) => component.result),
    componentCount: laidOut.length,
    droppedEdgeIds,
    bounds: finalBounds,
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
  // Peeling is told about the containers before it runs. A container that keeps any
  // member in the core keeps all of them, so no container is ever split between the
  // core and a tree — a split nothing downstream could repair, because the two
  // halves are laid out by different algorithms and placed by different rules.
  const membership = subgraphMembership(data);
  // Both halves of one feature, so one switch. Keeping a container's members in the
  // core is only worth anything if the core then holds them together — on its own it
  // grows the core and scatters them inside it, which is worse than the split it was
  // meant to avoid.
  const keepInCore = options.modelCoreGroups
    ? nodesToKeepInCore(
        graph,
        membership,
        (keep) => coreNodeIdsOf(decompose(graph, { keepInCore: keep })),
        options.maxExtraCoreNodesForContainment
      )
    : new Set<string>();
  const decomposition = decompose(graph, { keepInCore });

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

  const core = writeCoreEdges(flat, drawing, options);
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
      placementDirection: attachment.placementDirection,
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

  // A parallel pair can be split by decomposition: most originals remain core
  // edges while one is restored as a tree connector. Reconcile their already
  // orthogonal routes only after both families have been written, so the visual
  // bundle keeps distinct lanes for its full length.
  separateRenderedParallelMiddleLanes(edges, nodes, options);
  untangleCrossingSharedSourceRoutes(edges, nodes, options.routingClearance);

  compactLoneSubgraphEntryBridges(
    data,
    nodes,
    edges,
    labelRequests,
    new Set(drawing.nodes.map((node) => node.id)),
    options
  );

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
 * A modeled subgraph can be a compact core region while its one incoming bridge is
 * needlessly long: grid-like has no reason to pull the upstream component toward a
 * group when every alignment inside each side is already satisfied. Moving the
 * group would stretch its outgoing edges, so instead translate the upstream core
 * region as a rigid body. Its internal drawing remains byte-for-byte the same and
 * only the cut edge is re-routed.
 *
 * This deliberately has a narrow proof obligation. It runs only for one edge that
 * crosses from a non-group core region into a group, only when removing group-owned
 * nodes leaves one closed upstream region, and only as far as every stationary node
 * still has normal tree clearance. Anything more connected remains grid-like's
 * responsibility rather than becoming an unsafe post-layout translation.
 */
function compactLoneSubgraphEntryBridges(
  data: LayoutData,
  nodes: Node[],
  edges: Edge[],
  labelRequests: { originalEdgeId: string; width: number; height: number; route: Point[] }[],
  coreNodeIds: ReadonlySet<string>,
  options: GridAttachedOptions
): void {
  if (!options.modelCoreGroups) {
    return;
  }

  const subgraphs = collectSubgraphs(data);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  for (const bridge of edges) {
    const sourceId = bridge.start;
    const targetId = bridge.end;
    if (!sourceId || !targetId || !coreNodeIds.has(sourceId) || !coreNodeIds.has(targetId)) {
      continue;
    }
    const groupId = subgraphs.parentOfLeaf.get(targetId);
    if (!groupId) {
      continue;
    }
    const group = subgraphs.byId.get(groupId);
    if (!group) {
      continue;
    }
    const members = new Set(group.leafIds);
    if (members.has(sourceId)) {
      continue;
    }

    const upstream = coreRegionOutsideGroup(sourceId, members, edges, coreNodeIds);
    if (upstream.size === 0 || [...upstream].some((id) => !nodeById.has(id))) {
      continue;
    }
    const boundary = edges.filter(
      (edge) =>
        edge.start !== undefined &&
        edge.end !== undefined &&
        upstream.has(edge.start) !== upstream.has(edge.end)
    );
    if (boundary.length !== 1 || boundary[0] !== bridge) {
      continue;
    }

    const points = bridge.points ?? [];
    const start = points[0];
    const end = points.at(-1);
    if (!start || !end) {
      continue;
    }
    const vertical = Math.abs(end.y - start.y) >= Math.abs(end.x - start.x);
    const distance = vertical ? end.y - start.y : end.x - start.x;
    const direction = Math.sign(distance);
    const label = labelRequests.find((request) => request.originalEdgeId === bridge.id);
    const minimumSpan = Math.max(
      options.treeClearance,
      (vertical ? (label?.height ?? 0) : (label?.width ?? 0)) + 2 * options.labelClearance
    );
    if (direction === 0 || Math.abs(distance) <= minimumSpan + 1e-6) {
      continue;
    }

    const maximum = maximumSafeRegionShift(
      upstream,
      nodes,
      vertical,
      direction,
      options.treeClearance
    );
    const shift = Math.min(Math.abs(distance) - minimumSpan, maximum);
    if (shift <= 1e-6) {
      continue;
    }
    const delta = vertical ? { x: 0, y: direction * shift } : { x: direction * shift, y: 0 };
    translateNodeRegion(upstream, nodes, edges, labelRequests, delta);

    const shiftedStart = { x: start.x + delta.x, y: start.y + delta.y };
    bridge.points = compactBridgeRoute(
      shiftedStart,
      end,
      routePortIsVertical(points, true) ?? vertical,
      routePortIsVertical(points, false) ?? vertical
    );
    if (label) {
      label.route = bridge.points;
    }
  }
}

/** Core nodes connected to a bridge source without passing through the target group. */
function coreRegionOutsideGroup(
  sourceId: string,
  groupMembers: ReadonlySet<string>,
  edges: readonly Edge[],
  coreNodeIds: ReadonlySet<string>
): Set<string> {
  const neighbours = new Map<string, Set<string>>();
  for (const edge of edges) {
    const { start, end } = edge;
    if (
      !start ||
      !end ||
      !coreNodeIds.has(start) ||
      !coreNodeIds.has(end) ||
      groupMembers.has(start) ||
      groupMembers.has(end)
    ) {
      continue;
    }
    let from = neighbours.get(start);
    if (!from) {
      from = new Set();
      neighbours.set(start, from);
    }
    from.add(end);
    let to = neighbours.get(end);
    if (!to) {
      to = new Set();
      neighbours.set(end, to);
    }
    to.add(start);
  }

  const seen = new Set<string>();
  const todo = [sourceId];
  while (todo.length > 0) {
    const id = todo.pop()!;
    if (seen.has(id) || groupMembers.has(id)) {
      continue;
    }
    seen.add(id);
    for (const neighbour of neighbours.get(id) ?? []) {
      if (!seen.has(neighbour)) {
        todo.push(neighbour);
      }
    }
  }
  return seen;
}

/** How far a region can move before a stationary node enters its clearance box. */
function maximumSafeRegionShift(
  moving: ReadonlySet<string>,
  nodes: readonly Node[],
  vertical: boolean,
  direction: number,
  clearance: number
): number {
  let maximum = Number.POSITIVE_INFINITY;
  for (const node of nodes) {
    if (!moving.has(node.id) || node.isGroup === true) {
      continue;
    }
    const movingBox = nodeBounds({
      x: node.x ?? 0,
      y: node.y ?? 0,
      width: node.width ?? 0,
      height: node.height ?? 0,
    });
    for (const other of nodes) {
      if (moving.has(other.id) || other.isGroup === true) {
        continue;
      }
      const otherBox = nodeBounds({
        x: other.x ?? 0,
        y: other.y ?? 0,
        width: other.width ?? 0,
        height: other.height ?? 0,
      });
      const crossOverlaps = vertical
        ? movingBox.minX < otherBox.maxX + clearance && movingBox.maxX > otherBox.minX - clearance
        : movingBox.minY < otherBox.maxY + clearance && movingBox.maxY > otherBox.minY - clearance;
      if (!crossOverlaps) {
        continue;
      }
      const available = vertical
        ? direction > 0
          ? otherBox.minY - clearance - movingBox.maxY
          : movingBox.minY - clearance - otherBox.maxY
        : direction > 0
          ? otherBox.minX - clearance - movingBox.maxX
          : movingBox.minX - clearance - otherBox.maxX;
      if (available >= 0) {
        maximum = Math.min(maximum, available);
      }
    }
  }
  return maximum;
}

/** Translate every internal route with its rigid node region. */
function translateNodeRegion(
  nodeIds: ReadonlySet<string>,
  nodes: Node[],
  edges: Edge[],
  labelRequests: { originalEdgeId: string; width: number; height: number; route: Point[] }[],
  delta: Point
): void {
  const labelsByEdgeId = new Map(labelRequests.map((request) => [request.originalEdgeId, request]));
  for (const node of nodes) {
    if (nodeIds.has(node.id)) {
      node.x = (node.x ?? 0) + delta.x;
      node.y = (node.y ?? 0) + delta.y;
    }
  }
  for (const edge of edges) {
    if (edge.start && edge.end && nodeIds.has(edge.start) && nodeIds.has(edge.end)) {
      const points = (edge.points ?? []).map((point) => ({
        x: point.x + delta.x,
        y: point.y + delta.y,
      }));
      edge.points = points;
      const label = labelsByEdgeId.get(edge.id);
      if (label) {
        label.route = points;
      }
    }
  }
}

/**
 * Whether the first or last non-degenerate route segment leaves perpendicular to
 * a horizontal node face. `true` means vertical, `false` horizontal.
 */
function routePortIsVertical(points: readonly Point[], fromStart: boolean): boolean | undefined {
  let previous = fromStart ? points[0] : points.at(-1);
  if (!previous) {
    return undefined;
  }
  const index = fromStart ? 1 : points.length - 2;
  const step = fromStart ? 1 : -1;
  for (let nextIndex = index; nextIndex >= 0 && nextIndex < points.length; nextIndex += step) {
    const next = points[nextIndex];
    const dx = Math.abs(next.x - previous.x);
    const dy = Math.abs(next.y - previous.y);
    if (dx < 1e-6 && dy > 1e-6) {
      return true;
    }
    if (dy < 1e-6 && dx > 1e-6) {
      return false;
    }
    previous = next;
  }
  return undefined;
}

/**
 * Shortest labelled Manhattan route that preserves both already-clipped port
 * normals. A bridge arriving at a left/right face must finish horizontally;
 * otherwise its last run traces the node's border instead of entering the node.
 */
function compactBridgeRoute(
  start: Point,
  end: Point,
  sourcePortIsVertical: boolean,
  targetPortIsVertical: boolean
): Point[] {
  if (sourcePortIsVertical !== targetPortIsVertical) {
    return sourcePortIsVertical
      ? [start, { x: start.x, y: end.y }, end]
      : [start, { x: end.x, y: start.y }, end];
  }
  if (sourcePortIsVertical && Math.abs(start.x - end.x) < 1e-6) {
    return [start, end];
  }
  if (!sourcePortIsVertical && Math.abs(start.y - end.y) < 1e-6) {
    return [start, end];
  }
  const middle = sourcePortIsVertical ? (start.y + end.y) / 2 : (start.x + end.x) / 2;
  return sourcePortIsVertical
    ? [start, { x: start.x, y: middle }, { x: end.x, y: middle }, end]
    : [start, { x: middle, y: start.y }, { x: middle, y: end.y }, end];
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
  /** Connectors that run through a non-incident node at this scale. */
  nodeViolations: number;
  /** Labels whose clearance box meets a core node, or whose painted boxes overlap. */
  labelViolations: number;
  /** Crossings and dead stubs, plus what this much enlargement costs, in pixels. */
  penalty: number;
}

/**
 * Stretch the core's edges only as far as its attached trees and labels actually
 * pay for.
 *
 * Rung 0 is grid-like's own drawing. Each rung is scored on four keys, in order:
 * trees drawn at all, routes clear of nodes, labels with a real runway, then a
 * genuine trade — the dead stubs the placement had to leave against the size the
 * enlargement costs. Both sides of that trade are pixels, so it is a real
 * comparison rather than a tuned threshold: a tree 30px off its root is not worth
 * widening the whole core for, while a label hiding either endpoint is never a
 * legible drawing.
 *
 * The climb stops as soon as a rung needs nothing (every tree placed, no
 * collisions, no label crowding and no stub), when the cap is reached, or when
 * stretching has failed to improve anything `coreScalePatience` times after all
 * labels are already clear.
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
    nodeViolations: Number.POSITIVE_INFINITY,
    labelViolations: Number.POSITIVE_INFINITY,
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
    const connectors = routeComponentTrees(
      connectorRequests(attempt, rects, sources, byId, options),
      options,
      drawing.ports,
      flat.labels
    );
    const crossings = countDrawnCrossings(coreSegments(drawing, core), connectors);
    const nodeViolations = countDrawnConnectorNodeViolations(rects, attempt, connectors);
    const labelViolations = countCoreLabelClearanceViolations(drawing, core, flat, options);
    const penalty =
      attempt.stubPenalty +
      crossings * options.crossingPenalty +
      nodeViolations * options.crossingPenalty +
      labelViolations * options.crossingPenalty +
      options.enlargementPenaltyWeight * (scale - 1) * coreSpan;
    const rungResult: LadderRung = {
      scale,
      attempt,
      crossings,
      nodeViolations,
      labelViolations,
      penalty,
    };

    log.debug(
      `GRID-ATTACHED: rung scale=${scale.toFixed(2)} unplaced=${attempt.unplaced.length} ` +
        `relaxed=${attempt.relaxedCount} crossings=${crossings} nodeViolations=${nodeViolations} ` +
        `labelViolations=${labelViolations} ` +
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
      attempt.stubPenalty <= 0 &&
      crossings === 0 &&
      nodeViolations === 0 &&
      labelViolations === 0;
    if (
      settled ||
      scale >= options.maxCoreScale ||
      (labelViolations === 0 && sinceImprovement >= options.coreScalePatience)
    ) {
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
      placementDirection: attachment.placementDirection,
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

/**
 * Final connector routing can choose root sides and fan ports that were not known
 * when individual trees were placed. Check that actual geometry against every node
 * it does not touch, so the enlargement ladder makes room instead of accepting an
 * edge hidden behind a tree node.
 */
function countDrawnConnectorNodeViolations(
  core: Map<string, HolaNode>,
  attempt: AttachResult,
  connectors: TreeConnector[]
): number {
  const nodes = new Map<string, Bounds>();
  for (const node of core.values()) {
    nodes.set(node.id, nodeBounds(node));
  }
  for (const attachment of attempt.attachments) {
    for (const node of attachment.transformed.nodes.values()) {
      // The tree root is a copy of its core node, already included above.
      if (node.id !== attachment.transformed.rootId) {
        nodes.set(node.id, nodeBounds(node));
      }
    }
  }

  let violations = 0;
  for (const connector of connectors) {
    for (const [nodeId, bounds] of nodes) {
      if (nodeId === connector.parentId || nodeId === connector.childId) {
        continue;
      }
      if (polylineHitsBounds(connector.points, bounds)) {
        violations++;
      }
    }
  }
  return violations;
}

/**
 * A core label needs an actual runway, not merely a point on its route. The
 * placement pass later in the pipeline is the source of truth for where it will
 * sit, so evaluate that same policy at every enlargement rung. Labels retain the
 * normal clearance around node boxes and must not overlap other painted labels.
 * This also makes a pair of labels on parallel short core edges spend space on a
 * longer corridor instead of painting over one another.
 */
function countCoreLabelClearanceViolations(
  drawing: CoreDrawing,
  core: Parameters<typeof coreRects>[1],
  flat: FlattenResult,
  options: GridAttachedOptions
): number {
  const requests = [...flat.labels.values()].flatMap((label) => {
    const route = drawing.routes.get(label.originalEdgeId);
    return route && route.length >= 2
      ? [
          {
            originalEdgeId: label.originalEdgeId,
            width: label.width,
            height: label.height,
            route,
          },
        ]
      : [];
  });
  if (requests.length === 0) {
    return 0;
  }

  const rects = coreRects(drawing, core);
  const nodes = [...rects.values()].map(nodeBounds);
  const segments: RouteSegment[] = [];
  for (const [edgeId, points] of drawing.routes) {
    for (let index = 1; index < points.length; index++) {
      segments.push({ edgeId, a: points[index - 1], b: points[index] });
    }
  }

  const placed = placeLabels(requests, { nodes, segments }, options);
  const placedBoxes: Bounds[] = [];
  let violations = 0;
  for (const label of placed) {
    const request = requests.find((item) => item.originalEdgeId === label.originalEdgeId);
    if (!request) {
      continue;
    }
    const box: Bounds = {
      minX: label.x - request.width / 2,
      maxX: label.x + request.width / 2,
      minY: label.y - request.height / 2,
      maxY: label.y + request.height / 2,
    };
    const clearanceBox: Bounds = {
      minX: label.x - request.width / 2 - options.labelClearance,
      maxX: label.x + request.width / 2 + options.labelClearance,
      minY: label.y - request.height / 2 - options.labelClearance,
      maxY: label.y + request.height / 2 + options.labelClearance,
    };
    if (nodes.some((node) => rectsOverlap(clearanceBox, node))) {
      violations++;
    }
    placedBoxes.push(box);
  }

  for (let i = 0; i < placedBoxes.length; i++) {
    for (let j = i + 1; j < placedBoxes.length; j++) {
      if (rectsOverlap(placedBoxes[i], placedBoxes[j])) {
        violations++;
      }
    }
  }
  return violations;
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
  if (candidate.nodeViolations !== incumbent.nodeViolations) {
    return candidate.nodeViolations < incumbent.nodeViolations;
  }
  if (candidate.labelViolations !== incumbent.labelViolations) {
    return candidate.labelViolations < incumbent.labelViolations;
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
function writeCoreEdges(
  flat: FlattenResult,
  drawing: CoreDrawing,
  options: GridAttachedOptions
): WrittenConnectors {
  const edges: Edge[] = [];
  const labelRequests: WrittenConnectors['labelRequests'] = [];

  for (const edge of drawing.edges) {
    const routed = drawing.routes.get(edge.id);
    if (!routed || routed.length < 2) {
      continue;
    }
    const route = options.roundShortTerminalTurns
      ? centreShortTerminalCoreTurn(routed, options.treeBendSpacing)
      : routed;
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

/**
 * The core router's first comb lane is intentionally close to one endpoint. When
 * that route is rendered in reverse, the lane becomes a short arrowhead stub and
 * rounded painting can soften only its first corner. Re-centre an ordinary
 * four-point route only when either terminal lacks room for the second curve.
 */
function centreShortTerminalCoreTurn(
  points: readonly Point[],
  minimumTerminalRun: number
): Point[] {
  if (points.length !== 4) {
    return [...points];
  }
  const [start, firstTurn, secondTurn, end] = points;
  const upright =
    Math.abs(start.x - firstTurn.x) < 1e-6 &&
    Math.abs(firstTurn.y - secondTurn.y) < 1e-6 &&
    Math.abs(secondTurn.x - end.x) < 1e-6;
  const horizontal =
    Math.abs(start.y - firstTurn.y) < 1e-6 &&
    Math.abs(firstTurn.x - secondTurn.x) < 1e-6 &&
    Math.abs(secondTurn.y - end.y) < 1e-6;
  if (!upright && !horizontal) {
    return [...points];
  }

  const startAlong = upright ? start.y : start.x;
  const endAlong = upright ? end.y : end.x;
  const firstAlong = upright ? firstTurn.y : firstTurn.x;
  const secondAlong = upright ? secondTurn.y : secondTurn.x;
  const span = Math.abs(endAlong - startAlong);
  const hasShortTerminal =
    Math.abs(firstAlong - startAlong) < minimumTerminalRun ||
    Math.abs(endAlong - secondAlong) < minimumTerminalRun;
  if (!hasShortTerminal || span < 2 * minimumTerminalRun) {
    return [...points];
  }

  const middle = (startAlong + endAlong) / 2;
  return upright
    ? [start, { x: firstTurn.x, y: middle }, { x: secondTurn.x, y: middle }, end]
    : [start, { x: middle, y: firstTurn.y }, { x: middle, y: secondTurn.y }, end];
}

/** One rendered four-point route whose middle run can move within its corridor. */
interface RenderedMiddleLane {
  edge: Edge;
  vertical: boolean;
  sourceAxis: number;
  targetAxis: number;
  nearTransverse: number;
  lane: number;
}

/**
 * Fan simple parallel routes after core and tree connectors have been merged.
 *
 * The final router normally sees every parallel edge together. Leaf peeling can
 * move one original into a tree, however, so its route is written in a later pass
 * and would otherwise retain the shared middle track. This conservative cleanup
 * only changes the central leg of a four-point orthogonal route, preserves both
 * ports and two bends, and declines the change if any foreign node would lose its
 * routing clearance.
 */
function separateRenderedParallelMiddleLanes(
  edges: Edge[],
  nodes: Node[],
  options: GridAttachedOptions
): void {
  const groups = new Map<string, Edge[]>();
  for (const edge of edges) {
    if (!edge.start || !edge.end || !edge.points || edge.points.length !== 4) {
      continue;
    }
    const key =
      edge.start < edge.end ? `${edge.start}\u0000${edge.end}` : `${edge.end}\u0000${edge.start}`;
    const group = groups.get(key);
    if (group) {
      group.push(edge);
    } else {
      groups.set(key, [edge]);
    }
  }

  for (const group of groups.values()) {
    if (group.length < 2) {
      continue;
    }
    const lanes = group
      .map(renderedMiddleLaneOf)
      .filter((lane): lane is RenderedMiddleLane => lane !== undefined);
    if (lanes.length !== group.length || new Set(lanes.map((lane) => lane.vertical)).size !== 1) {
      continue;
    }

    const low = Math.max(
      ...lanes.map((lane) => Math.min(lane.sourceAxis, lane.targetAxis) + options.routingClearance)
    );
    const high = Math.min(
      ...lanes.map((lane) => Math.max(lane.sourceAxis, lane.targetAxis) - options.routingClearance)
    );
    if (high - low < 1e-6) {
      continue;
    }

    const centre = lanes.reduce((sum, lane) => sum + lane.lane, 0) / lanes.length;
    const tracks = centredRenderedLanes(
      lanes.length,
      centre,
      low,
      high,
      Math.max(options.treeFanPortSpacing, options.routingClearance)
    );
    const ordered = [...lanes].sort(
      (first, second) => first.nearTransverse - second.nearTransverse
    );
    tracks.reverse();
    const candidates = ordered.map((lane, index) => ({
      edge: lane.edge,
      points: withRenderedMiddleLane(lane, tracks[index]),
    }));
    if (!renderedLanesClearNodes(candidates, group, nodes, options.routingClearance)) {
      continue;
    }

    for (const candidate of candidates) {
      // Keep label requests' references to this same route array valid.
      candidate.edge.points!.splice(0, candidate.edge.points!.length, ...candidate.points);
    }
  }
}

function renderedMiddleLaneOf(edge: Edge): RenderedMiddleLane | undefined {
  const points = edge.points;
  if (!points || points.length !== 4) {
    return undefined;
  }
  const [source, firstBend, secondBend, target] = points;
  if (
    sameLayoutCoordinate(source.y, firstBend.y) &&
    sameLayoutCoordinate(firstBend.x, secondBend.x) &&
    sameLayoutCoordinate(secondBend.y, target.y)
  ) {
    return {
      edge,
      vertical: true,
      sourceAxis: source.x,
      targetAxis: target.x,
      nearTransverse: source.x <= target.x ? source.y : target.y,
      lane: firstBend.x,
    };
  }
  if (
    sameLayoutCoordinate(source.x, firstBend.x) &&
    sameLayoutCoordinate(firstBend.y, secondBend.y) &&
    sameLayoutCoordinate(secondBend.x, target.x)
  ) {
    return {
      edge,
      vertical: false,
      sourceAxis: source.y,
      targetAxis: target.y,
      nearTransverse: source.y <= target.y ? source.x : target.x,
      lane: firstBend.y,
    };
  }
  return undefined;
}

function centredRenderedLanes(
  count: number,
  centre: number,
  low: number,
  high: number,
  gap: number
): number[] {
  const spacing = Math.min(gap, (high - low) / (count - 1));
  const span = spacing * (count - 1);
  const first = Math.max(low, Math.min(high - span, centre - span / 2));
  return Array.from({ length: count }, (_, index) => first + index * spacing);
}

function withRenderedMiddleLane(lane: RenderedMiddleLane, coordinate: number): Point[] {
  const [source, firstBend, secondBend, target] = lane.edge.points!;
  return lane.vertical
    ? [source, { x: coordinate, y: firstBend.y }, { x: coordinate, y: secondBend.y }, target]
    : [source, { x: firstBend.x, y: coordinate }, { x: secondBend.x, y: coordinate }, target];
}

function renderedLanesClearNodes(
  candidates: { edge: Edge; points: Point[] }[],
  group: Edge[],
  nodes: Node[],
  clearance: number
): boolean {
  const endpointIds = new Set([group[0].start, group[0].end]);
  for (const candidate of candidates) {
    for (const node of nodes) {
      if (node.isGroup || endpointIds.has(node.id) || !node.width || !node.height) {
        continue;
      }
      const bounds = nodeBounds({
        x: node.x ?? 0,
        y: node.y ?? 0,
        width: node.width,
        height: node.height,
      });
      if (
        polylineHitsBounds(candidate.points, {
          minX: bounds.minX - clearance,
          minY: bounds.minY - clearance,
          maxX: bounds.maxX + clearance,
          maxY: bounds.maxY + clearance,
        })
      ) {
        return false;
      }
    }
  }
  return true;
}

function sameLayoutCoordinate(first: number, second: number): boolean {
  return Math.abs(first - second) < 1e-6;
}

/**
 * Resolve an avoidable crossing between two downward branches at one source.
 *
 * This only moves a route which already enters its target horizontally. Such a
 * route can take an outer left/right lane while retaining perpendicular runs at
 * both ends. Routes that enter from above or below are deliberately left alone:
 * turning their final segment sideways would recreate the diagonal-looking
 * endpoint problem this layout avoids elsewhere.
 */
function untangleCrossingSharedSourceRoutes(edges: Edge[], nodes: Node[], clearance: number): void {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  for (const _pass of edges) {
    let changed = false;
    for (let first = 0; first < edges.length && !changed; first++) {
      const edge = edges[first];
      if (!edge.start || !edge.end || !edge.points || edge.points.length < 3) {
        continue;
      }
      for (let second = first + 1; second < edges.length && !changed; second++) {
        const other = edges[second];
        if (
          edge.start !== other.start ||
          !other.end ||
          !other.points ||
          !routesCross(edge.points, other.points)
        ) {
          continue;
        }

        const alternatives = [edge, other]
          .flatMap((candidate) => {
            const source = candidate.start ? byId.get(candidate.start) : undefined;
            return source
              ? (['left', 'right'] as const)
                  .map((side) => outerSideRoute(candidate, source, side, clearance))
                  .filter((points): points is Point[] => points !== undefined)
                  .map((points) => ({ edge: candidate, points }))
              : [];
          })
          .filter(({ edge: candidate, points }) =>
            routeHasClearance(points, candidate, nodes, clearance)
          )
          .filter(
            ({ edge: candidate, points }) => countRouteCrossings(points, candidate, edges) === 0
          )
          .sort(
            (firstCandidate, secondCandidate) =>
              routeLength(firstCandidate.points) - routeLength(secondCandidate.points)
          );
        const best = alternatives[0];
        if (!best) {
          continue;
        }
        best.edge.points!.splice(0, best.edge.points!.length, ...best.points);
        changed = true;
      }
    }
    if (!changed) {
      break;
    }
  }
}

function outerSideRoute(
  edge: Edge,
  source: Node,
  side: 'left' | 'right',
  clearance: number
): Point[] | undefined {
  const points = edge.points!;
  const start = points[0];
  const beforeEnd = points.at(-2)!;
  const end = points.at(-1)!;
  // The target must already be entered horizontally; retain that side exactly.
  if (!sameLayoutCoordinate(beforeEnd.y, end.y) || Math.abs(end.y - start.y) < clearance) {
    return undefined;
  }
  const halfWidth = (source.width ?? 0) / 2;
  if (halfWidth <= 0) {
    return undefined;
  }
  const direction = side === 'left' ? -1 : 1;
  const port = { x: (source.x ?? 0) + direction * halfWidth, y: source.y ?? start.y };
  const laneX = port.x + direction * clearance;
  // Repeating the current side is no change in topology; only test the outer
  // alternative that can actually resolve a crossing.
  if (sameLayoutCoordinate(port.x, start.x) && sameLayoutCoordinate(laneX, points[1].x)) {
    return undefined;
  }
  return [port, { x: laneX, y: port.y }, { x: laneX, y: end.y }, end];
}

function routeHasClearance(points: Point[], edge: Edge, nodes: Node[], clearance: number): boolean {
  for (const node of nodes) {
    if (
      node.isGroup ||
      node.id === edge.start ||
      node.id === edge.end ||
      !node.width ||
      !node.height
    ) {
      continue;
    }
    const bounds = nodeBounds({
      x: node.x ?? 0,
      y: node.y ?? 0,
      width: node.width,
      height: node.height,
    });
    if (
      polylineHitsBounds(points, {
        minX: bounds.minX - clearance,
        minY: bounds.minY - clearance,
        maxX: bounds.maxX + clearance,
        maxY: bounds.maxY + clearance,
      })
    ) {
      return false;
    }
  }
  return true;
}

function countRouteCrossings(points: Point[], edge: Edge, edges: Edge[]): number {
  let crossings = 0;
  for (const other of edges) {
    if (other === edge || !other.points) {
      continue;
    }
    for (let index = 1; index < points.length; index++) {
      for (let otherIndex = 1; otherIndex < other.points.length; otherIndex++) {
        if (
          segmentsCross(
            { a: points[index - 1], b: points[index] },
            { a: other.points[otherIndex - 1], b: other.points[otherIndex] }
          )
        ) {
          crossings++;
        }
      }
    }
  }
  return crossings;
}

function routesCross(first: Point[], second: Point[]): boolean {
  for (let firstIndex = 1; firstIndex < first.length; firstIndex++) {
    const firstSegment = { a: first[firstIndex - 1], b: first[firstIndex] };
    for (let secondIndex = 1; secondIndex < second.length; secondIndex++) {
      if (
        segmentsCross(firstSegment, {
          a: second[secondIndex - 1],
          b: second[secondIndex],
        })
      ) {
        return true;
      }
    }
  }
  return false;
}

function routeLength(points: Point[]): number {
  let length = 0;
  for (let index = 1; index < points.length; index++) {
    length +=
      Math.abs(points[index].x - points[index - 1].x) +
      Math.abs(points[index].y - points[index - 1].y);
  }
  return length;
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

  for (const connector of routeComponentTrees(requests, options, reserved, flat.labels)) {
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
  options: GridAttachedOptions,
  extraNodeObstacles: readonly Bounds[] = []
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
    nodes: [
      ...nodes.map((node) =>
        nodeBounds({
          x: node.x ?? 0,
          y: node.y ?? 0,
          width: node.width ?? 0,
          height: node.height ?? 0,
        })
      ),
      ...extraNodeObstacles,
    ],
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

/**
 * Frames are fitted only after all components have been packed, whereas labels
 * are initially placed within their individual components. Re-place them once
 * against the final title bands, so an edge entering a nested frame cannot cover
 * the frame's title without making the frame itself larger or dishonest.
 */
function repositionLabelsAwayFromFrameTitles(
  flat: FlattenResult,
  edges: Edge[],
  nodes: Node[],
  frames: ReadonlyMap<string, Bounds>,
  subgraphs: SubgraphModel,
  options: GridAttachedOptions
): void {
  const titleBands: Bounds[] = [];
  for (const [id, bounds] of frames) {
    const titleHeight = subgraphs.byId.get(id)?.titleHeight ?? 0;
    if (titleHeight <= 0) {
      continue;
    }
    titleBands.push({
      minX: bounds.minX,
      maxX: bounds.maxX,
      minY: bounds.minY,
      // The browser title has a small top inset. Reserving the whole title band
      // plus the normal inner padding keeps the label visibly clear of it.
      maxY: bounds.minY + titleHeight + options.groupPadding,
    });
  }
  if (titleBands.length === 0) {
    return;
  }

  const requests = edges.flatMap((edge) => {
    const label = flat.labels.get(edge.id);
    const route = edge.points ?? [];
    return label && route.length >= 2
      ? [
          {
            originalEdgeId: edge.id,
            width: label.width,
            height: label.height,
            route,
          },
        ]
      : [];
  });
  writeLabels(flat, requests, nodes, edges, options, titleBands);
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
/**
 * Decide which fitted frames are drawn, and flatten the rest.
 *
 * A frame is kept when it holds only what its container owns. One that has
 * swallowed a foreign node is not drawn at all: a box around the wrong nodes reads
 * as a claim about the diagram's structure that is not true, and is worse than the
 * container going unrepresented. The members of a flattened container keep their
 * positions and are re-parented to the nearest ancestor that *is* drawn, so an
 * outer frame still holds them.
 */
function keepCleanFrames(
  data: LayoutData,
  subgraphs: SubgraphModel,
  frames: FittedFrame[],
  diagnostics: DiagnosticCollector
): Set<string> {
  const kept = new Set<string>();
  for (const frame of frames) {
    if (frameIsClean(frame)) {
      kept.add(frame.id);
      continue;
    }
    const group = subgraphs.byId.get(frame.id);
    diagnostics.report({
      code: 'GRID_ATTACHED_SUBGRAPH_NOT_FRAMED',
      stage: 'layout',
      nodeIds: [frame.id, ...frame.foreign],
      message:
        `Subgraph "${frame.id}" holds ${group?.leafIds.length ?? 0} node(s) that ended up far ` +
        `enough apart that a frame around them would also enclose ${frame.foreign.length} ` +
        'node(s) it does not own, so no frame is drawn for it.',
    });
  }

  // Re-parent past every container that is not drawn, so nesting still resolves.
  for (const node of data.nodes ?? []) {
    let parentId = node.parentId;
    const seen = new Set<string>();
    while (parentId !== undefined && !kept.has(parentId) && !seen.has(parentId)) {
      seen.add(parentId);
      parentId = subgraphs.byId.get(parentId)?.parentId;
    }
    node.parentId = parentId;
  }

  return kept;
}

/** The drawing's bounds, with every drawn frame folded in. */
function unionWithFrames(
  bounds: Bounds,
  frames: FittedFrame[],
  framed: ReadonlySet<string>,
  shiftX: number,
  shiftY: number
): Bounds {
  let result = bounds;
  for (const frame of frames) {
    if (!framed.has(frame.id)) {
      continue;
    }
    result = {
      minX: Math.min(result.minX, frame.bounds.minX + shiftX),
      minY: Math.min(result.minY, frame.bounds.minY + shiftY),
      maxX: Math.max(result.maxX, frame.bounds.maxX + shiftX),
      maxY: Math.max(result.maxY, frame.bounds.maxY + shiftY),
    };
  }
  return result;
}

function pruneToDrawn(
  data: LayoutData,
  components: LaidOutComponent[],
  framed: ReadonlySet<string>
): string[] {
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

  // A container is kept when its frame is drawn, even though no component owns it:
  // it is not a node any component laid out, it is a box fitted around several.
  data.nodes = (data.nodes ?? []).filter(
    (node) => drawnNodeIds.has(node.id) || framed.has(node.id)
  );

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

/** The ids left in the core by one decomposition; a pure tree leaves none. */
function coreNodeIdsOf(decomposition: ReturnType<typeof decompose>): string[] {
  return [...decomposition.core.nodes.keys()];
}
