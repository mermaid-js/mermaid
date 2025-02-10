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
import type { Bounds, Point } from '../../../types.js';

function getPoints(w: number, finalH: number, waveAmplitude: number) {
  return [
    { x: -w / 2, y: finalH / 2 },
    ...generateFullSineWavePoints(-w / 2, finalH / 2, w / 2, finalH / 2, waveAmplitude, 1),
    { x: w / 2, y: -finalH / 2 },
    ...generateFullSineWavePoints(w / 2, -finalH / 2, -w / 2, -finalH / 2, waveAmplitude, -1),
  ];
}
export async function waveRectangle<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const nodePadding = node.padding ?? 0;
  const labelPaddingX = node.look === 'neo' ? 16 : nodePadding;
  const labelPaddingY = node.look === 'neo' ? 20 : nodePadding;

  if (node.width || node.height) {
    node.width = node?.width ?? 0;
    if (node.width < 20) {
      node.width = 20;
    }

    node.height = node?.height ?? 0;
    if (node.height < 10) {
      node.height = 10;
    }

    // Adjust for wave amplitude
    const waveAmplitude = Math.min(node.height * 0.2, node.height / 4);
    node.height = Math.ceil(node.height - labelPaddingY - waveAmplitude * (20 / 9));
    node.width = node.width - labelPaddingX * 2;
  }

  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  const w = (node?.width ? node?.width : bbox.width) + labelPaddingX * 2;
  const h = (node?.height ? node?.height : bbox.height) + labelPaddingY;

  const waveAmplitude = h / 8;
  const finalH = h + waveAmplitude * 2;
  const { cssStyles } = node;

  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const points = getPoints(w, finalH, waveAmplitude);

  const waveRectPath = createPathFromPoints(points);
  const waveRectNode = rc.path(waveRectPath, options);

  const waveRect = shapeSvg.insert(() => waveRectNode, ':first-child');

  waveRect.attr('class', 'basic label-container outer-path');

  if (cssStyles && node.look !== 'handDrawn') {
    waveRect.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    waveRect.selectAll('path').attr('style', nodeStyles);
  }

  node.width = w;
  node.height = finalH;

  updateNodeBounds(node, waveRect);

  node.calcIntersect = function (bounds: Bounds, point: Point) {
    const w = bounds.width;
    const h = bounds.height;

    const waveAmplitude = Math.min(h * 0.2, h / 4);
    const finalH = h + waveAmplitude * 2;

    const points = getPoints(w, finalH, waveAmplitude);
    return intersect.polygon(node, points, point);
  };

  node.intersect = function (point) {
    const pos = intersect.polygon(node, points, point);
    return pos;
  };

  return shapeSvg;
}
