import { labelHelper, updateNodeBounds, getNodeClasses, createPathFromPoints } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.d.ts';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';

function generateCirclePoints(
  centerX: number,
  centerY: number,
  radius: number,
  numPoints = 100,
  startAngle = 0,
  endAngle = 180
) {
  const points = [];

  // Convert angles to radians
  const startAngleRad = (startAngle * Math.PI) / 180;
  const endAngleRad = (endAngle * Math.PI) / 180;

  // Calculate the angle range in radians
  const angleRange = endAngleRad - startAngleRad;

  // Calculate the angle step
  const angleStep = angleRange / (numPoints - 1);

  for (let i = 0; i < numPoints; i++) {
    const angle = startAngleRad + i * angleStep;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push({ x, y });
  }

  return points;
}

export const curlyBraceRight = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));
  const w = bbox.width + (node.padding ?? 0);
  const h = bbox.height + (node.padding ?? 0);
  const radius = Math.max(5, h * 0.1);

  const { cssStyles } = node;

  const points = [
    ...generateCirclePoints(w / 2, -h / 2, radius, 20, -90, 0),
    { x: w / 2 + radius, y: -radius },
    ...generateCirclePoints(w / 2 + radius * 2, -radius, radius, 20, -180, -270),
    ...generateCirclePoints(w / 2 + radius * 2, radius, radius, 20, -90, -180),
    { x: w / 2 + radius, y: h / 2 },
    ...generateCirclePoints(w / 2, h / 2, radius, 20, 0, 90),
  ];

  const rectPoints = [
    { x: -w / 2, y: -h / 2 - radius },
    { x: w / 2, y: -h / 2 - radius },
    ...generateCirclePoints(w / 2, -h / 2, radius, 20, -90, 0),
    { x: w / 2 + radius, y: -radius },
    ...generateCirclePoints(w / 2 + radius * 2, -radius, radius, 20, -180, -270),
    ...generateCirclePoints(w / 2 + radius * 2, radius, radius, 20, -90, -180),
    { x: w / 2 + radius, y: h / 2 },
    ...generateCirclePoints(w / 2, h / 2, radius, 20, 0, 90),
    { x: w / 2, y: h / 2 + radius },
    { x: -w / 2, y: h / 2 + radius },
  ];

  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, { fill: 'none' });

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }
  const curlyBraceRightPath = createPathFromPoints(points);
  const newCurlyBracePath = curlyBraceRightPath.replace('Z', '');
  const curlyBraceRightNode = rc.path(newCurlyBracePath, options);
  const rectPath = createPathFromPoints(rectPoints);
  const rectShape = rc.path(rectPath, { ...options });
  const curlyBraceRightShape = shapeSvg.insert('g', ':first-child');
  curlyBraceRightShape.insert(() => rectShape, ':first-child').attr('stroke-opacity', 0);
  curlyBraceRightShape.insert(() => curlyBraceRightNode, ':first-child');
  curlyBraceRightShape.attr('class', 'text');

  if (cssStyles && node.look !== 'handDrawn') {
    curlyBraceRightShape.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    curlyBraceRightShape.selectAll('path').attr('style', nodeStyles);
  }

  curlyBraceRightShape.attr('transform', `translate(${-radius}, 0)`);

  label.attr(
    'transform',
    `translate(${-w / 2 + (node.padding ?? 0) / 2 - (bbox.x - (bbox.left ?? 0))},${-h / 2 + (node.padding ?? 0) / 2 - (bbox.y - (bbox.top ?? 0))})`
  );

  updateNodeBounds(node, curlyBraceRightShape);

  node.intersect = function (point) {
    const pos = intersect.polygon(node, rectPoints, point);

    return pos;
  };

  return shapeSvg;
};
