/**
 * Edges that name a subgraph.
 *
 * Mermaid lets an edge point at a container — `A --> C` where `C` is a subgraph —
 * and the layout graph has nowhere to put it, because a container is not a node the
 * decomposition sees. The `core/` stage drops such an edge and says so (guide §3.2),
 * which is the right answer for a layout that does not draw containers. Here it is
 * the wrong one twice over: the connection disappears from the diagram, and the
 * graph loses an edge that was holding the container's members together, so they
 * fall into separate components and scatter.
 *
 * So the edge is kept, in two steps that happen at opposite ends of the pipeline.
 *
 * **Before the topology is built**, the container endpoint is moved to one of its
 * members. That is what puts the edge back into the graph: the decomposition, the
 * core and the trees all see an ordinary edge between two leaves, and the container
 * stops being a hole in the connectivity.
 *
 * **After everything is drawn**, the endpoint is put back and the drawn route is cut
 * where it crosses the container's frame. What the reader sees is then what Mermaid
 * means by the syntax — an arrow meeting the box — while every stage in between
 * worked on a graph it understands.
 *
 * The member chosen is the first in input order rather than the nearest one, because
 * the choice has to be made before anything has a position. It affects which side
 * the route approaches from and nothing else: the route is cut at the frame either
 * way.
 */

import type { Point } from '../../../../types.js';
import type { Edge, LayoutData, Node } from '../../../types.js';
import type { Bounds, Rect } from '../core/model.js';
import type { GridAttachedOptions } from './options.js';
import type { RouterConfig, RouterObstacle } from '../core/routing/orthogonalRouter.js';
import { routeAlternatives } from '../core/routing/orthogonalRouter.js';
import { polylineHitsBounds } from './geometry.js';

/** Coordinates closer than this are the same coordinate. */
const EPS = 1e-6;
/**
 * The final leg must hold the point marker's 4px line offset, the rounded path's
 * 8px terminal stub, and an 8px curved approach. Anything shorter either
 * collapses to a zero-length leg at paint time or leaves the final corner sharp.
 */
const MIN_FRAME_TERMINAL_RUN = 20;

/** One edge whose endpoint named a container, and what it named. */
export interface ContainerEdge {
  edge: Edge;
  /** Container the start named, if it named one. */
  startContainer?: string;
  /** Container the end named, if it named one. */
  endContainer?: string;
}

/**
 * Move every container endpoint onto a member, in place, and report what was moved.
 *
 * An edge whose two endpoints resolve to the same member is left alone and reported
 * as unresolvable: a container and something inside it are not two places, so there
 * is no line to draw between them.
 */
export function redirectContainerEdges(data: LayoutData): {
  redirected: ContainerEdge[];
  unresolvable: Edge[];
} {
  const nodes = data.nodes ?? [];
  const containers = new Set(nodes.filter((node) => node.isGroup === true).map((node) => node.id));
  if (containers.size === 0) {
    return { redirected: [], unresolvable: [] };
  }

  const memberOf = representativeMembers(nodes, containers);
  const redirected: ContainerEdge[] = [];
  const unresolvable: Edge[] = [];

  for (const edge of data.edges ?? []) {
    const startContainer =
      edge.start !== undefined && containers.has(edge.start) ? edge.start : undefined;
    const endContainer = edge.end !== undefined && containers.has(edge.end) ? edge.end : undefined;
    if (startContainer === undefined && endContainer === undefined) {
      continue;
    }

    const start = startContainer ? memberOf.get(startContainer) : edge.start;
    const end = endContainer ? memberOf.get(endContainer) : edge.end;
    // A container with nothing in it has no member to stand in for it, and an edge
    // from a container to its own child collapses to a node pointing at itself.
    if (start === undefined || end === undefined || start === end) {
      unresolvable.push(edge);
      continue;
    }

    redirected.push({ edge, startContainer, endContainer });
    edge.start = start;
    edge.end = end;
  }

  return { redirected, unresolvable };
}

/**
 * Put the container endpoints back and cut each route at the frame it should meet.
 *
 * `frames` holds only the containers that were actually drawn. An edge naming one
 * that was not keeps the member it was redirected to: that is where the line
 * genuinely ends, and pointing it at a box nobody drew would be worse.
 */
