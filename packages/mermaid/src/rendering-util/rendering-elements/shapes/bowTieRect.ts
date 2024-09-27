import { labelHelper, updateNodeBounds, getNodeClasses, createPathFromPoints } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.d.ts';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';

function generateArcPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rx: number,
  ry: number,
  clockwise: boolean
) {
  // this must be an odd number, so that the midpoint is included
  // otherwise the width of the bowtie will be off
  const numPoints = 21;
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

/**
 * Calculates the sagitta of an arc of an ellipse given its chord and radii.
 *
 * @param chord - The chord of the arc (e.g. the line connecting the two points on the circle)
 * @param radiusX - The x-radius of the ellipse.
 * @param radiusY - The y-radius of the ellipse.
 */
function calculateArcSagitta(chord: number, radiusX: number, radiusY: number) {
  const [semiMajorAxis, semiMinorAxis] = [radiusX, radiusY].sort((a, b) => b - a);
  return semiMinorAxis * (1 - Math.sqrt(1 - (chord / semiMajorAxis / 2) ** 2));
}

export const bowTieRect = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const nodePadding = node.padding ?? 0;
  const labelPaddingX = node.look === 'neo' ? nodePadding * 2 : nodePadding;
  const labelPaddingY = node.look === 'neo' ? nodePadding * 1 : nodePadding;

  const calcTotalHeight = (labelHeight: number) => labelHeight + labelPaddingY * 2;
  const calcEllipseRadius = (totalHeight: number) => {
    const ry = totalHeight / 2;
    const rx = ry / (2.5 + totalHeight / 50);
    return [rx, ry];
  };

  // If incoming height & width are present, subtract the padding from them
  // as labelHelper does not take padding into account
  // also check if the width or height is less than minimum default values (50),
  // if so set it to min value
  if (node.width || node.height) {
    node.height = Math.max((node?.height ?? 0) - labelPaddingY * 2, 50);
    const totalHeight = calcTotalHeight(node.height);
    const [rx, ry] = calcEllipseRadius(totalHeight);
    node.width = Math.max(
      (node?.width ?? 0) - labelPaddingX * 2 - calculateArcSagitta(totalHeight, rx, ry),
      50
    );
  }

  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  const totalHeight = calcTotalHeight(Math.max(bbox.height, node?.height ?? 0));
  const [rx, ry] = calcEllipseRadius(totalHeight);
  const sagitta = calculateArcSagitta(totalHeight, rx, ry);
  const totalWidth = Math.max(bbox.width, node?.width ?? 0) + labelPaddingX * 2 + sagitta;

  const w = totalWidth - sagitta;
  const h = totalHeight;
  // let shape: d3.Selection<SVGPathElement | SVGGElement, unknown, null, undefined>;
  const { cssStyles } = node;

  const points = [
    { x: w / 2, y: -h / 2 },
    { x: -w / 2, y: -h / 2 },
    ...generateArcPoints(-w / 2, -h / 2, -w / 2, h / 2, rx, ry, false),
    { x: w / 2, y: h / 2 },
    ...generateArcPoints(w / 2, h / 2, w / 2, -h / 2, rx, ry, true),
  ];

  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }
  const bowTieRectPath = createPathFromPoints(points);
  const bowTieRectShapePath = rc.path(bowTieRectPath, options);
  const bowTieRectShape = shapeSvg.insert(() => bowTieRectShapePath, ':first-child');

  bowTieRectShape.attr('class', 'basic label-container');

  if (cssStyles && node.look !== 'handDrawn') {
    bowTieRectShape.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    bowTieRectShape.selectAll('path').attr('style', nodeStyles);
  }

  bowTieRectShape.attr('transform', `translate(${rx / 2}, 0)`);

  updateNodeBounds(node, bowTieRectShape);

  node.intersect = function (point) {
    const pos = intersect.polygon(node, points, point);
    return pos;
  };

  return shapeSvg;
};
