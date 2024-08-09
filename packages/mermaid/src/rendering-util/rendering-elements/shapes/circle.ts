import { log } from '$root/logger.js';
import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import {
  styles2String,
  userNodeOverrides,
} from '$root/rendering-util/rendering-elements/shapes/handDrawnStyles.js';
import rough from 'roughjs';

export const circle = async (parent: SVGAElement, node: Node): Promise<SVGAElement> => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, halfPadding } = await labelHelper(parent, node, getNodeClasses(node));

  const radius = bbox.width / 2 + halfPadding;
  let circleElem;
  const { cssStyles } = node;

  if (node.look === 'handDrawn') {
    // @ts-ignore - rough is not typed
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});
    const roughNode = rc.circle(0, 0, radius * 2, options);

    circleElem = shapeSvg.insert(() => roughNode, ':first-child');
    circleElem.attr('class', 'basic label-container').attr('style', cssStyles);
  } else {
    circleElem = shapeSvg
      .insert('circle', ':first-child')
      .attr('class', 'basic label-container')
      .attr('style', nodeStyles)
      .attr('r', radius)
      .attr('cx', 0)
      .attr('cy', 0);
  }

  updateNodeBounds(node, circleElem);

  node.intersect = function (point) {
    log.info('Circle intersect', node, radius, point);
    return intersect.circle(node, radius, point);
  };

  return shapeSvg;
};
