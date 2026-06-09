/**
 * Port assignment logic for the orthogonal routing pipeline.
 *
 * This module handles RP1 Stage 1: deterministic side selection and boundary port computation.
 * It determines which sides of nodes edges should connect to based on relative positions.
 */
import type { Node } from '../../../types.js';
import type { Point, Rect, PortSide, AssignedPorts } from '../types.js';
import {
  rectForNode,
  computeBoundaryPort,
  pointInRectInterior,
  clamp,
  pointInsideAnyRectInterior,
} from './helpers.js';
import {
  antiZAdjustSide,
  computeBoundaryPortAtT,
  determineSideOnRect,
  intersectRectBoundary,
  projectOtherCenterToSide,
} from './geometry.js';

export interface AssignedPortEndpoint {
  side: PortSide;
  /** Normalized coordinate along side in [0,1]. */
  t: number;
  port: Point;
  indexOnSide: number;
}

export interface AssignedPortPlan {
  startByEdgeId: Map<string, AssignedPortEndpoint>;
  endByEdgeId: Map<string, AssignedPortEndpoint>;
}

/**
 * RP1 Stage 1 (initial cut): deterministic side selection + boundary ports.
 *
 * For now we assign the *center* of the chosen side as the port position.
 * Track-based port offsets (multiple ports per side) will be introduced when
 * Stage 4/5 ordering + nudging exist to keep ports and tracks consistent.
 */
export function assignPortsForEdge(startNode: Node, endNode: Node): AssignedPorts {
  const rs = rectForNode(startNode);
  const re = rectForNode(endNode);
  const startId = startNode?.id != null ? String((startNode as any).id) : '';
  const endId = endNode?.id != null ? String((endNode as any).id) : '';

  // Self-loop: route out-and-back on the same side.
  // The exact t-positioning along the side is handled elsewhere (portDistribution / computeBoundaryPortAtT).
  // Here we only pick a deterministic side.
  if (startId && endId && startId === endId) {
    const startSide: PortSide = 'E';
    const endSide: PortSide = 'E';
    const startPort = computeBoundaryPort(rs, startSide);
    const endPort = computeBoundaryPort(rs, endSide);
    return { startSide, endSide, startPort, endPort };
  }
  const dx = re.cx - rs.cx;
  const dy = re.cy - rs.cy;

  let startSide: PortSide;
  let endSide: PortSide;

  if (Math.abs(dx) >= Math.abs(dy)) {
    // Prefer horizontal flow.
    if (dx >= 0) {
      startSide = 'E';
      endSide = 'W';
    } else {
      startSide = 'W';
      endSide = 'E';
    }
  } else {
    // Prefer vertical flow.
    if (dy >= 0) {
      startSide = 'S';
      endSide = 'N';
    } else {
      startSide = 'N';
      endSide = 'S';
    }
  }

  const startPort = computeBoundaryPort(rs, startSide);
  const endPort = computeBoundaryPort(re, endSide);
  return { startSide, endSide, startPort, endPort };
}

/**
 * RP1 Stage 1 (strengthened): graph-level port assignment.
 *
 * Inputs: node rects, edges, barycenter.
 * Outputs: per edge-end: (side, paramAlongSide) in a stable order.
 *
 * Implements:
 * - center-line boundary hit (ray intersection)
 * - quarter-split Z-avoid (anti-Z corner adjustment)
 * - circular/ray-order based ordering on each side
 * - even distribution along the side with corner exclusion
 *
 * This stage must consider *all* endpoint consumers, including label-split edges
 * that end at `edge-label-*` nodes, so local ordering remains consistent even
 * when auxiliary nodes exist.
 */
