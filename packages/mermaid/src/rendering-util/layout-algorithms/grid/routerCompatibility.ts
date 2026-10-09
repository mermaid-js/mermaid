import type { Point } from '../../../types.js';
import type { Node } from '../../types.js';
import { normalizePolyline } from '../layout-utils/geometry.js';
import { manhattanLength, polylineIntersectsRect, rectForNode } from '../layout-utils/helpers.js';
import type { Rect } from '../layout-utils/types.js';
import { isAncestorGroup } from './groups.js';
import { GRID_LABEL_CLEARANCE, type GridLabelSpanRequirement } from './labelGeometry.js';
import type { GridRoutingTestOptions } from './router.js';
import {
  routerRect,
  validateContainerSegment,
  validateSameContainerRoute,
} from './routerConstraint.js';
import { RouteOccupancyIndex } from './routerOccupancy.js';
import {
  LANE_SEPARATION_PX,
  TERMINAL_APPROACH_PX,
  ownerGroupTitle,
  ownerSideKey,
  type EdgeEndpointPlan,
  type EdgeRoutePlan,
  type PreparedEdgeRoutes,
} from './routerPlanning.js';
import {
  GridRoutingResourceLimitError,
  type GridRoutingInstrumentation,
} from './routerInstrumentation.js';
import {
  buildContainerRoutingTopology,
  DEFAULT_MAX_ROUTING_ESTIMATED_BYTES,
  derivePortalRanges,
  ROUTE_CLEARANCE_PX,
} from './routerTopology.js';
import type {
  GridAttachment,
  GridContainerId,
  GridLayoutResult,
  GridRoutingContext,
  GridSide,
  PairedPortal,
  PortalRange,
  RouterRect,
} from './types.js';
import { ROOT_CONTAINER_ID, gridError, isEdgeLabelNode } from './types.js';

// Deterministic corridor routing remains the validated fast path and the resource-limit fallback
// while sparse visibility routing is incrementally adopted for harder routes.
const ROOT_OUTER_MARGIN = 24;

export const SELF_LOOP_PORT_GAP = 18;

const SELF_LOOP_APPROACH = 14;

const SELF_LOOP_TRACK_GAP = 18;

export const SELF_LOOP_PORT_OFFSET_STEP = 4;

export interface PreparedRoutingModes {
  compatibilityFastRoutes: Map<string, Point[]>;
  sparseHierarchyIds: Set<string>;
  sparseLcaIds: Set<string>;
  routedContainerIds: GridContainerId[];
  routeOccupancy: Map<GridContainerId, RouteOccupancyIndex>;
}

const MAX_PLANS_FOR_OVERLAP_DEMOTION = 64;
const MAX_FAST_ROUTE_SEPARATION_STEPS = 4;

/**
 * Moves one interior segment of a minimal corridor route sideways until it no longer shares a
 * corridor with another edge's route. Shifting an interior segment keeps both terminal stubs and
 * the Manhattan length, so the result is accepted only if it still passes the caller's validation.
 */
function separateRouteFromOccupied(
  route: readonly Point[],
  occupancy: RouteOccupancyIndex,
  pairKey: string,
  isAcceptable: (candidate: Point[]) => boolean
): Point[] | undefined {
  if (!occupancy.conflictsWithRoute(route, pairKey)) {
    return [...route];
  }
  const points = normalizePolyline([...route]).points;
  for (let step = 1; step <= MAX_FAST_ROUTE_SEPARATION_STEPS; step++) {
    for (const sign of [1, -1]) {
      const delta = sign * step * LANE_SEPARATION_PX;
      for (let index = 1; index < points.length - 2; index++) {
        const vertical = points[index].x === points[index + 1].x;
        const shifted = points.map((point, pointIndex) =>
          pointIndex === index || pointIndex === index + 1
            ? vertical
              ? { x: point.x + delta, y: point.y }
              : { x: point.x, y: point.y + delta }
            : point
        );
        if (!occupancy.conflictsWithRoute(shifted, pairKey) && isAcceptable(shifted)) {
          return shifted;
        }
      }
    }
  }
  return undefined;
}

function terminalStubsAreLongEnough(points: readonly Point[]): boolean {
  const stub = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  return (
    stub(points[0], points[1]) >= TERMINAL_APPROACH_PX &&
    stub(points.at(-1)!, points.at(-2)!) >= TERMINAL_APPROACH_PX
  );
}

export function boundedAlternativePortalCoordinates(
  selected: number,
  low: number,
  high: number,
  corridors: readonly number[],
  limit = 3
): number[] {
  // Retry the nearest established corridors first, then the range's canonical midpoint and ends.
  // The hard limit bounds hierarchy retry fan-out and keeps output independent of map iteration.
  const candidates = [
    ...corridors
      .filter((coordinate) => coordinate >= low && coordinate <= high)
      .sort((a, b) => Math.abs(a - selected) - Math.abs(b - selected) || a - b),
    (low + high) / 2,
    low,
    high,
  ];
  const seen = new Set<number>([selected]);
  const alternatives: number[] = [];
  for (const coordinate of candidates) {
    if (seen.has(coordinate)) {
      continue;
    }
    seen.add(coordinate);
    alternatives.push(coordinate);
    if (alternatives.length === limit) {
      break;
    }
  }
  return alternatives;
}

function equalPoint(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) <= 1e-6 && Math.abs(a.y - b.y) <= 1e-6;
}

export function areExactlyAxisAligned(a: Point, b: Point): boolean {
  return a.x === b.x || a.y === b.y;
}

function chooseIntermediateCoordinate(
  values: number[],
  start: number,
  end: number,
  variant: number
): number {
  const sorted = [...values].sort(
    (a, b) =>
      Math.abs(a - start) + Math.abs(a - end) - (Math.abs(b - start) + Math.abs(b - end)) || a - b
  );
  return sorted[Math.min(variant, Math.max(0, sorted.length - 1))] ?? (start + end) / 2;
}

