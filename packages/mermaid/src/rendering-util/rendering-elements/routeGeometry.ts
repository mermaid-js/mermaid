// Ported from mermaid-v13 `packages/core/src/layout/layered/layered.ts` (`ease`) and
// `packages/core/src/layout/types.ts` (`RoutePoint`).
//
// Route geometry shared by the edge drawing (`routePath`) and any layout that hands over
// axis-tagged route points. It lives next to the drawing so shared rendering code does not
// depend on a layout's folder; the `layered` engine imports it from here.
import type { Point } from '../../types.js';

/**
 * A point on an edge route. `axis` says how the route runs into the point: `'v'` vertically,
 * `'h'` horizontally. Renderers use it to leave and reach nodes square to their sides.
 */
export interface RoutePoint extends Point {
  axis: 'v' | 'h';
}

/** True when every point of a route carries an axis tag, so `routePath` can draw it. */
export function isAxisTaggedRoute(points: unknown): points is RoutePoint[] {
  return (
    Array.isArray(points) &&
    points.length >= 2 &&
    points.every(
      (p) =>
        p !== null &&
        typeof p === 'object' &&
        ((p as RoutePoint).axis === 'v' || (p as RoutePoint).axis === 'h')
    )
  );
}

// How far along the flow the handles of a plain S reach, as a share of the way it travels along
// it. Half gives an even S. One that runs more than eight times as far across as along turns
// sooner and crosses in a straighter line, down to a quarter at sixteen times. The layout uses
// this to tell how near two curves will pass, and the drawing to draw them.
export function ease(across: number, along: number): number {
  return Math.max(0.25, Math.min(0.5, (4 * Math.abs(along)) / (Math.abs(across) || 1)));
}
