import rough from 'roughjs';
import type { Node, ShapeRenderOptions } from '../../types.js';
import intersect from '../intersect/index.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import { updateNodeBounds } from './util.js';
import type { D3Selection } from '../../../types.js';
import type { Bounds, Point } from '../../../types.js';

export function stateEnd<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node,
  { config: { themeVariables } }: ShapeRenderOptions
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { cssStyles } = node;
  const { lineColor, stateBorder, nodeBorder } = themeVariables;
  const shapeSvg = parent
    .insert('g')
    .attr('class', 'node default')
    .attr('id', node.domId || node.id);

  // @ts-ignore TODO: Fix rough typings
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const roughNode = rc.circle(0, 0, 14, {
    ...options,
    stroke: lineColor,
    strokeWidth: 2,
  });
  const innerFill = stateBorder ?? nodeBorder;
  const roughInnerNode = rc.circle(0, 0, 5, {
    ...options,
    fill: innerFill,
    stroke: innerFill,
    strokeWidth: 2,
    fillStyle: 'solid',
  });
  const circle = shapeSvg.insert(() => roughNode, ':first-child');
  circle.insert(() => roughInnerNode);

  if (cssStyles) {
    circle.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles) {
    circle.selectAll('path').attr('style', nodeStyles);
  }

  updateNodeBounds(node, circle);

  node.calcIntersect = function (bounds: Bounds, point: Point) {
    // TODO: Implement intersect for this shape
    const radius = bounds.width / 2;
    return intersect.circle(bounds, radius, point);
  };

  node.intersect = function (point) {
    return intersect.circle(node, 7, point);
  };

  return shapeSvg;
}
