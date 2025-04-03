import type { Diagram } from '../../Diagram.js';
import { log } from '../../logger.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import type {
  DrawableElem,
  TextElem,
  TextHorizontalPos,
  TextVerticalPos,
} from './chartBuilder/interfaces.js';
import type XYChartDB from './xychartDb.js';

export const draw = (txt: string, id: string, _version: string, diagObj: Diagram) => {
  const db = diagObj.db as typeof XYChartDB;
  const themeConfig = db.getChartThemeConfig();
  const chartConfig = db.getChartConfig();
  const labelData = db.getXYChartData().plots[0].data.map((data) => data[1]);
  function getDominantBaseLine(horizontalPos: TextVerticalPos) {
    return horizontalPos === 'top' ? 'text-before-edge' : 'middle';
  }

  function getTextAnchor(verticalPos: TextHorizontalPos) {
    return verticalPos === 'left' ? 'start' : verticalPos === 'right' ? 'end' : 'middle';
  }

  function getTextTransformation(data: TextElem) {
    return `translate(${data.x}, ${data.y}) rotate(${data.rotation || 0})`;
  }

  log.debug('Rendering xychart chart\n' + txt);

  const svg = selectSvgElement(id);
  const group = svg.append('g').attr('class', 'main');
  const background = group
    .append('rect')
    .attr('width', chartConfig.width)
    .attr('height', chartConfig.height)
    .attr('class', 'background');

  // @ts-ignore: TODO Fix ts errors
  configureSvgSize(svg, chartConfig.height, chartConfig.width, true);

  svg.attr('viewBox', `0 0 ${chartConfig.width} ${chartConfig.height}`);

  background.attr('fill', themeConfig.backgroundColor);

  db.setTmpSVGG(svg.append('g').attr('class', 'mermaid-tmp-group'));

  const shapes: DrawableElem[] = db.getDrawableElem();

  const groups: Record<string, any> = {};

  interface BarItem {
    data: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    label: string;
  }

  function getGroup(gList: string[]) {
    let elem = group;
    let prefix = '';
    for (const [i] of gList.entries()) {
      let parent = group;
      if (i > 0 && groups[prefix]) {
        parent = groups[prefix];
      }
      prefix += gList[i];
      elem = groups[prefix];
      if (!elem) {
        elem = groups[prefix] = parent.append('g').attr('class', gList[i]);
      }
    }
    return elem;
  }

  for (const shape of shapes) {
    if (shape.data.length === 0) {
      continue;
    }

    const shapeGroup = getGroup(shape.groupTexts);

    switch (shape.type) {
      case 'rect':
        shapeGroup
          .selectAll('rect')
          .data(shape.data)
          .enter()
          .append('rect')
          .attr('x', (data) => data.x)
          .attr('y', (data) => data.y)
          .attr('width', (data) => data.width)
          .attr('height', (data) => data.height)
          .attr('fill', (data) => data.fill)
          .attr('stroke', (data) => data.strokeFill)
          .attr('stroke-width', (data) => data.strokeWidth);

        if (chartConfig.showDataLabel) {
          if (chartConfig.chartOrientation === 'horizontal') {
            // Append a temporary group to measure the widths of the texts
            const tempGroup = svg.append('g').attr('class', 'temp-label-group');
            // Append texts temporarily to measure their widths
            const tempTexts = tempGroup
              .selectAll('text')
              .data(labelData)
              .enter()
              .append('text')
              .attr('font-size', (data, i) => shape.data[i].height * 0.7)
              .text((d) => d);
            // Measure widths and determine the font size & actual widths
            const measured = tempTexts.nodes().map((node, i) => {
              const bbox = node.getBBox();
              return {
                width: bbox.width,
                height: bbox.height,
                fontSize: shape.data[i].height * 0.7,
              };
            });
            const uniformFontSize = Math.floor(Math.min(...measured.map((m) => m.fontSize)));
            const longestTextWidth = Math.max(...measured.map((m) => m.width));
            // Clean up temp texts
            tempGroup.remove();

            shapeGroup
              .selectAll('text')
              .data(shape.data)
              .enter()
              .append('text')
              .attr('x', (data) => data.x + data.width - longestTextWidth - 5)
              .attr('y', (data) => data.y + data.height / 2 + 0.2 * data.height)
              .attr('text-anchor', 'start')
              .attr('dominant-baseline', 'middle')
              .attr('fill', 'black')
              .attr('font-size', `${uniformFontSize}px`)
              .text((data, index) => labelData[index]);
          } else {
            const yOffset = 10;

            // filter out bars that have zero width or height.
            const validItems = shape.data
              .map((d, i) => ({ data: d, label: labelData[i].toString() }))
              .filter((item) => item.data.width > 0 && item.data.height > 0);

            // Helper function that checks if the text with a given fontSize fits within the bar boundaries.
            function fitsInBar(item: BarItem, fontSize: number, yOffset: number): boolean {
              const { data, label } = item;
              const charWidthFactor = 0.7;
              const textWidth = fontSize * label.length * charWidthFactor;

              // Compute horizontal boundaries using the center.
              const centerX = data.x + data.width / 2;
              const leftEdge = centerX - textWidth / 2;
              const rightEdge = centerX + textWidth / 2;

              // Check that text doesn't overflow horizontally.
              const horizontalFits = leftEdge >= data.x && rightEdge <= data.x + data.width;

              // For vertical placement, we use 'dominant-baseline: hanging' so that y marks the top of the text.
              // Thus, the bottom edge is y + yOffset + fontSize.
              const verticalFits = data.y + yOffset + fontSize <= data.y + data.height;

              return horizontalFits && verticalFits;
            }

            // For each valid item, start with a candidate font size based on the width,
            // then reduce it until the text fits within both the horizontal and vertical boundaries.
            const candidateFontSizes = validItems.map((item) => {
              const { data, label } = item;
              let fontSize = data.width / (label.length * 0.7);

              // Decrease the font size until the text fits or fontSize reaches 0.
              while (!fitsInBar(item, fontSize, yOffset) && fontSize > 0) {
                fontSize -= 1;
              }
              return fontSize;
            });

            // Choose the smallest candidate across all valid bars for uniformity.
            const uniformFontSize = Math.floor(Math.min(...candidateFontSizes));

            // Render text only for valid items.
            shapeGroup
              .selectAll('text')
              .data(validItems)
              .enter()
              .append('text')
              .attr('x', (item) => item.data.x + item.data.width / 2)
              .attr('y', (item) => item.data.y + yOffset)
              .attr('text-anchor', 'middle')
              .attr('dominant-baseline', 'hanging')
              .attr('fill', 'black')
              .attr('font-size', `${uniformFontSize}px`)
              .text((item) => item.label);
          }
        }
        break;
      case 'text':
        shapeGroup
          .selectAll('text')
          .data(shape.data)
          .enter()
          .append('text')
          .attr('x', 0)
          .attr('y', 0)
          .attr('fill', (data) => data.fill)
          .attr('font-size', (data) => data.fontSize)
          .attr('dominant-baseline', (data) => getDominantBaseLine(data.verticalPos))
          .attr('text-anchor', (data) => getTextAnchor(data.horizontalPos))
          .attr('transform', (data) => getTextTransformation(data))
          .text((data) => data.text);
        break;
      case 'path':
        shapeGroup
          .selectAll('path')
          .data(shape.data)
          .enter()
          .append('path')
          .attr('d', (data) => data.path)
          .attr('fill', (data) => (data.fill ? data.fill : 'none'))
          .attr('stroke', (data) => data.strokeFill)
          .attr('stroke-width', (data) => data.strokeWidth);
        break;
    }
  }
};

export default {
  draw,
};
