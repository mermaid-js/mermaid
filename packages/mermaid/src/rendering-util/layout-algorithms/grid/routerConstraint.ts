import type { Point } from '../../../types.js';
import type { Node } from '../../types.js';
import { normalizePolyline } from '../layout-utils/geometry.js';
import { rectForNode } from '../layout-utils/helpers.js';
import {
  LANE_SEPARATION_PX,
  TERMINAL_APPROACH_PX,
  type EndpointCandidate,
} from './routerPlanning.js';
import { ROUTE_CLEARANCE_PX } from './routerTopology.js';
import type {
  GridContainerId,
  GridLayoutResult,
  GridOrientation,
  RouterPoint,
  RouterRect,
} from './types.js';
import { isEdgeLabelNode } from './types.js';

// Centralizes post-route validity checks so sparse routes, compatibility fallbacks, and bundle
// retries all enforce the same obstacle-clearance and lane-separation contract.
export function isPairSeparationError(error: unknown): boolean {
  if (!(error instanceof Error) || !('details' in error)) {
    return false;
  }
  const details = error.details;
  return (
    typeof details === 'object' &&
    details !== null &&
    'reason' in details &&
    details.reason === 'pair-separation'
  );
}

export function routerRect(node: Node): RouterRect {
  const rect = rectForNode(node);
  return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
}

function segmentEntersRect(a: Point, b: Point, rect: RouterRect): boolean {
  if (a.y === b.y) {
    return (
      a.y > rect.top &&
      a.y < rect.bottom &&
      Math.max(a.x, b.x) > rect.left &&
      Math.min(a.x, b.x) < rect.right
    );
  }
  if (a.x === b.x) {
    return (
      a.x > rect.left &&
      a.x < rect.right &&
      Math.max(a.y, b.y) > rect.top &&
      Math.min(a.y, b.y) < rect.bottom
    );
  }
  return true;
}

function inflatedRect(node: Node): RouterRect {
  const rect = routerRect(node);
  return {
    left: rect.left - ROUTE_CLEARANCE_PX,
    right: rect.right + ROUTE_CLEARANCE_PX,
    top: rect.top - ROUTE_CLEARANCE_PX,
    bottom: rect.bottom + ROUTE_CLEARANCE_PX,
  };
}

export function validateSameContainerRoute(
  points: readonly Point[],
  source: Node,
  target: Node,
  containerId: GridContainerId,
  result: GridLayoutResult
): boolean {
  // Terminal segments may touch their own endpoint rectangles, but must leave them directly and
  // every other segment must remain outside clearance-inflated child geometry.
  const normalized = normalizePolyline([...points]);
  if (
    normalized.points.length < 2 ||
    normalized.points.some(({ x, y }) => !Number.isFinite(x) || !Number.isFinite(y)) ||
    normalized.segments.some(({ orientation }) => orientation === 'Z')
  ) {
    return false;
  }
  if (
    normalized.segments.length > 1 &&
    (Math.abs(normalized.segments[0].a.x - normalized.segments[0].b.x) +
      Math.abs(normalized.segments[0].a.y - normalized.segments[0].b.y) <
      TERMINAL_APPROACH_PX ||
      Math.abs(normalized.segments.at(-1)!.a.x - normalized.segments.at(-1)!.b.x) +
        Math.abs(normalized.segments.at(-1)!.a.y - normalized.segments.at(-1)!.b.y) <
        TERMINAL_APPROACH_PX)
  ) {
    return false;
  }
  const children = (result.forest.childrenByParent.get(containerId) ?? []).filter(
    (node) => !isEdgeLabelNode(node)
  );
  for (const obstacle of children) {
    const rect = inflatedRect(obstacle);
    for (let index = 0; index < normalized.points.length - 1; index++) {
      const terminalObstacle =
        (obstacle.id === source.id && index === 0) ||
        (obstacle.id === target.id && index === normalized.points.length - 2);
      if (terminalObstacle) {
        if (
          segmentEntersRect(
            normalized.points[index],
            normalized.points[index + 1],
            routerRect(obstacle)
          )
        ) {
          return false;
        }
        continue;
      }
      if (segmentEntersRect(normalized.points[index], normalized.points[index + 1], rect)) {
        return false;
      }
    }
  }
  return true;
}

