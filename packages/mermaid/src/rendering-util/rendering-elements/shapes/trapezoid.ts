import { labelHelper, updateNodeBounds, getNodeClasses, createPathFromPoints } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import { insertPolygonShape } from './insertPolygonShape.js';
import type { D3Selection } from '../../../types.js';

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

export async function trapezoid<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding;
  const points = [
    { x: (-3 * h) / 6, y: 0 },
    { x: w + (3 * h) / 6, y: 0 },
    { x: w, y: -h },
    { x: 0, y: -h },
  ];

  let polygon: typeof shapeSvg | ReturnType<typeof insertPolygonShape>;
  const { cssStyles } = node;

  if (node.look === 'handDrawn') {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
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
}
