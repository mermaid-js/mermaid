import type { LayoutData, Node } from '../../../types.js';
import type { Point } from '../../../../types.js';
import type { Position } from '../solver/stress.js';
import type { IpsepColaOptions } from '../options.js';
import { X_AXIS, Y_AXIS } from './constraints.js';
import type { IpsepColaGraph } from './graph.js';

/**
 * Copy the solved coordinates back onto `LayoutData` and produce edge routes.
 *
 * The solver works in its own centred coordinate space, so everything is first
 * translated to sit in the positive quadrant with a margin — the same shape of
 * output dagre produces, which is what the shared painter and the SVG viewport
 * sizing expect.
 */
export function writeBackLayout(
  data4Layout: LayoutData,
  graph: IpsepColaGraph,
  positions: readonly Position[],
  options: IpsepColaOptions
): void {
  const offset = computeTranslation(graph, positions, options);

  for (const [index, variable] of graph.variables.entries()) {
    variable.node.x = positions[index][X_AXIS] + offset.x;
    variable.node.y = positions[index][Y_AXIS] + offset.y;
  }

  routeEdges(graph, options);
  sizeGroups(data4Layout, options);
}

/** Translation that puts the top-left of the node bounding box at `margin`. */
function computeTranslation(
  graph: IpsepColaGraph,
  positions: readonly Position[],
  options: IpsepColaOptions
): Point {
  if (graph.variables.length === 0) {
    return { x: 0, y: 0 };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;

  for (const [index, variable] of graph.variables.entries()) {
    minX = Math.min(minX, positions[index][X_AXIS] - variable.width / 2);
    minY = Math.min(minY, positions[index][Y_AXIS] - variable.height / 2);
  }

  return { x: options.margin - minX, y: options.margin - minY };
}

/**
 * Straight centre-to-centre routes. The shared painter clips both ends against
 * the node shapes (`insertEdge` with `skipLayoutAdjustments` left off), so the
 * drawn segment starts and ends on the node borders.
 *
 * A midpoint is emitted as well: it is where the painter's fallback puts the
 * edge label when the rendered path is unavailable.
 */
function routeEdges(graph: IpsepColaGraph, options: IpsepColaOptions): void {
  for (const edge of graph.routableEdges) {
    const source = graph.variables[graph.indexById.get(edge.start!)!].node;
    const target = graph.variables[graph.indexById.get(edge.end!)!].node;

    const start: Point = { x: source.x ?? 0, y: source.y ?? 0 };
    const end: Point = { x: target.x ?? 0, y: target.y ?? 0 };
    const middle: Point = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };

    edge.points = [start, middle, end];
    edge.x = middle.x;
    edge.y = middle.y;
  }

  for (const edge of graph.selfLoops) {
    const node = graph.variables[graph.indexById.get(edge.start!)!].node;
    edge.points = selfLoopRoute(node, options);
    edge.x = edge.points[2].x;
    edge.y = edge.points[2].y;
  }
}

/** A loop leaving the node's top edge and coming back to it. */
function selfLoopRoute(node: Node, options: IpsepColaOptions): Point[] {
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const halfWidth = (node.width ?? 0) / 2;
  const halfHeight = (node.height ?? 0) / 2;
  const reach = Math.max(options.nodeSpacing / 2, 20);

  return [
    { x: x - halfWidth / 2, y: y - halfHeight },
    { x: x - halfWidth / 2, y: y - halfHeight - reach },
    { x, y: y - halfHeight - reach },
    { x: x + halfWidth / 2, y: y - halfHeight - reach },
    { x: x + halfWidth / 2, y: y - halfHeight },
  ];
}

/**
 * Size every group frame around its descendants.
 *
 * Groups take no part in the constraint system — this implementation lays out
 * leaf nodes only — so their frames are fitted afterwards. Nested groups are
 * handled by measuring against all transitive leaf descendants, which makes the
 * pass order-independent. A group whose children the solver never placed (an
 * empty subgraph) is left untouched.
 */
function sizeGroups(data4Layout: LayoutData, options: IpsepColaOptions): void {
  const nodes = data4Layout.nodes ?? [];
  const groups = nodes.filter((node) => node.isGroup);
  if (groups.length === 0) {
    return;
  }

  const byId = new Map(nodes.map((node) => [node.id, node]));

  for (const group of groups) {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const node of nodes) {
      if (node.isGroup || !isDescendantOf(node, group.id, byId)) {
        continue;
      }
      minX = Math.min(minX, (node.x ?? 0) - (node.width ?? 0) / 2);
      minY = Math.min(minY, (node.y ?? 0) - (node.height ?? 0) / 2);
      maxX = Math.max(maxX, (node.x ?? 0) + (node.width ?? 0) / 2);
      maxY = Math.max(maxY, (node.y ?? 0) + (node.height ?? 0) / 2);
    }

    if (!Number.isFinite(minX)) {
      continue;
    }

    const padding = options.groupPadding;
    group.x = (minX + maxX) / 2;
    group.y = (minY + maxY) / 2;
    group.width = maxX - minX + 2 * padding;
    group.height = maxY - minY + 2 * padding;
  }
}

function isDescendantOf(node: Node, groupId: string, byId: Map<string, Node>): boolean {
  const visited = new Set<string>();
  let parentId = node.parentId;

  while (parentId && !visited.has(parentId)) {
    if (parentId === groupId) {
      return true;
    }
    visited.add(parentId);
    parentId = byId.get(parentId)?.parentId;
  }

  return false;
}
