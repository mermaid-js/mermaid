import type { BaseType, Selection } from 'd3';
import { log } from './logger.js';
import type { SVG } from './diagram-api/types.js';

/**
 * Some renderers pass a plain d3 selection (e.g. created via `select(...)` without
 * narrowing the element type), so accept those in addition to the `SVG` selection type.
 */
type SvgSelection = SVG | Selection<BaseType, unknown, HTMLElement, unknown>;

type SvgSizeAttrs = Map<'height' | 'width' | 'style', string | number>;

/**
 * Applies d3 attributes
 *
 * @param d3Elem - D3 Element to apply the attributes onto
 * @param attrs - Object.keys equivalent format of key to value mapping of attributes
 */
const d3Attrs = function (d3Elem: SvgSelection, attrs: SvgSizeAttrs) {
  for (const attr of attrs) {
    d3Elem.attr(attr[0], attr[1]);
  }
};

/**
 * Gives attributes for an SVG's size given arguments
 *
 * @param height - The height of the SVG
 * @param width - The width of the SVG
 * @param useMaxWidth - Whether or not to use max-width and set width to 100%
 * @returns Attributes for the SVG
 */
export const calculateSvgSizeAttrs = function (
  height: number,
  width: number,
  useMaxWidth?: boolean
): SvgSizeAttrs {
  const attrs: SvgSizeAttrs = new Map();
  if (useMaxWidth) {
    attrs.set('width', '100%');
    attrs.set('style', `max-width: ${width}px;`);
  } else {
    attrs.set('height', height);
    attrs.set('width', width);
  }
  return attrs;
};

/**
 * Applies attributes from `calculateSvgSizeAttrs`
 *
 * @param svgElem - The SVG Element to configure
 * @param height - The height of the SVG
 * @param width - The width of the SVG
 * @param useMaxWidth - Whether or not to use max-width and set width to 100%
 */
export const configureSvgSize = function (
  svgElem: SvgSelection,
  height: number,
  width: number,
  useMaxWidth?: boolean
) {
  const attrs = calculateSvgSizeAttrs(height, width, useMaxWidth);
  d3Attrs(svgElem, attrs);
};

// TODO v11: Remove the graph parameter. It is not used.
export const setupGraphViewbox = function (
  graph: unknown,
  svgElem: SvgSelection,
  padding?: number,
  useMaxWidth?: boolean
) {
  const svgBounds = (svgElem.node() as SVGSVGElement).getBBox();
  const sWidth = svgBounds.width;
  const sHeight = svgBounds.height;

  log.info(`SVG bounds: ${sWidth}x${sHeight}`, svgBounds);

  let width = 0;
  let height = 0;
  log.info(`Graph bounds: ${width}x${height}`, graph);

  width = sWidth + padding! * 2;
  height = sHeight + padding! * 2;

  log.info(`Calculated bounds: ${width}x${height}`);
  configureSvgSize(svgElem, height, width, useMaxWidth);

  // Ensure the viewBox includes the whole svgBounds area with extra space for padding
  const vBox = `${svgBounds.x - padding!} ${svgBounds.y - padding!} ${
    svgBounds.width + 2 * padding!
  } ${svgBounds.height + 2 * padding!}`;

  svgElem.attr('viewBox', vBox);
};
