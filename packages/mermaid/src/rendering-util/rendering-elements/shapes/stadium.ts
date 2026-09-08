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

const arcPointCount = 50;

const stadiumDimensions = (
  bbox: Pick<DOMRect, 'width' | 'height'>,
  paddingX: number,
  paddingY: number
) => {
  const h = bbox.height + paddingY;
  // The sampled arcs sit just inside the circles. Use their inscribed circle
  // for label clearance, and account for the missing horizontal extrema when
  // enforcing the outer aspect ratio.
  const inscribedDiameter = h * Math.cos(Math.PI / (2 * (arcPointCount - 1)));
  const capWidthAtLabel = Math.sqrt(Math.max(0, inscribedDiameter ** 2 - bbox.height ** 2));
  const w = Math.max(
    bbox.width + h / 4 + paddingX,
    1.5 * h + (h - inscribedDiameter),
    bbox.width + paddingX + h - capWidthAtLabel
  );
  return { w, h };
};

export async function stadium<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const nodePadding = node.padding ?? 0;
  const paddingX = node.look === 'neo' ? 40 : nodePadding;
  const paddingY = node.look === 'neo' ? 24 : nodePadding;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));
  const { w, h } = stadiumDimensions(bbox, paddingX, paddingY);

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
    ...generateCirclePoints(-w / 2 + radius, 0, radius, arcPointCount, 90, 270),
    { x: w / 2 - radius, y: h / 2 },
    ...generateCirclePoints(w / 2 - radius, 0, radius, arcPointCount, 270, 450),
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
