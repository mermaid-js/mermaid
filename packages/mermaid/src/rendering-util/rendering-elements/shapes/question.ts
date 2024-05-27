import { log } from '$root/logger.js';
import { labelHelper, updateNodeBounds } from './util.js';
import intersect from '../intersect/index.js';
import { getConfig } from '$root/diagram-api/diagramAPI.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import { userNodeOverrides } from '$root/rendering-util/rendering-elements/shapes/handdrawnStyles.js';
import rough from 'roughjs';
import { insertPolygonShape } from './insertPolygonShape.js';

/**
 * Creates an SVG path for a decision box shape (question shape).
 * @param {number} x - The x coordinate of the top-left corner.
 * @param {number} y - The y coordinate of the top-left corner.
 * @param {number} size - The size of the shape.
 * @returns {string} The path data for the decision box shape.
 */
export const createDecisionBoxPathD = (x: number, y: number, size: number): string => {
  return [
    `M${x + size / 2},${y}`,
    `L${x + size},${y - size / 2}`,
    `L${x + size / 2},${y - size}`,
    `L${x},${y - size / 2}`,
    'Z',
  ].join(' ');
};

export const question = async (parent: SVGAElement, node: Node): Promise<SVGAElement> => {
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
  const s = w + h;

  const points = [
    { x: s / 2, y: 0 },
    { x: s, y: -s / 2 },
    { x: s / 2, y: -s },
    { x: 0, y: -s / 2 },
  ];

  let polygon: d3.Selection<SVGPolygonElement | SVGGElement, unknown, null, undefined>;
  const { cssStyles, useRough } = node;

  if (useRough) {
    console.log('DecisionBox: Inside use useRough');
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
    const pathData = createDecisionBoxPathD(0, 0, s);
    const roughNode = rc.path(pathData, options);

    polygon = shapeSvg
      .insert(() => roughNode, ':first-child')
      .attr('transform', `translate(${-s / 2}, ${s / 2})`);

    if (cssStyles) {
      polygon.attr('style', cssStyles);
    }
  } else {
    polygon = insertPolygonShape(shapeSvg, s, s, points);
  }

  if (cssStyles) {
    polygon.attr('style', cssStyles);
  }

  updateNodeBounds(node, polygon);

  node.intersect = function (point) {
    log.warn('Intersect called');
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
};
