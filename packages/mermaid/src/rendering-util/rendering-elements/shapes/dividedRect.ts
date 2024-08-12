import { labelHelper, updateNodeBounds, getNodeClasses, createPathFromPoints } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import {
  styles2String,
  userNodeOverrides,
} from '$root/rendering-util/rendering-elements/shapes/handDrawnShapeStyles.js';
import rough from 'roughjs';

export function createDividedRectPathD(
  x: number,
  y: number,
  totalWidth: number,
  totalHeight: number
) {
  const w = totalWidth;
  const firstRectHeight = totalHeight * 0.3;
  const secondRectHeight = totalHeight * 0.6 + firstRectHeight;

  const rect1stPoints = [
    { x: x, y },
    { x: x + w, y },
    { x: x + w, y: y + firstRectHeight },
    { x: x, y: y + firstRectHeight },
  ];

  const rect2ndPoints = [
    { x: x, y: y + firstRectHeight },
    { x: x + w, y: y + firstRectHeight },
    { x: x + w, y: y + firstRectHeight + secondRectHeight },
    { x: x, y: y + firstRectHeight + secondRectHeight },
  ];
  const rect1stPath = createPathFromPoints(rect1stPoints);
  const rect2ndPath = createPathFromPoints(rect2ndPoints);
  const finalPath = `${rect1stPath} ${rect2ndPath}`;
  return finalPath;
}

export const dividedRect = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));
  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding;

  const { cssStyles } = node;

  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});
  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }
  const pathData = createDividedRectPathD(0, 0, w, h);
  const shapeNode = rc.path(pathData, options);

  const polygon = shapeSvg.insert(() => shapeNode, ':first-child');
  polygon.attr('class', 'basic label-container');

  if (cssStyles) {
    polygon.attr('style', cssStyles);
  }
  if (nodeStyles) {
    polygon.attr('style', nodeStyles);
  }

  polygon.attr('transform', `translate(${-w / 2}, ${-h / 1.3})`);

  updateNodeBounds(node, polygon);

  node.intersect = function (point) {
    const pos = intersect.polygon(node, point);
    return pos;
  };

  return shapeSvg;
};