export function assignPortsForGraph(
  data: { nodes?: Node[]; edges?: { id?: any; start?: any; end?: any }[] },
  nodesById: Map<string, Node>,
  spacing: number
): AssignedPortPlan {
  interface PortEndpoint {
    edgeId: string;
    kind: 'start' | 'end';
    nodeId: string;
    otherNodeId: string;
    side: PortSide;
    orderCoord: number;
  }

  const perNodeSide = new Map<string, PortEndpoint[]>();
  const perNodeCounts = new Map<string, Record<PortSide, number>>();
  const loops: { edgeId: string; nodeId: string }[] = [];
  const loopAssignments: { edgeId: string; nodeId: string; side: PortSide }[] = [];

  const nodeCenters: Point[] = [];
  for (const n of nodesById.values()) {
    if (n?.x == null || n?.y == null) {
      continue;
    }
    nodeCenters.push({ x: n.x, y: n.y });
  }
  const bary = nodeCenters.length
    ? {
        x: nodeCenters.reduce((s, p) => s + p.x, 0) / nodeCenters.length,
        y: nodeCenters.reduce((s, p) => s + p.y, 0) / nodeCenters.length,
      }
    : { x: 0, y: 0 };

  for (const edge of data.edges ?? []) {
    if (edge?.start == null || edge?.end == null) {
      continue;
    }
    const sId = String(edge.start);
    const tId = String(edge.end);
    const edgeId = String(edge.id ?? `${sId}->${tId}`);

    if (sId === tId) {
      loops.push({ edgeId, nodeId: sId });
      continue;
    }

    const sNode = nodesById.get(sId);
    const tNode = nodesById.get(tId);
    if (!sNode || !tNode) {
      continue;
    }
    if (sNode.isGroup || tNode.isGroup) {
      continue;
    }

    const sRect = rectForNode(sNode);
    const tRect = rectForNode(tNode);
    const sHit = intersectRectBoundary(sRect, { x: tRect.cx, y: tRect.cy });
    const tHit = intersectRectBoundary(tRect, { x: sRect.cx, y: sRect.cy });
    const sSideBase = determineSideOnRect(sHit, sRect);
    const tSideBase = determineSideOnRect(tHit, tRect);
    const sBaryVec = { x: sRect.cx - bary.x, y: sRect.cy - bary.y };
    const tBaryVec = { x: tRect.cx - bary.x, y: tRect.cy - bary.y };
    const sSide = antiZAdjustSide(sSideBase, sHit, sRect, sBaryVec);
    const tSide = antiZAdjustSide(tSideBase, tHit, tRect, tBaryVec);

    const sProj = projectOtherCenterToSide(sRect, { x: tRect.cx, y: tRect.cy }, sSide);
    const tProj = projectOtherCenterToSide(tRect, { x: sRect.cx, y: sRect.cy }, tSide);

    const k1 = `${sId}:${sSide}`;
    const k2 = `${tId}:${tSide}`;
    if (!perNodeSide.has(k1)) {
      perNodeSide.set(k1, []);
    }
    if (!perNodeSide.has(k2)) {
      perNodeSide.set(k2, []);
    }

    perNodeSide.get(k1)!.push({
      edgeId,
      kind: 'start',
      nodeId: sId,
      otherNodeId: tId,
      side: sSide,
      orderCoord: sSide === 'E' || sSide === 'W' ? sProj.y : sProj.x,
    });
    perNodeSide.get(k2)!.push({
      edgeId,
      kind: 'end',
      nodeId: tId,
      otherNodeId: sId,
      side: tSide,
      orderCoord: tSide === 'E' || tSide === 'W' ? tProj.y : tProj.x,
    });

    if (!perNodeCounts.has(sId)) {
      perNodeCounts.set(sId, { N: 0, E: 0, S: 0, W: 0 });
    }
    if (!perNodeCounts.has(tId)) {
      perNodeCounts.set(tId, { N: 0, E: 0, S: 0, W: 0 });
    }
    perNodeCounts.get(sId)![sSide] += 1;
    perNodeCounts.get(tId)![tSide] += 1;
  }

  // Assign self-loops to the least populated side on that node (deterministic tie-break N,E,S,W).
  for (const loop of loops) {
    const node = nodesById.get(loop.nodeId);
    if (!node) {
      continue;
    }
    const counts = perNodeCounts.get(loop.nodeId) ?? { N: 0, E: 0, S: 0, W: 0 };
    const r = rectForNode(node);
    const sideLength = (side: PortSide): number =>
      side === 'E' || side === 'W' ? r.bottom - r.top : r.right - r.left;
    const minLoopSideLength = Math.max(12, spacing * 2);
    const sides: PortSide[] = ['N', 'E', 'S', 'W'];
    sides.sort((a, b) => {
      const aTooShort = sideLength(a) < minLoopSideLength;
      const bTooShort = sideLength(b) < minLoopSideLength;
      return Number(aTooShort) - Number(bTooShort) || counts[a] - counts[b] || a.localeCompare(b);
    });
    const side = sides[0];
    loopAssignments.push({ edgeId: loop.edgeId, nodeId: loop.nodeId, side });
    const key = `${loop.nodeId}:${side}`;
    if (!perNodeSide.has(key)) {
      perNodeSide.set(key, []);
    }
    const centerCoord = side === 'E' || side === 'W' ? r.cy : r.cx;
    perNodeSide.get(key)!.push({
      edgeId: loop.edgeId,
      kind: 'start',
      nodeId: loop.nodeId,
      otherNodeId: loop.nodeId,
      side,
      orderCoord: centerCoord - 0.001,
    });
    perNodeSide.get(key)!.push({
      edgeId: loop.edgeId,
      kind: 'end',
      nodeId: loop.nodeId,
      otherNodeId: loop.nodeId,
      side,
      orderCoord: centerCoord + 0.001,
    });
    if (!perNodeCounts.has(loop.nodeId)) {
      perNodeCounts.set(loop.nodeId, counts);
    }
    perNodeCounts.get(loop.nodeId)![side] += 2;
  }

  const startByEdgeId = new Map<string, AssignedPortEndpoint>();
  const endByEdgeId = new Map<string, AssignedPortEndpoint>();

  for (const [key, endpoints] of perNodeSide.entries()) {
    const [nodeId, side] = key.split(':') as [string, PortSide];
    const node = nodesById.get(nodeId);
    if (!node) {
      continue;
    }
    const r = rectForNode(node);
    const vertical = side === 'E' || side === 'W';
    const len = vertical ? r.bottom - r.top : r.right - r.left;
    const k = endpoints.length;
    if (k <= 0 || len <= 1e-9) {
      continue;
    }

    // Prefer spacing-ish distribution when there is room, otherwise best-effort even spacing.
    const targetAvailable = spacing * (k + 1);
    const margin = Math.max(0, (len - targetAvailable) / 2);
    const available = Math.max(0, len - 2 * margin);

    endpoints.sort((a, b) => {
      if (a.orderCoord !== b.orderCoord) {
        return a.orderCoord - b.orderCoord;
      }
      // Keep multi-edges (same neighbor) adjacent.
      if (a.otherNodeId !== b.otherNodeId) {
        return a.otherNodeId.localeCompare(b.otherNodeId);
      }
      if (a.edgeId !== b.edgeId) {
        return a.edgeId.localeCompare(b.edgeId);
      }
      return a.kind.localeCompare(b.kind);
    });

    // Corner exclusion (quarters): use the middle half [0.25,0.75] in normalized coordinates.
    const lo = 0.25;
    const hi = 0.75;
    for (let i = 0; i < k; i++) {
      const tEven = margin + ((i + 1) * available) / (k + 1);
      const absAlong = clamp(tEven, 0, len);
      const tNormFull = absAlong / len;
      const tNorm = k === 1 ? 0.5 : lo + (i * (hi - lo)) / (k - 1);
      // Blend: preserve spacing-aware margins, but enforce corner exclusion ordering deterministically.
      const t = clamp(k <= 2 ? tNorm : (tNorm + tNormFull) / 2, lo, hi);
      const port = computeBoundaryPortAtT(r, side, t);
      const ep: AssignedPortEndpoint = { side, t, port, indexOnSide: i };
      const e = endpoints[i];
      if (e.kind === 'start') {
        startByEdgeId.set(e.edgeId, ep);
      } else {
        endByEdgeId.set(e.edgeId, ep);
      }
    }
  }

  for (const loop of loopAssignments) {
    const node = nodesById.get(loop.nodeId);
    if (!node) {
      continue;
    }
    const r = rectForNode(node);
    const startT = 0.25;
    const endT = 0.75;
    startByEdgeId.set(loop.edgeId, {
      side: loop.side,
      t: startT,
      port: computeBoundaryPortAtT(r, loop.side, startT),
      indexOnSide: 0,
    });
    endByEdgeId.set(loop.edgeId, {
      side: loop.side,
      t: endT,
      port: computeBoundaryPortAtT(r, loop.side, endT),
      indexOnSide: 1,
    });
  }

  return { startByEdgeId, endByEdgeId };
}

