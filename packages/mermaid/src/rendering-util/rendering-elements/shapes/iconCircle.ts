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
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, 'icon-shape default');

  const padding = node.look === 'neo' ? 30 : 20;
  const labelPadding = node.label ? 8 : 0;

  const topLabel = node.pos === 't';

  const { nodeBorder, mainBkg } = themeVariables;
  const { stylesMap } = compileStyles(node);
  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, { stroke: stylesMap.get('fill') ?? mainBkg });

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const iconElem = shapeSvg.append('g');
  if (node.icon) {
    iconElem.html(
      `<g>${await getIconSVG(node.icon, { height: iconSize, width: iconSize, fallbackPrefix: '' })}</g>`
    );
  }
  const iconBBox = iconElem.node().getBBox();
  const iconWidth = iconBBox.width;
  const iconHeight = iconBBox.height;
  const iconX = iconBBox.x;
  // const iconY = iconBBox.y;

  const diameter = Math.max(iconWidth, iconHeight) * Math.SQRT2 + padding * 2;
  const iconNode = rc.circle(0, 0, diameter, options);

  // const outerWidth = Math.max(diameter, bbox.width);
  // const outerHeight = diameter + bbox.height + labelPadding;

  // const outerNode = rc.rectangle(-outerWidth / 2, -outerHeight / 2, outerWidth, outerHeight, {
  //   ...options,
  //   fill: 'transparent',
  //   stroke: 'none',
  // });

  const iconShape = shapeSvg.insert(() => iconNode, ':first-child');
  // const outerShape = shapeSvg.insert(() => outerNode);
  // iconElem.attr(
  //   'transform',
  //   `translate(${-iconWidth / 2 - iconX},${topLabel ? bbox.height / 2 + labelPadding / 2 - iconHeight / 2 - iconY : -bbox.height / 2 - labelPadding / 2 - iconHeight / 2 - iconY})`
  // );
  iconElem.attr(
    'transform',
    `translate(${-iconWidth / 2 - iconX},${topLabel ? -iconSize / 2 : -iconSize / 2})`
  );
  iconElem.selectAll('path').attr('fill', stylesMap.get('stroke') ?? nodeBorder);
  iconElem.attr('class', 'icon');
  // label.attr(
  //   'transform',
  //   `translate(${-bbox.width / 2 - (bbox.x - (bbox.left ?? 0))},${topLabel ? -outerHeight / 2 : outerHeight / 2 - bbox.height})`
  // );
  label.attr(
    'transform',
    `translate(${-bbox.width / 2 - (bbox.x - (bbox.left ?? 0))},${topLabel ? -diameter / 2 - bbox.height - labelPadding : diameter / 2 + labelPadding})`
  );

  // iconShape.attr(
  //   'transform',
  //   `translate(${0},${topLabel ? bbox.height / 2 + labelPadding / 2 : -bbox.height / 2 - labelPadding / 2})`
  // );

  if (stylesMap.get('stroke')) {
    iconElem.selectAll('path').attr('style', `fill: ${stylesMap.get('stroke')}`);
  }

  if (stylesMap.get('fill')) {
    iconShape.selectAll('path').attr('style', `stroke: ${stylesMap.get('fill')}`);
  }

  updateNodeBounds(node, iconShape);

  node.intersect = function (point) {
    log.info('iconSquare intersect', node, point);
    const pos = intersect.circle(node, diameter / 2, point);
    return pos;
  };

  return shapeSvg;
};
