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
    points.push({ x: -x, y: -y });
  }

  return points;
}

export const curlyBraces = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));
  const labelPaddingX = node.look === 'neo' ? (node.padding ?? 0) * 2 : (node.padding ?? 0);
  const labelPaddingY = node.look === 'neo' ? (node.padding ?? 0) * 1 : (node.padding ?? 0);

  if (node.width || node.height) {
    let radius = 5;
    const cal_height = (((node?.height ?? 0) - labelPaddingY * 2) * 10) / 11;
    if (cal_height / 10 > 5) {
      radius = cal_height / 10;
    }

    node.width = (node?.width ?? 0) - labelPaddingX * 2 - radius * 2.5;
    if (node.width < 10) {
      node.width = 10;
    }

    node.height = (node?.height ?? 0) - labelPaddingY * 2 - radius * 2;
    if (node.height < 10) {
      node.height = 10;
    }
  }

  const w = (node.width ? node.width : bbox.width) + (labelPaddingX ?? 0) * 2;
  const h = (node.height ? node.height : bbox.height) + (labelPaddingY ?? 0) * 2;
  const radius = Math.max(5, h * 0.1);
  const { cssStyles } = node;

  const leftCurlyBracePoints = [
    ...generateCirclePoints(w / 2, -h / 2, radius, 30, -90, 0),
    { x: -w / 2 - radius, y: radius },
    ...generateCirclePoints(w / 2 + radius * 2, -radius, radius, 20, -180, -270),
    ...generateCirclePoints(w / 2 + radius * 2, radius, radius, 20, -90, -180),
    { x: -w / 2 - radius, y: -h / 2 },
    ...generateCirclePoints(w / 2, h / 2, radius, 20, 0, 90),
  ];

  const rightCurlyBracePoints = [
    ...generateCirclePoints(-w / 2 + radius + radius / 2, -h / 2, radius, 20, -90, -180),
    { x: w / 2 - radius / 2, y: radius },
    ...generateCirclePoints(-w / 2 - radius / 2, -radius, radius, 20, 0, 90),
    ...generateCirclePoints(-w / 2 - radius / 2, radius, radius, 20, -90, 0),
    { x: w / 2 - radius / 2, y: -radius },
    ...generateCirclePoints(-w / 2 + radius + radius / 2, h / 2, radius, 30, -180, -270),
  ];

  const rectPoints = [
    { x: w / 2, y: -h / 2 - radius },
    { x: -w / 2, y: -h / 2 - radius },
    ...generateCirclePoints(w / 2, -h / 2, radius, 20, -90, 0),
    { x: -w / 2 - radius, y: -radius },
    ...generateCirclePoints(w / 2 + radius * 2, -radius, radius, 20, -180, -270),
    ...generateCirclePoints(w / 2 + radius * 2, radius, radius, 20, -90, -180),
    { x: -w / 2 - radius, y: h / 2 },
    ...generateCirclePoints(w / 2, h / 2, radius, 20, 0, 90),
    { x: -w / 2, y: h / 2 + radius },
    { x: w / 2 - radius - radius / 2, y: h / 2 + radius },
    ...generateCirclePoints(-w / 2 + radius + radius / 2, -h / 2, radius, 20, -90, -180),
    { x: w / 2 - radius / 2, y: radius },
    ...generateCirclePoints(-w / 2 - radius / 2, -radius, radius, 20, 0, 90),
    ...generateCirclePoints(-w / 2 - radius / 2, radius, radius, 20, -90, 0),
    { x: w / 2 - radius / 2, y: -radius },
    ...generateCirclePoints(-w / 2 + radius + radius / 2, h / 2, radius, 30, -180, -270),
  ];

  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, { fill: 'transparent' });

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }
  const leftCurlyBracePath = createPathFromPoints(leftCurlyBracePoints);
  const newLeftCurlyBracePath = leftCurlyBracePath.replace('Z', '');
  const leftCurlyBraceNode = rc.path(newLeftCurlyBracePath, options);
  const rightCurlyBracePath = createPathFromPoints(rightCurlyBracePoints);
  const newRightCurlyBracePath = rightCurlyBracePath.replace('Z', '');
  const rightCurlyBraceNode = rc.path(newRightCurlyBracePath, options);
  const rectPath = createPathFromPoints(rectPoints);
  const rectShape = rc.path(rectPath, { ...options });
  const curlyBracesShape = shapeSvg.insert('g', ':first-child');
  curlyBracesShape.insert(() => rectShape, ':first-child').attr('stroke-opacity', 0);
  curlyBracesShape.insert(() => leftCurlyBraceNode, ':first-child');
  curlyBracesShape.insert(() => rightCurlyBraceNode, ':first-child');
  curlyBracesShape.attr('class', 'text');

  if (cssStyles && node.look !== 'handDrawn') {
    curlyBracesShape.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    curlyBracesShape.selectAll('path').attr('style', nodeStyles);
  }

  curlyBracesShape.attr('transform', `translate(${radius - radius / 4}, 0)`);

  label.attr('transform', `translate(${-bbox.width / 2}, ${-bbox.height / 2})`);
  updateNodeBounds(node, curlyBracesShape);

  node.intersect = function (point) {
    const pos = intersect.polygon(node, rectPoints, point);

    return pos;
  };

  return shapeSvg;
};
