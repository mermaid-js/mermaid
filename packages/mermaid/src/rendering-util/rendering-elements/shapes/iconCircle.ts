import { log } from '../../../logger.js';
import { labelHelper, updateNodeBounds } from './util.js';
import type { Node } from '../../types.d.ts';
import type { SVG } from '../../../diagram-api/types.js';
import { compileStyles, styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';
import { getIconSVG } from '../../icons.js';
import { getConfig } from '../../../diagram-api/diagramAPI.js';

export const iconCircle = async (parent: SVG, node: Node, dir: string) => {
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

  const diameter = iconSize + halfPadding * 2;
  const { themeVariables } = getConfig();
  const { mainBkg } = themeVariables;
  const { stylesMap } = compileStyles(node);

  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, { stroke: stylesMap.get('fill') || mainBkg });

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const iconNode = rc.circle(0, 0, diameter, options);

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
      `translate(${-iconWidth / 2},${topLabel ? diameter / 2 - iconHeight - halfPadding + (translateHorizontal ? bbox.height / 2 : 0) : -diameter / 2 + halfPadding - (translateHorizontal ? bbox.height / 2 : 0)})`
    );
  }

  label.attr(
    'transform',
    `translate(${-diameter / 2 + diameter / 2 - bbox.width / 2},${topLabel ? -diameter / 2 - 2.5 - (translateHorizontal ? bbox.height / 2 : bbox.height) : diameter / 2 + 5 - (translateHorizontal ? bbox.height / 2 : 0)})`
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
