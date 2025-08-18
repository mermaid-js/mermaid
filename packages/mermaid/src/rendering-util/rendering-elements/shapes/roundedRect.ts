import { labelHelper, updateNodeBounds, getNodeClasses, createPathFromPoints } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';

/**
 * Generates evenly spaced points along an elliptical arc connecting two points.
 *
 * @param x1 - x-coordinate of the start point of the arc
 * @param y1 - y-coordinate of the start point of the arc
 * @param x2 - x-coordinate of the end point of the arc
 * @param y2 - y-coordinate of the end point of the arc
 * @param rx - horizontal radius of the ellipse
 * @param ry - vertical radius of the ellipse
 * @param clockwise - direction of the arc; true for clockwise, false for counterclockwise
 * @returns Array of points `{ x, y }` along the elliptical arc
 *
 * @throws Error if the given radii are too small to draw an arc between the points
 */
export function generateArcPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rx: number,
  ry: number,
  clockwise: boolean
) {
  const numPoints = 20;
  // Calculate midpoint
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  // Calculate the angle of the line connecting the points
  const angle = Math.atan2(y2 - y1, x2 - x1);

  // Calculate transformed coordinates for the ellipse
  const dx = (x2 - x1) / 2;
  const dy = (y2 - y1) / 2;

  // Scale to unit circle
  const transformedX = dx / rx;
  const transformedY = dy / ry;

  // Calculate the distance between points on the unit circle
  const distance = Math.sqrt(transformedX ** 2 + transformedY ** 2);

  // Check if the ellipse can be drawn with the given radii
  if (distance > 1) {
    throw new Error('The given radii are too small to create an arc between the points.');
  }

  // Calculate the distance from the midpoint to the center of the ellipse
  const scaledCenterDistance = Math.sqrt(1 - distance ** 2);

  // Calculate the center of the ellipse
  const centerX = midX + scaledCenterDistance * ry * Math.sin(angle) * (clockwise ? -1 : 1);
  const centerY = midY - scaledCenterDistance * rx * Math.cos(angle) * (clockwise ? -1 : 1);

  // Calculate the start and end angles on the ellipse
  const startAngle = Math.atan2((y1 - centerY) / ry, (x1 - centerX) / rx);
  const endAngle = Math.atan2((y2 - centerY) / ry, (x2 - centerX) / rx);

  // Adjust angles for clockwise/counterclockwise
  let angleRange = endAngle - startAngle;
  if (clockwise && angleRange < 0) {
    angleRange += 2 * Math.PI;
  }
  if (!clockwise && angleRange > 0) {
    angleRange -= 2 * Math.PI;
  }

  // Generate points
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const angle = startAngle + t * angleRange;
    const x = centerX + rx * Math.cos(angle);
    const y = centerY + ry * Math.sin(angle);
    points.push({ x, y });
  }

  return points;
}

export async function roundedRect<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  const labelPaddingX = node?.padding ?? 0;
  const labelPaddingY = node?.padding ?? 0;

  const w = (node?.width ? node?.width : bbox.width) + labelPaddingX * 2;
  const h = (node?.height ? node?.height : bbox.height) + labelPaddingY * 2;
  const radius = 15;
  const taper = 15; // Taper width for the rounded corners
  const { cssStyles } = node;
  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
    options.stroke = 'none';
  }

  const points = [
    // Top edge (left to right)
    { x: -w / 2 + taper, y: -h / 2 }, // Top-left corner start (1)
    { x: w / 2 - taper, y: -h / 2 }, // Top-right corner start (2)

    ...generateArcPoints(w / 2 - taper, -h / 2, w / 2, -h / 2 + taper, radius, radius, true), // Top-left arc (2 to 3)

    // Right edge (top to bottom)
    { x: w / 2, y: -h / 2 + taper }, // Top-right taper point (3)
    { x: w / 2, y: h / 2 - taper }, // Bottom-right taper point (4)

    ...generateArcPoints(w / 2, h / 2 - taper, w / 2 - taper, h / 2, radius, radius, true), // Top-left arc (4 to 5)

    // Bottom edge (right to left)
    { x: w / 2 - taper, y: h / 2 }, // Bottom-right corner start (5)
    { x: -w / 2 + taper, y: h / 2 }, // Bottom-left corner start (6)

    ...generateArcPoints(-w / 2 + taper, h / 2, -w / 2, h / 2 - taper, radius, radius, true), // Top-left arc (4 to 5)

    // Left edge (bottom to top)
    { x: -w / 2, y: h / 2 - taper }, // Bottom-left taper point (7)
    { x: -w / 2, y: -h / 2 + taper }, // Top-left taper point (8)
    ...generateArcPoints(-w / 2, -h / 2 + taper, -w / 2 + taper, -h / 2, radius, radius, true), // Top-left arc (4 to 5)
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
