const EPS = 1e-3;

export interface Point {
  x: number;
  y: number;
}

export type RectSide = 'top' | 'bottom' | 'left' | 'right';

export interface RectBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface RectEntry {
  id: string;
  rect: RectBounds;
}

export interface NodeBoundsInfo extends RectEntry {
  cx: number;
  cy: number;
}

export interface NodePairGeometry {
  srcId: string;
  dstId: string;
  srcInfo: NodeBoundsInfo;
  dstInfo: NodeBoundsInfo;
  collinearX: boolean;
  collinearY: boolean;
}

export interface LayoutNodeRect extends RectBounds {
  nodeId: string;
}

export interface ThreeSegmentRoute {
  kind: 'HVH' | 'VHV';
  p0: Point;
  p1: Point;
  p2: Point;
  p3: Point;
}

export interface OrthogonalSegment {
  index: number;
  a: Point;
  b: Point;
  horizontal: boolean;
  vertical: boolean;
}

interface EdgeSegmentInput {
  points?: Point[];
  isLayoutOnly?: boolean;
}

interface NodeBoundsInput {
  id?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  isGroup?: boolean;
  isEdgeLabel?: boolean;
}

interface RectNodeInput {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface EdgeEndpointInput {
  start?: string;
  end?: string;
}

interface SimplifyPassResult {
  points: Point[];
  changed: boolean;
}

function measuredNodeRect(node: RectNodeInput) {
  const cx = node.x ?? 0;
  const cy = node.y ?? 0;
  const width = node.width ?? 0;
  const height = node.height ?? 0;
  return width > 0 && height > 0
    ? { cx, cy, rect: rectFromCenterSize(cx, cy, width, height) }
    : undefined;
}

function nodeBoundsInfoFor(node: NodeBoundsInput): NodeBoundsInfo | undefined {
  if (node.isGroup) {
    return undefined;
  }
  const measured = measuredNodeRect(node);
  if (!measured) {
    return undefined;
  }
  const id = String(node.id ?? '');
  return {
    id,
    cx: measured.cx,
    cy: measured.cy,
    rect: measured.rect,
  };
}

export function samePoint(a: Point, b: Point, epsilon = EPS): boolean {
  return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon;
}

export function sameX(a: Point, b: Point, epsilon = EPS): boolean {
  return Math.abs(a.x - b.x) < epsilon;
}

export function sameY(a: Point, b: Point, epsilon = EPS): boolean {
  return Math.abs(a.y - b.y) < epsilon;
}

export function isHorizontalSegment(a: Point, b: Point, epsilon = EPS): boolean {
  return sameY(a, b, epsilon) && Math.abs(a.x - b.x) > epsilon;
}

export function isVerticalSegment(a: Point, b: Point, epsilon = EPS): boolean {
  return sameX(a, b, epsilon) && Math.abs(a.y - b.y) > epsilon;
}

export function overlapLength(a1: number, a2: number, b1: number, b2: number): number {
  return Math.max(
    0,
    Math.min(Math.max(a1, a2), Math.max(b1, b2)) - Math.max(Math.min(a1, a2), Math.min(b1, b2))
  );
}

export function sameAxisSegmentOverlapLength(
  a: OrthogonalSegment,
  b: OrthogonalSegment,
  epsilon = EPS
): number {
  if (a.horizontal && b.horizontal && sameY(a.a, b.a, epsilon)) {
    return overlapLength(a.a.x, a.b.x, b.a.x, b.b.x);
  }
  if (a.vertical && b.vertical && sameX(a.a, b.a, epsilon)) {
    return overlapLength(a.a.y, a.b.y, b.a.y, b.b.y);
  }
  return 0;
}

export function orthogonalSegmentsForPoints(points: Point[], epsilon = EPS): OrthogonalSegment[] {
  const result: OrthogonalSegment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const horizontal = isHorizontalSegment(a, b, epsilon);
    const vertical = isVerticalSegment(a, b, epsilon);
    if (horizontal || vertical) {
      result.push({ index: i, a, b, horizontal, vertical });
    }
  }
  return result;
}

export function countOrthogonalBends(points: Point[], epsilon = EPS): number {
  const segments = orthogonalSegmentsForPoints(points, epsilon);
  let bends = 0;
  for (let i = 1; i < segments.length; i++) {
    if (segments[i - 1].horizontal !== segments[i].horizontal) {
      bends++;
    }
  }
  return bends;
}

