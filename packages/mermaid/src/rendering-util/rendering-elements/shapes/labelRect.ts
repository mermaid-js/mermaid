import type { Node, RectOptions } from '$root/rendering-util/types.d.ts';
import { drawRect } from './drawRect.js';
import { labelHelper, updateNodeBounds } from './util.js';
import intersect from '../intersect/index.js';

export const roundedRect = async (parent: SVGAElement, node: Node) => {
  const options = {
    rx: 5,
    ry: 5,
    classes: '',
    labelPaddingX: (node?.padding || 0) * 1,
    labelPaddingY: (node?.padding || 0) * 1,
  } as RectOptions;

  return drawRect(parent, node, options);
};

export const labelRect = async (parent: SVGElement, node: Node) => {
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, 'label');

  // log.trace('Classes = ', node.class);
  // add the rect
  const rect = shapeSvg.insert('rect', ':first-child');

  // Hide the rect we are only after the label
  const totalWidth = 0.1;
  const totalHeight = 0.1;
  rect.attr('width', totalWidth).attr('height', totalHeight);
  shapeSvg.attr('class', 'label edgeLabel');
  label.attr(
    'transform',
    `translate(${-(bbox.width / 2) - (bbox.x - (bbox.left ?? 0))}, ${-(bbox.height / 2) - (bbox.y - (bbox.top ?? 0))})`
  );

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
  // node.width = 1;
  // node.height = 1;

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
};
