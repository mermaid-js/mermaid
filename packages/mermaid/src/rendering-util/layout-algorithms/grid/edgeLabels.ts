import type { Point } from '../../../types.js';
import type { Edge, LayoutData, Node, NonClusterNode } from '../../types.js';
import { normalizePolyline, type Segment } from '../layout-utils/geometry.js';
import {
  polylineIntersectsRect,
  rectForNode,
  segmentIntersectsRectInterior,
} from '../layout-utils/helpers.js';
import type { Rect } from '../layout-utils/types.js';
import type { GridRoutingInstrumentation } from './routerInstrumentation.js';
import { GRID_LABEL_PREFIX, gridError, isEdgeLabelNode, isFinitePositiveNumber } from './types.js';

const LABEL_CLEARANCE = 6;
const LABEL_GUTTER = 14;
const LABEL_GUTTER_STEP = 18;
const MAX_GUTTER_STEPS = 16;
const MAX_DETOUR_LINE_CANDIDATES = 128;
const MAX_DETOUR_CENTER_CANDIDATES = 64;
const EDGE_END_MARKER_CLEARANCE = 12;
const EPS = 1e-6;

interface Interval {
  start: number;
  end: number;
}

interface PlacedLabel {
  edgeId: string;
  nodeId: string;
  center: Point;
  rect: Rect;
}

interface SegmentCandidate {
  segment: Segment;
  segmentIndex: number;
  order: number;
}

interface LabelWorkItem {
  edge: Edge;
  labelNode: Node;
  sourceIndex: number;
}

type EdgePointOverrides = Map<string, Point[]>;

interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface ObstacleEntry {
  id: string;
  bounds: Bounds;
  rect: Rect;
  nodeId?: string;
}

interface BorderEntry {
  id: string;
  bounds: Bounds;
  rect: Rect;
}

interface EdgeSegmentEntry {
  id: string;
  bounds: Bounds;
  edgeId: string;
  segment: Segment;
}

interface EdgeGeometryCache {
  points: Point[];
  segments: Segment[];
  candidateSegments: SegmentCandidate[];
  markerRects: Rect[];
}

export interface GridEdgeLabelInstrumentation {
  fullNodeObstacleScans: number;
  fullEdgeScans: number;
  obstacleRectQueries: number;
  obstacleBandQueries: number;
  obstaclePolylineQueries: number;
  obstacleCandidatesVisited: number;
  segmentRectQueries: number;
  segmentBandQueries: number;
  segmentCandidatesVisited: number;
  foreignEdgeLookups: number;
  labelPasses: number;
  frozenReservations: number;
  impactedEdgeReroutes: number;
  maxReroutesPerEdgePerPass: number;
  preservedAnchors: number;
  rerouteCandidatesEvaluated: number;
  rerouteRejectedBlockedRect: number;
  rerouteRejectedProtectedObstacle: number;
  rerouteRejectedLabelAnchor: number;
  rerouteRejectedDegenerateSpan: number;
  reroutePartialProgressCandidates: number;
  individualLabelRerouteAttempts: number;
  individualLabelRerouteSuccesses: number;
  labelOverlapFallbacks: number;
  labelOverlapReservations: number;
  rollbacks: number;
  indexCoordinateCount: number;
  indexSpanAllocations: number;
}

interface EdgeLabelContext {
  edgeById: Map<string, Edge>;
  edgeGeometryById: Map<string, EdgeGeometryCache>;
  obstacleIndex: CompressedBoundsIndex<ObstacleEntry>;
  placedLabelIndex: CompressedBoundsIndex<ObstacleEntry>;
  groupBorderIndex: CompressedBoundsIndex<BorderEntry>;
  segmentIndex: CompressedBoundsIndex<EdgeSegmentEntry>;
  searchBounds: Bounds;
  metrics?: GridEdgeLabelInstrumentation;
}

type ObstacleQueryMetric =
  | 'obstacleRectQueries'
  | 'obstacleBandQueries'
  | 'obstaclePolylineQueries';
type SegmentQueryMetric = 'segmentRectQueries' | 'segmentBandQueries';

export function createGridEdgeLabelInstrumentation(): GridEdgeLabelInstrumentation {
  return {
    fullNodeObstacleScans: 0,
    fullEdgeScans: 0,
    obstacleRectQueries: 0,
    obstacleBandQueries: 0,
    obstaclePolylineQueries: 0,
    obstacleCandidatesVisited: 0,
    segmentRectQueries: 0,
    segmentBandQueries: 0,
    segmentCandidatesVisited: 0,
    foreignEdgeLookups: 0,
    labelPasses: 0,
    frozenReservations: 0,
    impactedEdgeReroutes: 0,
    maxReroutesPerEdgePerPass: 0,
    preservedAnchors: 0,
    rerouteCandidatesEvaluated: 0,
    rerouteRejectedBlockedRect: 0,
    rerouteRejectedProtectedObstacle: 0,
    rerouteRejectedLabelAnchor: 0,
    rerouteRejectedDegenerateSpan: 0,
    reroutePartialProgressCandidates: 0,
    individualLabelRerouteAttempts: 0,
    individualLabelRerouteSuccesses: 0,
    labelOverlapFallbacks: 0,
    labelOverlapReservations: 0,
    rollbacks: 0,
    indexCoordinateCount: 0,
    indexSpanAllocations: 0,
  };
}

/**
 * A dynamic coordinate-compressed bounds index. Entries are keyed by their
 * actual boundaries; no bucket is allocated for any coordinate between them.
 * Label routing mutates these indexes often enough that a sorted sweep on the
 * compressed entries is both simpler and more predictable than rebuilding a
 * tree after every provisional reservation.
 */
class CompressedBoundsIndex<T extends { id: string; bounds: Bounds }> {
  private readonly entriesById = new Map<string, T>();
  private sortedByLeft: T[] = [];
  private dirty = false;

  constructor(private readonly metrics?: GridEdgeLabelInstrumentation) {}

  upsert(entry: T): void {
    const isNew = !this.entriesById.has(entry.id);
    this.entriesById.set(entry.id, entry);
    this.dirty = true;
    if (isNew && this.metrics) {
      // Four stored boundary coordinates per entry, independent of their span.
      this.metrics.indexCoordinateCount += 4;
    }
  }

  remove(id: string): void {
    if (this.entriesById.delete(id)) {
      this.dirty = true;
    }
  }

  query(bounds: Bounds): T[] {
    if (this.dirty) {
      this.sortedByLeft = [...this.entriesById.values()].sort(
        (a, b) => a.bounds.left - b.bounds.left || a.id.localeCompare(b.id)
      );
      this.dirty = false;
    }
    const result: T[] = [];
    for (const entry of this.sortedByLeft) {
      if (entry.bounds.left > bounds.right) {
        break;
      }
      if (boundsOverlap(entry.bounds, bounds)) {
        result.push(entry);
      }
    }
    return result;
  }
}

