import { log } from './logger';

/**
 * Applys d3 attributes
 *
 * @param {any} d3Elem D3 Element to apply the attributes onto
 * @param {[string, string][]} attrs Object.keys equivalent format of key to value mapping of attributes
 */
const d3Attrs = function (d3Elem, attrs) {
  for (let attr of attrs) {
    d3Elem.attr(attr[0], attr[1]);
  }
};

/**
 * Gives attributes for an SVG's size given arguments
 *
 * @param {number} height The height of the SVG
 * @param {number} width The width of the SVG
 * @param {boolean} useMaxWidth Whether or not to use max-width and set width to 100%
 * @returns {Map<'height' | 'width' | 'style', string>} Attributes for the SVG
 */
export const calculateSvgSizeAttrs = function (height, width, useMaxWidth) {
  let attrs = new Map();
  if (useMaxWidth) {
    attrs.set('width', '100%');
    attrs.set('style', `max-width: ${width}px;`);
  } else {
    attrs.set('width', width);
  }
  return attrs;
};

/**
 * Applies attributes from `calculateSvgSizeAttrs`
 *
 * @param {SVGSVGElement} svgElem The SVG Element to configure
 * @param {number} height The height of the SVG
 * @param {number} width The width of the SVG
 * @param {boolean} useMaxWidth Whether or not to use max-width and set width to 100%
 */
export const configureSvgSize = function (svgElem, height, width, useMaxWidth) {
  const attrs = calculateSvgSizeAttrs(height, width, useMaxWidth);
  d3Attrs(svgElem, attrs);
};
export const setupGraphViewbox = function (graph, svgElem, padding, useMaxWidth) {
  const svgBounds = svgElem.node().getBBox();
  const sWidth = svgBounds.width;
  const sHeight = svgBounds.height;

  log.info(`SVG bounds: ${sWidth}x${sHeight}`, svgBounds);

  let width = 0;
  let height = 0;
  log.info(`Graph bounds: ${width}x${height}`, graph);

  // let tx = 0;
  // let ty = 0;
  // if (sWidth > width) {
  //   tx = (sWidth - width) / 2 + padding;
  width = sWidth + padding * 2;
  // } else {
  //   if (Math.abs(sWidth - width) >= 2 * padding + 1) {
  //     width = width - padding;
  //   }
  // }
  // if (sHeight > height) {
  //   ty = (sHeight - height) / 2 + padding;
  height = sHeight + padding * 2;
  // }

  // width =
  log.info(`Calculated bounds: ${width}x${height}`);
  configureSvgSize(svgElem, height, width, useMaxWidth);

  // Ensure the viewBox includes the whole svgBounds area with extra space for padding
  // const vBox = `0 0 ${width} ${height}`;
  const vBox = `${svgBounds.x - padding} ${svgBounds.y - padding} ${
    svgBounds.width + 2 * padding
  } ${svgBounds.height + 2 * padding}`;

  svgElem.attr('viewBox', vBox);
};
