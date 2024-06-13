import { log } from '$root/logger.js';
import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import { userNodeOverrides } from '$root/rendering-util/rendering-elements/shapes/handdrawnStyles.js';
import rough from 'roughjs';
import { insertPolygonShape } from './insertPolygonShape.js';

export const createTrapezoidPathD = (
  x: number,
  y: number,
  width: number,
  height: number
): string => {
  return [
    `M${x - (2 * height) / 6},${y}`,
    `L${x + width + (2 * height) / 6},${y}`,
    `L${x + width - height / 6},${y - height}`,
    `L${x + height / 6},${y - height}`,
    'Z',
  ].join(' ');
};

export const trapezoid = async (parent: SVGAElement, node: Node): Promise<SVGAElement> => {
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node), true);

  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding;
  const points = [
    { x: (-2 * h) / 6, y: 0 },
    { x: w + (2 * h) / 6, y: 0 },
    { x: w - h / 6, y: -h },
    { x: h / 6, y: -h },
  ];

  let polygon: d3.Selection<SVGPolygonElement | SVGGElement, unknown, null, undefined>;
  const { cssStyles } = node;

  if (node.look === 'handdrawn') {
    // @ts-ignore - rough is not typed
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});
    const pathData = createTrapezoidPathD(0, 0, w, h);
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

  if (cssStyles) {
    polygon.attr('style', cssStyles);
  }

  node.width = w;
  node.height = h;

  updateNodeBounds(node, polygon);

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
};
