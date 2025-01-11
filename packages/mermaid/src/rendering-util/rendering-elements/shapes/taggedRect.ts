import { labelHelper, getNodeClasses, updateNodeBounds, createPathFromPoints } from './util.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';
import type { D3Selection } from '../../../types.js';

export async function taggedRect<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));
  const w = Math.max(bbox.width + (node.padding ?? 0) * 2, node?.width ?? 0);
  const h = Math.max(bbox.height + (node.padding ?? 0) * 2, node?.height ?? 0);
  const x = -w / 2;
  const y = -h / 2;
  const tagWidth = 0.2 * h;
  const tagHeight = 0.2 * h;
  const { cssStyles } = node;

  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  const rectPoints = [
    { x: x - tagWidth / 2, y },
    { x: x + w + tagWidth / 2, y },
    { x: x + w + tagWidth / 2, y: y + h },
    { x: x - tagWidth / 2, y: y + h },
  ];

  const tagPoints = [
    { x: x + w - tagWidth / 2, y: y + h },
    { x: x + w + tagWidth / 2, y: y + h },
    { x: x + w + tagWidth / 2, y: y + h - tagHeight },
  ];

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const rectPath = createPathFromPoints(rectPoints);
  const rectNode = rc.path(rectPath, options);

  const tagPath = createPathFromPoints(tagPoints);
  const tagNode = rc.path(tagPath, { ...options, fillStyle: 'solid' });

  const taggedRect = shapeSvg.insert(() => tagNode, ':first-child');
  taggedRect.insert(() => rectNode, ':first-child');

  taggedRect.attr('class', 'basic label-container');

  if (cssStyles && node.look !== 'handDrawn') {
    taggedRect.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    taggedRect.selectAll('path').attr('style', nodeStyles);
  }

  updateNodeBounds(node, taggedRect);

  node.intersect = function (point) {
    const pos = intersect.polygon(node, rectPoints, point);

    return pos;
  };

  return shapeSvg;
}