function rectOverlap(a: Rect, b: Rect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function labelRectAt(node: Node, center: Point): Rect {
  const width = node.width ?? 0;
  const height = node.height ?? 0;
  return {
    cx: center.x,
    cy: center.y,
    left: center.x - width / 2,
    right: center.x + width / 2,
    top: center.y - height / 2,
    bottom: center.y + height / 2,
  };
}

function groupTitleRect(node: Node): Rect | null {
  const rect = node.groupTitleRect;
  if (!rect) {
    return null;
  }
  return {
    cx: (rect.left + rect.right) / 2,
    cy: (rect.top + rect.bottom) / 2,
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
  };
}

function markerClearanceRect(points: Point[], which: 'start' | 'end'): Rect | null {
  if (points.length < 2) {
    return null;
  }
  if (which === 'start') {
    const [a, b] = points;
    if (a.x === b.x) {
      const top = Math.min(a.y, b.y);
      return {
        cx: a.x,
        cy: top + EDGE_END_MARKER_CLEARANCE / 2,
        left: a.x - 7,
        right: a.x + 7,
        top,
        bottom: top + EDGE_END_MARKER_CLEARANCE,
      };
    }
    const left = Math.min(a.x, b.x);
    return {
      cx: left + EDGE_END_MARKER_CLEARANCE / 2,
      cy: a.y,
      left,
      right: left + EDGE_END_MARKER_CLEARANCE,
      top: a.y - 7,
      bottom: a.y + 7,
    };
  }

  const a = points[points.length - 2];
  const b = points[points.length - 1];
  if (a.x === b.x) {
    const bottom = Math.max(a.y, b.y);
    return {
      cx: b.x,
      cy: bottom - EDGE_END_MARKER_CLEARANCE / 2,
      left: b.x - 7,
      right: b.x + 7,
      top: bottom - EDGE_END_MARKER_CLEARANCE,
      bottom,
    };
  }
  const right = Math.max(a.x, b.x);
  return {
    cx: right - EDGE_END_MARKER_CLEARANCE / 2,
    cy: b.y,
    left: right - EDGE_END_MARKER_CLEARANCE,
    right,
    top: b.y - 7,
    bottom: b.y + 7,
  };
}

function incrementMetric(
  metrics: GridEdgeLabelInstrumentation | undefined,
  key: keyof GridEdgeLabelInstrumentation,
  delta = 1
): void {
  if (metrics) {
    metrics[key] += delta;
  }
}

function clonePoint(point: Point): Point {
  return { ...point };
}

function boundsForRect(rect: Rect): Bounds {
  return {
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
  };
}

function boundsForSegment(segment: Segment): Bounds {
  return {
    left: Math.min(segment.a.x, segment.b.x),
    right: Math.max(segment.a.x, segment.b.x),
    top: Math.min(segment.a.y, segment.b.y),
    bottom: Math.max(segment.a.y, segment.b.y),
  };
}

function boundsForPoints(points: Point[]): Bounds | null {
  if (points.length === 0) {
    return null;
  }
  let left = points[0].x;
  let right = points[0].x;
  let top = points[0].y;
  let bottom = points[0].y;
  for (const point of points.slice(1)) {
    left = Math.min(left, point.x);
    right = Math.max(right, point.x);
    top = Math.min(top, point.y);
    bottom = Math.max(bottom, point.y);
  }
  return { left, right, top, bottom };
}

function mergeBounds(a: Bounds, b: Bounds): Bounds {
  return {
    left: Math.min(a.left, b.left),
    right: Math.max(a.right, b.right),
    top: Math.min(a.top, b.top),
    bottom: Math.max(a.bottom, b.bottom),
  };
}

function expandBounds(bounds: Bounds, padding: number): Bounds {
  return {
    left: bounds.left - padding,
    right: bounds.right + padding,
    top: bounds.top - padding,
    bottom: bounds.bottom + padding,
  };
}

function boundsOverlap(a: Bounds, b: Bounds): boolean {
  return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top;
}

function candidateSegmentsFromSegments(segments: Segment[]): SegmentCandidate[] {
  const indexes =
    segments.length <= 2
      ? segments.map((_, index) => index)
      : [...segments.slice(1, -1).map((_, index) => index + 1), 0, segments.length - 1];
  return indexes.map((segmentIndex, order) => ({
    segment: segments[segmentIndex],
    segmentIndex,
    order,
  }));
}

function markerClearanceRectsFromPoints(points: Point[]): Rect[] {
  return ['start', 'end']
    .map((which) => markerClearanceRect(points, which as 'start' | 'end'))
    .filter((rect): rect is Rect => rect !== null);
}

function buildEdgeGeometry(points: Point[]): EdgeGeometryCache {
  const normalized = normalizePolyline(points);
  return {
    points: normalized.points,
    segments: normalized.segments,
    candidateSegments: candidateSegmentsFromSegments(normalized.segments),
    markerRects: markerClearanceRectsFromPoints(normalized.points),
  };
}

function segmentLength(segment: Segment): number {
  return segment.orientation === 'H'
    ? Math.abs(segment.b.x - segment.a.x)
    : Math.abs(segment.b.y - segment.a.y);
}

function borderCutsRect(rect: Rect, border: Rect): boolean {
  const corners: Point[] = [
    { x: border.left, y: border.top },
    { x: border.right, y: border.top },
    { x: border.right, y: border.bottom },
    { x: border.left, y: border.bottom },
  ];
  for (let i = 0; i < corners.length; i++) {
    if (segmentIntersectsRectInterior(corners[i], corners[(i + 1) % corners.length], rect)) {
      return true;
    }
  }
  return false;
}

function hasFinitePosition(node: Node): boolean {
  return Number.isFinite(node.x) && Number.isFinite(node.y);
}

function pointsForEdge(
  edge: Edge,
  overrides?: EdgePointOverrides,
  context?: EdgeLabelContext
): Point[] {
  const overridePoints = overrides?.get(edge.id);
  if (overridePoints) {
    return normalizePolyline(overridePoints).points;
  }
  const cached = context?.edgeGeometryById.get(edge.id);
  if (cached) {
    return cached.points;
  }
  return normalizePolyline(edge.points ?? []).points;
}

function markerClearanceRectsForEdge(
  edge: Edge,
  overrides?: EdgePointOverrides,
  context?: EdgeLabelContext
): Rect[] {
  if (!overrides?.has(edge.id)) {
    const cached = context?.edgeGeometryById.get(edge.id);
    if (cached) {
      return cached.markerRects;
    }
  }
  return markerClearanceRectsFromPoints(pointsForEdge(edge, overrides, context));
}

function rangeOverlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return (
    Math.max(Math.min(aStart, aEnd), Math.min(bStart, bEnd)) <
    Math.min(Math.max(aStart, aEnd), Math.max(bStart, bEnd)) - EPS
  );
}

function clampInterval(interval: Interval, low: number, high: number): Interval | null {
  const start = Math.max(low, Math.min(interval.start, interval.end));
  const end = Math.min(high, Math.max(interval.start, interval.end));
  return end - start > EPS ? { start, end } : null;
}

function mergeIntervals(intervals: Interval[], low: number, high: number): Interval[] {
  const clamped = intervals
    .map((interval) => clampInterval(interval, low, high))
    .filter((interval): interval is Interval => interval !== null)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  if (clamped.length === 0) {
    return [];
  }

  const merged: Interval[] = [clamped[0]];
  for (let index = 1; index < clamped.length; index++) {
    const current = clamped[index];
    const previous = merged[merged.length - 1];
    if (current.start <= previous.end + EPS) {
      previous.end = Math.max(previous.end, current.end);
    } else {
      merged.push(current);
    }
  }
  return merged;
}

function centerCandidatesFromIntervals(
  low: number,
  high: number,
  blocked: Interval[],
  preferred: number
): number[] {
  if (high - low <= EPS) {
    return [];
  }

  const allowed: Interval[] = [];
  let cursor = low;
  for (const interval of mergeIntervals(blocked, low, high)) {
    if (interval.start - cursor > EPS) {
      allowed.push({ start: cursor, end: interval.start });
    }
    cursor = Math.max(cursor, interval.end);
  }
  if (high - cursor > EPS) {
    allowed.push({ start: cursor, end: high });
  }

  const candidates = allowed.map((interval) => ({
    value: Math.max(interval.start, Math.min(preferred, interval.end)),
    start: interval.start,
    end: interval.end,
  }));
  candidates.sort((a, b) => {
    const preferredDelta = Math.abs(a.value - preferred) - Math.abs(b.value - preferred);
    if (Math.abs(preferredDelta) > EPS) {
      return preferredDelta;
    }
    const widthDelta = b.end - b.start - (a.end - a.start);
    if (Math.abs(widthDelta) > EPS) {
      return widthDelta;
    }
    return a.value - b.value;
  });

  const seen = new Set<number>();
  const values: number[] = [];
  for (const candidate of candidates) {
    const rounded = Math.round(candidate.value * 1e6) / 1e6;
    if (seen.has(rounded)) {
      continue;
    }
    seen.add(rounded);
    values.push(candidate.value);
  }
  return values;
}

function obstacleRectForNode(node: Node): Rect | null {
  if (node.isGroup) {
    return null;
  }
  if (isEdgeLabelNode(node) && !hasFinitePosition(node)) {
    return null;
  }
  return rectForNode(node);
}

function candidateSegments(edge: Edge, context?: EdgeLabelContext): SegmentCandidate[] {
  const cached = context?.edgeGeometryById.get(edge.id);
  if (cached) {
    return cached.candidateSegments;
  }
  return candidateSegmentsFromSegments(normalizePolyline(edge.points ?? []).segments);
}

function storeEdgeGeometry(
  context: EdgeLabelContext,
  edgeId: string,
  geometry: EdgeGeometryCache
): void {
  const previous = context.edgeGeometryById.get(edgeId);
  if (previous) {
    previous.segments.forEach((_, index) => context.segmentIndex.remove(`${edgeId}:${index}`));
  }

  context.edgeGeometryById.set(edgeId, geometry);
  geometry.segments.forEach((segment, index) => {
    context.segmentIndex.upsert({
      id: `${edgeId}:${index}`,
      edgeId,
      segment,
      bounds: boundsForSegment(segment),
    });
  });
}

function setEdgePoints(context: EdgeLabelContext, edge: Edge, points: Point[]): void {
  const geometry = buildEdgeGeometry(points);
  edge.points = geometry.points.map(clonePoint);
  storeEdgeGeometry(context, edge.id, geometry);
}

function upsertPlacedLabelObstacle(context: EdgeLabelContext, placedLabel: PlacedLabel): void {
  context.placedLabelIndex.upsert({
    id: `label:${placedLabel.nodeId}`,
    nodeId: placedLabel.nodeId,
    rect: placedLabel.rect,
    bounds: boundsForRect(placedLabel.rect),
  });
}

function createEdgeLabelContext(
  data: LayoutData,
  metrics?: GridEdgeLabelInstrumentation
): EdgeLabelContext {
  const context: EdgeLabelContext = {
    edgeById: new Map(),
    edgeGeometryById: new Map(),
    obstacleIndex: new CompressedBoundsIndex<ObstacleEntry>(metrics),
    placedLabelIndex: new CompressedBoundsIndex<ObstacleEntry>(metrics),
    groupBorderIndex: new CompressedBoundsIndex<BorderEntry>(metrics),
    segmentIndex: new CompressedBoundsIndex<EdgeSegmentEntry>(metrics),
    searchBounds: { left: 0, right: 0, top: 0, bottom: 0 },
    metrics,
  };

  let aggregateBounds: Bounds | null = null;
  const rememberBounds = (bounds: Bounds) => {
    aggregateBounds = aggregateBounds ? mergeBounds(aggregateBounds, bounds) : { ...bounds };
  };

  for (const node of data.nodes) {
    if (node.isGroup) {
      const borderRect = rectForNode(node);
      const borderBounds = boundsForRect(borderRect);
      context.groupBorderIndex.upsert({
        id: `border:${node.id}`,
        rect: borderRect,
        bounds: borderBounds,
      });
      rememberBounds(borderBounds);

      const titleRect = groupTitleRect(node);
      if (titleRect) {
        const titleBounds = boundsForRect(titleRect);
        context.obstacleIndex.upsert({
          id: `title:${node.id}`,
          rect: titleRect,
          bounds: titleBounds,
        });
        rememberBounds(titleBounds);
      }
      continue;
    }

    const obstacleRect = obstacleRectForNode(node);
    if (!obstacleRect) {
      continue;
    }

    const entry: ObstacleEntry = {
      id: `${isEdgeLabelNode(node) ? 'label' : 'node'}:${node.id}`,
      rect: obstacleRect,
      bounds: boundsForRect(obstacleRect),
      nodeId: node.id,
    };
    if (isEdgeLabelNode(node)) {
      context.placedLabelIndex.upsert(entry);
    } else {
      context.obstacleIndex.upsert(entry);
    }
    rememberBounds(entry.bounds);
  }

  for (const edge of data.edges) {
    context.edgeById.set(edge.id, edge);
    const geometry = buildEdgeGeometry(edge.points ?? []);
    storeEdgeGeometry(context, edge.id, geometry);
    const pointBounds = boundsForPoints(geometry.points);
    if (pointBounds) {
      rememberBounds(pointBounds);
    }
  }

  context.searchBounds = expandBounds(
    aggregateBounds ?? { left: 0, right: 0, top: 0, bottom: 0 },
    128
  );
  return context;
}