function dedupeConsecutive(points: Point[]): Point[] {
  const out: Point[] = [];
  for (const point of points) {
    if (out.length === 0 || !equalPoint(out[out.length - 1], point)) {
      out.push(point);
    }
  }
  return out;
}

export function routeWithinContainer(
  containerId: GridContainerId,
  result: GridLayoutResult,
  start: GridAttachment,
  end: GridAttachment,
  variant: number
): Point[] {
  // This compatibility router only chooses among measured grid corridors. `variant` selects the
  // next deterministic dogleg when a bundle retry needs a different lane.
  const container = result.containers.get(containerId);
  if (!container) {
    throw gridError('GRID_ROUTE_NOT_FOUND', `Missing container layout "${containerId}"`);
  }

  const points: Point[] = [start.port, start.connect];
  if (start.orientation === 'V' && end.orientation === 'V') {
    if (
      !equalPoint(start.connect, end.connect) &&
      Math.abs(start.connect.x - end.connect.x) > 1e-6
    ) {
      const y = chooseIntermediateCoordinate(
        container.horizontalCorridors,
        start.connect.y,
        end.connect.y,
        variant
      );
      points.push({ x: start.connect.x, y }, { x: end.connect.x, y });
    } else if (
      !equalPoint(start.connect, end.connect) &&
      Math.abs(start.connect.y - end.connect.y) > 1e-6 &&
      variant > 0
    ) {
      const alternateCorridors = container.verticalCorridors.filter(
        (value) => Math.abs(value - start.connect.x) > 1e-6
      );
      const x = chooseIntermediateCoordinate(
        alternateCorridors.length > 0 ? alternateCorridors : container.verticalCorridors,
        start.connect.x,
        end.connect.x,
        variant - 1
      );
      points.push({ x, y: start.connect.y }, { x, y: end.connect.y });
    }
  } else if (start.orientation === 'H' && end.orientation === 'H') {
    if (
      !equalPoint(start.connect, end.connect) &&
      Math.abs(start.connect.y - end.connect.y) > 1e-6
    ) {
      const x = chooseIntermediateCoordinate(
        container.verticalCorridors,
        start.connect.x,
        end.connect.x,
        variant
      );
      points.push({ x, y: start.connect.y }, { x, y: end.connect.y });
    }
  } else if (start.orientation === 'V' && end.orientation === 'H') {
    points.push({ x: start.connect.x, y: end.connect.y });
  } else {
    points.push({ x: end.connect.x, y: start.connect.y });
  }
  points.push(end.connect, end.port);
  return normalizePolyline(dedupeConsecutive(points)).points;
}

export function itemAttachment(
  ownerId: string,
  side: GridSide,
  demandKey: string,
  containerId: GridContainerId,
  result: GridLayoutResult,
  demandCoords: Map<string, number>,
  coordinate?: number
): GridAttachment {
  const owner = result.forest.nodeById.get(ownerId);
  const item = result.itemMeta.get(ownerId);
  if (!owner || !item || item.containerId !== containerId) {
    throw gridError(
      'GRID_ROUTE_NOT_FOUND',
      `Missing item metadata for "${ownerId}" in "${containerId}"`
    );
  }

  const rect = rectForNode(owner);
  const coord =
    coordinate ??
    demandCoords.get(demandKey) ??
    (side === 'left' || side === 'right' ? rect.cy : rect.cx);
  switch (side) {
    case 'left':
      return {
        port: { x: rect.left, y: coord },
        connect: { x: item.leftCorridorX, y: coord },
        orientation: 'V',
        side,
      };
    case 'right':
      return {
        port: { x: rect.right, y: coord },
        connect: { x: item.rightCorridorX, y: coord },
        orientation: 'V',
        side,
      };
    case 'top':
      return {
        port: { x: coord, y: rect.top },
        connect: { x: coord, y: item.topCorridorY },
        orientation: 'H',
        side,
      };
    case 'bottom':
      return {
        port: { x: coord, y: rect.bottom },
        connect: { x: coord, y: item.bottomCorridorY },
        orientation: 'H',
        side,
      };
  }
}

export function boundaryAttachment(
  containerId: GridContainerId,
  side: GridSide,
  demandKey: string,
  result: GridLayoutResult,
  demandCoords: Map<string, number>
): GridAttachment {
  const owner = result.forest.nodeById.get(containerId);
  const container = result.containers.get(containerId);
  if (!owner || !container) {
    throw gridError('GRID_ROUTE_NOT_FOUND', `Missing boundary metadata for "${containerId}"`);
  }
  const rect = rectForNode(owner);
  const coord =
    demandCoords.get(demandKey) ?? (side === 'left' || side === 'right' ? rect.cy : rect.cx);
  switch (side) {
    case 'left':
      return {
        port: { x: rect.left, y: coord },
        connect: { x: container.verticalCorridors[0], y: coord },
        orientation: 'V',
        side,
      };
    case 'right':
      return {
        port: { x: rect.right, y: coord },
        connect: {
          x: container.verticalCorridors[container.verticalCorridors.length - 1],
          y: coord,
        },
        orientation: 'V',
        side,
      };
    case 'top':
      return {
        port: { x: coord, y: rect.top },
        connect: { x: coord, y: container.horizontalCorridors[0] },
        orientation: 'H',
        side,
      };
    case 'bottom':
      return {
        port: { x: coord, y: rect.bottom },
        connect: {
          x: coord,
          y: container.horizontalCorridors[container.horizontalCorridors.length - 1],
        },
        orientation: 'H',
        side,
      };
  }
}

