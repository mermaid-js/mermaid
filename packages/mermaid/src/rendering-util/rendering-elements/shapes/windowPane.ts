import { labelHelper, getNodeClasses, updateNodeBounds, createPathFromPoints } from './util.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import {
  styles2String,
  userNodeOverrides,
} from '$root/rendering-util/rendering-elements/shapes/handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';

export const windowPane = async (parent: SVGAElement, node: Node) => {
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
    { x: x - rectOffset, y: y - rectOffset },
    { x: x - rectOffset, y: y + h },
    { x: x + w, y: y + h },
    { x: x + w, y: y - rectOffset },
  ];

  const innerPathPoints = [
    { x: x - rectOffset, y },
    { x: x + w, y },
  ];

  const innerSecondPathPoints = [
    { x, y: y - rectOffset },
    { x, y: y + h },
  ];

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const outerPath = createPathFromPoints(outerPathPoints);
  const outerNode = rc.path(outerPath, options);
  const innerPath = createPathFromPoints(innerPathPoints);
  const innerNode = rc.path(innerPath, options);
  const innerSecondPath = createPathFromPoints(innerSecondPathPoints);
  const innerSecondNode = rc.path(innerSecondPath, options);

  const windowPane = shapeSvg.insert(() => innerNode, ':first-child');
  windowPane.insert(() => innerSecondNode, ':first-child');
  windowPane.insert(() => outerNode, ':first-child');
  windowPane.attr('transform', `translate(${rectOffset / 2}, ${rectOffset / 2})`);

  windowPane.attr('class', 'basic label-container');

  if (cssStyles && node.look !== 'handDrawn') {
    windowPane.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    windowPane.selectAll('path').attr('style', nodeStyles);
  }

  label.attr(
    'transform',
    `translate(${-(bbox.width / 2) + rectOffset / 2 - (bbox.x - (bbox.left ?? 0))}, ${-(bbox.height / 2) + rectOffset / 2 - 4 * (bbox.y - (bbox.top ?? 0))})`
  );

  updateNodeBounds(node, windowPane);

  node.intersect = function (point) {
    const pos = intersect.polygon(node, outerPathPoints, point);
    return pos;
  };

  return shapeSvg;
};
