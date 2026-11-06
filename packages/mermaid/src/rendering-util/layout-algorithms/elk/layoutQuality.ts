import { findEdgeIntersections, processEdgesWithJumps } from '../../rendering-elements/lineJump.js';
import type { LayoutData } from '../../types.js';
import { protectedLayoutForScoring, segmentHitsTitle } from './titleProtection.js';
import { findFrameOverlaps, routeAwayFromFrames } from './frameProtection.js';

/** Compare hard safety first, crossings second, then readability/compactness. */
export function elkLayoutScore(input: LayoutData): number[] {
  const data = protectedLayoutForScoring(input);
  const bounds = (node: LayoutData['nodes'][number]) => ({
    left: node.x! - node.width! / 2,
    right: node.x! + node.width! / 2,
    top: node.y! - node.height! / 2,
    bottom: node.y! + node.height! / 2,
  });
  const frames = data.nodes.filter((node) => node.isGroup || node.shape === 'rect').map(bounds);
  const obstacles = [
    ...data.nodes.filter((node) => !node.isGroup).map(bounds),
    ...data.titleObstacles,
  ];
  for (const edge of data.edges) {
    if (edge.points && (!edge.curve || ['rounded', 'linear'].includes(edge.curve))) {
      edge.points = routeAwayFromFrames(edge.points, frames, obstacles);
    }
  }
  const edges = data.edges.filter((edge) => edge.points && edge.points.length > 1);
  let nodeCollisions = 0;
  let length = 0;
  let bends = 0;
  for (const edge of edges) {
    const points = edge.points!;
    bends += Math.max(0, points.length - 2);
    for (let i = 1; i < points.length; i++) {
      length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    }
    for (const node of data.nodes) {
      if (node.isGroup || node.id === edge.start || node.id === edge.end) {
        continue;
      }
      const box = {
        left: node.x! - node.width! / 2 + 1,
        right: node.x! + node.width! / 2 - 1,
        top: node.y! - node.height! / 2 + 1,
        bottom: node.y! + node.height! / 2 - 1,
      };
      if (points.some((p, i) => i > 0 && segmentHitsTitle(points[i - 1], p, box))) {
        nodeCollisions++;
      }
    }
  }
  const geometry = edges.map((edge) => ({
    id: edge.id,
    points: edge.points!,
    curve: edge.curve,
    arrowTypeStart: edge.arrowTypeStart,
    arrowTypeEnd: edge.arrowTypeEnd,
  }));
  const crossings = findEdgeIntersections(geometry).length;
  const paths = processEdgesWithJumps(geometry, { enabled: true, jumpRadius: 6, jumpStyle: 'arc' });
  const hops = [...paths.values()].reduce((n, d) => n + (d.match(/A/g)?.length ?? 0), 0);
  const frameOverlaps = edges.reduce(
    (n, edge) => n + findFrameOverlaps(edge.points!, frames).length,
    0
  );
  return [nodeCollisions, frameOverlaps, crossings, Math.max(0, crossings - hops), bends, length];
}

export function isBetterElkScore(candidate: number[], incumbent: number[]): boolean {
  for (const [i, element] of incumbent.entries()) {
    if (candidate[i] !== element) {
      return candidate[i] < element;
    }
  }
  return false;
}

/** Fixed candidate count, not a machine-dependent wall-clock stopping rule. */
export function elkAutomaticTrials(nodes: number, edges: number): number {
  if (nodes <= 80 && edges <= 120) {
    return 4;
  }
  if (nodes <= 160 && edges <= 240) {
    return 2;
  }
  return 1;
}
