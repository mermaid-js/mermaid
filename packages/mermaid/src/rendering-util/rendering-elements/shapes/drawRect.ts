import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node, RectOptions } from '../../types.js';
import { createRoundedRectPathD } from './roundedRectPath.js';
import { userNodeOverrides, styles2String } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';
import { handleUndefinedAttr } from '../../../utils.js';

export async function drawRect<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node,
  options: RectOptions
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  // If incoming height & width are present, subtract the padding from them
  // as labelHelper does not take padding into account
  // also check if the width or height is less than minimum default values (50),
  // if so set it to min value
  if (node.width || node.height) {
    node.width = (node?.width ?? 10) - options.labelPaddingX * 2;
    node.height = (node?.height ?? 10) - options.labelPaddingY * 2;
  }

  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  const totalWidth = (node?.width ? node?.width : bbox.width) + options.labelPaddingX * 2;
  const totalHeight = (node?.height ? node?.height : bbox.height) + options.labelPaddingY * 2;

  const x = -totalWidth / 2;
  const y = -totalHeight / 2;
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

    const rectClass = 'basic label-container';

    rect
      .attr('class', rectClass)
      .attr('style', nodeStyles)
      .attr('rx', handleUndefinedAttr(rx))
      .attr('data-id', node.id)
      .attr('ry', handleUndefinedAttr(ry))
      .attr('x', x)
      .attr('y', y)
      .attr('width', totalWidth)
      .attr('height', totalHeight)
      .attr('stroke', 'url(#gradient)');
  }

  updateNodeBounds(node, rect);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
}
