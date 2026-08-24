/**
 * Decomposed grid-like layout: HOLA's topological decomposition, drawn by
 * grid-like.
 *
 *     decompose (in prepareLayout: peel the trees off each core and re-root each
 *     one on a duplicate of its core node) → split into the pieces that leaves →
 *     lay every piece out on its own with grid-like → pack them left to right
 *
 * The point is to *see* the decomposition. Each part — the core, and every tree
 * that was peeled from it — becomes its own small grid-like drawing, and the
 * finished parts are packed side by side as unconnected diagrams. Nothing is
 * thrown away to achieve that: the edge peeling cut is drawn from the tree's
 * duplicated root, so no edge ever runs between two parts.
 *
 * Neither half is reimplemented here. The decomposition is `hola-faithful`'s (its
 * adapter, its component split, its leaf peeling); the per-part drawing is
 * `runGridLikeLayoutCore`. This file routes data between them, decides how each
 * kind of part is laid out, and packs the results.
 *
 * DOM-free by contract: it reads sizes measured earlier and writes `node.x/y` and
 * `edge.points`, so the same entry point drives the browser renderer and the
 * DOM-decoupled tests.
 */

import { log } from '../../../logger.js';
import type { Point } from '../../../types.js';
import type { Edge, LayoutData, Node } from '../../types.js';
import { runGridLikeLayoutCore } from '../grid-like/layoutCore.js';
import type { GridLikeLayoutResult } from '../grid-like/layoutCore.js';
import type { GridLikeOptions } from '../grid-like/options.js';
import { flattenFlowchart } from '../hola-faithful/adapter/flattenFlowchart.js';
import type { FlattenResult } from '../hola-faithful/adapter/flattenFlowchart.js';
import { packComponentsLeftToRight } from '../hola-faithful/components/components.js';
import { DiagnosticCollector } from '../hola-faithful/diagnostics.js';
import type { HolaDiagnostic } from '../hola-faithful/diagnostics.js';
import type { Bounds } from '../hola-faithful/model.js';
import { nodeBounds, unionBounds } from '../hola-faithful/model.js';
import type { DecomposedPart, PartKind } from './parts.js';
import { buildPartLayoutData, splitIntoParts } from './parts.js';
import type { GridDecomposedOptions } from './options.js';
import { resolveGridDecomposedOptions } from './options.js';
import { countEdgeCrossings, countEdgesThroughForeignNodes } from './partQuality.js';
import { prepareGridDecomposedLayout } from './prepareLayout.js';
import type { DuplicatedRoot } from './prepareLayout.js';

/** One part of the decomposition, as drawn. */
export interface GridDecomposedPartResult {
  id: string;
  kind: PartKind;
  componentId: string;
  /** Nodes drawn in this part, a tree's duplicated root included. */
  nodeIds: string[];
  /** Edges drawn inside this part. */
  edgeIds: string[];
  /** Tree parts: the core node this part's duplicated root stands for. */
  rootCopyOf?: string;
  /** Bounds in the finished drawing. */
  bounds: Bounds;
  /** What grid-like reported for this part. */
  grid: GridLikeLayoutResult;
}

export interface GridDecomposedResult {
  parts: GridDecomposedPartResult[];
  componentCount: number;
  /** The trees that were peeled off a core and re-rooted on a duplicate. */
  duplicatedRoots: DuplicatedRoot[];
  /**
   * Edges removed from the drawing. Normally empty: peeling rewires rather than
   * deletes. An edge only lands here if it survived into no part at all, which
   * would leave it with no route to draw.
   */
  droppedEdgeIds: string[];
  bounds?: Bounds;
  diagnostics: HolaDiagnostic[];
  options: GridDecomposedOptions;
}

