/**
 * Edge label placement (guide §3.3).
 *
 * Labels are annotations, so they are positioned *after* routing and can never
 * have influenced decomposition, stress or faces. The policy is the one the
 * guide recommends: the midpoint of the longest usable axis-aligned segment,
 * with a configurable offset, and a slide along that segment when the chosen
 * spot collides with a label already placed.
 */

import type { Point } from '../model.js';
import { rectsOverlap } from '../model.js';

export interface LabelRequest {
  originalEdgeId: string;
  width: number;
  height: number;
  route: Point[];
}

export interface PlacedLabel {
  originalEdgeId: string;
  x: number;
  y: number;
}

interface Segment {
  a: Point;
  b: Point;
  length: number;
  horizontal: boolean;
}

const SLIDE_STEPS = 8;

export function placeEdgeLabels(requests: LabelRequest[], offset: number): PlacedLabel[] {
  const placed: PlacedLabel[] = [];
  const occupied: { minX: number; minY: number; maxX: number; maxY: number }[] = [];

  for (const request of requests) {
    const segments = usableSegments(request.route);
    if (segments.length === 0) {
      const fallback = request.route[Math.floor(request.route.length / 2)] ?? { x: 0, y: 0 };
      placed.push({ originalEdgeId: request.originalEdgeId, ...fallback });
      continue;
    }

    const longest = segments.reduce((best, s) => (s.length > best.length ? s : best));
    const spot = slideAlong(longest, request, offset, occupied);
    placed.push({ originalEdgeId: request.originalEdgeId, x: spot.x, y: spot.y });
    occupied.push({
      minX: spot.x - request.width / 2,
      maxX: spot.x + request.width / 2,
      minY: spot.y - request.height / 2,
      maxY: spot.y + request.height / 2,
    });
  }

  return placed;
}

function usableSegments(route: Point[]): Segment[] {
  const segments: Segment[] = [];
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1];
    const b = route[i];
    const horizontal = Math.abs(a.y - b.y) < 1e-9;
    const vertical = Math.abs(a.x - b.x) < 1e-9;
    if (!horizontal && !vertical) {
      continue;
    }
    const length = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
    if (length <= 0) {
      continue;
    }
    segments.push({ a, b, length, horizontal });
  }
  return segments;
}

function slideAlong(
  segment: Segment,
  request: LabelRequest,
  offset: number,
  occupied: { minX: number; minY: number; maxX: number; maxY: number }[]
): Point {
  const candidates: Point[] = [];
  for (let step = 0; step <= SLIDE_STEPS; step++) {
    // Midpoint first, then alternating outwards along the segment.
    const fraction =
      0.5 +
      (step === 0 ? 0 : ((step % 2 === 1 ? 1 : -1) * Math.ceil(step / 2)) / (SLIDE_STEPS + 2));
    if (fraction <= 0.05 || fraction >= 0.95) {
      continue;
    }
    const base = {
      x: segment.a.x + (segment.b.x - segment.a.x) * fraction,
      y: segment.a.y + (segment.b.y - segment.a.y) * fraction,
    };
    candidates.push(
      segment.horizontal ? { x: base.x, y: base.y - offset } : { x: base.x + offset, y: base.y }
    );
  }

  for (const candidate of candidates) {
    const rect = {
      minX: candidate.x - request.width / 2,
      maxX: candidate.x + request.width / 2,
      minY: candidate.y - request.height / 2,
      maxY: candidate.y + request.height / 2,
    };
    if (!occupied.some((other) => rectsOverlap(rect, other))) {
      return candidate;
    }
  }

  return candidates[0] ?? segment.a;
}
