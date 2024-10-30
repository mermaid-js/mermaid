import { log } from '../../../logger.js';
import { labelHelper, updateNodeBounds, getNodeClasses, createPathFromPoints } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';

export async function hourglass<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.label = '';
  node.labelStyle = labelStyles;
  const { shapeSvg } = await labelHelper(parent, node, getNodeClasses(node));

  const w = Math.max(30, node?.width ?? 0);
  const h = Math.max(30, node?.height ?? 0);

  const { cssStyles } = node;

  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const points = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: 0, y: h },
    { x: w, y: h },
  ];

  const pathData = createPathFromPoints(points);
  const shapeNode = rc.path(pathData, options);
  const polygon = shapeSvg.insert(() => shapeNode, ':first-child');
  polygon.attr('class', 'basic label-container');

  if (cssStyles && node.look !== 'handDrawn') {
    polygon.selectChildren('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    polygon.selectChildren('path').attr('style', nodeStyles);
  }

  polygon.attr('transform', `translate(${-w / 2}, ${-h / 2})`);

  updateNodeBounds(node, polygon);

  // label.attr('transform', `translate(${-bbox.width / 2}, ${(h/2)})`); // To transform text below hourglass shape

  node.intersect = function (point) {
    log.info('Pill intersect', node, { points });
    const pos = intersect.polygon(node, points, point);
    return pos;
  };

  return shapeSvg;
}
