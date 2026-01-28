import {
  labelHelper,
  updateNodeBounds,
  getNodeClasses,
  generateCirclePoints,
  createPathFromPoints,
} from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';

export const createStadiumPathD = (
  x: number,
  y: number,
  totalWidth: number,
  totalHeight: number
) => {
  const radius = totalHeight / 2;
  return [
    'M',
    x + radius,
    y, // Move to the start of the top-left arc
    'H',
    x + totalWidth - radius, // Draw horizontal line to the start of the top-right arc
    'A',
    radius,
    radius,
    0,
    0,
    1,
    x + totalWidth,
    y + radius, // Draw top-right arc
    'H',
    x, // Draw horizontal line to the start of the bottom-right arc
    'A',
    radius,
    radius,
    0,
    0,
    1,
    x + totalWidth - radius,
    y + totalHeight, // Draw bottom-right arc
    'H',
    x + radius, // Draw horizontal line to the start of the bottom-left arc
    'A',
    radius,
    radius,
    0,
    0,
    1,
    x,
    y + radius, // Draw bottom-left arc
    'Z', // Close the path
  ].join(' ');
};

export async function stadium<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const nodePadding = node.padding ?? 0;
  const labelPaddingX = node.look === 'neo' ? 20 : nodePadding;
  const labelPaddingY = node.look === 'neo' ? 12 : nodePadding;
  // If incoming height & width are present, subtract the padding from them
  // as labelHelper does not take padding into account
  // also check if the width or height is less than minimum default values (50),
  // if so set it to min value
  if (node.width || node.height) {
    node.width = (node?.width ?? 0) - labelPaddingX * 2;
    if (node.width < 10) {
      node.width = 10;
    }

    node.height = (node?.height ?? 0) - labelPaddingY * 2;
    if (node.height < 10) {
      node.height = 10;
    }
  }
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  // const h = Math.max(bbox.height, node?.height || 0) + labelPaddingY;
  // const w = Math.max(bbox.width + h / 4, node?.width || 0, 150) + labelPaddingX;

  const w = (node?.width ? node?.width : bbox.width) + labelPaddingX * 2;
  const h = (node?.height ? node?.height : bbox.height) + labelPaddingY * 2;

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
    { x: -w / 2 + radius, y: -h / 2 },
    { x: w / 2 - radius, y: -h / 2 },
    ...generateCirclePoints(-w / 2 + radius, 0, radius, 50, 90, 270),
    { x: w / 2 - radius, y: h / 2 },
    ...generateCirclePoints(w / 2 - radius, 0, radius, 50, 270, 450),
  ];

  const pathData = createPathFromPoints(points);
  const shapeNode = rc.path(pathData, options);

  const polygon = shapeSvg.insert(() => shapeNode, ':first-child');
  polygon.attr('class', 'basic label-container outer-path');

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
}
