import { labelHelper, getNodeClasses, updateNodeBounds, createPathFromPoints } from './util.js';
import type { Node } from '../../types.ts';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';

/// The width/height of the tag in comparison to the height of the node
const TAG_RATIO = 0.2;

export const taggedRect = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const nodePadding = node.padding ?? 0;
  const labelPaddingX = node.look === 'neo' ? nodePadding * 2 : nodePadding;
  const labelPaddingY = node.look === 'neo' ? nodePadding * 1 : nodePadding;

  // If incoming height & width are present, subtract the padding from them
  // as labelHelper does not take padding into account
  // also check if the width or height is less than minimum default values (50),
  // if so set it to min value
  if (node.width || node.height) {
    node.height = Math.max((node?.height ?? 0) - labelPaddingY * 2, 10);
    node.width = Math.max(
      (node?.width ?? 0) - labelPaddingX * 2 - TAG_RATIO * (node.height + labelPaddingY * 2),
      10
    );
  }

  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  const totalHeight = (node?.height ? node?.height : bbox.height) + labelPaddingY * 2;
  const tagWidth = TAG_RATIO * totalHeight;
  const tagHeight = TAG_RATIO * totalHeight;
  const totalWidth = (node?.width ? node?.width : bbox.width) + labelPaddingX * 2 + tagWidth;

  const w = totalWidth - tagWidth;
  const h = totalHeight;
  const x = -w / 2;
  const y = -h / 2;

  const { cssStyles } = node;

  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  const rectPoints = [
    { x: x - tagWidth / 2, y },
    { x: x + w + tagWidth / 2, y },
    { x: x + w + tagWidth / 2, y: y + h },
    { x: x - tagWidth / 2, y: y + h },
  ];

  const tagPoints = [
    { x: x + w - tagWidth / 2, y: y + h },
    { x: x + w + tagWidth / 2, y: y + h },
    { x: x + w + tagWidth / 2, y: y + h - tagHeight },
  ];

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const rectPath = createPathFromPoints(rectPoints);
  const rectNode = rc.path(rectPath, options);

  const tagPath = createPathFromPoints(tagPoints);
  const tagNode = rc.path(tagPath, { ...options, fillStyle: 'solid' });

  const taggedRect = shapeSvg.insert(() => tagNode, ':first-child');
  taggedRect.insert(() => rectNode, ':first-child');

  taggedRect.attr('class', 'basic label-container');

  if (cssStyles && node.look !== 'handDrawn') {
    taggedRect.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    taggedRect.selectAll('path').attr('style', nodeStyles);
  }

  updateNodeBounds(node, taggedRect);

  node.intersect = function (point) {
    const pos = intersect.polygon(node, rectPoints, point);

    return pos;
  };

  return shapeSvg;
};
