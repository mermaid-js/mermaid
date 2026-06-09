import type { Edge, LayoutData } from '../../../types.js';
import { rectForNode } from '../core/helpers.js';
import type { Point, Rect } from '../types.js';
import { validateLayout, type ValidateLayoutResult } from '../../layout-utils/validateLayout.js';
import { sanitizeOrthogonalPolylineForRendering } from './sanitize.js';

const EPS = 1e-6;

interface SegmentRef {
  edge: Edge;
  index: number;
  vertical: boolean;
  x?: number;
  y?: number;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

function clonePoint(point: Point): Point {
  return { x: point.x, y: point.y };
}

function sameAxis(a: number, b: number): boolean {
  return Math.abs(a - b) <= EPS;
}

function pointsFor(edge: Edge): Point[] | null {
  return Array.isArray(edge.points) && edge.points.length >= 2 ? edge.points : null;
}

function copyPoints(points: readonly Point[]): Point[] {
  return points.map(clonePoint);
}

function uniqueFinite(values: number[]): number[] {
  return [...new Set(values.filter(Number.isFinite).map((value) => Math.round(value * 1e6) / 1e6))];
}

function collectNodeRects(layout: LayoutData): Rect[] {
  const rects: Rect[] = [];
  for (const node of layout.nodes ?? []) {
    if (node?.id == null || node.isGroup || (node as { isEdgeLabel?: boolean }).isEdgeLabel) {
      continue;
    }
    rects.push(rectForNode(node));
  }
  return rects;
}

function collectSegments(layout: LayoutData): SegmentRef[] {
  const segments: SegmentRef[] = [];
  for (const edge of layout.edges ?? []) {
    const pts = pointsFor(edge);
    if (!pts) {
      continue;
    }
    for (let index = 0; index < pts.length - 1; index++) {
      const a = pts[index];
      const b = pts[index + 1];
      if (sameAxis(a.x, b.x) && !sameAxis(a.y, b.y)) {
        segments.push({
          edge,
          index,
          vertical: true,
          x: a.x,
          x1: a.x,
          x2: a.x,
          y1: Math.min(a.y, b.y),
          y2: Math.max(a.y, b.y),
        });
      } else if (sameAxis(a.y, b.y) && !sameAxis(a.x, b.x)) {
        segments.push({
          edge,
          index,
          vertical: false,
          y: a.y,
          x1: Math.min(a.x, b.x),
          x2: Math.max(a.x, b.x),
          y1: a.y,
          y2: a.y,
        });
      }
    }
  }
  return segments;
}

function crosses(a: SegmentRef, b: SegmentRef): boolean {
  if (a.edge === b.edge || a.vertical === b.vertical) {
    return false;
  }
  const vertical = a.vertical ? a : b;
  const horizontal = a.vertical ? b : a;
  return (
    vertical.x! > horizontal.x1 + EPS &&
    vertical.x! < horizontal.x2 - EPS &&
    horizontal.y! > vertical.y1 + EPS &&
    horizontal.y! < vertical.y2 - EPS
  );
}

function shouldAccept(next: ValidateLayoutResult, current: ValidateLayoutResult): boolean {
  return (
    next.ok &&
    next.issues.length === 0 &&
    (next.score > current.score ||
      (next.breakdown.crossings < current.breakdown.crossings && next.score >= current.score - 25))
  );
}

function tryCandidate(
  layout: LayoutData,
  edge: Edge,
  candidate: Point[],
  current: ValidateLayoutResult
): ValidateLayoutResult | null {
  const original = edge.points;
  edge.points = candidate.map(clonePoint);
  const next = validateLayout(layout);
  if (shouldAccept(next, current)) {
    return next;
  }
  edge.points = original;
  return null;
}

function railShiftCandidates(
  segment: SegmentRef,
  crossing: SegmentRef,
  rects: readonly Rect[],
  spacing: number
): Point[][] {
  const pts = pointsFor(segment.edge);
  if (!pts) {
    return [];
  }
  const values: number[] = [];
  for (const point of pts) {
    values.push(segment.vertical ? point.x : point.y);
    values.push((segment.vertical ? point.x : point.y) - spacing);
    values.push((segment.vertical ? point.x : point.y) + spacing);
  }
  const currentCoord = segment.vertical ? segment.x! : segment.y!;
  values.push(currentCoord - spacing * 1.75, currentCoord + spacing * 1.75);
  values.push(currentCoord - spacing * 2.5, currentCoord + spacing * 2.5);
  values.push(segment.vertical ? crossing.x1 - spacing : crossing.y1 - spacing);
  values.push(segment.vertical ? crossing.x2 + spacing : crossing.y2 + spacing);
  for (const rect of rects) {
    if (segment.vertical) {
      values.push(
        rect.left - spacing,
        rect.left - spacing / 2,
        rect.right + spacing / 2,
        rect.right + spacing
      );
    } else {
      values.push(
        rect.top - spacing,
        rect.top - spacing / 2,
        rect.bottom + spacing / 2,
        rect.bottom + spacing
      );
    }
  }

  const candidates: Point[][] = [];
  for (const value of uniqueFinite(values)) {
    const next = copyPoints(pts);
    if (segment.vertical) {
      next[segment.index].x = value;
      next[segment.index + 1].x = value;
    } else {
      next[segment.index].y = value;
      next[segment.index + 1].y = value;
    }
    candidates.push(sanitizeOrthogonalPolylineForRendering(next, { spacing }));
  }
  return candidates;
}

function applyRailShifts(
  layout: LayoutData,
  current: ValidateLayoutResult,
  spacing: number
): ValidateLayoutResult {
  const rects = collectNodeRects(layout);
  const segments = collectSegments(layout);
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      if (!crosses(segments[i], segments[j])) {
        continue;
      }
      for (const [target, other] of [
        [segments[i], segments[j]],
        [segments[j], segments[i]],
      ] as const) {
        for (const candidate of railShiftCandidates(target, other, rects, spacing)) {
          const accepted = tryCandidate(layout, target.edge, candidate, current);
          if (accepted) {
            return accepted;
          }
        }
      }
    }
  }
  return current;
}

