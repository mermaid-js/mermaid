import { labelHelper, getNodeClasses, updateNodeBounds, createPathFromPoints } from './util.js';
import type { Node } from '../../types.d.ts';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';

export const multiRect = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));
  const nodePadding = node.padding ?? 0;
  const labelPaddingX = node.look === 'neo' ? nodePadding * 2 : nodePadding;
  const labelPaddingY = node.look === 'neo' ? nodePadding * 1 : nodePadding;
  const w = Math.max(bbox.width + (labelPaddingX ?? 0) * 2, node?.width ?? 0);
  const h = Math.max(bbox.height + (labelPaddingY ?? 0) * 2, node?.height ?? 0);
  const rectOffset = node.look === 'neo' ? 10 : 5;
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

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const outerPath = createPathFromPoints(outerPathPoints);
  const outerNode = rc.path(outerPath, options);
  const innerPath = createPathFromPoints(innerPathPoints);
  const innerNode = rc.path(innerPath, options);

  const multiRect = shapeSvg.insert('g', ':first-child');
  multiRect.insert(() => outerNode);
  multiRect.insert(() => innerNode);

  multiRect.attr('class', 'basic label-container');

  if (cssStyles && node.look !== 'handDrawn') {
    multiRect.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    multiRect.selectAll('path').attr('style', nodeStyles);
  }

  label.attr(
    'transform',
    `translate(${-(bbox.width / 2) - rectOffset - (bbox.x - (bbox.left ?? 0))}, ${-(bbox.height / 2) + rectOffset - (bbox.y - (bbox.top ?? 0))})`
  );

  updateNodeBounds(node, multiRect);

  node.intersect = function (point) {
    const pos = intersect.polygon(node, outerPathPoints, point);
    return pos;
  };

  return shapeSvg;
};
