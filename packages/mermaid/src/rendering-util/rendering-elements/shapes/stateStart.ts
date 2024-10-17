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

  // If incoming height & width are present, subtract the padding from them
  // as labelHelper does not take padding into account
  // also check if the width or height is less than minimum default values (50),
  // if so set it to min value
  if (node.width || node.height) {
    if ((node.width ?? 0) < 14) {
      node.width = 14;
    }

    if ((node.height ?? 0) < 14) {
      node.height = 14;
    }
  }

  if (!node.width) {
    node.width = 14;
  }

  if (!node.height) {
    node.width = 14;
  }

  const shapeSvg = parent
    .insert('g')
    .attr('class', 'node default')
    .attr('id', node.domId || node.id);

  let circle: D3Selection<SVGCircleElement> | D3Selection<SVGGElement>;
  if (node.look === 'handDrawn') {
    // @ts-ignore TODO: Fix rough typings
    const rc = rough.svg(shapeSvg);
    const roughNode = rc.circle(0, 0, node.width, solidStateFill(lineColor));
    // @ts-ignore TODO: Fix typings
    circle = shapeSvg.insert(() => roughNode);
    // center the circle around its coordinate
    circle
      .attr('class', 'state-start')
      .attr('r', (node.width ?? 7) / 2)
      .attr('width', node.width ?? 14)
      .attr('height', node.height ?? 14);
  } else {
    circle = shapeSvg.insert('circle', ':first-child');
    // center the circle around its coordinate
    circle
      .attr('class', 'state-start')
      .attr('r', (node.width ?? 7) / 2)
      .attr('width', node.width ?? 14)
      .attr('height', node.height ?? 14);
  }

  updateNodeBounds(node, circle);

  node.intersect = function (point) {
    return intersect.circle(node, (node.width ?? 7) / 2, point);
  };

  return shapeSvg;
}
