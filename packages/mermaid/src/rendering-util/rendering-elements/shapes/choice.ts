import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import type { SVG } from '$root/diagram-api/types.js';
// @ts-ignore TODO: Fix rough typings
import rough from 'roughjs';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import { createPathFromPoints, getNodeClasses, labelHelper } from './util.js';

export const choice = async (parent: SVG, node: Node) => {
  const { nodeStyles } = styles2String(node);
  node.label = '';
  const { shapeSvg } = await labelHelper(parent, node, getNodeClasses(node));
  const { cssStyles } = node;

  const s = Math.max(28, node.width ?? 0);

  const points = [
    { x: 0, y: s / 2 },
    { x: s / 2, y: 0 },
    { x: 0, y: -s / 2 },
    { x: -s / 2, y: 0 },
  ];

  // @ts-ignore TODO: Fix rough typings
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const choicePath = createPathFromPoints(points);
  const roughNode = rc.path(choicePath, options);
  const choiceShape = shapeSvg.insert(() => roughNode, ':first-child');

  choiceShape.attr('class', 'basic label-container');

  if (cssStyles && node.look !== 'handDrawn') {
    choiceShape.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    choiceShape.selectAll('path').attr('style', nodeStyles);
  }

  node.width = 28;
  node.height = 28;

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
};
