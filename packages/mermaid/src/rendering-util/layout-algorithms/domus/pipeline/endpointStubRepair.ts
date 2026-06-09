import type { LayoutData, Node } from '../../../types.js';
import {
  approxEqual,
  manhattanDistance,
  rectForNode,
  segmentIntersectsRectInterior,
} from '../core/helpers.js';

interface Point {
  x: number;
  y: number;
}

type Side = 'E' | 'W' | 'N' | 'S';

interface Options {
  minLength?: number;
}

function sideFromBoundaryPoint(p: Point, node: Node): Side | null {
  const rect = rectForNode(node);
  if (approxEqual(p.x, rect.left)) {
    return 'W';
  }
  if (approxEqual(p.x, rect.right)) {
    return 'E';
  }
  if (approxEqual(p.y, rect.top)) {
    return 'N';
  }
  if (approxEqual(p.y, rect.bottom)) {
    return 'S';
  }
  return null;
}

function segDir(a: Point, b: Point): Side | null {
  if (approxEqual(a.x, b.x) && !approxEqual(a.y, b.y)) {
    return b.y > a.y ? 'S' : 'N';
  }
  if (approxEqual(a.y, b.y) && !approxEqual(a.x, b.x)) {
    return b.x > a.x ? 'E' : 'W';
  }
  return null;
}

function offsetFromPort(port: Point, side: Side, length: number): Point {
  switch (side) {
    case 'E':
      return { x: port.x + length, y: port.y };
    case 'W':
      return { x: port.x - length, y: port.y };
    case 'N':
      return { x: port.x, y: port.y - length };
    case 'S':
      return { x: port.x, y: port.y + length };
  }
}

function pushUnique(points: Point[], point: Point): void {
  const prev = points.at(-1);
  if (prev && approxEqual(prev.x, point.x) && approxEqual(prev.y, point.y)) {
    return;
  }
  points.push(point);
}

function connectors(from: Point, to: Point): Point[][] {
  if (approxEqual(from.x, to.x) || approxEqual(from.y, to.y)) {
    return [[to]];
  }
  return [
    [{ x: to.x, y: from.y }, to],
    [{ x: from.x, y: to.y }, to],
  ];
}

function isOrthogonal(points: Point[]): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (!approxEqual(a.x, b.x) && !approxEqual(a.y, b.y)) {
      return false;
    }
  }
  return true;
}

function isClear(
  layout: LayoutData,
  edge: { start?: unknown; end?: unknown },
  points: Point[]
): boolean {
  const startId =
    typeof edge.start === 'string' || typeof edge.start === 'number' ? String(edge.start) : null;
  const endId =
    typeof edge.end === 'string' || typeof edge.end === 'number' ? String(edge.end) : null;
  const lastSegmentIdx = points.length - 2;

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    for (const node of layout.nodes ?? []) {
      if (node?.id == null) {
        continue;
      }
      const nodeId = String(node.id);
      if ((i === 0 && nodeId === startId) || (i === lastSegmentIdx && nodeId === endId)) {
        continue;
      }
      if (segmentIntersectsRectInterior(a, b, rectForNode(node))) {
        return false;
      }
    }
  }
  return true;
}

function normalize(points: Point[]): Point[] {
  const normalized: Point[] = [];
  for (const point of points) {
    pushUnique(normalized, point);
  }
  return normalized;
}

function collapseCollinear(points: Point[]): Point[] {
  const collapsed: Point[] = [];
  for (const point of points) {
    pushUnique(collapsed, point);
    while (collapsed.length >= 3) {
      const a = collapsed[collapsed.length - 3];
      const b = collapsed[collapsed.length - 2];
      const c = collapsed[collapsed.length - 1];
      if (
        (approxEqual(a.x, b.x) && approxEqual(b.x, c.x)) ||
        (approxEqual(a.y, b.y) && approxEqual(b.y, c.y))
      ) {
        collapsed.splice(-2, 1);
      } else {
        break;
      }
    }
  }
  return collapsed;
}

function endpointLengthOk(points: Point[], endpoint: 'start' | 'end', minLength: number): boolean {
  const collapsed = collapseCollinear(points);
  if (collapsed.length < 3) {
    return true;
  }
  const a = endpoint === 'start' ? collapsed[0] : collapsed[collapsed.length - 2];
  const b = endpoint === 'start' ? collapsed[1] : collapsed[collapsed.length - 1];
  return manhattanDistance(a, b) >= minLength;
}

