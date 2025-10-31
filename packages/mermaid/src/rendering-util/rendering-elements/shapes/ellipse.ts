import rough from 'roughjs';
import type { Bounds, D3Selection, Point } from '../../../types.js';
import type { Node } from '../../types.js';
import intersect from '../intersect/index.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import { getNodeClasses, labelHelper, updateNodeBounds } from './util.js';

export async function ellipse<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, halfPadding } = await labelHelper(parent, node, getNodeClasses(node));

  // Calculate ellipse dimensions with padding
  const padding = halfPadding ?? 10;
  const radiusX = bbox.width / 2 + padding * 2;
  const radiusY = bbox.height / 2 + padding;

  let ellipseElem;
  const { cssStyles } = node;

  if (node.look === 'handDrawn') {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});
    const roughNode = rc.ellipse(0, 0, radiusX * 2, radiusY * 2, options);

    ellipseElem = shapeSvg.insert(() => roughNode, ':first-child');
    ellipseElem.attr('class', 'basic label-container');

    if (cssStyles) {
      ellipseElem.attr('style', cssStyles);
    }
  } else {
    ellipseElem = shapeSvg
      .insert('ellipse', ':first-child')
      .attr('class', 'basic label-container')
      .attr('style', nodeStyles)
      .attr('rx', radiusX)
      .attr('ry', radiusY)
      .attr('cx', 0)
      .attr('cy', 0);
  }

  node.width = radiusX * 2;
  node.height = radiusY * 2;

  updateNodeBounds(node, ellipseElem);

  node.calcIntersect = function (bounds: Bounds, point: Point) {
    const rx = bounds.width / 2;
    const ry = bounds.height / 2;
    return intersect.ellipse(bounds, rx, ry, point);
  };

  node.intersect = function (point) {
    return intersect.ellipse(node, radiusX, radiusY, point);
  };

  return shapeSvg;
}
