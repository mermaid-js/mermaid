import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import rough from 'roughjs';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import { createPathFromPoints, getNodeClasses } from './util.js';
import type { D3Selection } from '../../../types.js';

export function choice<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { nodeStyles } = styles2String(node);
  node.label = '';
  const shapeSvg = parent
    .insert('g')
    .attr('class', getNodeClasses(node))
    .attr('id', node.domId ?? node.id);
  const { cssStyles } = node;

  const s = Math.max(28, node.width ?? 0);

  const points = [
    { x: 0, y: s / 2 },
    { x: s / 2, y: 0 },
    { x: 0, y: -s / 2 },
    { x: -s / 2, y: 0 },
  ];

  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const choicePath = createPathFromPoints(points);
  const roughNode = rc.path(choicePath, options);
  const choiceShape = shapeSvg.insert(() => roughNode, ':first-child');

  if (cssStyles && node.look !== 'handDrawn') {
    choiceShape.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    choiceShape.selectAll('path').attr('style', nodeStyles);
  }

  node.width = 28;
  node.height = 28;

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
}
