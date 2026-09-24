import { log } from '../../../logger.js';
import type { Point } from '../../../types.js';
import type { Edge, LayoutData, Node } from '../../types.js';
import { EPS, normalizePolyline } from '../layout-utils/geometry.js';
import { polylineIntersectsRect, rectForNode } from '../layout-utils/helpers.js';
import type { Rect } from '../layout-utils/types.js';
import { isAncestorGroup } from './groups.js';
import {
  GridRoutingResourceLimitError,
  recordGridRoute,
  type GridRoutingFallbackReason,
  type GridRoutingInstrumentation,
} from './routerInstrumentation.js';
import {
  compareTupleCost,
  findShortestRoute,
  RouterSearchWorkspace,
  type RouterSearchCaps,
  type RouterSearchResult,
  type RouterTupleCost,
} from './routerSearch.js';
import {
  buildPairedPortal,
  buildContainerRoutingTopology,
  buildEndpointRoutingOverlay,
  derivePortalRanges,
  EndpointOverlayScratch,
  ROUTE_CLEARANCE_PX,
  type TopologyResourceCaps,
} from './routerTopology.js';
import type {
  GridAttachment,
  GridAttachmentDemand,
  GridContainerId,
  GridLayoutResult,
  GridRoutingContext,
  GridOrientation,
  PairedPortal,
  PortalRange,
  GridSide,
  RouterPoint,
  RouterRect,
} from './types.js';
import { ROOT_CONTAINER_ID, gridError, isEdgeLabelNode } from './types.js';

const PORT_MARGIN = 4;
const ROOT_OUTER_MARGIN = 24;
const SELF_LOOP_PORT_GAP = 18;
const SELF_LOOP_APPROACH = 14;
const SELF_LOOP_TRACK_GAP = 18;
const SELF_LOOP_PORT_OFFSET_STEP = 4;
const TERMINAL_APPROACH_PX = 20;
const MIN_PORT_SEPARATION_PX = 4;
const LANE_SEPARATION_PX = 8;
const ROUTER_DEBUG_KEY = 'grid-router';
const DEFAULT_MAX_ESTIMATED_BYTES = 64 * 1024 * 1024;

export interface GridRoutingDualRouteComparison {
  edgeId: string;
  sparse: { valid: boolean; length: number; bends: number };
  legacy: { valid: boolean; length: number; bends: number };
}

export interface GridRoutingOptions {
  topologyCaps?: TopologyResourceCaps;
  searchCaps?: RouterSearchCaps;
  onDualRouteComparison?: (comparison: GridRoutingDualRouteComparison) => void;
}

interface EdgeEndpointEntry {
  ownerId: string;
  side: GridSide;
  demandKey: string;
  oppositeCoord: number;
  preferredCoord: number;
  compactPortal: boolean;
}

interface EdgeEndpointPlan {
  chain: EdgeEndpointEntry[];
  finalKind: 'item' | 'boundary';
}

interface EdgeRoutePlan {
  edge: Edge;
  lcaContainerId: GridContainerId;
  source: EdgeEndpointPlan;
  target: EdgeEndpointPlan;
  laneIndex: number;
  laneOffset: number;
  bundleSize: number;
  pairKey: string;
}

function ownerGroupTitle(node: Node): boolean {
  return Boolean(node.groupTitleRect);
}

function preferredSide(node: Node, toward: Point): GridSide {
  const rect = rectForNode(node);
  const dx = toward.x - rect.cx;
  const dy = toward.y - rect.cy;
  const avoidTop = node.isGroup && ownerGroupTitle(node);

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? 'right' : 'left';
  }
  if (dy >= 0) {
    return 'bottom';
  }
  if (avoidTop) {
    return dx >= 0 ? 'right' : 'left';
  }
  return 'top';
}

function containerChain(node: Node, nodeById: Map<string, Node>): GridContainerId[] {
  const chain: GridContainerId[] = [];
  let currentParent = node.parentId ?? ROOT_CONTAINER_ID;
  const seen = new Set<string>();
  while (true) {
    chain.push(currentParent);
    if (currentParent === ROOT_CONTAINER_ID) {
      break;
    }
    if (seen.has(currentParent)) {
      break;
    }
    seen.add(currentParent);
    currentParent = nodeById.get(currentParent)?.parentId ?? ROOT_CONTAINER_ID;
  }
  return chain;
}

function commonContainerId(
  source: Node,
  target: Node,
  nodeById: Map<string, Node>
): GridContainerId {
  if (source.isGroup && isAncestorGroup(source.id, target, nodeById)) {
    return source.parentId ?? ROOT_CONTAINER_ID;
  }
  if (target.isGroup && isAncestorGroup(target.id, source, nodeById)) {
    return target.parentId ?? ROOT_CONTAINER_ID;
  }
  const targetContainers = new Set(containerChain(target, nodeById));
  for (const containerId of containerChain(source, nodeById)) {
    if (targetContainers.has(containerId)) {
      return containerId;
    }
  }
  return ROOT_CONTAINER_ID;
}

function oppositeCoordFor(rect: ReturnType<typeof rectForNode>, side: GridSide): number {
  return side === 'left' || side === 'right' ? rect.cy : rect.cx;
}

function buildEndpointPlan(
  endpoint: Node,
  other: Node,
  lcaContainerId: GridContainerId,
  nodeById: Map<string, Node>,
  edgeId: string,
  role: 'source' | 'target'
): EdgeEndpointPlan {
  const chain: EdgeEndpointEntry[] = [];
  const endpointRect = rectForNode(endpoint);
  const otherRect = rectForNode(other);
  const otherCenter = { x: other.x ?? 0, y: other.y ?? 0 };
  let current = endpoint;

  for (;;) {
    const parentId = current.parentId ?? ROOT_CONTAINER_ID;
    const parent = nodeById.get(parentId);
    let side = preferredSide(current, otherCenter);
    if (side === 'top' && parent?.groupTitleRect) {
      side = otherCenter.x >= (current.x ?? 0) ? 'right' : 'left';
    }
    chain.push({
      ownerId: current.id,
      side,
      demandKey: `${edgeId}:${role}:${current.id}:${side}`,
      oppositeCoord: oppositeCoordFor(otherRect, side),
      preferredCoord: oppositeCoordFor(endpointRect, side),
      compactPortal: current.id !== endpoint.id,
    });

    if (
      current.isGroup &&
      current.id === lcaContainerId &&
      isAncestorGroup(current.id, other, nodeById)
    ) {
      return { chain, finalKind: 'boundary' };
    }
    if (parentId === lcaContainerId) {
      return { chain, finalKind: 'item' };
    }

    if (!parent?.isGroup) {
      throw gridError('GRID_INVALID_CONTAINMENT', `Missing parent group "${parentId}"`, {
        traversedIds: chain.map((entry) => entry.ownerId),
      });
    }
    current = parent;
  }
}

interface PairLane {
  index: number;
  size: number;
  offset: number;
  pairKey: string;
}

function buildPairLanes(edges: Edge[]): Map<string, PairLane> {
  const byPair = new Map<string, Edge[]>();
  for (const edge of edges) {
    if (!edge.start || !edge.end) {
      continue;
    }
    const pairKey =
      edge.start < edge.end ? `${edge.start}|${edge.end}` : `${edge.end}|${edge.start}`;
    if (!byPair.has(pairKey)) {
      byPair.set(pairKey, []);
    }
    byPair.get(pairKey)!.push(edge);
  }

  const out = new Map<string, PairLane>();
  for (const [pairKey, entries] of byPair) {
    entries.sort(
      (a, b) =>
        `${a.start}|${a.end}`.localeCompare(`${b.start}|${b.end}`) || a.id.localeCompare(b.id)
    );
    entries.forEach((edge, index) =>
      out.set(edge.id, {
        index,
        size: entries.length,
        offset: (index - (entries.length - 1) / 2) * LANE_SEPARATION_PX,
        pairKey,
      })
    );
  }
  return out;
}

function collectRoutePlans(layout: LayoutData, result: GridLayoutResult): EdgeRoutePlan[] {
  const nodeById = result.forest.nodeById;
  const pairLanes = buildPairLanes(layout.edges);

  return layout.edges.map((edge) => {
    const source = edge.start ? nodeById.get(edge.start) : undefined;
    const target = edge.end ? nodeById.get(edge.end) : undefined;
    if (!source || !target) {
      throw gridError('GRID_MISSING_ENDPOINT', `Missing endpoint for edge "${edge.id}"`, {
        edgeId: edge.id,
        start: edge.start,
        end: edge.end,
      });
    }
    const lcaContainerId = commonContainerId(source, target, nodeById);
    const pairLane = pairLanes.get(edge.id) ?? {
      index: 0,
      size: 1,
      offset: 0,
      pairKey: endpointPairKey(edge),
    };
    return {
      edge,
      lcaContainerId,
      source: buildEndpointPlan(source, target, lcaContainerId, nodeById, edge.id, 'source'),
      target: buildEndpointPlan(target, source, lcaContainerId, nodeById, edge.id, 'target'),
      laneIndex: pairLane.index,
      laneOffset: pairLane.offset,
      bundleSize: pairLane.size,
      pairKey: pairLane.pairKey,
    };
  });
}

export function assignCompactPortalCoordinates(
  desired: readonly number[],
  low: number,
  high: number
): number[] {
  const coordinates: number[] = [];
  for (const [index, coordinate] of desired.entries()) {
    coordinates.push(
      index === 0
        ? coordinate
        : Math.max(coordinate, coordinates[index - 1] + MIN_PORT_SEPARATION_PX)
    );
  }
  for (let index = coordinates.length - 1; index >= 0; index--) {
    coordinates[index] = Math.min(
      coordinates[index],
      index === coordinates.length - 1 ? high : coordinates[index + 1] - MIN_PORT_SEPARATION_PX
    );
  }
  const averageDesired = desired.reduce((sum, coordinate) => sum + coordinate, 0) / desired.length;
  const averageAssigned =
    coordinates.reduce((sum, coordinate) => sum + coordinate, 0) / coordinates.length;
  const minimumShift = low - coordinates[0];
  const maximumShift = high - coordinates[coordinates.length - 1];
  const shift = Math.max(minimumShift, Math.min(maximumShift, averageDesired - averageAssigned));
  return coordinates.map((coordinate) => coordinate + shift);
}

