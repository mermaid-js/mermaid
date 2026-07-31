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
  const assetHeight = node.assetHeight ?? 48;
  const assetWidth = node.assetWidth ?? 48;
  const iconSize = Math.max(assetHeight, assetWidth);
  const defaultWidth = flowchart?.wrappingWidth;
  node.width = Math.max(iconSize, defaultWidth ?? 0);
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, 'icon-shape default');

  const padding = 20;
  const labelPadding = node.label ? 8 : 0;

  const topLabel = node.pos === 't';

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
  const iconHeight = iconBBox.height;
  const iconX = iconBBox.x;
  const iconY = iconBBox.y;

  const diameter = Math.max(iconWidth, iconHeight) * Math.SQRT2 + padding * 2;
  const iconNode = rc.circle(0, 0, diameter, options);

  const outerWidth = Math.max(diameter, bbox.width);
  const outerHeight = diameter + bbox.height + labelPadding;

  const outerNode = rc.rectangle(-outerWidth / 2, -outerHeight / 2, outerWidth, outerHeight, {
    ...options,
    fill: 'transparent',
    stroke: 'none',
  });

  const iconShape = shapeSvg.insert(() => iconNode, ':first-child');
  const outerShape = shapeSvg.insert(() => outerNode);
  iconElem.attr(
    'transform',
    `translate(${-iconWidth / 2 - iconX},${
      topLabel
        ? bbox.height / 2 + labelPadding / 2 - iconHeight / 2 - iconY
        : -bbox.height / 2 - labelPadding / 2 - iconHeight / 2 - iconY
    })`
  );
  iconElem.attr('style', `color: ${stylesMap.get('stroke') ?? nodeBorder};`);
  label.attr(
    'transform',
    `translate(${-bbox.width / 2 - (bbox.x - (bbox.left ?? 0))},${
      topLabel ? -outerHeight / 2 : outerHeight / 2 - bbox.height
    })`
  );

  iconShape.attr(
    'transform',
    `translate(${0},${
      topLabel ? bbox.height / 2 + labelPadding / 2 : -bbox.height / 2 - labelPadding / 2
    })`
  );

  updateNodeBounds(node, outerShape);

  node.intersect = function (point) {
    log.info('iconSquare intersect', node, point);
    const pos = intersect.rect(node, point);
    return pos;
  };

  return shapeSvg;
}
