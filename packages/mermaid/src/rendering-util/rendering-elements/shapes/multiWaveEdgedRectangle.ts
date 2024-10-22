import {
  labelHelper,
  updateNodeBounds,
  getNodeClasses,
  createPathFromPoints,
  generateFullSineWavePoints,
} from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import rough from 'roughjs';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import type { D3Selection } from '../../../types.js';

export async function multiWaveEdgedRectangle<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));
  const w = Math.max(bbox.width + (node.padding ?? 0) * 2, node?.width ?? 0);
  const h = Math.max(bbox.height + (node.padding ?? 0) * 2, node?.height ?? 0);
  const waveAmplitude = h / 4;
  const finalH = h + waveAmplitude;
  const x = -w / 2;
  const y = -finalH / 2;
  const rectOffset = 5;

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
  const outerNode = rc.path(outerPath, options);
  const innerPath = createPathFromPoints(innerPathPoints);
  const innerNode = rc.path(innerPath, options);

  const shape = shapeSvg.insert(() => outerNode, ':first-child');
  shape.insert(() => innerNode);

  shape.attr('class', 'basic label-container');

  if (cssStyles && node.look !== 'handDrawn') {
    shape.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    shape.selectAll('path').attr('style', nodeStyles);
  }

  shape.attr('transform', `translate(0,${-waveAmplitude / 2})`);

  label.attr(
    'transform',
    `translate(${-(bbox.width / 2) - rectOffset - (bbox.x - (bbox.left ?? 0))}, ${-(bbox.height / 2) + rectOffset - waveAmplitude / 2 - (bbox.y - (bbox.top ?? 0))})`
  );

  updateNodeBounds(node, shape);

  node.intersect = function (point) {
    const pos = intersect.polygon(node, outerPathPoints, point);
    return pos;
  };

  return shapeSvg;
}
