/**
 * The core: its layout from grid-like, its edges routed orthogonally.
 *
 * The core's *layout* is grid-like's. Nothing here solves, aligns or snaps
 * anything: every position a core node ends up at is one grid-like put it at, with
 * all of its alignments intact. What this layout does choose is *which* of
 * grid-like's drawings to keep, because grid-like's beautification is greedy and
 * therefore unstable on a small core — see `coreCandidates.ts`.
 *
 * Two things about the core *are* this layout's own.
 *
 * **Enlargement.** Every core node may be moved away from the core's centre by a
 * common factor. That stretches every core edge and changes nothing else —
 *
 *   - a uniform scale is separable per axis, so two nodes grid-like aligned on
 *     `x` still share an `x`: the grid structure and every alignment survive
 *     exactly;
 *   - node sizes are untouched, so distances only grow and the drawing cannot
 *     develop an overlap it did not have;
 *   - the drawing is therefore the same picture with longer edges, which is
 *     precisely the room a tree needs.
 *
 * Every scale is derived from the *same* base positions, so the ladder in
 * `layoutCore.ts` can walk up and down it without drift.
 *
 * **Routing.** grid-like's write-back draws each edge as a straight line between
 * two node centres. On a grid-like drawing many of those are axis-aligned, but
 * any pair of nodes the alignment pass did not align gets a diagonal — and a
 * diagonal is free to pass straight through a third node's box, which it does.
 * So the routes are replaced (the positions are not) by orthogonal ones from
 * HOLA's own router, which avoids the node rectangles, prefers few bends, and
 * penalises both crossing and running along an edge already routed. This is also
 * what HOLA itself does: an orthogonally routed core is its Step 2c, and the
 * straight centre-to-centre line is an IPSEP-COLA convention rather than a HOLA
 * one.
 */

import type { Point } from '../../../types.js';
import type { Edge, LayoutData, Node } from '../../types.js';
import type { GridLikeLayoutResult } from '../grid-like/layoutCore.js';
import { buildPartLayoutData } from '../grid-decomposed/parts.js';
import type { DecomposedPart } from '../grid-decomposed/parts.js';
import type { FlattenResult } from '../hola-faithful/adapter/flattenFlowchart.js';
import type { DiagnosticCollector } from '../hola-faithful/diagnostics.js';
import type { Bounds, HolaEdge, HolaGraph, HolaNode, Side } from '../hola-faithful/model.js';
import { nodeBounds, unionBounds } from '../hola-faithful/model.js';
import { resolveOptions as resolveHolaOptions } from '../hola-faithful/options.js';
import { routeFinalEdges } from '../hola-faithful/routing/finalRouting.js';
import type { FinalEdge, RoutedFinalEdge } from '../hola-faithful/routing/finalRouting.js';
import { drawBestCore } from './coreCandidates.js';
import type { GridAttachedOptions } from './options.js';

export interface CoreDrawing {
  componentId: string;
  /** The real Mermaid core nodes, in input order. */
  nodes: Node[];
  /** The real Mermaid edges drawn inside the core. */
  edges: Edge[];
  /** What grid-like reported for the core. */
  grid: GridLikeLayoutResult;
  /** Enlargement currently applied. 1 is grid-like's own drawing. */
  scale: number;
  /** Node positions as grid-like left them; every scale is derived from these. */
  base: Map<string, Point>;
  /** Point every enlargement scales about. */
  centre: Point;
  /** Orthogonal routes at the current scale, by original Mermaid edge id. */
  routes: Map<string, Point[]>;
  /**
   * Where the core's own edges attach, as offsets along a side, keyed
   * `nodeId|side`.
   *
   * A tree hangs off a core node whose sides are already in use, and this layout
   * may not move a core edge — so the tree's connectors have to be told what is
   * taken. Without it a lone tree connector and a lone core edge both sit at the
   * centre of the same side and are drawn on top of each other.
   */
  ports: Map<string, number[]>;
  /** Edges the router could not route; drawn as a straight endpoint pair. */
  unroutedEdgeIds: string[];
}

/**
 * Draw the core with grid-like.
 *
 * A core always contains a cycle — containing one is what surviving leaf peeling
 * means — and grid-like's beautification is greedy, so which drawing it produces
 * for one is unstable. `drawBestCore` therefore asks it several times and keeps the
 * best; every candidate is still a grid-like drawing of the same nodes and edges.
 */
