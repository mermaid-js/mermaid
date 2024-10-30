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

export async function waveEdgedRectangle<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));
  const w = Math.max(bbox.width + (node.padding ?? 0) * 2, node?.width ?? 0);
  const h = Math.max(bbox.height + (node.padding ?? 0) * 2, node?.height ?? 0);
  const waveAmplitude = h / 8;
  const finalH = h + waveAmplitude;
  const { cssStyles } = node;

  // To maintain minimum width
  const minWidth = 70;
  const widthDif = minWidth - w;
  const extraW = widthDif > 0 ? widthDif / 2 : 0;

  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const points = [
    { x: -w / 2 - extraW, y: finalH / 2 },
    ...generateFullSineWavePoints(
      -w / 2 - extraW,
      finalH / 2,
      w / 2 + extraW,
      finalH / 2,
      waveAmplitude,
      0.8
    ),
    { x: w / 2 + extraW, y: -finalH / 2 },
    { x: -w / 2 - extraW, y: -finalH / 2 },
  ];

  const waveEdgeRectPath = createPathFromPoints(points);
  const waveEdgeRectNode = rc.path(waveEdgeRectPath, options);

  const waveEdgeRect = shapeSvg.insert(() => waveEdgeRectNode, ':first-child');

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
    `translate(${-w / 2 + (node.padding ?? 0) - (bbox.x - (bbox.left ?? 0))},${-h / 2 + (node.padding ?? 0) - waveAmplitude - (bbox.y - (bbox.top ?? 0))})`
  );

  updateNodeBounds(node, waveEdgeRect);
  node.intersect = function (point) {
    const pos = intersect.polygon(node, points, point);
    return pos;
  };

  return shapeSvg;
}
