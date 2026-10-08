import type { Point } from '../../../types.js';
import type { Edge, LayoutData, Node } from '../../types.js';
import { PIXEL_EPSILON } from '../layout-utils/geometry.js';
import { clamp, compareCodeUnits, rectForNode } from '../layout-utils/helpers.js';
import { isAncestorGroup } from './groups.js';
import { ROUTE_CLEARANCE_PX, routingPointKey } from './routerTopology.js';
import type {
  GridAttachmentDemand,
  GridContainerId,
  GridLayoutResult,
  GridSide,
  RouterPoint,
} from './types.js';
import { ROOT_CONTAINER_ID, gridError } from './types.js';

// Planning is deterministic and side-effect free: it resolves hierarchy chains, bundle lanes,
// endpoint demand, and route order before the session creates any routing topology.
const MIN_PORT_SEPARATION_PX = 4;
export const TERMINAL_APPROACH_PX = 20;
export const LANE_SEPARATION_PX = 8;

export interface EdgeEndpointEntry {
  ownerId: string;
  side: GridSide;
  demandKey: string;
  oppositeCoord: number;
  preferredCoord: number;
  compactPortal: boolean;
}

export interface EdgeEndpointPlan {
  // Entries walk from the endpoint outward toward the least common container. Each adjacent pair
  // represents one hierarchy boundary that the final route must cross through a paired portal.
  chain: EdgeEndpointEntry[];
  finalKind: 'item' | 'boundary';
}

export interface EdgeRoutePlan {
  edge: Edge;
  lcaContainerId: GridContainerId;
  source: EdgeEndpointPlan;
  target: EdgeEndpointPlan;
  laneIndex: number;
  laneOffset: number;
  bundleSize: number;
  pairKey: string;
}

export interface EdgeRouteCandidates {
  sources: EndpointCandidate[];
  targets: EndpointCandidate[];
}

export interface PreparedEdgeRoutes {
  plans: EdgeRoutePlan[];
  eligiblePlans: EdgeRoutePlan[];
  eligibleIds: Set<string>;
  orderedPlans: EdgeRoutePlan[];
  demandCoords: Map<string, number>;
  endpointCandidatesByEdge: Map<string, EdgeRouteCandidates>;
  endpointIncidentCounts: Map<string, number>;
}

export function ownerGroupTitle(node: Node): boolean {
  return Boolean(node.groupTitleRect);
}

