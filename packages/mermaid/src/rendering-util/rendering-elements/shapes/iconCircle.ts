import { log } from '../../../logger.js';
import { labelHelper, updateNodeBounds } from './util.js';
import type { Node, RenderOptions } from '../../types.d.ts';
import type { SVG } from '../../../diagram-api/types.js';
import { compileStyles, styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';
import { getIconSVG } from '../../icons.js';

export const iconCircle = async (
  parent: SVG,
  node: Node,
  { config: { themeVariables, flowchart } }: RenderOptions
) => {
  const { labelStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const assetHeight = node.assetHeight ?? 48;
  const assetWidth = node.assetWidth ?? 48;
  const iconSize = Math.max(assetHeight, assetWidth);
  const defaultWidth = flowchart?.wrappingWidth;
  node.width = Math.max(iconSize, defaultWidth ?? 0);
  const { shapeSvg, bbox, halfPadding, label } = await labelHelper(
    parent,
    node,
    'icon-shape default'
  );

  const topLabel = node.pos === 't';

  const diameter = iconSize + halfPadding * 2;
  const { nodeBorder, mainBkg } = themeVariables;
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
  const iconElem = shapeSvg.append('g');
  if (node.icon) {
    iconElem.html(
      `<g>${await getIconSVG(node.icon, { height: iconSize, fallbackPrefix: '' })}</g>`
    );
    const iconBBox = iconElem.node().getBBox();
    const iconWidth = iconBBox.width;
    const iconHeight = iconBBox.height;
    iconElem.attr(
      'transform',
      `translate(${-iconWidth / 2},${topLabel ? diameter / 2 - iconHeight - halfPadding + bbox.height / 2 : -diameter / 2 + halfPadding - bbox.height / 2})`
    );
    iconElem.selectAll('path').attr('fill', stylesMap.get('stroke') || nodeBorder);
  }

  label.attr(
    'transform',
    `translate(${-diameter / 2 + diameter / 2 - bbox.width / 2},${topLabel ? -diameter / 2 - bbox.height / 2 : diameter / 2 - bbox.height / 2})`
  );

  iconShape.attr('transform', `translate(${0},${topLabel ? bbox.height / 2 : -bbox.height / 2})`);

  updateNodeBounds(node, shapeSvg);

  node.intersect = function (point) {
    log.info('iconSquare intersect', node, point);
    const pos = intersect.rect(node, point);
    return pos;
  };

  return shapeSvg;
};
