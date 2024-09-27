import { log } from '../../../logger.js';
import { createPathFromPoints, getNodeClasses, updateNodeBounds } from './util.js';
import type { Node } from '../../types.d.ts';
import type { SVG } from '../../../diagram-api/types.js';
import { userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';

export const lightningBolt = (parent: SVG, node: Node) => {
  node.label = '';
  const shapeSvg = parent
    .insert('g')
    .attr('class', getNodeClasses(node))
    .attr('id', node.domId ?? node.id);
  const { cssStyles } = node;

  const gapX = Math.max(5, (node.width ?? 0) * 0.1);
  const gapY = Math.max(5, (node.height ?? 0) * 0.1);
  const width = Math.max(50, node?.width ?? 0);
  const height = Math.max(50, node?.height ?? 0);

  const points = [
    { x: width, y: 0 },
    { x: 0, y: height / 2 + gapY / 2 },
    { x: width - 4 * gapX, y: height / 2 + gapY / 2 },
    { x: 0, y: height },
    { x: width, y: height / 2 - gapY / 2 },
    { x: 4 * gapX, y: height / 2 - gapY / 2 },
  ];

  // @ts-ignore - rough is not typed
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

  lightningBolt.attr('transform', `translate(-${width / 2},${-height / 2})`);

  updateNodeBounds(node, lightningBolt);

  node.intersect = function (point) {
    log.info('lightningBolt intersect', node, point);
    const pos = intersect.polygon(node, points, point);

    return pos;
  };

  return shapeSvg;
};
