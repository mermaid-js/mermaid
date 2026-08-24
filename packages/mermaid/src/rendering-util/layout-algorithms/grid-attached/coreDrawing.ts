/**
 * The core, drawn by grid-like — and the one lever this layout has over it.
 *
 * The core drawing itself is not this layout's business: it is produced by
 * `grid-decomposed`'s core pass, unchanged, so a core looks exactly the same
 * whether its trees are packed beside it (`grid-decomposed`) or attached to it
 * (this layout). Nothing here re-solves, re-aligns or re-routes it.
 *
 * The single permitted change is **enlargement**: every core node is moved away
 * from the core's centre by a common factor. That stretches every core edge and
 * nothing else —
 *
 *   - a uniform scale is separable per axis, so two nodes grid-like aligned on
 *     `x` still share an `x`: the grid structure, every ACA alignment and every
 *     orthogonal edge survive exactly;
 *   - node sizes are untouched, so distances only grow and the drawing cannot
 *     develop an overlap it did not have;
 *   - the drawing is therefore the same picture with longer edges, which is
 *     precisely the room a tree needs.
 *
 * Every scale is derived from the *same* base geometry, so the ladder in
 * `layoutCore.ts` can walk up and down it without drift.
 */

import type { Point } from '../../../types.js';
import type { Edge, LayoutData, Node } from '../../types.js';
import type { GridLikeLayoutResult } from '../grid-like/layoutCore.js';
import { drawCyclicPart } from '../grid-decomposed/layoutCore.js';
import { buildPartLayoutData } from '../grid-decomposed/parts.js';
import type { DecomposedPart } from '../grid-decomposed/parts.js';
import type { FlattenResult } from '../hola-faithful/adapter/flattenFlowchart.js';
import type { Bounds, HolaGraph, HolaNode } from '../hola-faithful/model.js';
import { nodeBounds, unionBounds } from '../hola-faithful/model.js';
import { exitPoint } from './geometry.js';
import type { GridAttachedOptions } from './options.js';

/** Geometry as grid-like left it: the drawing every enlargement is derived from. */
interface BaseGeometry {
  nodes: Map<string, Point>;
  edges: Map<string, { points: Point[]; x?: number; y?: number }>;
}

export interface CoreDrawing {
  componentId: string;
  /** The real Mermaid core nodes, in input order. */
  nodes: Node[];
  /** The real Mermaid edges drawn inside the core. */
  edges: Edge[];
  /** Edges that start and end on the same node: translated with it, never scaled. */
  selfLoopEdgeIds: Set<string>;
  /** What grid-like reported for the core. */
  grid: GridLikeLayoutResult;
  /** Enlargement currently applied. 1 is grid-like's own drawing. */
  scale: number;
  base: BaseGeometry;
  /** Point every enlargement scales about. */
  centre: Point;
}

/**
 * Draw the core with grid-like.
 *
 * A core always contains a cycle — containing one is what surviving leaf peeling
 * means — so it goes through `grid-decomposed`'s cyclic pass, which draws it both
 * with and without the flow ordering and keeps the better drawing. That decision
 * is not revisited here.
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
  const grid = drawCyclicPart(layoutData, options);

  const base: BaseGeometry = {
    nodes: new Map(layoutData.nodes.map((node) => [node.id, { x: node.x ?? 0, y: node.y ?? 0 }])),
    edges: new Map(
      layoutData.edges.map((edge) => [
        edge.id,
        { points: (edge.points ?? []).map((p) => ({ ...p })), x: edge.x, y: edge.y },
      ])
    ),
  };

  const bounds = coreBoundsOf(layoutData.nodes);

  return {
    componentId,
    nodes: layoutData.nodes,
    edges: layoutData.edges,
    selfLoopEdgeIds: new Set(
      layoutData.edges.filter((edge) => edge.start === edge.end).map((edge) => edge.id)
    ),
    grid,
    scale: 1,
    base,
    centre: { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 },
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
 * Always applied to the base geometry rather than to whatever is currently on the
 * nodes, so walking the ladder is exact and reversible.
 */
export function applyCoreScale(drawing: CoreDrawing, scale: number): void {
  const { centre, base } = drawing;
  const at = (p: Point): Point => ({
    x: centre.x + scale * (p.x - centre.x),
    y: centre.y + scale * (p.y - centre.y),
  });

  const displacement = new Map<string, Point>();
  for (const node of drawing.nodes) {
    const from = base.nodes.get(node.id);
    if (!from) {
      continue;
    }
    const to = at(from);
    displacement.set(node.id, { x: to.x - from.x, y: to.y - from.y });
    node.x = to.x;
    node.y = to.y;
  }

  for (const edge of drawing.edges) {
    const from = base.edges.get(edge.id);
    if (!from) {
      continue;
    }
    // A self-loop is a fixed detour hugging its own node, not an edge between two
    // nodes: scaling it would grow the loop, which is a change to how the core is
    // drawn rather than a longer edge. It travels with its node instead.
    const shift = drawing.selfLoopEdgeIds.has(edge.id)
      ? (displacement.get(edge.start ?? '') ?? { x: 0, y: 0 })
      : undefined;
    const move = shift
      ? (p: Point): Point => ({ x: p.x + shift.x, y: p.y + shift.y })
      : (p: Point): Point => at(p);

    edge.points = from.points.map(move);
    if (from.x !== undefined && from.y !== undefined) {
      const label = move({ x: from.x, y: from.y });
      edge.x = label.x;
      edge.y = label.y;
    }
  }

  drawing.scale = scale;
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
 * The core's edges as straight segments between node centres, which is what
 * grid-like's write-back draws. They are obstacles for tree placement and the
 * geometry the core's faces are read from.
 */
export function coreSegments(drawing: CoreDrawing, core: HolaGraph): CoreSegment[] {
  const rects = coreRects(drawing, core);
  const segments: CoreSegment[] = [];

  for (const edge of core.edges.values()) {
    const a = rects.get(edge.source);
    const b = rects.get(edge.target);
    if (!a || !b || (a.x === b.x && a.y === b.y)) {
      continue;
    }
    segments.push({
      edgeId: edge.id,
      source: edge.source,
      target: edge.target,
      a: { x: a.x, y: a.y },
      b: { x: b.x, y: b.y },
      // The painter clips both ends against the node shapes, so only the part
      // between the two boundaries is drawn — and only that part is an obstacle.
      drawnA: exitPoint(a, { x: b.x, y: b.y }),
      drawnB: exitPoint(b, { x: a.x, y: a.y }),
      originalEdgeIds: [...edge.originalEdgeIds],
    });
  }

  return segments;
}

export interface CoreSegment {
  edgeId: string;
  source: string;
  target: string;
  /** Node centres: the vertices the core's faces are read from. */
  a: Point;
  b: Point;
  /** The part actually drawn, clipped at both node boundaries. */
  drawnA: Point;
  drawnB: Point;
  originalEdgeIds: string[];
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
