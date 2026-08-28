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
import { handleUndefinedAttr } from '../../../utils.js';

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
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));
  const h = bbox.height + (node.look === 'neo' ? labelPaddingY * 2 : labelPaddingY);
  const w = bbox.width + h / 4 + (node.look === 'neo' ? labelPaddingX * 2 : labelPaddingX);

  const radius = h / 2;
  const { cssStyles } = node;

  const points = [
    { x: -w / 2 + radius, y: -h / 2 },
    { x: w / 2 - radius, y: -h / 2 },
    ...generateCirclePoints(-w / 2 + radius, 0, radius, 50, 90, 270),
    { x: w / 2 - radius, y: h / 2 },
    ...generateCirclePoints(w / 2 - radius, 0, radius, 50, 270, 450),
  ];

  const pathData = createPathFromPoints(points);
  let polygon;

  if (node.look === 'handDrawn') {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});
    const shapeNode = rc.path(pathData, options);
    polygon = shapeSvg.insert(() => shapeNode, ':first-child');
    polygon.attr('class', 'basic label-container outer-path');
  } else {
    // Rough.js splits paths into segments, which breaks CSS stroke-dasharray on straight sides.
    // Merge cssStyles and nodeStyles into one style attribute; nodeStyles goes last so it wins.
    const combinedStyles = [...(cssStyles ?? []), nodeStyles].filter(Boolean).join(';');
    polygon = shapeSvg
      .insert('path', ':first-child')
      .attr('d', pathData)
      .attr('class', 'basic label-container outer-path')
      .attr('style', handleUndefinedAttr(combinedStyles || undefined));
  }

  updateNodeBounds(node, polygon);

  node.intersect = function (point) {
    const pos = intersect.polygon(node, points, point);
    return pos;
  };

  return shapeSvg;
}
