import { updateNodeBounds } from './util.js';
import intersect from '../intersect/index.js';
import type { Node, RenderOptions } from '../../types.js';
import type { SVG } from '../../../diagram-api/types.js';
import rough from 'roughjs';
import { solidStateFill } from './handDrawnShapeStyles.js';

export const stateStart = (
  parent: SVG,
  node: Node,
  { config: { themeVariables } }: RenderOptions
) => {
  const { lineColor } = themeVariables;

  const shapeSvg = parent
    .insert('g')
    .attr('class', 'node default')
    .attr('id', node.domId || node.id);

  let circle;
  if (node.look === 'handDrawn') {
    // @ts-ignore TODO: Fix rough typings
    const rc = rough.svg(shapeSvg);
    const roughNode = rc.circle(0, 0, 14, solidStateFill(lineColor));
    circle = shapeSvg.insert(() => roughNode);
  } else {
    circle = shapeSvg.insert('circle', ':first-child');
  }

  // center the circle around its coordinate
  // @ts-ignore TODO: Fix typings
  circle.attr('class', 'state-start').attr('r', 7).attr('width', 14).attr('height', 14);

  updateNodeBounds(node, circle);

  node.intersect = function (point) {
    return intersect.circle(node, 7, point);
  };

  return shapeSvg;
};
