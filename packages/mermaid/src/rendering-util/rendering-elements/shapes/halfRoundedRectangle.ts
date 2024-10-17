import { log } from '../../../logger.js';
import {
  labelHelper,
  updateNodeBounds,
  getNodeClasses,
  createPathFromPoints,
  generateCirclePoints,
} from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';

export async function halfRoundedRectangle<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const minWidth = 15,
    minHeight = 10;

  const paddingX = node.look === 'neo' ? (node.padding ?? 0) * 2 : (node.padding ?? 0);
  const paddingY = node.look === 'neo' ? (node.padding ?? 0) * 1 : (node.padding ?? 0);

  if (node.width || node.height) {
    node.height = (node?.height ?? 0) - paddingY * 2;
    if (node.height < minHeight) {
      node.height = minHeight;
    }

    node.width = (node?.width ?? 0) - paddingX * 2;
    if (node.width < minWidth) {
      node.width = minWidth;
    }
  }

  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  const w = (node?.width ? node?.width : Math.max(minWidth, bbox.width)) + paddingX * 2;
  const h = (node?.height ? node?.height : Math.max(minHeight, bbox.height)) + paddingY * 2;
  const radius = h / 2;
  const { cssStyles } = node;

  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const points = [
    { x: -w / 2, y: -h / 2 },
    { x: w / 2 - radius, y: -h / 2 },
    ...generateCirclePoints(-w / 2 + radius, 0, radius, 50, 90, 270),
    { x: w / 2 - radius, y: h / 2 },
    { x: -w / 2, y: h / 2 },
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

  // label.attr(
  //   'transform',
  //   `translate(${-w / 2 + (node.padding ?? 0) - (bbox.x - (bbox.left ?? 0))}, ${-h / 2 + (node.padding ?? 0) - (bbox.y - (bbox.top ?? 0))})`
  // );

  updateNodeBounds(node, polygon);

  node.intersect = function (point) {
    log.info('Pill intersect', node, { radius, point });
    const pos = intersect.polygon(node, points, point);
    return pos;
  };
  return shapeSvg;
}
