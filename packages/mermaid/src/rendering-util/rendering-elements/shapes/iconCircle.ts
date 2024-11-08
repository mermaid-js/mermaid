import rough from 'roughjs';
import { log } from '../../../logger.js';
import { getIconSVG } from '../../icons.js';
import type { Node, ShapeRenderOptions } from '../../types.js';
import intersect from '../intersect/index.js';
import { compileStyles, styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import { labelHelper, updateNodeBounds } from './util.js';
import type { D3Selection } from '../../../types.js';

export async function iconCircle<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node,
  { config: { themeVariables, flowchart } }: ShapeRenderOptions
) {
  const { labelStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const defaultWidth = flowchart?.wrappingWidth;
  const padding = node.height ? node.height * 0.05 : 15;
  const labelPadding = node.label ? 8 : 0;
  const assetHeight = node.assetHeight ?? 48;
  const assetWidth = node.assetWidth ?? 48;
  let iconSize = Math.max(assetHeight, assetWidth) / Math.SQRT2 - padding;
  let height = Math.max(assetHeight, assetWidth);
  let width = Math.max(assetHeight, assetWidth);
  // node.width = Math.max(iconSize, defaultWidth ?? 0);

  let adjustDimensions = false;
  if (node.width || node.height) {
    adjustDimensions = true;
    node.width = ((node?.width ?? 10) - labelPadding * 2) / Math.SQRT2 - padding;
    node.height = ((node?.height ?? 10) - labelPadding * 2) / Math.SQRT2 - padding;
    width = node.width;
    height = node.height;
  } else {
    node.width = Math.max(width, defaultWidth ?? 0);
  }

  const { shapeSvg, bbox, label } = await labelHelper(parent, node, 'icon-shape default');
  const topLabel = node.pos === 't';

  if (adjustDimensions) {
    node.width = (node.width + padding) * Math.SQRT2 + labelPadding * 2;
    node.height = ((node.height ?? 10) + padding) * Math.SQRT2 + labelPadding * 2;
    width = node.width; // / Math.SQRT2 - padding ;
    height = node.height; // / Math.SQRT2 - padding;
    iconSize = (Math.max(node.width, node.height) - padding) / Math.SQRT2;
  }

  const { nodeBorder, mainBkg } = themeVariables;
  const { stylesMap } = compileStyles(node);
  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }
  const fill = stylesMap.get('fill');
  options.stroke = fill ?? mainBkg;

  const iconElem = shapeSvg.append('g');
  if (node.icon) {
    iconElem.html(
      `<g>${await getIconSVG(node.icon, {
        height: iconSize,
        width: iconSize,
        fallbackPrefix: '',
      })}</g>`
    );
  }
  const iconBBox = iconElem.node()!.getBBox();
  const iconWidth = iconBBox.width;
  // const iconHeight = iconBBox.height;
  const iconX = iconBBox.x;
  // const iconY = iconBBox.y;

  const diameter = Math.max(height, width);
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
  iconElem.attr('style', `color : ${stylesMap.get('stroke') ?? nodeBorder};`);
  iconElem
    .selectAll<SVGPathElement, unknown>('path')
    .nodes()
    .forEach((path) => {
      if (path.getAttribute('fill') === 'currentColor') {
        path.setAttribute('class', 'icon');
      }
    });
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

  iconShape.attr('class', 'icon-neo');

  updateNodeBounds(node, iconShape);

  node.intersect = function (point) {
    log.info('iconSquare intersect', node, point);
    const pos = intersect.circle(node, diameter / 2, point);
    return pos;
  };

  return shapeSvg;
}