export function dedupeConsecutivePoints(points: Point[], epsilon = EPS): Point[] {
  const result: Point[] = [];
  for (const point of points) {
    const last = result.length > 0 ? result[result.length - 1] : undefined;
    if (!last || !samePoint(last, point, epsilon)) {
      result.push({ x: point.x, y: point.y });
    }
  }
  return result;
}

export function classifyThreeSegmentRoute(
  points: Point[] | undefined,
  epsilon = EPS
): ThreeSegmentRoute | undefined {
  if (!points || points.length !== 4) {
    return undefined;
  }
  const [p0, p1, p2, p3] = points;
  const isHVH =
    isHorizontalSegment(p0, p1, epsilon) &&
    isVerticalSegment(p1, p2, epsilon) &&
    isHorizontalSegment(p2, p3, epsilon);
  if (isHVH) {
    return { kind: 'HVH', p0, p1, p2, p3 };
  }
  const isVHV =
    isVerticalSegment(p0, p1, epsilon) &&
    isHorizontalSegment(p1, p2, epsilon) &&
    isVerticalSegment(p2, p3, epsilon);
  return isVHV ? { kind: 'VHV', p0, p1, p2, p3 } : undefined;
}

export function segmentBoundsOverlapRect(
  a: Point,
  b: Point,
  rect: RectBounds,
  buffer = 0
): boolean {
  const segMinX = Math.min(a.x, b.x);
  const segMaxX = Math.max(a.x, b.x);
  const segMinY = Math.min(a.y, b.y);
  const segMaxY = Math.max(a.y, b.y);
  return (
    segMaxX > rect.left - buffer &&
    segMinX < rect.right + buffer &&
    segMaxY > rect.top - buffer &&
    segMinY < rect.bottom + buffer
  );
}

export function pointInsideRect(point: Point, rect: RectBounds, buffer = 0): boolean {
  return (
    point.x > rect.left + buffer &&
    point.x < rect.right - buffer &&
    point.y > rect.top + buffer &&
    point.y < rect.bottom - buffer
  );
}

export function rectContainsRect(outer: RectBounds, inner: RectBounds): boolean {
  return (
    outer.left <= inner.left &&
    outer.right >= inner.right &&
    outer.top <= inner.top &&
    outer.bottom >= inner.bottom
  );
}

export function rectsOverlap(a: RectBounds, b: RectBounds): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

export function inflateRect(rect: RectBounds, margin: number): RectBounds {
  return {
    left: rect.left - margin,
    right: rect.right + margin,
    top: rect.top - margin,
    bottom: rect.bottom + margin,
  };
}

export function rectFromCenterSize(
  cx: number,
  cy: number,
  width: number,
  height: number
): RectBounds {
  return {
    left: cx - width / 2,
    right: cx + width / 2,
    top: cy - height / 2,
    bottom: cy + height / 2,
  };
}

export function rectOfNodeBounds(node: RectNodeInput): RectBounds | undefined {
  return measuredNodeRect(node)?.rect;
}

export function portForRectSide(
  node: { cx: number; cy: number; rect: RectBounds },
  side: RectSide
): Point {
  switch (side) {
    case 'top':
      return { x: node.cx, y: node.rect.top };
    case 'bottom':
      return { x: node.cx, y: node.rect.bottom };
    case 'left':
      return { x: node.rect.left, y: node.cy };
    case 'right':
      return { x: node.rect.right, y: node.cy };
  }
}