function segmentCrosses(a: Point, b: Point, c: Point, d: Point): boolean {
  const abHorizontal = approxEqual(a.y, b.y) && !approxEqual(a.x, b.x);
  const abVertical = approxEqual(a.x, b.x) && !approxEqual(a.y, b.y);
  const cdHorizontal = approxEqual(c.y, d.y) && !approxEqual(c.x, d.x);
  const cdVertical = approxEqual(c.x, d.x) && !approxEqual(c.y, d.y);
  if (abHorizontal && cdVertical) {
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    const minY = Math.min(c.y, d.y);
    const maxY = Math.max(c.y, d.y);
    return c.x > minX && c.x < maxX && a.y > minY && a.y < maxY;
  }
  if (abVertical && cdHorizontal) {
    const minY = Math.min(a.y, b.y);
    const maxY = Math.max(a.y, b.y);
    const minX = Math.min(c.x, d.x);
    const maxX = Math.max(c.x, d.x);
    return c.y > minY && c.y < maxY && a.x > minX && a.x < maxX;
  }
  return false;
}

function crossesOtherEdges(
  layout: LayoutData,
  edge: { points?: Point[] },
  points: Point[]
): boolean {
  for (const other of layout.edges ?? []) {
    if (other === edge) {
      continue;
    }
    const otherPoints = (other as { points?: Point[] }).points;
    if (!Array.isArray(otherPoints) || otherPoints.length < 2) {
      continue;
    }
    for (let i = 0; i < points.length - 1; i++) {
      for (let j = 0; j < otherPoints.length - 1; j++) {
        if (segmentCrosses(points[i], points[i + 1], otherPoints[j], otherPoints[j + 1])) {
          return true;
        }
      }
    }
  }
  return false;
}

function repairStartStub(points: Point[], side: Side, minLength: number): Point[][] {
  if (points.length < 3) {
    return [];
  }
  const port = points[0];
  const inner = points[1];
  if (segDir(port, inner) !== side) {
    return [];
  }
  const length = manhattanDistance(port, inner);
  if (length <= 0 || length >= minLength) {
    return [];
  }

  const target = offsetFromPort(port, side, minLength);
  const next = points[2];
  const candidates: Point[][] = [];
  for (const connector of connectors(target, next)) {
    const candidate = normalize([port, target, ...connector, ...points.slice(3)]);
    if (isOrthogonal(candidate) && endpointLengthOk(candidate, 'start', minLength)) {
      candidates.push(candidate);
    }
  }
  return candidates;
}

function repairEndStub(points: Point[], side: Side, minLength: number): Point[][] {
  if (points.length < 3) {
    return [];
  }
  const port = points[points.length - 1];
  const inner = points[points.length - 2];
  if (segDir(port, inner) !== side) {
    return [];
  }
  const length = manhattanDistance(port, inner);
  if (length <= 0 || length >= minLength) {
    return [];
  }

  const target = offsetFromPort(port, side, minLength);
  const previous = points[points.length - 3];
  const head = points.slice(0, -2);
  const candidates: Point[][] = [];
  for (const connector of connectors(previous, target)) {
    const candidate = normalize([...head, ...connector, port]);
    if (isOrthogonal(candidate) && endpointLengthOk(candidate, 'end', minLength)) {
      candidates.push(candidate);
    }
  }

  // If the normal connector would collapse back to the too-short terminal
  // segment, shift the whole previous rail outward from the endpoint side.
  // Example: ─┐┌ into a west-side port with a 4px final cap can become ─┐┌
  // with the vertical rail moved to exactly minLength outside the node.
  if (points.length >= 4) {
    const beforeInner = points[points.length - 3];
    const shifted = points.slice(0, -3);
    if (side === 'W' || side === 'E') {
      const railA = { x: target.x, y: beforeInner.y };
      const railB = { x: target.x, y: inner.y };
      const candidate = collapseCollinear(normalize([...shifted, railA, railB, port]));
      if (isOrthogonal(candidate) && endpointLengthOk(candidate, 'end', minLength)) {
        candidates.push(candidate);
      }
    } else {
      const railA = { x: beforeInner.x, y: target.y };
      const railB = { x: inner.x, y: target.y };
      const candidate = collapseCollinear(normalize([...shifted, railA, railB, port]));
      if (isOrthogonal(candidate) && endpointLengthOk(candidate, 'end', minLength)) {
        candidates.push(candidate);
      }
    }
  }

  return candidates;
}

function sideRangeContains(point: Point, node: Node, side: Side): boolean {
  const rect = rectForNode(node);
  if (side === 'W' || side === 'E') {
    return point.y >= rect.top && point.y <= rect.bottom;
  }
  return point.x >= rect.left && point.x <= rect.right;
}

