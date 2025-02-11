import rough from 'roughjs';
import { log } from '../../../logger.js';
import { getIconSVG } from '../../icons.js';
import type { Node, ShapeRenderOptions } from '../../types.js';
import intersect from '../intersect/index.js';
import { createRoundedRectPathD } from './roundedRectPath.js';
import { compileStyles, styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import { labelHelper, updateNodeBounds } from './util.js';
import type { D3Selection } from '../../../types.js';

export async function iconSquare<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node,
  { config: { themeVariables, flowchart } }: ShapeRenderOptions
) {
  const { labelStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const defaultWidth = flowchart?.wrappingWidth;
  const labelPadding = node.label ? 8 : 0;
  const padding = node.height ? node.height * 0.05 : 15;
  const assetHeight = node.assetHeight ?? 48;
  const assetWidth = node.assetWidth ?? 48;
  let iconSize = Math.max(assetHeight, assetWidth);
  let height = iconSize + padding * 2;
  let width = iconSize + padding * 2;

  let adjustDimensions = false;
  if (node.width || node.height) {
    adjustDimensions = true;
    node.width = (node?.width ?? 10) - labelPadding * 2;
    node.height = (node?.height ?? 10) - labelPadding * 2;
    width = node.width;
    height = node.height;
  } else {
    node.width = Math.max(width, defaultWidth ?? 0);
  }
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, 'icon-shape default');
  const topLabel = node.pos === 't';

  // node.width = Math.max(iconSize, defaultWidth ?? 0);

  if (adjustDimensions) {
    node.width = node.width + labelPadding * 2;
    node.height = (node.height ?? 10) + labelPadding * 2;
    width = node.width;
    height = node.height;
    iconSize = Math.max(node.width - padding * 2, node.height - padding * 2);
  }

  //const height = iconSize + padding * 2;
  //const width = iconSize + padding * 2;
  const { nodeBorder, mainBkg } = themeVariables;
  const { stylesMap } = compileStyles(node);

  const x = -width / 2;
  const y = -height / 2;

  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }
  const fill = stylesMap.get('fill');
  options.stroke = fill ?? mainBkg;

  const iconNode = rc.path(createRoundedRectPathD(x, y, width, height, 0.1), options);

  // const outerWidth = Math.max(width, bbox.width);
  // const outerHeight = height + bbox.height + labelPadding;

  // const outerNode = rc.rectangle(-outerWidth / 2, -outerHeight / 2, outerWidth, outerHeight, {
  //   ...options,
  //   fill: 'transparent',
  //   stroke: 'none',
  // });

  // const outerShape = shapeSvg.insert(() => outerNode);
  const iconElem = shapeSvg.append('g');

  if (node.icon) {
    iconElem.html(
      `<g>${await getIconSVG(node.icon, { height: iconSize, fallbackPrefix: '' })}</g>`
    );
    const iconBBox = iconElem.node()!.getBBox();
    const iconWidth = iconBBox.width;
    // const iconHeight = iconBBox.height;
    const iconX = iconBBox.x;
    // const iconY = iconBBox.y;
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
  }

  label.attr(
    'transform',
    `translate(${-bbox.width / 2 - (bbox.x - (bbox.left ?? 0))},${topLabel ? -height / 2 - bbox.height - labelPadding : height / 2 + labelPadding})`
  );

  const iconShape = shapeSvg.insert(() => iconNode, ':first-child');
  // iconShape.attr(
  //   'transform',
  //   `translate(${0},${topLabel ? bbox.height / 2 - labelPadding : -bbox.height / 2  + labelPadding })`
  // );

  //   iconShape.attr(
  //   'transform',
  //   `translate(${-width/2},${topLabel ? -width / 2 : -width / 2 })`
  // );
  // rect.attr(
  //   'transform',
  //   `translate(${-width/2},${topLabel ? -width / 2 + labelPadding/2 : -width / 2 + labelPadding/2})`
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
    // if (!node.label) {
    return intersect.rect(node, point);
    // }
    // const dx = node.x ?? 0;
    // const dy = node.y ?? 0;
    // const nodeHeight = node.height ?? 0;
    // let points = [];
    // if (topLabel) {
    //   points = [
    //     { x: dx - bbox.width / 2, y: dy - nodeHeight / 2 },
    //     { x: dx + bbox.width / 2, y: dy - nodeHeight / 2 },
    //     { x: dx + bbox.width / 2, y: dy - nodeHeight / 2 + bbox.height + labelPadding },
    //     { x: dx + width / 2, y: dy - nodeHeight / 2 + bbox.height + labelPadding },
    //     { x: dx + width / 2, y: dy + nodeHeight / 2 },
    //     { x: dx - width / 2, y: dy + nodeHeight / 2 },
    //     { x: dx - width / 2, y: dy - nodeHeight / 2 + bbox.height + labelPadding },
    //     { x: dx - bbox.width / 2, y: dy - nodeHeight / 2 + bbox.height + labelPadding },
    //   ];
    // } else {
    //   points = [
    //     { x: dx - width / 2, y: dy - nodeHeight / 2 },
    //     { x: dx + width / 2, y: dy - nodeHeight / 2 },
    //     { x: dx + width / 2, y: dy - nodeHeight / 2 + height },
    //     { x: dx + bbox.width / 2, y: dy - nodeHeight / 2 + height },
    //     { x: dx + bbox.width / 2 / 2, y: dy + nodeHeight / 2 },
    //     { x: dx - bbox.width / 2, y: dy + nodeHeight / 2 },
    //     { x: dx - bbox.width / 2, y: dy - nodeHeight / 2 + height },
    //     { x: dx - width / 2, y: dy - nodeHeight / 2 + height },
    //   ];
    // }

    // const pos = intersect.polygon(node, points, point);
    // return pos;
  };

  return shapeSvg;
}
