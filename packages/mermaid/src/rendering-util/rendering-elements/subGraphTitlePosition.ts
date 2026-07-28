/**
 * Subgraph / cluster title positioning.
 *
 * A subgraph title can live on the top or bottom edge of the cluster box, anchored to the
 * center, the near (left) end or the far (right) end of that edge. The special value `auto`
 * lets the renderer choose the first position (in a fixed fallback order) whose label does not
 * collide with a routed edge, so titles no longer end up sitting underneath an incoming arrow.
 *
 * This module is intentionally DOM-free so the placement + collision logic can be unit tested
 * with pre-captured geometry (see `subGraphTitlePosition.spec.ts`).
 */

/** A resolved, concrete title position (never `auto`). */
export type ConcreteSubGraphTitlePosition =
  | 'top'
  | 'top-left'
  | 'top-right'
  | 'bottom'
  | 'bottom-left'
  | 'bottom-right';

/** A title position as accepted from configuration, including the `auto` sentinel. */
export type SubGraphTitlePosition = ConcreteSubGraphTitlePosition | 'auto';

/**
 * The order `auto` tries candidate positions in. The first candidate whose label rectangle does
 * not intersect a routed edge wins. If every candidate collides, `auto` falls back to `top`.
 */
export const AUTO_POSITION_ORDER: ConcreteSubGraphTitlePosition[] = [
  'top',
  'top-left',
  'bottom',
  'bottom-left',
  'top-right',
  'bottom-right',
];

/** Fast membership check used to normalize untrusted config values at runtime. */
const KNOWN_POSITIONS: ReadonlySet<string> = new Set<string>(AUTO_POSITION_ORDER);

export interface Point {
  x: number;
  y: number;
}

/** Minimal edge shape the resolver needs: the routed poly-line points, in layout coordinates. */
export interface CollisionEdge {
  points?: Point[];
}

/** Cluster box. `x`/`y` are the box center; `width`/`height` its dimensions. */
export interface TitleBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LabelSize {
  width: number;
  height: number;
}

export interface ResolveTitleOptions {
  /** The requested position (`auto` or a concrete value). */
  position: SubGraphTitlePosition;
  /** The cluster box (center + dimensions). */
  box: TitleBox;
  /** Measured label dimensions. */
  labelSize: LabelSize;
  /** Routed edges to test collisions against (only used when `position` is `auto`). */
  edges?: CollisionEdge[];
  /** Top / bottom title margins (from `subGraphTitleMargin` config). */
  margins?: { top?: number; bottom?: number };
  /** Horizontal inset for left/right anchored labels, keeping them off the rounded corner. */
  inset?: number;
  /** Extra padding added around the label rectangle when testing collisions. */
  collisionPadding?: number;
}

export interface ResolvedTitlePlacement {
  /** The concrete position chosen. */
  position: ConcreteSubGraphTitlePosition;
  /** Top-left corner the label group should be translated to, in layout coordinates. */
  x: number;
  y: number;
}

interface Rect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Compute the top-left corner a label of `labelSize` gets when placed at `position` on `box`. */
function labelTopLeft(
  position: ConcreteSubGraphTitlePosition,
  box: TitleBox,
  labelSize: LabelSize,
  topMargin: number,
  bottomMargin: number,
  inset: number
): { x: number; y: number } {
  const left = box.x - box.width / 2;
  const right = box.x + box.width / 2;
  const top = box.y - box.height / 2;
  const bottom = box.y + box.height / 2;
  const lw = labelSize.width;
  const lh = labelSize.height;

  const topY = top + topMargin;
  const bottomY = bottom - lh - bottomMargin;
  const centerX = box.x - lw / 2;
  const leftX = left + inset;
  const rightX = right - lw - inset;

  switch (position) {
    case 'top':
      return { x: centerX, y: topY };
    case 'top-left':
      return { x: leftX, y: topY };
    case 'top-right':
      return { x: rightX, y: topY };
    case 'bottom':
      return { x: centerX, y: bottomY };
    case 'bottom-left':
      return { x: leftX, y: bottomY };
    case 'bottom-right':
      return { x: rightX, y: bottomY };
  }
}