export function validateContainerSegment(
  points: readonly Point[],
  startOwnerId: string,
  endOwnerId: string,
  containerId: GridContainerId,
  result: GridLayoutResult
): boolean {
  const normalized = normalizePolyline([...points]);
  if (
    normalized.points.length < 2 ||
    normalized.points.some(({ x, y }) => !Number.isFinite(x) || !Number.isFinite(y)) ||
    normalized.segments.some(({ orientation }) => orientation === 'Z')
  ) {
    return false;
  }
  const children = (result.forest.childrenByParent.get(containerId) ?? []).filter(
    (node) => !isEdgeLabelNode(node)
  );
  for (const obstacle of children) {
    const rect = inflatedRect(obstacle);
    for (let index = 0; index < normalized.points.length - 1; index++) {
      const terminalObstacle =
        (obstacle.id === startOwnerId && index === 0) ||
        (obstacle.id === endOwnerId && index === normalized.points.length - 2);
      if (terminalObstacle) {
        if (
          segmentEntersRect(
            normalized.points[index],
            normalized.points[index + 1],
            routerRect(obstacle)
          )
        ) {
          return false;
        }
        continue;
      }
      if (segmentEntersRect(normalized.points[index], normalized.points[index + 1], rect)) {
        return false;
      }
    }
  }
  return true;
}

interface OrthogonalSegment {
  a: Point;
  b: Point;
  orientation: GridOrientation;
}

function segmentSpan(segment: OrthogonalSegment): { low: number; high: number } {
  return segment.orientation === 'H'
    ? { low: Math.min(segment.a.x, segment.b.x), high: Math.max(segment.a.x, segment.b.x) }
    : { low: Math.min(segment.a.y, segment.b.y), high: Math.max(segment.a.y, segment.b.y) };
}

function nonterminalSegments(points: readonly Point[]): OrthogonalSegment[] {
  const segments = normalizePolyline([...points])
    .segments.filter((segment) => segment.orientation !== 'Z')
    .map((segment) => ({
      a: { ...segment.a },
      b: { ...segment.b },
      orientation: segment.orientation as GridOrientation,
    }));
  if (segments.length === 0) {
    return [];
  }
  if (
    segments.length === 1 &&
    Math.abs(segments[0].a.x - segments[0].b.x) + Math.abs(segments[0].a.y - segments[0].b.y) <=
      TERMINAL_APPROACH_PX * 2
  ) {
    return [];
  }
  // Pair lanes may share the short attachment stubs at nodes. Trim those stubs before measuring
  // corridor overlap so only the independently routable interior is constrained.
  const trim = (segment: OrthogonalSegment, atStart: boolean): void => {
    if (segment.orientation === 'H') {
      const direction = Math.sign(segment.b.x - segment.a.x);
      if (atStart) {
        segment.a.x += direction * TERMINAL_APPROACH_PX;
      } else {
        segment.b.x -= direction * TERMINAL_APPROACH_PX;
      }
    } else {
      const direction = Math.sign(segment.b.y - segment.a.y);
      if (atStart) {
        segment.a.y += direction * TERMINAL_APPROACH_PX;
      } else {
        segment.b.y -= direction * TERMINAL_APPROACH_PX;
      }
    }
  };
  trim(segments[0], true);
  trim(segments[segments.length - 1], false);
  return segments.filter(({ a, b }) => a.x !== b.x || a.y !== b.y);
}

