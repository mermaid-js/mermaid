import { labelHelper, updateNodeBounds, getNodeClasses, createPathFromPoints } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import {
  styles2String,
  userNodeOverrides,
} from '$root/rendering-util/rendering-elements/shapes/handDrawnShapeStyles.js';
import rough from 'roughjs';
import { insertPolygonShape } from './insertPolygonShape.js';

// export const createInvertedTrapezoidPathD = (
//   x: number,
//   y: number,
//   width: number,
//   height: number
// ): string => {
//   return [
//     `M${x + height / 6},${y}`,
//     `L${x + width - height / 6},${y}`,
//     `L${x + width + (2 * height) / 6},${y - height}`,
//     `L${x - (2 * height) / 6},${y - height}`,
//     'Z',
//   ].join(' ');
// };

export const inv_trapezoid = async (parent: SVGAElement, node: Node): Promise<SVGAElement> => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));
  const nodePadding = node.padding ?? 0;
  const labelPaddingX = node.look === 'neo' ? nodePadding * 3 : nodePadding * 2;
  const labelPaddingY = node.look === 'neo' ? nodePadding * 1.5 : nodePadding * 2;

  const w = Math.max(bbox.width + labelPaddingY, node?.width ?? 0);
  const h = Math.max(bbox.height + labelPaddingX, node?.height ?? 0);

  const points = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w + (3 * h) / 6, y: -h },
    { x: (-3 * h) / 6, y: -h },
  ];

  let polygon: d3.Selection<SVGPolygonElement | SVGGElement, unknown, null, undefined>;
  const { cssStyles } = node;

  if (node.look === 'handDrawn') {
    // @ts-ignore - rough is not typed
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});
    const pathData = createPathFromPoints(points);
    // const pathData = createInvertedTrapezoidPathD(0, 0, w, h);
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
