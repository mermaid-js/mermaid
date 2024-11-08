import { log } from '../../../logger.js';
import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import { createPathFromPoints } from './util.js';
import type { D3Selection } from '../../../types.js';

export async function flippedTriangle<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const w = bbox.width + (node.padding ?? 0);
  const h = w + bbox.height;

  const tw = w + bbox.height;
  const points = [
    { x: 0, y: -h },
    { x: tw, y: -h },
    { x: tw / 2, y: 0 },
  ];

  const { cssStyles } = node;

  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});
  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }
  const pathData = createPathFromPoints(points);
  const roughNode = rc.path(pathData, options);

  const flippedTriangle = shapeSvg
    .insert(() => roughNode, ':first-child')
    .attr('transform', `translate(${-h / 2}, ${h / 2})`);

  if (cssStyles && node.look !== 'handDrawn') {
    flippedTriangle.selectChildren('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    flippedTriangle.selectChildren('path').attr('style', nodeStyles);
  }

  node.width = w;
  node.height = h;

  updateNodeBounds(node, flippedTriangle);

  label.attr(
    'transform',
    `translate(${-bbox.width / 2 - (bbox.x - (bbox.left ?? 0))}, ${-h / 2 + (node.padding ?? 0) / 2 + (bbox.y - (bbox.top ?? 0))})`
  );

  node.intersect = function (point) {
    log.info('Triangle intersect', node, points, point);
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
}
