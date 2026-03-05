import rough from 'roughjs';
import type { Node, ShapeRenderOptions } from '../../types.js';
import intersect from '../intersect/index.js';
import { solidStateFill } from './handDrawnShapeStyles.js';
import { updateNodeBounds } from './util.js';
import type { D3Selection } from '../../../types.js';

export function stateStart<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node,
  { config: { themeVariables } }: ShapeRenderOptions
) {
  const { lineColor } = themeVariables;

  const shapeSvg = parent
    .insert('g')
    .attr('class', 'node default')
    .attr('id', node.domId || node.id);

  let circle: D3Selection<SVGCircleElement> | D3Selection<SVGGElement>;
  if (node.look === 'handDrawn') {
    // @ts-ignore TODO: Fix rough typings
    const rc = rough.svg(shapeSvg);
    const roughNode = rc.circle(0, 0, 14, solidStateFill(lineColor));
    circle = shapeSvg.insert(() => roughNode);
    // center the circle around its coordinate
    circle.attr('class', 'state-start').attr('r', 7).attr('width', 14).attr('height', 14);
  } else {
    circle = shapeSvg.insert('circle', ':first-child');
    // center the circle around its coordinate
    circle.attr('class', 'state-start').attr('r', 7).attr('width', 14).attr('height', 14);
  }

  updateNodeBounds(node, circle);

  node.intersect = function (point) {
    return intersect.circle(node, 7, point);
  };

  return shapeSvg;
}
