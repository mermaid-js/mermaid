import { log } from '$root/logger.js';
import { getNodeClasses, labelHelper, updateNodeBounds } from './util.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import type { SVG } from '$root/diagram-api/types.js';
import { styles2String } from '$root/rendering-util/rendering-elements/shapes/handDrawnShapeStyles.js';
import intersect from '../intersect/index.js';
import { getIconSVG } from '$root/rendering-util/icons.js';

export const icon = async (parent: SVG, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, halfPadding, label } = await labelHelper(
    parent,
    node,
    getNodeClasses(node)
  );

  const { cssStyles } = node;
  const topLabel = node.pos === 't';
  const labelWidth = Math.max(bbox.width + halfPadding * 2, node?.width ?? 0);
  const labelHeight = Math.max(bbox.height + halfPadding * 2, node?.height ?? 0);

  const iconSize = Math.max(labelHeight - halfPadding, labelWidth - halfPadding, 48);
  const width = Math.max(labelWidth, iconSize);
  const height = labelHeight + iconSize + halfPadding * 2;

  const points = [
    { x: 0, y: 0 },
    { x: 0, y: height },
    { x: width, y: height },
    { x: width, y: 0 },
  ];

  if (node.icon) {
    const iconElem = shapeSvg.append('g');
    iconElem.html(
      `<g>${await getIconSVG(node.icon, { height: iconSize, width: iconSize, fallbackPrefix: '' })}</g>`
    );
    iconElem.attr(
      'transform',
      `translate(${0}, ${topLabel ? labelHeight - halfPadding : 0 + halfPadding * 2})`
    );
  }

  if (cssStyles && node.look !== 'handDrawn') {
    shapeSvg.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    shapeSvg.selectAll('path').attr('style', nodeStyles);
  }

  label.attr(
    'transform',
    `translate(${width / 2 - labelWidth / 2 + halfPadding - (bbox.x - (bbox.left ?? 0))},${(topLabel ? 0 : iconSize) + halfPadding * 2})`
  );
  updateNodeBounds(node, shapeSvg);

  node.intersect = function (point) {
    log.info('iconSquare intersect', node, point);
    const pos = intersect.polygon(node, points, point);
    return pos;
  };

  return shapeSvg;
};
