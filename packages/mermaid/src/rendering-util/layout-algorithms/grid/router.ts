import type { Point } from '../../../types.js';
import type { Edge, LayoutData, Node } from '../../types.js';
import { normalizePolyline } from '../layout-utils/geometry.js';
import { polylineIntersectsRect, rectForNode } from '../layout-utils/helpers.js';
import type { Rect } from '../layout-utils/types.js';
import { isAncestorGroup } from './groups.js';
import { recordGridRoute, type GridRoutingInstrumentation } from './routerInstrumentation.js';
import type {
  GridAttachment,
  GridAttachmentDemand,
  GridContainerId,
  GridLayoutResult,
  GridSide,
} from './types.js';
import { ROOT_CONTAINER_ID, gridError } from './types.js';

const PORT_MARGIN = 4;
const ROOT_OUTER_MARGIN = 24;
const SELF_LOOP_PORT_GAP = 18;
const SELF_LOOP_APPROACH = 14;
const SELF_LOOP_TRACK_GAP = 18;
const SELF_LOOP_PORT_OFFSET_STEP = 4;

interface EdgeEndpointEntry {
  ownerId: string;
  side: GridSide;
  demandKey: string;
  oppositeCoord: number;
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
  const otherCenter = { x: other.x ?? 0, y: other.y ?? 0 };
  let current = endpoint;

  for (;;) {
    const side = preferredSide(current, otherCenter);
    chain.push({
      ownerId: current.id,
      side,
      demandKey: `${edgeId}:${role}:${current.id}:${side}`,
      oppositeCoord: oppositeCoordFor(rectForNode(other), side),
    });

    const parentId = current.parentId ?? ROOT_CONTAINER_ID;
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

    const parent = nodeById.get(parentId);
    if (!parent?.isGroup) {
      throw gridError('GRID_INVALID_CONTAINMENT', `Missing parent group "${parentId}"`, {
        traversedIds: chain.map((entry) => entry.ownerId),
      });
    }
    current = parent;
  }
}

function buildPairLaneIndexes(edges: Edge[]): Map<string, number> {
  const byPair = new Map<string, Edge[]>();
  for (const edge of edges) {
    if (!edge.start || !edge.end || edge.start === edge.end) {
      continue;
    }
    const pairKey =
      edge.start < edge.end ? `${edge.start}|${edge.end}` : `${edge.end}|${edge.start}`;
    if (!byPair.has(pairKey)) {
      byPair.set(pairKey, []);
    }
    byPair.get(pairKey)!.push(edge);
  }

  const out = new Map<string, number>();
  for (const entries of byPair.values()) {
    entries.sort((a, b) => a.id.localeCompare(b.id));
    entries.forEach((edge, index) => out.set(edge.id, index));
  }
  return out;
}

function collectRoutePlans(layout: LayoutData, result: GridLayoutResult): EdgeRoutePlan[] {
  const nodeById = result.forest.nodeById;
  const laneIndexes = buildPairLaneIndexes(layout.edges);

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
    return {
      edge,
      lcaContainerId,
      source: buildEndpointPlan(source, target, lcaContainerId, nodeById, edge.id, 'source'),
      target: buildEndpointPlan(target, source, lcaContainerId, nodeById, edge.id, 'target'),
      laneIndex: laneIndexes.get(edge.id) ?? 0,
    };
  });
}

function assignDemandCoordinates(
  plans: EdgeRoutePlan[],
  result: GridLayoutResult
): Map<string, number> {
  const nodeById = result.forest.nodeById;
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
    if (demands.length === 1 || span <= 0) {
      assigned.set(demands[0].demandKey, side === 'left' || side === 'right' ? rect.cy : rect.cx);
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
  demandCoords: Map<string, number>
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
    demandCoords.get(demandKey) ?? (side === 'left' || side === 'right' ? rect.cy : rect.cx);
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

export function routeGridEdges(
  layout: LayoutData,
  result: GridLayoutResult,
  metrics?: GridRoutingInstrumentation
): void {
  rootContainerMeta(result);
  const plans = collectRoutePlans(layout, result);
  const demandCoords = assignDemandCoordinates(plans, result);
  const ownerSideCounts = new Map<string, number>();
  for (const demandKey of demandCoords.keys()) {
    const [, , ownerId, side] = demandKey.split(':');
    const key = `${ownerId}:${side}`;
    ownerSideCounts.set(key, (ownerSideCounts.get(key) ?? 0) + 1);
  }
  const selfLoopCounts = new Map<string, number>();
  const instrumentedRoutes: Point[][] | undefined = metrics ? [] : undefined;

  for (const plan of plans) {
    const edge = plan.edge;
    const sourceNode = edge.start ? result.forest.nodeById.get(edge.start) : undefined;
    const targetNode = edge.end ? result.forest.nodeById.get(edge.end) : undefined;
    if (!sourceNode || !targetNode) {
      throw gridError('GRID_MISSING_ENDPOINT', `Missing endpoint for edge "${edge.id}"`, {
        edgeId: edge.id,
      });
    }

    if (sourceNode.id === targetNode.id) {
      const { points, side, index } = routeObstacleClearSelfLoop(
        sourceNode,
        ownerSideCounts,
        selfLoopCounts,
        result
      );
      const countKey = `${sourceNode.id}:${side}`;
      selfLoopCounts.set(countKey, index + 1);
      edge.points = points;
      edge.curve = 'linear';
      if (metrics && instrumentedRoutes) {
        recordGridRoute(metrics, edge.id, points, instrumentedRoutes);
        instrumentedRoutes.push(points);
      }
      continue;
    }

    const sourceChains: Point[][] = [];
    for (let index = 0; index < plan.source.chain.length - 1; index++) {
      const from = plan.source.chain[index];
      const to = plan.source.chain[index + 1];
      sourceChains.push(
        routeWithinContainer(
          to.ownerId,
          result,
          itemAttachment(from.ownerId, from.side, from.demandKey, to.ownerId, result, demandCoords),
          boundaryAttachment(to.ownerId, to.side, to.demandKey, result, demandCoords),
          plan.laneIndex
        )
      );
    }

    const targetChains: Point[][] = [];
    for (let index = 0; index < plan.target.chain.length - 1; index++) {
      const from = plan.target.chain[index];
      const to = plan.target.chain[index + 1];
      targetChains.push(
        routeWithinContainer(
          to.ownerId,
          result,
          itemAttachment(from.ownerId, from.side, from.demandKey, to.ownerId, result, demandCoords),
          boundaryAttachment(to.ownerId, to.side, to.demandKey, result, demandCoords),
          plan.laneIndex
        )
      );
    }

    const sourceFinal = plan.source.chain[plan.source.chain.length - 1];
    const targetFinal = plan.target.chain[plan.target.chain.length - 1];
    const lcaStart =
      plan.source.finalKind === 'boundary'
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
          );
    const lcaEnd =
      plan.target.finalKind === 'boundary'
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
          );
    const lcaPoints = routeWithinContainer(
      plan.lcaContainerId,
      result,
      lcaStart,
      lcaEnd,
      plan.laneIndex
    );

    const points = combinePointChains([
      ...sourceChains,
      lcaPoints,
      ...targetChains.reverse().map((chain) => reversePoints(chain)),
    ]);
    edge.points = points;
    edge.curve = 'linear';
    if (metrics && instrumentedRoutes) {
      recordGridRoute(metrics, edge.id, points, instrumentedRoutes);
      instrumentedRoutes.push(points);
    }
  }
}
