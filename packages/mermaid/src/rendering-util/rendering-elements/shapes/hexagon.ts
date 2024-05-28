import { log } from '$root/logger.js';
import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import { userNodeOverrides } from '$root/rendering-util/rendering-elements/shapes/handdrawnStyles.js';
import rough from 'roughjs';

import { insertPolygonShape } from './insertPolygonShape.js';

/**
 * Creates an SVG path for a hexagon shape.
 * @param {number} x - The x coordinate of the top-left corner.
 * @param {number} y - The y coordinate of the top-left corner.
 * @param {number} width - The width of the hexagon.
 * @param {number} height - The height of the hexagon.
 * @param {number} m - The margin size for the hexagon.
 * @returns {string} The path data for the hexagon shape.
 */
export const createHexagonPathD = (
  x: number,
  y: number,
  width: number,
  height: number,
  m: number
): string => {
  return [
    `M${x + m},${y}`,
    `L${x + width - m},${y}`,
    `L${x + width},${y - height / 2}`,
    `L${x + width - m},${y - height}`,
    `L${x + m},${y - height}`,
    `L${x},${y - height / 2}`,
    'Z',
  ].join(' ');
};

export const hexagon = async (parent: SVGAElement, node: Node): Promise<SVGAElement> => {
  const { shapeSvg, bbox, halfPadding } = await labelHelper(
    parent,
    node,
    getNodeClasses(node),
    true
  );

  const f = 4;
  const h = bbox.height + node.padding;
  const m = h / f;
  const w = bbox.width + 2 * m + node.padding;
  const points = [
    { x: m, y: 0 },
    { x: w - m, y: 0 },
    { x: w, y: -h / 2 },
    { x: w - m, y: -h },
    { x: m, y: -h },
    { x: 0, y: -h / 2 },
  ];

  let polygon: d3.Selection<SVGPolygonElement | SVGGElement, unknown, null, undefined>;
  const { cssStyles, useRough } = node;

  if (useRough) {
    // @ts-ignore
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});
    const pathData = createHexagonPathD(0, 0, w, h, m);
    const roughNode = rc.path(pathData, options);

    polygon = shapeSvg
      .insert(() => roughNode, ':first-child')
      .attr('transform', `translate(${-w / 2}, ${h / 2})`);

    if (cssStyles) {
      polygon.attr('style', cssStyles);
    }
  } else {
    polygon = insertPolygonShape(shapeSvg, w, h, points);
  }

  if (cssStyles) {
    polygon.attr('style', cssStyles);
  }

  node.width = w;
  node.height = h;

  updateNodeBounds(node, polygon);

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
};
