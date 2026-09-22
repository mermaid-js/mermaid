/**
 * Shared geometry helpers for layout validation and scoring.
 *
 * Extracted from validateLayout.ts so both validateLayout and scoreLayout
 * can reuse the same normalization, distance, and crossing logic.
 */
import type { Point } from './types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** General epsilon for coordinate comparisons */
export const EPS = 1;

// ─────────────────────────────────────────────────────────────────────────────
// Segment representation for geometry processing
// ─────────────────────────────────────────────────────────────────────────────

export interface Segment {
  a: Point;
  b: Point;
  orientation: 'H' | 'V' | 'Z'; // Horizontal, Vertical, Zero-length
}

export interface NormalizedPolyline {
  points: Point[];
  segments: Segment[];
  bends: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Geometry normalization helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Get segment orientation */
export function segmentOrientation(a: Point, b: Point): 'H' | 'V' | 'Z' {
  const dx = Math.abs(b.x - a.x);
  const dy = Math.abs(b.y - a.y);
  if (dx <= EPS && dy <= EPS) {
    return 'Z';
  }
  if (dy <= EPS) {
    return 'H';
  }
  return 'V';
}

/** Create segments from consecutive point pairs */
export function segmentsFromPoints(points: Point[]): Segment[] {
  const segments: Segment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    segments.push({ a, b, orientation: segmentOrientation(a, b) });
  }
  return segments;
}

/** Merge consecutive collinear segments */
export function mergeCollinear(segments: Segment[]): Segment[] {
  if (segments.length === 0) {
    return [];
  }
  const result: Segment[] = [];
  let current = { ...segments[0] };

  for (let i = 1; i < segments.length; i++) {
    const next = segments[i];
    // Skip zero-length segments
    if (next.orientation === 'Z') {
      continue;
    }
    if (current.orientation === 'Z') {
      current = { ...next };
      continue;
    }
    // Merge if same orientation and collinear
    if (current.orientation === next.orientation) {
      if (
        current.orientation === 'H' &&
        Math.abs(current.b.y - next.a.y) <= EPS &&
        Math.abs(current.a.y - next.a.y) <= EPS
      ) {
        // Extend horizontal segment
        current.b = next.b;
        continue;
      }
      if (
        current.orientation === 'V' &&
        Math.abs(current.b.x - next.a.x) <= EPS &&
        Math.abs(current.a.x - next.a.x) <= EPS
      ) {
        // Extend vertical segment
        current.b = next.b;
        continue;
      }
    }
    // Not mergeable: push current and start new
    // @ts-expect-error - current.orientation should be 'H' | 'V' here due to filtering, but TS doesn't track that
    if (current.orientation !== 'Z') {
      result.push(current);
    }
    current = { ...next };
  }
  if (current.orientation !== 'Z') {
    result.push(current);
  }
  return result;
}

/** Normalize a polyline: remove zero-length, merge collinear, count bends */
export function normalizePolyline(points: Point[]): NormalizedPolyline {
  if (points.length < 2) {
    return { points: [...points], segments: [], bends: 0 };
  }

  // Create segments and filter zero-length
  const rawSegments = segmentsFromPoints(points).filter((s) => s.orientation !== 'Z');

  // Merge collinear
  const merged = mergeCollinear(rawSegments);

  // Rebuild points from merged segments
  const newPoints: Point[] = [];
  for (const [i, element] of merged.entries()) {
    if (i === 0) {
      newPoints.push(element.a);
    }
    newPoints.push(element.b);
  }

  // Count bends: direction changes between consecutive segments
  let bends = 0;
  for (let i = 1; i < merged.length; i++) {
    if (merged[i - 1].orientation !== merged[i].orientation) {
      bends++;
    }
  }

  return { points: newPoints.length > 0 ? newPoints : [...points], segments: merged, bends };
}

/** Euclidean distance between two points */
export function distance(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

/**
 * Check if two orthogonal segments cross.
 *
 * Detects proper interior crossings as well as T-intersections where one
 * segment's endpoint lies on the other segment's interior.  The only case
 * that is excluded is a *shared endpoint*: when the intersection point is
 * an endpoint of **both** segments (two edges departing from the same node
 * corner should not count as a crossing).
 */
export function segmentsCross(s1: Segment, s2: Segment): boolean {
  // Must be H/V pair
  if (s1.orientation === 'Z' || s2.orientation === 'Z') {
    return false;
  }
  if (s1.orientation === s2.orientation) {
    return false;
  }

  const horiz = s1.orientation === 'H' ? s1 : s2;
  const vert = s1.orientation === 'V' ? s1 : s2;

  const hY = horiz.a.y;
  const hX1 = Math.min(horiz.a.x, horiz.b.x);
  const hX2 = Math.max(horiz.a.x, horiz.b.x);

  const vX = vert.a.x;
  const vY1 = Math.min(vert.a.y, vert.b.y);
  const vY2 = Math.max(vert.a.y, vert.b.y);

  // Use non-strict inequalities to also detect T-intersections
  if (vX >= hX1 && vX <= hX2 && hY >= vY1 && hY <= vY2) {
    // The intersection point is (vX, hY).
    // Exclude shared endpoints: if (vX, hY) matches an endpoint of BOTH
    // segments, it's a shared departure/arrival, not a real crossing.
    const TOL = 1e-6;
    const ix = vX;
    const iy = hY;

    const matchesHorizEndpoint =
      (Math.abs(ix - horiz.a.x) < TOL && Math.abs(iy - horiz.a.y) < TOL) ||
      (Math.abs(ix - horiz.b.x) < TOL && Math.abs(iy - horiz.b.y) < TOL);

    const matchesVertEndpoint =
      (Math.abs(ix - vert.a.x) < TOL && Math.abs(iy - vert.a.y) < TOL) ||
      (Math.abs(ix - vert.b.x) < TOL && Math.abs(iy - vert.b.y) < TOL);

    if (matchesHorizEndpoint && matchesVertEndpoint) {
      // Shared endpoint — not a crossing
      return false;
    }

    return true;
  }

  return false;
}
