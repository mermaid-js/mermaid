import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import { insertPolygonShape } from './insertPolygonShape.js';
import type { D3Selection } from '../../../types.js';
import type { Bounds, Point } from '../../../types.js';

export const createDecisionBoxPathD = (
  x: number,
  y: number,
  width: number,
  height: number = width
): string => {
  return [
    `M${x + width / 2},${y}`,
    `L${x + width},${y - height / 2}`,
    `L${x + width / 2},${y - height}`,
    `L${x},${y - height / 2}`,
    'Z',
  ].join(' ');
};

/**
 * Width-to-height ratio of decision diamonds. A square rhombus around a typical one-line label is
 * much taller than the nodes around it, so diamonds are drawn wider than they are tall.
 */
export const DECISION_ASPECT_RATIO = 1.6;

/**
 * Returns the half-width and half-height of a diamond with the given width-to-height `ratio` whose
 * sides pass through the corners of a `width` × `height` box centered in it.
 *
 * With `ratio` 1 both halves are `(width + height) / 2`, a square rhombus.
 */
export const getDecisionBoxHalfSize = (
  width: number,
  height: number,
  ratio: number
): { halfWidth: number; halfHeight: number } => ({
  halfWidth: (width + ratio * height) / 2,
  halfHeight: (width / ratio + height) / 2,
});

export async function question<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  const w = bbox.width + (node.padding ?? 0);
  const h = bbox.height + (node.padding ?? 0);
  const { halfWidth, halfHeight } = getDecisionBoxHalfSize(w, h, DECISION_ASPECT_RATIO);
  const width = 2 * halfWidth;
  const height = 2 * halfHeight;
  const adjustment = 0.5;

  const points = [
    { x: halfWidth, y: 0 },
    { x: width, y: -halfHeight },
    { x: halfWidth, y: -height },
    { x: 0, y: -halfHeight },
  ];

  let polygon: typeof shapeSvg | ReturnType<typeof insertPolygonShape>;
  const { cssStyles } = node;

  if (node.look === 'handDrawn') {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});
    const pathData = createDecisionBoxPathD(0, 0, width, height);
    const roughNode = rc.path(pathData, options);

    polygon = shapeSvg
      .insert(() => roughNode, ':first-child')
      .attr('transform', `translate(${-halfWidth + adjustment}, ${halfHeight})`);

    if (cssStyles) {
      polygon.attr('style', cssStyles);
    }
  } else {
    polygon = insertPolygonShape(shapeSvg, width, height, points);
    polygon.attr('transform', `translate(${-halfWidth + adjustment}, ${halfHeight})`);
  }

  if (nodeStyles) {
    polygon.attr('style', nodeStyles);
  }

  updateNodeBounds(node, polygon);
  node.calcIntersect = function (bounds: Bounds, point: Point) {
    // Hand-drawn outlines overflow the nominal diamond, so their bounds are not
    // exactly in proportion. Size the diamond from the bounds' width and keep
    // the drawn width-to-height ratio.
    const halfWidth = bounds.width / 2;
    const halfHeight = halfWidth / DECISION_ASPECT_RATIO;
    const dx = point.x - bounds.x;
    const dy = point.y - bounds.y;

    // Scale the offset towards `point` onto the outline, where
    // |dx| / halfWidth + |dy| / halfHeight = 1. A point on the outline, where
    // layouts that clip edges to the bounding box end them, is its own
    // intersection, even if float32 bounds leave it a hair inside.
    const t = Math.abs(dx) / halfWidth + Math.abs(dy) / halfHeight;
    if (t === 0) {
      return { x: bounds.x, y: bounds.y };
    }
    return { x: bounds.x + dx / t, y: bounds.y + dy / t };
  };

  node.intersect = function (point) {
    // @ts-ignore TODO fix this (KNSV)
    return this.calcIntersect(node as Bounds, point);
  };

  return shapeSvg;
}
