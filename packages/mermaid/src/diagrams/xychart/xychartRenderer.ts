import { select } from 'd3';
import { Diagram } from '../../Diagram.js';
import * as configApi from '../../config.js';
import { log } from '../../logger.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import {
  DrawableElem,
  TextElem,
  TextHorizontalPos,
  TextVerticalPos,
} from './chartBuilder/Interfaces.js';
import XYChartDB from './xychartDb.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';

export const draw = (txt: string, id: string, _version: string, diagObj: Diagram) => {
  const db = diagObj.db as typeof XYChartDB;
  const themeConfig = db.getChartThemeConfig();
  const chartConfig = db.getChartConfig();
  function getDominantBaseLine(horizontalPos: TextHorizontalPos) {
    return horizontalPos === 'top' ? 'hanging' : 'middle';
  }

  function getTextAnchor(verticalPos: TextVerticalPos) {
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

  svg.attr('viewBox', '0 0 ' + chartConfig.width + ' ' + chartConfig.height);

  background.attr('fill', themeConfig.backgroundColor);

  db.setTmpSVGG(svg.append('g').attr('class', 'mermaid-tmp-group'));

  const shapes: DrawableElem[] = db.getDrawableElem();

  const groups: Record<string, any> = {};

  function getGroup(gList: string[]) {
    let elem = group;
    let prefix = '';
    for (const [i, _] of gList.entries()) {
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
      log.trace(
        `Skipped drawing of shape of type: ${shape.type} with data: ${JSON.stringify(
          shape.data,
          null,
          2
        )}`
      );
      continue;
    }
    log.trace(
      `Drawing shape of type: ${shape.type} with data: ${JSON.stringify(shape.data, null, 2)}`
    );

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
          .attr('dominant-baseline', (data) => getDominantBaseLine(data.horizontalPos))
          .attr('text-anchor', (data) => getTextAnchor(data.verticalPos))
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
