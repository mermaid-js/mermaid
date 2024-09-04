import { labelHelper, updateNodeBounds, getNodeClasses, createPathFromPoints } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import {
  styles2String,
  userNodeOverrides,
} from '$root/rendering-util/rendering-elements/shapes/handDrawnShapeStyles.js';
import rough from 'roughjs';

export const trapezoidalPentagon = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));
  const nodePadding = node.padding ?? 0;
  const labelPaddingX = node.look === 'neo' ? nodePadding * 2 : nodePadding;
  const labelPaddingY = node.look === 'neo' ? nodePadding * 1 : nodePadding;
  const widthMultiplier = bbox.width < 40 ? 3 : 1.25;
  const w = Math.max((bbox.width + labelPaddingX) * widthMultiplier, node?.width ?? 0);
  const h = Math.max(bbox.height + labelPaddingY, node?.height ?? 0);

  const { cssStyles } = node;
  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const topOffset = 30;
  const slopeHeight = 15;

  const points = [
    { x: topOffset, y: 0 },
    { x: w - topOffset, y: 0 },
    { x: w, y: slopeHeight },
    { x: w, y: h },
    { x: 0, y: h },
    { x: 0, y: slopeHeight },
  ];

  const pathData = createPathFromPoints(points);
  const shapeNode = rc.path(pathData, options);

  const polygon = shapeSvg.insert(() => shapeNode, ':first-child');
  polygon.attr('class', 'basic label-container');

  if (cssStyles && node.look !== 'handDrawn') {
    polygon.selectChildren('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    polygon.selectChildren('path').attr('style', nodeStyles);
  }

  polygon.attr('transform', `translate(${-w / 2}, ${-h / 2})`);

  updateNodeBounds(node, polygon);

  node.intersect = function (point) {
    const pos = intersect.polygon(node, points, point);
    return pos;
  };

  return shapeSvg;
};
