import type { Diagram } from '../../Diagram.js';
import type { DiagramRenderer, DrawDefinition } from '../../diagram-api/types.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import type { TreemapDB, TreemapNode } from './types.js';
import { scaleOrdinal, treemap, hierarchy, format, select } from 'd3';

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

  // Define dimensions
  const rootHeaderHeight = 50;
  const titleHeight = title ? 30 : 0;
  const rootBorderWidth = 3;
  const sectionHeaderHeight = 25;
  const rootSectionGap = 15;

  const svg = selectSvgElement(id);
  // Use config dimensions or defaults
  const width = config.nodeWidth ? config.nodeWidth * 10 : 960;
  const height = config.nodeHeight ? config.nodeHeight * 10 : 500;
  const svgWidth = width + 2 * rootBorderWidth;
  const svgHeight = height + titleHeight + rootHeaderHeight + rootBorderWidth + rootSectionGap;

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

  // Create a root container that wraps everything
  const rootContainer = svg.append('g').attr('transform', `translate(0, ${titleHeight})`);

  // Create a container group for the inner treemap with additional gap for separation
  const g = rootContainer
    .append('g')
    .attr('transform', `translate(${rootBorderWidth}, ${rootHeaderHeight + rootSectionGap})`)
    .attr('class', 'treemapContainer');

  // MULTI-PASS LAYOUT APPROACH
  // Step 1: Create the hierarchical structure
  const hierarchyRoot = hierarchy<TreemapNode>(root)
    .sum((d) => d.value || 0)
    .sort((a, b) => (b.value || 0) - (a.value || 0));

  // Step 2: Pre-process to count sections that need headers
  const branchNodes: d3.HierarchyRectangularNode<TreemapNode>[] = [];
  let maxDepth = 0;

  hierarchyRoot.each((node) => {
    if (node.depth > maxDepth) {
      maxDepth = node.depth;
    }
    if (node.depth > 0 && node.children && node.children.length > 0) {
      branchNodes.push(node as d3.HierarchyRectangularNode<TreemapNode>);
    }
  });

  // Step 3: Create the treemap layout with reduced height to account for headers
  // Each first-level section gets its own header
  const sectionsAtLevel1 = branchNodes.filter((n) => n.depth === 1).length;
  const headerSpaceNeeded = sectionsAtLevel1 * sectionHeaderHeight;

  // Create treemap layout with reduced height
  const treemapLayout = treemap<TreemapNode>()
    .size([width, height - headerSpaceNeeded - rootSectionGap])
    .paddingTop(0)
    .paddingInner(padding + 8)
    .round(true);

  // Apply the treemap layout to the hierarchy
  const treemapData = treemapLayout(hierarchyRoot);

  // Step 4: Post-process nodes to adjust positions based on section headers
  // Map to track y-offset for each parent
  const sectionOffsets = new Map();

  // Start by adjusting top-level branches
  const topLevelBranches =
    treemapData.children?.filter((c) => c.children && c.children.length > 0) || [];

  let currentY = 0;
  topLevelBranches.forEach((branch) => {
    // Record section offset
    sectionOffsets.set(branch.id || branch.data.name, currentY);

    // Shift the branch down to make room for header
    branch.y0 += currentY;
    branch.y1 += currentY;

    // Update offset for next branch
    currentY += sectionHeaderHeight;
  });

  // Then adjust all descendant nodes
  treemapData.each((node) => {
    if (node.depth <= 1) {
      return;
    } // Already handled top level

    // Find all section ancestors and sum their offsets
    let totalOffset = 0;
    let current = node.parent;

    while (current && current.depth > 0) {
      const offset = sectionOffsets.get(current.id || current.data.name) || 0;
      totalOffset += offset;
      current = current.parent;
    }

    // Apply cumulative offset
    node.y0 += totalOffset;
    node.y1 += totalOffset;
  });

  // Add the root border container after all layout calculations
  rootContainer
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', svgWidth)
    .attr('height', height + rootHeaderHeight + rootBorderWidth + rootSectionGap)
    .attr('fill', 'none')
    .attr('stroke', colorScale(root.name))
    .attr('stroke-width', rootBorderWidth)
    .attr('rx', 4)
    .attr('ry', 4);

  // Add root header background - with clear separation from sections
  rootContainer
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', svgWidth)
    .attr('height', rootHeaderHeight)
    .attr('fill', colorScale(root.name))
    .attr('fill-opacity', 0.2)
    .attr('stroke', 'none')
    .attr('rx', 4)
    .attr('ry', 4);

  // Add root label
  rootContainer
    .append('text')
    .attr('x', rootBorderWidth * 2)
    .attr('y', rootHeaderHeight / 2)
    .attr('dominant-baseline', 'middle')
    .attr('font-weight', 'bold')
    .attr('font-size', '18px')
    .text(root.name);

  // Add a visual separator line between root and sections
  rootContainer
    .append('line')
    .attr('x1', rootBorderWidth)
    .attr('y1', rootHeaderHeight + rootSectionGap / 2)
    .attr('x2', svgWidth - rootBorderWidth)
    .attr('y2', rootHeaderHeight + rootSectionGap / 2)
    .attr('stroke', colorScale(root.name))
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4,2');

  // Draw section nodes (non-leaf nodes), skip the root
  const sections = g
    .selectAll('.treemapSection')
    .data(branchNodes)
    .enter()
    .append('g')
    .attr('class', 'treemapSection')
    .attr('transform', (d) => `translate(${d.x0},${d.y0 - sectionHeaderHeight})`);

  // Add section rectangles (full container including header)
  sections
    .append('rect')
    .attr('width', (d) => d.x1 - d.x0)
    .attr('height', (d) => d.y1 - d.y0 + sectionHeaderHeight)
    .attr('class', 'treemapSectionRect')
    .attr('fill', (d) => colorScale(d.data.name))
    .attr('fill-opacity', 0.1)
    .attr('stroke', (d) => colorScale(d.data.name))
    .attr('stroke-width', 2);

  // Add section header background
  sections
    .append('rect')
    .attr('width', (d) => d.x1 - d.x0)
    .attr('height', sectionHeaderHeight)
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
    .attr('y', sectionHeaderHeight / 2)
    .attr('dominant-baseline', 'middle')
    .text((d) => d.data.name)
    .attr('font-weight', 'bold')
    .style('font-size', '12px')
    .style('fill', '#000000')
    .each(function (d) {
      // Truncate text if needed
      const textWidth = this.getComputedTextLength();
      const availableWidth = d.x1 - d.x0 - 20;
      if (textWidth > availableWidth) {
        const text = d.data.name;
        let truncatedText = text;
        while (truncatedText.length > 3 && this.getComputedTextLength() > availableWidth) {
          truncatedText = truncatedText.slice(0, -1);
          select(this).text(truncatedText + '...');
        }
      }
    });

  // Add section values if enabled
  if (config.showValues !== false) {
    sections
      .append('text')
      .attr('class', 'treemapSectionValue')
      .attr('x', (d) => d.x1 - d.x0 - 10)
      .attr('y', sectionHeaderHeight / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .text((d) => (d.value ? valueFormat(d.value) : ''))
      .attr('font-style', 'italic')
      .style('font-size', '10px')
      .style('fill', '#000000');
  }

  // Draw the leaf nodes
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

  // Only render label if box is big enough
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

    // Only render value if box is big enough
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
