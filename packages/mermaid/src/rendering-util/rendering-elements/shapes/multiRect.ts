import { labelHelper, getNodeClasses, updateNodeBounds, createPathFromPoints } from './util.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import {
  styles2String,
  userNodeOverrides,
} from '$root/rendering-util/rendering-elements/shapes/handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';

export const multiRect = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));
  const h = bbox.height + node.padding;
  const w = bbox.width + node.padding;
  const x = -w / 2;
  const y = -h / 2;
  const rectOffset = 5;
  const { cssStyles } = node;

  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  const rectPoints = [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ];
  const secondRectPoints = [
    { x: x + rectOffset, y: y - rectOffset },
    { x: x + w + rectOffset, y: y - rectOffset },
    { x: x + w + rectOffset, y: y + h - rectOffset },
    { x: x + rectOffset, y: y + h - rectOffset },
  ];
  const thirdRectPoints = [
    { x: x + 2 * rectOffset, y: y - 2 * rectOffset },
    { x: x + w + 2 * rectOffset, y: y - 2 * rectOffset },
    { x: x + w + 2 * rectOffset, y: y + h - 2 * rectOffset },
    { x: x + 2 * rectOffset, y: y + h - 2 * rectOffset },
  ];

  if (node.look !== 'handdrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const rectPath = createPathFromPoints(rectPoints);
  const rectNode = rc.path(rectPath, options);

  const secondRectPath = createPathFromPoints(secondRectPoints);
  const secondRectNode = rc.path(secondRectPath, options);

  const thirdRectPath = createPathFromPoints(thirdRectPoints);
  const thirdRectNode = rc.path(thirdRectPath, options);

  const taggedRect = shapeSvg.insert('g', ':first-child');
  taggedRect.insert(() => thirdRectNode, ':first-child');
  taggedRect.insert(() => secondRectNode);
  taggedRect.insert(() => rectNode);

  taggedRect.attr('class', 'basic label-container');

  if (cssStyles) {
    taggedRect.attr('style', cssStyles);
  }

  if (nodeStyles) {
    taggedRect.attr('style', nodeStyles);
  }

  taggedRect.attr('transform', `translate(-${rectOffset},${rectOffset})`);
  label.attr(
    'transform',
    `translate(${-(bbox.width / 2) - rectOffset}, ${h / 2 - bbox.height - rectOffset})`
  );

  updateNodeBounds(node, taggedRect);

  node.intersect = function (point) {
    const pos = intersect.rect(node, point);
    return pos;
  };

  return shapeSvg;
};