export function drawCore(
  data: LayoutData,
  flat: FlattenResult,
  componentId: string,
  core: HolaGraph,
  options: GridAttachedOptions
): CoreDrawing {
  const part: DecomposedPart = {
    id: `${componentId}/core`,
    kind: 'core',
    componentId,
    nodeIds: [...core.nodes.keys()],
    edgeIds: coreEdgeIds(core, flat),
    cyclic: true,
  };

  const layoutData = buildPartLayoutData(data, flat, part);
  const grid = drawBestCore(layoutData, options);

  const base = new Map(
    layoutData.nodes.map((node) => [node.id, { x: node.x ?? 0, y: node.y ?? 0 }])
  );
  const bounds = coreBoundsOf(layoutData.nodes);

  return {
    componentId,
    nodes: layoutData.nodes,
    edges: layoutData.edges,
    grid,
    scale: 1,
    base,
    centre: { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 },
    routes: new Map(),
    ports: new Map(),
    unroutedEdgeIds: [],
  };
}

/**
 * The original Mermaid edges drawn inside the core: every core edge expanded back
 * into the bundle of parallel edges it collapsed, plus the self-loops of its
 * nodes, which the adapter held aside.
 */
function coreEdgeIds(core: HolaGraph, flat: FlattenResult): string[] {
  const ids: string[] = [];
  for (const edge of core.edges.values()) {
    ids.push(...edge.originalEdgeIds);
  }
  for (const loop of flat.selfLoops) {
    if (core.nodes.has(loop.source)) {
      ids.push(loop.originalEdgeId);
    }
  }
  return ids;
}

/**
 * Stretch every core edge by `scale`, keeping the drawing's shape.
 *
 * Positions only — the routes are re-derived afterwards rather than scaled, so a
 * wider core gets the shorter route the extra room allows instead of a stretched
 * copy of the tighter one.
 */
export function applyCoreScale(drawing: CoreDrawing, scale: number): void {
  const { centre, base } = drawing;

  for (const node of drawing.nodes) {
    const from = base.get(node.id);
    if (!from) {
      continue;
    }
    node.x = centre.x + scale * (from.x - centre.x);
    node.y = centre.y + scale * (from.y - centre.y);
  }

  drawing.scale = scale;
}

/**
 * Route the core's edges orthogonally at the current positions.
 *
 * `routeFinalEdges` is HOLA's own final router, used exactly as HOLA uses it: one
 * pass to discover which side of each node an edge wants, a port assignment along
 * those sides, then a second pass with both locked, so two edges arriving at the
 * same side attach at different points instead of on top of each other. It also
 * handles self-loops and bundles of parallel edges, and an edge it cannot route
 * falls back to a straight endpoint pair with a diagnostic rather than vanishing.
 *
 * Called once per rung of the enlargement ladder, because a route is only as good
 * as the positions it was found for.
 */
export function routeCoreEdges(
  drawing: CoreDrawing,
  core: HolaGraph,
  flat: FlattenResult,
  options: GridAttachedOptions,
  diagnostics: DiagnosticCollector
): void {
  const rects = coreRects(drawing, core);
  const finalEdges: FinalEdge[] = [];

  for (const edge of core.edges.values()) {
    const originals = edge.originalEdgeIds;
    originals.forEach((originalEdgeId, index) => {
      finalEdges.push({
        originalEdgeId,
        source: edge.source,
        target: edge.target,
        mandatoryWaypoints: [],
        parallelIndex: index,
        parallelCount: originals.length,
      });
    });
  }
  for (const loop of flat.selfLoops) {
    if (!rects.has(loop.source)) {
      continue;
    }
    finalEdges.push({
      originalEdgeId: loop.originalEdgeId,
      source: loop.source,
      target: loop.target,
      mandatoryWaypoints: [],
      parallelIndex: 0,
      parallelCount: 1,
    });
  }

  const routed = routeFinalEdges(
    rects,
    finalEdges,
    resolveHolaOptions({
      routingClearance: options.routingClearance,
      routingBendPenalty: options.routingBendPenalty,
      routingCrossingPenalty: options.routingCrossingPenalty,
      routingMaxExpansions: options.routingMaxExpansions,
    }),
    diagnostics,
    drawing.componentId
  );

  drawing.routes = new Map(routed.edges.map((edge) => [edge.originalEdgeId, edge.points]));
  drawing.unroutedEdgeIds = routed.failed;
  drawing.ports = collectPorts(routed.edges, rects);
}

/**
 * Which offsets along which sides the core's edges occupy.
 *
 * The router reports the side it chose for each end, so the offset is exact even
 * where the port was pulled inwards onto a non-rectangular shape. A self-loop is
 * reported without sides — both of its feet sit on one side of the box — so its
 * side is read back from the geometry.
 */
