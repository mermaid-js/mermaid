import { log } from '$root/logger.js';
import { updateNodeBounds } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import type { SVG } from '$root/diagram-api/types.js';
import rough from 'roughjs';
import solidFillOptions from './solidFillOptions.js';

export const stateStart = (parent: SVG, node: Node) => {
  const shapeSvg = parent
    .insert('g')
    .attr('class', 'node default')
    .attr('id', node.domId || node.id);

  let circle;
  if (node.useRough) {
    const rc = rough.svg(shapeSvg);
    const roughNode = rc.circle(0, 0, 14, solidFillOptions);
    circle = shapeSvg.insert(() => roughNode);
  } else {
    circle = shapeSvg.insert('circle', ':first-child');
  }

  // center the circle around its coordinate
  circle.attr('class', 'state-start').attr('r', 7).attr('width', 14).attr('height', 14);

  updateNodeBounds(node, circle);

  node.intersect = function (point) {
    return intersect.circle(node, 7, point);
  };

  return shapeSvg;
};
