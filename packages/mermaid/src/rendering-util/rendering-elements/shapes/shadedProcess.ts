import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import {
  styles2String,
  userNodeOverrides,
} from '$root/rendering-util/rendering-elements/shapes/handDrawnShapeStyles.js';
import rough from 'roughjs';

export const shadedProcess = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));
  const halfPadding = (node?.padding || 0) / 2;
  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding;
  const x = -bbox.width / 2 - halfPadding;
  const y = -bbox.height / 2 - halfPadding;

  const { cssStyles } = node;
  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const roughNode = rc.rectangle(x - 8, y, w + 16, h, options);
  const l1 = rc.line(x, y, x, y + h, options);

  shapeSvg.insert(() => l1, ':first-child');
  const rect = shapeSvg.insert(() => roughNode, ':first-child');

  rect.attr('class', 'basic label-container').attr('style', cssStyles);

  if (nodeStyles && node.look !== 'handDrawn') {
    rect.selectAll('path').attr('style', nodeStyles);
  }

  if (cssStyles && node.look !== 'handDrawn') {
    rect.selectAll('path').attr('style', nodeStyles);
  }

  updateNodeBounds(node, rect);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
};

export default shadedProcess;