export interface SegmentAttachment extends GridAttachment {
  ownerId: string;
}

export interface SegmentAttachmentAlternative {
  attachment: SegmentAttachment;
  select: () => void;
}

function portalBoundaryPoint(portal: PairedPortal): Point {
  return {
    x: (portal.interior.x + portal.exterior.x) / 2,
    y: (portal.interior.y + portal.exterior.y) / 2,
  };
}

export function portalAttachment(portal: PairedPortal, interior: boolean): SegmentAttachment {
  // The visible port is the group boundary midpoint; search starts on one side of the clearance
  // transition so each container topology remains independent.
  return {
    ownerId: portal.ownerId,
    port: portalBoundaryPoint(portal),
    connect: interior ? portal.interior : portal.exterior,
    orientation: portal.side === 'left' || portal.side === 'right' ? 'V' : 'H',
    side: portal.side,
  };
}

export function groupBoundaryEndpointAttachment(
  ownerId: string,
  side: GridSide,
  demandKey: string,
  result: GridLayoutResult,
  demandCoords: Map<string, number>
): SegmentAttachment {
  const owner = result.forest.nodeById.get(ownerId);
  if (!owner?.isGroup) {
    throw gridError('GRID_ROUTE_NOT_FOUND', `Missing group endpoint "${ownerId}"`);
  }
  const rect = rectForNode(owner);
  const coordinate =
    demandCoords.get(demandKey) ?? (side === 'left' || side === 'right' ? rect.cy : rect.cx);
  const port =
    side === 'left' || side === 'right'
      ? { x: side === 'left' ? rect.left : rect.right, y: coordinate }
      : { x: coordinate, y: side === 'top' ? rect.top : rect.bottom };
  return {
    ownerId,
    port,
    connect: {
      x:
        port.x +
        (side === 'left' ? TERMINAL_APPROACH_PX : side === 'right' ? -TERMINAL_APPROACH_PX : 0),
      y:
        port.y +
        (side === 'top' ? TERMINAL_APPROACH_PX : side === 'bottom' ? -TERMINAL_APPROACH_PX : 0),
    },
    orientation: side === 'left' || side === 'right' ? 'V' : 'H',
    side,
  };
}

export function reversePoints(points: Point[]): Point[] {
  return [...points].reverse();
}

export function combinePointChains(chains: Point[][]): Point[] {
  const points: Point[] = [];
  for (const chain of chains) {
    for (const point of chain) {
      if (points.length === 0 || !equalPoint(points[points.length - 1], point)) {
        points.push(point);
      }
    }
  }
  return normalizePolyline(points).points;
}

function routeSelfLoop(owner: Node, side: GridSide, index: number, demandCoord: number): Point[] {
  const rect = rectForNode(owner);
  const depth = SELF_LOOP_APPROACH + (index + 1) * SELF_LOOP_TRACK_GAP;
  const portOffset = index * SELF_LOOP_PORT_OFFSET_STEP;
  switch (side) {
    case 'right': {
      const startY = demandCoord - SELF_LOOP_PORT_GAP / 2 - portOffset;
      const endY = demandCoord + SELF_LOOP_PORT_GAP / 2 + portOffset;
      return normalizePolyline([
        { x: rect.right, y: startY },
        { x: rect.right + SELF_LOOP_APPROACH, y: startY },
        { x: rect.right + depth, y: startY },
        { x: rect.right + depth, y: endY },
        { x: rect.right + SELF_LOOP_APPROACH, y: endY },
        { x: rect.right, y: endY },
      ]).points;
    }
    case 'left': {
      const startY = demandCoord - SELF_LOOP_PORT_GAP / 2 - portOffset;
      const endY = demandCoord + SELF_LOOP_PORT_GAP / 2 + portOffset;
      return normalizePolyline([
        { x: rect.left, y: startY },
        { x: rect.left - SELF_LOOP_APPROACH, y: startY },
        { x: rect.left - depth, y: startY },
        { x: rect.left - depth, y: endY },
        { x: rect.left - SELF_LOOP_APPROACH, y: endY },
        { x: rect.left, y: endY },
      ]).points;
    }
    case 'top': {
      const startX = demandCoord - SELF_LOOP_PORT_GAP / 2 - portOffset;
      const endX = demandCoord + SELF_LOOP_PORT_GAP / 2 + portOffset;
      return normalizePolyline([
        { x: startX, y: rect.top },
        { x: startX, y: rect.top - SELF_LOOP_APPROACH },
        { x: startX, y: rect.top - depth },
        { x: endX, y: rect.top - depth },
        { x: endX, y: rect.top - SELF_LOOP_APPROACH },
        { x: endX, y: rect.top },
      ]).points;
    }
    case 'bottom': {
      const startX = demandCoord - SELF_LOOP_PORT_GAP / 2 - portOffset;
      const endX = demandCoord + SELF_LOOP_PORT_GAP / 2 + portOffset;
      return normalizePolyline([
        { x: startX, y: rect.bottom },
        { x: startX, y: rect.bottom + SELF_LOOP_APPROACH },
        { x: startX, y: rect.bottom + depth },
        { x: endX, y: rect.bottom + depth },
        { x: endX, y: rect.bottom + SELF_LOOP_APPROACH },
        { x: endX, y: rect.bottom },
      ]).points;
    }
  }
}

