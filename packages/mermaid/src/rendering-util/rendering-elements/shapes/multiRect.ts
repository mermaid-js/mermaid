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
  const w = Math.max(bbox.width + (node.padding ?? 0) * 2, node?.width ?? 0);
  const h = Math.max(bbox.height + (node.padding ?? 0) * 2, node?.height ?? 0);
  const rectOffset = 5;
  const x = -w / 2;
  const y = -h / 2;
  const { cssStyles } = node;

  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  const outerPathPoints = [
    { x: x - rectOffset, y: y + rectOffset },
    { x: x - rectOffset, y: y + h + rectOffset },
    { x: x + w - rectOffset, y: y + h + rectOffset },
    { x: x + w - rectOffset, y: y + h },
    { x: x + w, y: y + h },
    { x: x + w, y: y + h - rectOffset },
    { x: x + w + rectOffset, y: y + h - rectOffset },
    { x: x + w + rectOffset, y: y - rectOffset },
    { x: x + rectOffset, y: y - rectOffset },
    { x: x + rectOffset, y: y },
    { x, y },
    { x, y: y + rectOffset },
  ];

  const innerPathPoints = [
    { x, y: y + rectOffset },
    { x: x + w - rectOffset, y: y + rectOffset },
    { x: x + w - rectOffset, y: y + h },
    { x: x + w, y: y + h },
    { x: x + w, y },
    { x, y },
  ];

  if (node.look !== 'handdrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const outerPath = createPathFromPoints(outerPathPoints);
  const outerNode = rc.path(outerPath, options);
  const innerPath = createPathFromPoints(innerPathPoints);
  const innerNode = rc.path(innerPath, options);

  const taggedRect = shapeSvg.insert('g', ':first-child');
  taggedRect.insert(() => innerNode, ':first-child');
  taggedRect.insert(() => outerNode, ':first-child');

  taggedRect.attr('class', 'basic label-container');

  if (cssStyles) {
    taggedRect.attr('style', cssStyles);
  }

  if (nodeStyles) {
    taggedRect.attr('style', nodeStyles);
  }

  label.attr(
    'transform',
    `translate(${-(bbox.width / 2) - rectOffset}, ${-(bbox.height / 2) + rectOffset})`
  );

  updateNodeBounds(node, taggedRect);

  node.intersect = function (point) {
    const pos = intersect.polygon(node, outerPathPoints, point);
    return pos;
  };

  return shapeSvg;
};