export function restoreContainerEdges(
  redirected: readonly ContainerEdge[],
  frames: ReadonlyMap<string, Bounds>
): void {
  for (const { edge, startContainer, endContainer } of redirected) {
    if (startContainer !== undefined) {
      edge.start = startContainer;
    }
    if (endContainer !== undefined) {
      edge.end = endContainer;
    }

    if (!edge.points || edge.points.length < 2) {
      continue;
    }
    let route: Point[] = edge.points;

    // The end first, so trimming the start cannot invalidate an index into the tail.
    if (endContainer !== undefined) {
      const frame = frames.get(endContainer);
      if (frame) {
        route = trimToFrame(route, frame, 'end');
      }
    }
    if (startContainer !== undefined) {
      const frame = frames.get(startContainer);
      if (frame) {
        route = trimToFrame(route, frame, 'start');
      }
    }
    edge.points = route;

    // The label was placed along the untrimmed route, by a pass that weighed it
    // against every node and every other route in the drawing. That work is worth
    // keeping: it is only wrong if the trim took away the part of the route the
    // label was sitting on, which leaves it inside a frame its edge stops at.
    const orphaned =
      edge.x !== undefined &&
      edge.y !== undefined &&
      [startContainer, endContainer].some((id) => {
        const frame = id !== undefined ? frames.get(id) : undefined;
        return frame !== undefined && inside({ x: edge.x!, y: edge.y! }, frame);
      });
    if (orphaned) {
      const middle = route[Math.floor(route.length / 2)];
      if (middle) {
        edge.x = middle.x;
        edge.y = middle.y;
      }
    }
  }
}

/**
 * Re-route every visible edge that passes through a frame neither endpoint owns.
 *
 * Container edges are the conspicuous case because they are restored after the
 * topology route was drawn, but ordinary leaf-to-leaf edges can make the same
 * mistake once a sibling frame is fitted. A route may use its own frame and common
 * ancestor frames; a sibling frame is always an obstacle.
 */
export function rerouteEdgesAroundForeignFrames(
  edges: readonly Edge[],
  frames: ReadonlyMap<string, Bounds>,
  nodes: readonly Node[],
  options: GridAttachedOptions
): void {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const reroute = edges.filter((edge) => {
    if (edge.isLayoutOnly || !edge.points || edge.points.length < 2) {
      return false;
    }
    const foreignFrames = framesForOtherSubgraphs(edge, frames, nodeById);
    return foreignFrames.some(({ bounds }) => polylineHitsBounds(edge.points!, bounds));
  });
  const rerouted = new Set(reroute);
  const reservedPorts = new Map<string, Point[]>();
  for (const edge of edges) {
    if (!rerouted.has(edge)) {
      reserveRoutePorts(edge, nodeById, reservedPorts);
    }
  }

  for (const edge of reroute) {
    const foreignFrames = framesForOtherSubgraphs(edge, frames, nodeById);
    const rerouted = routeAroundForeignFrames(
      edge,
      nodeById,
      foreignFrames,
      options,
      reservedPorts
    );
    if (rerouted) {
      edge.points = rerouted;
    }
    reserveRoutePorts(edge, nodeById, reservedPorts);
  }
}

interface FrameObstacle {
  id: string;
  bounds: Bounds;
}

/** Distinguish frame obstacles from leaf nodes, whose ids are public Mermaid ids. */
const FRAME_OBSTACLE_PREFIX = '__hola-frame__:';

/** Minimum separation between two boundary attachment points on one node. */
const PORT_SEPARATION = 8;

/**
 * Frames which neither endpoint owns or belongs to. An edge may enter its own
 * container, and it may live inside a common parent; crossing a sibling frame is
 * never a meaningful connection and must be avoided.
 */
function framesForOtherSubgraphs(
  edge: Edge,
  frames: ReadonlyMap<string, Bounds>,
  nodes: ReadonlyMap<string, Node>
): FrameObstacle[] {
  const permitted = permittedFrameIds(edge, nodes);
  return [...frames].filter(([id]) => !permitted.has(id)).map(([id, bounds]) => ({ id, bounds }));
}

