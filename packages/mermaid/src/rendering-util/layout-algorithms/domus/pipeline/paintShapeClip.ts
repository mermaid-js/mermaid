/**
 * Paint-stage shape clip — the last mile of an edge into a non-rectangular node.
 *
 * DOMUS lays out and validates against the node's *bounding box*: obstacles are
 * rectangles, ports sit on box sides, and `validateLayout` measures everything
 * in that rect model (`edge-endpoint-inside-node` is a HARD check, so a layout
 * stage may not move an endpoint inside the box). That is the right model for
 * routing, but it is not what the user sees: a `diamond` node is drawn as a
 * rhombus INSCRIBED in its box, touching the box only at the four side
 * midpoints. A port anywhere else on a box side therefore ends in empty space —
 * `incremental-editing`'s `overlap` node had two exit ports 57.5px and 82.2px
 * outside the drawn rhombus, which reads as a broken, disconnected edge. The
 * same gap exists for every shape that does not fill its box (hexagon,
 * trapezoid, circle, …).
 *
 * The fix is a *rendering* concern, and the literature is unambiguous that this
 * is where it belongs. No paper in the graph-drawing corpus models a
 * non-rectangular vertex at all — `1405.2300v1` frames the whole high-degree
 * literature as "boxes whose shape is restricted to a rectangle", and the two
 * routers whose drawn nodes are not rectangles both substitute the bounding box
 * (`Orthogonal-Connector-Routing`: "we model objects by their bounding
 * rectangle"; `edge-routing`: circles modelled as "quadratic bounding boxes").
 * Shape enters only at the end: `dot` routes against boxes and then "the spline
 * is clipped to endpoint node shapes" (TSE93 §5), and ordered-bundle routing
 * keeps two representations per node — a polygonal obstacle for the routing
 * graph, and the true node boundary curve as the hub on which the drawn path
 * terminates (`1209.4227v1` §5.1). This pass is that second representation.
 *
 * Restricting a diamond's ports to its four apexes — the only box points the
 * rhombus touches — was the alternative considered and rejected: it is one port
 * per side, i.e. the degree-4 Tamassia regime (`bekos-kaufmann`), which
 * `overlap` (3 edges, 2 of them exiting the same side) already violates, and the
 * construction appears nowhere in the literature.
 *
 * Mechanism. For each terminal point the pass walks INWARD along the terminal
 * segment's own axis until it crosses the drawn outline, so the entry stays
 * axis-aligned (unlike paint's generic center-ray `intersect`, which would tilt
 * the final segment). The outline itself is never modelled here: the shape's own
 * `node.intersect` — installed by the shape module that drew it — is the only
 * source of truth, probed through an inside/outside test and a bisection. Shapes
 * that DO fill their box (rect, squareRect) report the endpoint as already on the
 * outline, so the pass is a no-op for them.
 *
 * `LayoutData` is NOT mutated: the validated box-terminated polyline stays the
 * layout's geometry; only the painted path is clipped.
 */

export interface ShapeClipPoint {
  x: number;
  y: number;
}

/** The subset of a rendered node this pass needs (post-`measure`, so `intersect` is installed). */
export interface ShapeClipNode {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  isGroup?: boolean;
  intersect?: (point: ShapeClipPoint) => ShapeClipPoint | undefined;
}

/** Terminal segment must be axis-aligned to within this to be clipped. */
const AXIS_EPS = 0.5;
/** Endpoint must sit this close to the box side it exits through. */
const SIDE_EPS = 1;
/**
 * `intersect.polygon` signals "this point is inside the polygon" by returning the
 * node itself (i.e. its center) rather than a boundary point — see
 * `rendering-elements/intersect/intersect-polygon.js`. `question.ts` shifts its
 * result by -0.5, so allow ~1px of slack around the center.
 */
