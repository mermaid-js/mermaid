import type { Diagram } from '../../Diagram.js';
import type { DiagramRenderer, DrawDefinition } from '../../diagram-api/types.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import type { TreemapDB, TreemapNode } from './types.js';
import { scaleOrdinal, treemap, hierarchy, format } from 'd3';

const DEFAULT_PADDING = 1;

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
  // Use config dimensions or defaults
  const width = config.nodeWidth ? config.nodeWidth * 10 : 960;
  const height = config.nodeHeight ? config.nodeHeight * 10 : 500;
  const titleHeight = title ? 30 : 0;
  const svgWidth = width;
  const svgHeight = height + titleHeight;

  // Set the SVG size
  svg.attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
  configureSvgSize(svg, svgHeight, svgWidth, config.useMaxWidth);

  // Format for displaying values
  const valueFormat = format(',d');

  // Create color scale
  const colorScale = scaleOrdinal<string>().range([
    '#8dd3c7',
    '#ffffb3',
    '#bebada',
    '#fb8072',
    '#80b1d3',
    '#fdb462',
    '#b3de69',
    '#fccde5',
    '#d9d9d9',
    '#bc80bd',
  ]);

  // Create a container group to hold all elements
  const g = svg.append('g').attr('transform', `translate(0, ${titleHeight})`);

  // Draw the title if it exists
  if (title) {
    svg
      .append('text')
      .attr('x', svgWidth / 2)
      .attr('y', titleHeight / 2)
      .attr('class', 'treemapTitle')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .text(title);
  }

  // Convert data to hierarchical structure
  const hierarchyRoot = hierarchy<TreemapNode>(root)
    .sum((d) => d.value || 0)
    .sort((a, b) => (b.value || 0) - (a.value || 0));

  // Create treemap layout
  const treemapLayout = treemap<TreemapNode>().size([width, height]).padding(padding).round(true);

  // Apply the treemap layout to the hierarchy
  const treemapData = treemapLayout(hierarchyRoot);

  // Draw ALL nodes, not just leaves
  const allNodes = treemapData.descendants();

  // Draw section nodes (non-leaf nodes)
  const sections = g
    .selectAll('.treemapSection')
    .data(allNodes.filter((d) => d.children && d.children.length > 0))
    .enter()
    .append('g')
    .attr('class', 'treemapSection')
    .attr('transform', (d) => `translate(${d.x0},${d.y0})`);

  // Add rectangles for the sections
  sections
    .append('rect')
    .attr('width', (d) => d.x1 - d.x0)
    .attr('height', (d) => d.y1 - d.y0)
    .attr('class', 'treemapSectionRect')
    .attr('fill', (d) => colorScale(d.data.name))
    .attr('fill-opacity', 0.2)
    .attr('stroke', (d) => colorScale(d.data.name))
    .attr('stroke-width', 1);

  // Add section labels
  sections
    .append('text')
    .attr('class', 'treemapSectionLabel')
    .attr('x', 4)
    .attr('y', 14)
    .text((d) => d.data.name)
    .attr('font-weight', 'bold');

  // Add section values if enabled
  if (config.showValues !== false) {
    sections
      .append('text')
      .attr('class', 'treemapSectionValue')
      .attr('x', 4)
      .attr('y', 28)
      .text((d) => (d.value ? valueFormat(d.value) : ''))
      .attr('font-style', 'italic');
  }

  // Draw the leaf nodes (nodes with no children)
  const cell = g
    .selectAll('.treemapLeaf')
    .data(treemapData.leaves())
    .enter()
    .append('g')
    .attr('class', 'treemapNode')
    .attr('transform', (d) => `translate(${d.x0},${d.y0})`);

  // Add rectangle for each leaf node
  cell
    .append('rect')
    .attr('width', (d) => d.x1 - d.x0)
    .attr('height', (d) => d.y1 - d.y0)
    .attr('class', 'treemapLeaf')
    .attr('fill', (d) => {
      // Go up to parent for color
      let current = d;
      while (current.depth > 1 && current.parent) {
        current = current.parent;
      }
      return colorScale(current.data.name);
    })
    .attr('fill-opacity', 0.8);

  // Add node labels
  cell
    .append('text')
    .attr('class', 'treemapLabel')
    .attr('x', 4)
    .attr('y', 14)
    .text((d) => d.data.name);

  // Add node values if enabled
  if (config.showValues !== false) {
    cell
      .append('text')
      .attr('class', 'treemapValue')
      .attr('x', 4)
      .attr('y', 26)
      .text((d) => (d.value ? valueFormat(d.value) : ''));
  }
};

export const renderer: DiagramRenderer = { draw };
