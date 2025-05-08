import type { Diagram } from '../../Diagram.js';
import type { DiagramRenderer, DrawDefinition } from '../../diagram-api/types.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import type { TreemapDB, TreemapNode } from './types.js';
import { scaleOrdinal, treemap, hierarchy, format, select } from 'd3';

const DEFAULT_INNER_PADDING = 5; // Default for inner padding between cells/sections
const SECTION_HEADER_HEIGHT = 25;

/**
 * Draws the treemap diagram
 */
const draw: DrawDefinition = (_text, id, _version, diagram: Diagram) => {
  const treemapDb = diagram.db as TreemapDB;
  const config = treemapDb.getConfig();
  const treemapInnerPadding = config.padding !== undefined ? config.padding : DEFAULT_INNER_PADDING;
  const title = treemapDb.getDiagramTitle();
  const root = treemapDb.getRoot();

  if (!root) {
    return;
  }

  // Define dimensions
  const titleHeight = title ? 30 : 0;

  const svg = selectSvgElement(id);
  // Use config dimensions or defaults
  const width = config.nodeWidth ? config.nodeWidth * 10 : 960;
  const height = config.nodeHeight ? config.nodeHeight * 10 : 500;

  const svgWidth = width;
  const svgHeight = height + titleHeight;

  // Set the SVG size
  svg.attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
  configureSvgSize(svg, svgHeight, svgWidth, config.useMaxWidth);

  // Format for displaying values
  const valueFormat = format(',');

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

  // Create a main container for the treemap, translated below the title
  const g = svg
    .append('g')
    .attr('transform', `translate(0, ${titleHeight})`)
    .attr('class', 'treemapContainer');

  // Create the hierarchical structure
  const hierarchyRoot = hierarchy<TreemapNode>(root)
    .sum((d) => d.value || 0)
    .sort((a, b) => (b.value || 0) - (a.value || 0));

  // Create treemap layout
  const treemapLayout = treemap<TreemapNode>()
    .size([width, height])
    .paddingTop((d) => (d.children && d.children.length > 0 ? SECTION_HEADER_HEIGHT : 0))
    .paddingInner(treemapInnerPadding)
    .round(true);

  // Apply the treemap layout to the hierarchy
  const treemapData = treemapLayout(hierarchyRoot);

  // Draw section nodes (branches - nodes with children)
  const branchNodes = treemapData.descendants().filter((d) => d.children && d.children.length > 0);
  const sections = g
    .selectAll('.treemapSection')
    .data(branchNodes)
    .enter()
    .append('g')
    .attr('class', 'treemapSection')
    .attr('transform', (d) => `translate(${d.x0},${d.y0})`);

  // Add section header background
  sections
    .append('rect')
    .attr('width', (d) => d.x1 - d.x0)
    .attr('height', SECTION_HEADER_HEIGHT)
    .attr('class', 'treemapSectionHeader')
    .attr('fill', (d) => colorScale(d.data.name))
    .attr('fill-opacity', 0.6)
    .attr('stroke', (d) => colorScale(d.data.name))
    .attr('stroke-width', 1);

  // Add section labels
  sections
    .append('text')
    .attr('class', 'treemapSectionLabel')
    .attr('x', 6)
    .attr('y', SECTION_HEADER_HEIGHT / 2)
    .attr('dominant-baseline', 'middle')
    .text((d) => d.data.name)
    .attr('font-weight', 'bold')
    .style('font-size', '12px')
    .style('fill', '#000000')
    .each(function (d) {
      const self = select(this);
      const originalText = d.data.name;
      self.text(originalText);
      const totalHeaderWidth = d.x1 - d.x0;
      const labelXPosition = 6;
      let spaceForTextContent;
      if (config.showValues !== false && d.value) {
        const valueEndsAtXRelative = totalHeaderWidth - 10;
        const estimatedValueTextActualWidth = 30;
        const gapBetweenLabelAndValue = 10;
        const labelMustEndBeforeX =
          valueEndsAtXRelative - estimatedValueTextActualWidth - gapBetweenLabelAndValue;
        spaceForTextContent = labelMustEndBeforeX - labelXPosition;
      } else {
        const labelOwnRightPadding = 6;
        spaceForTextContent = totalHeaderWidth - labelXPosition - labelOwnRightPadding;
      }
      const minimumWidthToDisplay = 15;
      const actualAvailableWidth = Math.max(minimumWidthToDisplay, spaceForTextContent);
      const textNode = self.node()!;
      const currentTextContentLength = textNode.getComputedTextLength();
      if (currentTextContentLength > actualAvailableWidth) {
        const ellipsis = '...';
        let currentTruncatedText = originalText;
        while (currentTruncatedText.length > 0) {
          currentTruncatedText = originalText.substring(0, currentTruncatedText.length - 1);
          if (currentTruncatedText.length === 0) {
            self.text(ellipsis);
            if (textNode.getComputedTextLength() > actualAvailableWidth) {
              self.text('');
            }
            break;
          }
          self.text(currentTruncatedText + ellipsis);
          if (textNode.getComputedTextLength() <= actualAvailableWidth) {
            break;
          }
        }
      }
    });

  // Add section values if enabled
  if (config.showValues !== false) {
    sections
      .append('text')
      .attr('class', 'treemapSectionValue')
      .attr('x', (d) => d.x1 - d.x0 - 10)
      .attr('y', SECTION_HEADER_HEIGHT / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .text((d) => (d.value ? valueFormat(d.value) : ''))
      .attr('font-style', 'italic')
      .style('font-size', '10px')
      .style('fill', '#000000');
  }

  // Draw the leaf nodes
  const leafNodes = treemapData.leaves();
  const cell = g
    .selectAll('.treemapLeafGroup')
    .data(leafNodes)
    .enter()
    .append('g')
    .attr('class', 'treemapNode treemapLeafGroup')
    .attr('transform', (d) => `translate(${d.x0},${d.y0})`);

  // Add rectangle for each leaf node
  cell
    .append('rect')
    .attr('width', (d) => d.x1 - d.x0)
    .attr('height', (d) => d.y1 - d.y0)
    .attr('class', 'treemapLeaf')
    .attr('fill', (d) => {
      let current = d;
      while (current.depth > 1 && current.parent) {
        current = current.parent;
      }
      return colorScale(current.data.name);
    })
    .attr('fill-opacity', 0.8);

  // Add clip paths to prevent text from extending outside nodes
  cell
    .append('clipPath')
    .attr('id', (d, i) => `clip-${id}-${i}`)
    .append('rect')
    .attr('width', (d) => Math.max(0, d.x1 - d.x0 - 4))
    .attr('height', (d) => Math.max(0, d.y1 - d.y0 - 4));

  // Add node labels with clipping
  const leafLabels = cell
    .append('text')
    .attr('class', 'treemapLabel')
    .attr('x', 4)
    .attr('y', 14)
    .style('font-size', '11px')
    .attr('clip-path', (d, i) => `url(#clip-${id}-${i})`)
    .text((d) => d.data.name);

  leafLabels.each(function (d) {
    const nodeWidth = d.x1 - d.x0;
    const nodeHeight = d.y1 - d.y0;
    if (nodeWidth < 30 || nodeHeight < 20) {
      select(this).style('display', 'none');
    }
  });

  // Add node values with clipping
  if (config.showValues !== false) {
    const leafValues = cell
      .append('text')
      .attr('class', 'treemapValue')
      .attr('x', 4)
      .attr('y', 26)
      .style('font-size', '10px')
      .attr('clip-path', (d, i) => `url(#clip-${id}-${i})`)
      .text((d) => (d.value ? valueFormat(d.value) : ''));

    leafValues.each(function (d) {
      const nodeWidth = d.x1 - d.x0;
      const nodeHeight = d.y1 - d.y0;
      if (nodeWidth < 30 || nodeHeight < 30) {
        select(this).style('display', 'none');
      }
    });
  }
};

export const renderer: DiagramRenderer = { draw };