function queryObstacleEntries(
  context: EdgeLabelContext,
  bounds: Bounds,
  metricKey: ObstacleQueryMetric,
  options: {
    excludeNodeId?: string;
    skipNodeIds?: ReadonlySet<string>;
  } = {}
): ObstacleEntry[] {
  incrementMetric(context.metrics, metricKey);

  const collected: ObstacleEntry[] = [];
  const appendEntries = (entries: ObstacleEntry[]) => {
    for (const entry of entries) {
      if (
        entry.nodeId &&
        (entry.nodeId === options.excludeNodeId || options.skipNodeIds?.has(entry.nodeId))
      ) {
        continue;
      }
      collected.push(entry);
    }
  };

  appendEntries(context.obstacleIndex.query(bounds));
  appendEntries(context.placedLabelIndex.query(bounds));
  incrementMetric(context.metrics, 'obstacleCandidatesVisited', collected.length);
  return collected;
}

function queryForeignSegments(
  context: EdgeLabelContext,
  bounds: Bounds,
  selfEdgeId: string,
  overrides: EdgePointOverrides | undefined,
  metricKey: SegmentQueryMetric
): EdgeSegmentEntry[] {
  incrementMetric(context.metrics, metricKey);

  const overriddenEdgeIds = overrides ? new Set(overrides.keys()) : undefined;
  const collected: EdgeSegmentEntry[] = [];
  const indexedEntries = context.segmentIndex.query(bounds);
  for (const entry of indexedEntries) {
    if (entry.edgeId === selfEdgeId || overriddenEdgeIds?.has(entry.edgeId)) {
      continue;
    }
    collected.push(entry);
  }

  let visited = indexedEntries.length;
  if (overrides) {
    for (const [edgeId, points] of overrides) {
      if (edgeId === selfEdgeId) {
        continue;
      }
      const geometry = buildEdgeGeometry(points);
      geometry.segments.forEach((segment, index) => {
        const segmentBounds = boundsForSegment(segment);
        if (!boundsOverlap(segmentBounds, bounds)) {
          return;
        }
        visited += 1;
        collected.push({
          id: `override:${edgeId}:${index}`,
          edgeId,
          segment,
          bounds: segmentBounds,
        });
      });
    }
  }

  incrementMetric(context.metrics, 'segmentCandidatesVisited', visited);
  return collected;
}

function foreignEdgeIdsIntersectingRect(
  context: EdgeLabelContext,
  rect: Rect,
  selfEdgeId: string,
  overrides?: EdgePointOverrides
): string[] {
  incrementMetric(context.metrics, 'foreignEdgeLookups');
  const ids = new Set<string>();
  for (const entry of queryForeignSegments(
    context,
    boundsForRect(rect),
    selfEdgeId,
    overrides,
    'segmentRectQueries'
  )) {
    if (segmentIntersectsRectInterior(entry.segment.a, entry.segment.b, rect)) {
      ids.add(entry.edgeId);
    }
  }
  return [...ids].sort((a, b) => a.localeCompare(b));
}

function obstacleBandQueryBounds(segment: Segment, labelNode: Node): Bounds | null {
  if (!isFinitePositiveNumber(labelNode.width) || !isFinitePositiveNumber(labelNode.height)) {
    return null;
  }

  if (segment.orientation === 'H') {
    return {
      left: Math.min(segment.a.x, segment.b.x) - labelNode.width / 2,
      right: Math.max(segment.a.x, segment.b.x) + labelNode.width / 2,
      top: segment.a.y - labelNode.height / 2,
      bottom: segment.a.y + labelNode.height / 2,
    };
  }

  return {
    left: segment.a.x - labelNode.width / 2,
    right: segment.a.x + labelNode.width / 2,
    top: Math.min(segment.a.y, segment.b.y) - labelNode.height / 2,
    bottom: Math.max(segment.a.y, segment.b.y) + labelNode.height / 2,
  };
}

function detourLineQueryBounds(segment: Segment, labelNode: Node, searchBounds: Bounds): Bounds {
  if (segment.orientation === 'H') {
    const alongPadding = (labelNode.width ?? 0) + LABEL_CLEARANCE * 2 + LABEL_GUTTER;
    return {
      left: Math.min(segment.a.x, segment.b.x) - alongPadding,
      right: Math.max(segment.a.x, segment.b.x) + alongPadding,
      top: searchBounds.top,
      bottom: searchBounds.bottom,
    };
  }

  const alongPadding = (labelNode.height ?? 0) + LABEL_CLEARANCE * 2 + LABEL_GUTTER;
  return {
    left: searchBounds.left,
    right: searchBounds.right,
    top: Math.min(segment.a.y, segment.b.y) - alongPadding,
    bottom: Math.max(segment.a.y, segment.b.y) + alongPadding,
  };
}

function rerouteLineQueryBounds(segment: Segment, searchBounds: Bounds): Bounds {
  if (segment.orientation === 'H') {
    return {
      left: Math.min(segment.a.x, segment.b.x) - LABEL_CLEARANCE,
      right: Math.max(segment.a.x, segment.b.x) + LABEL_CLEARANCE,
      top: searchBounds.top,
      bottom: searchBounds.bottom,
    };
  }

  return {
    left: searchBounds.left,
    right: searchBounds.right,
    top: Math.min(segment.a.y, segment.b.y) - LABEL_CLEARANCE,
    bottom: Math.max(segment.a.y, segment.b.y) + LABEL_CLEARANCE,
  };
}

function rectSafeForLabel(
  rect: Rect,
  edge: Edge,
  labelNodeId: string,
  context: EdgeLabelContext,
  overrides?: EdgePointOverrides,
  allowedForeignEdgeIds?: ReadonlySet<string>
): boolean {
  for (const obstacle of queryObstacleEntries(context, boundsForRect(rect), 'obstacleRectQueries', {
    excludeNodeId: labelNodeId,
  })) {
    if (rectOverlap(rect, obstacle.rect)) {
      return false;
    }
  }

  for (const border of context.groupBorderIndex.query(boundsForRect(rect))) {
    if (borderCutsRect(rect, border.rect)) {
      return false;
    }
  }

  for (const clearanceRect of markerClearanceRectsForEdge(edge, overrides, context)) {
    if (rectOverlap(rect, clearanceRect)) {
      return false;
    }
  }

  for (const foreignSegment of queryForeignSegments(
    context,
    boundsForRect(rect),
    edge.id,
    overrides,
    'segmentRectQueries'
  )) {
    if (allowedForeignEdgeIds?.has(foreignSegment.edgeId)) {
      continue;
    }
    if (segmentIntersectsRectInterior(foreignSegment.segment.a, foreignSegment.segment.b, rect)) {
      return false;
    }
  }

  return true;
}

function requiredSegmentLength(node: Node, segment: Segment): number {
  return segment.orientation === 'H'
    ? (node.width ?? 0) + LABEL_CLEARANCE * 2
    : (node.height ?? 0) + LABEL_CLEARANCE * 2;
}

