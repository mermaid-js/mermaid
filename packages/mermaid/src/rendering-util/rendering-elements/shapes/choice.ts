import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import type { SVG } from '$root/diagram-api/types.js';
import rough from 'roughjs';
import { solidStateFill } from './handdrawnStyles.js';

export const choice = (parent: SVG, node: Node) => {
  const shapeSvg = parent
    .insert('g')
    .attr('class', 'node default')
    .attr('id', node.domId || node.id);

  const s = 28;
  const points = [
    { x: 0, y: s / 2 },
    { x: s / 2, y: 0 },
    { x: 0, y: -s / 2 },
    { x: -s / 2, y: 0 },
  ];

  let choice;
  if (node.useRough) {
    const rc = rough.svg(shapeSvg);
    const pointArr = points.map(function (d) {
      return [d.x, d.y];
    });
    const roughNode = rc.polygon(pointArr, solidStateFill('black'));
    choice = shapeSvg.insert(() => roughNode);
  } else {
    choice = shapeSvg.insert('polygon', ':first-child').attr(
      'points',
      points
        .map(function (d) {
          return d.x + ',' + d.y;
        })
        .join(' ')
    );
  }

  // center the circle around its coordinate
  choice.attr('class', 'state-start').attr('r', 7).attr('width', 28).attr('height', 28);
  node.width = 28;
  node.height = 28;

  node.intersect = function (point) {
    return intersect.circle(node, 14, point);
  };

  return shapeSvg;
};