function permittedFrameIds(edge: Edge, nodes: ReadonlyMap<string, Node>): Set<string> {
  const permitted = new Set<string>();
  for (const id of [edge.start, edge.end]) {
    for (const ancestor of containerAncestors(id, nodes)) {
      permitted.add(ancestor);
    }
  }
  return permitted;
}

function containerAncestors(id: string | undefined, nodes: ReadonlyMap<string, Node>): string[] {
  const ancestors: string[] = [];
  const seen = new Set<string>();
  let current = id;
  while (current !== undefined && !seen.has(current)) {
    seen.add(current);
    const node = nodes.get(current);
    if (node?.isGroup === true) {
      ancestors.push(current);
    }
    current = node?.parentId;
  }
  return ancestors;
}

/**
 * Re-route an edge after the frame geometry is available.
 *
 * The core router runs before frames exist, so it cannot know that a sibling frame
 * will eventually cover one of its rails. Here both endpoint boxes and the finished
 * sibling frames are known. The same orthogonal router can therefore choose a clean
 * channel without disturbing nodes, placement, or routes that already clear every
 * frame.
 */
function routeAroundForeignFrames(
  edge: Edge,
  nodes: ReadonlyMap<string, Node>,
  foreignFrames: readonly FrameObstacle[],
  options: GridAttachedOptions,
  reservedPorts: ReadonlyMap<string, readonly Point[]> = new Map()
): Point[] | undefined {
  const source = endpointObstacle(edge.start, nodes);
  const target = endpointObstacle(edge.end, nodes);
  if (!source || !target || source.id === target.id) {
    return undefined;
  }

  const obstacles = new Map<string, RouterObstacle>();
  for (const node of nodes.values()) {
    if (node.isGroup === true || !isMeasurable(node)) {
      continue;
    }
    obstacles.set(`node:${node.id}`, {
      id: `node:${node.id}`,
      rect: rectOfNode(node),
    });
  }
  for (const frame of foreignFrames) {
    obstacles.set(`${FRAME_OBSTACLE_PREFIX}${frame.id}`, {
      id: `${FRAME_OBSTACLE_PREFIX}${frame.id}`,
      rect: rectOfBounds(frame.bounds),
    });
  }
  obstacles.set(source.id, source);
  obstacles.set(target.id, target);

  const config: RouterConfig = {
    clearance: options.routingClearance,
    bendPenalty: options.routingBendPenalty,
    crossingPenalty: options.routingCrossingPenalty,
    maxExpansions: options.routingMaxExpansions,
  };
  const portSeparation = Math.max(PORT_SEPARATION, config.clearance);
  let best: Point[] | undefined;
  let bestCost = Infinity;
  let fallback: Point[] | undefined;
  let fallbackDistance = -Infinity;
  let fallbackCost = Infinity;
  for (const sourcePortOffset of portOffsets(source, foreignFrames, config.clearance)) {
    for (const targetPortOffset of portOffsets(target, foreignFrames, config.clearance)) {
      const alternatives = routeAlternatives(
        {
          edgeId: edge.id,
          source,
          target,
          obstacles: [...obstacles.values()],
          sourcePortOffset,
          targetPortOffset,
        },
        config
      );
      for (const candidate of alternatives) {
        const distance = routePortClearance(candidate.points, source, target, reservedPorts);
        if (
          distance > fallbackDistance + EPS ||
          (Math.abs(distance - fallbackDistance) < EPS && candidate.cost < fallbackCost)
        ) {
          fallback = candidate.points;
          fallbackDistance = distance;
          fallbackCost = candidate.cost;
        }
        if (distance >= portSeparation && candidate.cost < bestCost) {
          best = candidate.points;
          bestCost = candidate.cost;
        }
      }
    }
  }
  return best ?? fallback;
}

function reserveRoutePorts(
  edge: Edge,
  nodes: ReadonlyMap<string, Node>,
  reserved: Map<string, Point[]>
): void {
  const points = edge.points;
  if (!points || points.length < 2) {
    return;
  }
  const source = endpointObstacle(edge.start, nodes);
  const target = endpointObstacle(edge.end, nodes);
  if (source) {
    reservePort(reserved, source.id, points[0]);
  }
  if (target) {
    reservePort(reserved, target.id, points.at(-1)!);
  }
}

