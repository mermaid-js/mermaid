import { log } from '$root/logger.js';
import { labelHelper, updateNodeBounds } from './util.js';
import intersect from '../intersect/index.js';
import { getConfig } from '$root/diagram-api/diagramAPI.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import { userNodeOverrides } from '$root/rendering-util/rendering-elements/shapes/handdrawnStyles.js';
import rough from 'roughjs';
import { insertPolygonShape } from './insertPolygonShape.js';

/**
 * Creates an SVG path for a special polygon shape with a left-inverted arrow.
 * @param {number} x - The x coordinate of the top-left corner.
 * @param {number} y - The y coordinate of the top-left corner.
 * @param {number} width - The width of the shape.
 * @param {number} height - The height of the shape.
 * @returns {string} The path data for the special polygon shape.
 */
export const createPolygonPathD = (x: number, y: number, width: number, height: number): string => {
  return [
    `M${x - height / 2},${y}`,
    `L${x + width},${y}`,
    `L${x + width},${y - height}`,
    `L${x - height / 2},${y - height}`,
    `L${x},${y - height / 2}`,
    'Z',
  ].join(' ');
};

export const rect_left_inv_arrow = async (
  parent: SVGAElement,
  node: Node
): Promise<SVGAElement> => {
  const { themeVariables, handdrawnSeed } = getConfig();
  const { nodeBorder, mainBkg } = themeVariables;

  const { shapeSvg, bbox, halfPadding } = await labelHelper(
    parent,
    node,
    'node ' + node.cssClasses,
    true
  );

  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding;
  const points = [
    { x: -h / 2, y: 0 },
    { x: w, y: 0 },
    { x: w, y: -h },
    { x: -h / 2, y: -h },
    { x: 0, y: -h / 2 },
  ];

  let polygon;
  const { cssStyles, useRough } = node;

  if (useRough) {
    console.log('Polygon: Inside use useRough');
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {
      roughness: 0.7,
      fill: mainBkg,
      fillStyle: 'hachure',
      fillWeight: 1.5,
      stroke: nodeBorder,
      seed: handdrawnSeed,
      strokeWidth: 1,
    });
    const pathData = createPolygonPathD(0, 0, w, h);
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
  node.width = w + h;
  node.height = h;

  updateNodeBounds(node, polygon);

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
};