function blockedCenterIntervals(
  edge: Edge,
  labelNode: Node,
  segment: Segment,
  context: EdgeLabelContext,
  overrides: EdgePointOverrides | undefined,
  includeForeignEdges: boolean
): { low: number; high: number; blocked: Interval[] } | null {
  if (!isFinitePositiveNumber(labelNode.width) || !isFinitePositiveNumber(labelNode.height)) {
    return null;
  }
  const labelWidth = labelNode.width;
  const labelHeight = labelNode.height;

  const alongHalf =
    segment.orientation === 'H'
      ? labelWidth / 2 + LABEL_CLEARANCE
      : labelHeight / 2 + LABEL_CLEARANCE;
  const low =
    segment.orientation === 'H'
      ? Math.min(segment.a.x, segment.b.x) + alongHalf
      : Math.min(segment.a.y, segment.b.y) + alongHalf;
  const high =
    segment.orientation === 'H'
      ? Math.max(segment.a.x, segment.b.x) - alongHalf
      : Math.max(segment.a.y, segment.b.y) - alongHalf;
  if (high - low <= EPS) {
    return null;
  }

  const blocked: Interval[] = [];
  const bandBounds = obstacleBandQueryBounds(segment, labelNode);
  if (!bandBounds) {
    return null;
  }
  const addRect = (rect: Rect) => {
    if (segment.orientation === 'H') {
      const bandTop = segment.a.y - labelHeight / 2;
      const bandBottom = segment.a.y + labelHeight / 2;
      if (rangeOverlaps(bandTop, bandBottom, rect.top, rect.bottom)) {
        blocked.push({
          start: rect.left - labelWidth / 2,
          end: rect.right + labelWidth / 2,
        });
      }
      return;
    }

    const bandLeft = segment.a.x - labelWidth / 2;
    const bandRight = segment.a.x + labelWidth / 2;
    if (rangeOverlaps(bandLeft, bandRight, rect.left, rect.right)) {
      blocked.push({
        start: rect.top - labelHeight / 2,
        end: rect.bottom + labelHeight / 2,
      });
    }
  };

  for (const obstacle of queryObstacleEntries(context, bandBounds, 'obstacleBandQueries', {
    excludeNodeId: labelNode.id,
  })) {
    addRect(obstacle.rect);
  }
  for (const clearanceRect of markerClearanceRectsForEdge(edge, overrides, context)) {
    addRect(clearanceRect);
  }

  if (includeForeignEdges) {
    for (const foreignSegment of queryForeignSegments(
      context,
      bandBounds,
      edge.id,
      overrides,
      'segmentBandQueries'
    )) {
      const segmentEntry = foreignSegment.segment;
      if (segment.orientation === 'H') {
        const bandTop = segment.a.y - labelNode.height / 2;
        const bandBottom = segment.a.y + labelNode.height / 2;
        if (segmentEntry.orientation === 'H') {
          if (bandTop < segmentEntry.a.y && bandBottom > segmentEntry.a.y) {
            blocked.push({
              start: Math.min(segmentEntry.a.x, segmentEntry.b.x) - labelNode.width / 2,
              end: Math.max(segmentEntry.a.x, segmentEntry.b.x) + labelNode.width / 2,
            });
          }
        } else if (
          rangeOverlaps(
            bandTop,
            bandBottom,
            Math.min(segmentEntry.a.y, segmentEntry.b.y),
            Math.max(segmentEntry.a.y, segmentEntry.b.y)
          )
        ) {
          blocked.push({
            start: segmentEntry.a.x - labelNode.width / 2,
            end: segmentEntry.a.x + labelNode.width / 2,
          });
        }
        continue;
      }

      const bandLeft = segment.a.x - labelNode.width / 2;
      const bandRight = segment.a.x + labelNode.width / 2;
      if (segmentEntry.orientation === 'V') {
        if (bandLeft < segmentEntry.a.x && bandRight > segmentEntry.a.x) {
          blocked.push({
            start: Math.min(segmentEntry.a.y, segmentEntry.b.y) - labelNode.height / 2,
            end: Math.max(segmentEntry.a.y, segmentEntry.b.y) + labelNode.height / 2,
          });
        }
      } else if (
        rangeOverlaps(
          bandLeft,
          bandRight,
          Math.min(segmentEntry.a.x, segmentEntry.b.x),
          Math.max(segmentEntry.a.x, segmentEntry.b.x)
        )
      ) {
        blocked.push({
          start: segmentEntry.a.y - labelNode.height / 2,
          end: segmentEntry.a.y + labelNode.height / 2,
        });
      }
    }
  }

  return { low, high, blocked };
}

function placementOnExistingSegment(
  edge: Edge,
  labelNode: Node,
  segment: Segment,
  context: EdgeLabelContext
): Point | null {
  if (segmentLength(segment) < requiredSegmentLength(labelNode, segment)) {
    return null;
  }

  const intervalData = blockedCenterIntervals(edge, labelNode, segment, context, undefined, true);
  if (!intervalData) {
    return null;
  }

  const preferred =
    segment.orientation === 'H'
      ? (Math.min(segment.a.x, segment.b.x) + Math.max(segment.a.x, segment.b.x)) / 2
      : (Math.min(segment.a.y, segment.b.y) + Math.max(segment.a.y, segment.b.y)) / 2;

  const candidates = centerCandidatesFromIntervals(
    intervalData.low,
    intervalData.high,
    intervalData.blocked,
    preferred
  );
  for (const candidate of candidates) {
    const center =
      segment.orientation === 'H'
        ? { x: candidate, y: segment.a.y }
        : { x: segment.a.x, y: candidate };
    const rect = labelRectAt(labelNode, center);
    if (rectSafeForLabel(rect, edge, labelNode.id, context)) {
      return center;
    }
  }

  return null;
}

function placementOnExistingSegmentWithReroutes(
  edge: Edge,
  labelNode: Node,
  segment: Segment,
  context: EdgeLabelContext,
  placedLabelsByEdgeId: Map<string, PlacedLabel>
): Point | null {
  const intervalData = blockedCenterIntervals(edge, labelNode, segment, context, undefined, false);
  if (!intervalData) {
    return null;
  }

  const preferred =
    segment.orientation === 'H'
      ? (Math.min(segment.a.x, segment.b.x) + Math.max(segment.a.x, segment.b.x)) / 2
      : (Math.min(segment.a.y, segment.b.y) + Math.max(segment.a.y, segment.b.y)) / 2;
  const candidates = centerCandidatesFromIntervals(
    intervalData.low,
    intervalData.high,
    intervalData.blocked,
    preferred
  );

  for (const candidate of candidates) {
    const center =
      segment.orientation === 'H'
        ? { x: candidate, y: segment.a.y }
        : { x: segment.a.x, y: candidate };
    const rect = labelRectAt(labelNode, center);
    const overrides: EdgePointOverrides = new Map();
    const foreignEdges = foreignEdgeIdsIntersectingRect(context, rect, edge.id)
      .map((edgeId) => context.edgeById.get(edgeId))
      .filter((foreignEdge): foreignEdge is Edge => foreignEdge !== undefined);

    let ok = true;
    for (const foreignEdge of foreignEdges) {
      const reroutedPoints = rerouteForeignEdgeAroundRect(
        foreignEdge,
        rect,
        context,
        placedLabelsByEdgeId,
        overrides
      );
      if (!reroutedPoints) {
        ok = false;
        break;
      }
      overrides.set(foreignEdge.id, reroutedPoints);
    }

    if (!ok) {
      continue;
    }
    if (!rectSafeForLabel(rect, edge, labelNode.id, context, overrides)) {
      continue;
    }

    for (const [edgeId, points] of overrides) {
      const foreignEdge = context.edgeById.get(edgeId);
      if (foreignEdge) {
        setEdgePoints(context, foreignEdge, points);
      }
    }
    return center;
  }

  return null;
}

function polylineHitsProtectedObstacles(
  points: Point[],
  context: EdgeLabelContext,
  skipNodeIds: ReadonlySet<string>
): boolean {
  for (const segment of normalizePolyline(points).segments) {
    for (const obstacle of queryObstacleEntries(
      context,
      boundsForSegment(segment),
      'obstaclePolylineQueries',
      { skipNodeIds }
    )) {
      if (segmentIntersectsRectInterior(segment.a, segment.b, obstacle.rect)) {
        return true;
      }
    }
  }
  return false;
}

function labelStillAnchored(
  edgeId: string,
  points: Point[],
  placedLabelsByEdgeId: Map<string, PlacedLabel>
): boolean {
  const placed = placedLabelsByEdgeId.get(edgeId);
  return !placed || polylineIntersectsRect(points, placed.rect);
}

function detourOffsets(crossHalfSize: number): number[] {
  const out: number[] = [];
  for (let step = 0; step < MAX_GUTTER_STEPS; step++) {
    const offset = crossHalfSize + LABEL_GUTTER + step * LABEL_GUTTER_STEP;
    out.push(-offset, offset);
  }
  return out;
}

function uniqueSortedCandidates(values: number[], anchor: number): number[] {
  const rounded = new Map<number, number>();
  for (const value of values) {
    const key = Math.round(value * 1e6) / 1e6;
    if (!rounded.has(key)) {
      rounded.set(key, value);
    }
  }
  return [...rounded.values()].sort((a, b) => {
    const distanceDelta = Math.abs(a - anchor) - Math.abs(b - anchor);
    if (Math.abs(distanceDelta) > EPS) {
      return distanceDelta;
    }
    return a - b;
  });
}

function detourLineCandidates(
  edge: Edge,
  labelNode: Node,
  segment: Segment,
  context: EdgeLabelContext
): number[] {
  if (!isFinitePositiveNumber(labelNode.width) || !isFinitePositiveNumber(labelNode.height)) {
    return [];
  }

  const labelWidth = labelNode.width;
  const labelHeight = labelNode.height;
  const anchor = segment.orientation === 'H' ? segment.a.y : segment.a.x;
  const crossHalfSize = segment.orientation === 'H' ? labelHeight / 2 : labelWidth / 2;
  const candidates = detourOffsets(crossHalfSize).map((offset) => anchor + offset);
  const addRect = (rect: Rect) => {
    if (segment.orientation === 'H') {
      candidates.push(rect.top - crossHalfSize - LABEL_GUTTER);
      candidates.push(rect.bottom + crossHalfSize + LABEL_GUTTER);
      return;
    }
    candidates.push(rect.left - crossHalfSize - LABEL_GUTTER);
    candidates.push(rect.right + crossHalfSize + LABEL_GUTTER);
  };

  for (const obstacle of queryObstacleEntries(
    context,
    detourLineQueryBounds(segment, labelNode, context.searchBounds),
    'obstacleBandQueries',
    { excludeNodeId: labelNode.id }
  )) {
    addRect(obstacle.rect);
  }
  for (const clearanceRect of markerClearanceRectsForEdge(edge, undefined, context)) {
    addRect(clearanceRect);
  }

  return uniqueSortedCandidates(candidates, anchor).slice(0, MAX_DETOUR_LINE_CANDIDATES);
}

function rerouteLineCandidates(
  segment: Segment,
  blockedRect: Rect,
  context: EdgeLabelContext,
  skipNodeIds: ReadonlySet<string>
): number[] {
  const anchor = segment.orientation === 'H' ? segment.a.y : segment.a.x;
  const candidates: number[] = [];
  for (const offset of detourOffsets(0)) {
    if (segment.orientation === 'H') {
      candidates.push(offset < 0 ? blockedRect.top + offset : blockedRect.bottom + offset);
    } else {
      candidates.push(offset < 0 ? blockedRect.left + offset : blockedRect.right + offset);
    }
  }

  const addRect = (rect: Rect) => {
    if (segment.orientation === 'H') {
      candidates.push(rect.top - LABEL_GUTTER);
      candidates.push(rect.bottom + LABEL_GUTTER);
      return;
    }
    candidates.push(rect.left - LABEL_GUTTER);
    candidates.push(rect.right + LABEL_GUTTER);
  };

  for (const obstacle of queryObstacleEntries(
    context,
    rerouteLineQueryBounds(segment, context.searchBounds),
    'obstacleBandQueries',
    { skipNodeIds }
  )) {
    addRect(obstacle.rect);
  }

  return uniqueSortedCandidates(candidates, anchor).slice(0, MAX_DETOUR_LINE_CANDIDATES);
}