function slideEndPortToPreviousRail(points: Point[], side: Side, endNode: Node): Point[] | null {
  if (points.length < 4) {
    return null;
  }
  const port = points[points.length - 1];
  const bandStart = points[points.length - 3];
  const bandEnd = points[points.length - 2];
  if (segDir(bandStart, bandEnd) == null || segDir(bandEnd, port) == null) {
    return null;
  }
  const rect = rectForNode(endNode);
  const bandDistance =
    side === 'W'
      ? rect.left - bandEnd.x
      : side === 'E'
        ? bandEnd.x - rect.right
        : side === 'N'
          ? rect.top - bandEnd.y
          : bandEnd.y - rect.bottom;
  if (bandDistance < 0 || bandDistance >= 18) {
    return null;
  }
  const replacementPort =
    side === 'W' || side === 'E' ? { x: port.x, y: bandStart.y } : { x: bandStart.x, y: port.y };
  if (!sideRangeContains(replacementPort, endNode, side)) {
    return null;
  }
  return collapseCollinear(normalize([...points.slice(0, -2), replacementPort]));
}

function shiftEndBandRailOutward(
  points: Point[],
  side: Side,
  endNode: Node,
  minLength: number
): Point[] | null {
  if (points.length < 4) {
    return null;
  }
  const bandStart = points[points.length - 3];
  const bandEnd = points[points.length - 2];
  const port = points[points.length - 1];
  const bandDir = segDir(bandStart, bandEnd);
  const approachDir = segDir(bandEnd, port);
  if (!bandDir || !approachDir) {
    return null;
  }
  const rect = rectForNode(endNode);
  const bandDistance =
    side === 'W'
      ? rect.left - bandEnd.x
      : side === 'E'
        ? bandEnd.x - rect.right
        : side === 'N'
          ? rect.top - bandEnd.y
          : bandEnd.y - rect.bottom;
  if (bandDistance < 0 || bandDistance >= minLength * 2) {
    return null;
  }

  const shifted = points.map((point) => ({ ...point }));
  if (side === 'W') {
    shifted[shifted.length - 3].x = rect.left - minLength * 2;
    shifted[shifted.length - 2].x = rect.left - minLength * 2;
  } else if (side === 'E') {
    shifted[shifted.length - 3].x = rect.right + minLength * 2;
    shifted[shifted.length - 2].x = rect.right + minLength * 2;
  } else if (side === 'N') {
    shifted[shifted.length - 3].y = rect.top - minLength * 2;
    shifted[shifted.length - 2].y = rect.top - minLength * 2;
  } else {
    shifted[shifted.length - 3].y = rect.bottom + minLength * 2;
    shifted[shifted.length - 2].y = rect.bottom + minLength * 2;
  }

  return collapseCollinear(normalize(shifted));
}

export function repairShortEndpointStubs(
  layout: LayoutData,
  opts: Options = {}
): { repaired: number } {
  const minLength = opts.minLength ?? 10;
  const nodesById = new Map<string, Node>();
  for (const node of layout.nodes ?? []) {
    if (node?.id != null) {
      nodesById.set(String(node.id), node);
    }
  }

  let repaired = 0;
  for (const edge of layout.edges ?? []) {
    const points = (edge as { points?: Point[] }).points;
    if (!Array.isArray(points) || points.length < 3) {
      continue;
    }
    const startId = edge.start != null ? String(edge.start) : null;
    const endId = edge.end != null ? String(edge.end) : null;
    const startNode = startId ? nodesById.get(startId) : undefined;
    const endNode = endId ? nodesById.get(endId) : undefined;

    let nextPoints = points;
    if (startNode) {
      const startSide = sideFromBoundaryPoint(nextPoints[0], startNode);
      const startCandidates = startSide ? repairStartStub(nextPoints, startSide, minLength) : [];
      for (const startCandidate of startCandidates) {
        if (
          isClear(layout, edge, startCandidate) &&
          !crossesOtherEdges(layout, edge as { points?: Point[] }, startCandidate)
        ) {
          nextPoints = startCandidate;
          repaired++;
          break;
        }
      }
    }

    if (endNode) {
      const endSide = sideFromBoundaryPoint(nextPoints[nextPoints.length - 1], endNode);
      const endCandidates = endSide ? repairEndStub(nextPoints, endSide, minLength) : [];
      let repairedEndStub = false;
      for (const endCandidate of endCandidates) {
        if (
          isClear(layout, edge, endCandidate) &&
          !crossesOtherEdges(layout, edge as { points?: Point[] }, endCandidate)
        ) {
          nextPoints = endCandidate;
          repaired++;
          repairedEndStub = true;
          break;
        }
      }
      const endBandCandidates =
        endSide && !repairedEndStub
          ? [
              slideEndPortToPreviousRail(nextPoints, endSide, endNode),
              shiftEndBandRailOutward(nextPoints, endSide, endNode, minLength),
            ]
          : [];
      for (const endBandCandidate of endBandCandidates) {
        if (
          endBandCandidate &&
          isClear(layout, edge, endBandCandidate) &&
          !crossesOtherEdges(layout, edge as { points?: Point[] }, endBandCandidate)
        ) {
          nextPoints = endBandCandidate;
          repaired++;
          break;
        }
      }
    }

    (edge as { points: Point[] }).points = nextPoints;
  }

  return { repaired };
}