export function labelAwareSelfLoopCandidates(
  owner: Node,
  side: GridSide,
  index: number,
  demandCoord: number,
  requirement: GridLabelSpanRequirement
): Point[][] {
  const rect = rectForNode(owner);
  const baseDepth = SELF_LOOP_APPROACH + (index + 1) * SELF_LOOP_TRACK_GAP;
  const portOffset = index * SELF_LOOP_PORT_OFFSET_STEP;
  const baseSpan = SELF_LOOP_PORT_GAP + portOffset * 2;
  const verticalSide = side === 'left' || side === 'right';
  const span = Math.max(
    baseSpan,
    (verticalSide ? requirement.cross : requirement.along) + GRID_LABEL_CLEARANCE * 2
  );
  const depth = Math.max(
    baseDepth,
    (verticalSide ? requirement.along : requirement.cross) / 2 + GRID_LABEL_CLEARANCE
  );
  const interval = verticalSide ? [rect.top, rect.bottom] : [rect.left, rect.right];
  const directStart = demandCoord - span / 2;
  const directEnd = demandCoord + span / 2;

  if (directStart >= interval[0] && directEnd <= interval[1]) {
    switch (side) {
      case 'right':
        return [
          normalizePolyline([
            { x: rect.right, y: directStart },
            { x: rect.right + depth, y: directStart },
            { x: rect.right + depth, y: directEnd },
            { x: rect.right, y: directEnd },
          ]).points,
        ];
      case 'left':
        return [
          normalizePolyline([
            { x: rect.left, y: directStart },
            { x: rect.left - depth, y: directStart },
            { x: rect.left - depth, y: directEnd },
            { x: rect.left, y: directEnd },
          ]).points,
        ];
      case 'top':
        return [
          normalizePolyline([
            { x: directStart, y: rect.top },
            { x: directStart, y: rect.top - depth },
            { x: directEnd, y: rect.top - depth },
            { x: directEnd, y: rect.top },
          ]).points,
        ];
      case 'bottom':
        return [
          normalizePolyline([
            { x: directStart, y: rect.bottom },
            { x: directStart, y: rect.bottom + depth },
            { x: directEnd, y: rect.bottom + depth },
            { x: directEnd, y: rect.bottom },
          ]).points,
        ];
    }
  }

  const portStart = demandCoord - SELF_LOOP_PORT_GAP / 2 - portOffset;
  const portEnd = demandCoord + SELF_LOOP_PORT_GAP / 2 + portOffset;
  if (portStart < interval[0] || portEnd > interval[1]) {
    return [];
  }
  const outerStart = demandCoord - span / 2;
  const outerEnd = demandCoord + span / 2;
  switch (side) {
    case 'right':
      return [
        normalizePolyline([
          { x: rect.right, y: portStart },
          { x: rect.right + SELF_LOOP_APPROACH, y: portStart },
          { x: rect.right + SELF_LOOP_APPROACH, y: outerStart },
          { x: rect.right + depth, y: outerStart },
          { x: rect.right + depth, y: outerEnd },
          { x: rect.right + SELF_LOOP_APPROACH, y: outerEnd },
          { x: rect.right + SELF_LOOP_APPROACH, y: portEnd },
          { x: rect.right, y: portEnd },
        ]).points,
      ];
    case 'left':
      return [
        normalizePolyline([
          { x: rect.left, y: portStart },
          { x: rect.left - SELF_LOOP_APPROACH, y: portStart },
          { x: rect.left - SELF_LOOP_APPROACH, y: outerStart },
          { x: rect.left - depth, y: outerStart },
          { x: rect.left - depth, y: outerEnd },
          { x: rect.left - SELF_LOOP_APPROACH, y: outerEnd },
          { x: rect.left - SELF_LOOP_APPROACH, y: portEnd },
          { x: rect.left, y: portEnd },
        ]).points,
      ];
    case 'top':
      return [
        normalizePolyline([
          { x: portStart, y: rect.top },
          { x: portStart, y: rect.top - SELF_LOOP_APPROACH },
          { x: outerStart, y: rect.top - SELF_LOOP_APPROACH },
          { x: outerStart, y: rect.top - depth },
          { x: outerEnd, y: rect.top - depth },
          { x: outerEnd, y: rect.top - SELF_LOOP_APPROACH },
          { x: portEnd, y: rect.top - SELF_LOOP_APPROACH },
          { x: portEnd, y: rect.top },
        ]).points,
      ];
    case 'bottom':
      return [
        normalizePolyline([
          { x: portStart, y: rect.bottom },
          { x: portStart, y: rect.bottom + SELF_LOOP_APPROACH },
          { x: outerStart, y: rect.bottom + SELF_LOOP_APPROACH },
          { x: outerStart, y: rect.bottom + depth },
          { x: outerEnd, y: rect.bottom + depth },
          { x: outerEnd, y: rect.bottom + SELF_LOOP_APPROACH },
          { x: portEnd, y: rect.bottom + SELF_LOOP_APPROACH },
          { x: portEnd, y: rect.bottom },
        ]).points,
      ];
  }
}

export function orderedSelfLoopSides(
  node: Node,
  counts: Map<string, number>,
  selfLoopCounts: Map<string, number>
): GridSide[] {
  const sides: GridSide[] =
    node.isGroup && ownerGroupTitle(node)
      ? ['left', 'right', 'bottom']
      : ['left', 'right', 'top', 'bottom'];
  return sides.sort((a, b) => {
    const aCount =
      (counts.get(ownerSideKey(node.id, a)) ?? 0) + (selfLoopCounts.get(`${node.id}:${a}`) ?? 0);
    const bCount =
      (counts.get(ownerSideKey(node.id, b)) ?? 0) + (selfLoopCounts.get(`${node.id}:${b}`) ?? 0);
    return aCount - bCount;
  });
}

function selfLoopObstacles(owner: Node, result: GridLayoutResult): Rect[] {
  const obstacles: Rect[] = [];
  for (const node of result.forest.nodeById.values()) {
    if (node.id !== owner.id && !node.isGroup && node.x !== undefined && node.y !== undefined) {
      obstacles.push(rectForNode(node));
    }
    if (node.id !== owner.id && node.groupTitleRect) {
      const { left, right, top, bottom } = node.groupTitleRect;
      obstacles.push({
        cx: (left + right) / 2,
        cy: (top + bottom) / 2,
        left,
        right,
        top,
        bottom,
      });
    }
  }
  return obstacles;
}