function detourCenterCandidates(
  edge: Edge,
  labelNode: Node,
  segment: Segment,
  detourLineCoord: number,
  context: EdgeLabelContext
): number[] {
  if (!isFinitePositiveNumber(labelNode.width) || !isFinitePositiveNumber(labelNode.height)) {
    return [];
  }

  const labelWidth = labelNode.width;
  const labelHeight = labelNode.height;
  const detourSegment: Segment =
    segment.orientation === 'H'
      ? {
          orientation: 'H',
          a: { x: segment.a.x, y: detourLineCoord },
          b: { x: segment.b.x, y: detourLineCoord },
        }
      : {
          orientation: 'V',
          a: { x: detourLineCoord, y: segment.a.y },
          b: { x: detourLineCoord, y: segment.b.y },
        };

  const intervalData = blockedCenterIntervals(
    edge,
    labelNode,
    detourSegment,
    context,
    undefined,
    false
  );
  if (!intervalData) {
    const preferred =
      segment.orientation === 'H'
        ? (Math.min(segment.a.x, segment.b.x) + Math.max(segment.a.x, segment.b.x)) / 2
        : (Math.min(segment.a.y, segment.b.y) + Math.max(segment.a.y, segment.b.y)) / 2;
    const candidates = [preferred];
    const queryBounds = obstacleBandQueryBounds(detourSegment, labelNode);
    const addRect = (rect: Rect) => {
      if (segment.orientation === 'H') {
        candidates.push(rect.left - LABEL_GUTTER - labelWidth / 2);
        candidates.push(rect.right + LABEL_GUTTER + labelWidth / 2);
        return;
      }
      candidates.push(rect.top - LABEL_GUTTER - labelHeight / 2);
      candidates.push(rect.bottom + LABEL_GUTTER + labelHeight / 2);
    };
    if (queryBounds) {
      for (const obstacle of queryObstacleEntries(context, queryBounds, 'obstacleBandQueries', {
        excludeNodeId: labelNode.id,
      })) {
        addRect(obstacle.rect);
      }
    }
    return uniqueSortedCandidates(candidates, preferred).slice(0, MAX_DETOUR_CENTER_CANDIDATES);
  }

  const preferred =
    segment.orientation === 'H'
      ? (Math.min(segment.a.x, segment.b.x) + Math.max(segment.a.x, segment.b.x)) / 2
      : (Math.min(segment.a.y, segment.b.y) + Math.max(segment.a.y, segment.b.y)) / 2;

  return centerCandidatesFromIntervals(
    intervalData.low,
    intervalData.high,
    intervalData.blocked,
    preferred
  );
}

function detourReturnCoordinate(
  sourceLine: number,
  detourLine: number,
  labelHalfSize: number
): number {
  const direction = detourLine >= sourceLine ? 1 : -1;
  return detourLine + direction * (labelHalfSize + LABEL_CLEARANCE);
}

function buildLabelDetourPoints(
  points: Point[],
  segmentIndex: number,
  segment: Segment,
  labelNode: Node,
  centerAlong: number,
  detourLineCoord: number
): Point[] | null {
  if (!isFinitePositiveNumber(labelNode.width) || !isFinitePositiveNumber(labelNode.height)) {
    return null;
  }

  const a = points[segmentIndex];
  const b = points[segmentIndex + 1];
  if (segment.orientation === 'H') {
    const span = labelNode.width + LABEL_CLEARANCE * 2;
    const x1 = centerAlong - span / 2;
    const x2 = centerAlong + span / 2;
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    const extendsBeforeStart = x1 < minX - EPS;
    const extendsAfterEnd = x2 > maxX + EPS;
    const xDirection = b.x >= a.x ? 1 : -1;
    const segmentInset = Math.max(
      0,
      Math.min(EDGE_END_MARKER_CLEARANCE, Math.abs(b.x - a.x) / 2 - EPS)
    );
    const entryX = a.x + xDirection * segmentInset;
    const exitX = b.x - xDirection * segmentInset;
    if (!extendsBeforeStart && !extendsAfterEnd) {
      return normalizePolyline([
        ...points.slice(0, segmentIndex),
        a,
        { x: x1, y: segment.a.y },
        { x: x1, y: detourLineCoord },
        { x: x2, y: detourLineCoord },
        { x: x2, y: segment.a.y },
        b,
        ...points.slice(segmentIndex + 2),
      ]).points;
    }

    const returnY = detourReturnCoordinate(segment.a.y, detourLineCoord, labelNode.height / 2);
    const detourPoints: Point[] = [...points.slice(0, segmentIndex), a];
    if (extendsBeforeStart) {
      detourPoints.push(
        { x: entryX, y: segment.a.y },
        { x: entryX, y: returnY },
        { x: x1, y: returnY },
        { x: x1, y: detourLineCoord }
      );
    } else {
      detourPoints.push({ x: x1, y: segment.a.y }, { x: x1, y: detourLineCoord });
    }
    detourPoints.push({ x: x2, y: detourLineCoord });
    if (extendsAfterEnd) {
      detourPoints.push(
        { x: x2, y: returnY },
        { x: exitX, y: returnY },
        { x: exitX, y: segment.a.y }
      );
    } else {
      detourPoints.push({ x: x2, y: segment.a.y });
    }
    detourPoints.push(b, ...points.slice(segmentIndex + 2));
    return normalizePolyline(detourPoints).points;
  }

  const span = labelNode.height + LABEL_CLEARANCE * 2;
  const y1 = centerAlong - span / 2;
  const y2 = centerAlong + span / 2;
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  const extendsBeforeStart = y1 < minY - EPS;
  const extendsAfterEnd = y2 > maxY + EPS;
  const yDirection = b.y >= a.y ? 1 : -1;
  const segmentInset = Math.max(
    0,
    Math.min(EDGE_END_MARKER_CLEARANCE, Math.abs(b.y - a.y) / 2 - EPS)
  );
  const entryY = a.y + yDirection * segmentInset;
  const exitY = b.y - yDirection * segmentInset;
  if (!extendsBeforeStart && !extendsAfterEnd) {
    return normalizePolyline([
      ...points.slice(0, segmentIndex),
      a,
      { x: segment.a.x, y: y1 },
      { x: detourLineCoord, y: y1 },
      { x: detourLineCoord, y: y2 },
      { x: segment.a.x, y: y2 },
      b,
      ...points.slice(segmentIndex + 2),
    ]).points;
  }

  const returnX = detourReturnCoordinate(segment.a.x, detourLineCoord, labelNode.width / 2);
  const detourPoints: Point[] = [...points.slice(0, segmentIndex), a];
  if (extendsBeforeStart) {
    detourPoints.push(
      { x: segment.a.x, y: entryY },
      { x: returnX, y: entryY },
      { x: returnX, y: y1 },
      { x: detourLineCoord, y: y1 }
    );
  } else {
    detourPoints.push({ x: segment.a.x, y: y1 }, { x: detourLineCoord, y: y1 });
  }
  detourPoints.push({ x: detourLineCoord, y: y2 });
  if (extendsAfterEnd) {
    detourPoints.push(
      { x: returnX, y: y2 },
      { x: returnX, y: exitY },
      { x: segment.a.x, y: exitY }
    );
  } else {
    detourPoints.push({ x: segment.a.x, y: y2 });
  }
  detourPoints.push(b, ...points.slice(segmentIndex + 2));
  return normalizePolyline(detourPoints).points;
}

function buildExtendedLabelDetourPoints(
  points: Point[],
  segmentIndex: number,
  segment: Segment,
  labelNode: Node,
  centerAlong: number,
  detourLineCoord: number
): Point[] | null {
  if (!isFinitePositiveNumber(labelNode.width) || !isFinitePositiveNumber(labelNode.height)) {
    return null;
  }

  const a = points[segmentIndex];
  const b = points[segmentIndex + 1];
  if (segment.orientation === 'H') {
    const span = labelNode.width + LABEL_CLEARANCE * 2;
    const x1 = centerAlong - span / 2;
    const x2 = centerAlong + span / 2;
    const xDirection = b.x >= a.x ? 1 : -1;
    const segmentInset = Math.max(
      0,
      Math.min(EDGE_END_MARKER_CLEARANCE, Math.abs(b.x - a.x) / 2 - EPS)
    );
    const entryX = a.x + xDirection * segmentInset;
    const exitX = b.x - xDirection * segmentInset;
    const returnY = detourReturnCoordinate(segment.a.y, detourLineCoord, labelNode.height / 2);
    return normalizePolyline([
      ...points.slice(0, segmentIndex),
      a,
      { x: entryX, y: segment.a.y },
      { x: entryX, y: detourLineCoord },
      { x: x1, y: detourLineCoord },
      { x: x2, y: detourLineCoord },
      { x: x2, y: returnY },
      { x: exitX, y: returnY },
      { x: exitX, y: segment.a.y },
      b,
      ...points.slice(segmentIndex + 2),
    ]).points;
  }

  const span = labelNode.height + LABEL_CLEARANCE * 2;
  const y1 = centerAlong - span / 2;
  const y2 = centerAlong + span / 2;
  const yDirection = b.y >= a.y ? 1 : -1;
  const segmentInset = Math.max(
    0,
    Math.min(EDGE_END_MARKER_CLEARANCE, Math.abs(b.y - a.y) / 2 - EPS)
  );
  const entryY = a.y + yDirection * segmentInset;
  const exitY = b.y - yDirection * segmentInset;
  const returnX = detourReturnCoordinate(segment.a.x, detourLineCoord, labelNode.width / 2);
  return normalizePolyline([
    ...points.slice(0, segmentIndex),
    a,
    { x: segment.a.x, y: entryY },
    { x: detourLineCoord, y: entryY },
    { x: detourLineCoord, y: y1 },
    { x: detourLineCoord, y: y2 },
    { x: returnX, y: y2 },
    { x: returnX, y: exitY },
    { x: segment.a.x, y: exitY },
    b,
    ...points.slice(segmentIndex + 2),
  ]).points;
}

