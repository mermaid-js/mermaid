import { log } from '$root/logger.js';
import { updateNodeBounds } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import type { SVG } from '$root/diagram-api/types.js';

export const stateEnd = (parent: SVG, node: Node) => {
  const shapeSvg = parent
    .insert('g')
    .attr('class', 'node default')
    .attr('id', node.domId || node.id);
  const innerCircle = shapeSvg.insert('circle', ':first-child');
  const circle = shapeSvg.insert('circle', ':first-child');

  circle.attr('class', 'state-start').attr('r', 7).attr('width', 14).attr('height', 14);

  innerCircle.attr('class', 'state-end').attr('r', 5).attr('width', 10).attr('height', 10);

  updateNodeBounds(node, circle);

  node.intersect = function (point) {
    return intersect.circle(node, 7, point);
  };

  return shapeSvg;
};
