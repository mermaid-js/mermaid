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

  // If incoming height & width are present, subtract the padding from them
  // as labelHelper does not take padding into account
  // also check if the width or height is less than minimum default values (50),
  // if so set it to min value
  if (node.width || node.height) {
    if ((node.width ?? 0) < 50) {
      node.width = 50;
    }

    if ((node.height ?? 0) < 50) {
      node.height = 50;
    }
  }

  if (!node.width) {
    node.width = 50;
  }

  if (!node.height) {
    node.width = 50;
  }

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
