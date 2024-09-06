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
import { getIconSVG } from '$root/rendering-util/icons.js';

export const iconCircle = async (parent: SVG, node: Node) => {
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

  const iconSize = Math.max(labelHeight - halfPadding * 2, labelWidth - halfPadding * 2, 48);
  const radius =
    iconSize / 2 + Math.max(labelHeight / 2, labelWidth / 4) + halfPadding * 2 + iconSize / 5;

  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const roughNode = rc.circle(0, 0, radius * 2, options);

  const iconShape = shapeSvg.insert(() => roughNode, ':first-child');

  if (node.icon) {
    const iconElem = shapeSvg.append('g');
    iconElem.html(
      `<g>${await getIconSVG(node.icon, { height: iconSize, fallbackPrefix: '' })}</g>`
    );
    const iconWidth = iconElem.node().getBBox().width;
    const iconHeight = iconElem.node().getBBox().height;
    iconElem.attr(
      'transform',
      `translate(${-iconWidth / 2}, ${-iconHeight / 2 - labelHeight / 2 + (topLabel ? labelHeight : 0)})`
    );
  }

  if (cssStyles && node.look !== 'handDrawn') {
    iconShape.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    iconShape.selectAll('path').attr('style', nodeStyles);
  }

  label.attr(
    'transform',
    `translate(${-labelWidth / 2 + halfPadding - (bbox.x - (bbox.left ?? 0))},${iconSize / 2 - labelHeight / 2 + halfPadding - (topLabel ? iconSize : 0) - (bbox.y - (bbox.top ?? 0))})`
  );
  updateNodeBounds(node, iconShape);

  node.intersect = function (point) {
    log.info('iconSquare intersect', node, point);
    const pos = intersect.circle(node, radius, point);
    return pos;
  };

  return shapeSvg;
};
