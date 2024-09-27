import {
  labelHelper,
  updateNodeBounds,
  getNodeClasses,
  createPathFromPoints,
  generateFullSineWavePoints,
} from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.d.ts';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';

export const waveRectangle = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const nodePadding = node.padding ?? 0;
  const labelPaddingX = node.look === 'neo' ? nodePadding * 2 : nodePadding;
  const labelPaddingY = node.look === 'neo' ? nodePadding * 1.5 : nodePadding;

  if (node.width || node.height) {
    node.width = node?.width ?? 0;
    if (node.width < 100) {
      node.width = 100;
    }

    node.height = node?.height ?? 0;
    if (node.height < 50) {
      node.height = 50;
    }

    // Adjust for wave amplitude
    const waveAmplitude = Math.min(node.height * 0.2, node.height / 4);
    node.height = Math.ceil(node.height - labelPaddingY - waveAmplitude * (20 / 9));
    node.width = node.width - labelPaddingX * 2;
  }

  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  const w = Math.max(bbox.width, node?.width ?? 0) + labelPaddingX * 2;
  const h = Math.max(bbox.height, node?.height ?? 0) + labelPaddingY;

  const waveAmplitude = Math.min(h * 0.2, h / 4);
  const finalH = h + waveAmplitude * 2;
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

  node.width = w;
  node.height = finalH;

  updateNodeBounds(node, waveRect);
  node.intersect = function (point) {
    const pos = intersect.polygon(node, points, point);
    return pos;
  };

  return shapeSvg;
};
