import { updateNodeBounds } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import type { SVG } from '$root/diagram-api/types.js';
import rough from 'roughjs';
import { solidStateFill } from './handDrawnStyles.js';
import { getConfig } from '$root/diagram-api/diagramAPI.js';

export const stateEnd = (parent: SVG, node: Node) => {
  const { themeVariables } = getConfig();
  const { lineColor } = themeVariables;
  const shapeSvg = parent
    .insert('g')
    .attr('class', 'node default')
    .attr('id', node.domId || node.id);

  let circle;
  let innerCircle;
  if (node.look === 'handDrawn') {
    // @ts-ignore TODO: Fix rough typings
    const rc = rough.svg(shapeSvg);
    const roughNode = rc.circle(0, 0, 14, { ...solidStateFill(lineColor), roughness: 0.5 });
    const roughInnerNode = rc.circle(0, 0, 5, { ...solidStateFill(lineColor), fillStyle: 'solid' });
    circle = shapeSvg.insert(() => roughNode);
    innerCircle = shapeSvg.insert(() => roughInnerNode);
  } else {
    innerCircle = shapeSvg.insert('circle', ':first-child');
    circle = shapeSvg.insert('circle', ':first-child');

    circle.attr('class', 'state-start').attr('r', 7).attr('width', 14).attr('height', 14);

    innerCircle.attr('class', 'state-end').attr('r', 5).attr('width', 10).attr('height', 10);
  }

  updateNodeBounds(node, circle);

  node.intersect = function (point) {
    return intersect.circle(node, 7, point);
  };

  return shapeSvg;
};
