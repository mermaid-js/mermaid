import {
  labelHelper,
  updateNodeBounds,
  getNodeClasses,
  createPathFromPoints,
  generateFullSineWavePoints,
} from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import {
  styles2String,
  userNodeOverrides,
} from '$root/rendering-util/rendering-elements/shapes/handDrawnShapeStyles.js';
import rough from 'roughjs';

export const waveRectangle = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));
  const w = Math.max(bbox.width + (node.padding ?? 0) * 2, node?.width ?? 0);
  const h = Math.max(bbox.height + (node.padding ?? 0) * 2, node?.height ?? 0);
  const waveAmplitude = h / 4;
  const finalH = h + waveAmplitude;
  const { cssStyles } = node;

  // @ts-ignore - rough is not typed
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
};