export function runGridDecomposedLayoutCore(
  data: LayoutData,
  overrides?: Partial<GridDecomposedOptions>
): GridDecomposedResult {
  // The browser path has already done this before measuring; repeating it keeps
  // the DOM-free entry point on exactly the same graph. It is idempotent: a
  // re-rooted tree is its own component and no longer hangs off a core.
  const prepared = prepareGridDecomposedLayout(data);

  const options = resolveGridDecomposedOptions(data, overrides);
  const diagnostics = new DiagnosticCollector();
  const flat = flattenFlowchart(data, diagnostics);

  const allDiagnostics = [...prepared.diagnostics, ...diagnostics.all()];
  if (flat.graph.nodes.size === 0) {
    return {
      parts: [],
      componentCount: 0,
      duplicatedRoots: prepared.duplicatedRoots,
      droppedEdgeIds: [],
      diagnostics: allDiagnostics,
      options,
    };
  }

  const parts = splitIntoParts(flat);

  // Every part is laid out with the *same* resolved options, so all the parts
  // share one grid step and one ideal edge length. Deriving them per part would
  // give a five-node tree a different grid from the core beside it, and the
  // drawing would stop reading as one decomposition of one diagram.
  const laidOut = parts.map((part) => layoutPart(data, flat, part, options));

  const bounds = packComponentsLeftToRight(
    laidOut.map((part) => ({
      bounds: part.bounds,
      translate: (dx: number, dy: number) => translatePart(part, dx, dy),
    })),
    options.partGap
  );

  // Packing leaves the drawing against the origin; the margin every layout keeps
  // between content and origin is re-applied once, to the whole thing.
  for (const part of laidOut) {
    translatePart(part, options.margin, options.margin);
  }

  const droppedEdgeIds = pruneToParts(data, parts);

  log.debug(
    `GRID-DECOMPOSED: ${parts.length} part(s) — ` +
      `${parts.filter((part) => part.kind === 'core').length} core(s), ` +
      `${parts.filter((part) => part.kind === 'tree').length} peeled tree(s), ` +
      `${parts.filter((part) => part.kind === 'pure-tree').length} whole-tree component(s)`
  );

  return {
    parts: laidOut.map((part) => part.result),
    componentCount: new Set(parts.map((part) => part.componentId)).size,
    duplicatedRoots: prepared.duplicatedRoots,
    droppedEdgeIds,
    bounds: bounds && shiftBounds(bounds, options.margin, options.margin),
    diagnostics: allDiagnostics,
    options,
  };
}

/** A part after its own grid-like run, with everything that must move with it. */
interface LaidOutPart {
  result: GridDecomposedPartResult;
  bounds: Bounds;
  nodes: Node[];
  edges: Edge[];
}

function layoutPart(
  data: LayoutData,
  flat: FlattenResult,
  part: DecomposedPart,
  options: GridDecomposedOptions
): LaidOutPart {
  const layoutData = buildPartLayoutData(data, flat, part);
  const grid = part.cyclic
    ? drawCyclicPart(layoutData, options)
    : runGridLikeLayoutCore(layoutData, options);

  const bounds = unionBounds(
    layoutData.nodes.map((node) =>
      nodeBounds({
        x: node.x ?? 0,
        y: node.y ?? 0,
        width: node.width ?? 0,
        height: node.height ?? 0,
      })
    )
  ) ?? { minX: 0, minY: 0, maxX: 0, maxY: 0 };

  return {
    result: {
      id: part.id,
      kind: part.kind,
      componentId: part.componentId,
      nodeIds: [...part.nodeIds],
      edgeIds: [...part.edgeIds],
      rootCopyOf: part.rootCopyOf,
      bounds,
      grid,
    },
    bounds,
    nodes: layoutData.nodes,
    edges: layoutData.edges,
  };
}

/**
 * A part that contains a cycle — every core does, since containing a cycle is what
 * surviving leaf peeling means — is drawn twice and the better drawing kept.
 *
 * The choice is the flow ordering: one separation constraint per edge along the
 * diagram's direction. Neither answer is right for every core, and both failure
 * modes are real:
 *
 *   - *with* the ordering, a cycle cannot satisfy it, so IPSEP-COLA builds it from
 *     a spanning acyclic subset (`acyclicLinks`). That ranks the cycle's nodes one
 *     under the next and leaves the closing edge to span all of them; stress then
 *     has no reason to spread those ranks sideways, because any sideways move only
 *     lengthens that already over-stretched edge. A four-cycle settles into a
 *     single column with its closing edge drawn straight back through the nodes in
 *     between, and the cycle is invisible;
 *   - *without* it, ACA is free to align on both axes instead of only across the
 *     flow (§12: an alignment along the flow axis is infeasible while the ordering
 *     holds). More alignments is usually better, but the paper's candidate filter
 *     only rejects coincident edges (§12 `CREATES_COINCIDENCE`) — not crossings —
 *     so the extra freedom can align two edges into a crossing that the ordering
 *     would have prevented.
 *
 * So the ordered drawing is produced first and inspected for exactly those two
 * symptoms: edges running through nodes they do not connect, and crossings. If it
 * has neither, it is kept and nothing else is drawn — which is the common case, and
 * costs a single solve. Only a flawed drawing is worth a second attempt, and then
 * the two are compared: fewer edges through nodes first, then fewer crossings, and
 * a tie keeps the ordering, because respecting the diagram's declared direction is
 * worth something on its own.
 *
 * Acyclic parts are drawn once, with the ordering: it is satisfiable there, and it
 * is what makes a tree grow in the declared direction.
 */
