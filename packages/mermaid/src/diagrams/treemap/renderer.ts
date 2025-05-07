import type { Diagram } from '../../Diagram.js';
import type { DiagramRenderer, DrawDefinition } from '../../diagram-api/types.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import type { TreemapDB, TreemapNode } from './types.js';

const DEFAULT_PADDING = 10;
const DEFAULT_NODE_WIDTH = 100;
const DEFAULT_NODE_HEIGHT = 40;

/**
 * Draws the treemap diagram
 */
const draw: DrawDefinition = (_text, id, _version, diagram: Diagram) => {
  const treemapDb = diagram.db as TreemapDB;
  const config = treemapDb.getConfig();
  const padding = config.padding || DEFAULT_PADDING;
  const title = treemapDb.getDiagramTitle();
  const root = treemapDb.getRoot();

  if (!root) {
    return;
  }

  const svg = selectSvgElement(id);

  // Calculate the size of the treemap
  const { width, height } = calculateTreemapSize(root, config);
  const titleHeight = title ? 30 : 0;
  const svgWidth = width + padding * 2;
  const svgHeight = height + padding * 2 + titleHeight;

  // Set the SVG size
  svg.attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
  configureSvgSize(svg, svgHeight, svgWidth, config.useMaxWidth);

  // Create a container group to hold all elements
  const g = svg.append('g').attr('transform', `translate(${padding}, ${padding + titleHeight})`);

  // Draw the title if it exists
  if (title) {
    svg
      .append('text')
      .attr('x', svgWidth / 2)
      .attr('y', padding + titleHeight / 2)
      .attr('class', 'treemapTitle')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .text(title);
  }

  // Draw the treemap recursively
  drawNode(g, root, 0, 0, width, height, config);
};

/**
 * Calculates the size of the treemap
 */
const calculateTreemapSize = (
  root: TreemapNode,
  config: any
): { width: number; height: number } => {
  // If we have a value, use it as the size
  if (root.value) {
    return {
      width: config.nodeWidth || DEFAULT_NODE_WIDTH,
      height: config.nodeHeight || DEFAULT_NODE_HEIGHT,
    };
  }

  // Otherwise, layout the children
  if (!root.children || root.children.length === 0) {
    return {
      width: config.nodeWidth || DEFAULT_NODE_WIDTH,
      height: config.nodeHeight || DEFAULT_NODE_HEIGHT,
    };
  }

  // Calculate based on children
  let totalWidth = 0;
  let maxHeight = 0;

  // Arrange in a simple tiled layout
  for (const child of root.children) {
    const { width, height } = calculateTreemapSize(child, config);
    totalWidth += width + (config.padding || DEFAULT_PADDING);
    maxHeight = Math.max(maxHeight, height);
  }

  // Remove the last padding
  totalWidth -= config.padding || DEFAULT_PADDING;

  return {
    width: Math.max(totalWidth, config.nodeWidth || DEFAULT_NODE_WIDTH),
    height: Math.max(
      maxHeight + (config.padding || DEFAULT_PADDING) * 2,
      config.nodeHeight || DEFAULT_NODE_HEIGHT
    ),
  };
};

/**
 * Recursively draws a node and its children in the treemap
 */
const drawNode = (
  parent: any,
  node: TreemapNode,
  x: number,
  y: number,
  width: number,
  height: number,
  config: any
) => {
  // Add rectangle
  parent
    .append('rect')
    .attr('x', x)
    .attr('y', y)
    .attr('width', width)
    .attr('height', height)
    .attr('class', `treemapNode ${node.value ? 'treemapLeaf' : 'treemapSection'}`);

  // Add the label
  parent
    .append('text')
    .attr('x', x + width / 2)
    .attr('y', y + 20) // Position the label at the top
    .attr('class', 'treemapLabel')
    .attr('text-anchor', 'middle')
    .text(node.name);

  // Add the value if it exists and should be shown
  if (node.value !== undefined && config.showValues !== false) {
    parent
      .append('text')
      .attr('x', x + width / 2)
      .attr('y', y + height - 10) // Position the value at the bottom
      .attr('class', 'treemapValue')
      .attr('text-anchor', 'middle')
      .text(node.value);
  }

  // If this is a section with children, layout and draw the children
  if (!node.value && node.children && node.children.length > 0) {
    // Simple tiled layout for children
    const padding = config.padding || DEFAULT_PADDING;
    let currentX = x + padding;
    const innerY = y + 30; // Allow space for the label
    const innerHeight = height - 40; // Allow space for label

    for (const child of node.children) {
      const childWidth = width / node.children.length - padding;
      drawNode(parent, child, currentX, innerY, childWidth, innerHeight, config);
      currentX += childWidth + padding;
    }
  }
};

export const renderer: DiagramRenderer = { draw };