const CENTER_EPS = 1;
/** Treat a point this close to the outline as already on it (box-filling shapes). */
const ON_OUTLINE_EPS = 0.25;
/** Don't rewrite the polyline for a sub-pixel gain. */
const MIN_CLIP = 0.5;
/** Bisection steps: halves the box extent to well under a thousandth of a pixel. */
const BISECT_STEPS = 24;
/**
 * Extra inward margin on the clipped point.
 *
 * The probe below can only be as accurate as the shape module it asks. Measured
 * against the analytic rhombus face across all four sides and offsets from 5px to
 * the apex, it lands up to ~0.55px SHORT — never deep — so without a margin the
 * pass would leave a hairline gap in exactly the case it exists to fix. 1px
 * closes that with room to spare and covers comparable quirks in other shape
 * modules. An overshoot is harmless (edges paint over nodes, and this is well
 * under one stroke width); a shortfall is the visible defect.
 *
 * This used to be 2px, to absorb `question.ts` disagreeing with itself by ~1px
 * between the polygon it drew and the `calcIntersect` it installed. That is now
 * fixed at the source, so the margin only has to cover probe residue.
 */
const SAFETY_INSET = 1;
/** …but never spend more than this share of the box half-extent on the margin. */
const MAX_INSET_SHARE = 0.25;

const isFinitePoint = (p: ShapeClipPoint | undefined): p is ShapeClipPoint =>
  !!p && Number.isFinite(p.x) && Number.isFinite(p.y);

/**
 * Is `q` inside (or on) the node's DRAWN outline?
 *
 * Uses only the shape's own `intersect`, which returns where the ray from the
 * node center through `q` crosses the outline. `q` is inside when it is no
 * further from the center than that crossing — or when the polygon
 * implementation degenerates to the center, its way of reporting "no crossing,
 * the point is within the shape".
 */
function isInsideOutline(node: ShapeClipNode, q: ShapeClipPoint, slack = 0): boolean {
  const cx = node.x ?? 0;
  const cy = node.y ?? 0;
  let crossing: ShapeClipPoint | undefined;
  try {
    crossing = node.intersect?.(q);
  } catch {
    return false;
  }
  if (!isFinitePoint(crossing)) {
    return false;
  }
  const dCrossing = Math.hypot(crossing.x - cx, crossing.y - cy);
  if (dCrossing <= CENTER_EPS) {
    return true;
  }
  return Math.hypot(q.x - cx, q.y - cy) <= dCrossing + slack;
}

/**
 * Clip one terminal point inward onto the node's drawn outline along the
 * terminal segment's axis. Returns the clipped point, or `null` when the
 * endpoint should be left alone (box-filling shape, non-axis-aligned or
 * non-boundary endpoint, unusable `intersect`, sub-pixel gain).
 */
