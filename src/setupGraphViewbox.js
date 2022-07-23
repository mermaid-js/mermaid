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
  attrs.set('height', height);
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
 * @param tx
 * @param ty
 * @param {boolean} useMaxWidth Whether or not to use max-width and set width to 100%
 */
export const configureSvgSize = function (svgElem, height, width, tx, ty, useMaxWidth) {
  const attrs = calculateSvgSizeAttrs(height, width, useMaxWidth);
  d3Attrs(svgElem, attrs);
};
export const setupGraphViewbox = function (graph, svgElem, padding, useMaxWidth) {
  const svgBounds = svgElem.node().getBBox();
  const sWidth = svgBounds.width;
  const sHeight = svgBounds.height;

  let width;
  let height;
  let tx = 0;
  let ty = 0;
  if (graph) {
    width = graph._label.width;
    height = graph._label.height;
    if (sWidth > width) {
      tx = (sWidth - width) / 2 + padding;
      width = sWidth + padding * 2;
    } else {
      if (Math.abs(sWidth - width) >= 2 * padding + 1) {
        width = width - padding;
      }
    }
    if (sHeight > height) {
      ty = (sHeight - height) / 2 + padding;
      height = sHeight + padding * 2;
    }
  } else {
    width = sWidth + padding * 2;
    height = sHeight + padding * 2;
  }

  // Ensure the viewBox includes the whole svgBounds area with extra space for padding
  const vBox = graph
    ? `0 0 ${width} ${height}`
    : `${svgBounds.x - padding} ${svgBounds.y - padding} ${width} ${height}`;
  console.log(
    'Graph.label',
    graph ? graph._label : null,
    'swidth',
    sWidth,
    'sheight',
    sHeight,
    'width',
    width,
    'height',
    height,
    'tx',
    tx,
    'ty',
    ty,
    'vBox',
    vBox
  );
  svgElem.attr('viewBox', vBox);
  svgElem.select('g').attr('transform', `translate(${tx}, ${ty})`);
};
