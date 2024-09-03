import { log } from '$root/logger.js';
import { getNodeClasses, updateNodeBounds, createPathFromPoints } from './util.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import type { SVG } from '$root/diagram-api/types.js';
import { userNodeOverrides } from '$root/rendering-util/rendering-elements/shapes/handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';

export const lightningBolt = (parent: SVG, node: Node) => {
  node.label = '';
  const shapeSvg = parent
    .insert('g')
    .attr('class', getNodeClasses(node))
    .attr('id', node.domId ?? node.id);
  const { cssStyles } = node;
  const height = 80;
  const width = 80;
  const gap = 16;

  const points = [
    { x: width, y: 0 },
    { x: 0, y: height + gap / 2 },
    { x: width - 2 * gap, y: height + gap / 2 },
    { x: 0, y: 2 * height },
    { x: width, y: height - gap / 2 },
    { x: 2 * gap, y: height - gap / 2 },
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

  lightningBolt.attr('transform', `translate(-${width / 2},${-height})`);

  updateNodeBounds(node, lightningBolt);

  node.intersect = function (point) {
    log.info('lightningBolt intersect', node, point);
    const pos = intersect.polygon(node, points, point);

    return pos;
  };

  return shapeSvg;
};