export function buildOrthogonalPortPath(
  src: Point,
  srcSide: RectSide,
  dst: Point,
  dstSide: RectSide,
  anchor: number,
  epsilon = EPS
): Point[] | undefined {
  const srcH = srcSide === 'left' || srcSide === 'right';
  const dstH = dstSide === 'left' || dstSide === 'right';

  if (srcH && dstH) {
    const opposingDir =
      (srcSide === 'right' && dstSide === 'left' && src.x < dst.x) ||
      (srcSide === 'left' && dstSide === 'right' && src.x > dst.x);
    if (opposingDir) {
      if (sameY(src, dst, epsilon)) {
        return [src, dst];
      }
      const midX = (src.x + dst.x) / 2;
      return [src, { x: midX, y: src.y }, { x: midX, y: dst.y }, dst];
    }
    if (srcSide === dstSide) {
      if (sameY(src, dst, epsilon)) {
        return undefined;
      }
      const intX =
        srcSide === 'left' ? Math.min(src.x, dst.x) - anchor : Math.max(src.x, dst.x) + anchor;
      return [src, { x: intX, y: src.y }, { x: intX, y: dst.y }, dst];
    }
    return undefined;
  }

  if (!srcH && !dstH) {
    if (srcSide === dstSide) {
      if (sameX(src, dst, epsilon)) {
        return undefined;
      }
      const intY =
        srcSide === 'top' ? Math.min(src.y, dst.y) - anchor : Math.max(src.y, dst.y) + anchor;
      return [src, { x: src.x, y: intY }, { x: dst.x, y: intY }, dst];
    }
    const sameDir =
      (srcSide === 'bottom' && dstSide === 'top' && src.y < dst.y) ||
      (srcSide === 'top' && dstSide === 'bottom' && src.y > dst.y);
    if (!sameDir) {
      return undefined;
    }
    if (sameX(src, dst, epsilon)) {
      return [src, dst];
    }
    const midY = (src.y + dst.y) / 2;
    return [src, { x: src.x, y: midY }, { x: dst.x, y: midY }, dst];
  }

  if (srcH && !dstH) {
    const sameDirSrc =
      (srcSide === 'right' && dst.x > src.x) || (srcSide === 'left' && dst.x < src.x);
    const sameDirDst =
      (dstSide === 'top' && src.y < dst.y) || (dstSide === 'bottom' && src.y > dst.y);
    return sameDirSrc && sameDirDst ? [src, { x: dst.x, y: src.y }, dst] : undefined;
  }

  const sameDirSrc =
    (srcSide === 'bottom' && dst.y > src.y) || (srcSide === 'top' && dst.y < src.y);
  const sameDirDst =
    (dstSide === 'left' && src.x < dst.x) || (dstSide === 'right' && src.x > dst.x);
  return sameDirSrc && sameDirDst ? [src, { x: src.x, y: dst.y }, dst] : undefined;
}

export function buildSameSideTrackPath(
  src: Point,
  side: RectSide,
  dst: Point,
  track: number
): Point[] {
  return side === 'left' || side === 'right'
    ? [src, { x: track, y: src.y }, { x: track, y: dst.y }, dst]
    : [src, { x: src.x, y: track }, { x: dst.x, y: track }, dst];
}

export function collectRealNodeBounds(nodes: Iterable<NodeBoundsInput>): {
  nodeInfoById: Map<string, NodeBoundsInfo>;
  realNodeRects: RectEntry[];
} {
  const nodeInfoById = new Map<string, NodeBoundsInfo>();
  const realNodeRects: RectEntry[] = [];
  for (const node of nodes) {
    if (node.isEdgeLabel) {
      continue;
    }
    const info = nodeBoundsInfoFor(node);
    if (!info) {
      continue;
    }
    nodeInfoById.set(info.id, info);
    realNodeRects.push({ id: info.id, rect: info.rect });
  }
  return { nodeInfoById, realNodeRects };
}

export function collectNodeRectEntries(nodes: Iterable<NodeBoundsInput>): {
  realNodeRects: RectEntry[];
  labelNodeRects: RectEntry[];
} {
  const realNodeRects: RectEntry[] = [];
  const labelNodeRects: RectEntry[] = [];
  for (const node of nodes) {
    const info = nodeBoundsInfoFor(node);
    if (!info) {
      continue;
    }
    const entry = { id: info.id, rect: info.rect };
    if (node.isEdgeLabel) {
      labelNodeRects.push(entry);
    } else {
      realNodeRects.push(entry);
    }
  }
  return { realNodeRects, labelNodeRects };
}

export function collectLayoutNodeRects(
  nodes: Iterable<NodeBoundsInput>,
  { includeEdgeLabels = true }: { includeEdgeLabels?: boolean } = {}
): LayoutNodeRect[] {
  const result: LayoutNodeRect[] = [];
  for (const node of nodes) {
    if (node.isGroup || (!includeEdgeLabels && node.isEdgeLabel)) {
      continue;
    }
    const cx = node.x ?? 0;
    const cy = node.y ?? 0;
    const width = node.width ?? 0;
    const height = node.height ?? 0;
    result.push({
      nodeId: node.id!,
      ...rectFromCenterSize(cx, cy, width, height),
    });
  }
  return result;
}