function collectPorts(
  edges: RoutedFinalEdge[],
  rects: Map<string, HolaNode>
): Map<string, number[]> {
  const ports = new Map<string, number[]>();
  const add = (nodeId: string, side: Side, point: Point): void => {
    const rect = rects.get(nodeId);
    if (!rect) {
      return;
    }
    const offset = side === 'top' || side === 'bottom' ? point.x - rect.x : point.y - rect.y;
    const key = `${nodeId}|${side}`;
    const list = ports.get(key);
    if (list) {
      list.push(offset);
    } else {
      ports.set(key, [offset]);
    }
  };

  for (const edge of edges) {
    const points = edge.points;
    if (points.length < 2) {
      continue;
    }
    if (edge.isSelfLoop) {
      const side = sideNearest(rects.get(edge.source), points[0]);
      if (side) {
        add(edge.source, side, points[0]);
        add(edge.source, side, points[points.length - 1]);
      }
      continue;
    }
    if (edge.sourceSide) {
      add(edge.source, edge.sourceSide, points[0]);
    }
    if (edge.targetSide) {
      add(edge.target, edge.targetSide, points[points.length - 1]);
    }
  }

  return ports;
}

/** The side of the box a point sits closest to. */
function sideNearest(rect: HolaNode | undefined, point: Point): Side | undefined {
  if (!rect) {
    return undefined;
  }
  const gaps: [Side, number][] = [
    ['top', Math.abs(point.y - (rect.y - rect.height / 2))],
    ['bottom', Math.abs(point.y - (rect.y + rect.height / 2))],
    ['left', Math.abs(point.x - (rect.x - rect.width / 2))],
    ['right', Math.abs(point.x - (rect.x + rect.width / 2))],
  ];
  return gaps.sort((a, b) => a[1] - b[1])[0][0];
}

/** The core nodes as HOLA rectangles at their current positions. */
export function coreRects(drawing: CoreDrawing, core: HolaGraph): Map<string, HolaNode> {
  const rects = new Map<string, HolaNode>();
  for (const node of drawing.nodes) {
    const source = core.nodes.get(node.id);
    if (!source) {
      continue;
    }
    rects.set(node.id, {
      ...source,
      x: node.x ?? 0,
      y: node.y ?? 0,
      width: node.width ?? source.width,
      height: node.height ?? source.height,
    });
  }
  return rects;
}

/**
 * The drawn core edges, as the axis-aligned pieces of their routes.
 *
 * These are what a tree has to keep clear of, and what the core's faces are read
 * from. Both used to work off straight centre-to-centre lines; now that the core
 * is routed, both see the geometry that is actually drawn.
 */
export function coreSegments(drawing: CoreDrawing, core: HolaGraph): CoreSegment[] {
  const segments: CoreSegment[] = [];

  for (const edge of core.edges.values()) {
    const route = routeOf(drawing, edge);
    for (let i = 1; i < route.length; i++) {
      segments.push({
        edgeId: edge.id,
        source: edge.source,
        target: edge.target,
        a: route[i - 1],
        b: route[i],
        originalEdgeIds: [...edge.originalEdgeIds],
      });
    }
  }

  return segments;
}

export interface CoreSegment {
  edgeId: string;
  source: string;
  target: string;
  a: Point;
  b: Point;
  originalEdgeIds: string[];
}

/**
 * The core's topological edges carrying their routes, which is the shape HOLA's
 * planariser reads.
 */
export function routedCoreEdges(drawing: CoreDrawing, core: HolaGraph): HolaEdge[] {
  return [...core.edges.values()].map((edge) => ({ ...edge, route: routeOf(drawing, edge) }));
}

/**
 * One route per topological edge. A bundle of parallel edges is drawn as several
 * routes; the first stands for the bundle, because the faces and the obstacles
 * care where the connection runs, not how many lines run there.
 */
function routeOf(drawing: CoreDrawing, edge: HolaEdge): Point[] {
  for (const originalEdgeId of edge.originalEdgeIds) {
    const route = drawing.routes.get(originalEdgeId);
    if (route && route.length >= 2) {
      return route;
    }
  }
  return [];
}

export function coreBoundsOf(nodes: Node[]): Bounds {
  return (
    unionBounds(
      nodes.map((node) =>
        nodeBounds({
          x: node.x ?? 0,
          y: node.y ?? 0,
          width: node.width ?? 0,
          height: node.height ?? 0,
        })
      )
    ) ?? { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  );
}