/**
 * Choose a boundary port for a node that lies outside the interior of all
 * other nodes. This is important for vertically stacked chains where
 * default ports might sit inside another node's rectangle.
 *
 * Returns the first port found that is outside all other nodes' interiors,
 * or null if no such port exists.
 */
export function chooseBoundaryPortOutsideOtherNodes(
  nodeId: string,
  otherNodeId: string,
  nodesById: Map<string, Node>,
  options: { preferredSide?: PortSide; candidatePort?: Point } = {}
): Point | null {
  const node = nodesById.get(nodeId);
  if (!node) {
    return null;
  }
  const rect = rectForNode(node);

  // Build list of obstacle rects (all nodes except the two endpoints)
  const obstacleRects: Rect[] = [];
  for (const [id, n] of nodesById) {
    if (id === nodeId || id === otherNodeId) {
      continue;
    }
    obstacleRects.push(rectForNode(n));
  }

  // If the caller already has a candidate port (typically the stage-1 assigned port),
  // keep it unless it's actually inside another node. This avoids arbitrarily picking
  // E/W ports (due to iteration order) and creating needless detours.
  if (options.candidatePort) {
    let insideAny = false;
    for (const obsRect of obstacleRects) {
      if (pointInRectInterior(options.candidatePort, obsRect)) {
        insideAny = true;
        break;
      }
    }
    if (!insideAny) {
      return options.candidatePort;
    }
  }

  // Try each side's center port
  const baseSides: PortSide[] = ['E', 'W', 'N', 'S'];
  const preferred = options.preferredSide;
  const sides: PortSide[] = preferred
    ? [preferred, ...baseSides.filter((s) => s !== preferred)]
    : baseSides;
  for (const side of sides) {
    const port = computeBoundaryPort(rect, side);
    let insideAny = false;
    for (const obsRect of obstacleRects) {
      if (pointInRectInterior(port, obsRect)) {
        insideAny = true;
        break;
      }
    }
    if (!insideAny) {
      return port;
    }
  }

  return null;
}

/**
 * Check if a point is inside any of the provided rectangles' interiors.
 */
export { pointInsideAnyRectInterior };
