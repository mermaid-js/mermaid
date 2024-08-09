import { labelHelper, updateNodeBounds, getNodeClasses, createPathFromPoints } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import {
  styles2String,
  userNodeOverrides,
} from '$root/rendering-util/rendering-elements/shapes/handdrawnStyles.js';
import rough from 'roughjs';

function createTrapezoidalPentagonPathD(width = 100, height = 80) {
  const topOffset = 30,
    slopeHeight = 15;

  const points = [
    { x: topOffset, y: 0 },
    { x: width - topOffset, y: 0 },
    { x: width, y: slopeHeight },
    { x: width, y: height },
    { x: 0, y: height },
    { x: 0, y: slopeHeight },
  ];
  return createPathFromPoints(points);
}

export const trapezoidalPentagon = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));
  const widthMultiplier = bbox.width < 40 ? 3 : 1.25;
  const w = (bbox.width + node.padding) * widthMultiplier;
  const h = bbox.height + node.padding;

  const { cssStyles } = node;
  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handdrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const pathData = createTrapezoidalPentagonPathD(w, h);
  const shapeNode = rc.path(pathData, options);

  const polygon = shapeSvg.insert(() => shapeNode, ':first-child');
  polygon.attr('class', 'basic label-container');

  if (cssStyles) {
    polygon.attr('style', cssStyles);
  }
  if (nodeStyles) {
    polygon.attr('style', nodeStyles);
  }

  polygon.attr('transform', `translate(${-w / 2}, ${-h / 2})`);

  updateNodeBounds(node, polygon);

  node.intersect = function (point) {
    const pos = intersect.rect(node, point);
    return pos;
  };

  return shapeSvg;
};
