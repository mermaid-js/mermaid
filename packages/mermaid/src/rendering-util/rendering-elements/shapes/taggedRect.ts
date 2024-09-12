import rough from 'roughjs';
import type { Node } from '../../types.d.ts';
import intersect from '../intersect/index.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import { createPathFromPoints, getNodeClasses, labelHelper, updateNodeBounds } from './util.js';

export const taggedRect = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));
  const nodePadding = node.padding ?? 0;
  const labelPaddingX = node.look === 'neo' ? nodePadding * 2 : nodePadding;
  const labelPaddingY = node.look === 'neo' ? nodePadding * 1 : nodePadding;
  const w = Math.max(bbox.width + (labelPaddingX ?? 0) * 2, node?.width ?? 0);
  const h = Math.max(bbox.height + (labelPaddingY ?? 0) * 2, node?.height ?? 0);
  const x = -w / 2;
  const y = -h / 2;
  const tagWidth = 0.2 * h;
  const tagHeight = 0.2 * h;
  const { cssStyles } = node;

  // @ts-ignore - rough is not typed
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
