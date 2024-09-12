import rough from 'roughjs';
import type { Node } from '../../types.d.ts';
import intersect from '../intersect/index.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import { createPathFromPoints, getNodeClasses, labelHelper, updateNodeBounds } from './util.js';

export const dividedRectangle = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));
  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding;
  const rectOffset = h * 0.2;

  const x = -w / 2;
  const y = -h / 2 - rectOffset / 2;

  const { cssStyles } = node;

  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});
  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const outerPathPoints = [
    { x, y: y },
    { x, y: -y },
    { x: -x, y: -y },
    { x: -x, y: y },
  ];
  const innerPathPoints = [
    { x: x, y: y + rectOffset },
    { x: -x, y: y + rectOffset },
  ];
  const outerPathData = createPathFromPoints(outerPathPoints);
  const outerNode = rc.path(outerPathData, options);
  const innerPathData = createPathFromPoints(innerPathPoints);
  const innerNode = rc.path(innerPathData, options);

  const polygon = shapeSvg.insert(() => outerNode, ':first-child');
  polygon.insert(() => innerNode);
  polygon.attr('class', 'basic label-container');

  if (cssStyles && node.look !== 'handDrawn') {
    polygon.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    polygon.selectAll('path').attr('style', nodeStyles);
  }

  label.attr(
    'transform',
    `translate(${x + (node.padding ?? 0) / 2 - (bbox.x - (bbox.left ?? 0))}, ${y + rectOffset + (node.padding ?? 0) / 2 - (bbox.y - (bbox.top ?? 0))})`
  );

  updateNodeBounds(node, polygon);

  node.intersect = function (point) {
    const pos = intersect.polygon(node, outerPathPoints, point);
    return pos;
  };

  return shapeSvg;
};
