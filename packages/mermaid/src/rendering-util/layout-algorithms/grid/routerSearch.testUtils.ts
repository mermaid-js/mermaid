import { findShortestRoute, type RouterSearchResult } from './routerSearch.js';
import type {
  GridOrientation,
  RouterArc,
  RouterObstacle,
  RouterPoint,
  RouterRect,
  RouterVertex,
} from './types.js';

export interface DenseOracleInput {
  bounds: RouterRect;
  obstacles: readonly RouterObstacle[];
  source: RouterPoint;
  target: RouterPoint;
}

function isBlockedPoint(point: RouterPoint, obstacles: readonly RouterObstacle[]): boolean {
  return obstacles.some(
    (obstacle) =>
      point.x > obstacle.left &&
      point.x < obstacle.right &&
      point.y > obstacle.top &&
      point.y < obstacle.bottom
  );
}

function segmentBlocked(
  orientation: GridOrientation,
  fixed: number,
  start: number,
  end: number,
  obstacles: readonly RouterObstacle[]
): boolean {
  const low = Math.min(start, end);
  const high = Math.max(start, end);
  return obstacles.some((obstacle) =>
    orientation === 'H'
      ? fixed > obstacle.top &&
        fixed < obstacle.bottom &&
        high > obstacle.left &&
        low < obstacle.right
      : fixed > obstacle.left &&
        fixed < obstacle.right &&
        high > obstacle.top &&
        low < obstacle.bottom
  );
}

export function findDenseOracleRoute(input: DenseOracleInput): RouterSearchResult | undefined {
  const xs = [
    ...new Set([
      input.bounds.left,
      input.bounds.right,
      input.source.x,
      input.target.x,
      ...input.obstacles.flatMap(({ left, right }) => [left, right]),
    ]),
  ].sort((a, b) => a - b);
  const ys = [
    ...new Set([
      input.bounds.top,
      input.bounds.bottom,
      input.source.y,
      input.target.y,
      ...input.obstacles.flatMap(({ top, bottom }) => [top, bottom]),
    ]),
  ].sort((a, b) => a - b);
  const vertices: RouterVertex[] = [];
  const byPoint = new Map<string, number>();
  for (const y of ys) {
    for (const x of xs) {
      const point = { x, y };
      if (!isBlockedPoint(point, input.obstacles)) {
        const id = vertices.length;
        vertices.push({ id, point, kind: 'projection' });
        byPoint.set(`${x}:${y}`, id);
      }
    }
  }
  const adjacency = new Map<number, RouterArc[]>(
    vertices.map((vertex) => [vertex.id, [] as RouterArc[]])
  );
  const connectLines = (orientation: GridOrientation) => {
    const coordinates = orientation === 'H' ? ys : xs;
    const varying = orientation === 'H' ? xs : ys;
    for (const fixed of coordinates) {
      let previous: RouterVertex | undefined;
      for (const value of varying) {
        const id = byPoint.get(orientation === 'H' ? `${value}:${fixed}` : `${fixed}:${value}`);
        if (id === undefined) {
          continue;
        }
        const current = vertices[id];
        if (previous) {
          const start = orientation === 'H' ? previous.point.x : previous.point.y;
          const end = orientation === 'H' ? current.point.x : current.point.y;
          if (!segmentBlocked(orientation, fixed, start, end, input.obstacles)) {
            const length = end - start;
            adjacency.get(previous.id)!.push({
              from: previous.id,
              to: current.id,
              orientation,
              length,
              kind: 'visibility',
              intervalStart: start,
              intervalEnd: end,
            });
            adjacency.get(current.id)!.push({
              from: current.id,
              to: previous.id,
              orientation,
              length,
              kind: 'visibility',
              intervalStart: start,
              intervalEnd: end,
            });
          }
        }
        previous = current;
      }
    }
  };
  connectLines('H');
  connectLines('V');
  const sourceId = byPoint.get(`${input.source.x}:${input.source.y}`);
  const targetId = byPoint.get(`${input.target.x}:${input.target.y}`);
  if (sourceId === undefined || targetId === undefined) {
    return undefined;
  }
  return findShortestRoute({ vertices, adjacency }, sourceId, targetId, { heuristic: 'zero' });
}