export function routeObstacleClearSelfLoop(
  owner: Node,
  ownerSideCounts: Map<string, number>,
  selfLoopCounts: Map<string, number>,
  result: GridLayoutResult,
  labelRequirement?: GridLabelSpanRequirement,
  metrics?: GridRoutingInstrumentation
): { points: Point[]; side: GridSide; index: number } {
  // Side load determines preference, but fixed side ordering breaks ties deterministically.
  const rect = rectForNode(owner);
  const obstacles = selfLoopObstacles(owner, result);
  for (const side of orderedSelfLoopSides(owner, ownerSideCounts, selfLoopCounts)) {
    const countKey = `${owner.id}:${side}`;
    const index = selfLoopCounts.get(countKey) ?? 0;
    const demandCoord = side === 'left' || side === 'right' ? rect.cy : rect.cx;
    const candidates = labelRequirement
      ? labelAwareSelfLoopCandidates(owner, side, index, demandCoord, labelRequirement)
      : [routeSelfLoop(owner, side, index, demandCoord)];
    if (labelRequirement && metrics) {
      metrics.labelAwareSelfLoopCandidates += candidates.length;
    }
    for (const points of candidates) {
      if (!obstacles.some((obstacle) => polylineIntersectsRect(points, obstacle))) {
        return { points, side, index };
      }
    }
  }
  throw gridError('GRID_ROUTE_NOT_FOUND', `No obstacle-clear self-loop route for "${owner.id}"`, {
    nodeId: owner.id,
  });
}

export function rootContainerMeta(result: GridLayoutResult): void {
  if (result.containers.has(ROOT_CONTAINER_ID)) {
    return;
  }
  let minLeft = 0;
  let maxRight = 0;
  let minTop = 0;
  let maxBottom = 0;
  let first = true;
  for (const item of result.itemMeta.values()) {
    if (item.containerId !== ROOT_CONTAINER_ID) {
      continue;
    }
    if (first) {
      minLeft = item.cellLeft;
      maxRight = item.cellLeft + item.cellWidth;
      minTop = item.cellTop;
      maxBottom = item.cellTop + item.cellHeight;
      first = false;
    } else {
      minLeft = Math.min(minLeft, item.cellLeft);
      maxRight = Math.max(maxRight, item.cellLeft + item.cellWidth);
      minTop = Math.min(minTop, item.cellTop);
      maxBottom = Math.max(maxBottom, item.cellTop + item.cellHeight);
    }
  }

  const horizontalCorridors = new Set<number>([
    minTop - ROOT_OUTER_MARGIN,
    maxBottom + ROOT_OUTER_MARGIN,
  ]);
  // The synthetic root has no node bounds, so derive its routable domain from root cells and keep
  // an outer track available for routes that must pass around the whole diagram.
  const verticalCorridors = new Set<number>([
    minLeft - ROOT_OUTER_MARGIN,
    maxRight + ROOT_OUTER_MARGIN,
  ]);
  for (const item of result.itemMeta.values()) {
    if (item.containerId !== ROOT_CONTAINER_ID) {
      continue;
    }
    horizontalCorridors.add(item.topCorridorY);
    horizontalCorridors.add(item.bottomCorridorY);
    verticalCorridors.add(item.leftCorridorX);
    verticalCorridors.add(item.rightCorridorX);
  }
  result.containers.set(ROOT_CONTAINER_ID, {
    id: ROOT_CONTAINER_ID,
    left: minLeft - ROOT_OUTER_MARGIN,
    top: minTop - ROOT_OUTER_MARGIN,
    width: maxRight - minLeft + ROOT_OUTER_MARGIN * 2,
    height: maxBottom - minTop + ROOT_OUTER_MARGIN * 2,
    contentLeft: minLeft,
    contentTop: minTop,
    contentRight: maxRight,
    contentBottom: maxBottom,
    verticalCorridors: [...verticalCorridors].sort((a, b) => a - b),
    horizontalCorridors: [...horizontalCorridors].sort((a, b) => a - b),
  });
}

function containerBounds(containerId: GridContainerId, result: GridLayoutResult): RouterRect {
  const container = result.containers.get(containerId);
  if (!container) {
    throw gridError('GRID_ROUTE_NOT_FOUND', `Missing container layout "${containerId}"`);
  }
  if (containerId === ROOT_CONTAINER_ID) {
    const rootItems = [...result.itemMeta.values()].filter(
      ({ containerId: ownerContainerId }) => ownerContainerId === ROOT_CONTAINER_ID
    );
    if (rootItems.length > 0) {
      return {
        left: Math.min(...rootItems.map(({ cellLeft }) => cellLeft)) - ROOT_OUTER_MARGIN,
        right:
          Math.max(...rootItems.map(({ cellLeft, cellWidth }) => cellLeft + cellWidth)) +
          ROOT_OUTER_MARGIN,
        top: Math.min(...rootItems.map(({ cellTop }) => cellTop)) - ROOT_OUTER_MARGIN,
        bottom:
          Math.max(...rootItems.map(({ cellTop, cellHeight }) => cellTop + cellHeight)) +
          ROOT_OUTER_MARGIN,
      };
    }
    return {
      left: container.left,
      right: container.left + container.width,
      top: container.top,
      bottom: container.top + container.height,
    };
  }
  const owner = result.forest.nodeById.get(containerId);
  if (!owner) {
    throw gridError('GRID_ROUTE_NOT_FOUND', `Missing container owner "${containerId}"`);
  }
  const ownerBounds = routerRect(owner);
  return {
    left: ownerBounds.left + ROUTE_CLEARANCE_PX,
    right: ownerBounds.right - ROUTE_CLEARANCE_PX,
    top: ownerBounds.top + ROUTE_CLEARANCE_PX,
    bottom: ownerBounds.bottom - ROUTE_CLEARANCE_PX,
  };
}

