import type { LayoutData, Node } from '../../../types.js';
import type { Point } from '../../../../types.js';
import type { Position } from '../solver/stress.js';
import type { IpsepColaOptions } from '../options.js';
import { X_AXIS, Y_AXIS } from './constraints.js';
import type { IpsepColaGraph } from './graph.js';
import type { Entity } from './groups.js';
import { isDescendantOf } from './groups.js';

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

  // A frame is two variables per axis, so its centre and size both come out of
  // the solution rather than being fitted to the children afterwards.
  for (const group of graph.groups.groups) {
    const left = positions[group.minIndex][X_AXIS] + offset.x;
    const right = positions[group.maxIndex][X_AXIS] + offset.x;
    const top = positions[group.minIndex][Y_AXIS] + offset.y;
    const bottom = positions[group.maxIndex][Y_AXIS] + offset.y;

    group.node.x = (left + right) / 2;
    group.node.y = (top + bottom) / 2;
    group.node.width = right - left;
    group.node.height = bottom - top;
  }

  fitUnmodelledGroups(data4Layout, graph, options);
  routeEdges(graph, options);
}

/**
 * Size any subgraph the constraint system did not model, by fitting its frame
 * around whatever ended up inside it.
 *
 * Two cases reach here: a caller that opted out of group modelling entirely
 * (the `grid-like` layout does), and an empty subgraph, which has nothing to
 * contain and so was never given boundary variables. Both still have to come
 * out with a drawable frame.
 */
function fitUnmodelledGroups(
  data4Layout: LayoutData,
  graph: IpsepColaGraph,
  options: IpsepColaOptions
): void {
  const nodes = data4Layout.nodes ?? [];
  const unmodelled = nodes.filter((node) => node.isGroup && !graph.groups.indexById.has(node.id));
  if (unmodelled.length === 0) {
    return;
  }
  const byId = new Map(nodes.map((node) => [node.id, node]));

  for (const group of unmodelled) {
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

/** Translation that puts the top-left of the drawing's bounding box at `margin`. */
function computeTranslation(
  graph: IpsepColaGraph,
  positions: readonly Position[],
  options: IpsepColaOptions
): Point {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;

  for (const [index, variable] of graph.variables.entries()) {
    minX = Math.min(minX, positions[index][X_AXIS] - variable.width / 2);
    minY = Math.min(minY, positions[index][Y_AXIS] - variable.height / 2);
  }
  // A frame's padding puts its border outside every child, so the frames have
  // to be measured too or the outermost subgraph is clipped by the viewport.
  for (const group of graph.groups.groups) {
    minX = Math.min(minX, positions[group.minIndex][X_AXIS]);
    minY = Math.min(minY, positions[group.minIndex][Y_AXIS]);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return { x: 0, y: 0 };
  }
  return { x: options.margin - minX, y: options.margin - minY };
}

/** The already-translated node an entity stands for. */
function nodeOf(graph: IpsepColaGraph, entity: Entity): Node {
  return entity.kind === 'leaf'
    ? graph.variables[entity.index].node
    : graph.groups.groups[entity.index].node;
}

/**
 * Straight centre-to-centre routes. The shared painter clips both ends against
 * the node shapes (`insertEdge` with `skipLayoutAdjustments` left off), so the
 * drawn segment starts and ends on the node borders — including on a subgraph
 * frame, when an edge names the subgraph itself.
 *
 * A midpoint is emitted as well: it is where the painter's fallback puts the
 * edge label when the rendered path is unavailable.
 */
function routeEdges(graph: IpsepColaGraph, options: IpsepColaOptions): void {
  for (const edge of graph.routableEdges) {
    const source = nodeOf(graph, graph.entityById.get(edge.start!)!);
    const target = nodeOf(graph, graph.entityById.get(edge.end!)!);

    const start: Point = { x: source.x ?? 0, y: source.y ?? 0 };
    const end: Point = { x: target.x ?? 0, y: target.y ?? 0 };
    const middle: Point = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };

    edge.points = [start, middle, end];
    edge.x = middle.x;
    edge.y = middle.y;
  }

  for (const edge of graph.selfLoops) {
    const entity = graph.entityById.get(edge.start!);
    if (!entity) {
      continue;
    }
    edge.points = selfLoopRoute(nodeOf(graph, entity), options);
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
