import { log } from '$root/logger.js';
import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import {
  styles2String,
  userNodeOverrides,
} from '$root/rendering-util/rendering-elements/shapes/handdrawnStyles.js';
import rough from 'roughjs';

export const anchor = async (parent: SVGAElement, node: Node): Promise<SVGAElement> => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  // const { shapeSvg, bbox, halfPadding } = await labelHelper(parent, node, getNodeClasses(node));
  const classes = getNodeClasses(node);
  let cssClasses = classes;
  if (!classes) {
    cssClasses = 'anchor';
  }
  const shapeSvg = parent
    .insert('g')
    .attr('class', cssClasses)
    .attr('id', node.domId || node.id);

  const radius = 1;
  let circleElem;
  const { cssStyles } = node;

  // if (node.look === 'handdrawn') {
  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, { fill: 'black', stroke: 'none', fillStyle: 'solid' });

  if (node.look !== 'handdrawn') {
    options.roughness = 0;
  }
  const roughNode = rc.circle(0, 0, radius * 2, options);

  console.log('IPI roughNode:', options);

  circleElem = shapeSvg.insert(() => roughNode, ':first-child');
  circleElem.attr('class', 'anchor').attr('style', cssStyles);
  // } else {
  //   circleElem = shapeSvg
  //     .insert('circle', ':first-child')
  //     .attr('class', 'basic label-container')
  //     .attr('style', nodeStyles)
  //     .attr('r', radius)
  //     .attr('cx', 0)
  //     .attr('cy', 0);
  // }

  updateNodeBounds(node, circleElem);

  node.intersect = function (point) {
    log.info('Circle intersect', node, radius, point);
    return intersect.circle(node, radius, point);
  };

  return shapeSvg;
};
