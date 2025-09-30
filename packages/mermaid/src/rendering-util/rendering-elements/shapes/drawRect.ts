import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node, RectOptions } from '../../types.js';
import { createRoundedRectPathD } from './roundedRectPath.js';
import { userNodeOverrides, styles2String } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';
import { handleUndefinedAttr } from '../../../utils.js';
import type { Bounds, Point } from '../../../types.js';

export async function drawRect<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node,
  options: RectOptions
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const ICON_SIZE = 30;
  const ICON_PADDING = 10;

  let totalWidth = Math.max(bbox.width + options.labelPaddingX * 2, node?.width || 0);
  let totalHeight = Math.max(bbox.height + options.labelPaddingY * 2, node?.height || 0);

  let labelXOffset = -bbox.width / 2;
  if (node.icon) {
    const minWidthWithIcon = bbox.width + ICON_SIZE + ICON_PADDING * 2 + options.labelPaddingX * 2;
    totalWidth = Math.max(totalWidth, minWidthWithIcon);
    totalHeight = Math.max(totalHeight, ICON_SIZE + options.labelPaddingY * 2);

    node.width = totalWidth;
    node.height = totalHeight;

    const availableTextSpace = totalWidth - ICON_SIZE - ICON_PADDING * 2;
    labelXOffset =
      -totalWidth / 2 + ICON_SIZE + ICON_PADDING + availableTextSpace / 2 - bbox.width / 2;
  } else {
    node.width = totalWidth;
    node.height = totalHeight;
  }
  const labelYOffset = -bbox.height / 2;
  label.attr('transform', `translate(${labelXOffset}, ${labelYOffset})`);
  const x = -totalWidth / 2;
  const y = -totalHeight / 2;

  // log.info('IPI node = ', node);

  let rect;
  let { rx, ry } = node;
  const { cssStyles } = node;

  //use options rx, ry overrides if present
  if (options?.rx && options.ry) {
    rx = options.rx;
    ry = options.ry;
  }

  if (node.look === 'handDrawn') {
    // @ts-ignore TODO: Fix rough typings
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});

    const roughNode =
      rx || ry
        ? rc.path(createRoundedRectPathD(x, y, totalWidth, totalHeight, rx || 0), options)
        : rc.rectangle(x, y, totalWidth, totalHeight, options);

    rect = shapeSvg.insert(() => roughNode, ':first-child');
    rect.attr('class', 'basic label-container').attr('style', handleUndefinedAttr(cssStyles));
  } else {
    rect = shapeSvg.insert('rect', ':first-child');

    rect
      .attr('class', 'basic label-container')
      .attr('style', nodeStyles)
      .attr('rx', handleUndefinedAttr(rx))
      .attr('ry', handleUndefinedAttr(ry))
      .attr('x', x)
      .attr('y', y)
      .attr('width', totalWidth)
      .attr('height', totalHeight);
  }

  updateNodeBounds(node, rect);

  node.calcIntersect = function (bounds: Bounds, point: Point) {
    return intersect.rect(bounds, point);
  };

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
}
