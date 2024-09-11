import { log } from '../../../logger.js';
import { labelHelper, updateNodeBounds } from './util.js';
import type { Node } from '../../types.js';
import type { SVG } from '../../../diagram-api/types.js';
import { compileStyles, styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';
import { getIconSVG } from '../../icons.js';
import { getConfig } from '../../../diagram-api/diagramAPI.js';
import { createRoundedRectPathD } from './roundedRectPath.js';

export const iconRounded = async (parent: SVG, node: Node, dir: string) => {
  const translateHorizontal = dir === 'TB' || dir === 'BT' || dir === 'TD' || dir === 'DT';
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
    'icon-shape default'
  );
  const { cssStyles } = node;

  const topLabel = node.pos === 't';

  const height = iconSize + halfPadding * 2;
  const width = iconSize + halfPadding * 2;
  const { themeVariables } = getConfig();
  const { mainBkg } = themeVariables;
  const { stylesMap } = compileStyles(node);

  const x = -width / 2;
  const y = -height / 2;

  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, { stroke: stylesMap.get('fill') || mainBkg });

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const iconNode = rc.path(createRoundedRectPathD(x, y, width, height, 5), options);

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
      `translate(${-iconWidth / 2},${topLabel ? height / 2 - iconHeight - halfPadding + (translateHorizontal ? bbox.height / 2 : 0) : -height / 2 + halfPadding - (translateHorizontal ? bbox.height / 2 : 0)})`
    );
  }

  label.attr(
    'transform',
    `translate(${-width / 2 + width / 2 - bbox.width / 2},${topLabel ? -height / 2 - 2.5 - (translateHorizontal ? bbox.height / 2 : bbox.height) : height / 2 + 5 - (translateHorizontal ? bbox.height / 2 : 0)})`
  );

  if (translateHorizontal) {
    iconShape.attr('transform', `translate(${0},${topLabel ? bbox.height / 2 : -bbox.height / 2})`);
  }

  if (cssStyles && node.look !== 'handDrawn') {
    iconShape.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    iconShape.selectAll('path').attr('style', nodeStyles);
  }

  updateNodeBounds(node, shapeSvg);

  node.intersect = function (point) {
    log.info('iconSquare intersect', node, point);
    const pos = intersect.rect(node, point);
    return pos;
  };

  return shapeSvg;
};
