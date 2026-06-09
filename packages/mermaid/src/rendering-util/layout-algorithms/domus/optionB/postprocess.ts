import type { LayoutData, Node, Edge } from '../../../types.js';
import type { Point, OrthogonalOptions } from '../types.js';
import { rectForNode, approxEqual, clamp } from '../core/helpers.js';
import {
  antiZAdjustSide,
  clipPolylineEndpointsToRects,
  normalizedTForSide,
  projectOtherCenterToSide,
  sideOutDirUnit,
} from '../core/geometry.js';
import { compressCollinear } from '../core/routing.js';

type Orientation = 'H' | 'V';

interface SegmentRef {
  edge: Edge;
  edgeId: string;
  // points[i1] -> points[i2]
  i1: number;
  i2: number;
  orientation: Orientation;
  // current fixed coordinate (x for V, y for H)
  fixedCoord: number;
  // interval on the other axis: [a,b]
  a: number;
  b: number;
  // stable key used for ordering lanes within a corridor
  segmentKey: string;
  // stable identity for the segment within the edge polyline (based on indices)
  segId: string;
  // constrained-mode: segments incident to ports must not move
  isPortSegment: boolean;
}

interface PortIndexInfo {
  startIndexByEdgeId: Map<string, number>;
  endIndexByEdgeId: Map<string, number>;
}

interface PortMeta {
  nodeId: string;
  side: 'N' | 'E' | 'S' | 'W';
  indexOnSide: number;
  t: number; // normalized [0,1]
  point: Point;
}

interface PortAssignment {
  startByEdgeId: Map<string, PortMeta>;
  endByEdgeId: Map<string, PortMeta>;
  indices: PortIndexInfo;
}

function snapToGrid(v: number, eps: number): number {
  if (eps <= 0) {
    return v;
  }
  return Math.round(v / eps) * eps;
}

function _overlaps1D(a1: number, a2: number, b1: number, b2: number): boolean {
  return Math.max(a1, b1) < Math.min(a2, b2);
}

function _segmentKeyFor(
  orientation: Orientation,
  fixedCoordBase: number,
  a: number,
  b: number,
  snap: number
): string {
  const fb = snapToGrid(fixedCoordBase, snap);
  const ab = snapToGrid(a, snap);
  const bb = snapToGrid(b, snap);
  return `${orientation}:${fb}:${ab}:${bb}`;
}

function baseKeyFor(orientation: Orientation, fixedCoordBase: number, snap: number): string {
  const fb = snapToGrid(fixedCoordBase, snap);
  return `${orientation}:${fb}`;
}

function determinePortSide(point: Point, node: Node): 'N' | 'E' | 'S' | 'W' {
  const r = rectForNode(node);
  const dxL = Math.abs(point.x - r.left);
  const dxR = Math.abs(point.x - r.right);
  const dyT = Math.abs(point.y - r.top);
  const dyB = Math.abs(point.y - r.bottom);
  const best = Math.min(dxL, dxR, dyT, dyB);
  if (best === dxL) {
    return 'W';
  }
  if (best === dxR) {
    return 'E';
  }
  if (best === dyT) {
    return 'N';
  }
  return 'S';
}

function _computePortIndices(data: LayoutData, nodesById: Map<string, Node>): PortIndexInfo {
  interface PortEntry {
    edgeId: string;
    kind: 'start' | 'end';
    t: number;
  }
  const perNodeSide = new Map<string, PortEntry[]>();

  for (const edge of data.edges ?? []) {
    if (edge?.id == null || edge.start == null || edge.end == null) {
      continue;
    }
    if (!edge.points || edge.points.length < 2) {
      continue;
    }
    const edgeId = String(edge.id);
    const startId = String(edge.start);
    const endId = String(edge.end);
    const startNode = nodesById.get(startId);
    const endNode = nodesById.get(endId);
    if (!startNode || !endNode) {
      continue;
    }

    const startPt = edge.points[0];
    const endPt = edge.points[edge.points.length - 1];

    const startSide = determinePortSide(startPt, startNode);
    const endSide = determinePortSide(endPt, endNode);

    const startT = startSide === 'E' || startSide === 'W' ? startPt.y : startPt.x;
    const endT = endSide === 'E' || endSide === 'W' ? endPt.y : endPt.x;

    const k1 = `${startId}:${startSide}`;
    const k2 = `${endId}:${endSide}`;
    if (!perNodeSide.has(k1)) {
      perNodeSide.set(k1, []);
    }
    if (!perNodeSide.has(k2)) {
      perNodeSide.set(k2, []);
    }
    perNodeSide.get(k1)!.push({ edgeId, kind: 'start', t: startT });
    perNodeSide.get(k2)!.push({ edgeId, kind: 'end', t: endT });
  }

  const startIndexByEdgeId = new Map<string, number>();
  const endIndexByEdgeId = new Map<string, number>();

  for (const entries of perNodeSide.values()) {
    entries.sort((a, b) => {
      if (a.t !== b.t) {
        return a.t - b.t;
      }
      if (a.edgeId !== b.edgeId) {
        return a.edgeId.localeCompare(b.edgeId);
      }
      return a.kind.localeCompare(b.kind);
    });
    for (const [i, e] of entries.entries()) {
      if (e.kind === 'start') {
        startIndexByEdgeId.set(e.edgeId, i);
      } else {
        endIndexByEdgeId.set(e.edgeId, i);
      }
    }
  }

  return { startIndexByEdgeId, endIndexByEdgeId };
}

function intersectRectBoundary(rect: ReturnType<typeof rectForNode>, target: Point): Point {
  const cx = rect.cx;
  const cy = rect.cy;
  const dx = target.x - cx;
  const dy = target.y - cy;
  if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) {
    return { x: rect.cx, y: rect.cy };
  }

  interface Hit {
    t: number;
    x: number;
    y: number;
  }
  const hits: Hit[] = [];

  if (Math.abs(dx) > 1e-9) {
    // left
    let t = (rect.left - cx) / dx;
    if (t > 0) {
      const y = cy + t * dy;
      if (y >= rect.top - 1e-9 && y <= rect.bottom + 1e-9) {
        hits.push({ t, x: rect.left, y });
      }
    }
    // right
    t = (rect.right - cx) / dx;
    if (t > 0) {
      const y = cy + t * dy;
      if (y >= rect.top - 1e-9 && y <= rect.bottom + 1e-9) {
        hits.push({ t, x: rect.right, y });
      }
    }
  }
  if (Math.abs(dy) > 1e-9) {
    // top
    let t = (rect.top - cy) / dy;
    if (t > 0) {
      const x = cx + t * dx;
      if (x >= rect.left - 1e-9 && x <= rect.right + 1e-9) {
        hits.push({ t, x, y: rect.top });
      }
    }
    // bottom
    t = (rect.bottom - cy) / dy;
    if (t > 0) {
      const x = cx + t * dx;
      if (x >= rect.left - 1e-9 && x <= rect.right + 1e-9) {
        hits.push({ t, x, y: rect.bottom });
      }
    }
  }

  hits.sort((a, b) => a.t - b.t);
  const h = hits[0];
  return h ? { x: h.x, y: h.y } : { x: rect.cx, y: rect.cy };
}

