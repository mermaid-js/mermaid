import type { Diagram } from '../../Diagram.js';
import type {
  DiagramRenderer,
  DiagramStyleClassDef,
  DrawDefinition,
} from '../../diagram-api/types.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import type { TreemapDB, TreemapNode } from './types.js';
import { scaleOrdinal, treemap, hierarchy, format, select } from 'd3';
import { styles2String } from '../../rendering-util/rendering-elements/shapes/handDrawnShapeStyles.js';
import { getConfig } from '../../config.js';
import type { Node } from '../../rendering-util/types.js';

const DEFAULT_INNER_PADDING = 10; // Default for inner padding between cells/sections
const SECTION_INNER_PADDING = 10; // Default for inner padding between cells/sections
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
  const { themeVariables } = getConfig();
  if (!root) {
    return;
  }

  // Define dimensions
  const titleHeight = title ? 30 : 0;

  const svg = selectSvgElement(id);
  // Use config dimensions or defaults
  const width = config.nodeWidth ? config.nodeWidth * SECTION_INNER_PADDING : 960;
  const height = config.nodeHeight ? config.nodeHeight * SECTION_INNER_PADDING : 500;

  const svgWidth = width;
  const svgHeight = height + titleHeight;

  // Set the SVG size
  svg.attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
  configureSvgSize(svg, svgHeight, svgWidth, config.useMaxWidth);

  // Format for displaying values
  const valueFormat = format(',');

  // Create color scale
  const colorScale = scaleOrdinal<string>().range([
    'transparent',
    themeVariables.cScale0,
    themeVariables.cScale1,
    themeVariables.cScale2,
    themeVariables.cScale3,
    themeVariables.cScale4,
    themeVariables.cScale5,
    themeVariables.cScale6,
    themeVariables.cScale7,
    themeVariables.cScale8,
    themeVariables.cScale9,
    themeVariables.cScale10,
    themeVariables.cScale11,
  ]);
  const colorScalePeer = scaleOrdinal<string>().range([
    'transparent',
    themeVariables.cScalePeer0,
    themeVariables.cScalePeer1,
    themeVariables.cScalePeer2,
    themeVariables.cScalePeer3,
    themeVariables.cScalePeer4,
    themeVariables.cScalePeer5,
    themeVariables.cScalePeer6,
    themeVariables.cScalePeer7,
    themeVariables.cScalePeer8,
    themeVariables.cScalePeer9,
    themeVariables.cScalePeer10,
    themeVariables.cScalePeer11,
  ]);
  const colorScaleLabel = scaleOrdinal<string>().range([
    'transparent',
    themeVariables.cScaleLabel0,
    themeVariables.cScaleLabel1,
    themeVariables.cScaleLabel2,
    themeVariables.cScaleLabel3,
    themeVariables.cScaleLabel4,
    themeVariables.cScaleLabel5,
    themeVariables.cScaleLabel6,
    themeVariables.cScaleLabel7,
    themeVariables.cScaleLabel8,
    themeVariables.cScaleLabel9,
    themeVariables.cScaleLabel10,
    themeVariables.cScaleLabel11,
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
    .paddingTop((d) =>
      d.children && d.children.length > 0 ? SECTION_HEADER_HEIGHT + SECTION_INNER_PADDING : 0
    )
    .paddingInner(treemapInnerPadding)
    .paddingLeft((d) => (d.children && d.children.length > 0 ? SECTION_INNER_PADDING : 0))
    .paddingRight((d) => (d.children && d.children.length > 0 ? SECTION_INNER_PADDING : 0))
    .paddingBottom((d) => (d.children && d.children.length > 0 ? SECTION_INNER_PADDING : 0))
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
    .attr('fill', 'none')
    .attr('fill-opacity', 0.6)
    .attr('stroke-width', 0.6);

  sections
    .append('rect')
    .attr('width', (d) => d.x1 - d.x0)
    .attr('height', (d) => d.y1 - d.y0)
    .attr('class', (d, i) => {
      return `treemapSection section${i}`;
    })
    .attr('fill', (d) => colorScale(d.data.name))
    .attr('fill-opacity', 0.6)
    .attr('stroke', (d) => colorScalePeer(d.data.name))
    .attr('stroke-width', 2.0)
    .attr('stroke-opacity', 0.4)
    .attr('style', (d) => {
      const styles = styles2String({ cssCompiledStyles: d.data.cssCompiledStyles } as Node);
      return styles.nodeStyles + ';' + styles.borderStyles.join(';');
    });
  // Add section labels
  sections
    .append('text')
    .attr('class', 'treemapSectionLabel')
    .attr('x', 6)
    .attr('y', SECTION_HEADER_HEIGHT / 2)
    .attr('dominant-baseline', 'middle')
    .text((d) => d.data.name)
    .attr('font-weight', 'bold')
    .attr('style', (d) => {
      const labelStyles =
        'dominant-baseline: middle; font-size: 12px;fill:' + colorScaleLabel(d.data.name) + ';';
      const styles = styles2String({ cssCompiledStyles: d.data.cssCompiledStyles } as Node);
      return labelStyles + styles.labelStyles.replace('color:', 'fill:');
    })
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
      .attr('style', (d) => {
        const labelStyles =
          'text-anchor: middle; dominant-baseline: middle; font-size: 10px;fill:' +
          colorScaleLabel(d.data.name) +
          ';';
        const styles = styles2String({ cssCompiledStyles: d.data.cssCompiledStyles } as Node);
        return labelStyles + styles.labelStyles.replace('color:', 'fill:');
      });
  }

  // Draw the leaf nodes
  const leafNodes = treemapData.leaves();
  const cell = g
    .selectAll('.treemapLeafGroup')
    .data(leafNodes)
    .enter()
    .append('g')
    .attr('class', (d, i) => {
      return `treemapNode treemapLeafGroup leaf${i}${d.data.classSelector ? ` ${d.data.classSelector}` : ''}x`;
    })
    .attr('transform', (d) => `translate(${d.x0},${d.y0})`);

  // Add rectangle for each leaf node
  cell
    .append('rect')
    .attr('width', (d) => d.x1 - d.x0)
    .attr('height', (d) => d.y1 - d.y0)
    .attr('class', 'treemapLeaf')
    .attr('fill', (d) => {
      // Leaves inherit color from their immediate parent section's name.
      // If a leaf is the root itself (no parent), it uses its own name.
      return d.parent ? colorScale(d.parent.data.name) : colorScale(d.data.name);
    })
    .attr('style', (d) => {
      const styles = styles2String({ cssCompiledStyles: d.data.cssCompiledStyles } as Node);
      return styles.nodeStyles;
    })
    .attr('fill-opacity', 0.2)
    .attr('stroke', (d) => {
      // Leaves inherit color from their immediate parent section's name.
      // If a leaf is the root itself (no parent), it uses its own name.
      return d.parent ? colorScale(d.parent.data.name) : colorScale(d.data.name);
    })
    .attr('stroke-width', 2.0)
    .attr('stroke-opacity', 0.3);

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
    .attr('x', (d) => (d.x1 - d.x0) / 2)
    .attr('y', (d) => (d.y1 - d.y0) / 2)
    // .style('fill', (d) => colorScaleLabel(d.data.name))
    .attr('style', (d) => {
      const labelStyles =
        'text-anchor: middle; dominant-baseline: middle; font-size: 38px;fill:' +
        colorScaleLabel(d.data.name) +
        ';';
      const styles = styles2String({ cssCompiledStyles: d.data.cssCompiledStyles } as Node);
      return labelStyles + styles.labelStyles.replace('color:', 'fill:');
    })
    .attr('clip-path', (d, i) => `url(#clip-${id}-${i})`)
    .text((d) => d.data.name);

  leafLabels.each(function (d) {
    const self = select(this);
    const nodeWidth = d.x1 - d.x0;
    const nodeHeight = d.y1 - d.y0;
    const textNode = self.node()!;

    const padding = 4;
    const availableWidth = nodeWidth - 2 * padding;
    const availableHeight = nodeHeight - 2 * padding;

    if (availableWidth < 10 || availableHeight < 10) {
      self.style('display', 'none');
      return;
    }

    let currentLabelFontSize = parseInt(self.style('font-size'), 10);
    const minLabelFontSize = 8;
    const originalValueRelFontSize = 28; // Original font size of value, for max cap
    const valueScaleFactor = 0.6; // Value font size as a factor of label font size
    const minValueFontSize = 6;
    const spacingBetweenLabelAndValue = 2;

    // 1. Adjust label font size to fit width
    while (
      textNode.getComputedTextLength() > availableWidth &&
      currentLabelFontSize > minLabelFontSize
    ) {
      currentLabelFontSize--;
      self.style('font-size', `${currentLabelFontSize}px`);
    }

    // 2. Adjust both label and prospective value font size to fit combined height
    let prospectiveValueFontSize = Math.max(
      minValueFontSize,
      Math.min(originalValueRelFontSize, Math.round(currentLabelFontSize * valueScaleFactor))
    );
    let combinedHeight =
      currentLabelFontSize + spacingBetweenLabelAndValue + prospectiveValueFontSize;

    while (combinedHeight > availableHeight && currentLabelFontSize > minLabelFontSize) {
      currentLabelFontSize--;
      prospectiveValueFontSize = Math.max(
        minValueFontSize,
        Math.min(originalValueRelFontSize, Math.round(currentLabelFontSize * valueScaleFactor))
      );
      if (
        prospectiveValueFontSize < minValueFontSize &&
        currentLabelFontSize === minLabelFontSize
      ) {
        break;
      } // Avoid shrinking label if value is already at min
      self.style('font-size', `${currentLabelFontSize}px`);
      combinedHeight =
        currentLabelFontSize + spacingBetweenLabelAndValue + prospectiveValueFontSize;
      if (prospectiveValueFontSize <= minValueFontSize && combinedHeight > availableHeight) {
        // If value is at min and still doesn't fit, label might need to shrink more alone
        // This might lead to label being too small for its own text, checked next
      }
    }

    // Update label font size based on height adjustment
    self.style('font-size', `${currentLabelFontSize}px`);

    // 3. Final visibility check for the label
    if (
      textNode.getComputedTextLength() > availableWidth ||
      currentLabelFontSize < minLabelFontSize ||
      availableHeight < currentLabelFontSize
    ) {
      self.style('display', 'none');
      // If label is hidden, value will be hidden by its own .each() loop
    }
  });

  // Add node values with clipping
  if (config.showValues !== false) {
    const leafValues = cell
      .append('text')
      .attr('class', 'treemapValue')
      .attr('x', (d) => (d.x1 - d.x0) / 2)
      .attr('y', function (d) {
        // Y position calculated dynamically in leafValues.each based on final label metrics
        return (d.y1 - d.y0) / 2; // Placeholder, will be overwritten
      })
      .attr('style', (d) => {
        const labelStyles =
          'text-anchor: middle; dominant-baseline: hanging; font-size: 28px;fill:' +
          colorScaleLabel(d.data.name) +
          ';';
        const styles = styles2String({ cssCompiledStyles: d.data.cssCompiledStyles } as Node);
        return labelStyles + styles.labelStyles.replace('color:', 'fill:');
      })

      .attr('clip-path', (d, i) => `url(#clip-${id}-${i})`)
      .text((d) => (d.value ? valueFormat(d.value) : ''));

    leafValues.each(function (d) {
      const valueTextElement = select(this);
      const parentCellNode = this.parentNode as SVGGElement | null;

      if (!parentCellNode) {
        valueTextElement.style('display', 'none');
        return;
      }

      const labelElement = select(parentCellNode).select<SVGTextElement>('.treemapLabel');

      if (labelElement.empty() || labelElement.style('display') === 'none') {
        valueTextElement.style('display', 'none');
        return;
      }

      const finalLabelFontSize = parseFloat(labelElement.style('font-size'));
      const originalValueFontSize = 28; // From initial style setting
      const valueScaleFactor = 0.6;
      const minValueFontSize = 6;
      const spacingBetweenLabelAndValue = 2;

      const actualValueFontSize = Math.max(
        minValueFontSize,
        Math.min(originalValueFontSize, Math.round(finalLabelFontSize * valueScaleFactor))
      );
      valueTextElement.style('font-size', `${actualValueFontSize}px`);

      const labelCenterY = (d.y1 - d.y0) / 2;
      const valueTopActualY = labelCenterY + finalLabelFontSize / 2 + spacingBetweenLabelAndValue;
      valueTextElement.attr('y', valueTopActualY);

      const nodeWidth = d.x1 - d.x0;
      const nodeTotalHeight = d.y1 - d.y0;
      const cellBottomPadding = 4;
      const maxValueBottomY = nodeTotalHeight - cellBottomPadding;
      const availableWidthForValue = nodeWidth - 2 * 4; // padding for value text

      if (
        valueTextElement.node()!.getComputedTextLength() > availableWidthForValue ||
        valueTopActualY + actualValueFontSize > maxValueBottomY ||
        actualValueFontSize < minValueFontSize
      ) {
        valueTextElement.style('display', 'none');
      } else {
        valueTextElement.style('display', null);
      }
    });
  }

  setupViewPortForSVG(svg, 0, 'flowchart', config?.useMaxWidth || false);
  const viewBox = svg.attr('viewBox');
  const viewBoxParts = viewBox.split(' ');
  const viewBoxWidth = viewBoxParts[2];
  const viewBoxHeight = viewBoxParts[3];
  const viewBoxX = viewBoxParts[0];
  const viewBoxY = viewBoxParts[1];

  const viewBoxWidthNumber = Number(viewBoxWidth);
  const viewBoxHeightNumber = Number(viewBoxHeight);
  const viewBoxXNumber = Number(viewBoxX);
  const viewBoxYNumber = Number(viewBoxY);

  // Adjust the viewBox to account for the title height
  svg.attr(
    'viewBox',
    `${viewBoxXNumber} ${viewBoxYNumber + SECTION_HEADER_HEIGHT} ${viewBoxWidthNumber} ${viewBoxHeightNumber - SECTION_HEADER_HEIGHT}`
  );
};

const getClasses = function (text: string, diagramObj: any): Map<string, DiagramStyleClassDef> {
  return diagramObj.db.getClasses();
};
export const renderer: DiagramRenderer = { draw, getClasses };
