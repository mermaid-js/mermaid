import { select, scaleLinear } from 'd3';
import * as configApi from '../../config.js';
import { log } from '../../logger.js';

import { configureSvgSize } from '../../setupGraphViewbox.js';

export const draw = (txt, id, _version, diagObj) => {


  function getDominantBaseLine(horizintalPos) {
    return horizintalPos === 'top' ? 'text-before-edge' : 'middle';
  }

  function getTextAnchor(verticalPos) {
    return verticalPos === 'left' ? 'start' : 'middle';
  }

  function getTransformation(data) {
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


  // const bounds = svg.node().getBox();
  // const width = bounds.width + padding * 2;
  // const height = bounds.height + padding * 2;
  const width = 500;
  const height = 500;

  diagObj.db.setHeight(height);
  diagObj.db.setWidth(width);

  svg.attr('width', width);
  svg.attr('height', height);

  const quadrantData = diagObj.db.getQuadrantData();

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
    .attr('x', data => data.x)
    .attr('y', data => data.y)
    .attr('width', data => data.width)
    .attr('height', data => data.height)
    .attr('fill', data => data.fill);

  quadrants
    .append('text')
    .attr('x', 0)
    .attr('y', 0)
    .attr('fill', data => data.text.fill)
    .attr('font-size', data => data.text.fontSize)
    .attr('dominant-baseline', data => getDominantBaseLine(data.text.horizontalPos))
    .attr('text-anchor', data => getTextAnchor(data.text.verticalPos))
    .attr('transform', data => getTransformation(data.text))
    .text(data => data.text.text);

  const labels = labelGroup
    .selectAll('g.label')
    .data(quadrantData.axisLabels)
    .enter()
    .append('g')
    .attr('class', 'label')

  labels
    .append('text')
    .attr('x', 0)
    .attr('y', 0)
    .text(data => data.text)
    .attr('fill', data => data.fill)
    .attr('font-size', data => data.fontSize)
    .attr('dominant-baseline', data => getDominantBaseLine(data.horizontalPos))
    .attr('text-anchor', data => getTextAnchor(data.verticalPos))
    .attr('transform', data => getTransformation(data))

  const dataPoints = dataPointGroup
    .selectAll('g.data-point')
    .data(quadrantData.points)
    .enter()
    .append('g')
    .attr('class', 'data-point')

  dataPoints
    .append('circle')
    .attr('cx', data => data.x)
    .attr('cy', data => data.y)
    .attr('r', data => data.radius)
    .attr('fill', data => data.fill);

  dataPoints
    .append('text')
    .attr('x', 0)
    .attr('y', 0)
    .text(data => data.text.text)
    .attr('fill', data => data.text.fill)
    .attr('font-size', data => data.text.fontSize)
    .attr('dominant-baseline', data => getDominantBaseLine(data.text.horizontalPos))
    .attr('text-anchor', data => getTextAnchor(data.text.verticalPos))
    .attr('transform', data => getTransformation(data.text))
};

export default {
  draw,
};