function reservePort(reserved: Map<string, Point[]>, obstacleId: string, point: Point): void {
  const ports = reserved.get(obstacleId);
  if (ports) {
    ports.push(point);
  } else {
    reserved.set(obstacleId, [point]);
  }
}

function routePortClearance(
  points: readonly Point[],
  source: RouterObstacle,
  target: RouterObstacle,
  reserved: ReadonlyMap<string, readonly Point[]>
): number {
  const start = points[0];
  const end = points.at(-1);
  if (!start || !end) {
    return -Infinity;
  }
  return Math.min(
    clearanceFromReservedPort(start, reserved.get(source.id)),
    clearanceFromReservedPort(end, reserved.get(target.id))
  );
}

function clearanceFromReservedPort(point: Point, ports: readonly Point[] | undefined): number {
  if (!ports || ports.length === 0) {
    return Infinity;
  }
  return Math.min(...ports.map((port) => Math.hypot(point.x - port.x, point.y - port.y)));
}

function endpointObstacle(
  id: string | undefined,
  nodes: ReadonlyMap<string, Node>
): RouterObstacle | undefined {
  if (id === undefined) {
    return undefined;
  }
  const node = nodes.get(id);
  if (node && node.isGroup !== true && isMeasurable(node)) {
    return { id: `node:${id}`, rect: rectOfNode(node) };
  }
  const group = node && node.isGroup === true ? node : undefined;
  if (!group || !isMeasurable(group)) {
    return undefined;
  }
  return { id: `${FRAME_OBSTACLE_PREFIX}${id}`, rect: rectOfNode(group) };
}

function portOffsets(
  obstacle: RouterObstacle,
  foreignFrames: readonly FrameObstacle[],
  clearance: number
): number[] {
  const spacing = Math.max(PORT_SEPARATION, clearance);
  const offsets = new Set<number>([0, -spacing, spacing, -2 * spacing, 2 * spacing]);
  for (const { bounds } of foreignFrames) {
    offsets.add(bounds.minX - obstacle.rect.x - clearance - 1);
    offsets.add(bounds.maxX - obstacle.rect.x + clearance + 1);
    offsets.add(bounds.minY - obstacle.rect.y - clearance - 1);
    offsets.add(bounds.maxY - obstacle.rect.y + clearance + 1);
  }
  return [...offsets];
}

function isMeasurable(
  node: Node
): node is Node & Required<Pick<Node, 'x' | 'y' | 'width' | 'height'>> {
  return (
    node.x !== undefined &&
    node.y !== undefined &&
    node.width !== undefined &&
    node.height !== undefined
  );
}

function rectOfNode(node: Node & Required<Pick<Node, 'x' | 'y' | 'width' | 'height'>>): Rect {
  return { x: node.x, y: node.y, width: node.width, height: node.height };
}

function rectOfBounds(bounds: Bounds): Rect {
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
  };
}

/**
 * Cut a polyline where it first meets `frame`, approaching from `which` end.
 *
 * The route runs from outside the frame to a member inside it, so walking in from
 * the far end there is exactly one place where it crosses the border. Everything
 * past that point is inside the box and is dropped; the crossing becomes the new
 * endpoint, which is where the arrowhead belongs.
 *
 * A route that is inside the frame from the outset — both endpoints enclosed — has
 * no crossing to find and is returned unchanged.
 */
function trimToFrame(points: readonly Point[], frame: Bounds, which: 'start' | 'end'): Point[] {
  const ordered = which === 'end' ? [...points] : [...points].reverse();
  if (inside(ordered[0], frame)) {
    return [...points];
  }

  for (let i = 0; i + 1 < ordered.length; i++) {
    const from = ordered[i];
    const to = ordered[i + 1];
    if (!inside(to, frame)) {
      continue;
    }
    const crossing = borderCrossing(from, to, frame);
    const trimmed = extendFrameTerminalRun([...ordered.slice(0, i + 1), crossing]);
    return which === 'end' ? trimmed : trimmed.reverse();
  }

  return [...points];
}