function portalCoordinate(bounds: RouterRect, side: GridSide, interior: boolean): number {
  const boundary =
    side === 'left'
      ? bounds.left
      : side === 'right'
        ? bounds.right
        : side === 'top'
          ? bounds.top
          : bounds.bottom;
  const towardInterior = side === 'left' || side === 'top' ? 1 : -1;
  return boundary + towardInterior * ROUTE_CLEARANCE_PX * (interior ? 1 : -1);
}

function containerPortalRanges(
  containerId: GridContainerId,
  result: GridLayoutResult
): PortalRange[] {
  const ranges: PortalRange[] = [];
  if (containerId !== ROOT_CONTAINER_ID) {
    const owner = result.forest.nodeById.get(containerId);
    if (owner) {
      const bounds = routerRect(owner);
      ranges.push(
        ...derivePortalRanges(containerId, bounds, owner.groupTitleRect).map((range) => ({
          ...range,
          coordinate: portalCoordinate(bounds, range.side, true),
        }))
      );
    }
  }
  for (const child of result.forest.childrenByParent.get(containerId) ?? []) {
    if (!child.isGroup) {
      continue;
    }
    const bounds = routerRect(child);
    ranges.push(
      ...derivePortalRanges(child.id, bounds, child.groupTitleRect).map((range) => ({
        ...range,
        coordinate: portalCoordinate(bounds, range.side, false),
      }))
    );
  }
  return ranges;
}

export function buildRoutingContext(
  containerIds: readonly GridContainerId[],
  result: GridLayoutResult,
  metrics: GridRoutingInstrumentation | undefined,
  options: GridRoutingTestOptions
): GridRoutingContext {
  // Build each immutable container topology once. Per-edge endpoints are added later as cheap
  // overlays, avoiding repeated obstacle sweeps for large diagrams.
  const context: GridRoutingContext = {
    topologies: new Map(),
    fallbackContainers: new Map(),
    searchBudget: { expandedStates: 0 },
    searchBudgetWarningEmitted: false,
    baseEstimatedBytes: 0,
    metrics,
  };
  let estimatedBytes = 0;
  for (const containerId of [...new Set(containerIds)].sort()) {
    const children = (result.forest.childrenByParent.get(containerId) ?? []).filter(
      (node) => !isEdgeLabelNode(node)
    );
    const title = result.forest.nodeById.get(containerId)?.groupTitleRect;
    try {
      const topology = buildContainerRoutingTopology(
        {
          containerId,
          bounds: containerBounds(containerId, result),
          obstacles: children.map((node) => ({ id: node.id, bounds: routerRect(node) })),
          titleExclusions: title
            ? [{ id: `${containerId}:title`, bounds: { ...title } }]
            : undefined,
          portalRanges: containerPortalRanges(containerId, result),
        },
        { caps: options.topologyCaps }
      );
      const invocationMemoryCap =
        options.topologyCaps?.maxEstimatedBytes ?? DEFAULT_MAX_ROUTING_ESTIMATED_BYTES;
      if (estimatedBytes + topology.estimatedBytes > invocationMemoryCap) {
        // Keep the invocation-wide cap honest: an individually valid topology may still exceed the
        // aggregate budget when combined with topologies already retained by this routing session.
        context.fallbackContainers.set(containerId, 'estimated_memory_cap');
        continue;
      }
      estimatedBytes += topology.estimatedBytes;
      context.baseEstimatedBytes = estimatedBytes;
      context.topologies.set(containerId, topology);
      if (metrics) {
        metrics.containersBuilt++;
        metrics.baseTopologyBuilds++;
        metrics.baseVertices += topology.vertices.length;
        metrics.baseAdjacencyEntries += topology.adjacencyEntries;
        metrics.buildSweepEvents += topology.seedCount * 4 + topology.obstacles.length * 4;
        metrics.estimatedBytes = estimatedBytes;
      }
    } catch (error) {
      if (!(error instanceof GridRoutingResourceLimitError)) {
        throw error;
      }
      context.fallbackContainers.set(containerId, error.reason);
    }
  }
  return context;
}

export function validatedCompatibilitySegment(
  edgeId: string,
  containerId: GridContainerId,
  start: SegmentAttachment,
  end: SegmentAttachment,
  route: () => Point[],
  result: GridLayoutResult,
  metrics?: GridRoutingInstrumentation
): Point[] {
  const points = route();
  if (metrics) {
    metrics.compatibilitySegments++;
  }
  if (validateContainerSegment(points, start.ownerId, end.ownerId, containerId, result)) {
    return points;
  }
  if (metrics) {
    metrics.compatibilityValidationFailures++;
    metrics.routesImpossible++;
  }
  throw gridError('GRID_ROUTE_NOT_FOUND', `Invalid compatibility route for "${edgeId}"`, {
    edgeId,
    containerId,
  });
}

export function compatibilityLcaAttachments(
  plan: EdgeRoutePlan,
  result: GridLayoutResult,
  demandCoords: Map<string, number>
): { start: SegmentAttachment; end: SegmentAttachment } {
  const sourceFinal = plan.source.chain.at(-1)!;
  const targetFinal = plan.target.chain.at(-1)!;
  const finalAttachment = (
    endpoint: typeof plan.source,
    final: (typeof plan.source.chain)[number]
  ): SegmentAttachment => ({
    ownerId: final.ownerId,
    ...(endpoint.finalKind === 'boundary'
      ? boundaryAttachment(plan.lcaContainerId, final.side, final.demandKey, result, demandCoords)
      : itemAttachment(
          final.ownerId,
          final.side,
          final.demandKey,
          plan.lcaContainerId,
          result,
          demandCoords
        )),
  });
  return {
    start: finalAttachment(plan.source, sourceFinal),
    end: finalAttachment(plan.target, targetFinal),
  };
}