function clipEndpointsToBoxes(data: LayoutData, nodesById: Map<string, Node>): void {
  for (const edge of data.edges ?? []) {
    if (edge?.id == null || edge.start == null || edge.end == null) {
      continue;
    }
    if (!edge.points || edge.points.length < 2) {
      continue;
    }
    const startNode = nodesById.get(String(edge.start));
    const endNode = nodesById.get(String(edge.end));
    if (!startNode || !endNode) {
      continue;
    }
    const rs = rectForNode(startNode);
    const re = rectForNode(endNode);
    edge.points = clipPolylineEndpointsToRects(edge.points, rs, re);
  }
}

function distributePortsOnBoxSides(
  data: LayoutData,
  nodesById: Map<string, Node>,
  spacing: number
): PortAssignment {
  interface PortEndpoint {
    edge: Edge;
    edgeId: string;
    kind: 'start' | 'end';
    side: 'N' | 'E' | 'S' | 'W';
    nodeId: string;
    otherNodeId: string;
    // ordering key derived from circular order of rays from the node center to the other node
    orderCoord: number;
  }
  const perNodeSide = new Map<string, PortEndpoint[]>();
  const perNodeCounts = new Map<string, Record<'N' | 'E' | 'S' | 'W', number>>();
  const loops: { edge: Edge; edgeId: string; nodeId: string }[] = [];
  const loopAssignments: {
    edge: Edge;
    edgeId: string;
    nodeId: string;
    side: 'N' | 'E' | 'S' | 'W';
  }[] = [];

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
    if (edge?.id == null || edge.start == null || edge.end == null) {
      continue;
    }
    if (!edge.points || edge.points.length < 2) {
      continue;
    }
    const edgeId = String(edge.id);
    const sId = String(edge.start);
    const tId = String(edge.end);
    if (sId === tId) {
      loops.push({ edge, edgeId, nodeId: sId });
      continue;
    }
    const sNode = nodesById.get(sId);
    const tNode = nodesById.get(tId);
    if (!sNode || !tNode) {
      continue;
    }
    const sPt = edge.points[0];
    const tPt = edge.points[edge.points.length - 1];
    const sSide = determinePortSide(sPt, sNode);
    const tSide = determinePortSide(tPt, tNode);

    const k1 = `${sId}:${sSide}`;
    const k2 = `${tId}:${tSide}`;
    if (!perNodeSide.has(k1)) {
      perNodeSide.set(k1, []);
    }
    if (!perNodeSide.has(k2)) {
      perNodeSide.set(k2, []);
    }
    const sRect = rectForNode(sNode);
    const tRect = rectForNode(tNode);
    // Port side selection is based on center-to-center ray intersection.
    const sHit = intersectRectBoundary(sRect, { x: tRect.cx, y: tRect.cy });
    const tHit = intersectRectBoundary(tRect, { x: sRect.cx, y: sRect.cy });
    const sBaryVec = { x: sRect.cx - bary.x, y: sRect.cy - bary.y };
    const tBaryVec = { x: tRect.cx - bary.x, y: tRect.cy - bary.y };
    const sSideAdj = antiZAdjustSide(sSide, sHit, sRect, sBaryVec);
    const tSideAdj = antiZAdjustSide(tSide, tHit, tRect, tBaryVec);
    const sProj = projectOtherCenterToSide(sRect, { x: tRect.cx, y: tRect.cy }, sSideAdj);
    const tProj = projectOtherCenterToSide(tRect, { x: sRect.cx, y: sRect.cy }, tSideAdj);
    perNodeSide.get(k1)!.push({
      edge,
      edgeId,
      kind: 'start',
      side: sSideAdj,
      nodeId: sId,
      otherNodeId: tId,
      orderCoord: sSideAdj === 'E' || sSideAdj === 'W' ? sProj.y : sProj.x,
    });
    perNodeSide.get(k2)!.push({
      edge,
      edgeId,
      kind: 'end',
      side: tSideAdj,
      nodeId: tId,
      otherNodeId: sId,
      orderCoord: tSideAdj === 'E' || tSideAdj === 'W' ? tProj.y : tProj.x,
    });

    if (!perNodeCounts.has(sId)) {
      perNodeCounts.set(sId, { N: 0, E: 0, S: 0, W: 0 });
    }
    if (!perNodeCounts.has(tId)) {
      perNodeCounts.set(tId, { N: 0, E: 0, S: 0, W: 0 });
    }
    perNodeCounts.get(sId)![sSideAdj] += 1;
    perNodeCounts.get(tId)![tSideAdj] += 1;
  }

  // Assign self-loops to the least populated side on that node (deterministic tie-break N,E,S,W).
  for (const loop of loops) {
    const node = nodesById.get(loop.nodeId);
    if (!node || !loop.edge.points || loop.edge.points.length < 2) {
      continue;
    }
    const counts = perNodeCounts.get(loop.nodeId) ?? { N: 0, E: 0, S: 0, W: 0 };
    const r = rectForNode(node);
    const sideLength = (side: 'N' | 'E' | 'S' | 'W'): number =>
      side === 'E' || side === 'W' ? r.bottom - r.top : r.right - r.left;
    const minLoopSideLength = Math.max(12, spacing * 2);
    const sides: ('N' | 'E' | 'S' | 'W')[] = ['N', 'E', 'S', 'W'];
    sides.sort((a, b) => {
      const aTooShort = sideLength(a) < minLoopSideLength;
      const bTooShort = sideLength(b) < minLoopSideLength;
      return Number(aTooShort) - Number(bTooShort) || counts[a] - counts[b] || a.localeCompare(b);
    });
    const side = sides[0];
    loopAssignments.push({ edge: loop.edge, edgeId: loop.edgeId, nodeId: loop.nodeId, side });
    const key = `${loop.nodeId}:${side}`;
    if (!perNodeSide.has(key)) {
      perNodeSide.set(key, []);
    }
    // orderCoord anchored at center for deterministic placement inside the side ordering.
    const centerCoord = side === 'E' || side === 'W' ? r.cy : r.cx;
    perNodeSide.get(key)!.push({
      edge: loop.edge,
      edgeId: loop.edgeId,
      kind: 'start',
      side,
      nodeId: loop.nodeId,
      otherNodeId: loop.nodeId,
      orderCoord: centerCoord - 0.001, // keep start before end deterministically
    });
    perNodeSide.get(key)!.push({
      edge: loop.edge,
      edgeId: loop.edgeId,
      kind: 'end',
      side,
      nodeId: loop.nodeId,
      otherNodeId: loop.nodeId,
      orderCoord: centerCoord + 0.001,
    });
    if (!perNodeCounts.has(loop.nodeId)) {
      perNodeCounts.set(loop.nodeId, counts);
    }
    perNodeCounts.get(loop.nodeId)![side] += 2;
  }

  const startByEdgeId = new Map<string, PortMeta>();
  const endByEdgeId = new Map<string, PortMeta>();
  const startIndexByEdgeId = new Map<string, number>();
  const endIndexByEdgeId = new Map<string, number>();

  for (const [key, endpoints] of perNodeSide.entries()) {
    const [nodeId, side] = key.split(':') as [string, 'N' | 'E' | 'S' | 'W'];
    const node = nodesById.get(nodeId);
    if (!node) {
      continue;
    }
    const r = rectForNode(node);
    const vertical = side === 'E' || side === 'W';
    const len = vertical ? r.bottom - r.top : r.right - r.left;
    // Try to achieve ~`spacing` distance between adjacent ports when possible.
    // If the side is too short, we fall back to a best-effort even spacing.
    const targetAvailable = spacing * (endpoints.length + 1);
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

    const k = endpoints.length;
    for (let i = 0; i < k; i++) {
      const t = margin + ((i + 1) * available) / (k + 1);
      const edge = endpoints[i].edge;
      const pts = edge.points!;
      const isStart = endpoints[i].kind === 'start';
      const idx = isStart ? 0 : pts.length - 1;
      const _p = pts[idx];

      if (vertical) {
        const x = side === 'W' ? r.left : r.right;
        const y = r.top + t;
        const point = { x, y };
        pts[idx] = point;
        const tn = normalizedTForSide(point, r, side);
        const meta: PortMeta = { nodeId, side, indexOnSide: i, t: tn, point };
        if (isStart) {
          startByEdgeId.set(endpoints[i].edgeId, meta);
          startIndexByEdgeId.set(endpoints[i].edgeId, i);
        } else {
          endByEdgeId.set(endpoints[i].edgeId, meta);
          endIndexByEdgeId.set(endpoints[i].edgeId, i);
        }
      } else {
        const y = side === 'N' ? r.top : r.bottom;
        const x = r.left + t;
        const point = { x, y };
        pts[idx] = point;
        const tn = normalizedTForSide(point, r, side);
        const meta: PortMeta = { nodeId, side, indexOnSide: i, t: tn, point };
        if (isStart) {
          startByEdgeId.set(endpoints[i].edgeId, meta);
          startIndexByEdgeId.set(endpoints[i].edgeId, i);
        } else {
          endByEdgeId.set(endpoints[i].edgeId, meta);
          endIndexByEdgeId.set(endpoints[i].edgeId, i);
        }
      }
    }
  }

  for (const loop of loopAssignments) {
    const node = nodesById.get(loop.nodeId);
    const pts = loop.edge.points;
    if (!node || !pts || pts.length < 2) {
      continue;
    }
    const r = rectForNode(node);
    const startT = 0.25;
    const endT = 0.75;
    const startPoint = computePortPointAtT(r, loop.side, startT);
    const endPoint = computePortPointAtT(r, loop.side, endT);
    const pad = Math.max(20, spacing * 4);
    if (loop.side === 'E' || loop.side === 'W') {
      const xOut = loop.side === 'E' ? r.right + pad : r.left - pad;
      pts.splice(
        0,
        pts.length,
        startPoint,
        { x: xOut, y: startPoint.y },
        { x: xOut, y: endPoint.y },
        endPoint
      );
    } else {
      const yOut = loop.side === 'S' ? r.bottom + pad : r.top - pad;
      pts.splice(
        0,
        pts.length,
        startPoint,
        { x: startPoint.x, y: yOut },
        { x: endPoint.x, y: yOut },
        endPoint
      );
    }
    startByEdgeId.set(loop.edgeId, {
      nodeId: loop.nodeId,
      side: loop.side,
      indexOnSide: 0,
      t: startT,
      point: startPoint,
    });
    endByEdgeId.set(loop.edgeId, {
      nodeId: loop.nodeId,
      side: loop.side,
      indexOnSide: 1,
      t: endT,
      point: endPoint,
    });
    startIndexByEdgeId.set(loop.edgeId, 0);
    endIndexByEdgeId.set(loop.edgeId, 1);
  }

  return {
    startByEdgeId,
    endByEdgeId,
    indices: { startIndexByEdgeId, endIndexByEdgeId },
  };
}

