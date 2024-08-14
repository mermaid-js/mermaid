import { log } from '$root/logger.js';
import { labelHelper, getNodeClasses, updateNodeBounds } from './util.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import {
  styles2String,
  userNodeOverrides,
} from '$root/rendering-util/rendering-elements/shapes/handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';

export const filledCircle = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.label = '';
  node.labelStyle = labelStyles;
  const { shapeSvg } = await labelHelper(parent, node, getNodeClasses(node));
  const radius = 4;
  const { cssStyles } = node;

  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const circleNode = rc.circle(0, 0, radius * 2, options);

  const filledCircle = shapeSvg.insert('g', ':first-child');
  filledCircle.insert(() => circleNode, ':first-child');

  filledCircle.attr('class', 'basic label-container');

  if (cssStyles) {
    filledCircle.attr('style', cssStyles);
  }

  if (nodeStyles) {
    filledCircle.attr('style', nodeStyles);
  }

  updateNodeBounds(node, filledCircle);

  node.intersect = function (point) {
    log.info('filledCircle intersect', node, { radius, point });
    const pos = intersect.circle(node, radius, point);
    return pos;
  };

  return shapeSvg;
};