function externalDetourCenterCandidates(segment: Segment, labelNode: Node): number[] {
  if (!isFinitePositiveNumber(labelNode.width) || !isFinitePositiveNumber(labelNode.height)) {
    return [];
  }

  if (segment.orientation === 'H') {
    const minX = Math.min(segment.a.x, segment.b.x);
    const maxX = Math.max(segment.a.x, segment.b.x);
    return [minX - labelNode.width / 2 - LABEL_GUTTER, maxX + labelNode.width / 2 + LABEL_GUTTER];
  }

  const minY = Math.min(segment.a.y, segment.b.y);
  const maxY = Math.max(segment.a.y, segment.b.y);
  return [minY - labelNode.height / 2 - LABEL_GUTTER, maxY + labelNode.height / 2 + LABEL_GUTTER];
}

interface BlockedIntersectionScore {
  count: number;
  length: number;
}

function blockedIntersectionScore(points: readonly Point[], rect: Rect): BlockedIntersectionScore {
  let count = 0;
  let length = 0;
  for (const segment of normalizePolyline([...points]).segments) {
    if (!segmentIntersectsRectInterior(segment.a, segment.b, rect)) {
      continue;
    }
    count++;
    if (segment.orientation === 'H') {
      length += Math.max(
        0,
        Math.min(Math.max(segment.a.x, segment.b.x), rect.right) -
          Math.max(Math.min(segment.a.x, segment.b.x), rect.left)
      );
    } else if (segment.orientation === 'V') {
      length += Math.max(
        0,
        Math.min(Math.max(segment.a.y, segment.b.y), rect.bottom) -
          Math.max(Math.min(segment.a.y, segment.b.y), rect.top)
      );
    }
  }
  return { count, length };
}

function reducesBlockedIntersections(
  candidate: readonly Point[],
  blockedRect: Rect,
  baseline: BlockedIntersectionScore
): boolean {
  const score = blockedIntersectionScore(candidate, blockedRect);
  return (
    score.count < baseline.count ||
    (score.count === baseline.count && score.length < baseline.length - EPS)
  );
}

function rerouteSegmentAroundRect(
  edge: Edge,
  points: Point[],
  segmentIndex: number,
  blockedRect: Rect,
  context: EdgeLabelContext,
  placedLabelsByEdgeId: Map<string, PlacedLabel>
): Point[] | null {
  const normalized = normalizePolyline(points);
  const baselineScore = blockedIntersectionScore(normalized.points, blockedRect);
  const segment = normalized.segments[segmentIndex];
  if (!segment || segment.orientation === 'Z') {
    return null;
  }

  const a = normalized.points[segmentIndex];
  const b = normalized.points[segmentIndex + 1];
  const ownLabelNodeId = placedLabelsByEdgeId.get(edge.id)?.nodeId;
  const skipNodeIds = new Set<string>();
  if (ownLabelNodeId) {
    skipNodeIds.add(ownLabelNodeId);
  }

  // One detour may remove only the first intersection with a wide label. Accept strictly
  // monotonic progress here; the bounded outer loop completes the reroute segment by segment.
  if (segment.orientation === 'H') {
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    const entry = Math.max(minX, blockedRect.left - LABEL_CLEARANCE);
    const exit = Math.min(maxX, blockedRect.right + LABEL_CLEARANCE);
    if (exit - entry <= EPS) {
      incrementMetric(context.metrics, 'rerouteRejectedDegenerateSpan');
      return null;
    }

    for (const y of rerouteLineCandidates(segment, blockedRect, context, skipNodeIds)) {
      incrementMetric(context.metrics, 'rerouteCandidatesEvaluated');
      const candidatePoints = normalizePolyline([
        ...normalized.points.slice(0, segmentIndex),
        a,
        { x: entry, y: segment.a.y },
        { x: entry, y },
        { x: exit, y },
        { x: exit, y: segment.a.y },
        b,
        ...normalized.points.slice(segmentIndex + 2),
      ]).points;
      if (
        polylineIntersectsRect(candidatePoints, blockedRect) &&
        !reducesBlockedIntersections(candidatePoints, blockedRect, baselineScore)
      ) {
        incrementMetric(context.metrics, 'rerouteRejectedBlockedRect');
        continue;
      }
      if (polylineIntersectsRect(candidatePoints, blockedRect)) {
        incrementMetric(context.metrics, 'reroutePartialProgressCandidates');
      }
      if (polylineHitsProtectedObstacles(candidatePoints, context, skipNodeIds)) {
        incrementMetric(context.metrics, 'rerouteRejectedProtectedObstacle');
        continue;
      }
      if (!labelStillAnchored(edge.id, candidatePoints, placedLabelsByEdgeId)) {
        incrementMetric(context.metrics, 'rerouteRejectedLabelAnchor');
        continue;
      }
      return candidatePoints;
    }
    return null;
  }

  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  const entry = Math.max(minY, blockedRect.top - LABEL_CLEARANCE);
  const exit = Math.min(maxY, blockedRect.bottom + LABEL_CLEARANCE);
  if (exit - entry <= EPS) {
    incrementMetric(context.metrics, 'rerouteRejectedDegenerateSpan');
    return null;
  }

  for (const x of rerouteLineCandidates(segment, blockedRect, context, skipNodeIds)) {
    incrementMetric(context.metrics, 'rerouteCandidatesEvaluated');
    const candidatePoints = normalizePolyline([
      ...normalized.points.slice(0, segmentIndex),
      a,
      { x: segment.a.x, y: entry },
      { x, y: entry },
      { x, y: exit },
      { x: segment.a.x, y: exit },
      b,
      ...normalized.points.slice(segmentIndex + 2),
    ]).points;
    if (
      polylineIntersectsRect(candidatePoints, blockedRect) &&
      !reducesBlockedIntersections(candidatePoints, blockedRect, baselineScore)
    ) {
      incrementMetric(context.metrics, 'rerouteRejectedBlockedRect');
      continue;
    }
    if (polylineIntersectsRect(candidatePoints, blockedRect)) {
      incrementMetric(context.metrics, 'reroutePartialProgressCandidates');
    }
    if (polylineHitsProtectedObstacles(candidatePoints, context, skipNodeIds)) {
      incrementMetric(context.metrics, 'rerouteRejectedProtectedObstacle');
      continue;
    }
    if (!labelStillAnchored(edge.id, candidatePoints, placedLabelsByEdgeId)) {
      incrementMetric(context.metrics, 'rerouteRejectedLabelAnchor');
      continue;
    }
    return candidatePoints;
  }

  return null;
}

function rerouteForeignEdgeAroundRect(
  edge: Edge,
  blockedRect: Rect,
  context: EdgeLabelContext,
  placedLabelsByEdgeId: Map<string, PlacedLabel>,
  overrides: EdgePointOverrides
): Point[] | null {
  let currentPoints = pointsForEdge(edge, overrides, context);
  for (let attempt = 0; attempt < 8; attempt++) {
    if (!polylineIntersectsRect(currentPoints, blockedRect)) {
      return currentPoints;
    }

    const normalized = normalizePolyline(currentPoints);
    const segmentIndex = normalized.points.findIndex((point, index) => {
      if (index === normalized.points.length - 1) {
        return false;
      }
      return segmentIntersectsRectInterior(point, normalized.points[index + 1], blockedRect);
    });
    if (segmentIndex < 0) {
      return currentPoints;
    }

    const rerouted = rerouteSegmentAroundRect(
      edge,
      normalized.points,
      segmentIndex,
      blockedRect,
      context,
      placedLabelsByEdgeId
    );
    if (!rerouted) {
      return null;
    }
    currentPoints = rerouted;
  }

  return polylineIntersectsRect(currentPoints, blockedRect) ? null : currentPoints;
}

function rerouteForeignEdgeAroundLabels(
  edge: Edge,
  reservations: readonly PlacedLabel[],
  context: EdgeLabelContext,
  placedLabelsByEdgeId: Map<string, PlacedLabel>,
  overrides: EdgePointOverrides
): Point[] | null {
  const initialPoints = pointsForEdge(edge, overrides, context);
  let currentPoints = initialPoints;
  // A detour around a later label can re-enter an earlier reservation, so make one deterministic
  // repair pass and one convergence pass before abandoning the edge-level recovery.
  for (let pass = 0; pass < 2; pass++) {
    let changed = false;
    for (const reservation of reservations) {
      if (!polylineIntersectsRect(currentPoints, reservation.rect)) {
        continue;
      }
      incrementMetric(context.metrics, 'individualLabelRerouteAttempts');
      overrides.set(edge.id, currentPoints);
      const rerouted = rerouteForeignEdgeAroundRect(
        edge,
        reservation.rect,
        context,
        placedLabelsByEdgeId,
        overrides
      );
      if (!rerouted) {
        overrides.set(edge.id, initialPoints);
        return null;
      }
      incrementMetric(context.metrics, 'individualLabelRerouteSuccesses');
      currentPoints = rerouted;
      changed = true;
    }
    if (
      reservations.every((reservation) => !polylineIntersectsRect(currentPoints, reservation.rect))
    ) {
      return currentPoints;
    }
    if (!changed) {
      break;
    }
  }
  overrides.set(edge.id, initialPoints);
  return null;
}