export function getNodePairGeometry(
  edge: EdgeEndpointInput,
  nodeInfoById: Map<string, NodeBoundsInfo>,
  epsilon = EPS
): NodePairGeometry | undefined {
  const srcId = edge.start;
  const dstId = edge.end;
  if (!srcId || !dstId) {
    return undefined;
  }
  const srcInfo = nodeInfoById.get(srcId);
  const dstInfo = nodeInfoById.get(dstId);
  if (!srcInfo || !dstInfo) {
    return undefined;
  }
  return {
    srcId,
    dstId,
    srcInfo,
    dstInfo,
    collinearX: Math.abs(srcInfo.cx - dstInfo.cx) < epsilon,
    collinearY: Math.abs(srcInfo.cy - dstInfo.cy) < epsilon,
  };
}

export function segmentHitsAnyRect(
  a: Point,
  b: Point,
  rects: RectEntry[],
  excludeIds: string[] = [],
  shrink = 0
): boolean {
  for (const entry of rects) {
    if (excludeIds.includes(entry.id)) {
      continue;
    }
    if (segmentBoundsOverlapRect(a, b, entry.rect, -shrink)) {
      return true;
    }
  }
  return false;
}

export function orthogonalSegmentsCross(
  a1: Point,
  b1: Point,
  a2: Point,
  b2: Point,
  epsilon = EPS,
  endpointTolerance = 1e-6
): boolean {
  const s1H = sameY(a1, b1, epsilon);
  const s1V = sameX(a1, b1, epsilon);
  const s2H = sameY(a2, b2, epsilon);
  const s2V = sameX(a2, b2, epsilon);
  if ((s1H && s2H) || (s1V && s2V)) {
    return false;
  }
  if (!(s1H || s1V) || !(s2H || s2V)) {
    return false;
  }

  const horiz = s1H ? { a: a1, b: b1 } : { a: a2, b: b2 };
  const vert = s1V ? { a: a1, b: b1 } : { a: a2, b: b2 };
  const hY = horiz.a.y;
  const hX1 = Math.min(horiz.a.x, horiz.b.x);
  const hX2 = Math.max(horiz.a.x, horiz.b.x);
  const vX = vert.a.x;
  const vY1 = Math.min(vert.a.y, vert.b.y);
  const vY2 = Math.max(vert.a.y, vert.b.y);
  if (vX < hX1 || vX > hX2 || hY < vY1 || hY > vY2) {
    return false;
  }

  const matchesHorizEndpoint =
    (Math.abs(vX - horiz.a.x) < endpointTolerance &&
      Math.abs(hY - horiz.a.y) < endpointTolerance) ||
    (Math.abs(vX - horiz.b.x) < endpointTolerance && Math.abs(hY - horiz.b.y) < endpointTolerance);
  const matchesVertEndpoint =
    (Math.abs(vX - vert.a.x) < endpointTolerance && Math.abs(hY - vert.a.y) < endpointTolerance) ||
    (Math.abs(vX - vert.b.x) < endpointTolerance && Math.abs(hY - vert.b.y) < endpointTolerance);
  return !(matchesHorizEndpoint && matchesVertEndpoint);
}

export function sameAxisSegmentsOverlap(
  a1: Point,
  b1: Point,
  a2: Point,
  b2: Point,
  epsilon = EPS
): boolean {
  const s1H = sameY(a1, b1, epsilon);
  const s1V = sameX(a1, b1, epsilon);
  const s2H = sameY(a2, b2, epsilon);
  const s2V = sameX(a2, b2, epsilon);
  if (s1V && s2V && sameX(a1, a2, epsilon)) {
    return overlapLength(a1.y, b1.y, a2.y, b2.y) > epsilon;
  }
  if (s1H && s2H && sameY(a1, a2, epsilon)) {
    return overlapLength(a1.x, b1.x, a2.x, b2.x) > epsilon;
  }
  return false;
}

