import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import type { SVG } from '$root/diagram-api/types.js';
// @ts-ignore TODO: Fix rough typings
import rough from 'roughjs';
import { solidStateFill, styles2String } from './handDrawnShapeStyles.js';
import { getConfig } from '$root/diagram-api/diagramAPI.js';

export const choice = (parent: SVG, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { themeVariables } = getConfig();
  const { lineColor } = themeVariables;
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
  if (node.look === 'handDrawn') {
    // @ts-ignore TODO: Fix rough typings
    const rc = rough.svg(shapeSvg);
    const pointArr = points.map(function (d) {
      return [d.x, d.y];
    });
    const roughNode = rc.polygon(pointArr, solidStateFill(lineColor));
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
  choice
    .attr('class', 'state-start')
    // @ts-ignore TODO: Fix rough typings
    .attr('r', 7)
    .attr('width', 28)
    .attr('height', 28)
    .attr('style', nodeStyles);

  node.width = 28;
  node.height = 28;

  node.intersect = function (point) {
    return intersect.circle(node, 14, point);
  };

  return shapeSvg;
};