function labelPlacementWithExtendedDetour(
  edge: Edge,
  labelNode: Node,
  segmentCandidate: SegmentCandidate,
  context: EdgeLabelContext,
  placedLabelsByEdgeId: Map<string, PlacedLabel>
): Point | null {
  if (!isFinitePositiveNumber(labelNode.width) || !isFinitePositiveNumber(labelNode.height)) {
    return null;
  }

  const basePoints = pointsForEdge(edge, undefined, context);
  const segment = segmentCandidate.segment;

  for (const detourLineCoord of detourLineCandidates(edge, labelNode, segment, context)) {
    const centerCandidates = uniqueSortedCandidates(
      externalDetourCenterCandidates(segment, labelNode),
      segment.orientation === 'H'
        ? (Math.min(segment.a.x, segment.b.x) + Math.max(segment.a.x, segment.b.x)) / 2
        : (Math.min(segment.a.y, segment.b.y) + Math.max(segment.a.y, segment.b.y)) / 2
    );

    for (const centerAlong of centerCandidates) {
      const candidatePoints = buildExtendedLabelDetourPoints(
        basePoints,
        segmentCandidate.segmentIndex,
        segment,
        labelNode,
        centerAlong,
        detourLineCoord
      );
      if (!candidatePoints) {
        continue;
      }

      if (polylineHitsProtectedObstacles(candidatePoints, context, new Set([labelNode.id]))) {
        continue;
      }

      const center =
        segment.orientation === 'H'
          ? { x: centerAlong, y: detourLineCoord }
          : { x: detourLineCoord, y: centerAlong };
      const rect = labelRectAt(labelNode, center);
      const overrides: EdgePointOverrides = new Map([[edge.id, candidatePoints]]);

      const foreignEdges = foreignEdgeIdsIntersectingRect(context, rect, edge.id, overrides)
        .map((edgeId) => context.edgeById.get(edgeId))
        .filter((foreignEdge): foreignEdge is Edge => foreignEdge !== undefined);

      let ok = true;
      for (const foreignEdge of foreignEdges) {
        const reroutedPoints = rerouteForeignEdgeAroundRect(
          foreignEdge,
          rect,
          context,
          placedLabelsByEdgeId,
          overrides
        );
        if (!reroutedPoints) {
          ok = false;
          break;
        }
        overrides.set(foreignEdge.id, reroutedPoints);
      }

      if (!ok) {
        continue;
      }
      if (!rectSafeForLabel(rect, edge, labelNode.id, context, overrides)) {
        continue;
      }

      setEdgePoints(context, edge, candidatePoints);
      for (const [edgeId, points] of overrides) {
        if (edgeId === edge.id) {
          continue;
        }
        const foreignEdge = context.edgeById.get(edgeId);
        if (foreignEdge) {
          setEdgePoints(context, foreignEdge, points);
        }
      }
      return center;
    }
  }

  return null;
}

function labelPlacementWithDetour(
  edge: Edge,
  labelNode: Node,
  segmentCandidate: SegmentCandidate,
  context: EdgeLabelContext,
  placedLabelsByEdgeId: Map<string, PlacedLabel>
): Point | null {
  if (!isFinitePositiveNumber(labelNode.width) || !isFinitePositiveNumber(labelNode.height)) {
    return null;
  }

  const basePoints = pointsForEdge(edge, undefined, context);
  const segment = segmentCandidate.segment;

  for (const detourLineCoord of detourLineCandidates(edge, labelNode, segment, context)) {
    const centerCandidates = detourCenterCandidates(
      edge,
      labelNode,
      segment,
      detourLineCoord,
      context
    );
    for (const centerAlong of centerCandidates) {
      const candidatePoints = buildLabelDetourPoints(
        basePoints,
        segmentCandidate.segmentIndex,
        segment,
        labelNode,
        centerAlong,
        detourLineCoord
      );
      if (!candidatePoints) {
        continue;
      }

      if (polylineHitsProtectedObstacles(candidatePoints, context, new Set([labelNode.id]))) {
        continue;
      }

      const center =
        segment.orientation === 'H'
          ? { x: centerAlong, y: detourLineCoord }
          : { x: detourLineCoord, y: centerAlong };
      const rect = labelRectAt(labelNode, center);
      const overrides: EdgePointOverrides = new Map([[edge.id, candidatePoints]]);

      const foreignEdges = foreignEdgeIdsIntersectingRect(context, rect, edge.id, overrides)
        .map((edgeId) => context.edgeById.get(edgeId))
        .filter((foreignEdge): foreignEdge is Edge => foreignEdge !== undefined);

      let ok = true;
      for (const foreignEdge of foreignEdges) {
        const reroutedPoints = rerouteForeignEdgeAroundRect(
          foreignEdge,
          rect,
          context,
          placedLabelsByEdgeId,
          overrides
        );
        if (!reroutedPoints) {
          ok = false;
          break;
        }
        overrides.set(foreignEdge.id, reroutedPoints);
      }

      if (!ok) {
        continue;
      }
      if (!rectSafeForLabel(rect, edge, labelNode.id, context, overrides)) {
        continue;
      }

      setEdgePoints(context, edge, candidatePoints);
      for (const [edgeId, points] of overrides) {
        if (edgeId === edge.id) {
          continue;
        }
        const foreignEdge = context.edgeById.get(edgeId);
        if (foreignEdge) {
          setEdgePoints(context, foreignEdge, points);
        }
      }
      return center;
    }
  }

  return null;
}

function isPreparedLabelNode(node: Node | undefined): node is NonClusterNode {
  return Boolean(node && isEdgeLabelNode(node));
}

function preferredGridLabelNodeId(edge: Edge): string {
  return `${GRID_LABEL_PREFIX}${edge.start ?? ''}-${edge.end ?? ''}-${edge.id}`;
}

function ensureUniqueGridLabelNodeId(edge: Edge, nodeById: Map<string, Node>): string {
  const baseId = edge.labelNodeId ?? preferredGridLabelNodeId(edge);
  let candidateId = baseId;
  let suffix = 1;
  while (true) {
    if (!nodeById.has(candidateId)) {
      return candidateId;
    }
    candidateId = `${baseId}-${suffix}`;
    suffix += 1;
  }
}

export function prepareGridLayout(data: LayoutData): void {
  const nodeById = new Map<string, Node>();
  for (const node of data.nodes) {
    nodeById.set(node.id, node);
  }

  const newNodes: NonClusterNode[] = [];
  for (const edge of data.edges) {
    if (!edge.label || edge.label.length === 0) {
      continue;
    }

    const sourceNode = edge.start ? nodeById.get(edge.start) : undefined;
    const existingHelper = edge.labelNodeId ? nodeById.get(edge.labelNodeId) : undefined;
    if (isPreparedLabelNode(existingHelper)) {
      existingHelper.label = edge.label;
      existingHelper.labelStyle = Array.isArray(edge.labelStyle)
        ? edge.labelStyle[0]
        : (edge.labelStyle ?? '');
      existingHelper.edgeStart = edge.start ?? '';
      existingHelper.edgeEnd = edge.end ?? '';
      if (sourceNode?.dir) {
        existingHelper.dir = sourceNode.dir;
      }
      edge.label = undefined;
      (edge as Edge & { text?: string }).text = undefined;
      continue;
    }

    const labelNodeId = ensureUniqueGridLabelNodeId(edge, nodeById);
    const labelNode: NonClusterNode = {
      id: labelNodeId,
      label: edge.label,
      edgeStart: edge.start ?? '',
      edgeEnd: edge.end ?? '',
      shape: 'labelRect',
      width: 0,
      height: 0,
      isEdgeLabel: true,
      isDummy: true,
      isGroup: false,
      parentId: undefined,
      labelStyle: Array.isArray(edge.labelStyle) ? edge.labelStyle[0] : (edge.labelStyle ?? ''),
      ...(sourceNode?.dir ? { dir: sourceNode.dir } : {}),
    };
    newNodes.push(labelNode);
    nodeById.set(labelNodeId, labelNode);
    edge.labelNodeId = labelNodeId;
    edge.label = undefined;
    (edge as Edge & { text?: string }).text = undefined;
  }

  data.nodes.push(...newNodes);
}

