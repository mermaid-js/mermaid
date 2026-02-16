import {
  labelHelper,
  updateNodeBounds,
  getNodeClasses,
  generateFullSineWavePoints,
  createPathFromPoints,
} from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import rough from 'roughjs';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import type { D3Selection } from '../../../types.js';

export async function taggedWaveEdgedRectangle<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));
  const w = Math.max(bbox.width + (node.padding ?? 0) * 2, node?.width ?? 0);
  const h = Math.max(bbox.height + (node.padding ?? 0) * 2, node?.height ?? 0);
  const waveAmplitude = h / 4;
  const tagWidth = 0.2 * w;
  const tagHeight = 0.2 * h;
  const finalH = h + waveAmplitude;
  const { cssStyles } = node;

  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const points = [
    { x: -w / 2 - (w / 2) * 0.1, y: finalH / 2 },
    ...generateFullSineWavePoints(
      -w / 2 - (w / 2) * 0.1,
      finalH / 2,
      w / 2 + (w / 2) * 0.1,
      finalH / 2,
      waveAmplitude,
      0.8
    ),

    { x: w / 2 + (w / 2) * 0.1, y: -finalH / 2 },
    { x: -w / 2 - (w / 2) * 0.1, y: -finalH / 2 },
  ];

  const x = -w / 2 + (w / 2) * 0.1;
  const y = -finalH / 2 - tagHeight * 0.4;

  const tagPoints = [
    { x: x + w - tagWidth, y: (y + h) * 1.4 },
    { x: x + w, y: y + h - tagHeight },
    { x: x + w, y: (y + h) * 0.9 },
    ...generateFullSineWavePoints(
      x + w,
      (y + h) * 1.3,
      x + w - tagWidth,
      (y + h) * 1.5,
      -h * 0.03,
      0.5
    ),
  ];

  const waveEdgeRectPath = createPathFromPoints(points);
  const waveEdgeRectNode = rc.path(waveEdgeRectPath, options);

  const taggedWaveEdgeRectPath = createPathFromPoints(tagPoints);
  const taggedWaveEdgeRectNode = rc.path(taggedWaveEdgeRectPath, {
    ...options,
    fillStyle: 'solid',
  });

  const waveEdgeRect = shapeSvg.insert(() => taggedWaveEdgeRectNode, ':first-child');
  waveEdgeRect.insert(() => waveEdgeRectNode, ':first-child');

  waveEdgeRect.attr('class', 'basic label-container');

  if (cssStyles && node.look !== 'handDrawn') {
    waveEdgeRect.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    waveEdgeRect.selectAll('path').attr('style', nodeStyles);
  }

  waveEdgeRect.attr('transform', `translate(0,${-waveAmplitude / 2})`);
  label.attr(
    'transform',
    `translate(${-w / 2 + (node.padding ?? 0) - (bbox.x - (bbox.left ?? 0))},${-h / 2 + (node.padding ?? 0) - waveAmplitude / 2 - (bbox.y - (bbox.top ?? 0))})`
  );

  updateNodeBounds(node, waveEdgeRect);
  node.intersect = function (point) {
    const pos = intersect.polygon(node, points, point);
    return pos;
  };

  return shapeSvg;
}