function seedDetoursForMultiEdges(data: LayoutData): void {
  // Group by unordered pair of endpoints.
  const groups = new Map<string, Edge[]>();
  for (const e of data.edges ?? []) {
    if (e?.id == null || e.start == null || e.end == null) {
      continue;
    }
    const a = String(e.start);
    const b = String(e.end);
    const key = a < b ? `${a}::${b}` : `${b}::${a}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(e);
  }

  for (const edges of groups.values()) {
    if (edges.length <= 1) {
      continue;
    }
    for (const edge of edges) {
      if (!edge.points || edge.points.length < 2) {
        continue;
      }
      // If the route is a single straight segment, convert to an orthogonal polyline
      // with a stable midline. This gives the nudger internal segments to space.
      if (edge.points.length === 2) {
        const start = edge.points[0];
        const end = edge.points[1];
        // Choose a stable, non-collinear detour so multi-edges have internal
        // segments that survive collinear cleanup and can be nudged into lanes.
        const detour = 1; // minimal non-zero offset in diagram units
        if (approxEqual(start.y, end.y)) {
          // horizontal straight line: detour in Y
          const midY = start.y + detour;
          edge.points = [start, { x: start.x, y: midY }, { x: end.x, y: midY }, end];
        } else if (approxEqual(start.x, end.x)) {
          // vertical straight line: detour in X
          const midX = start.x + detour;
          edge.points = [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end];
        } else {
          // diagonal: L-shape via midpoint X
          const midX = (start.x + end.x) / 2;
          edge.points = [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end];
        }
      }
    }
  }
}

function mergeCollinearInPlace(edge: Edge): void {
  if (!edge.points || edge.points.length < 2) {
    return;
  }
  edge.points = compressCollinear(edge.points);
}

function manhattanDist(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function pointOutsideRectWithHalo(
  p: Point,
  r: ReturnType<typeof rectForNode>,
  halo: number
): boolean {
  const h = Math.max(0, halo);
  return p.x < r.left - h || p.x > r.right + h || p.y < r.top - h || p.y > r.bottom + h;
}

function orthogonalJoin(a: Point, b: Point): Point[] {
  if (approxEqual(a.x, b.x) || approxEqual(a.y, b.y)) {
    return [a, b];
  }
  // Prefer the elbow that avoids creating tiny segments.
  const e1: Point = { x: a.x, y: b.y };
  const e2: Point = { x: b.x, y: a.y };
  const s1 = Math.min(manhattanDist(a, e1), manhattanDist(e1, b));
  const s2 = Math.min(manhattanDist(a, e2), manhattanDist(e2, b));
  return s1 >= s2 ? [a, e1, b] : [a, e2, b];
}

function computePortPointAtT(
  r: ReturnType<typeof rectForNode>,
  side: 'N' | 'E' | 'S' | 'W',
  t: number
): Point {
  const tt = clamp(t, 0, 1);
  if (side === 'E') {
    return { x: r.right, y: r.top + tt * (r.bottom - r.top) };
  }
  if (side === 'W') {
    return { x: r.left, y: r.top + tt * (r.bottom - r.top) };
  }
  if (side === 'N') {
    return { x: r.left + tt * (r.right - r.left), y: r.top };
  }
  return { x: r.left + tt * (r.right - r.left), y: r.bottom };
}

function reconcilePortsToLaneOrder(
  data: LayoutData,
  nodesById: Map<string, Node>,
  segmentKeyBySegId: Map<string, string>,
  bundleOrder: Map<string, string[]>,
  spacing: number
): void {
  interface Endpoint {
    edge: Edge;
    edgeId: string;
    kind: 'start' | 'end';
    nodeId: string;
    side: 'N' | 'E' | 'S' | 'W';
    desiredLane: number;
    desiredCoord: number;
  }

  const halo = spacing; // "outside clearance halo" proxy for OptionB
  const endpointsByNodeSide = new Map<string, Endpoint[]>();

  const getDesired = (
    edge: Edge,
    edgeId: string,
    kind: 'start' | 'end',
    node: Node
  ): { lane: number; coord: number } => {
    const pts = edge.points ?? [];
    if (pts.length < 2) {
      return { lane: 0, coord: 0 };
    }
    const r = rectForNode(node);
    const scan = kind === 'start';
    const startIdx = scan ? 0 : pts.length - 1;
    const side = determinePortSide(pts[startIdx], node);
    const axisCoord = (p: Point) => (side === 'E' || side === 'W' ? p.y : p.x);

    // Find the first non-port segment with midpoint outside halo.
    // We use the corridor bundleOrder as the lane identity.
    let bestLane = 0;
    let bestCoord = axisCoord(pts[startIdx]);
    const segStart = scan ? 0 : pts.length - 2;
    const segEnd = scan ? pts.length - 2 : 0;
    const step = scan ? 1 : -1;
    for (let i = segStart; scan ? i <= segEnd : i >= segEnd; i += step) {
      const a = pts[i];
      const b = pts[i + 1];
      const isHoriz = approxEqual(a.y, b.y);
      const isVert = approxEqual(a.x, b.x);
      if (!isHoriz && !isVert) {
        continue;
      }
      const isPortSeg = scan ? i === 0 : i + 1 === pts.length - 1;
      if (isPortSeg) {
        continue;
      }
      const mid: Point = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      if (!pointOutsideRectWithHalo(mid, r, halo)) {
        continue;
      }

      const segId = `${edgeId}:${i}`;
      const k = segmentKeyBySegId.get(segId);
      const order = k ? (bundleOrder.get(k) ?? []) : [];
      const lane = order.length ? Math.max(0, order.indexOf(edgeId)) : 0;
      bestLane = lane >= 0 ? lane : 0;
      // If the segment is orthogonal to the side (e.g. leaving segment), use the first
      // point beyond it as a proxy for the occupied lane coordinate.
      bestCoord = axisCoord(mid);
      break;
    }
    return { lane: bestLane, coord: bestCoord };
  };

  for (const edge of data.edges ?? []) {
    if (edge?.id == null || edge.start == null || edge.end == null) {
      continue;
    }
    if (!edge.points || edge.points.length < 2) {
      continue;
    }
    const edgeId = String(edge.id);
    const sId = String(edge.start);
    const tId = String(edge.end);
    if (sId === tId) {
      continue;
    }
    const sNode = nodesById.get(sId);
    const tNode = nodesById.get(tId);
    if (!sNode || !tNode) {
      continue;
    }

    const sPt = edge.points[0];
    const tPt = edge.points[edge.points.length - 1];
    const sSide = determinePortSide(sPt, sNode);
    const tSide = determinePortSide(tPt, tNode);

    const sDesired = getDesired(edge, edgeId, 'start', sNode);
    const tDesired = getDesired(edge, edgeId, 'end', tNode);

    const k1 = `${sId}:${sSide}`;
    const k2 = `${tId}:${tSide}`;
    if (!endpointsByNodeSide.has(k1)) {
      endpointsByNodeSide.set(k1, []);
    }
    if (!endpointsByNodeSide.has(k2)) {
      endpointsByNodeSide.set(k2, []);
    }
    endpointsByNodeSide.get(k1)!.push({
      edge,
      edgeId,
      kind: 'start',
      nodeId: sId,
      side: sSide,
      desiredLane: sDesired.lane,
      desiredCoord: sDesired.coord,
    });
    endpointsByNodeSide.get(k2)!.push({
      edge,
      edgeId,
      kind: 'end',
      nodeId: tId,
      side: tSide,
      desiredLane: tDesired.lane,
      desiredCoord: tDesired.coord,
    });
  }

  // Reassign ports per node-side to match the desired lane order.
  for (const [key, eps] of endpointsByNodeSide.entries()) {
    if (eps.length <= 1) {
      continue;
    }
    const [nodeId, side] = key.split(':') as [string, 'N' | 'E' | 'S' | 'W'];
    const node = nodesById.get(nodeId);
    if (!node) {
      continue;
    }
    const r = rectForNode(node);

    eps.sort((a, b) => {
      if (a.desiredLane !== b.desiredLane) {
        return a.desiredLane - b.desiredLane;
      }
      if (a.desiredCoord !== b.desiredCoord) {
        return a.desiredCoord - b.desiredCoord;
      }
      return a.edgeId.localeCompare(b.edgeId) || a.kind.localeCompare(b.kind);
    });

    // Corner exclusion (quarters): use the middle half [0.25, 0.75] by default.
    const lo = 0.25;
    const hi = 0.75;
    const n = eps.length;
    const handleLen = Math.max(2, Math.min(20, spacing));
    const out = sideOutDirUnit(side);

    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : lo + (i * (hi - lo)) / (n - 1);
      const port = computePortPointAtT(r, side, t);
      const edge = eps[i].edge;
      const pts = edge.points!;
      const idx = eps[i].kind === 'start' ? 0 : pts.length - 1;

      // Update port point.
      pts[idx] = port;

      // Rebuild a short handle (port -> handlePt -> join -> existing).
      const handlePt: Point = { x: port.x + out.x * handleLen, y: port.y + out.y * handleLen };
      if (eps[i].kind === 'start') {
        const next = pts.length > 1 ? pts[1] : handlePt;
        const joined = orthogonalJoin(handlePt, next);
        // Replace [port, next] with [port, handlePt, ...joinedTail]
        pts.splice(0, 2, port, ...joined);
      } else {
        const prev = pts.length > 1 ? pts[pts.length - 2] : handlePt;
        const joined = orthogonalJoin(prev, handlePt);
        // Replace [prev, port] with [...joinedHead, port]
        pts.splice(-2, 2, ...joined, port);
      }

      edge.points = compressCollinear(edge.points!);
    }
  }
}

function extractSegments(
  data: LayoutData,
  options: { segmentKeySnap: number }
): {
  segments: SegmentRef[];
  segmentKeyBySegId: Map<string, string>;
} {
  const segmentKeyBySegId = new Map<string, string>();
  const segments: SegmentRef[] = [];
  const byBaseKey = new Map<string, SegmentRef[]>();

  for (const edge of data.edges ?? []) {
    if (edge?.id == null) {
      continue;
    }
    if (!edge.points || edge.points.length < 2) {
      continue;
    }
    const edgeId = String(edge.id);
    const pts = edge.points;
    const lastIdx = pts.length - 1;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const isHoriz = approxEqual(a.y, b.y);
      const isVert = approxEqual(a.x, b.x);
      if (!isHoriz && !isVert) {
        continue;
      }
      const orientation: Orientation = isVert ? 'V' : 'H';
      const fixedCoord = isVert ? a.x : a.y;
      const ia = isVert ? Math.min(a.y, b.y) : Math.min(a.x, b.x);
      const ib = isVert ? Math.max(a.y, b.y) : Math.max(a.x, b.x);
      const segId = `${edgeId}:${i}`;
      const baseKey = baseKeyFor(orientation, fixedCoord, options.segmentKeySnap);
      const seg: SegmentRef = {
        edge,
        edgeId,
        i1: i,
        i2: i + 1,
        orientation,
        fixedCoord,
        a: ia,
        b: ib,
        segmentKey: baseKey,
        segId,
        isPortSegment: i === 0 || i + 1 === lastIdx,
      };
      segments.push(seg);
      if (!byBaseKey.has(baseKey)) {
        byBaseKey.set(baseKey, []);
      }
      byBaseKey.get(baseKey)!.push(seg);
    }
  }

  // Corridor-style segment keys: within each snapped fixedCoord line, group overlapping
  // intervals into a single component so minor span differences still bundle together.
  // Deterministic sweep by (a,b,edgeId,segId).
  const overlapEps = 1e-6;
  for (const [baseKey, group] of byBaseKey.entries()) {
    group.sort((s1, s2) => {
      if (s1.a !== s2.a) {
        return s1.a - s2.a;
      }
      if (s1.b !== s2.b) {
        return s1.b - s2.b;
      }
      if (s1.edgeId !== s2.edgeId) {
        return s1.edgeId.localeCompare(s2.edgeId);
      }
      return s1.segId.localeCompare(s2.segId);
    });

    let compMinA = group[0].a;
    let compMaxB = group[0].b;
    let compMembers: SegmentRef[] = [group[0]];

    const flush = () => {
      const orientation = compMembers[0].orientation;
      const fb = baseKey.split(':')[1] ?? String(compMembers[0].fixedCoord);
      const key = `${orientation}:${fb}:${snapToGrid(compMinA, options.segmentKeySnap)}:${snapToGrid(
        compMaxB,
        options.segmentKeySnap
      )}`;
      for (const s of compMembers) {
        s.segmentKey = key;
        segmentKeyBySegId.set(s.segId, key);
      }
    };

    for (let i = 1; i < group.length; i++) {
      const s = group[i];
      if (s.a <= compMaxB + overlapEps) {
        compMaxB = Math.max(compMaxB, s.b);
        compMinA = Math.min(compMinA, s.a);
        compMembers.push(s);
      } else {
        flush();
        compMinA = s.a;
        compMaxB = s.b;
        compMembers = [s];
      }
    }
    flush();
  }

  return { segments, segmentKeyBySegId };
}

function computeBundleOrder(segments: SegmentRef[], ports: PortIndexInfo): Map<string, string[]> {
  // Milestone 2: order lines in each corridor by local turn geometry at segment endpoints
  // (a cheap metro-line ordering approximation), with deterministic fallbacks.
  const byKey = new Map<string, SegmentRef[]>();
  for (const s of segments) {
    if (!byKey.has(s.segmentKey)) {
      byKey.set(s.segmentKey, []);
    }
    byKey.get(s.segmentKey)!.push(s);
  }

  interface EdgeSig {
    edgeId: string;
    // geometry-derived keys
    k1: number;
    k2: number;
    // deterministic fallbacks
    startIdx: number;
    endIdx: number;
  }

  const order = new Map<string, string[]>();
  for (const [key, segs] of byKey.entries()) {
    const byEdge = new Map<string, SegmentRef>();
    // Prefer the longest segment for each edge in this corridor as representative.
    for (const s of segs) {
      const len = Math.abs(s.b - s.a);
      const prev = byEdge.get(s.edgeId);
      if (!prev) {
        byEdge.set(s.edgeId, s);
      } else {
        const prevLen = Math.abs(prev.b - prev.a);
        if (len > prevLen || (len === prevLen && s.segId.localeCompare(prev.segId) < 0)) {
          byEdge.set(s.edgeId, s);
        }
      }
    }

    const sigs: EdgeSig[] = [];
    for (const [edgeId, s] of byEdge.entries()) {
      const pts = s.edge.points ?? [];
      const pA = pts[s.i1];
      const pB = pts[s.i2];
      const fixed = s.orientation === 'V' ? pA.x : pA.y;
      // Canonical direction:
      // - vertical segments ordered top->bottom (low y to high y)
      // - horizontal segments ordered left->right (low x to high x)
      const aFirst =
        s.orientation === 'V'
          ? pA.y < pB.y
            ? { idx: s.i1, p: pA }
            : { idx: s.i2, p: pB }
          : pA.x < pB.x
            ? { idx: s.i1, p: pA }
            : { idx: s.i2, p: pB };
      const bSecond = aFirst.idx === s.i1 ? { idx: s.i2, p: pB } : { idx: s.i1, p: pA };

      const n1 = aFirst.idx > 0 ? pts[aFirst.idx - 1] : undefined;
      const n2 = bSecond.idx + 1 < pts.length ? pts[bSecond.idx + 1] : undefined;

      // For vertical corridors, compare the x-coordinate of the adjacent horizontal segments at each end.
      // For horizontal corridors, compare the y-coordinate of the adjacent vertical segments at each end.
      let k1 = fixed;
      let k2 = fixed;
      if (s.orientation === 'V') {
        const nx1 = n1 ? n1.x : fixed;
        const nx2 = n2 ? n2.x : fixed;
        k1 = nx1;
        k2 = nx2;
      } else {
        const ny1 = n1 ? n1.y : fixed;
        const ny2 = n2 ? n2.y : fixed;
        k1 = ny1;
        k2 = ny2;
      }

      sigs.push({
        edgeId,
        k1,
        k2,
        startIdx: ports.startIndexByEdgeId.get(edgeId) ?? 0,
        endIdx: ports.endIndexByEdgeId.get(edgeId) ?? 0,
      });
    }

    sigs.sort((a, b) => {
      if (a.k1 !== b.k1) {
        return a.k1 - b.k1;
      }
      if (a.k2 !== b.k2) {
        return a.k2 - b.k2;
      }
      if (a.startIdx !== b.startIdx) {
        return a.startIdx - b.startIdx;
      }
      if (a.endIdx !== b.endIdx) {
        return a.endIdx - b.endIdx;
      }
      return a.edgeId.localeCompare(b.edgeId);
    });

    order.set(
      key,
      sigs.map((s) => s.edgeId)
    );
  }

  return order;
}

type ObjKind =
  | 'DUMMY_MIN'
  | 'DUMMY_MAX'
  | 'BOX_MIN_AFTER' // min-side border that should appear after segments at same coord (left/top)
  | 'BOX_MAX_BEFORE' // max-side border that should appear before segments at same coord (right/bottom)
  | 'SEG';

interface NudgeObj {
  id: string;
  kind: ObjKind;
  // interval in orthogonal axis
  intervalMin: number;
  intervalMax: number;
  // coordinate on primary axis (x for V-phase, y for H-phase)
  coord: number;
  // segment metadata (if kind SEG)
  seg?: SegmentRef;
  fixed: boolean;
}

interface Constraint {
  fromIdx: number;
  toIdx: number;
  minSep: number;
}

function buildConstraintsChiNeighbor(objsInChiOrder: NudgeObj[], spacing: number): Constraint[] {
  const n = objsInChiOrder.length;
  if (n <= 1) {
    return [];
  }

  // Build events for y-sweep (or x-sweep) on interval axis.
  interface Ev {
    at: number;
    kind: 'start' | 'end';
    idx: number;
  }
  const events: Ev[] = [];
  const ys: number[] = [];
  for (let i = 0; i < n; i++) {
    const o = objsInChiOrder[i];
    events.push({ at: o.intervalMin, kind: 'start', idx: i });
    events.push({ at: o.intervalMax, kind: 'end', idx: i });
    ys.push(o.intervalMin, o.intervalMax);
  }
  ys.sort((a, b) => a - b);
  // Unique y endpoints
  const uniqY: number[] = [];
  for (const y of ys) {
    if (uniqY.length === 0 || y !== uniqY[uniqY.length - 1]) {
      uniqY.push(y);
    }
  }
  events.sort((a, b) => {
    if (a.at !== b.at) {
      return a.at - b.at;
    }
    // starts before ends at same coordinate
    if (a.kind !== b.kind) {
      return a.kind === 'start' ? -1 : 1;
    }
    return a.idx - b.idx;
  });

  const active = new Set<number>();
  let evPtr = 0;
  const constraintKey = new Set<string>();
  const constraints: Constraint[] = [];

  for (let i = 0; i < uniqY.length - 1; i++) {
    const y0 = uniqY[i];
    const y1 = uniqY[i + 1];
    if (y1 <= y0) {
      continue;
    }

    // apply events at y0
    while (evPtr < events.length && events[evPtr].at === y0 && events[evPtr].kind === 'start') {
      active.add(events[evPtr].idx);
      evPtr++;
    }
    while (evPtr < events.length && events[evPtr].at === y0 && events[evPtr].kind === 'end') {
      active.delete(events[evPtr].idx);
      evPtr++;
    }

    if (active.size < 2) {
      continue;
    }
    const slab = [...active];
    slab.sort((a, b) => a - b); // already χ indices
    for (let j = 0; j < slab.length - 1; j++) {
      const u = slab[j];
      const v = slab[j + 1];
      const uo = objsInChiOrder[u];
      const vo = objsInChiOrder[v];
      // Default separation is spacing, but we *do not* introduce artificial separation
      // between fixed barrier objects (box borders / dummies). Those represent fixed
      // constraints and may coincide (aligned boxes), which must remain feasible.
      // Separation between segments of the same path can also be 0 (bend cleanup heuristic).
      let minSep = spacing;
      const uIsSeg = uo.kind === 'SEG';
      const vIsSeg = vo.kind === 'SEG';
      if (!uIsSeg && !vIsSeg) {
        minSep = 0;
      } else if (uIsSeg && vIsSeg && uo.seg && vo.seg && uo.seg.edgeId === vo.seg.edgeId) {
        minSep = 0;
      }
      const k = `${u}->${v}:${minSep}`;
      if (constraintKey.has(k)) {
        continue;
      }
      constraintKey.add(k);
      constraints.push({ fromIdx: u, toIdx: v, minSep });
    }
  }

  return constraints;
}

function solveConstraintsBalanced(objs: NudgeObj[], constraints: Constraint[]): number[] | null {
  const n = objs.length;
  const inArcs: { from: number; d: number }[][] = Array.from({ length: n }, () => []);
  const outArcs: { to: number; d: number }[][] = Array.from({ length: n }, () => []);
  for (const c of constraints) {
    inArcs[c.toIdx].push({ from: c.fromIdx, d: c.minSep });
    outArcs[c.fromIdx].push({ to: c.toIdx, d: c.minSep });
  }

  // Forward (min feasible)
  const minCoord = objs.map((o) => o.coord);
  for (let i = 0; i < n; i++) {
    const o = objs[i];
    if (!o.fixed) {
      for (const a of inArcs[i]) {
        minCoord[i] = Math.max(minCoord[i], minCoord[a.from] + a.d);
      }
      continue;
    }
    // Fixed objects are pinned. If constraints require moving them, the system
    // is infeasible at this spacing.
    for (const a of inArcs[i]) {
      if (minCoord[a.from] + a.d > o.coord + 1e-9) {
        return null;
      }
    }
  }

  // Backward (max feasible, given sinks fixed at minCoord)
  const maxCoord = [...minCoord];
  for (let i = n - 1; i >= 0; i--) {
    const o = objs[i];
    if (!o.fixed) {
      for (const a of outArcs[i]) {
        maxCoord[i] = Math.min(maxCoord[i], maxCoord[a.to] - a.d);
      }
      // ensure feasibility range
      if (maxCoord[i] < minCoord[i]) {
        maxCoord[i] = minCoord[i];
      }
    } else {
      // fixed objects are pinned
      maxCoord[i] = o.coord;
    }
  }

  const out = [...minCoord];
  for (let i = 0; i < n; i++) {
    if (objs[i].fixed) {
      out[i] = objs[i].coord;
    } else {
      out[i] = (minCoord[i] + maxCoord[i]) / 2;
    }
  }
  return out;
}

function solveWithExpandedDelta(
  objs: NudgeObj[],
  constraints: Constraint[],
  baseSpacing: number
): number[] {
  // Try to expand spacing uniformly (only on constraints that currently have baseSpacing)
  // while keeping the system feasible with fixed barriers pinned.
  const hasAny = constraints.some((c) => c.minSep === baseSpacing);
  if (!hasAny) {
    return solveConstraintsBalanced(objs, constraints) ?? objs.map((o) => o.coord);
  }

  const fixedCoords = objs.map((o) => o.coord);
  const trySolve = (delta: number) => {
    // clone objs with pinned coords
    const cloned = objs.map((o, idx) => ({ ...o, coord: fixedCoords[idx] }));
    const scaled = constraints.map((c) => ({
      ...c,
      minSep: c.minSep === baseSpacing ? delta : c.minSep,
    }));
    return solveConstraintsBalanced(cloned, scaled);
  };

  // Establish an upper bound: don't exceed the range between dummy boundaries.
  const coords = objs.map((o) => o.coord);
  const range = Math.max(...coords) - Math.min(...coords);
  let lo = baseSpacing;
  let hi = Math.max(baseSpacing, Math.min(range, baseSpacing * 10));

  // Increase hi until infeasible (or cap).
  while (hi < range && trySolve(hi) !== null) {
    lo = hi;
    hi = Math.min(range, hi * 1.5 + 1);
    if (hi - lo < 1e-6) {
      break;
    }
  }

  // Binary search between lo (feasible) and hi (maybe infeasible).
  for (let iter = 0; iter < 20; iter++) {
    const mid = (lo + hi) / 2;
    const sol = trySolve(mid);
    if (sol) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return trySolve(lo) ?? solveConstraintsBalanced(objs, constraints) ?? objs.map((o) => o.coord);
}

function compareSegmentsInChi(
  a: NudgeObj,
  b: NudgeObj,
  bundleOrder: Map<string, string[]>
): number {
  if (a.coord !== b.coord) {
    return a.coord - b.coord;
  }
  // Kind tie-break at same coord:
  const rank = (k: ObjKind): number => {
    switch (k) {
      case 'DUMMY_MIN':
        return -10;
      case 'BOX_MAX_BEFORE':
        return -1;
      case 'SEG':
        return 0;
      case 'BOX_MIN_AFTER':
        return 1;
      case 'DUMMY_MAX':
        return 10;
    }
  };
  const ra = rank(a.kind);
  const rb = rank(b.kind);
  if (ra !== rb) {
    return ra - rb;
  }

  if (a.kind === 'SEG' && b.kind === 'SEG' && a.seg && b.seg) {
    const ak = a.seg.segmentKey;
    const bk = b.seg.segmentKey;
    if (ak === bk) {
      const order = bundleOrder.get(ak) ?? [];
      const ai = order.indexOf(a.seg.edgeId);
      const bi = order.indexOf(b.seg.edgeId);
      if (ai !== bi) {
        return ai - bi;
      }
    }
    if (a.seg.edgeId !== b.seg.edgeId) {
      return a.seg.edgeId.localeCompare(b.seg.edgeId);
    }
    return a.seg.segId.localeCompare(b.seg.segId);
  }

  return a.id.localeCompare(b.id);
}

function nudgePhase(
  data: LayoutData,
  nodesById: Map<string, Node>,
  segmentKeyBySegId: Map<string, string>,
  bundleOrder: Map<string, string[]>,
  orientationToMove: Orientation,
  spacing: number
): void {
  const objs: NudgeObj[] = [];

  // Gather segments (stable key via segId mapping).
  for (const edge of data.edges ?? []) {
    if (edge?.id == null || !edge.points || edge.points.length < 2) {
      continue;
    }
    const edgeId = String(edge.id);
    const pts = edge.points;
    const lastIdx = pts.length - 1;
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i];
      const q = pts[i + 1];
      const isHoriz = approxEqual(p.y, q.y);
      const isVert = approxEqual(p.x, q.x);
      if (!isHoriz && !isVert) {
        continue;
      }
      const orientation: Orientation = isVert ? 'V' : 'H';
      if (orientation !== orientationToMove) {
        continue;
      }

      const segId = `${edgeId}:${i}`;
      const segKey = segmentKeyBySegId.get(segId) ?? '';
      const fixedCoord = isVert ? p.x : p.y;
      const a = isVert ? Math.min(p.y, q.y) : Math.min(p.x, q.x);
      const b = isVert ? Math.max(p.y, q.y) : Math.max(p.x, q.x);
      const isPortSegment = i === 0 || i + 1 === lastIdx;
      const seg: SegmentRef = {
        edge,
        edgeId,
        i1: i,
        i2: i + 1,
        orientation,
        fixedCoord,
        a,
        b,
        segmentKey: segKey,
        segId,
        isPortSegment,
      };
      objs.push({
        id: `seg:${segId}`,
        kind: 'SEG',
        intervalMin: a,
        intervalMax: b,
        coord: fixedCoord,
        seg,
        fixed: isPortSegment,
      });
    }
  }

  // Add box borders as fixed barriers.
  let globalMin = Infinity;
  let globalMax = -Infinity;
  for (const node of nodesById.values()) {
    const r = rectForNode(node);
    if (orientationToMove === 'V') {
      // vertical segments moved in x: barriers are left/right borders.
      objs.push({
        id: `box:${String(node.id)}:R`,
        kind: 'BOX_MAX_BEFORE',
        intervalMin: r.top,
        intervalMax: r.bottom,
        coord: r.right,
        fixed: true,
      });
      objs.push({
        id: `box:${String(node.id)}:L`,
        kind: 'BOX_MIN_AFTER',
        intervalMin: r.top,
        intervalMax: r.bottom,
        coord: r.left,
        fixed: true,
      });
      globalMin = Math.min(globalMin, r.top);
      globalMax = Math.max(globalMax, r.bottom);
    } else {
      // horizontal segments moved in y: barriers are top/bottom borders.
      objs.push({
        id: `box:${String(node.id)}:B`,
        kind: 'BOX_MAX_BEFORE',
        intervalMin: r.left,
        intervalMax: r.right,
        coord: r.bottom,
        fixed: true,
      });
      objs.push({
        id: `box:${String(node.id)}:T`,
        kind: 'BOX_MIN_AFTER',
        intervalMin: r.left,
        intervalMax: r.right,
        coord: r.top,
        fixed: true,
      });
      globalMin = Math.min(globalMin, r.left);
      globalMax = Math.max(globalMax, r.right);
    }
  }

  // Dummy boundaries spanning the full interval axis.
  const coords = objs.map((o) => o.coord);
  const minCoord = Math.min(...coords) - spacing * 5;
  const maxCoord = Math.max(...coords) + spacing * 5;
  objs.push({
    id: 'dummy:min',
    kind: 'DUMMY_MIN',
    intervalMin: globalMin,
    intervalMax: globalMax,
    coord: minCoord,
    fixed: true,
  });
  objs.push({
    id: 'dummy:max',
    kind: 'DUMMY_MAX',
    intervalMin: globalMin,
    intervalMax: globalMax,
    coord: maxCoord,
    fixed: true,
  });

  // χ order
  objs.sort((a, b) => compareSegmentsInChi(a, b, bundleOrder));

  // Build χ-neighbor constraints on the interval axis.
  const constraints = buildConstraintsChiNeighbor(objs, spacing);
  const solved = solveWithExpandedDelta(objs, constraints, spacing);

  // Apply updates back into edge points for movable segments.
  for (const [i, o] of objs.entries()) {
    if (o.kind !== 'SEG' || !o.seg) {
      continue;
    }
    if (o.fixed) {
      continue;
    }
    const newCoord = solved[i];
    const oldCoord = o.coord;
    const delta = newCoord - oldCoord;
    if (Math.abs(delta) < 1e-6) {
      continue;
    }
    const pts = o.seg.edge.points!;
    const p1 = pts[o.seg.i1];
    const p2 = pts[o.seg.i2];
    if (orientationToMove === 'V') {
      pts[o.seg.i1] = { x: p1.x + delta, y: p1.y };
      pts[o.seg.i2] = { x: p2.x + delta, y: p2.y };
    } else {
      pts[o.seg.i1] = { x: p1.x, y: p1.y + delta };
      pts[o.seg.i2] = { x: p2.x, y: p2.y + delta };
    }
  }
}

export function postProcessDomusOptionBMilestone1(
  data: LayoutData,
  options: OrthogonalOptions
): {
  bundleOrder: Map<string, string[]>;
} {
  const spacing = options.spacing ?? 10;
  const snapEps = options.snapEps ?? 1;
  const segmentKeySnap = options.segmentKeySnap ?? 1;

  const nodesById = new Map<string, Node>();
  for (const node of data.nodes ?? []) {
    if (node?.id != null) {
      nodesById.set(String(node.id), node);
    }
  }

  // Ensure endpoints are on the node borders so port distribution and
  // "port segment fixed" logic work even if the routing backend emitted
  // Mermaid-style center/bend points.
  clipEndpointsToBoxes(data, nodesById);

  // Stage 1 (port assignment-ish for Option B): distribute ports along each side
  // deterministically so multi-edges don't all share the same boundary point.
  const portAssignment = distributePortsOnBoxSides(data, nodesById, spacing);
  // Ensure multi-edges have at least one internal segment to nudge.
  seedDetoursForMultiEdges(data);

  // Stage 0: merge collinear so segment extraction is stable.
  for (const edge of data.edges ?? []) {
    mergeCollinearInPlace(edge);
  }

  const ports = portAssignment.indices;
  const { segments, segmentKeyBySegId } = extractSegments(data, { segmentKeySnap });
  const bundleOrder = computeBundleOrder(segments, ports);

  if (options.trace) {
    // Persist bundle order for debug/visualization (stable enough for tests).
    options.trace.bundleOrder = Object.fromEntries(bundleOrder.entries());
  }

  // MVP nudging: H→V→H (horizontal pass spaces vertical segments, then vice-versa).
  nudgePhase(data, nodesById, segmentKeyBySegId, bundleOrder, 'V', spacing);
  nudgePhase(data, nodesById, segmentKeyBySegId, bundleOrder, 'H', spacing);
  nudgePhase(data, nodesById, segmentKeyBySegId, bundleOrder, 'V', spacing);

  // Post-route port reconciliation:
  // reorder ports along each node side to match the lane order in the first corridor segment
  // outside the node. This avoids order inversions that force local Z-bends.
  reconcilePortsToLaneOrder(data, nodesById, segmentKeyBySegId, bundleOrder, spacing);

  // Final cleanup: collinear simplification + snapping.
  for (const edge of data.edges ?? []) {
    if (!edge.points) {
      continue;
    }
    edge.points = compressCollinear(edge.points);
    if (snapEps > 0) {
      edge.points = edge.points.map((p) => ({
        x: snapToGrid(p.x, snapEps),
        y: snapToGrid(p.y, snapEps),
      }));
    }
  }

  if (options.trace) {
    for (const edge of data.edges ?? []) {
      if (edge?.id == null) {
        continue;
      }
      if (!edge.points || edge.points.length < 2) {
        continue;
      }
      const edgeId = String(edge.id);
      const startPort = edge.points[0];
      const endPort = edge.points[edge.points.length - 1];
      const startMeta = portAssignment.startByEdgeId.get(edgeId);
      const endMeta = portAssignment.endByEdgeId.get(edgeId);
      if (!options.trace.edges[edgeId]) {
        options.trace.edges[edgeId] = {};
      }
      options.trace.edges[edgeId].startNodeId = edge.start != null ? String(edge.start) : undefined;
      options.trace.edges[edgeId].endNodeId = edge.end != null ? String(edge.end) : undefined;
      // Recompute normalized t from the final points (after nudging + snapping),
      // while preserving the stable side/index ordering.
      const sNode = edge.start != null ? nodesById.get(String(edge.start)) : undefined;
      const eNode = edge.end != null ? nodesById.get(String(edge.end)) : undefined;
      const sRect = sNode ? rectForNode(sNode) : undefined;
      const eRect = eNode ? rectForNode(eNode) : undefined;
      const startTFinal =
        startMeta && sRect ? normalizedTForSide(startPort, sRect, startMeta.side) : startMeta?.t;
      const endTFinal =
        endMeta && eRect ? normalizedTForSide(endPort, eRect, endMeta.side) : endMeta?.t;
      options.trace.edges[edgeId].ports = {
        startPort,
        endPort,
        startSide: startMeta?.side,
        endSide: endMeta?.side,
        startIndexOnSide: startMeta?.indexOnSide,
        endIndexOnSide: endMeta?.indexOnSide,
        startT: startTFinal,
        endT: endTFinal,
      };
    }
  }

  return { bundleOrder };
}
