/**
 * Edge path calculation helpers for mermaid flowchart drag.
 *
 * These functions are extracted from the edge-data-demo and work purely
 * on SVG DOM — no dependency on mermaid runtime code.
 */

/* ------------------------------------------------------------------ */
/*  Rectangle boundary intersection                                    */
/* ------------------------------------------------------------------ */

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Find the intersection point of a ray from the centre of an
 * axis-aligned rectangle toward `(toCx, toCy)` with the rectangle's
 * perimeter.  This gives the natural edge-exit / edge-entry point.
 */
export function getRectEdgePoint(
  cx: number,
  cy: number,
  w: number,
  h: number,
  toCx: number,
  toCy: number
): Point {
  const dx = toCx - cx;
  const dy = toCy - cy;
  if (dx === 0 && dy === 0) {
    return { x: cx, y: cy };
  }
  const hw = w / 2;
  const hh = h / 2;
  let t = Infinity;
  if (dx > 0) {
    t = Math.min(t, hw / dx);
  }
  if (dx < 0) {
    t = Math.min(t, -hw / dx);
  }
  if (dy > 0) {
    t = Math.min(t, hh / dy);
  }
  if (dy < 0) {
    t = Math.min(t, -hh / dy);
  }
  return { x: cx + t * dx, y: cy + t * dy };
}

/**
 * Determine which side of an axis-aligned rectangle a boundary point
 * lies on.  Used to align the bezier tangent with the exit / entry side.
 */
export function getBoundarySide(
  cx: number,
  cy: number,
  w: number,
  h: number,
  px: number,
  py: number
): 'right' | 'left' | 'bottom' | 'top' {
  const hw = w / 2;
  const hh = h / 2;
  const eps = 2;
  if (Math.abs(px - (cx + hw)) < eps) {
    return 'right';
  }
  if (Math.abs(px - (cx - hw)) < eps) {
    return 'left';
  }
  if (Math.abs(py - (cy + hh)) < eps) {
    return 'bottom';
  }
  if (Math.abs(py - (cy - hh)) < eps) {
    return 'top';
  }
  return 'right';
}

/* ------------------------------------------------------------------ */
/*  Cubic-bezier path generation                                       */
/* ------------------------------------------------------------------ */

/**
 * Position an edge label SVG group at the geometric midpoint of a path.
 */
export function positionEdgeLabel(
  pathEl: SVGPathElement,
  labelEl: SVGGElement | null | undefined
): void {
  if (!labelEl) {
    return;
  }
  try {
    const len = pathEl.getTotalLength();
    if (len > 0) {
      const pt = pathEl.getPointAtLength(len / 2);
      labelEl.setAttribute('transform', `translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`);
    }
  } catch (_) {
    // path may not be in the DOM yet
  }
}

/**
 * Rebuild an edge path as a smooth cubic-bezier S-curve and reposition
 * its label.
 *
 * Control points extend purely along the exit / entry normal direction
 * by a distance proportional to the centre-to-centre gap.  No clamping,
 * no hard straight-line fallback, no orthogonal bend.
 */
export function updateEdgePath(
  srcRect: Rect,
  tgtRect: Rect,
  pathEl: SVGPathElement,
  labelEl?: SVGGElement | null
): void {
  const srcCx = srcRect.x + srcRect.width / 2;
  const srcCy = srcRect.y + srcRect.height / 2;
  const tgtCx = tgtRect.x + tgtRect.width / 2;
  const tgtCy = tgtRect.y + tgtRect.height / 2;

  const start = getRectEdgePoint(srcCx, srcCy, srcRect.width, srcRect.height, tgtCx, tgtCy);
  const end = getRectEdgePoint(tgtCx, tgtCy, tgtRect.width, tgtRect.height, srcCx, srcCy);

  const srcSide = getBoundarySide(srcCx, srcCy, srcRect.width, srcRect.height, start.x, start.y);
  const tgtSide = getBoundarySide(tgtCx, tgtCy, tgtRect.width, tgtRect.height, end.x, end.y);

  const offset = Math.hypot(tgtCx - srcCx, tgtCy - srcCy) * 0.4;

  // CP1 — extend purely in the source exit direction
  let cp1x: number, cp1y: number;
  switch (srcSide) {
    case 'right':
      cp1x = start.x + offset;
      cp1y = start.y;
      break;
    case 'left':
      cp1x = start.x - offset;
      cp1y = start.y;
      break;
    case 'bottom':
      cp1x = start.x;
      cp1y = start.y + offset;
      break;
    case 'top':
      cp1x = start.x;
      cp1y = start.y - offset;
      break;
    default:
      cp1x = start.x + offset;
      cp1y = start.y;
  }

  // CP2 — extend purely in the target entry direction
  let cp2x: number, cp2y: number;
  switch (tgtSide) {
    case 'left':
      cp2x = end.x - offset;
      cp2y = end.y;
      break;
    case 'right':
      cp2x = end.x + offset;
      cp2y = end.y;
      break;
    case 'top':
      cp2x = end.x;
      cp2y = end.y - offset;
      break;
    case 'bottom':
      cp2x = end.x;
      cp2y = end.y + offset;
      break;
    default:
      cp2x = end.x - offset;
      cp2y = end.y;
  }

  pathEl.setAttribute(
    'd',
    `M ${start.x},${start.y} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${end.x},${end.y}`
  );
  positionEdgeLabel(pathEl, labelEl);
}
