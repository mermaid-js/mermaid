import { log } from '../../../logger.js';
import { labelHelper, updateNodeBounds } from './util.js';
import type { Node } from '../../types.d.ts';
import type { SVG } from '../../../diagram-api/types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';
import { getIconSVG } from '../../icons.js';
import { getConfig } from '../../../diagram-api/diagramAPI.js';

export const icon = async (parent: SVG, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const assetHeight = node.assetHeight ?? 48;
  const assetWidth = node.assetWidth ?? 48;
  const iconSize = Math.max(assetHeight, assetWidth);
  const defaultWidth = getConfig()?.flowchart?.wrappingWidth;
  node.width = Math.max(iconSize, defaultWidth ?? 0);
  const { shapeSvg, bbox, halfPadding, label } = await labelHelper(
    parent,
    node,
    'icon-square default'
  );
  const { cssStyles } = node;

  const topLabel = node.pos === 't';

  const height = (node.label ? iconSize + bbox.height : iconSize) + halfPadding * 2;
  const width = Math.max(iconSize, bbox.width) + halfPadding * 2;

  const x = -width / 2;
  const y = -height / 2;

  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, { stroke: 'none', fill: 'none' });

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const iconNode = rc.rectangle(x, y, width, height, options);

  const iconShape = shapeSvg.insert(() => iconNode, ':first-child');

  if (node.icon) {
    const iconElem = shapeSvg.append('g');
    iconElem.html(
      `<g>${await getIconSVG(node.icon, { height: iconSize, fallbackPrefix: '' })}</g>`
    );
    const iconBBox = iconElem.node().getBBox();
    const iconWidth = iconBBox.width;
    const iconHeight = iconBBox.height;
    iconElem.attr(
      'transform',
      `translate(${-iconWidth / 2},${topLabel ? height / 2 - iconHeight - halfPadding / 2 : -height / 2 + halfPadding / 2})`
    );
  }

  label.attr(
    'transform',
    `translate(${-width / 2 + width / 2 - bbox.width / 2},${topLabel ? -height / 2 + halfPadding / 2 : -height / 2 + halfPadding * 1.5 + iconSize})`
  );

  if (cssStyles && node.look !== 'handDrawn') {
    iconShape.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    iconShape.selectAll('path').attr('style', nodeStyles);
  }

  updateNodeBounds(node, iconShape);

  node.intersect = function (point) {
    log.info('iconSquare intersect', node, point);
    const pos = intersect.rect(node, point);
    return pos;
  };

  return shapeSvg;
};
