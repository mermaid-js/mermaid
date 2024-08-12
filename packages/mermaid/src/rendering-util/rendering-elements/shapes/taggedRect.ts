import { labelHelper, getNodeClasses, updateNodeBounds, createPathFromPoints } from './util.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import {
  styles2String,
  userNodeOverrides,
} from '$root/rendering-util/rendering-elements/shapes/handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';

export const taggedRect = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));
  const h = bbox.height + node.padding;
  const w = bbox.width + node.padding;
  const x = -w / 2;
  const y = -h / 2;
  const tagWidth = 0.2 * w;
  const tagHeight = 0.2 * h;
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

  const tagPoints = [
    { x: x + w - tagWidth, y: y + h },
    { x: x + w, y: y + h },
    { x: x + w, y: y + h - tagHeight },
  ];

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const rectPath = createPathFromPoints(rectPoints);
  const rectNode = rc.path(rectPath, options);

  const tagPath = createPathFromPoints(tagPoints);
  const tagNode = rc.path(tagPath, options);

  const taggedRect = shapeSvg.insert('g', ':first-child');
  taggedRect.insert(() => rectNode, ':first-child');
  taggedRect.insert(() => tagNode);

  taggedRect.attr('class', 'basic label-container');

  if (cssStyles) {
    taggedRect.attr('style', cssStyles);
  }

  if (nodeStyles) {
    taggedRect.attr('style', nodeStyles);
  }

  updateNodeBounds(node, taggedRect);

  node.intersect = function (point) {
    const pos = intersect.rect(node, point);

    return pos;
  };

  return shapeSvg;
};