export interface CompatibilitySegmentAttachments {
  containerId: GridContainerId;
  start: SegmentAttachment;
  end: SegmentAttachment;
}

export function compatibilityHierarchyAttachments(
  endpoint: EdgeEndpointPlan,
  result: GridLayoutResult,
  demandCoords: Map<string, number>
): CompatibilitySegmentAttachments[] {
  return endpoint.chain.slice(0, -1).map((from, index) => {
    const to = endpoint.chain[index + 1];
    return {
      containerId: to.ownerId,
      start: {
        ownerId: from.ownerId,
        ...itemAttachment(
          from.ownerId,
          from.side,
          from.demandKey,
          to.ownerId,
          result,
          demandCoords
        ),
      },
      end: {
        ownerId: to.ownerId,
        ...boundaryAttachment(to.ownerId, to.side, to.demandKey, result, demandCoords),
      },
    };
  });
}

function compatibilityPlanIsValid(
  plan: EdgeRoutePlan,
  result: GridLayoutResult,
  demandCoords: Map<string, number>
): boolean {
  const segmentIsValid = (
    containerId: GridContainerId,
    start: SegmentAttachment,
    end: SegmentAttachment
  ): boolean =>
    validateContainerSegment(
      routeWithinContainer(containerId, result, start, end, plan.laneIndex),
      start.ownerId,
      end.ownerId,
      containerId,
      result
    );
  for (const endpoint of [plan.source, plan.target]) {
    for (const { containerId, start, end } of compatibilityHierarchyAttachments(
      endpoint,
      result,
      demandCoords
    )) {
      if (!segmentIsValid(containerId, start, end)) {
        return false;
      }
    }
  }
  const attachments = compatibilityLcaAttachments(plan, result, demandCoords);
  return segmentIsValid(plan.lcaContainerId, attachments.start, attachments.end);
}

export /*
 * Grid routing currently uses two algorithms:
 *
 * - `routeWithinContainer()` is the deterministic corridor router. During normal rendering, an
 *   ordinary unbundled same-container edge uses it as a fast path when its endpoint ports are
 *   legal, the complete route passes measured-geometry validation, and its length equals the
 *   Manhattan lower bound. This avoids building a visibility topology and running A* for
 *   routes that sparse search cannot improve.
 * - The sparse visibility router handles self-loops, bundles, ordinary routes that fail the
 *   fast path, and hierarchy routes that need alternative portals or obstacle-aware search.
 *
 * Test-only topology/search caps and dual-route comparison disable the fast path intentionally:
 * those modes must exercise sparse topology, search, and fallback behavior. Normal router and
 * performance tests cover the production fast path separately.
 *
 * Hierarchy routing is still partially migrated. Bundles, routes whose two endpoints have no
 * unrelated incident edges, and plans whose corridor route fails validation use sparse routing
 * for every hierarchy-chain segment. Other single hierarchy edges may retain validated
 * corridor segments when at least one endpoint is shared with another edge.
 * Group-to-descendant routes always use sparse routing for their LCA segment, even when their
 * ascent or descent chain still uses corridor routing. Defined sparse resource-limit failures
 * also use the corridor route as a fallback, but only after that route passes the same geometry
 * and pair-separation validation.
 *
 * Finishing the migration requires sparse routing to handle the remaining mixed-demand
 * hierarchy segments without introducing shared subpaths or crossings, and to meet the large
 * graph performance target without the common-edge fast path. It also requires generated
 * nested hierarchy, label, loop, bundle, and fallback coverage plus release-level validation.
 * Only then can `routeWithinContainer()`, corridor metadata, compatibility/fallback
 * instrumentation, and their obsolete tests be removed.
 */
