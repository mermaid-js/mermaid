/** Setup arrow head and define the marker. The result is appended to the svg. */
import { log } from '../../logger.js';

// Only add the number of markers that the diagram needs
const insertMarkers = (elem, markerArray, type, id) => {
  markerArray.forEach((markerName) => {
    markers[markerName](elem, type, id);
  });
};

const extension = (elem, type, id) => {
  log.trace('Making markers for ', id);
  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-extensionStart')
    .attr('class', 'marker extension ' + type)
    .attr('refX', 18)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 1,7 L18,13 V 1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-extensionEnd')
    .attr('class', 'marker extension ' + type)
    .attr('refX', 1)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 1,1 V 13 L18,7 Z'); // this is actual shape for arrowhead
};

const composition = (elem, type, id) => {
  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-compositionStart')
    .attr('class', 'marker composition ' + type)
    .attr('refX', 18)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-compositionEnd')
    .attr('class', 'marker composition ' + type)
    .attr('refX', 1)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');
};
const aggregation = (elem, type, id) => {
  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-aggregationStart')
    .attr('class', 'marker aggregation ' + type)
    .attr('refX', 18)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-aggregationEnd')
    .attr('class', 'marker aggregation ' + type)
    .attr('refX', 1)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');
};
const dependency = (elem, type, id) => {
  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-dependencyStart')
    .attr('class', 'marker dependency ' + type)
    .attr('refX', 6)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 5,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-dependencyEnd')
    .attr('class', 'marker dependency ' + type)
    .attr('refX', 13)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L14,7 L9,1 Z');
};
const lollipop = (elem, type, id) => {
  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-lollipopStart')
    .attr('class', 'marker lollipop ' + type)
    .attr('refX', 13)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('circle')
    .attr('stroke', 'black')
    .attr('fill', 'transparent')
    .attr('cx', 7)
    .attr('cy', 7)
    .attr('r', 6);

  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-lollipopEnd')
    .attr('class', 'marker lollipop ' + type)
    .attr('refX', 1)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('circle')
    .attr('stroke', 'black')
    .attr('fill', 'transparent')
    .attr('cx', 7)
    .attr('cy', 7)
    .attr('r', 6);
};
const point = (elem, type, id) => {
  elem
    .append('marker')
    .attr('id', id + '_' + type + '-pointEnd')
    .attr('class', 'marker ' + type)
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 5)
    .attr('refY', 5)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('markerWidth', 8)
    .attr('markerHeight', 8)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 0 0 L 10 5 L 0 10 z')
    .attr('class', 'arrowMarkerPath')
    .style('stroke-width', 1)
    .style('stroke-dasharray', '1,0');
  elem
    .append('marker')
    .attr('id', id + '_' + type + '-pointStart')
    .attr('class', 'marker ' + type)
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 4.5)
    .attr('refY', 5)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('markerWidth', 8)
    .attr('markerHeight', 8)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 0 5 L 10 10 L 10 0 z')
    .attr('class', 'arrowMarkerPath')
    .style('stroke-width', 1)
    .style('stroke-dasharray', '1,0');
};
const circle = (elem, type, id) => {
  elem
    .append('marker')
    .attr('id', id + '_' + type + '-circleEnd')
    .attr('class', 'marker ' + type)
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 11)
    .attr('refY', 5)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('markerWidth', 11)
    .attr('markerHeight', 11)
    .attr('orient', 'auto')
    .append('circle')
    .attr('cx', '5')
    .attr('cy', '5')
    .attr('r', '5')
    .attr('class', 'arrowMarkerPath')
    .style('stroke-width', 1)
    .style('stroke-dasharray', '1,0');

  elem
    .append('marker')
    .attr('id', id + '_' + type + '-circleStart')
    .attr('class', 'marker ' + type)
    .attr('viewBox', '0 0 10 10')
    .attr('refX', -1)
    .attr('refY', 5)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('markerWidth', 11)
    .attr('markerHeight', 11)
    .attr('orient', 'auto')
    .append('circle')
    .attr('cx', '5')
    .attr('cy', '5')
    .attr('r', '5')
    .attr('class', 'arrowMarkerPath')
    .style('stroke-width', 1)
    .style('stroke-dasharray', '1,0');
};
const cross = (elem, type, id) => {
  elem
    .append('marker')
    .attr('id', id + '_' + type + '-crossEnd')
    .attr('class', 'marker cross ' + type)
    .attr('viewBox', '0 0 11 11')
    .attr('refX', 12)
    .attr('refY', 5.2)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('markerWidth', 11)
    .attr('markerHeight', 11)
    .attr('orient', 'auto')
    .append('path')
    // .attr('stroke', 'black')
    .attr('d', 'M 1,1 l 9,9 M 10,1 l -9,9')
    .attr('class', 'arrowMarkerPath')
    .style('stroke-width', 2)
    .style('stroke-dasharray', '1,0');

  elem
    .append('marker')
    .attr('id', id + '_' + type + '-crossStart')
    .attr('class', 'marker cross ' + type)
    .attr('viewBox', '0 0 11 11')
    .attr('refX', -1)
    .attr('refY', 5.2)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('markerWidth', 11)
    .attr('markerHeight', 11)
    .attr('orient', 'auto')
    .append('path')
    // .attr('stroke', 'black')
    .attr('d', 'M 1,1 l 9,9 M 10,1 l -9,9')
    .attr('class', 'arrowMarkerPath')
    .style('stroke-width', 2)
    .style('stroke-dasharray', '1,0');
};
const barb = (elem, type, id) => {
  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-barbEnd')
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 14)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 19,7 L9,13 L14,7 L9,1 Z');
};

// TODO rename the class diagram markers to something shape descriptive and semantic free
const markers = {
  extension,
  composition,
  aggregation,
  dependency,
  lollipop,
  point,
  circle,
  cross,
  barb,
};
export default insertMarkers;