export function positionGridEdgeLabels(
  data: LayoutData,
  instrumentation?: GridEdgeLabelInstrumentation,
  routingInstrumentation?: GridRoutingInstrumentation
): void {
  const nodeById = new Map<string, Node>();
  for (const node of data.nodes) {
    nodeById.set(node.id, node);
  }

  const labelledEdges = data.edges
    .map((edge, sourceIndex) => {
      if (!edge.labelNodeId || !edge.points) {
        return null;
      }
      const labelNode = nodeById.get(edge.labelNodeId);
      if (
        !labelNode ||
        !isFinitePositiveNumber(labelNode.width) ||
        !isFinitePositiveNumber(labelNode.height)
      ) {
        return null;
      }
      return { edge, labelNode, sourceIndex };
    })
    .filter((entry): entry is LabelWorkItem => entry !== null);

  if (labelledEdges.length === 0) {
    return;
  }
  instrumentation ??= createGridEdgeLabelInstrumentation();

  const baseEdgePoints = new Map<string, Point[] | undefined>(
    data.edges.map((edge) => [edge.id, edge.points?.map((point) => ({ ...point }))])
  );
  const baseLabelPositions = new Map<string, { x?: number; y?: number }>(
    labelledEdges.map(({ labelNode }) => [labelNode.id, { x: labelNode.x, y: labelNode.y }])
  );

  const restoreBaseState = (): void => {
    for (const edge of data.edges) {
      const points = baseEdgePoints.get(edge.id);
      if (points) {
        edge.points = points.map((point) => ({ ...point }));
      } else {
        delete edge.points;
      }
    }
    for (const { labelNode } of labelledEdges) {
      const position = baseLabelPositions.get(labelNode.id);
      if (position && Number.isFinite(position.x) && Number.isFinite(position.y)) {
        labelNode.x = position.x;
        labelNode.y = position.y;
      } else {
        delete labelNode.x;
        delete labelNode.y;
      }
    }
  };

  const workItems = [...labelledEdges].sort(
    (a, b) => a.sourceIndex - b.sourceIndex || a.edge.id.localeCompare(b.edge.id)
  );
  let lastError: unknown;
  for (let pass = 1; pass <= 2; pass++) {
    incrementMetric(instrumentation, 'labelPasses');
    const context = createEdgeLabelContext(data, instrumentation);
    const placedLabelsByEdgeId = new Map<string, PlacedLabel>();
    const allowedOverlapsByLabelEdgeId = new Map<string, Set<string>>();
    const passStartPoints = new Map(
      data.edges.map((edge) => [edge.id, pointsForEdge(edge, undefined, context).map(clonePoint)])
    );
    const proposedOwnerRoutes = new Map<string, Point[]>();
    try {
      for (const { edge, labelNode } of workItems) {
        const segments = [...candidateSegments(edge, context)].sort((a, b) => {
          const lengthDelta = segmentLength(b.segment) - segmentLength(a.segment);
          if (Math.abs(lengthDelta) > EPS) {
            return lengthDelta;
          }
          return a.order - b.order;
        });

        let labelCenter: Point | null = null;
        for (const segmentCandidate of segments) {
          labelCenter = placementOnExistingSegment(
            edge,
            labelNode,
            segmentCandidate.segment,
            context
          );
          if (labelCenter) {
            break;
          }
        }

        if (!labelCenter) {
          for (const segmentCandidate of segments) {
            labelCenter = placementOnExistingSegmentWithReroutes(
              edge,
              labelNode,
              segmentCandidate.segment,
              context,
              placedLabelsByEdgeId
            );
            if (labelCenter) {
              break;
            }
          }
        }

        if (pass === 2 && !labelCenter) {
          for (const segmentCandidate of segments) {
            labelCenter = labelPlacementWithDetour(
              edge,
              labelNode,
              segmentCandidate,
              context,
              placedLabelsByEdgeId
            );
            if (labelCenter) {
              break;
            }
          }
        }

        if (pass === 2 && !labelCenter) {
          for (const segmentCandidate of segments) {
            labelCenter = labelPlacementWithExtendedDetour(
              edge,
              labelNode,
              segmentCandidate,
              context,
              placedLabelsByEdgeId
            );
            if (labelCenter) {
              break;
            }
          }
        }

        if (!labelCenter) {
          throw gridError('GRID_ROUTE_NOT_FOUND', `Could not place label for edge "${edge.id}"`, {
            edgeId: edge.id,
            labelNodeId: labelNode.id,
            labelWidth: labelNode.width,
            labelHeight: labelNode.height,
            pointCount: edge.points?.length ?? 0,
            points: edge.points?.map((point) => ({ ...point })) ?? [],
            segments: segments.map(({ segment }) => ({
              orientation: segment.orientation,
              length: segmentLength(segment),
              a: { ...segment.a },
              b: { ...segment.b },
            })),
          });
        }

        labelNode.x = labelCenter.x;
        labelNode.y = labelCenter.y;
        const placedLabel: PlacedLabel = {
          edgeId: edge.id,
          nodeId: labelNode.id,
          center: labelCenter,
          rect: labelRectAt(labelNode, labelCenter),
        };
        placedLabelsByEdgeId.set(edge.id, placedLabel);
        upsertPlacedLabelObstacle(context, placedLabel);
      }

      const frozenLabels = [...placedLabelsByEdgeId.values()];
      incrementMetric(instrumentation, 'frozenReservations', frozenLabels.length);
      if (routingInstrumentation) {
        routingInstrumentation.labelOverlayBuilds++;
        routingInstrumentation.labelOverlayVertices += frozenLabels.length * 4;
      }

      // The placement search is provisional: capture its route proposals, roll
      // the routes back to the pass boundary, and only then commit each
      // impacted edge once against the complete frozen reservation set.
      for (const edge of data.edges) {
        const passStart = passStartPoints.get(edge.id) ?? [];
        const proposed = pointsForEdge(edge, undefined, context);
        if (JSON.stringify(proposed) !== JSON.stringify(passStart)) {
          proposedOwnerRoutes.set(edge.id, proposed.map(clonePoint));
        }
        setEdgePoints(context, edge, passStart.map(clonePoint));
      }
      for (const [edgeId, points] of proposedOwnerRoutes) {
        if (!placedLabelsByEdgeId.has(edgeId)) {
          continue;
        }
        const owner = context.edgeById.get(edgeId);
        if (owner) {
          setEdgePoints(context, owner, points);
        }
      }

      const impacted = new Set<string>(proposedOwnerRoutes.keys());
      for (const edge of data.edges) {
        const ownLabel = placedLabelsByEdgeId.get(edge.id);
        const points = pointsForEdge(edge, undefined, context);
        for (const reservation of frozenLabels) {
          if (reservation.edgeId !== edge.id && polylineIntersectsRect(points, reservation.rect)) {
            impacted.add(edge.id);
          }
        }
        if (ownLabel && !labelStillAnchored(edge.id, points, placedLabelsByEdgeId)) {
          impacted.add(edge.id);
        }
      }

      let rerouteOrdinal = 0;
      for (const edge of data.edges) {
        if (!impacted.has(edge.id)) {
          continue;
        }
        let points = pointsForEdge(edge, undefined, context);
        const overrides: EdgePointOverrides = new Map([[edge.id, points]]);
        const blockingReservations = frozenLabels.filter(
          (reservation) =>
            reservation.edgeId !== edge.id && polylineIntersectsRect(points, reservation.rect)
        );
        if (blockingReservations.length > 0) {
          const combinedRect = blockingReservations.slice(1).reduce<Rect>(
            (combined, reservation) => ({
              cx:
                (Math.min(combined.left, reservation.rect.left) +
                  Math.max(combined.right, reservation.rect.right)) /
                2,
              cy:
                (Math.min(combined.top, reservation.rect.top) +
                  Math.max(combined.bottom, reservation.rect.bottom)) /
                2,
              left: Math.min(combined.left, reservation.rect.left),
              right: Math.max(combined.right, reservation.rect.right),
              top: Math.min(combined.top, reservation.rect.top),
              bottom: Math.max(combined.bottom, reservation.rect.bottom),
            }),
            { ...blockingReservations[0].rect }
          );
          // Leave one full separation lane beyond the 6 px label clearance;
          // successive impacted routes receive distinct deterministic lanes.
          const lanePadding = (rerouteOrdinal + 2) * 12;
          const blockedRect: Rect = {
            cx: combinedRect.cx,
            cy: combinedRect.cy,
            left: combinedRect.left - lanePadding,
            right: combinedRect.right + lanePadding,
            top: combinedRect.top - lanePadding,
            bottom: combinedRect.bottom + lanePadding,
          };
          let rerouted = rerouteForeignEdgeAroundRect(
            edge,
            blockedRect,
            context,
            placedLabelsByEdgeId,
            overrides
          );
          rerouted ??= rerouteForeignEdgeAroundLabels(
            edge,
            blockingReservations,
            context,
            placedLabelsByEdgeId,
            overrides
          );
          if (rerouted) {
            points = rerouted;
            overrides.set(edge.id, points);
          } else {
            // Preserving a valid edge and anchored labels is safer than failing the whole layout.
            // Record the unavoidable overlap so final validation permits only this edge-label pair.
            incrementMetric(instrumentation, 'labelOverlapFallbacks');
            for (const reservation of blockingReservations) {
              if (!polylineIntersectsRect(points, reservation.rect)) {
                continue;
              }
              const allowedEdges =
                allowedOverlapsByLabelEdgeId.get(reservation.edgeId) ?? new Set<string>();
              if (!allowedEdges.has(edge.id)) {
                incrementMetric(instrumentation, 'labelOverlapReservations');
              }
              allowedEdges.add(edge.id);
              allowedOverlapsByLabelEdgeId.set(reservation.edgeId, allowedEdges);
            }
          }
        }
        if (!labelStillAnchored(edge.id, points, placedLabelsByEdgeId)) {
          throw gridError('GRID_ROUTE_NOT_FOUND', `Label anchor was lost for edge "${edge.id}"`, {
            edgeId: edge.id,
            pass,
          });
        }
        if (placedLabelsByEdgeId.has(edge.id)) {
          incrementMetric(instrumentation, 'preservedAnchors');
        }
        setEdgePoints(context, edge, points);
        incrementMetric(instrumentation, 'impactedEdgeReroutes');
        rerouteOrdinal++;
      }
      if (impacted.size > 0 && instrumentation) {
        instrumentation.maxReroutesPerEdgePerPass = Math.max(
          instrumentation.maxReroutesPerEdgePerPass,
          1
        );
      }

      for (const { edge, labelNode } of workItems) {
        const reservation = placedLabelsByEdgeId.get(edge.id);
        if (
          !reservation ||
          !labelStillAnchored(
            edge.id,
            pointsForEdge(edge, undefined, context),
            placedLabelsByEdgeId
          ) ||
          !rectSafeForLabel(
            reservation.rect,
            edge,
            labelNode.id,
            context,
            undefined,
            allowedOverlapsByLabelEdgeId.get(edge.id)
          )
        ) {
          throw gridError('GRID_ROUTE_NOT_FOUND', `Label pass ${pass} did not validate`, {
            edgeId: edge.id,
            pass,
          });
        }
      }
      return;
    } catch (error) {
      lastError = error;
      // Pass 2 begins from any valid route work produced by pass 1, while
      // provisional labels are cleared and rebuilt deterministically.
      for (const { labelNode } of workItems) {
        delete labelNode.x;
        delete labelNode.y;
      }
    }
  }

  restoreBaseState();
  incrementMetric(instrumentation, 'rollbacks');
  if (lastError instanceof Error) {
    throw lastError;
  }
  throw gridError('GRID_ROUTE_NOT_FOUND', 'Could not place one or more grid edge labels');
}
