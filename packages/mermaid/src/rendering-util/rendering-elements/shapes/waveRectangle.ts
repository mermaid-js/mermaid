import {
  labelHelper,
  updateNodeBounds,
  getNodeClasses,
  createPathFromPoints,
  generateFullSineWavePoints,
} from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';

export async function waveRectangle<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  const minWidth = 100; // Minimum width
  const minHeight = 50; // Minimum height

  const baseWidth = Math.max(bbox.width + (node.padding ?? 0) * 2, node?.width ?? 0);
  const baseHeight = Math.max(bbox.height + (node.padding ?? 0) * 2, node?.height ?? 0);

  const aspectRatio = baseWidth / baseHeight;

  let w = baseWidth;
  let h = baseHeight;

  if (w > h * aspectRatio) {
    h = w / aspectRatio;
  } else {
    w = h * aspectRatio;
  }

  w = Math.max(w, minWidth);
  h = Math.max(h, minHeight);

  const waveAmplitude = Math.min(h * 0.2, h / 4);
  const finalH = h + waveAmplitude * 2;
  const { cssStyles } = node;

  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const points = [
    { x: -w / 2, y: finalH / 2 },
    ...generateFullSineWavePoints(-w / 2, finalH / 2, w / 2, finalH / 2, waveAmplitude, 1),
    { x: w / 2, y: -finalH / 2 },
    ...generateFullSineWavePoints(w / 2, -finalH / 2, -w / 2, -finalH / 2, waveAmplitude, -1),
  ];

  const waveRectPath = createPathFromPoints(points);
  const waveRectNode = rc.path(waveRectPath, options);

  const waveRect = shapeSvg.insert(() => waveRectNode, ':first-child');

  waveRect.attr('class', 'basic label-container');

  if (cssStyles && node.look !== 'handDrawn') {
    waveRect.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    waveRect.selectAll('path').attr('style', nodeStyles);
  }

  updateNodeBounds(node, waveRect);
  node.intersect = function (point) {
    const pos = intersect.polygon(node, points, point);
    return pos;
  };

  return shapeSvg;
}
