import {
  labelHelper,
  updateNodeBounds,
  getNodeClasses,
  createPathFromPoints,
  generateFullSineWavePoints,
  mergePaths,
} from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import rough from 'roughjs';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import type { D3Selection } from '../../../types.js';
import type { Bounds, Point } from '../../../types.js';

export async function multiWaveEdgedRectangle<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const nodePadding = node.padding ?? 0;
  const labelPaddingX = node.look === 'neo' ? 16 : nodePadding;
  const labelPaddingY = node.look === 'neo' ? 12 : nodePadding;
  let adjustFinalHeight = true;

  if (node.width || node.height) {
    adjustFinalHeight = false;
    node.width = (node?.width ?? 0) - labelPaddingX * 2;
    if (node.width < 50) {
      node.width = 50;
    }

    node.height = (node?.height ?? 0) - labelPaddingY * 3;
    if (node.height < 50) {
      node.height = 50;
    }

    // Adjustments for wave amplitude
    const waveAmplitude = 30;
    const waveMultiplier = 0.3319;

    node.height = Math.round(node.height - labelPaddingY - waveAmplitude * waveMultiplier);
  }

  const w = Math.max(bbox.width, node?.width ?? 0) + labelPaddingX * 2;
  const h = Math.max(bbox.height, node?.height ?? 0) + labelPaddingY * 3;
  const waveAmplitude = node.look === 'neo' ? h / 4 : h / 8;
  const finalH = h + (adjustFinalHeight ? waveAmplitude / 2 : -waveAmplitude / 2);
  const x = -w / 2;
  const y = -finalH / 2;
  const rectOffset = 10;

  const { cssStyles } = node;

  const wavePoints = generateFullSineWavePoints(
    x - rectOffset,
    y + finalH + rectOffset,
    x + w - rectOffset,
    y + finalH + rectOffset,
    waveAmplitude,
    0.8
  );

  const lastWavePoint = wavePoints?.[wavePoints.length - 1];

  const outerPathPoints = [
    { x: x - rectOffset, y: y + rectOffset },
    { x: x - rectOffset, y: y + finalH + rectOffset },
    ...wavePoints,
    { x: x + w - rectOffset, y: lastWavePoint.y - rectOffset },
    { x: x + w, y: lastWavePoint.y - rectOffset },
    { x: x + w, y: lastWavePoint.y - 2 * rectOffset },
    { x: x + w + rectOffset, y: lastWavePoint.y - 2 * rectOffset },
    { x: x + w + rectOffset, y: y - rectOffset },
    { x: x + rectOffset, y: y - rectOffset },
    { x: x + rectOffset, y: y },
    { x, y },
    { x, y: y + rectOffset },
  ];

  const innerPathPoints = [
    { x, y: y + rectOffset },
    { x: x + w - rectOffset, y: y + rectOffset },
    { x: x + w - rectOffset, y: lastWavePoint.y - rectOffset },
    { x: x + w, y: lastWavePoint.y - rectOffset },
    { x: x + w, y },
    { x, y },
  ];

  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const outerPath = createPathFromPoints(outerPathPoints);
  let outerNode = rc.path(outerPath, options);
  const innerPath = createPathFromPoints(innerPathPoints);
  let innerNode = rc.path(innerPath, options);

  if (node.look !== 'handDrawn') {
    outerNode = mergePaths(outerNode);
    innerNode = mergePaths(innerNode);
  }

  const shape = shapeSvg.insert('g', ':first-child');
  shape.insert(() => outerNode);
  shape.insert(() => innerNode);

  shape.attr('class', 'basic label-container outer-path');

  if (cssStyles && node.look !== 'handDrawn') {
    shape.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    shape.selectAll('path').attr('style', nodeStyles);
  }

  shape.attr('transform', `translate(0,${-waveAmplitude / 2})`);

  label.attr(
    'transform',
    `translate(${-(bbox.width / 2) - rectOffset - (bbox.x - (bbox.left ?? 0))}, ${-(bbox.height / 2) + rectOffset - waveAmplitude - (bbox.y - (bbox.top ?? 0))})`
  );

  updateNodeBounds(node, shape);

  node.calcIntersect = function (bounds: Bounds, point: Point) {
    // TODO: Implement intersect for this shape
    const radius = bounds.width / 2;
    return intersect.circle(bounds, radius, point);
  };

  node.intersect = function (point) {
    const pos = intersect.polygon(node, outerPathPoints, point);
    return pos;
  };

  return shapeSvg;
}
