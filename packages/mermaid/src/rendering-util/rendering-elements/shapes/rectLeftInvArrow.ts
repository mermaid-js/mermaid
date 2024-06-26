import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import {
  styles2String,
  userNodeOverrides,
} from '$root/rendering-util/rendering-elements/shapes/handdrawnStyles.js';
import rough from 'roughjs';
import { insertPolygonShape } from './insertPolygonShape.js';

export const createPolygonPathD = (x: number, y: number, width: number, height: number): string => {
  return [
    `M${x - height / 2},${y}`,
    `L${x + width},${y}`,
    `L${x + width},${y - height}`,
    `L${x - height / 2},${y - height}`,
    `L${x},${y - height / 2}`,
    'Z',
  ].join(' ');
};

export const rect_left_inv_arrow = async (
  parent: SVGAElement,
  node: Node
): Promise<SVGAElement> => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));
  const labelPaddingX = node.look === 'neo' ? node.padding * 3 : node.padding;
  const labelPaddingY = node.look === 'neo' ? node.padding * 1.5 : node.padding;
  const w = bbox.width + labelPaddingY;
  const h = bbox.height + labelPaddingX;
  const points = [
    { x: -h / 2, y: 0 },
    { x: w, y: 0 },
    { x: w, y: -h },
    { x: -h / 2, y: -h },
    { x: 0, y: -h / 2 },
  ];

  let polygon;
  const { cssStyles } = node;

  if (node.look === 'handdrawn') {
    // @ts-ignore - rough is not typed
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});
    const pathData = createPolygonPathD(0, 0, w, h);
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
  node.width = w + h;
  node.height = h;

  updateNodeBounds(node, polygon);

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
};
