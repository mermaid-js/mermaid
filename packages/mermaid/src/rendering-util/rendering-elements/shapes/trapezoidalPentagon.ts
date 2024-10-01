import { labelHelper, updateNodeBounds, getNodeClasses, createPathFromPoints } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.d.ts';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';

export const trapezoidalPentagon = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const nodePadding = node.padding ?? 0;
  const labelPaddingX = node.look === 'neo' ? nodePadding * 2 : nodePadding;
  const labelPaddingY = node.look === 'neo' ? nodePadding * 1 : nodePadding;
  const minWidth = 15,
    minHeight = 5;
  if (node.width || node.height) {
    node.height = (node.height ?? 0) - labelPaddingY * 2;
    if (node.height < minHeight) {
      node.height = minHeight;
    }

    node.width = (node.width ?? 0) - labelPaddingX * 2;
    if (node.width < minWidth) {
      node.width = minWidth;
    }
  }

  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  const w = (node?.width ? node?.width : Math.max(minWidth, bbox.width)) + (labelPaddingX ?? 0) * 2;
  const h =
    (node?.height ? node?.height : Math.max(minHeight, bbox.height)) + (labelPaddingY ?? 0) * 2;

  const { cssStyles } = node;
  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const points = [
    { x: (-w / 2) * 0.8, y: -h / 2 },
    { x: (w / 2) * 0.8, y: -h / 2 },
    { x: w / 2, y: (-h / 2) * 0.6 },
    { x: w / 2, y: h / 2 },
    { x: -w / 2, y: h / 2 },
    { x: -w / 2, y: (-h / 2) * 0.6 },
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

  updateNodeBounds(node, polygon);

  node.intersect = function (point) {
    const pos = intersect.polygon(node, points, point);
    return pos;
  };

  return shapeSvg;
};