function clipTerminalPoint(
  endpoint: ShapeClipPoint,
  neighbor: ShapeClipPoint,
  node: ShapeClipNode | undefined
): ShapeClipPoint | null {
  if (!node || node.isGroup || typeof node.intersect !== 'function') {
    return null;
  }
  const cx = node.x ?? Number.NaN;
  const cy = node.y ?? Number.NaN;
  const width = node.width ?? Number.NaN;
  const height = node.height ?? Number.NaN;
  if (
    !Number.isFinite(cx) ||
    !Number.isFinite(cy) ||
    !(width > 0) ||
    !(height > 0) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height)
  ) {
    return null;
  }
  if (!isFinitePoint(endpoint) || !isFinitePoint(neighbor)) {
    return null;
  }
  const hw = width / 2;
  const hh = height / 2;
  const dx = Math.abs(endpoint.x - neighbor.x);
  const dy = Math.abs(endpoint.y - neighbor.y);
  const horizontal = dy <= AXIS_EPS && dx > AXIS_EPS;
  const vertical = dx <= AXIS_EPS && dy > AXIS_EPS;
  if (horizontal === vertical) {
    return null; // diagonal, or a degenerate zero-length terminal segment
  }

  // The endpoint must sit on the box side the segment is perpendicular to, and
  // within that side's span. `inner` is the endpoint projected onto the box's
  // center line along the same axis: for any shape that is convex and centered
  // (every Mermaid node shape), that point is inside the outline, which brackets
  // the crossing between `endpoint` (outside) and `inner` (inside).
  let inner: ShapeClipPoint;
  if (horizontal) {
    const onSide =
      Math.abs(endpoint.x - (cx - hw)) <= SIDE_EPS || Math.abs(endpoint.x - (cx + hw)) <= SIDE_EPS;
    if (!onSide || Math.abs(endpoint.y - cy) > hh) {
      return null;
    }
    inner = { x: cx, y: endpoint.y };
  } else {
    const onSide =
      Math.abs(endpoint.y - (cy - hh)) <= SIDE_EPS || Math.abs(endpoint.y - (cy + hh)) <= SIDE_EPS;
    if (!onSide || Math.abs(endpoint.x - cx) > hw) {
      return null;
    }
    inner = { x: endpoint.x, y: cy };
  }

  // `ON_OUTLINE_EPS` slack only when deciding whether there is anything to do —
  // a box-filling shape reports its endpoint as on the outline. The bisection
  // below runs slack-free so the crossing is not biased deeper into the shape.
  if (isInsideOutline(node, endpoint, ON_OUTLINE_EPS) || !isInsideOutline(node, inner)) {
    return null;
  }

  let outside = { ...endpoint };
  let inside = inner;
  for (let i = 0; i < BISECT_STEPS; i++) {
    const mid = { x: (outside.x + inside.x) / 2, y: (outside.y + inside.y) / 2 };
    if (isInsideOutline(node, mid)) {
      inside = mid;
    } else {
      outside = mid;
    }
  }

  // If the bisection barely moved, the endpoint was already on the outline and
  // the `ON_OUTLINE_EPS` short-circuit above just missed it (shape `intersect`
  // implementations vary in how exactly they report a point ON the boundary).
  // There is no gap to close, so leave the endpoint — and in particular do NOT
  // spend the safety inset here, which would push a correct endpoint inward.
  const travelled = Math.hypot(inside.x - endpoint.x, inside.y - endpoint.y);
  if (travelled < MIN_CLIP) {
    return null;
  }

  // Real gap: land on the outline, then nudge a little further inward to absorb
  // the probe's bias. Never past the box center line.
  const axisExtent = horizontal ? hw : hh;
  const inset = Math.min(SAFETY_INSET, axisExtent * MAX_INSET_SHARE);
  const remaining = Math.hypot(inner.x - inside.x, inner.y - inside.y);
  const step = Math.min(inset, remaining);
  return horizontal
    ? { x: inside.x + Math.sign(inner.x - endpoint.x) * step, y: inside.y }
    : { x: inside.x, y: inside.y + Math.sign(inner.y - endpoint.y) * step };
}

/**
 * Return `points` with its first/last point clipped onto the drawn outline of
 * the start/end node. Returns the original array when nothing moved, so callers
 * can pass the result straight to paint without an extra allocation.
 */
export function clipEndpointsToNodeOutlines(
  points: ShapeClipPoint[] | undefined,
  startNode: ShapeClipNode | undefined,
  endNode: ShapeClipNode | undefined
): ShapeClipPoint[] | undefined {
  if (!Array.isArray(points) || points.length < 2) {
    return points;
  }
  const last = points.length - 1;
  const clippedStart = clipTerminalPoint(points[0], points[1], startNode);
  const clippedEnd = clipTerminalPoint(points[last], points[last - 1], endNode);
  if (!clippedStart && !clippedEnd) {
    return points;
  }
  const out = points.map((p) => ({ ...p }));
  if (clippedStart) {
    out[0] = clippedStart;
  }
  if (clippedEnd) {
    out[last] = clippedEnd;
  }
  return out;
}
