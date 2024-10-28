import { log } from '../../../logger.js';
import { getNodeClasses, updateNodeBounds } from './util.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';
import { createPathFromPoints } from './util.js';
import type { D3Selection } from '../../../types.js';

export function lightningBolt<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.label = '';
  node.labelStyle = labelStyles;
  const shapeSvg = parent
    .insert('g')
    .attr('class', getNodeClasses(node))
    .attr('id', node.domId ?? node.id);
  const { cssStyles } = node;
  const width = Math.max(35, node?.width ?? 0);
  const height = Math.max(35, node?.height ?? 0);
  const gap = 7;

  const points = [
    { x: width, y: 0 },
    { x: 0, y: height + gap / 2 },
    { x: width - 2 * gap, y: height + gap / 2 },
    { x: 0, y: 2 * height },
    { x: width, y: height - gap / 2 },
    { x: 2 * gap, y: height - gap / 2 },
  ];

  // @ts-expect-error shapeSvg d3 class is incorrect?
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const linePath = createPathFromPoints(points);
  const lineNode = rc.path(linePath, options);

  const lightningBolt = shapeSvg.insert(() => lineNode, ':first-child');

  if (cssStyles && node.look !== 'handDrawn') {
    lightningBolt.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    lightningBolt.selectAll('path').attr('style', nodeStyles);
  }

  lightningBolt.attr('transform', `translate(-${width / 2},${-height})`);

  updateNodeBounds(node, lightningBolt);

  node.intersect = function (point) {
    log.info('lightningBolt intersect', node, point);
    const pos = intersect.polygon(node, points, point);

    return pos;
  };

  return shapeSvg;
}
