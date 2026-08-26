/**
 * Edges that name a subgraph.
 *
 * Mermaid lets an edge point at a container — `A --> C` where `C` is a subgraph —
 * and the layout graph has nowhere to put it, because a container is not a node the
 * decomposition sees. `hola-faithful` drops such an edge and says so (guide §3.2),
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

import type { Point } from '../../../types.js';
import type { Edge, LayoutData, Node } from '../../types.js';
import type { Bounds } from '../hola-faithful/model.js';

/** Coordinates closer than this are the same coordinate. */
const EPS = 1e-6;

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
    const trimmed = [...ordered.slice(0, i + 1), crossing];
    return which === 'end' ? trimmed : trimmed.reverse();
  }

  return [...points];
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