export function ownerSideKey(ownerId: string, side: GridSide): string {
  return JSON.stringify([ownerId, side]);
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
      demandKey: JSON.stringify([edgeId, role, current.id, side]),
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
    // Directed endpoint order and edge id make lane assignment stable even if input edges arrive in
    // a different order.
    entries.sort(
      (a, b) =>
        compareCodeUnits(`${a.start}|${a.end}`, `${b.start}|${b.end}`) ||
        compareCodeUnits(a.id, b.id)
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
  // Forward/backward constraint passes enforce minimum spacing; the final common shift preserves
  // the requested center of mass as far as the legal interval permits.
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
  const shift = clamp(averageDesired - averageAssigned, minimumShift, maximumShift);
  return coordinates.map((coordinate) => coordinate + shift);
}

function assignDemandCoordinates(
  plans: EdgeRoutePlan[],
  result: GridLayoutResult,
  endpointIncidentCounts: ReadonlyMap<string, number>
): Map<string, number> {
  // Allocate all demands for an owner side together. This prevents independently routed edges from
  // selecting the same port and lets bundles retain symmetric lane offsets when capacity allows.
  const nodeById = result.forest.nodeById;
  const planByEdgeId = new Map(plans.map((plan) => [plan.edge.id, plan]));
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

  const byOwnerSide = new Map<
    string,
    { ownerId: string; side: GridSide; demands: GridAttachmentDemand[] }
  >();
  for (const demand of demandByKey.values()) {
    const key = ownerSideKey(demand.ownerId, demand.side);
    const group = byOwnerSide.get(key) ?? {
      ownerId: demand.ownerId,
      side: demand.side,
      demands: [],
    };
    group.demands.push(demand);
    byOwnerSide.set(key, group);
  }

  const assigned = new Map<string, number>();
  for (const { ownerId, side, demands } of byOwnerSide.values()) {
    const owner = nodeById.get(ownerId);
    if (!owner) {
      continue;
    }
    const rect = rectForNode(owner);
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
    const span = Math.max(0, high - low);
    demands.sort(
      (a, b) => a.oppositeCoord - b.oppositeCoord || compareCodeUnits(a.edgeId, b.edgeId)
    );
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
          endpointIncidentCounts.get(plan.edge.start!) === plan.bundleSize &&
          endpointIncidentCounts.get(plan.edge.end!) === plan.bundleSize
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
        const clamped = clamp(demand.preferredCoord, low, high);
        const nearest = corridorCoordinates?.reduce(
          (best, coordinate) =>
            Math.abs(coordinate - clamped) < Math.abs(best - clamped) ? coordinate : best,
          corridorCoordinates[0]
        );
        return nearest !== undefined && Math.abs(nearest - clamped) <= PIXEL_EPSILON
          ? nearest
          : clamped;
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

export interface EndpointCandidate {
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

interface EndpointSlotAssignment {
  side: GridSide;
  coordinate: number;
}

export function sideOrder(side: GridSide): number {
  // Endpoint preference order is independent of topology's canonical record ordering.
  return side === 'right' ? 0 : side === 'bottom' ? 1 : side === 'left' ? 2 : 3;
}

export function sideInterval(
  owner: Node,
  side: GridSide
): { low: number; high: number } | undefined {
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
    compareCodeUnits(endpointPairKey(a.plan.edge), endpointPairKey(b.plan.edge)) ||
    compareCodeUnits(
      `${a.plan.edge.start}|${a.plan.edge.end}`,
      `${b.plan.edge.start}|${b.plan.edge.end}`
    ) ||
    compareCodeUnits(a.plan.edge.id, b.plan.edge.id) ||
    compareCodeUnits(a.role, b.role)
  );
}

function endpointDemandKey(demand: EndpointDemandEntry): string {
  return `${demand.plan.edge.id}:${demand.role}`;
}

function compareEndpointDemandIdentity(a: EndpointDemandEntry, b: EndpointDemandEntry): number {
  return (
    compareCodeUnits(endpointPairKey(a.plan.edge), endpointPairKey(b.plan.edge)) ||
    compareCodeUnits(
      `${a.plan.edge.start}|${a.plan.edge.end}`,
      `${b.plan.edge.start}|${b.plan.edge.end}`
    ) ||
    compareCodeUnits(a.plan.edge.id, b.plan.edge.id) ||
    compareCodeUnits(a.role, b.role)
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
    return new Map([[sorted[0], clamp(center, interval.low, interval.high)]]);
  }
  if ((interval.high - interval.low) / (sorted.length - 1) < MIN_PORT_SEPARATION_PX) {
    return new Map(
      sorted.map((demand, index) => [
        demand,
        interval.low + (index * (interval.high - interval.low)) / (sorted.length - 1),
      ])
    );
  }
  const desired = sorted.map(({ opposite }) => {
    const rect = rectForNode(opposite);
    const coordinate = side === 'left' || side === 'right' ? rect.cy : rect.cx;
    return clamp(coordinate, interval.low, interval.high);
  });
  const coordinates = assignCompactPortalCoordinates(desired, interval.low, interval.high);
  return new Map(sorted.map((demand, index) => [demand, coordinates[index]]));
}

function endpointSideCapacity(owner: Node, side: GridSide): number {
  const interval = sideInterval(owner, side);
  if (!interval) {
    return 0;
  }
  return 1 + Math.floor((interval.high - interval.low) / MIN_PORT_SEPARATION_PX);
}

function endpointSidePreferences(owner: Node, demand: EndpointDemandEntry): GridSide[] {
  const oppositeRect = rectForNode(demand.opposite);
  const preferred = preferredSide(owner, { x: oppositeRect.cx, y: oppositeRect.cy });
  const ownerRect = rectForNode(owner);
  return (['right', 'bottom', 'left', 'top'] as const)
    .filter((side) => endpointSideCapacity(owner, side) > 0)
    .sort((a, b) => {
      if (a === preferred) {
        return -1;
      }
      if (b === preferred) {
        return 1;
      }
      const midpoint = (side: GridSide): Point =>
        side === 'left' || side === 'right'
          ? {
              x: side === 'left' ? ownerRect.left : ownerRect.right,
              y: ownerRect.cy,
            }
          : {
              x: ownerRect.cx,
              y: side === 'top' ? ownerRect.top : ownerRect.bottom,
            };
      const aPoint = midpoint(a);
      const bPoint = midpoint(b);
      const aDistance = Math.abs(aPoint.x - oppositeRect.cx) + Math.abs(aPoint.y - oppositeRect.cy);
      const bDistance = Math.abs(bPoint.x - oppositeRect.cx) + Math.abs(bPoint.y - oppositeRect.cy);
      return aDistance - bDistance || sideOrder(a) - sideOrder(b);
    });
}

function allocateEndpointSlots(
  owner: Node,
  demands: readonly EndpointDemandEntry[]
): ReadonlyMap<string, EndpointSlotAssignment> {
  // Assignment is greedy but deterministic: stable demand identity chooses first, geometric side
  // preference chooses second, and side capacity prevents accidental over-subscription when possible.
  const assignedBySide = new Map<GridSide, EndpointDemandEntry[]>();
  const capacities = new Map(
    (['right', 'bottom', 'left', 'top'] as const).map((side) => [
      side,
      endpointSideCapacity(owner, side),
    ])
  );

  for (const demand of [...demands].sort(compareEndpointDemandIdentity)) {
    const preferences = endpointSidePreferences(owner, demand);
    if (preferences.length === 0) {
      continue;
    }
    const side =
      preferences.find(
        (candidate) =>
          (assignedBySide.get(candidate)?.length ?? 0) < (capacities.get(candidate) ?? 0)
      ) ?? preferences[0];
    const assigned = assignedBySide.get(side) ?? [];
    assigned.push(demand);
    assignedBySide.set(side, assigned);
  }

  const assignments = new Map<string, EndpointSlotAssignment>();
  for (const [side, assigned] of assignedBySide) {
    const interval = sideInterval(owner, side);
    if (!interval) {
      continue;
    }
    const preferredCoordinates = preferredEndpointCoordinates(owner, side, assigned);
    const sorted = [...assigned].sort((a, b) => compareEndpointDemands(a, b, side));
    for (const [index, demand] of sorted.entries()) {
      const coordinate =
        preferredCoordinates.get(demand) ??
        (sorted.length === 1
          ? (interval.low + interval.high) / 2
          : interval.low + (index * (interval.high - interval.low)) / (sorted.length - 1));
      assignments.set(endpointDemandKey(demand), { side, coordinate });
    }
  }
  return assignments;
}

function endpointCandidates(
  plan: EdgeRoutePlan,
  role: 'source' | 'target',
  demandsByOwner: ReadonlyMap<string, readonly EndpointDemandEntry[]>,
  assignmentsByOwner: ReadonlyMap<string, ReadonlyMap<string, EndpointSlotAssignment>>,
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

  const assignment = assignmentsByOwner.get(ownerId)?.get(`${plan.edge.id}:${role}`);
  // Negative ranks reserve precedence for the globally allocated slot and the bundle lane. The
  // remaining geometric alternatives are re-ranked after deterministic sorting.
  if (assignment && plan.bundleSize === 1) {
    addCandidate(assignment.side, assignment.coordinate, -2);
  }

  if (plan.bundleSize > 1) {
    const side = preferredSide(owner, { x: oppositeRect.cx, y: oppositeRect.cy });
    const ownerRect = rectForNode(owner);
    const center = side === 'left' || side === 'right' ? ownerRect.cy : ownerRect.cx;
    addCandidate(side, center + plan.laneOffset, -1);
  }

  const ownerDemands = [...(demandsByOwner.get(ownerId) ?? [])];
  for (const side of ['right', 'bottom', 'left', 'top'] as const) {
    const interval = sideInterval(owner, side);
    if (!interval) {
      continue;
    }
    const coordinates = preferredEndpointCoordinates(owner, side, ownerDemands);
    const demand = ownerDemands.find((entry) => entry.plan === plan && entry.role === role);
    const coordinate = demand ? coordinates.get(demand) : undefined;
    if (coordinate === undefined) {
      continue;
    }
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

export function prepareEdgeRoutes(
  layout: LayoutData,
  result: GridLayoutResult
): PreparedEdgeRoutes {
  // Route order is a correctness input because committed routes constrain later bundle siblings.
  // Harder hierarchy and loop routes go first, followed by fewer candidate combinations and stable
  // lexical tie-breakers.
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
  const endpointAssignmentsByOwner = new Map(
    [...endpointDemandsByOwner].map(([ownerId, demands]) => {
      const owner = result.forest.nodeById.get(ownerId);
      return [ownerId, owner ? allocateEndpointSlots(owner, demands) : new Map()] as const;
    })
  );
  const endpointCandidatesByEdge = new Map(
    eligiblePlans.map((plan) => [
      plan.edge.id,
      {
        sources: endpointCandidates(
          plan,
          'source',
          endpointDemandsByOwner,
          endpointAssignmentsByOwner,
          result
        ),
        targets: endpointCandidates(
          plan,
          'target',
          endpointDemandsByOwner,
          endpointAssignmentsByOwner,
          result
        ),
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
      compareCodeUnits(aUnordered, bUnordered) ||
      compareCodeUnits(aDirected, bDirected) ||
      compareCodeUnits(a.edge.id, b.edge.id)
    );
  });
  return {
    plans,
    eligiblePlans,
    eligibleIds: new Set(eligiblePlans.map(({ edge }) => edge.id)),
    orderedPlans,
    demandCoords: assignDemandCoordinates(orderedPlans, result, endpointIncidentCounts),
    endpointCandidatesByEdge,
    endpointIncidentCounts,
  };
}
