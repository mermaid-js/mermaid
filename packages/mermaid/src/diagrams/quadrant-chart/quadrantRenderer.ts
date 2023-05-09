// @ts-ignore: TODO Fix ts errors
import { select } from 'd3';
import * as configApi from '../../config.js';
import { log } from '../../logger.js';

import { configureSvgSize } from '../../setupGraphViewbox.js';
import { Diagram } from '../../Diagram.js';
import {
  QuadrantBuildType,
  QuadrantPointType,
  QuadrantQuadrantsType,
  QuadrantTextType,
  TextHorizontalPos,
  TextVerticalPos,
} from './quadrantBuilder.js';

export const draw = (txt: string, id: string, _version: string, diagObj: Diagram) => {
  function getDominantBaseLine(horizintalPos: TextHorizontalPos) {
    return horizintalPos === 'top' ? 'text-before-edge' : 'middle';
  }

  function getTextAnchor(verticalPos: TextVerticalPos) {
    return verticalPos === 'left' ? 'start' : 'middle';
  }

  function getTransformation(data: { x: number; y: number; rotation: number }) {
    return `translate(${data.x}, ${data.y}) rotate(${data.rotation || 0})`;
  }

  const conf = configApi.getConfig();

  log.debug('Rendering info diagram\n' + txt);

  const securityLevel = conf.securityLevel;
  // Handle root and Document for when rendering in sandbox mode
  let sandboxElement;
  if (securityLevel === 'sandbox') {
    sandboxElement = select('#i' + id);
  }
  const root =
    securityLevel === 'sandbox'
      ? select(sandboxElement.nodes()[0].contentDocument.body)
      : select('body');

  const svg = root.select(`[id="${id}"]`);

  const group = svg.append('g').attr('class', 'main');

  const width = conf.quadrantChart?.chartWidth || 500;
  const height = conf.quadrantChart?.chartHeight || 500;

  configureSvgSize(svg, height, width, conf.quadrantChart?.useMaxWidth || true);

  svg.attr('viewBox', '0 0 ' + width + ' ' + height);

  // @ts-ignore: TODO Fix ts errors
  diagObj.db.setHeight(height);
  // @ts-ignore: TODO Fix ts errors
  diagObj.db.setWidth(width);

  // @ts-ignore: TODO Fix ts errors
  const quadrantData: QuadrantBuildType = diagObj.db.getQuadrantData();

  const quadrantsGroup = group.append('g').attr('class', 'quadrants');
  const dataPointGroup = group.append('g').attr('class', 'data-points');
  const labelGroup = group.append('g').attr('class', 'labels');

  const quadrants = quadrantsGroup
    .selectAll('g.quadrant')
    .data(quadrantData.quadrants)
    .enter()
    .append('g')
    .attr('class', 'quadrant');

  quadrants
    .append('rect')
    .attr('x', (data: QuadrantQuadrantsType) => data.x)
    .attr('y', (data: QuadrantQuadrantsType) => data.y)
    .attr('width', (data: QuadrantQuadrantsType) => data.width)
    .attr('height', (data: QuadrantQuadrantsType) => data.height)
    .attr('fill', (data: QuadrantQuadrantsType) => data.fill);

  quadrants
    .append('text')
    .attr('x', 0)
    .attr('y', 0)
    .attr('fill', (data: QuadrantQuadrantsType) => data.text.fill)
    .attr('font-size', (data: QuadrantQuadrantsType) => data.text.fontSize)
    .attr('dominant-baseline', (data: QuadrantQuadrantsType) =>
      getDominantBaseLine(data.text.horizontalPos)
    )
    .attr('text-anchor', (data: QuadrantQuadrantsType) => getTextAnchor(data.text.verticalPos))
    .attr('transform', (data: QuadrantQuadrantsType) => getTransformation(data.text))
    .text((data: QuadrantQuadrantsType) => data.text.text);

  const labels = labelGroup
    .selectAll('g.label')
    .data(quadrantData.axisLabels)
    .enter()
    .append('g')
    .attr('class', 'label');

  labels
    .append('text')
    .attr('x', 0)
    .attr('y', 0)
    .text((data: QuadrantTextType) => data.text)
    .attr('fill', (data: QuadrantTextType) => data.fill)
    .attr('font-size', (data: QuadrantTextType) => data.fontSize)
    .attr('dominant-baseline', (data: QuadrantTextType) => getDominantBaseLine(data.horizontalPos))
    .attr('text-anchor', (data: QuadrantTextType) => getTextAnchor(data.verticalPos))
    .attr('transform', (data: QuadrantTextType) => getTransformation(data));

  const dataPoints = dataPointGroup
    .selectAll('g.data-point')
    .data(quadrantData.points)
    .enter()
    .append('g')
    .attr('class', 'data-point');

  dataPoints
    .append('circle')
    .attr('cx', (data: QuadrantPointType) => data.x)
    .attr('cy', (data: QuadrantPointType) => data.y)
    .attr('r', (data: QuadrantPointType) => data.radius)
    .attr('fill', (data: QuadrantPointType) => data.fill);

  dataPoints
    .append('text')
    .attr('x', 0)
    .attr('y', 0)
    .text((data: QuadrantPointType) => data.text.text)
    .attr('fill', (data: QuadrantPointType) => data.text.fill)
    .attr('font-size', (data: QuadrantPointType) => data.text.fontSize)
    .attr('dominant-baseline', (data: QuadrantPointType) =>
      getDominantBaseLine(data.text.horizontalPos)
    )
    .attr('text-anchor', (data: QuadrantPointType) => getTextAnchor(data.text.verticalPos))
    .attr('transform', (data: QuadrantPointType) => getTransformation(data.text));
};

export default {
  draw,
};
