import { labelHelper, updateNodeBounds, getNodeClasses, createPathFromPoints } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import { insertPolygonShape } from './insertPolygonShape.js';

export const lean_left = async (parent: SVGAElement, node: Node): Promise<SVGAElement> => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const nodePadding = node.padding ?? 0;
  const labelPaddingY = node.look === 'neo' ? nodePadding * 1.5 : nodePadding;

  if (node.width || node.height) {
    node.width = node?.width ?? 0;
    if (node.width < 50) {
      node.width = 50;
    }

    node.height = node?.height ?? 0;
    if (node.height < 50) {
      node.height = 50;
    }
    const _dx = (3 * node.height) / 6;
    node.height = node.height - labelPaddingY;
    node.width = node.width - 2 * _dx;
  }

  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));
  const h = Math.max(bbox.height, node?.height ?? 0) + labelPaddingY;
  const w = Math.max(bbox.width, node?.width ?? 0);
  const points = [
    { x: 0, y: 0 },
    { x: w + (3 * h) / 6, y: 0 },
    { x: w, y: -h },
    { x: -(3 * h) / 6, y: -h },
  ];

  let polygon: d3.Selection<SVGPolygonElement | SVGGElement, unknown, null, undefined>;
  const { cssStyles } = node;

  if (node.look === 'handDrawn') {
    // @ts-ignore - rough is not typed
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});
    const pathData = createPathFromPoints(points);
    // const pathData = createLeanLeftPathD(0, 0, w, h);
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
