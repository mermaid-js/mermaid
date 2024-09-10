import { log } from '../../../logger.js';
import { labelHelper, updateNodeBounds, getNodeClasses, createPathFromPoints } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../../rendering-util/types.d.ts';
import { userNodeOverrides } from '../../../rendering-util/rendering-elements/shapes/handDrawnShapeStyles.js';
import rough from 'roughjs';

export const hourglass = async (parent: SVGAElement, node: Node) => {
  node.label = '';
  const { shapeSvg } = await labelHelper(parent, node, getNodeClasses(node));

  const w = Math.max(30, node?.width ?? 0);
  const h = Math.max(30, node?.height ?? 0);

  const { cssStyles } = node;
  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const points = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: 0, y: h },
    { x: w, y: h },
  ];

  const pathData = createPathFromPoints(points);
  const shapeNode = rc.path(pathData, options);
  const polygon = shapeSvg.insert(() => shapeNode, ':first-child');
  polygon.attr('class', 'basic label-container');

  if (cssStyles && node.look !== 'handDrawn') {
    polygon.selectChildren('path').attr('style', cssStyles);
  }

  polygon.attr('transform', `translate(${-w / 2}, ${-h / 2})`);

  updateNodeBounds(node, polygon);

  node.intersect = function (point) {
    log.info('Pill intersect', node, { points });
    const pos = intersect.polygon(node, points, point);
    return pos;
  };

  return shapeSvg;
};