export function boundedAlternativePortalCoordinates(
  selected: number,
  low: number,
  high: number,
  corridors: readonly number[],
  limit = 3
): number[] {
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

function assignDemandCoordinates(
  plans: EdgeRoutePlan[],
  result: GridLayoutResult
): Map<string, number> {
  const nodeById = result.forest.nodeById;
  const planByEdgeId = new Map(plans.map((plan) => [plan.edge.id, plan]));
  const incidentCounts = new Map<string, number>();
  for (const plan of plans) {
    if (plan.edge.start) {
      incidentCounts.set(plan.edge.start, (incidentCounts.get(plan.edge.start) ?? 0) + 1);
    }
    if (plan.edge.end && plan.edge.end !== plan.edge.start) {
      incidentCounts.set(plan.edge.end, (incidentCounts.get(plan.edge.end) ?? 0) + 1);
    }
  }
  const demandByKey = new Map<string, GridAttachmentDemand>();
  for (const plan of plans) {
    if (plan.edge.start === plan.edge.end) {
      continue;
    }
    for (const entry of [...plan.source.chain, ...plan.target.chain]) {
      if (!demandByKey.has(entry.demandKey)) {
        demandByKey.set(entry.demandKey, {
          ownerId: entry.ownerId,
          side: entry.side,
          edgeId: plan.edge.id,
          demandKey: entry.demandKey,
          oppositeCoord: entry.oppositeCoord,
          preferredCoord: entry.preferredCoord,
          compactPortal: entry.compactPortal,
        });
      }
    }
  }

  const byOwnerSide = new Map<string, GridAttachmentDemand[]>();
  for (const demand of demandByKey.values()) {
    const key = `${demand.ownerId}:${demand.side}`;
    if (!byOwnerSide.has(key)) {
      byOwnerSide.set(key, []);
    }
    byOwnerSide.get(key)!.push(demand);
  }

  const assigned = new Map<string, number>();
  for (const [key, demands] of byOwnerSide) {
    const [ownerId, side] = key.split(':') as [string, GridSide];
    const owner = nodeById.get(ownerId);
    if (!owner) {
      continue;
    }
    const rect = rectForNode(owner);
    let low =
      side === 'left' || side === 'right' ? rect.top + PORT_MARGIN : rect.left + PORT_MARGIN;
    const high =
      side === 'left' || side === 'right' ? rect.bottom - PORT_MARGIN : rect.right - PORT_MARGIN;
    if ((side === 'left' || side === 'right') && owner.groupTitleRect) {
      low = Math.max(low, owner.groupTitleRect.bottom + PORT_MARGIN);
    }
    const span = Math.max(0, high - low);
    demands.sort((a, b) => a.oppositeCoord - b.oppositeCoord || a.edgeId.localeCompare(b.edgeId));
    const demandPlans = demands.map((demand) => planByEdgeId.get(demand.edgeId));
    const pairKeys = new Set(demandPlans.map((plan) => plan?.pairKey));
    const compactHierarchyPortals =
      owner.isGroup && demands.every(({ compactPortal }) => compactPortal);
    if (
      !(compactHierarchyPortals && demands.length === 1) &&
      pairKeys.size === 1 &&
      demandPlans.every(
        (plan) =>
          plan &&
          plan.bundleSize === demands.length &&
          incidentCounts.get(plan.edge.start!) === plan.bundleSize &&
          incidentCounts.get(plan.edge.end!) === plan.bundleSize
      )
    ) {
      const center = (low + high) / 2;
      const coordinates = demandPlans.map((plan) => center + plan!.laneOffset);
      if (coordinates.every((coordinate) => coordinate >= low && coordinate <= high)) {
        demands.forEach((demand, index) => assigned.set(demand.demandKey, coordinates[index]));
        continue;
      }
    }
    if (compactHierarchyPortals) {
      const container = result.containers.get(owner.id);
      const corridorCoordinates =
        side === 'left' || side === 'right'
          ? container?.horizontalCorridors
          : container?.verticalCorridors;
      const preferredCoordinate = (demand: GridAttachmentDemand): number => {
        const clamped = Math.max(low, Math.min(high, demand.preferredCoord));
        const nearest = corridorCoordinates?.reduce(
          (best, coordinate) =>
            Math.abs(coordinate - clamped) < Math.abs(best - clamped) ? coordinate : best,
          corridorCoordinates[0]
        );
        return nearest !== undefined && Math.abs(nearest - clamped) <= EPS ? nearest : clamped;
      };
      if (demands.length === 1) {
        assigned.set(demands[0].demandKey, preferredCoordinate(demands[0]));
        continue;
      }
      if (span >= MIN_PORT_SEPARATION_PX * (demands.length - 1)) {
        const desired = demands.map(preferredCoordinate);
        const coordinates = assignCompactPortalCoordinates(desired, low, high);
        demands.forEach((demand, index) => assigned.set(demand.demandKey, coordinates[index]));
        continue;
      }
    }
    if (demands.length === 1 || span <= 0) {
      assigned.set(demands[0].demandKey, (low + high) / 2);
      continue;
    }
    const step = span / (demands.length - 1);
    demands.forEach((demand, index) => {
      assigned.set(demand.demandKey, low + step * index);
    });
  }
  return assigned;
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

function routeWithinContainer(
  containerId: GridContainerId,
  result: GridLayoutResult,
  start: GridAttachment,
  end: GridAttachment,
  variant: number
): Point[] {
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

function itemAttachment(
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

function boundaryAttachment(
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

interface SegmentAttachment extends GridAttachment {
  ownerId: string;
}

interface SegmentAttachmentAlternative {
  attachment: SegmentAttachment;
  select: () => void;
}

function portalBoundaryPoint(portal: PairedPortal): Point {
  return {
    x: (portal.interior.x + portal.exterior.x) / 2,
    y: (portal.interior.y + portal.exterior.y) / 2,
  };
}

function portalAttachment(portal: PairedPortal, interior: boolean): SegmentAttachment {
  return {
    ownerId: portal.ownerId,
    port: portalBoundaryPoint(portal),
    connect: interior ? portal.interior : portal.exterior,
    orientation: portal.side === 'left' || portal.side === 'right' ? 'V' : 'H',
    side: portal.side,
  };
}

function groupBoundaryEndpointAttachment(
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

function reversePoints(points: Point[]): Point[] {
  return [...points].reverse();
}

function combinePointChains(chains: Point[][]): Point[] {
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

function orderedSelfLoopSides(
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
      (counts.get(`${node.id}:${a}`) ?? 0) + (selfLoopCounts.get(`${node.id}:${a}`) ?? 0);
    const bCount =
      (counts.get(`${node.id}:${b}`) ?? 0) + (selfLoopCounts.get(`${node.id}:${b}`) ?? 0);
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

function routeObstacleClearSelfLoop(
  owner: Node,
  ownerSideCounts: Map<string, number>,
  selfLoopCounts: Map<string, number>,
  result: GridLayoutResult
): { points: Point[]; side: GridSide; index: number } {
  const rect = rectForNode(owner);
  const obstacles = selfLoopObstacles(owner, result);
  for (const side of orderedSelfLoopSides(owner, ownerSideCounts, selfLoopCounts)) {
    const countKey = `${owner.id}:${side}`;
    const index = selfLoopCounts.get(countKey) ?? 0;
    const demandCoord = side === 'left' || side === 'right' ? rect.cy : rect.cx;
    const points = routeSelfLoop(owner, side, index, demandCoord);
    if (!obstacles.some((obstacle) => polylineIntersectsRect(points, obstacle))) {
      return { points, side, index };
    }
  }
  throw gridError('GRID_ROUTE_NOT_FOUND', `No obstacle-clear self-loop route for "${owner.id}"`, {
    nodeId: owner.id,
  });
}

function rootContainerMeta(result: GridLayoutResult): void {
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

function routerRect(node: Node): RouterRect {
  const rect = rectForNode(node);
  return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
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

function buildRoutingContext(
  containerIds: readonly GridContainerId[],
  result: GridLayoutResult,
  metrics: GridRoutingInstrumentation | undefined,
  options: GridRoutingOptions
): GridRoutingContext {
  const context: GridRoutingContext = {
    topologies: new Map(),
    fallbackContainers: new Map(),
    occupancy: { routes: [] },
    searchBudget: { expandedStates: 0 },
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
          ancestryPath: [containerId],
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
        options.topologyCaps?.maxEstimatedBytes ?? DEFAULT_MAX_ESTIMATED_BYTES;
      if (estimatedBytes + topology.estimatedBytes > invocationMemoryCap) {
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

interface EndpointCandidate {
  ownerId: string;
  side: GridSide;
  port: RouterPoint;
  connect: RouterPoint;
  rank: number;
}

interface EndpointDemandEntry {
  plan: EdgeRoutePlan;
  role: 'source' | 'target';
  opposite: Node;
}

function sideOrder(side: GridSide): number {
  return side === 'right' ? 0 : side === 'bottom' ? 1 : side === 'left' ? 2 : 3;
}

function sideInterval(owner: Node, side: GridSide): { low: number; high: number } | undefined {
  const rect = rectForNode(owner);
  if (side === 'top' && owner.groupTitleRect) {
    return undefined;
  }
  let low =
    side === 'left' || side === 'right'
      ? rect.top + ROUTE_CLEARANCE_PX
      : rect.left + ROUTE_CLEARANCE_PX;
  const high =
    side === 'left' || side === 'right'
      ? rect.bottom - ROUTE_CLEARANCE_PX
      : rect.right - ROUTE_CLEARANCE_PX;
  if ((side === 'left' || side === 'right') && owner.groupTitleRect) {
    low = Math.max(low, owner.groupTitleRect.bottom + ROUTE_CLEARANCE_PX);
  }
  return low <= high ? { low, high } : undefined;
}

function endpointPairKey(edge: Edge): string {
  const start = edge.start ?? '';
  const end = edge.end ?? '';
  return start < end ? `${start}|${end}` : `${end}|${start}`;
}

function compareEndpointDemands(
  a: EndpointDemandEntry,
  b: EndpointDemandEntry,
  side: GridSide
): number {
  const aRect = rectForNode(a.opposite);
  const bRect = rectForNode(b.opposite);
  const aCoord = side === 'left' || side === 'right' ? aRect.cy : aRect.cx;
  const bCoord = side === 'left' || side === 'right' ? bRect.cy : bRect.cx;
  return (
    aCoord - bCoord ||
    endpointPairKey(a.plan.edge).localeCompare(endpointPairKey(b.plan.edge)) ||
    `${a.plan.edge.start}|${a.plan.edge.end}`.localeCompare(
      `${b.plan.edge.start}|${b.plan.edge.end}`
    ) ||
    a.plan.edge.id.localeCompare(b.plan.edge.id) ||
    a.role.localeCompare(b.role)
  );
}

function preferredEndpointCoordinates(
  owner: Node,
  side: GridSide,
  demands: readonly EndpointDemandEntry[]
): ReadonlyMap<EndpointDemandEntry, number> {
  const interval = sideInterval(owner, side);
  if (!interval || demands.length === 0) {
    return new Map();
  }
  const sorted = [...demands].sort((a, b) => compareEndpointDemands(a, b, side));
  if (sorted.length === 1) {
    const rect = rectForNode(owner);
    const center = side === 'left' || side === 'right' ? rect.cy : rect.cx;
    return new Map([[sorted[0], Math.max(interval.low, Math.min(interval.high, center))]]);
  }
  if ((interval.high - interval.low) / (sorted.length - 1) < MIN_PORT_SEPARATION_PX) {
    return new Map();
  }
  const desired = sorted.map(({ opposite }) => {
    const rect = rectForNode(opposite);
    const coordinate = side === 'left' || side === 'right' ? rect.cy : rect.cx;
    return Math.max(interval.low, Math.min(interval.high, coordinate));
  });
  const coordinates: number[] = [];
  for (const [index, element] of desired.entries()) {
    coordinates.push(
      index === 0 ? element : Math.max(element, coordinates[index - 1] + MIN_PORT_SEPARATION_PX)
    );
  }
  const averageDesired = desired.reduce((sum, coordinate) => sum + coordinate, 0) / desired.length;
  const averageAssigned =
    coordinates.reduce((sum, coordinate) => sum + coordinate, 0) / coordinates.length;
  const minimumShift = interval.low - coordinates[0];
  const maximumShift = interval.high - coordinates[coordinates.length - 1];
  const shift = Math.max(minimumShift, Math.min(maximumShift, averageDesired - averageAssigned));
  return new Map(sorted.map((demand, index) => [demand, coordinates[index] + shift]));
}

function endpointCandidates(
  plan: EdgeRoutePlan,
  role: 'source' | 'target',
  demandsByOwner: ReadonlyMap<string, readonly EndpointDemandEntry[]>,
  result: GridLayoutResult
): EndpointCandidate[] {
  const ownerId = role === 'source' ? plan.edge.start! : plan.edge.end!;
  const oppositeId = role === 'source' ? plan.edge.end! : plan.edge.start!;
  const owner = result.forest.nodeById.get(ownerId);
  const opposite = result.forest.nodeById.get(oppositeId);
  if (!owner || !opposite) {
    throw gridError('GRID_MISSING_ENDPOINT', `Missing endpoint for edge "${plan.edge.id}"`);
  }
  const oppositeRect = rectForNode(opposite);
  const candidates: EndpointCandidate[] = [];
  const candidateKeys = new Set<string>();

  const addCandidate = (side: GridSide, coordinate: number, rank: number): void => {
    const interval = sideInterval(owner, side);
    if (!interval || coordinate < interval.low || coordinate > interval.high) {
      return;
    }
    const rect = rectForNode(owner);
    const port =
      side === 'left' || side === 'right'
        ? { x: side === 'left' ? rect.left : rect.right, y: coordinate }
        : { x: coordinate, y: side === 'top' ? rect.top : rect.bottom };
    const key = `${side}:${routingPointKey(port)}`;
    if (candidateKeys.has(key)) {
      return;
    }
    candidateKeys.add(key);
    candidates.push({
      ownerId,
      side,
      port,
      connect: {
        x:
          port.x +
          (side === 'left' ? -TERMINAL_APPROACH_PX : side === 'right' ? TERMINAL_APPROACH_PX : 0),
        y:
          port.y +
          (side === 'top' ? -TERMINAL_APPROACH_PX : side === 'bottom' ? TERMINAL_APPROACH_PX : 0),
      },
      rank,
    });
  };

  if (plan.bundleSize > 1) {
    const side = preferredSide(owner, { x: oppositeRect.cx, y: oppositeRect.cy });
    const ownerRect = rectForNode(owner);
    const center = side === 'left' || side === 'right' ? ownerRect.cy : ownerRect.cx;
    addCandidate(side, center + plan.laneOffset, -1);
  }

  const ownerDemands = [...(demandsByOwner.get(ownerId) ?? [])];
  if (plan.bundleSize === 1) {
    for (const side of ['right', 'bottom', 'left', 'top'] as const) {
      const preferredDemands = ownerDemands.filter(
        ({ plan: demandPlan, opposite: demandOpposite }) => {
          const rect = rectForNode(demandOpposite);
          return (
            demandPlan.bundleSize === 1 && preferredSide(owner, { x: rect.cx, y: rect.cy }) === side
          );
        }
      );
      const coordinates = preferredEndpointCoordinates(owner, side, preferredDemands);
      const demand = preferredDemands.find((entry) => entry.plan === plan && entry.role === role);
      const coordinate = demand ? coordinates.get(demand) : undefined;
      if (coordinate !== undefined) {
        addCandidate(side, coordinate, -1);
      }
    }
  }

  for (const side of ['right', 'bottom', 'left', 'top'] as const) {
    const interval = sideInterval(owner, side);
    if (!interval) {
      continue;
    }
    const demands = [...ownerDemands].sort((a, b) => compareEndpointDemands(a, b, side));
    const demandIndex = demands.findIndex((entry) => entry.plan === plan && entry.role === role);
    if (demandIndex < 0) {
      continue;
    }
    const spacing =
      demands.length <= 1
        ? Number.POSITIVE_INFINITY
        : (interval.high - interval.low) / (demands.length - 1);
    if (spacing < MIN_PORT_SEPARATION_PX) {
      continue;
    }
    const coordinate =
      demands.length === 1
        ? (interval.low + interval.high) / 2
        : interval.low + demandIndex * spacing;
    const rect = rectForNode(owner);
    const port =
      side === 'left' || side === 'right'
        ? { x: side === 'left' ? rect.left : rect.right, y: coordinate }
        : { x: coordinate, y: side === 'top' ? rect.top : rect.bottom };
    const distance = Math.abs(port.x - oppositeRect.cx) + Math.abs(port.y - oppositeRect.cy);
    addCandidate(side, coordinate, distance);
  }

  candidates.sort((a, b) => a.rank - b.rank || sideOrder(a.side) - sideOrder(b.side));
  candidates.forEach((candidate, index) => {
    candidate.rank = index;
  });
  return candidates;
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

function validateSameContainerRoute(
  points: readonly Point[],
  source: Node,
  target: Node,
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
      if (
        (obstacle.id === source.id && index === 0) ||
        (obstacle.id === target.id && index === normalized.points.length - 2)
      ) {
        continue;
      }
      if (segmentEntersRect(normalized.points[index], normalized.points[index + 1], rect)) {
        return false;
      }
    }
  }
  return true;
}

function validateContainerSegment(
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
      if (
        (obstacle.id === startOwnerId && index === 0) ||
        (obstacle.id === endOwnerId && index === normalized.points.length - 2)
      ) {
        continue;
      }
      if (segmentEntersRect(normalized.points[index], normalized.points[index + 1], rect)) {
        return false;
      }
    }
  }
  return true;
}

function validatedCompatibilitySegment(
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

function routeLength(points: readonly Point[]): number {
  return normalizePolyline([...points]).segments.reduce(
    (total, segment) =>
      total + Math.abs(segment.a.x - segment.b.x) + Math.abs(segment.a.y - segment.b.y),
    0
  );
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
  return (
    (separation === 0 && overlap >= LANE_SEPARATION_PX) ||
    (separation > 0 && separation < LANE_SEPARATION_PX)
  );
}

function routeSatisfiesPairConstraints(
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

function routeHasDistinctPairPorts(
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

function pairArcAllowed(
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

function endpointPairLowerBound(
  source: EndpointCandidate,
  target: EndpointCandidate
): readonly [length: number, bends: number] {
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

function routingPointKey(point: RouterPoint): string {
  const x = Object.is(point.x, -0) ? 0 : point.x;
  const y = Object.is(point.y, -0) ? 0 : point.y;
  return `${x}:${y}`;
}

function recordFallback(
  metrics: GridRoutingInstrumentation | undefined,
  reason: GridRoutingFallbackReason,
  edgeId: string,
  containerId: GridContainerId
): void {
  if (metrics) {
    metrics.resourceLimitFallbacks++;
    metrics.fallbackReasons[reason]++;
  }
  log.debug(ROUTER_DEBUG_KEY, 'GRID_ROUTING_RESOURCE_FALLBACK', {
    edgeId,
    containerId,
    reason,
  });
}

function sparseSameContainerRoute(
  plan: EdgeRoutePlan,
  sources: readonly EndpointCandidate[],
  targets: readonly EndpointCandidate[],
  source: Node,
  target: Node,
  legacyRoute: () => Point[],
  result: GridLayoutResult,
  context: GridRoutingContext,
  searchWorkspace: RouterSearchWorkspace,
  overlayScratch: EndpointOverlayScratch,
  options: GridRoutingOptions,
  pairRoutes: readonly (readonly Point[])[]
): Point[] {
  const fallbackReason = context.fallbackContainers.get(plan.lcaContainerId) as
    | GridRoutingFallbackReason
    | undefined;
  if (fallbackReason) {
    const legacy = legacyRoute();
    recordFallback(context.metrics, fallbackReason, plan.edge.id, plan.lcaContainerId);
    if (
      !validateSameContainerRoute(legacy, source, target, plan.lcaContainerId, result) ||
      (plan.bundleSize > 1 && !routeSatisfiesPairConstraints(legacy, pairRoutes))
    ) {
      if (context.metrics) {
        context.metrics.fallbackValidationFailures++;
      }
      throw gridError('GRID_ROUTE_NOT_FOUND', `Invalid legacy fallback for "${plan.edge.id}"`, {
        edgeId: plan.edge.id,
        reason: fallbackReason,
      });
    }
    (context.occupancy.routes as RouterPoint[][]).push(legacy);
    return legacy;
  }
  const topology = context.topologies.get(plan.lcaContainerId);
  if (!topology) {
    throw gridError('GRID_ROUTE_NOT_FOUND', `Missing routing topology "${plan.lcaContainerId}"`);
  }
  if (sources.length === 0 || targets.length === 0) {
    if (context.metrics) {
      context.metrics.routesImpossible++;
    }
    throw gridError(
      'GRID_ROUTE_NOT_FOUND',
      plan.bundleSize > 1
        ? `No distinct lane route for "${plan.edge.id}"`
        : `No legal endpoint candidates for "${plan.edge.id}"`,
      { edgeId: plan.edge.id }
    );
  }

  let best: { result: RouterSearchResult; points: Point[] } | undefined;
  let searchCap: GridRoutingFallbackReason | undefined;
  const pairs = sources
    .flatMap((sourceCandidate) =>
      targets.map((targetCandidate) => {
        const pairRank = sourceCandidate.rank * targets.length + targetCandidate.rank;
        const [length, bends] = endpointPairLowerBound(sourceCandidate, targetCandidate);
        const lowerCost: RouterTupleCost = [length, bends, 0, 0, 0, pairRank];
        return { sourceCandidate, targetCandidate, pairRank, lowerCost };
      })
    )
    .sort(
      (a, b) =>
        compareTupleCost(a.lowerCost, b.lowerCost) ||
        sideOrder(a.sourceCandidate.side) - sideOrder(b.sourceCandidate.side) ||
        sideOrder(a.targetCandidate.side) - sideOrder(b.targetCandidate.side)
    );

  for (const { sourceCandidate, targetCandidate, pairRank, lowerCost } of pairs) {
    if (best && compareTupleCost(best.result.cost, lowerCost) <= 0) {
      continue;
    }
    try {
      const overlay = buildEndpointRoutingOverlay(
        topology,
        sourceCandidate.connect,
        targetCandidate.connect,
        context.metrics,
        overlayScratch,
        plan.bundleSize > 1 &&
          (sourceCandidate.connect.x === targetCandidate.connect.x ||
            sourceCandidate.connect.y === targetCandidate.connect.y)
          ? [
              {
                x: (sourceCandidate.connect.x + targetCandidate.connect.x) / 2,
                y: (sourceCandidate.connect.y + targetCandidate.connect.y) / 2,
              },
            ]
          : []
      );
      const liveEstimatedBytes =
        context.baseEstimatedBytes + overlay.estimatedBytes - topology.estimatedBytes;
      if (
        liveEstimatedBytes >
        (options.topologyCaps?.maxEstimatedBytes ?? DEFAULT_MAX_ESTIMATED_BYTES)
      ) {
        throw new GridRoutingResourceLimitError(
          'estimated_memory_cap',
          'Grid routing estimated_memory_cap exceeded'
        );
      }
      if (context.metrics) {
        context.metrics.estimatedBytes = Math.max(
          context.metrics.estimatedBytes,
          liveEstimatedBytes
        );
      }
      const sourceId = overlay.pointVertexIds.get(routingPointKey(sourceCandidate.connect));
      const targetId = overlay.pointVertexIds.get(routingPointKey(targetCandidate.connect));
      if (sourceId === undefined || targetId === undefined) {
        throw new Error('Endpoint projection is missing from the routing overlay');
      }
      const sourceOrientation: GridOrientation =
        sourceCandidate.side === 'left' || sourceCandidate.side === 'right' ? 'H' : 'V';
      const targetOrientation: GridOrientation =
        targetCandidate.side === 'left' || targetCandidate.side === 'right' ? 'H' : 'V';
      const resultForPair = findShortestRoute(overlay, sourceId, targetId, {
        metrics: context.metrics,
        caps: {
          ...options.searchCaps,
          maxEstimatedBytes:
            options.searchCaps?.maxEstimatedBytes ??
            options.topologyCaps?.maxEstimatedBytes ??
            DEFAULT_MAX_ESTIMATED_BYTES,
        },
        endpointCandidateRank: pairRank,
        recordOutcome: false,
        budget: context.searchBudget,
        initialOrientation: sourceOrientation,
        initialLength: TERMINAL_APPROACH_PX,
        targetOrientation,
        targetLength: TERMINAL_APPROACH_PX,
        topologyValidated: true,
        workspace: searchWorkspace,
        estimatedBytesBase: liveEstimatedBytes,
        arcAllowed:
          plan.bundleSize > 1 ? (from, to) => pairArcAllowed(from, to, pairRoutes) : undefined,
      });
      if (!resultForPair) {
        continue;
      }
      const points = normalizePolyline([
        sourceCandidate.port,
        ...resultForPair.points,
        targetCandidate.port,
      ]).points;
      if (!validateSameContainerRoute(points, source, target, plan.lcaContainerId, result)) {
        continue;
      }
      if (plan.bundleSize > 1 && !routeSatisfiesPairConstraints(points, pairRoutes)) {
        continue;
      }
      if (!best || compareTupleCost(resultForPair.cost, best.result.cost) < 0) {
        best = { result: resultForPair, points };
      }
    } catch (error) {
      if (!(error instanceof GridRoutingResourceLimitError)) {
        throw error;
      }
      if (best) {
        break;
      }
      searchCap = error.reason;
      break;
    }
  }
  if (searchCap) {
    const legacy = legacyRoute();
    recordFallback(context.metrics, searchCap, plan.edge.id, plan.lcaContainerId);
    if (
      !validateSameContainerRoute(legacy, source, target, plan.lcaContainerId, result) ||
      (plan.bundleSize > 1 && !routeSatisfiesPairConstraints(legacy, pairRoutes))
    ) {
      if (context.metrics) {
        context.metrics.fallbackValidationFailures++;
      }
      throw gridError('GRID_ROUTE_NOT_FOUND', `Invalid legacy fallback for "${plan.edge.id}"`, {
        edgeId: plan.edge.id,
        reason: searchCap,
      });
    }
    (context.occupancy.routes as RouterPoint[][]).push(legacy);
    return legacy;
  }
  if (!best) {
    if (context.metrics) {
      context.metrics.routesImpossible++;
    }
    throw gridError(
      'GRID_ROUTE_NOT_FOUND',
      plan.bundleSize > 1
        ? `No distinct lane route for "${plan.edge.id}"`
        : `No cell-aware route for "${plan.edge.id}"`,
      {
        edgeId: plan.edge.id,
      }
    );
  }
  if (options.onDualRouteComparison) {
    const legacy = legacyRoute();
    const sparseNormalized = normalizePolyline(best.points);
    const legacyNormalized = normalizePolyline(legacy);
    options.onDualRouteComparison({
      edgeId: plan.edge.id,
      sparse: {
        valid: true,
        length: routeLength(best.points),
        bends: sparseNormalized.bends,
      },
      legacy: {
        valid: validateSameContainerRoute(legacy, source, target, plan.lcaContainerId, result),
        length: routeLength(legacy),
        bends: legacyNormalized.bends,
      },
    });
  }
  (context.occupancy.routes as RouterPoint[][]).push(best.points);
  return best.points;
}

function selfLoopAttachments(
  owner: Node,
  side: GridSide
): { start: EndpointCandidate; target: EndpointCandidate } | undefined {
  const interval = sideInterval(owner, side);
  if (!interval || interval.high - interval.low < SELF_LOOP_PORT_GAP) {
    return undefined;
  }
  const rect = rectForNode(owner);
  const center = (interval.low + interval.high) / 2;
  const coordinates = [center - SELF_LOOP_PORT_GAP / 2, center + SELF_LOOP_PORT_GAP / 2];
  const candidate = (coordinate: number): EndpointCandidate => {
    const port =
      side === 'left' || side === 'right'
        ? { x: side === 'left' ? rect.left : rect.right, y: coordinate }
        : { x: coordinate, y: side === 'top' ? rect.top : rect.bottom };
    return {
      ownerId: owner.id,
      side,
      port,
      connect: {
        x:
          port.x +
          (side === 'left' ? -TERMINAL_APPROACH_PX : side === 'right' ? TERMINAL_APPROACH_PX : 0),
        y:
          port.y +
          (side === 'top' ? -TERMINAL_APPROACH_PX : side === 'bottom' ? TERMINAL_APPROACH_PX : 0),
      },
      rank: 0,
    };
  };
  return { start: candidate(coordinates[0]), target: candidate(coordinates[1]) };
}

function sparseSelfLoopRoute(
  plan: EdgeRoutePlan,
  owner: Node,
  result: GridLayoutResult,
  context: GridRoutingContext,
  searchWorkspace: RouterSearchWorkspace,
  overlayScratch: EndpointOverlayScratch | undefined,
  ownerSideCounts: Map<string, number>,
  selfLoopCounts: Map<string, number>,
  pairRoutes: readonly (readonly Point[])[],
  options: GridRoutingOptions
): { points: Point[]; side: GridSide; index: number } {
  const containerId = owner.parentId ?? ROOT_CONTAINER_ID;
  const fallbackReason = context.fallbackContainers.get(containerId) as
    | GridRoutingFallbackReason
    | undefined;
  const legacyRoute = (): { points: Point[]; side: GridSide; index: number } =>
    routeObstacleClearSelfLoop(owner, ownerSideCounts, selfLoopCounts, result);
  if (fallbackReason) {
    const legacy = legacyRoute();
    recordFallback(context.metrics, fallbackReason, plan.edge.id, containerId);
    if (
      !validateSameContainerRoute(legacy.points, owner, owner, containerId, result) ||
      !routeSatisfiesPairConstraints(legacy.points, pairRoutes)
    ) {
      if (context.metrics) {
        context.metrics.fallbackValidationFailures++;
      }
      throw gridError('GRID_ROUTE_NOT_FOUND', `Invalid legacy fallback for "${plan.edge.id}"`, {
        edgeId: plan.edge.id,
        reason: fallbackReason,
      });
    }
    return legacy;
  }
  const topology = context.topologies.get(containerId);
  if (!topology || !overlayScratch) {
    throw gridError('GRID_ROUTE_NOT_FOUND', `Missing routing topology "${containerId}"`);
  }
  for (const side of orderedSelfLoopSides(owner, ownerSideCounts, selfLoopCounts)) {
    const attachments = selfLoopAttachments(owner, side);
    if (!attachments) {
      continue;
    }
    const { start, target } = attachments;
    try {
      const overlay = buildEndpointRoutingOverlay(
        topology,
        start.connect,
        target.connect,
        context.metrics,
        overlayScratch,
        [
          {
            x: (start.connect.x + target.connect.x) / 2,
            y: (start.connect.y + target.connect.y) / 2,
          },
        ]
      );
      const sourceId = overlay.pointVertexIds.get(routingPointKey(start.connect));
      const targetId = overlay.pointVertexIds.get(routingPointKey(target.connect));
      if (sourceId === undefined || targetId === undefined) {
        throw new Error('Self-loop endpoint projection is missing from the routing overlay');
      }
      const orientation: GridOrientation = side === 'left' || side === 'right' ? 'H' : 'V';
      const route = findShortestRoute(overlay, sourceId, targetId, {
        metrics: context.metrics,
        caps: {
          ...options.searchCaps,
          maxEstimatedBytes:
            options.searchCaps?.maxEstimatedBytes ??
            options.topologyCaps?.maxEstimatedBytes ??
            DEFAULT_MAX_ESTIMATED_BYTES,
        },
        recordOutcome: false,
        budget: context.searchBudget,
        initialOrientation: orientation,
        initialSide: side,
        initialLength: TERMINAL_APPROACH_PX,
        targetOrientation: orientation,
        targetSide: side,
        targetLength: TERMINAL_APPROACH_PX,
        topologyValidated: true,
        workspace: searchWorkspace,
        estimatedBytesBase:
          context.baseEstimatedBytes + overlay.estimatedBytes - topology.estimatedBytes,
        arcAllowed: (from, to) => pairArcAllowed(from, to, pairRoutes),
      });
      if (!route) {
        continue;
      }
      const points = normalizePolyline([start.port, ...route.points, target.port]).points;
      if (
        validateSameContainerRoute(points, owner, owner, containerId, result) &&
        routeSatisfiesPairConstraints(points, pairRoutes)
      ) {
        return {
          points,
          side,
          index: selfLoopCounts.get(`${owner.id}:${side}`) ?? 0,
        };
      }
    } catch (error) {
      if (!(error instanceof GridRoutingResourceLimitError)) {
        throw error;
      }
      const legacy = legacyRoute();
      recordFallback(context.metrics, error.reason, plan.edge.id, containerId);
      if (
        !validateSameContainerRoute(legacy.points, owner, owner, containerId, result) ||
        !routeSatisfiesPairConstraints(legacy.points, pairRoutes)
      ) {
        if (context.metrics) {
          context.metrics.fallbackValidationFailures++;
        }
        throw gridError('GRID_ROUTE_NOT_FOUND', `Invalid legacy fallback for "${plan.edge.id}"`, {
          edgeId: plan.edge.id,
          reason: error.reason,
        });
      }
      return legacy;
    }
  }
  if (context.metrics) {
    context.metrics.routesImpossible++;
  }
  throw gridError('GRID_ROUTE_NOT_FOUND', `No distinct self-loop route for "${plan.edge.id}"`, {
    edgeId: plan.edge.id,
    nodeId: owner.id,
  });
}

function sparseContainerSegment(
  edgeId: string,
  containerId: GridContainerId,
  start: SegmentAttachment,
  end: SegmentAttachment,
  legacyRoute: () => Point[],
  result: GridLayoutResult,
  context: GridRoutingContext,
  searchWorkspace: RouterSearchWorkspace,
  overlayScratch: EndpointOverlayScratch | undefined,
  options: GridRoutingOptions,
  pairRoutes: readonly (readonly Point[])[] = [],
  endAlternatives: () => readonly SegmentAttachmentAlternative[] = () => [],
  startAlternatives: () => readonly SegmentAttachmentAlternative[] = () => [],
  allowSharedPairCorridors = false
): Point[] {
  const fallbackReason = context.fallbackContainers.get(containerId) as
    | GridRoutingFallbackReason
    | undefined;
  if (fallbackReason) {
    const legacy = legacyRoute();
    recordFallback(context.metrics, fallbackReason, edgeId, containerId);
    if (
      !validateContainerSegment(legacy, start.ownerId, end.ownerId, containerId, result) ||
      !routeSatisfiesPairConstraints(legacy, pairRoutes)
    ) {
      if (context.metrics) {
        context.metrics.fallbackValidationFailures++;
      }
      throw gridError('GRID_ROUTE_NOT_FOUND', `Invalid legacy fallback for "${edgeId}"`, {
        edgeId,
        containerId,
        reason: fallbackReason,
      });
    }
    return legacy;
  }
  const topology = context.topologies.get(containerId);
  if (!topology || !overlayScratch) {
    throw gridError('GRID_ROUTE_NOT_FOUND', `Missing routing topology "${containerId}"`);
  }
  const attempts: {
    start: SegmentAttachment;
    end: SegmentAttachment;
    select: readonly (() => void)[];
  }[] = [{ start, end, select: [] }];
  let alternativesAdded = false;
  const appendAlternatives = (): void => {
    if (alternativesAdded) {
      return;
    }
    alternativesAdded = true;
    const starts = startAlternatives();
    const ends = endAlternatives();
    attempts.push(
      ...ends.map((alternative) => ({
        start,
        end: alternative.attachment,
        select: [alternative.select],
      })),
      ...starts.map((alternative) => ({
        start: alternative.attachment,
        end,
        select: [alternative.select],
      })),
      ...starts.flatMap((startAlternative) =>
        ends.map((endAlternative) => ({
          start: startAlternative.attachment,
          end: endAlternative.attachment,
          select: [startAlternative.select, endAlternative.select],
        }))
      )
    );
  };
  try {
    for (const [attemptIndex, attempt] of attempts.entries()) {
      const attemptedStart = attempt.start;
      const attemptedEnd = attempt.end;
      if (attemptIndex > 0 && context.metrics) {
        context.metrics.hierarchyPortalAlternativeAttempts++;
      }
      const aligned = areExactlyAxisAligned(attemptedStart.connect, attemptedEnd.connect);
      if (aligned) {
        const direct = normalizePolyline([
          attemptedStart.port,
          attemptedStart.connect,
          attemptedEnd.connect,
          attemptedEnd.port,
        ]).points;
        if (
          validateContainerSegment(
            direct,
            attemptedStart.ownerId,
            attemptedEnd.ownerId,
            containerId,
            result
          ) &&
          routeSatisfiesPairConstraints(direct, pairRoutes)
        ) {
          for (const select of attempt.select) {
            select();
          }
          if (attemptIndex > 0 && context.metrics) {
            context.metrics.hierarchyPortalAlternativeSelections++;
          }
          return direct;
        }
      }
      const overlay = buildEndpointRoutingOverlay(
        topology,
        attemptedStart.connect,
        attemptedEnd.connect,
        context.metrics,
        overlayScratch
      );
      const liveEstimatedBytes =
        context.baseEstimatedBytes + overlay.estimatedBytes - topology.estimatedBytes;
      if (
        liveEstimatedBytes >
        (options.topologyCaps?.maxEstimatedBytes ?? DEFAULT_MAX_ESTIMATED_BYTES)
      ) {
        throw new GridRoutingResourceLimitError(
          'estimated_memory_cap',
          'Grid routing estimated_memory_cap exceeded'
        );
      }
      const sourceId = overlay.pointVertexIds.get(routingPointKey(attemptedStart.connect));
      const targetId = overlay.pointVertexIds.get(routingPointKey(attemptedEnd.connect));
      if (sourceId === undefined || targetId === undefined) {
        if (attemptIndex === 0) {
          appendAlternatives();
        }
        continue;
      }
      const route = findShortestRoute(overlay, sourceId, targetId, {
        metrics: context.metrics,
        caps: {
          ...options.searchCaps,
          maxEstimatedBytes:
            options.searchCaps?.maxEstimatedBytes ??
            options.topologyCaps?.maxEstimatedBytes ??
            DEFAULT_MAX_ESTIMATED_BYTES,
        },
        recordOutcome: false,
        budget: context.searchBudget,
        initialOrientation:
          attemptedStart.side === 'left' || attemptedStart.side === 'right' ? 'H' : 'V',
        initialSide: attemptedStart.side,
        initialLength:
          Math.abs(attemptedStart.port.x - attemptedStart.connect.x) +
          Math.abs(attemptedStart.port.y - attemptedStart.connect.y),
        targetOrientation:
          attemptedEnd.side === 'left' || attemptedEnd.side === 'right' ? 'H' : 'V',
        targetSide: attemptedEnd.side,
        targetLength:
          Math.abs(attemptedEnd.port.x - attemptedEnd.connect.x) +
          Math.abs(attemptedEnd.port.y - attemptedEnd.connect.y),
        topologyValidated: true,
        workspace: searchWorkspace,
        estimatedBytesBase: liveEstimatedBytes,
        arcAllowed:
          pairRoutes.length > 0 ? (from, to) => pairArcAllowed(from, to, pairRoutes) : undefined,
      });
      if (!route) {
        if (attemptIndex === 0) {
          appendAlternatives();
        }
        continue;
      }
      const points = normalizePolyline([
        attemptedStart.port,
        ...route.points,
        attemptedEnd.port,
      ]).points;
      if (
        !validateContainerSegment(
          points,
          attemptedStart.ownerId,
          attemptedEnd.ownerId,
          containerId,
          result
        ) ||
        !routeSatisfiesPairConstraints(points, pairRoutes)
      ) {
        if (attemptIndex === 0) {
          appendAlternatives();
        }
        continue;
      }
      for (const select of attempt.select) {
        select();
      }
      if (attemptIndex > 0 && context.metrics) {
        context.metrics.hierarchyPortalAlternativeSelections++;
      }
      return points;
    }
  } catch (error) {
    if (!(error instanceof GridRoutingResourceLimitError)) {
      throw error;
    }
    const legacy = legacyRoute();
    recordFallback(context.metrics, error.reason, edgeId, containerId);
    if (
      !validateContainerSegment(legacy, start.ownerId, end.ownerId, containerId, result) ||
      !routeSatisfiesPairConstraints(legacy, pairRoutes)
    ) {
      if (context.metrics) {
        context.metrics.fallbackValidationFailures++;
      }
      throw gridError('GRID_ROUTE_NOT_FOUND', `Invalid legacy fallback for "${edgeId}"`, {
        edgeId,
        containerId,
        reason: error.reason,
      });
    }
    return legacy;
  }
  const compatibility = legacyRoute();
  if (
    validateContainerSegment(compatibility, start.ownerId, end.ownerId, containerId, result) &&
    (routeSatisfiesPairConstraints(compatibility, pairRoutes) ||
      (allowSharedPairCorridors && routeHasDistinctPairPorts(compatibility, pairRoutes)))
  ) {
    if (context.metrics) {
      context.metrics.compatibilitySegments++;
      context.metrics.compatibilityRecoveries++;
    }
    return compatibility;
  }
  throw gridError(
    'GRID_ROUTE_NOT_FOUND',
    `No hierarchy route for "${edgeId}" in "${containerId}" from ${routingPointKey(start.connect)} to ${routingPointKey(end.connect)}`,
    { edgeId, containerId }
  );
}

export function routeGridEdges(
  layout: LayoutData,
  result: GridLayoutResult,
  metrics?: GridRoutingInstrumentation,
  options: GridRoutingOptions = {}
): void {
  rootContainerMeta(result);
  const plans = collectRoutePlans(layout, result);
  const pairCounts = new Map<string, number>();
  const endpointIncidentCounts = new Map<string, number>();
  for (const plan of plans) {
    const key = endpointPairKey(plan.edge);
    pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
    if (plan.edge.start) {
      endpointIncidentCounts.set(
        plan.edge.start,
        (endpointIncidentCounts.get(plan.edge.start) ?? 0) + 1
      );
    }
    if (plan.edge.end && plan.edge.end !== plan.edge.start) {
      endpointIncidentCounts.set(
        plan.edge.end,
        (endpointIncidentCounts.get(plan.edge.end) ?? 0) + 1
      );
    }
  }
  const eligiblePlans = plans.filter(
    (plan) =>
      plan.edge.start !== plan.edge.end &&
      plan.source.chain.length === 1 &&
      plan.target.chain.length === 1 &&
      plan.source.finalKind === 'item' &&
      plan.target.finalKind === 'item'
  );
  const endpointDemandsByOwner = new Map<string, EndpointDemandEntry[]>();
  for (const plan of eligiblePlans) {
    const source = result.forest.nodeById.get(plan.edge.start!);
    const target = result.forest.nodeById.get(plan.edge.end!);
    if (!source || !target) {
      continue;
    }
    const sourceDemands = endpointDemandsByOwner.get(source.id) ?? [];
    sourceDemands.push({ plan, role: 'source', opposite: target });
    endpointDemandsByOwner.set(source.id, sourceDemands);
    const targetDemands = endpointDemandsByOwner.get(target.id) ?? [];
    targetDemands.push({ plan, role: 'target', opposite: source });
    endpointDemandsByOwner.set(target.id, targetDemands);
  }
  const endpointCandidatesByEdge = new Map(
    eligiblePlans.map((plan) => [
      plan.edge.id,
      {
        sources: endpointCandidates(plan, 'source', endpointDemandsByOwner, result),
        targets: endpointCandidates(plan, 'target', endpointDemandsByOwner, result),
      },
    ])
  );
  const endpointCandidateProducts = new Map(
    [...endpointCandidatesByEdge].map(([edgeId, candidates]) => [
      edgeId,
      candidates.sources.length * candidates.targets.length,
    ])
  );
  const routeClass = (plan: EdgeRoutePlan): number => {
    const source = result.forest.nodeById.get(plan.edge.start!);
    const target = result.forest.nodeById.get(plan.edge.end!);
    if (plan.edge.start === plan.edge.end) {
      return 0;
    }
    if (
      (source?.isGroup && target && isAncestorGroup(source.id, target, result.forest.nodeById)) ||
      (target?.isGroup && source && isAncestorGroup(target.id, source, result.forest.nodeById))
    ) {
      return 1;
    }
    if ((source?.parentId ?? ROOT_CONTAINER_ID) !== (target?.parentId ?? ROOT_CONTAINER_ID)) {
      return 2;
    }
    return pairCounts.get(endpointPairKey(plan.edge))! > 1 ? 3 : 4;
  };
  const orderedPlans = [...plans].sort((a, b) => {
    const aUnordered = endpointPairKey(a.edge);
    const bUnordered = endpointPairKey(b.edge);
    const aDirected = `${a.edge.start ?? ''}|${a.edge.end ?? ''}`;
    const bDirected = `${b.edge.start ?? ''}|${b.edge.end ?? ''}`;
    const aBoundaryCount = a.source.chain.length + a.target.chain.length - 2;
    const bBoundaryCount = b.source.chain.length + b.target.chain.length - 2;
    return (
      routeClass(a) - routeClass(b) ||
      bBoundaryCount - aBoundaryCount ||
      (endpointCandidateProducts.get(a.edge.id) ?? 0) -
        (endpointCandidateProducts.get(b.edge.id) ?? 0) ||
      aUnordered.localeCompare(bUnordered) ||
      aDirected.localeCompare(bDirected) ||
      a.edge.id.localeCompare(b.edge.id)
    );
  });
  const demandCoords = assignDemandCoordinates(orderedPlans, result);
  const eligibleIds = new Set(eligiblePlans.map(({ edge }) => edge.id));
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
  const compatibilityLcaAttachments = (
    plan: EdgeRoutePlan
  ): { start: SegmentAttachment; end: SegmentAttachment } => {
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
  };
  const compatibilityPlanIsValid = (plan: EdgeRoutePlan): boolean => {
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
    for (const chain of [plan.source.chain, plan.target.chain]) {
      for (let index = 0; index < chain.length - 1; index++) {
        const from = chain[index];
        const to = chain[index + 1];
        const start: SegmentAttachment = {
          ownerId: from.ownerId,
          ...itemAttachment(
            from.ownerId,
            from.side,
            from.demandKey,
            to.ownerId,
            result,
            demandCoords
          ),
        };
        const end: SegmentAttachment = {
          ownerId: to.ownerId,
          ...boundaryAttachment(to.ownerId, to.side, to.demandKey, result, demandCoords),
        };
        if (!segmentIsValid(to.ownerId, start, end)) {
          return false;
        }
      }
    }
    const attachments = compatibilityLcaAttachments(plan);
    return segmentIsValid(plan.lcaContainerId, attachments.start, attachments.end);
  };
  const compatibilityFastRoutes = new Map<string, Point[]>();
  // Diagnostic caps and dual-route comparison must exercise the sparse router. In normal
  // rendering, reuse a validated Manhattan-minimal legacy route to avoid building topology.
  const compatibilityFastPathEnabled =
    options.topologyCaps === undefined &&
    options.searchCaps === undefined &&
    options.onDualRouteComparison === undefined;
  for (const plan of compatibilityFastPathEnabled ? eligiblePlans : []) {
    const candidates = endpointCandidatesByEdge.get(plan.edge.id);
    if (plan.bundleSize !== 1 || !candidates?.sources.length || !candidates.targets.length) {
      continue;
    }
    const source = result.forest.nodeById.get(plan.edge.start!);
    const target = result.forest.nodeById.get(plan.edge.end!);
    if (!source || !target) {
      continue;
    }
    const attachments = compatibilityLcaAttachments(plan);
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
    if (routeLength(route) !== lowerBoundLength) {
      if (metrics) {
        metrics.compatibilityFastPathNonMinimalRoutes++;
      }
      continue;
    }
    compatibilityFastRoutes.set(plan.edge.id, route);
  }
  const sparseHierarchyIds = new Set(
    plans
      .filter(
        (plan) =>
          !eligibleIds.has(plan.edge.id) &&
          plan.edge.start !== plan.edge.end &&
          (plan.bundleSize > 1 || hasIsolatedEndpoints(plan) || !compatibilityPlanIsValid(plan))
      )
      .map(({ edge }) => edge.id)
  );
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
  const context = buildRoutingContext(routedContainerIds, result, metrics, options);
  const searchWorkspace = new RouterSearchWorkspace();
  const endpointOverlayScratch = new Map(
    [...context.topologies].map(([containerId, topology]) => [
      containerId,
      new EndpointOverlayScratch(topology),
    ])
  );
  const pairedPortals = new Map<string, PairedPortal>();
  const pairedPortal = (entry: EdgeEndpointEntry): PairedPortal => {
    const existing = pairedPortals.get(entry.demandKey);
    if (existing) {
      return existing;
    }
    const owner = result.forest.nodeById.get(entry.ownerId);
    if (!owner?.isGroup) {
      throw gridError('GRID_ROUTE_NOT_FOUND', `Missing portal owner "${entry.ownerId}"`);
    }
    const rect = routerRect(owner);
    const coordinate =
      demandCoords.get(entry.demandKey) ??
      (entry.side === 'left' || entry.side === 'right'
        ? (rect.top + rect.bottom) / 2
        : (rect.left + rect.right) / 2);
    const range = derivePortalRanges(entry.ownerId, rect, owner.groupTitleRect).find(
      ({ side }) => side === entry.side
    );
    if (!range) {
      throw gridError(
        'GRID_ROUTE_NOT_FOUND',
        `No legal ${entry.side} portal for "${entry.ownerId}"`
      );
    }
    const portal = buildPairedPortal(
      entry.ownerId,
      rect,
      owner.groupTitleRect ? { ...owner.groupTitleRect } : undefined,
      entry.side,
      Math.max(range.low, Math.min(range.high, coordinate))
    );
    pairedPortals.set(entry.demandKey, portal);
    if (metrics) {
      metrics.hierarchyPortalPairs++;
      metrics.hierarchyPortalTransitionLength += portal.transition.length;
    }
    return portal;
  };
  const alternativePairedPortals = (
    entry: EdgeEndpointEntry,
    interior = true
  ): SegmentAttachmentAlternative[] => {
    const selected = pairedPortal(entry);
    const owner = result.forest.nodeById.get(entry.ownerId);
    if (!owner?.isGroup) {
      return [];
    }
    const rect = routerRect(owner);
    const range = derivePortalRanges(entry.ownerId, rect, owner.groupTitleRect).find(
      ({ side }) => side === entry.side
    );
    if (!range) {
      return [];
    }
    const container = result.containers.get(owner.id);
    const corridors =
      entry.side === 'left' || entry.side === 'right'
        ? container?.horizontalCorridors
        : container?.verticalCorridors;
    // Keep retries bounded and deterministic: nearby established corridors are preferred, with
    // range endpoints available when the originally selected portal blocks a hierarchy segment.
    return boundedAlternativePortalCoordinates(
      selected.tangentialCoordinate,
      range.low,
      range.high,
      corridors ?? []
    ).map((coordinate) => {
      const portal = buildPairedPortal(
        entry.ownerId,
        rect,
        owner.groupTitleRect ? { ...owner.groupTitleRect } : undefined,
        entry.side,
        coordinate
      );
      return {
        attachment: portalAttachment(portal, interior),
        select: () => {
          pairedPortals.set(entry.demandKey, portal);
          demandCoords.set(entry.demandKey, coordinate);
        },
      };
    });
  };
  const itemSegmentAttachment = (
    entry: EdgeEndpointEntry,
    containerId: GridContainerId
  ): SegmentAttachment => ({
    ownerId: entry.ownerId,
    ...itemAttachment(
      entry.ownerId,
      entry.side,
      entry.demandKey,
      containerId,
      result,
      demandCoords
    ),
  });
  const alternativeItemAttachments = (
    plan: EdgeRoutePlan,
    entry: EdgeEndpointEntry,
    containerId: GridContainerId
  ): SegmentAttachmentAlternative[] => {
    const current = itemSegmentAttachment(entry, containerId);
    const owner = result.forest.nodeById.get(entry.ownerId);
    if (!owner) {
      return [];
    }
    return (['right', 'bottom', 'left', 'top'] as const)
      .filter((side) => side !== current.side && !(side === 'top' && ownerGroupTitle(owner)))
      .map((side) => {
        const interval = sideInterval(owner, side);
        if (!interval) {
          return undefined;
        }
        const rect = rectForNode(owner);
        const center = side === 'left' || side === 'right' ? rect.cy : rect.cx;
        const coordinate = Math.max(
          interval.low,
          Math.min(interval.high, center + plan.laneOffset)
        );
        return {
          ownerId: entry.ownerId,
          ...itemAttachment(
            entry.ownerId,
            side,
            entry.demandKey,
            containerId,
            result,
            demandCoords,
            coordinate
          ),
        };
      })
      .filter((attachment): attachment is SegmentAttachment => attachment !== undefined)
      .slice(0, 3)
      .map((attachment) => ({
        attachment,
        select: () => undefined,
      }));
  };
  const ownerSideCounts = new Map<string, number>();
  const instrumentedRoutes: Point[][] | undefined = metrics ? [] : undefined;
  for (const demandKey of demandCoords.keys()) {
    const [, , ownerId, side] = demandKey.split(':');
    const key = `${ownerId}:${side}`;
    ownerSideCounts.set(key, (ownerSideCounts.get(key) ?? 0) + 1);
  }
  const selfLoopCounts = new Map<string, number>();
  const pairRoutes = new Map<string, Point[][]>();

  const routePlan = (plan: EdgeRoutePlan): void => {
    const edge = plan.edge;
    const sourceNode = edge.start ? result.forest.nodeById.get(edge.start) : undefined;
    const targetNode = edge.end ? result.forest.nodeById.get(edge.end) : undefined;
    if (!sourceNode || !targetNode) {
      throw gridError('GRID_MISSING_ENDPOINT', `Missing endpoint for edge "${edge.id}"`, {
        edgeId: edge.id,
      });
    }

    if (sourceNode.id === targetNode.id) {
      const committedPairRoutes = pairRoutes.get(plan.pairKey) ?? [];
      const { points, side, index } = sparseSelfLoopRoute(
        plan,
        sourceNode,
        result,
        context,
        searchWorkspace,
        endpointOverlayScratch.get(sourceNode.parentId ?? ROOT_CONTAINER_ID),
        ownerSideCounts,
        selfLoopCounts,
        committedPairRoutes,
        options
      );
      const countKey = `${sourceNode.id}:${side}`;
      selfLoopCounts.set(countKey, index + 1);
      edge.points = points;
      edge.curve = result.config.curve;
      edge.cornerRadius = result.config.edgeCornerRadius;
      committedPairRoutes.push(points);
      pairRoutes.set(plan.pairKey, committedPairRoutes);
      (context.occupancy.routes as RouterPoint[][]).push(points);
      if (metrics && instrumentedRoutes) {
        recordGridRoute(metrics, edge.id, points, instrumentedRoutes, 0, plan.laneOffset);
        instrumentedRoutes.push(points);
      }
      return;
    }

    const sourceFinal = plan.source.chain[plan.source.chain.length - 1];
    const targetFinal = plan.target.chain[plan.target.chain.length - 1];
    const useSparseLca = sparseLcaIds.has(edge.id);
    const lcaStart: SegmentAttachment = useSparseLca
      ? plan.source.finalKind === 'boundary'
        ? groupBoundaryEndpointAttachment(
            sourceFinal.ownerId,
            sourceFinal.side,
            sourceFinal.demandKey,
            result,
            demandCoords
          )
        : plan.source.chain.length > 1
          ? portalAttachment(pairedPortal(sourceFinal), false)
          : itemSegmentAttachment(sourceFinal, plan.lcaContainerId)
      : {
          ownerId: sourceFinal.ownerId,
          ...(plan.source.finalKind === 'boundary'
            ? boundaryAttachment(
                plan.lcaContainerId,
                sourceFinal.side,
                sourceFinal.demandKey,
                result,
                demandCoords
              )
            : itemAttachment(
                sourceFinal.ownerId,
                sourceFinal.side,
                sourceFinal.demandKey,
                plan.lcaContainerId,
                result,
                demandCoords
              )),
        };
    const lcaEnd: SegmentAttachment = useSparseLca
      ? plan.target.finalKind === 'boundary'
        ? groupBoundaryEndpointAttachment(
            targetFinal.ownerId,
            targetFinal.side,
            targetFinal.demandKey,
            result,
            demandCoords
          )
        : plan.target.chain.length > 1
          ? portalAttachment(pairedPortal(targetFinal), false)
          : itemSegmentAttachment(targetFinal, plan.lcaContainerId)
      : {
          ownerId: targetFinal.ownerId,
          ...(plan.target.finalKind === 'boundary'
            ? boundaryAttachment(
                plan.lcaContainerId,
                targetFinal.side,
                targetFinal.demandKey,
                result,
                demandCoords
              )
            : itemAttachment(
                targetFinal.ownerId,
                targetFinal.side,
                targetFinal.demandKey,
                plan.lcaContainerId,
                result,
                demandCoords
              )),
        };
    let legacyLcaPoints: Point[] | undefined;
    const legacyRoute = () =>
      (legacyLcaPoints ??= routeWithinContainer(
        plan.lcaContainerId,
        result,
        lcaStart,
        lcaEnd,
        plan.laneIndex
      ));
    const compatibilityFastRoute = compatibilityFastRoutes.get(edge.id);
    const lcaPoints = compatibilityFastRoute
      ? (() => {
          if (metrics) {
            metrics.compatibilityFastPaths++;
          }
          (context.occupancy.routes as RouterPoint[][]).push(compatibilityFastRoute);
          return compatibilityFastRoute;
        })()
      : eligibleIds.has(edge.id)
        ? sparseSameContainerRoute(
            plan,
            endpointCandidatesByEdge.get(edge.id)!.sources,
            endpointCandidatesByEdge.get(edge.id)!.targets,
            sourceNode,
            targetNode,
            legacyRoute,
            result,
            context,
            searchWorkspace,
            endpointOverlayScratch.get(plan.lcaContainerId)!,
            options,
            pairRoutes.get(plan.pairKey) ?? []
          )
        : useSparseLca
          ? sparseContainerSegment(
              edge.id,
              plan.lcaContainerId,
              lcaStart,
              lcaEnd,
              legacyRoute,
              result,
              context,
              searchWorkspace,
              endpointOverlayScratch.get(plan.lcaContainerId),
              options,
              pairRoutes.get(plan.pairKey) ?? [],
              () =>
                plan.target.finalKind === 'item' && plan.target.chain.length > 1
                  ? alternativePairedPortals(targetFinal, false)
                  : [],
              () =>
                plan.source.finalKind === 'item' && plan.source.chain.length > 1
                  ? alternativePairedPortals(sourceFinal, false)
                  : [],
              plan.bundleSize > 1
            )
          : validatedCompatibilitySegment(
              edge.id,
              plan.lcaContainerId,
              lcaStart,
              lcaEnd,
              legacyRoute,
              result,
              metrics
            );

    const routeHierarchyChain = (endpoint: EdgeEndpointPlan, chains: Point[][]): void => {
      for (let index = 0; index < endpoint.chain.length - 1; index++) {
        const from = endpoint.chain[index];
        const to = endpoint.chain[index + 1];
        if (!sparseHierarchyIds.has(edge.id)) {
          const start: SegmentAttachment = {
            ownerId: from.ownerId,
            ...itemAttachment(
              from.ownerId,
              from.side,
              from.demandKey,
              to.ownerId,
              result,
              demandCoords
            ),
          };
          const end: SegmentAttachment = {
            ownerId: to.ownerId,
            ...boundaryAttachment(to.ownerId, to.side, to.demandKey, result, demandCoords),
          };
          chains.push(
            validatedCompatibilitySegment(
              edge.id,
              to.ownerId,
              start,
              end,
              () => routeWithinContainer(to.ownerId, result, start, end, plan.laneIndex),
              result,
              metrics
            )
          );
          continue;
        }
        const start =
          index === 0
            ? itemSegmentAttachment(from, to.ownerId)
            : portalAttachment(pairedPortal(from), false);
        const end = portalAttachment(pairedPortal(to), true);
        chains.push(
          sparseContainerSegment(
            edge.id,
            to.ownerId,
            start,
            end,
            () => routeWithinContainer(to.ownerId, result, start, end, plan.laneIndex),
            result,
            context,
            searchWorkspace,
            endpointOverlayScratch.get(to.ownerId),
            options,
            pairRoutes.get(plan.pairKey) ?? [],
            () => alternativePairedPortals(to),
            () => (index === 0 ? alternativeItemAttachments(plan, from, to.ownerId) : []),
            plan.bundleSize > 1
          )
        );
      }
    };
    const sourceChains: Point[][] = [];
    const targetChains: Point[][] = [];
    routeHierarchyChain(plan.source, sourceChains);
    routeHierarchyChain(plan.target, targetChains);

    const points = combinePointChains([
      ...sourceChains,
      lcaPoints,
      ...targetChains.reverse().map((chain) => reversePoints(chain)),
    ]);
    const committedPairRoutes = pairRoutes.get(plan.pairKey) ?? [];
    const satisfiesPairConstraints = routeSatisfiesPairConstraints(points, committedPairRoutes);
    const relaxHierarchySeparation =
      !satisfiesPairConstraints &&
      plan.bundleSize > 1 &&
      plan.source.chain.length + plan.target.chain.length > 2 &&
      routeHasDistinctPairPorts(points, committedPairRoutes);
    if (plan.bundleSize > 1 && !satisfiesPairConstraints && !relaxHierarchySeparation) {
      if (metrics) {
        metrics.routesImpossible++;
      }
      throw gridError('GRID_ROUTE_NOT_FOUND', `No distinct lane route for "${edge.id}"`, {
        edgeId: edge.id,
      });
    }
    if (relaxHierarchySeparation && metrics) {
      metrics.bundleSeparationRelaxations++;
    }
    edge.points = points;
    edge.curve = result.config.curve;
    edge.cornerRadius = result.config.edgeCornerRadius;
    committedPairRoutes.push(points);
    pairRoutes.set(plan.pairKey, committedPairRoutes);
    if (metrics && instrumentedRoutes) {
      const boundaryTransitionCount = plan.source.chain.length + plan.target.chain.length - 2;
      recordGridRoute(
        metrics,
        edge.id,
        points,
        instrumentedRoutes,
        boundaryTransitionCount,
        plan.laneOffset
      );
      instrumentedRoutes.push(points);
    }
  };

  const plansByPair = new Map<string, EdgeRoutePlan[]>();
  for (const plan of orderedPlans) {
    const pairPlans = plansByPair.get(plan.pairKey) ?? [];
    pairPlans.push(plan);
    plansByPair.set(plan.pairKey, pairPlans);
  }

  for (const pairPlans of plansByPair.values()) {
    const canRetry =
      pairPlans.length > 1 &&
      pairPlans.length <= 8 &&
      pairPlans.every(({ edge }) => edge.start !== edge.end);
    if (!canRetry) {
      for (const plan of pairPlans) {
        routePlan(plan);
      }
      continue;
    }

    // A bundle is the retry unit because earlier siblings reserve corridors and portals for later
    // ones. Restore every shared structure before changing route order or the retry becomes biased.
    const occupancyRoutes = context.occupancy.routes as RouterPoint[][];
    const occupancyLength = occupancyRoutes.length;
    const portalSnapshot = new Map(pairedPortals);
    const demandSnapshot = new Map(demandCoords);
    const edgeSnapshot = new Map(
      pairPlans.map(({ edge }) => [
        edge.id,
        {
          points: edge.points,
          curve: edge.curve,
          cornerRadius: edge.cornerRadius,
        },
      ])
    );
    const instrumentedLength = instrumentedRoutes?.length ?? 0;
    const metricSnapshot = metrics
      ? {
          routeOrderLength: metrics.routeOrder.length,
          routesLength: metrics.routes.length,
          routesFound: metrics.routesFound,
          routeLength: metrics.routeLength,
          bendCount: metrics.bendCount,
          crossingCount: metrics.crossingCount,
          sharedLength: metrics.sharedLength,
          hierarchyBoundaryTransitions: metrics.hierarchyBoundaryTransitions,
          hierarchyPortalPairs: metrics.hierarchyPortalPairs,
          hierarchyPortalTransitionLength: metrics.hierarchyPortalTransitionLength,
          hierarchyPortalAlternativeSelections: metrics.hierarchyPortalAlternativeSelections,
          compatibilitySegments: metrics.compatibilitySegments,
          compatibilityRecoveries: metrics.compatibilityRecoveries,
          bundleSeparationRelaxations: metrics.bundleSeparationRelaxations,
        }
      : undefined;
    const restorePairState = (): void => {
      occupancyRoutes.length = occupancyLength;
      pairRoutes.delete(pairPlans[0].pairKey);
      pairedPortals.clear();
      for (const [key, portal] of portalSnapshot) {
        pairedPortals.set(key, portal);
      }
      demandCoords.clear();
      for (const [key, coordinate] of demandSnapshot) {
        demandCoords.set(key, coordinate);
      }
      for (const { edge } of pairPlans) {
        const snapshot = edgeSnapshot.get(edge.id)!;
        edge.points = snapshot.points;
        edge.curve = snapshot.curve;
        edge.cornerRadius = snapshot.cornerRadius;
      }
      if (instrumentedRoutes) {
        instrumentedRoutes.length = instrumentedLength;
      }
      if (metrics && metricSnapshot) {
        metrics.routeOrder.length = metricSnapshot.routeOrderLength;
        metrics.routes.length = metricSnapshot.routesLength;
        metrics.routesFound = metricSnapshot.routesFound;
        metrics.routeLength = metricSnapshot.routeLength;
        metrics.bendCount = metricSnapshot.bendCount;
        metrics.crossingCount = metricSnapshot.crossingCount;
        metrics.sharedLength = metricSnapshot.sharedLength;
        metrics.hierarchyBoundaryTransitions = metricSnapshot.hierarchyBoundaryTransitions;
        metrics.hierarchyPortalPairs = metricSnapshot.hierarchyPortalPairs;
        metrics.hierarchyPortalTransitionLength = metricSnapshot.hierarchyPortalTransitionLength;
        metrics.hierarchyPortalAlternativeSelections =
          metricSnapshot.hierarchyPortalAlternativeSelections;
        metrics.compatibilitySegments = metricSnapshot.compatibilitySegments;
        metrics.compatibilityRecoveries = metricSnapshot.compatibilityRecoveries;
        metrics.bundleSeparationRelaxations = metricSnapshot.bundleSeparationRelaxations;
      }
    };

    try {
      for (const plan of pairPlans) {
        routePlan(plan);
      }
    } catch (initialError) {
      restorePairState();
      if (metrics) {
        metrics.bundleRetryAttempts++;
      }
      const retryPlans = [...pairPlans].sort((a, b) => {
        const aBoundaryCount = a.source.chain.length + a.target.chain.length - 2;
        const bBoundaryCount = b.source.chain.length + b.target.chain.length - 2;
        return (
          bBoundaryCount - aBoundaryCount ||
          Math.abs(b.laneOffset) - Math.abs(a.laneOffset) ||
          a.laneOffset - b.laneOffset ||
          a.edge.id.localeCompare(b.edge.id)
        );
      });
      try {
        for (const plan of retryPlans) {
          routePlan(plan);
        }
        if (metrics) {
          metrics.bundleRetrySuccesses++;
        }
      } catch {
        restorePairState();
        throw initialError;
      }
    }
  }
}
