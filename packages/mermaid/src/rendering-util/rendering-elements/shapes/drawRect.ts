import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node, RectOptions } from '$root/rendering-util/types.d.ts';
import { createRoundedRectPathD } from './roundedRectPath.js';
import { userNodeOverrides } from '$root/rendering-util/rendering-elements/shapes/handdrawnStyles.js';
import rough from 'roughjs';
import { getConfig } from '$root/diagram-api/diagramAPI.js';

export const drawRect = async (parent: SVGAElement, node: Node, options: RectOptions) => {
  const { look } = getConfig();

  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  const totalWidth = Math.max(bbox.width + options.labelPaddingX * 2, node?.width || 0);
  const totalHeight = Math.max(bbox.height + options.labelPaddingY * 2, node?.height || 0);
  const x = -totalWidth / 2;
  const y = -totalHeight / 2;

  let rect;
  node.look = look;
  let { rx, ry } = node;
  const { cssStyles } = node;

  //use options rx, ry overrides if present
  if (options && options.rx && options.ry) {
    rx = options.rx;
    ry = options.ry;
  }

  if (node.look === 'handdrawn') {
    // @ts-ignore TODO: Fix rough typings
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});

    const roughNode =
      rx || ry
        ? rc.path(createRoundedRectPathD(x, y, totalWidth, totalHeight, rx || 0), options)
        : rc.rectangle(x, y, totalWidth, totalHeight, options);

    rect = shapeSvg.insert(() => roughNode, ':first-child');
    rect.attr('class', 'basic label-container').attr('style', cssStyles);
  } else {
    rect = shapeSvg.insert('rect', ':first-child');

    let rectClass = 'basic label-container';
    if (node.look === 'neo') {
      rectClass += ' state-shadow-neo';
    }

    rect
      .attr('class', rectClass)
      .attr('style', cssStyles)
      .attr('rx', rx)
      .attr('data-id', 'abc')
      .attr('data-et', 'node')
      .attr('ry', ry)
      .attr('x', x)
      .attr('y', y)
      .attr('width', totalWidth)
      .attr('height', totalHeight);
  }

  updateNodeBounds(node, rect);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
};

export const labelRect = async (parent: SVGElement, node: Node) => {
  const { shapeSvg } = await labelHelper(parent, node, 'label');

  // log.trace('Classes = ', node.class);
  // add the rect
  const rect = shapeSvg.insert('rect', ':first-child');

  // Hide the rect we are only after the label
  const totalWidth = 0;
  const totalHeight = 0;
  rect.attr('width', totalWidth).attr('height', totalHeight);
  shapeSvg.attr('class', 'label edgeLabel');

  // if (node.props) {
  //   const propKeys = new Set(Object.keys(node.props));
  //   if (node.props.borders) {
  //     applyNodePropertyBorders(rect, node.borders, totalWidth, totalHeight);
  //     propKeys.delete('borders');
  //   }
  //   propKeys.forEach((propKey) => {
  //     log.warn(`Unknown node property ${propKey}`);
  //   });
  // }

  updateNodeBounds(node, rect);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
};
