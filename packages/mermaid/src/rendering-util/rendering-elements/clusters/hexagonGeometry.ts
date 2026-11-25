/**
 * Geometry of the pointed-top hexagon cluster: flat left and right sides, a roof and a
 * floor that each meet in a point on the vertical axis.
 *
 * The point depth is a fixed number of pixels, not a fraction of the width. Layout
 * reserves that depth above and below the children before the frame width is known, so
 * a proportional depth would be unknowable at that stage. A fixed depth also keeps the
 * extra size of every nested ring in the height, never the width.
 */

export interface HexagonPoint {
  readonly x: number;
  readonly y: number;
}

/** Vertical distance from the apex to where the roof meets a flat side. */
export const HEXAGON_POINT_DEPTH = 40;

/**
 * Corners of the hexagon relative to its centre, clockwise from the top apex.
 * `width` and `height` are the bounding box; `pointDepth` is capped at half the height
 * so a short frame degrades to a diamond instead of folding over itself.
 */
export function hexagonClusterPoints(
  width: number,
  height: number,
  pointDepth: number = HEXAGON_POINT_DEPTH
): HexagonPoint[] {
  const depth = Math.min(pointDepth, height / 2);
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  return [
    { x: 0, y: -halfHeight },
    { x: halfWidth, y: -halfHeight + depth },
    { x: halfWidth, y: halfHeight - depth },
    { x: 0, y: halfHeight },
    { x: -halfWidth, y: halfHeight - depth },
    { x: -halfWidth, y: -halfHeight + depth },
  ];
}

/**
 * Distance from the frame's top edge to the top of the title text.
 *
 * The title sits as high as the roof allows: at depth `d` the roof is `width * d / depth`
 * wide, so a title of width `t` plus `margin` first fits at `depth * (t + margin) / width`.
 * A title wider than the roof's full span sits at `depth`, in the flat-sided band below it.
 */
export function hexagonTitleTop(
  width: number,
  titleWidth: number,
  margin: number,
  pointDepth: number = HEXAGON_POINT_DEPTH
): number {
  if (width <= 0) {
    return pointDepth;
  }
  return Math.min(pointDepth, (pointDepth * (titleWidth + margin)) / width);
}

/** A box given by its centre and size, as layouts report nodes. */
export interface CentredBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Gap kept between a slanted side and the corner of a child it passes. */
const HEXAGON_CHILD_CLEARANCE = 4;

/** The frame title as the hexagon painter places it: see `hexagonTitleTop`. */
export interface HexagonTitle {
  readonly width: number;
  readonly height: number;
  readonly margin: number;
}

/**
 * Deepest point depth, up to `maxDepth`, at which the roof and floor of `frame` pass
 * above and below every child instead of cutting through it, and the title, which sits
 * lower as the roof deepens, stays above the children beneath it.
 *
 * For a layout that does not reserve the depth inside the frame, as ELK does: the
 * slanted sides then take only the room the layout left between the frame's edge and
 * its children. At a horizontal distance `dx` from the axis the roof sits
 * `depth * dx / halfWidth` below the frame top, so a child corner `gap` below the top
 * allows `depth <= gap * halfWidth / dx`. With no room at all the result is 0: a
 * rectangle with the title on top, as the rect painter draws it.
 */
export function fitHexagonPointDepth(
  frame: CentredBox,
  children: readonly CentredBox[],
  title?: HexagonTitle,
  maxDepth: number = HEXAGON_POINT_DEPTH
): number {
  const halfWidth = frame.width / 2;
  if (halfWidth <= 0) {
    return 0;
  }
  const top = frame.y - frame.height / 2;
  const bottom = frame.y + frame.height / 2;
  // How far down the title sits per pixel of depth (see `hexagonTitleTop`).
  const titleDrop = title ? Math.min(1, (title.width + title.margin) / frame.width) : 0;
  let depth = maxDepth;
  for (const child of children) {
    const childTop = child.y - child.height / 2 - top;
    const childBottom = bottom - (child.y + child.height / 2);
    const dx = Math.abs(child.x - frame.x) + child.width / 2;
    const gap = Math.min(childTop, childBottom) - HEXAGON_CHILD_CLEARANCE;
    depth = Math.min(depth, (gap * halfWidth) / dx);
    const underTitle = title && Math.abs(child.x - frame.x) < (child.width + title.width) / 2;
    if (underTitle && titleDrop > 0) {
      depth = Math.min(depth, (childTop - title.height - HEXAGON_CHILD_CLEARANCE) / titleDrop);
    }
  }
  return Math.max(0, depth);
}

/**
 * Extra room a cluster shape needs above and below its children, in pixels, so that
 * children whose bounding box spans the frame's inner width clear the slanted roof and
 * floor. Zero for shapes whose border is a plain rectangle.
 */
export function clusterVerticalInset(shape: string | undefined): number {
  return shape === 'hexagon' ? HEXAGON_POINT_DEPTH : 0;
}