function prepareRoutingModes(
  prepared: PreparedEdgeRoutes,
  result: GridLayoutResult,
  metrics: GridRoutingInstrumentation | undefined,
  options: GridRoutingTestOptions
): PreparedRoutingModes {
  // Classify every plan before building topologies: proven minimal corridor routes avoid sparse
  // setup, while only containers needed by sparse LCA, hierarchy, or loop segments are materialized.
  const {
    plans,
    eligiblePlans,
    eligibleIds,
    demandCoords,
    endpointCandidatesByEdge,
    endpointIncidentCounts,
    coordinatedEndpointIds,
  } = prepared;
  const hasIsolatedEndpoints = (plan: EdgeRoutePlan): boolean =>
    (endpointIncidentCounts.get(plan.edge.start!) ?? 0) === plan.bundleSize &&
    (endpointIncidentCounts.get(plan.edge.end!) ?? 0) === plan.bundleSize;
  const hasAncestorEndpoint = (plan: EdgeRoutePlan): boolean => {
    const source = result.forest.nodeById.get(plan.edge.start!);
    const target = result.forest.nodeById.get(plan.edge.end!);
    return Boolean(
      source &&
        target &&
        ((source.isGroup && isAncestorGroup(source.id, target, result.forest.nodeById)) ||
          (target.isGroup && isAncestorGroup(target.id, source, result.forest.nodeById)))
    );
  };
  const compatibilityFastRoutes = new Map<string, Point[]>();
  const routeOccupancy = new Map<GridContainerId, RouteOccupancyIndex>();
  const compatibilityFastPathEnabled =
    options.topologyCaps === undefined &&
    options.searchCaps === undefined &&
    options.onDualRouteComparison === undefined;
  for (const plan of compatibilityFastPathEnabled ? eligiblePlans : []) {
    if (coordinatedEndpointIds.has(plan.edge.id)) {
      continue;
    }
    const candidates = endpointCandidatesByEdge.get(plan.edge.id);
    if (plan.bundleSize !== 1 || !candidates?.sources.length || !candidates.targets.length) {
      continue;
    }
    const source = result.forest.nodeById.get(plan.edge.start!);
    const target = result.forest.nodeById.get(plan.edge.end!);
    if (!source || !target) {
      continue;
    }
    const attachments = compatibilityLcaAttachments(plan, result, demandCoords);
    const route = routeWithinContainer(
      plan.lcaContainerId,
      result,
      attachments.start,
      attachments.end,
      plan.laneIndex
    );
    const normalized = normalizePolyline(route);
    const first = normalized.points[0];
    const last = normalized.points.at(-1);
    if (!first || !last) {
      continue;
    }
    const sourceCandidate = candidates.sources.find(
      ({ port }) => port.x === first.x && port.y === first.y
    );
    const targetCandidate = candidates.targets.find(
      ({ port }) => port.x === last.x && port.y === last.y
    );
    if (!sourceCandidate || !targetCandidate) {
      continue;
    }
    if (metrics) {
      metrics.compatibilityFastPathAttempts++;
    }
    const lowerBoundLength = Math.abs(first.x - last.x) + Math.abs(first.y - last.y);
    if (!validateSameContainerRoute(route, source, target, plan.lcaContainerId, result)) {
      if (metrics) {
        metrics.compatibilityFastPathValidationFailures++;
      }
      continue;
    }
    if (manhattanLength(normalized.points) !== lowerBoundLength) {
      if (metrics) {
        metrics.compatibilityFastPathNonMinimalRoutes++;
      }
      continue;
    }
    // Small layouts demote a route that runs close and parallel to an earlier edge to sparse
    // routing. Large layouts keep the fast path to stay search-free within the performance
    // contract, nudging the route sideways when possible.
    let occupancy = routeOccupancy.get(plan.lcaContainerId);
    if (!occupancy) {
      occupancy = new RouteOccupancyIndex();
      routeOccupancy.set(plan.lcaContainerId, occupancy);
    }
    const conflicting = occupancy.conflictsWithRoute(normalized.points, plan.pairKey);
    if (conflicting && eligiblePlans.length <= MAX_PLANS_FOR_OVERLAP_DEMOTION) {
      // The sparse router can choose other ports and corridors, which reads better than a nudge.
      continue;
    }
    const separated = separateRouteFromOccupied(
      normalized.points,
      occupancy,
      plan.pairKey,
      (candidate) =>
        terminalStubsAreLongEnough(candidate) &&
        manhattanLength(candidate) === lowerBoundLength &&
        validateSameContainerRoute(candidate, source, target, plan.lcaContainerId, result)
    );
    const finalRoute = separated ?? route;
    occupancy.add(finalRoute, plan.pairKey);
    compatibilityFastRoutes.set(plan.edge.id, finalRoute);
  }
  const sparseCandidate = (plan: EdgeRoutePlan): boolean =>
    !eligibleIds.has(plan.edge.id) &&
    plan.edge.start !== plan.edge.end &&
    (plan.bundleSize > 1 ||
      hasIsolatedEndpoints(plan) ||
      !compatibilityPlanIsValid(plan, result, demandCoords));
  const planningOccupancy = new Map<GridContainerId, RouteOccupancyIndex>();
  const overlappingHierarchyIds = new Set<string>();
  if (plans.length <= MAX_PLANS_FOR_OVERLAP_DEMOTION) {
    for (const plan of prepared.orderedPlans) {
      if (
        eligibleIds.has(plan.edge.id) ||
        plan.edge.start === plan.edge.end ||
        hasAncestorEndpoint(plan) ||
        sparseCandidate(plan)
      ) {
        continue;
      }
      const attachments = compatibilityLcaAttachments(plan, result, demandCoords);
      const route = routeWithinContainer(
        plan.lcaContainerId,
        result,
        attachments.start,
        attachments.end,
        plan.laneIndex
      );
      let occupancy = planningOccupancy.get(plan.lcaContainerId);
      if (!occupancy) {
        occupancy = new RouteOccupancyIndex();
        planningOccupancy.set(plan.lcaContainerId, occupancy);
      }
      if (occupancy.conflictsWithRoute(route, plan.pairKey)) {
        overlappingHierarchyIds.add(plan.edge.id);
      } else {
        occupancy.add(route, plan.pairKey);
      }
    }
  }
  const sparseHierarchyIds = new Set([
    ...plans.filter(sparseCandidate).map(({ edge }) => edge.id),
    ...overlappingHierarchyIds,
  ]);
  const sparseLcaIds = new Set([
    ...sparseHierarchyIds,
    ...plans.filter(hasAncestorEndpoint).map(({ edge }) => edge.id),
  ]);
  const routedContainerIds = plans
    .filter(
      (plan) =>
        (eligibleIds.has(plan.edge.id) && !compatibilityFastRoutes.has(plan.edge.id)) ||
        sparseLcaIds.has(plan.edge.id) ||
        plan.edge.start === plan.edge.end
    )
    .flatMap((plan) => [
      plan.lcaContainerId,
      ...plan.source.chain.slice(1).map(({ ownerId }) => ownerId),
      ...plan.target.chain.slice(1).map(({ ownerId }) => ownerId),
    ]);
  return {
    compatibilityFastRoutes,
    sparseHierarchyIds,
    sparseLcaIds,
    routedContainerIds,
    routeOccupancy,
  };
}
