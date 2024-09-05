import { log } from '$root/logger.js';
import { getNodeClasses, labelHelper, updateNodeBounds } from './util.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import type { SVG } from '$root/diagram-api/types.js';
import {
  styles2String,
  userNodeOverrides,
} from '$root/rendering-util/rendering-elements/shapes/handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';
import { createPathFromPoints } from './util.js';
import { getIconSVG } from '$root/rendering-util/icons.js';

export const iconSquare = async (parent: SVG, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const { cssStyles } = node;

  let width = Math.max(bbox.width + (node.padding ?? 0));
  let height = Math.max(bbox.height + (node.padding ?? 0));

  if (node.width) {
    width = node.width + (node.padding ?? 0);
  }

  if (node.height) {
    height = node.height + (node.padding ?? 0);
  }

  const iconSize = Math.min(width, height);

  const points = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height + iconSize + bbox.height + 5 },
    { x: 0, y: height + iconSize + bbox.height + 5 },
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

  const iconShape = shapeSvg.insert(() => lineNode, ':first-child');

  if (cssStyles && node.look !== 'handDrawn') {
    iconShape.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    iconShape.selectAll('path').attr('style', nodeStyles);
  }

  iconShape.attr('transform', `translate(${-width / 2},${-height / 2})`);

  label.attr('transform', `translate(${-width / 2},${-height / 2})`);

  updateNodeBounds(node, iconShape);

  if (node.icon) {
    const iconElem = shapeSvg.append('g');
    iconElem.html(
      `<g>${await getIconSVG(node.icon, { height: height + iconSize, fallbackPrefix: '' })}</g>`
    );
    iconElem.attr('transform', `translate(${-iconSize}, ${-iconSize / 2 + bbox.height})`);
  }

  node.intersect = function (point) {
    log.info('iconSquare intersect', node, point);
    const pos = intersect.polygon(node, points, point);
    return pos;
  };

  return shapeSvg;
};
