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

export const draw = (txt: string, id: string, _version: string, diagObj: Diagram) => {
  function getDominantBaseLine(horizontalPos: TextHorizontalPos) {
    return horizontalPos === 'top' ? 'hanging' : 'middle';
  }

  function getTextAnchor(verticalPos: TextVerticalPos) {
    return verticalPos === 'left' ? 'start' : verticalPos === 'right' ? 'end' : 'middle';
  }

  function getTextTransformation(data: TextElem) {
    return `translate(${data.x}, ${data.y}) rotate(${data.rotation || 0})`;
  }
  const conf = configApi.getConfig();

  log.debug('Rendering xychart chart\n' + txt);

  const securityLevel = conf.securityLevel;
  // Handle root and Document for when rendering in sandbox mode
  let sandboxElement;
  if (securityLevel === 'sandbox') {
    sandboxElement = select('#i' + id);
  }
  const root = sandboxElement ? sandboxElement : select('body');

  const svg = root.select(`[id="${id}"]`);

  const group = svg.append('g').attr('class', 'main');

  const width = 700;
  const height = 500;

  // @ts-ignore: TODO Fix ts errors
  configureSvgSize(svg, height, width, true);

  svg.attr('viewBox', '0 0 ' + width + ' ' + height);

  // @ts-ignore: TODO Fix ts errors
  diagObj.db.setHeight(height);
  // @ts-ignore: TODO Fix ts errors
  diagObj.db.setWidth(width);

  // @ts-ignore: TODO Fix ts errors
  const shapes: DrawableElem[] = diagObj.db.getDrawableElem();

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

    const shapeGroup = group.append('g').attr('class', shape.groupText);

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
