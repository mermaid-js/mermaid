import { log } from '$root/logger.js';
import { labelHelper, getNodeClasses, updateNodeBounds } from './util.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import {
  styles2String,
  userNodeOverrides,
} from '$root/rendering-util/rendering-elements/shapes/handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';
import { createPathFromPoints } from './util.js';

export const lightningBolt = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.label = '';
  node.labelStyle = labelStyles;
  const { shapeSvg } = await labelHelper(parent, node, getNodeClasses(node));
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

  const lightningBolt = shapeSvg.insert('g', ':first-child');
  lightningBolt.insert(() => lineNode, ':first-child');

  lightningBolt.attr('class', 'basic label-container');

  if (cssStyles) {
    lightningBolt.attr('style', cssStyles);
  }

  if (nodeStyles) {
    lightningBolt.attr('style', nodeStyles);
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
