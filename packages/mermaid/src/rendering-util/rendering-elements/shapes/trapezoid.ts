import { labelHelper, updateNodeBounds, getNodeClasses, createPathFromPoints } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import { insertPolygonShape } from './insertPolygonShape.js';

// export const createTrapezoidPathD = (
//   x: number,
//   y: number,
//   width: number,
//   height: number
// ): string => {
//   return [
//     `M${x - (2 * height) / 6},${y}`,
//     `L${x + width + (2 * height) / 6},${y}`,
//     `L${x + width - height / 6},${y - height}`,
//     `L${x + height / 6},${y - height}`,
//     'Z',
//   ].join(' ');
// };

export const trapezoid = async (parent: SVGAElement, node: Node): Promise<SVGAElement> => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const nodePadding = node.padding ?? 0;
  const labelPaddingY = node.look === 'neo' ? nodePadding * 1.5 : nodePadding;

  if (node.width || node.height) {
    node.width = node?.width ?? 0;
    if (node.width < 10) {
      node.width = 10;
    }

    node.height = node?.height ?? 0;
    if (node.height < 10) {
      node.height = 10;
    }
    const _dx = (3 * node.height) / 6;
    node.height = node.height - labelPaddingY;
    node.width = node.width - 2 * _dx;
  }
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));
  const h = (node?.height ? node?.height : bbox.height) + labelPaddingY;
  const w = node?.width ? node?.width : bbox.width;

  const points = [
    { x: (-3 * h) / 6, y: 0 },
    { x: w + (3 * h) / 6, y: 0 },
    { x: w, y: -h },
    { x: 0, y: -h },
  ];

  let polygon: d3.Selection<SVGPolygonElement | SVGGElement, unknown, null, undefined>;
  const { cssStyles } = node;

  if (node.look === 'handDrawn') {
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});
    const pathData = createPathFromPoints(points);
    const roughNode = rc.path(pathData, options);

    polygon = shapeSvg
      .insert(() => roughNode, ':first-child')
      .attr('transform', `translate(${-w / 2}, ${h / 2})`);

    if (cssStyles) {
      polygon.attr('style', cssStyles);
    }
  } else {
    polygon = insertPolygonShape(shapeSvg, w, h, points);
  }

  if (nodeStyles) {
    polygon.attr('style', nodeStyles);
  }

  node.width = w;
  node.height = h;

  updateNodeBounds(node, polygon);

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
};
