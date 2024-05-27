import { log } from '$root/logger.js';
import { labelHelper, updateNodeBounds } from './util.js';
import intersect from '../intersect/index.js';
import type { Node, RectOptions } from '$root/rendering-util/types.d.ts';
import { createRoundedRectPathD } from './roundedRectPath.js';
import { getConfig } from '$root/diagram-api/diagramAPI.js';
import { userNodeOverrides } from '$root/rendering-util/rendering-elements/shapes/handdrawnStyles.js';
import rough from 'roughjs';

// function applyNodePropertyBorders(
//   rect: d3.Selection<SVGRectElement, unknown, null, undefined>,
//   borders: string | undefined,
//   totalWidth: number,
//   totalHeight: number
// ) {
//   if (!borders) {
//     return;
//   }
//   const strokeDashArray: number[] = [];
//   const addBorder = (length: number) => {
//     strokeDashArray.push(length, 0);
//   };
//   const skipBorder = (length: number) => {
//     strokeDashArray.push(0, length);
//   };
//   if (borders.includes('t')) {
//     log.debug('add top border');
//     addBorder(totalWidth);
//   } else {
//     skipBorder(totalWidth);
//   }
//   if (borders.includes('r')) {
//     log.debug('add right border');
//     addBorder(totalHeight);
//   } else {
//     skipBorder(totalHeight);
//   }
//   if (borders.includes('b')) {
//     log.debug('add bottom border');
//     addBorder(totalWidth);
//   } else {
//     skipBorder(totalWidth);
//   }
//   if (borders.includes('l')) {
//     log.debug('add left border');
//     addBorder(totalHeight);
//   } else {
//     skipBorder(totalHeight);
//   }

//   rect.attr('stroke-dasharray', strokeDashArray.join(' '));
// }

export const drawRect = async (parent: SVGAElement, node: Node, options: RectOptions) => {
  const { themeVariables, handdrawnSeed } = getConfig();
  const { nodeBorder, mainBkg } = themeVariables;

  const { shapeSvg, bbox, halfPadding } = await labelHelper(
    parent,
    node,
    'node ' + node.cssClasses, // + ' ' + node.class,
    true
  );

  const totalWidth = bbox.width + node.padding;
  const totalHeight = bbox.height + node.padding;
  const x = -bbox.width / 2 - halfPadding;
  const y = -bbox.height / 2 - halfPadding;

  let rect;
  let { rx, ry, cssStyles, useRough } = node;

  //use options rx, ry overrides if present
  if (options && options.rx && options.ry) {
    rx = options.rx;
    ry = options.ry;
  }

  if (useRough) {
    // @ts-ignore TODO: Fix rough typings
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {
      roughness: 0.7,
      fill: mainBkg,
      // fillStyle: 'solid', // solid fill'
      fillStyle: 'hachure', // solid fill'
      fillWeight: 3.5,
      stroke: nodeBorder,
      seed: handdrawnSeed,
    });

    console.log('rect options: ', options);
    const roughNode =
      rx || ry
        ? rc.path(createRoundedRectPathD(x, y, totalWidth, totalHeight, rx || 0), options)
        : rc.rectangle(x, y, totalWidth, totalHeight, options);

    rect = shapeSvg.insert(() => roughNode, ':first-child');
    rect.attr('class', 'basic label-container').attr('style', cssStyles);
  } else {
    rect = shapeSvg.insert('rect', ':first-child');

    rect
      .attr('class', 'basic label-container')
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

  // if (node.props) {
  //   const propKeys = new Set(Object.keys(node.props));
  //   if (node.props.borders) {
  //     applyNodePropertyBorders(rect, node.props.borders + '', totalWidth, totalHeight);
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

export const labelRect = async (parent: SVGElement, node: Node) => {
  const { shapeSvg } = await labelHelper(parent, node, 'label', true);

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
