import { log } from '$root/logger.js';
import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import {
  styles2String,
  userNodeOverrides,
} from '$root/rendering-util/rendering-elements/shapes/handDrawnShapeStyles.js';
import rough from 'roughjs';
import { createPathFromPoints } from './util.js';

export const triangle = async (parent: SVGAElement, node: Node): Promise<SVGAElement> => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const w = bbox.width + node.padding + 20;
  const h = (Math.sqrt(3) / 2) * w + (node.padding ?? 0);
  const points = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w / 2, y: -h },
  ];

  const { cssStyles } = node;

  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});
  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }
  const pathData = createPathFromPoints(points);
  const roughNode = rc.path(pathData, options);

  const polygon = shapeSvg
    .insert(() => roughNode, ':first-child')
    .attr('transform', `translate(${-w / 2}, ${h / 2})`);

  if (cssStyles) {
    polygon.attr('style', cssStyles);
  }

  if (nodeStyles) {
    polygon.attr('style', nodeStyles);
  }

  node.width = w;
  node.height = h;

  updateNodeBounds(node, polygon);

  label.attr('transform', `translate(${-bbox.width / 2}, ${h / 2 - bbox.height})`);

  node.intersect = function (point) {
    log.info('Triangle intersect', node, points, point);
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
};
