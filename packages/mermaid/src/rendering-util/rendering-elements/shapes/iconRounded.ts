import { log } from '../../../logger.js';
import { labelHelper, updateNodeBounds } from './util.js';
import type { Node, RenderOptions } from '../../types.js';
import type { SVG } from '../../../diagram-api/types.js';
import { compileStyles, styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';
import { getIconSVG } from '../../icons.js';
import { createRoundedRectPathD } from './roundedRectPath.js';

export const iconRounded = async (
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

  const height = iconSize + halfPadding * 2;
  const width = iconSize + halfPadding * 2;
  const { nodeBorder, mainBkg } = themeVariables;
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
      `translate(${-iconWidth / 2},${topLabel ? height / 2 - iconHeight - halfPadding + bbox.height / 2 : -height / 2 + halfPadding - bbox.height / 2})`
    );
    iconElem.selectAll('path').attr('fill', stylesMap.get('stroke') || nodeBorder);
  }

  label.attr(
    'transform',
    `translate(${-width / 2 + width / 2 - bbox.width / 2},${topLabel ? -height / 2 - 5 - bbox.height / 2 : height / 2 - bbox.height / 2})`
  );

  iconShape.attr('transform', `translate(${0},${topLabel ? bbox.height / 2 : -bbox.height / 2})`);

  updateNodeBounds(node, shapeSvg);

  node.intersect = function (point) {
    log.info('iconSquare intersect', node, point);
    if (!node.label) {
      return intersect.rect(node, point);
    }
    const dx = node.x ?? 0;
    const dy = node.y ?? 0;
    const nodeWidth = node.width ?? 0;
    const nodeHeight = node.height ?? 0;

    if (topLabel) {
      const points = [
        { x: dx - nodeWidth / 2, y: dy - nodeHeight / 2 - bbox.height / 2 },
        { x: dx + nodeWidth / 2, y: dy - nodeHeight / 2 - bbox.height / 2 },
        { x: dx + nodeWidth / 2, y: dy - nodeHeight / 2 + bbox.height - bbox.height / 2 },
        {
          x: dx + nodeWidth / 2 - (bbox.width - width) / 2,
          y: dy - nodeHeight / 2 + bbox.height - bbox.height / 2,
        },
        {
          x: dx + nodeWidth / 2 - (bbox.width - width) / 2,
          y: dy + nodeHeight / 2 - bbox.height / 2,
        },
        {
          x: dx + nodeWidth / 2 - (bbox.width - width) / 2 - width,
          y: dy + nodeHeight / 2 - bbox.height / 2,
        },
        {
          x: dx + nodeWidth / 2 - (bbox.width - width) / 2 - width,
          y: dy - nodeHeight / 2 + bbox.height - bbox.height / 2,
        },
        { x: dx - nodeWidth / 2, y: dy - nodeHeight / 2 + bbox.height - bbox.height / 2 },
      ];
      const pos = intersect.polygon(node, points, point);
      return pos;
    } else {
      const points = [
        { x: dx - nodeWidth / 2 + (bbox.width - width) / 2, y: dy - nodeHeight / 2 },
        { x: dx - nodeWidth / 2 + (bbox.width - width) / 2 + width, y: dy - nodeHeight / 2 },
        {
          x: dx - nodeWidth / 2 + (bbox.width - width) / 2 + width,
          y: dy - nodeHeight / 2 + height,
        },
        { x: dx + nodeWidth / 2, y: dy - nodeHeight / 2 + height },
        { x: dx + nodeWidth / 2, y: dy + nodeHeight / 2 },
        { x: dx - nodeWidth / 2, y: dy + nodeHeight / 2 },
        { x: dx - nodeWidth / 2, y: dy + nodeHeight / 2 - bbox.height },
        { x: dx - nodeWidth / 2 + (bbox.width - width) / 2, y: dy + nodeHeight / 2 - bbox.height },
      ];
      const pos = intersect.polygon(node, points, point);
      return pos;
    }
  };

  return shapeSvg;
};