export function drawCyclicPart(
  layoutData: LayoutData,
  options: GridLikeOptions
): GridLikeLayoutResult {
  const withFlow = drawCandidate(layoutData, { ...options, respectDirection: true });
  if (withFlow.foreignNodeHits === 0 && withFlow.crossings === 0) {
    return withFlow.grid;
  }

  const withoutFlow = drawCandidate(layoutData, { ...options, respectDirection: false });
  const chosen = isBetter(withoutFlow, withFlow) ? withoutFlow : withFlow;
  restoreGeometry(layoutData, chosen.geometry);

  log.debug(
    `GRID-DECOMPOSED: cyclic part drawn ${chosen === withFlow ? 'with' : 'without'} the flow ` +
      `ordering — with: ${describe(withFlow)}, without: ${describe(withoutFlow)}`
  );

  return chosen.grid;
}

interface PartCandidate {
  grid: GridLikeLayoutResult;
  geometry: PartGeometry;
  /** Edges running through a node they do not connect. */
  foreignNodeHits: number;
  crossings: number;
}

function drawCandidate(layoutData: LayoutData, options: GridLikeOptions): PartCandidate {
  // `computeInitialLayout` starts from a BFS ranking rather than from whatever is
  // currently on the nodes, so a second run is not influenced by the first.
  const grid = runGridLikeLayoutCore(layoutData, options);

  return {
    grid,
    geometry: captureGeometry(layoutData),
    foreignNodeHits: countEdgesThroughForeignNodes(layoutData),
    crossings: countEdgeCrossings(layoutData),
  };
}

/** Lexicographic: edges through foreign nodes first, then crossings. */
function isBetter(candidate: PartCandidate, incumbent: PartCandidate): boolean {
  if (candidate.foreignNodeHits !== incumbent.foreignNodeHits) {
    return candidate.foreignNodeHits < incumbent.foreignNodeHits;
  }

  return candidate.crossings < incumbent.crossings;
}

function describe(candidate: PartCandidate): string {
  return `${candidate.foreignNodeHits} edge(s) through a node, ${candidate.crossings} crossing(s)`;
}

interface PartGeometry {
  nodes: Map<string, { x: number; y: number }>;
  edges: Map<string, { points: Point[]; x?: number; y?: number }>;
}

function captureGeometry(layoutData: LayoutData): PartGeometry {
  return {
    nodes: new Map(layoutData.nodes.map((node) => [node.id, { x: node.x ?? 0, y: node.y ?? 0 }])),
    edges: new Map(
      layoutData.edges.map((edge) => [
        edge.id,
        {
          points: (edge.points ?? []).map((point) => ({ ...point })),
          x: edge.x,
          y: edge.y,
        },
      ])
    ),
  };
}

function restoreGeometry(layoutData: LayoutData, geometry: PartGeometry): void {
  for (const node of layoutData.nodes) {
    const position = geometry.nodes.get(node.id);
    if (position) {
      node.x = position.x;
      node.y = position.y;
    }
  }

  for (const edge of layoutData.edges) {
    const route = geometry.edges.get(edge.id);
    if (route) {
      edge.points = route.points;
      edge.x = route.x;
      edge.y = route.y;
    }
  }
}

/** Rigid translation. Nothing is re-laid-out or re-routed across parts. */
function translatePart(part: LaidOutPart, dx: number, dy: number): void {
  for (const node of part.nodes) {
    node.x = (node.x ?? 0) + dx;
    node.y = (node.y ?? 0) + dy;
  }

  for (const edge of part.edges) {
    edge.points = (edge.points ?? []).map((point) => ({ x: point.x + dx, y: point.y + dy }));
    if (edge.x !== undefined) {
      edge.x += dx;
    }
    if (edge.y !== undefined) {
      edge.y += dy;
    }
  }

  part.result.bounds = shiftBounds(part.result.bounds, dx, dy);
  part.bounds = part.result.bounds;
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
 * Safety net: keep only what a part actually laid out.
 *
 * After peeling, every node and every edge belongs to exactly one part, so this
 * normally removes nothing. It still runs, because an edge with no part has no
 * route and painting it would draw a line from nowhere — and because an edge that
 * ends up here is a decomposition bug worth reporting rather than hiding.
 */
function pruneToParts(data: LayoutData, parts: DecomposedPart[]): string[] {
  const drawnNodeIds = new Set(parts.flatMap((part) => part.nodeIds));
  const drawnEdgeIds = new Set(parts.flatMap((part) => part.edgeIds));

  const droppedEdgeIds: string[] = [];
  data.edges = (data.edges ?? []).filter((edge) => {
    if (drawnEdgeIds.has(edge.id)) {
      return true;
    }
    droppedEdgeIds.push(edge.id);
    return false;
  });

  data.nodes = (data.nodes ?? []).filter((node) => drawnNodeIds.has(node.id));

  if (droppedEdgeIds.length > 0) {
    log.debug(
      `GRID-DECOMPOSED: ${droppedEdgeIds.length} edge(s) belonged to no part and were not drawn`
    );
  }

  return droppedEdgeIds;
}