function endpointDetourCandidates(
  segment: SegmentRef,
  rects: readonly Rect[],
  spacing: number
): Point[][] {
  if (!segment.vertical) {
    return [];
  }
  const pts = pointsFor(segment.edge);
  if (!pts || pts.length < 4 || segment.index >= pts.length - 2) {
    return [];
  }

  const start = pts[0];
  const end = pts[pts.length - 1];
  const penultimate = pts[pts.length - 2];
  if (!sameAxis(penultimate.y, end.y) || sameAxis(penultimate.x, end.x)) {
    return [];
  }

  const lastApproachFromLeft = penultimate.x < end.x;
  const endBandX = end.x + (lastApproachFromLeft ? -2.5 * spacing : 2.5 * spacing);
  const minX = Math.min(...rects.map((rect) => rect.left), segment.x1, segment.x2);
  const maxX = Math.max(...rects.map((rect) => rect.right), segment.x1, segment.x2);
  const xCandidates = uniqueFinite([
    maxX + spacing,
    maxX + 2 * spacing,
    minX - spacing,
    minX - 2 * spacing,
  ]);
  const yCandidates = uniqueFinite([
    ...rects.map((rect) => rect.bottom + spacing),
    ...rects.map((rect) => rect.top - spacing),
    segment.y2 + spacing,
    segment.y2 + 2 * spacing,
    segment.y1 - spacing,
    segment.y1 - 2 * spacing,
  ]);

  const candidates: Point[][] = [];
  for (const outerX of xCandidates) {
    for (const detourY of yCandidates) {
      candidates.push(
        sanitizeOrthogonalPolylineForRendering(
          [
            clonePoint(start),
            { x: outerX, y: start.y },
            { x: outerX, y: detourY },
            { x: endBandX, y: detourY },
            { x: endBandX, y: end.y },
            clonePoint(end),
          ],
          { spacing }
        )
      );
    }
  }
  return candidates;
}

function applyEndpointDetours(
  layout: LayoutData,
  current: ValidateLayoutResult,
  spacing: number
): ValidateLayoutResult {
  const rects = collectNodeRects(layout);
  const segments = collectSegments(layout);
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      if (!crosses(segments[i], segments[j])) {
        continue;
      }
      for (const segment of [segments[i], segments[j]]) {
        for (const candidate of endpointDetourCandidates(segment, rects, spacing)) {
          const original = segment.edge.points;
          segment.edge.points = candidate.map(clonePoint);
          const next = validateLayout(layout);
          if (
            next.ok &&
            next.issues.length === 0 &&
            next.breakdown.crossings < current.breakdown.crossings &&
            next.score >= current.score - 25
          ) {
            return next;
          }
          segment.edge.points = original;
        }
      }
    }
  }
  return current;
}

/**
 * Score-gated cleanup for layouts that are already valid but still contain
 * edge-edge crossings. It first tries low-cost rail shifts, then a bounded
 * end-detour for last-mile vertical rails. Every accepted mutation must keep
 * `validateLayout` clean and improve the global validator score (or reduce
 * crossings within a small score budget), so this is safe to run as a final
 * quality pass.
 */
export function reduceCrossingsWithPortSideCandidatesWhenScoreImproves(
  layout: LayoutData,
  options: { maxPasses?: number; spacing?: number } = {}
): { changed: number } {
  const maxPasses = options.maxPasses ?? 4;
  const spacing = options.spacing ?? 10;
  let current = validateLayout(layout);
  if (!current.ok || current.breakdown.crossings <= 0) {
    return { changed: 0 };
  }

  let changed = 0;
  for (let pass = 0; pass < maxPasses && current.breakdown.crossings > 0; pass++) {
    const before = current;
    current = applyRailShifts(layout, current, spacing);
    if (current !== before) {
      changed++;
      continue;
    }

    current = applyEndpointDetours(layout, current, spacing);
    if (current !== before) {
      changed++;
      continue;
    }
    break;
  }
  return { changed };
}
