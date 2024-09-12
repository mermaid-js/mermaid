import { log } from '../../../logger.js';
import { getNodeClasses, labelHelper, updateNodeBounds } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import rough from 'roughjs';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';

export const note = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));
  const totalWidth = Math.max(bbox.width + (node.padding ?? 0) * 2, node?.width ?? 0);
  const totalHeight = Math.max(bbox.height + (node.padding ?? 0) * 2, node?.height ?? 0);
  const x = -totalWidth / 2;
  const y = -totalHeight / 2;
  const { cssStyles } = node;
  const useHtmlLabels = node.useHtmlLabels;
  if (!useHtmlLabels) {
    node.centerLabel = true;
  }

  log.info('Classes = ', node.cssClasses);
  // add the rect
  // @ts-ignore TODO: Fix rough typings
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const noteShapeNode = rc.rectangle(x, y, totalWidth, totalHeight, options);

  const rect = shapeSvg.insert(() => noteShapeNode, ':first-child');
  rect.attr('class', 'basic label-container');

  if (cssStyles && node.look !== 'handDrawn') {
    rect.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    rect.selectAll('path').attr('style', nodeStyles);
  }

  updateNodeBounds(node, rect);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
};