/**
 * Keep enough of the outside corridor before a frame border for the final
 * arrowhead. Trimming can otherwise leave a 4px leg between the last bend and
 * the frame; marker shortening consumes all of it and makes the arrow point
 * along the preceding horizontal/vertical run.
 *
 * The route is ordered from the visible outside endpoint towards the frame. Its
 * last bend is a whole horizontal or vertical corridor, so moving that corridor
 * outward preserves every segment's orthogonality while making the final leg
 * long enough to survive rounded painting.
 */
function extendFrameTerminalRun(points: readonly Point[]): Point[] {
  if (points.length < 3) {
    return [...points];
  }

  const route = points.map((point) => ({ ...point }));
  const end = route.at(-1)!;
  const beforeEnd = route.at(-2)!;
  const vertical = Math.abs(end.x - beforeEnd.x) < EPS;
  const horizontal = Math.abs(end.y - beforeEnd.y) < EPS;
  if (!vertical && !horizontal) {
    return route;
  }

  const axis = vertical ? 'y' : 'x';
  const terminalLength = Math.abs(beforeEnd[axis] - end[axis]);
  if (terminalLength >= MIN_FRAME_TERMINAL_RUN) {
    return route;
  }

  const outward = Math.sign(beforeEnd[axis] - end[axis]);
  if (outward === 0) {
    return route;
  }
  const corridorCoordinate = end[axis] + outward * MIN_FRAME_TERMINAL_RUN;

  // Walk back over the corridor that leads into the final leg. Its points all
  // share the same along-axis coordinate; shifting only that plateau retains
  // a sequence of Manhattan segments.
  let beforeCorridor = route.length - 2;
  while (beforeCorridor >= 0 && Math.abs(route[beforeCorridor][axis] - beforeEnd[axis]) < EPS) {
    beforeCorridor--;
  }
  if (beforeCorridor < 0) {
    return route;
  }

  // The preceding leg must already reach the new corridor coordinate. Otherwise
  // moving the bend would make a needless U-turn beside the frame.
  if (outward * (route[beforeCorridor][axis] - end[axis]) < MIN_FRAME_TERMINAL_RUN) {
    return route;
  }

  for (let index = beforeCorridor + 1; index < route.length - 1; index++) {
    route[index][axis] = corridorCoordinate;
  }
  return route;
}

function inside(point: Point, frame: Bounds): boolean {
  return (
    point.x > frame.minX - EPS &&
    point.x < frame.maxX + EPS &&
    point.y > frame.minY - EPS &&
    point.y < frame.maxY + EPS
  );
}

/**
 * Where the segment from `outside` to `inside` meets the frame's border.
 *
 * Routes here are orthogonal, so the segment is axis-aligned and the crossing is
 * the border coordinate on the axis it travels along. A diagonal segment — which a
 * straight core edge can still be — is handled by the same parametric form.
 */
function borderCrossing(outside: Point, insidePoint: Point, frame: Bounds): Point {
  const dx = insidePoint.x - outside.x;
  const dy = insidePoint.y - outside.y;

  let best = 1;
  for (const [from, to, low, high] of [
    [outside.x, dx, frame.minX, frame.maxX],
    [outside.y, dy, frame.minY, frame.maxY],
  ] as const) {
    if (Math.abs(to) < EPS) {
      continue;
    }
    for (const border of [low, high]) {
      const t = (border - from) / to;
      if (t >= -EPS && t <= 1 + EPS) {
        best = Math.min(best, Math.max(0, t));
      }
    }
  }

  return { x: outside.x + dx * best, y: outside.y + dy * best };
}

/**
 * One member per container, by input order, walking down through nested containers
 * so a container holding nothing but other containers still resolves.
 */
function representativeMembers(
  nodes: readonly Node[],
  containers: ReadonlySet<string>
): Map<string, string> {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const memberOf = new Map<string, string>();

  for (const node of nodes) {
    if (node.isGroup === true) {
      continue;
    }
    // Every container above this leaf can use it, and the first leaf reached in
    // input order is the one each of them keeps.
    const seen = new Set<string>();
    let parentId = node.parentId;
    while (parentId !== undefined && !seen.has(parentId)) {
      seen.add(parentId);
      if (containers.has(parentId) && !memberOf.has(parentId)) {
        memberOf.set(parentId, node.id);
      }
      parentId = byId.get(parentId)?.parentId;
    }
  }

  return memberOf;
}