export function segmentConflictsWithAnyEdge(
  a: Point,
  b: Point,
  edges: Iterable<EdgeSegmentInput>,
  excludeEdge?: EdgeSegmentInput,
  {
    epsilon = EPS,
    skipDegenerateOther = false,
  }: { epsilon?: number; skipDegenerateOther?: boolean } = {}
): boolean {
  for (const other of edges) {
    if (other === excludeEdge || other.isLayoutOnly) {
      continue;
    }
    const points = other.points;
    if (!points || points.length < 2) {
      continue;
    }
    for (let i = 0; i < points.length - 1; i++) {
      const oa = points[i];
      const ob = points[i + 1];
      if (skipDegenerateOther && samePoint(oa, ob, epsilon)) {
        continue;
      }
      if (
        orthogonalSegmentsCross(a, b, oa, ob, epsilon) ||
        sameAxisSegmentsOverlap(a, b, oa, ob, epsilon)
      ) {
        return true;
      }
    }
  }
  return false;
}

export function orthogonalSegmentsStrictlyCross(
  a1: Point,
  b1: Point,
  a2: Point,
  b2: Point,
  epsilon = EPS
): boolean {
  const aHoriz = sameY(a1, b1, epsilon);
  const aVert = sameX(a1, b1, epsilon);
  const bHoriz = sameY(a2, b2, epsilon);
  const bVert = sameX(a2, b2, epsilon);
  if (!((aHoriz && bVert) || (aVert && bHoriz))) {
    return false;
  }

  const horiz = aHoriz ? { a: a1, b: b1 } : { a: a2, b: b2 };
  const vert = aHoriz ? { a: a2, b: b2 } : { a: a1, b: b1 };
  const hY = horiz.a.y;
  const hXmin = Math.min(horiz.a.x, horiz.b.x);
  const hXmax = Math.max(horiz.a.x, horiz.b.x);
  const vX = vert.a.x;
  const vYmin = Math.min(vert.a.y, vert.b.y);
  const vYmax = Math.max(vert.a.y, vert.b.y);
  return (
    vX > hXmin + epsilon && vX < hXmax - epsilon && hY > vYmin + epsilon && hY < vYmax - epsilon
  );
}

function strictlyBetween(value: number, a: number, b: number): boolean {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return value > lo + EPS && value < hi - EPS;
}

function isCollinearIntermediate(prev: Point, cur: Point, next: Point): boolean {
  if (sameX(prev, cur) && sameX(cur, next)) {
    return strictlyBetween(cur.y, prev.y, next.y);
  }

  if (sameY(prev, cur) && sameY(cur, next)) {
    return strictlyBetween(cur.x, prev.x, next.x);
  }

  return false;
}

function simplifyPolylineOnce(points: Point[]): SimplifyPassResult {
  let changed = false;
  const out: Point[] = [];

  for (let i = 0; i < points.length; i++) {
    const prev = out[out.length - 1];
    const cur = points[i];
    const next = i + 1 < points.length ? points[i + 1] : undefined;
    if (prev && next) {
      if (samePoint(prev, next)) {
        i++;
        changed = true;
        continue;
      }

      if (isCollinearIntermediate(prev, cur, next)) {
        changed = true;
        continue;
      }
    }
    out.push(cur);
  }

  return { points: out, changed };
}

// Inserts orthogonal L-bends and removes consecutive duplicate points.
export function orthogonalizePolyline(pts: Point[]): Point[] {
  const cleaned: Point[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const prev = cleaned[cleaned.length - 1];
    const curr = pts[i];
    if (!sameX(prev, curr) && !sameY(prev, curr)) {
      const prevPrev = cleaned.length >= 2 ? cleaned[cleaned.length - 2] : undefined;
      const incomingVertical = prevPrev ? sameX(prevPrev, prev) : false;
      const corner = incomingVertical ? { x: prev.x, y: curr.y } : { x: curr.x, y: prev.y };
      cleaned.push(corner);
    }
    cleaned.push(curr);
  }
  const deduped: Point[] = [];
  for (const p of cleaned) {
    const last = deduped[deduped.length - 1];
    if (!last || !samePoint(last, p)) {
      deduped.push(p);
    }
  }
  return deduped;
}

export function simplifyPolyline(pts: Point[]): Point[] {
  if (pts.length < 3) {
    return pts;
  }
  let work = [...pts];
  for (let guard = 0; guard < 32; guard++) {
    const result = simplifyPolylineOnce(work);
    work = result.points;
    if (!result.changed) {
      break;
    }
  }
  return work;
}
