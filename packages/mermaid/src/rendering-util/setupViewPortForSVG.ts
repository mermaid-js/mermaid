import { configureSvgSize } from '../setupGraphViewbox.js';
import type { SVG } from '../diagram-api/types.js';
import { log } from '../logger.js';

export const setupViewPortForSVG = (
  svg: SVG,
  padding: number,
  cssDiagram: string,
  useMaxWidth: boolean
) => {
  // Initialize the SVG element and set the diagram class
  svg.attr('class', cssDiagram);

  // Calculate the dimensions and position with padding
  const { width, height, x, y } = calculateDimensionsWithPadding(svg, padding);

  // Configure the size and aspect ratio of the SVG
  configureSvgSize(svg, height, width, useMaxWidth);

  // Update the viewBox to ensure all content is visible with padding
  const viewBox = createViewBox(x, y, width, height, padding);
  svg.attr('viewBox', viewBox);

  // Log the viewBox configuration for debugging
  log.debug(`viewBox configured: ${viewBox} with padding: ${padding}`);
};

const calculateDimensionsWithPadding = (svg: SVG, padding: number) => {
  const bounds = svg.node()?.getBBox() || { width: 0, height: 0, x: 0, y: 0 };
  return {
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2,
    x: bounds.x,
    y: bounds.y,
  };
};

const createViewBox = (x: number, y: number, width: number, height: number, padding: number) => {
  return `${x - padding} ${y - padding} ${width} ${height}`;
};
