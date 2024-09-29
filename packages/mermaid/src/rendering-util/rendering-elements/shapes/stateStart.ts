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

  let circle: d3.Selection<SVGCircleElement, unknown, Element | null, unknown>;
  if (node.look === 'handDrawn') {
    // @ts-ignore TODO: Fix rough typings
    const rc = rough.svg(shapeSvg);
    const roughNode = rc.circle(0, 0, node.width, solidStateFill(lineColor));
    circle = shapeSvg.insert(() => roughNode);
  } else {
    circle = shapeSvg.insert('circle', ':first-child');
  }

  // center the circle around its coordinate
  // @ts-ignore TODO: Fix typings
  circle
    .attr('class', 'state-start')
    .attr('r', (node.width ?? 0) / 2)
    .attr('width', node.width ?? 0)
    .attr('height', node.height ?? 0);

  updateNodeBounds(node, circle);

  node.intersect = function (point) {
    return intersect.circle(node, 7, point);
  };

  return shapeSvg;
};
