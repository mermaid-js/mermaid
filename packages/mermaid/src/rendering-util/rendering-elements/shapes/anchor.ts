import { log } from '$root/logger.js';
import { updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import {
  styles2String,
  userNodeOverrides,
} from '$root/rendering-util/rendering-elements/shapes/handDrawnShapeStyles.js';
import rough from 'roughjs';

export const anchor = (parent: SVGAElement, node: Node): Promise<SVGAElement> => {
  const { labelStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const classes = getNodeClasses(node);
  let cssClasses = classes;
  if (!classes) {
    cssClasses = 'anchor';
  }
  const shapeSvg = parent
    // @ts-ignore - SVGElement is not typed
    .insert('g')
    .attr('class', cssClasses)
    .attr('id', node.domId || node.id);

  const radius = 1;

  const { cssStyles } = node;

  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, { fill: 'black', stroke: 'none', fillStyle: 'solid' });

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
  }
  const roughNode = rc.circle(0, 0, radius * 2, options);
  const circleElem = shapeSvg.insert(() => roughNode, ':first-child');
  circleElem.attr('class', 'anchor').attr('style', cssStyles);

  updateNodeBounds(node, circleElem);

  node.intersect = function (point) {
    log.info('Circle intersect', node, radius, point);
    return intersect.circle(node, radius, point);
  };

  return shapeSvg;
};