function pairSegmentsConflict(candidate: OrthogonalSegment, committed: OrthogonalSegment): boolean {
  if (candidate.orientation !== committed.orientation) {
    return false;
  }
  const first = segmentSpan(candidate);
  const second = segmentSpan(committed);
  const overlap = Math.max(0, Math.min(first.high, second.high) - Math.max(first.low, second.low));
  if (overlap <= 0) {
    return false;
  }
  const separation =
    candidate.orientation === 'H'
      ? Math.abs(candidate.a.y - committed.a.y)
      : Math.abs(candidate.a.x - committed.a.x);
  // Collinear overlap is illegal when lanes coincide for a meaningful distance or are closer than
  // the configured lane spacing. Endpoint-only contact has zero overlap and remains legal.
  return (
    (separation === 0 && overlap >= LANE_SEPARATION_PX) ||
    (separation > 0 && separation < LANE_SEPARATION_PX)
  );
}

export function routeSatisfiesPairConstraints(
  points: readonly Point[],
  pairRoutes: readonly (readonly Point[])[]
): boolean {
  const normalized = normalizePolyline([...points]).points;
  const candidatePorts = [normalized[0], normalized.at(-1)!];
  const candidateSegments = nonterminalSegments(normalized);
  return pairRoutes.every((route) => {
    const committed = normalizePolyline([...route]).points;
    const committedPorts = [committed[0], committed.at(-1)!];
    if (
      candidatePorts.some((port) =>
        committedPorts.some((other) => port.x === other.x && port.y === other.y)
      )
    ) {
      return false;
    }
    return candidateSegments.every((candidate) =>
      nonterminalSegments(committed).every(
        (committedSegment) => !pairSegmentsConflict(candidate, committedSegment)
      )
    );
  });
}

export function routeHasDistinctPairPorts(
  points: readonly Point[],
  pairRoutes: readonly (readonly Point[])[]
): boolean {
  const normalized = normalizePolyline([...points]).points;
  const candidatePorts = [normalized[0], normalized.at(-1)!];
  return pairRoutes.every((route) => {
    const committed = normalizePolyline([...route]).points;
    const committedPorts = [committed[0], committed.at(-1)!];
    return !candidatePorts.some((port) =>
      committedPorts.some((other) => port.x === other.x && port.y === other.y)
    );
  });
}

export function pairArcAllowed(
  from: RouterPoint,
  to: RouterPoint,
  pairRoutes: readonly (readonly Point[])[]
): boolean {
  const orientation: GridOrientation = from.y === to.y ? 'H' : 'V';
  const candidate = { a: from, b: to, orientation };
  return pairRoutes.every((route) =>
    nonterminalSegments(route).every(
      (committedSegment) => !pairSegmentsConflict(candidate, committedSegment)
    )
  );
}

export function endpointPairLowerBound(
  source: EndpointCandidate,
  target: EndpointCandidate
): readonly [length: number, bends: number] {
  // This admissible lower bound includes both terminal stubs and the minimum bend count implied by
  // endpoint orientations; candidate-pair search can safely prune against it.
  const sourceOrientation: GridOrientation =
    source.side === 'left' || source.side === 'right' ? 'H' : 'V';
  const targetOrientation: GridOrientation =
    target.side === 'left' || target.side === 'right' ? 'H' : 'V';
  const dx = Math.abs(source.connect.x - target.connect.x);
  const dy = Math.abs(source.connect.y - target.connect.y);
  let bends: number;
  if (dx === 0 || dy === 0) {
    const pathOrientation: GridOrientation = dx === 0 ? 'V' : 'H';
    bends =
      Number(sourceOrientation !== pathOrientation) + Number(targetOrientation !== pathOrientation);
  } else {
    bends = Math.min(
      Number(sourceOrientation !== 'H') + 1 + Number(targetOrientation !== 'V'),
      Number(sourceOrientation !== 'V') + 1 + Number(targetOrientation !== 'H')
    );
  }
  return [TERMINAL_APPROACH_PX * 2 + dx + dy, bends];
}
