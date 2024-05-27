import { log } from '$root/logger.js';
import { labelHelper, updateNodeBounds } from './util.js';
import intersect from '../intersect/index.js';
import { getConfig } from '$root/diagram-api/diagramAPI.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import { userNodeOverrides } from '$root/rendering-util/rendering-elements/shapes/handdrawnStyles.js';
import rough from 'roughjs';

/**
 * Creates an SVG path for a cylindrical shape.
 * @param {number} x - The x coordinate of the top-left corner.
 * @param {number} y - The y coordinate of the top-left corner.
 * @param {number} width - The width of the cylinder.
 * @param {number} height - The height of the cylinder.
 * @param {number} rx - The x-radius of the cylinder's ends.
 * @param {number} ry - The y-radius of the cylinder's ends.
 * @returns {string} The path data for the cylindrical shape.
 */
export const createCylinderPathD = (
  x: number,
  y: number,
  width: number,
  height: number,
  rx: number,
  ry: number
): string => {
  return [
    `M${x},${y + ry}`,
    `a${rx},${ry} 0,0,0 ${width},0`,
    `a${rx},${ry} 0,0,0 ${-width},0`,
    `l0,${height}`,
    `a${rx},${ry} 0,0,0 ${width},0`,
    `l0,${-height}`,
  ].join(' ');
};

export const cylinder = async (parent: SVGAElement, node: Node) => {
  const { themeVariables, handdrawnSeed } = getConfig();
  const { nodeBorder, mainBkg } = themeVariables;

  const { shapeSvg, bbox, halfPadding } = await labelHelper(
    parent,
    node,
    'node ' + node.cssClasses, // + ' ' + node.class,
    true
  );

  const w = bbox.width + node.padding;
  const rx = w / 2;
  const ry = rx / (2.5 + w / 50);
  const h = bbox.height + ry + node.padding;

  let cylinder: d3.Selection<SVGPathElement | SVGGElement, unknown, null, undefined>;
  const { cssStyles, useRough } = node;

  if (useRough) {
    console.log('Cylinder: Inside use useRough');
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
    const pathData = createCylinderPathD(0, 0, w, h, rx, ry);
    const roughNode = rc.path(pathData, options);

    cylinder = shapeSvg.insert(() => roughNode, ':first-child');
    cylinder.attr('class', 'basic label-container');
    if (cssStyles) {
      cylinder.attr('style', cssStyles);
    }
  } else {
    const pathData = createCylinderPathD(0, 0, w, h, rx, ry);
    cylinder = shapeSvg
      .insert('path', ':first-child')
      .attr('d', pathData)
      .attr('class', 'basic label-container')
      .attr('style', cssStyles);
  }

  cylinder.attr('label-offset-y', ry);
  cylinder.attr('transform', `translate(${-w / 2}, ${-(h / 2 + ry)})`);

  updateNodeBounds(node, cylinder);

  node.intersect = function (point) {
    const pos = intersect.rect(node, point);
    const x = pos.x - (node.x ?? 0);

    if (
      rx != 0 &&
      (Math.abs(x) < (node.width ?? 0) / 2 ||
        (Math.abs(x) == (node.width ?? 0) / 2 &&
          Math.abs(pos.y - (node.y ?? 0)) > (node.height ?? 0) / 2 - ry))
    ) {
      let y = ry * ry * (1 - (x * x) / (rx * rx));
      if (y != 0) {
        y = Math.sqrt(y);
      }
      y = ry - y;
      if (point.y - (node.y ?? 0) > 0) {
        y = -y;
      }

      pos.y += y;
    }

    return pos;
  };

  return shapeSvg;
};