const isPointInRect = (p: Point, r: Rect): boolean =>
  p.x >= r.minX && p.x <= r.maxX && p.y >= r.minY && p.y <= r.maxY;

const orientation = (a: Point, b: Point, c: Point): number =>
  (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

const isOnSegment = (a: Point, b: Point, c: Point): boolean =>
  Math.min(a.x, b.x) <= c.x &&
  c.x <= Math.max(a.x, b.x) &&
  Math.min(a.y, b.y) <= c.y &&
  c.y <= Math.max(a.y, b.y);

/** Do the two closed segments p1p2 and p3p4 intersect? (Standard orientation test.) */
function segmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const d1 = orientation(p3, p4, p1);
  const d2 = orientation(p3, p4, p2);
  const d3 = orientation(p1, p2, p3);
  const d4 = orientation(p1, p2, p4);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  if (d1 === 0 && isOnSegment(p3, p4, p1)) {
    return true;
  }
  if (d2 === 0 && isOnSegment(p3, p4, p2)) {
    return true;
  }
  if (d3 === 0 && isOnSegment(p1, p2, p3)) {
    return true;
  }
  if (d4 === 0 && isOnSegment(p1, p2, p4)) {
    return true;
  }
  return false;
}

/** Does the segment p1p2 touch the axis-aligned rectangle `r` (edge or interior)? */
function segmentIntersectsRect(p1: Point, p2: Point, r: Rect): boolean {
  if (isPointInRect(p1, r) || isPointInRect(p2, r)) {
    return true;
  }
  const tl = { x: r.minX, y: r.minY };
  const tr = { x: r.maxX, y: r.minY };
  const br = { x: r.maxX, y: r.maxY };
  const bl = { x: r.minX, y: r.maxY };
  return (
    segmentsIntersect(p1, p2, tl, tr) ||
    segmentsIntersect(p1, p2, tr, br) ||
    segmentsIntersect(p1, p2, br, bl) ||
    segmentsIntersect(p1, p2, bl, tl)
  );
}

/** Does any routed edge cross the rectangle `r`? */
function edgesCrossRect(r: Rect, edges: CollisionEdge[]): boolean {
  for (const edge of edges) {
    const points = edge?.points;
    if (!points || points.length < 2) {
      continue;
    }
    for (let i = 0; i < points.length - 1; i++) {
      if (segmentIntersectsRect(points[i], points[i + 1], r)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Resolve a requested title position into concrete placement coordinates.
 *
 * - A concrete `position` is placed as-is (edges are ignored — the user asked for it).
 * - `auto` walks {@link AUTO_POSITION_ORDER} and returns the first candidate whose label
 *   rectangle no routed edge crosses; if every candidate is blocked it falls back to `top`.
 */
export function resolveSubGraphTitlePlacement(
  options: ResolveTitleOptions
): ResolvedTitlePlacement {
  const { box, labelSize, margins } = options;
  const topMargin = margins?.top ?? 0;
  const bottomMargin = margins?.bottom ?? 0;
  const inset = options.inset ?? 0;
  const pad = options.collisionPadding ?? 0;

  // Normalize untrusted config: anything that is neither `auto` nor a known concrete position
  // (e.g. a malformed directive that slipped past schema validation) falls back to `top`.
  const position: SubGraphTitlePosition =
    options.position === 'auto' || KNOWN_POSITIONS.has(options.position) ? options.position : 'top';

  const place = (p: ConcreteSubGraphTitlePosition): ResolvedTitlePlacement => {
    const { x, y } = labelTopLeft(p, box, labelSize, topMargin, bottomMargin, inset);
    return { position: p, x, y };
  };

  if (position !== 'auto') {
    return place(position);
  }

  const edges = options.edges ?? [];
  for (const candidate of AUTO_POSITION_ORDER) {
    const { x, y } = labelTopLeft(candidate, box, labelSize, topMargin, bottomMargin, inset);
    const rect: Rect = {
      minX: x - pad,
      minY: y - pad,
      maxX: x + labelSize.width + pad,
      maxY: y + labelSize.height + pad,
    };
    if (!edgesCrossRect(rect, edges)) {
      return place(candidate);
    }
  }

  // Everything is blocked — fall back to the top-center title.
  return place('top');
}
