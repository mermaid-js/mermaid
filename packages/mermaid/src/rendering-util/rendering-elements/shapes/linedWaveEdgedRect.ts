import {
  labelHelper,
  updateNodeBounds,
  getNodeClasses,
  generateFullSineWavePoints,
} from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.d.ts';
import rough from 'roughjs';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';

export const linedWaveEdgedRect = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const nodePadding = node.padding ?? 0;
  const labelPaddingX = node.look === 'neo' ? nodePadding * 2 : (node.padding ?? 0);
  const labelPaddingY = node.look === 'neo' ? nodePadding * 2 : (node.padding ?? 0);
  if (node.width || node.height) {
    const originalWidth = node.width;
    node.width = ((originalWidth ?? 0) * 10) / 11 - labelPaddingX * 2;
    if (node.width < 10) {
      node.width = 10;
    }
    const originalHeight = node.height;

    node.height = ((originalHeight ?? 0) * 3) / 4 - labelPaddingY * 2;
    //node.height = (node?.height ?? 0) - labelPaddingY * 2;
    if (node.height < 10) {
      node.height = 10;
    }
  }
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));
  const w = (node?.width ? node?.width : bbox.width) + (labelPaddingX ?? 0) * 2;
  const h = (node?.height ? node?.height : bbox.height) + (labelPaddingY ?? 0) * 2;
  const waveAmplitude = h / 6;
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
    { x: -w / 2 - (w / 2) * 0.1, y: -finalH / 2 },
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
    { x: -w / 2, y: -finalH / 2 },
    { x: -w / 2, y: (finalH / 2) * 1.1 },
    { x: -w / 2, y: -finalH / 2 },
  ];

  const poly = rc.polygon(
    points.map((p) => [p.x, p.y]),
    options
  );

  const waveEdgeRect = shapeSvg.insert(() => poly, ':first-child');

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
    `translate(${-(bbox.width / 2) - (bbox.x - (bbox.left ?? 0))},${-(bbox.height / 2) - waveAmplitude / 2 - (bbox.y - (bbox.top ?? 0))})`
  );

  updateNodeBounds(node, waveEdgeRect);
  node.intersect = function (point) {
    const pos = intersect.polygon(node, points, point);
    return pos;
  };

  return shapeSvg;
};
