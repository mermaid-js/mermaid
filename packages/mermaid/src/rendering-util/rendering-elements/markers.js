/** Setup arrow head and define the marker. The result is appended to the svg. */
import { log } from '../../logger.js';
import * as configApi from '../../config.js';

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
    .attr('refX', 17.5)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .attr('markerUnits', 'userSpaceOnUse')
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

  elem
    .append('marker')
    .attr('id', id + '_' + type + '-extensionStart-margin')
    .attr('class', 'marker extension ' + type)
    .attr('refX', 18)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('viewBox', '0 0 20 14')
    .append('polygon')
    .attr('points', '10,7 18,13 18,1')
    .style('stroke-width', 2)
    .style('stroke-dasharray', '0');

  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-extensionEnd-margin')
    .attr('class', 'marker extension ' + type)
    .attr('refX', 9)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('viewBox', '0 0 20 14')
    .append('polygon')
    .attr('points', '10,1 10,13 18,7')
    .style('stroke-width', 2)
    .style('stroke-dasharray', '0');
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

  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-compositionStart-margin')
    .attr('class', 'marker composition ' + type)
    .attr('refX', 15)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .attr('markerUnits', 'userSpaceOnUse')
    .append('path')
    .style('stroke-width', 0)
    .attr('viewBox', '0 0 15 15')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-compositionEnd-margin')
    .attr('class', 'marker composition ' + type)
    .attr('refX', 3.5)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .attr('markerUnits', 'userSpaceOnUse')
    .append('path')
    .style('stroke-width', 0)
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

  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-aggregationStart-margin')
    .attr('class', 'marker aggregation ' + type)
    .attr('refX', 15)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .attr('markerUnits', 'userSpaceOnUse')
    .append('path')
    .style('stroke-width', 2)
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-aggregationEnd-margin')
    .attr('class', 'marker aggregation ' + type)
    .attr('refX', 1)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .attr('markerUnits', 'userSpaceOnUse')
    .append('path')
    .style('stroke-width', 2)
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
  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-dependencyStart-margin')
    .attr('class', 'marker dependency ' + type)
    .attr('refX', 4)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .attr('markerUnits', 'userSpaceOnUse')
    .append('path')
    .style('stroke-width', 0)
    .attr('d', 'M 5,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-dependencyEnd-margin')
    .attr('class', 'marker dependency ' + type)
    .attr('refX', 16)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .attr('markerUnits', 'userSpaceOnUse')
    .append('path')
    .style('stroke-width', 0)
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
    .attr('fill', 'transparent')
    .attr('cx', 7)
    .attr('cy', 7)
    .attr('r', 6);
  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-lollipopStart-margin')
    .attr('class', 'marker lollipop ' + type)
    .attr('refX', 13)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .attr('markerUnits', 'userSpaceOnUse')
    .append('circle')
    .attr('fill', 'transparent')
    .attr('cx', 7)
    .attr('cy', 7)
    .attr('r', 6)
    .attr('stroke-width', 2);

  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-lollipopEnd-margin')
    .attr('class', 'marker lollipop ' + type)
    .attr('refX', 1)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .attr('markerUnits', 'userSpaceOnUse')
    .append('circle')
    .attr('fill', 'transparent')
    .attr('cx', 7)
    .attr('cy', 7)
    .attr('r', 6)
    .attr('stroke-width', 2);
};
const point = (elem, type, id) => {
  elem
    .append('marker')
    .attr('id', id + '_' + type + '-pointEnd')
    .attr('class', 'marker ' + type)
    .attr('viewBox', '0 0 11.5 14')
    .attr('refX', 7.75) // Adjust to position the arrowhead relative to the line
    .attr('refY', 7) // Half of 14 for vertical center
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('markerWidth', 10.5)
    .attr('markerHeight', 14)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 0 0 L 11.5 7 L 0 14 z')
    .attr('class', 'arrowMarkerPath')
    .style('stroke-width', 0)
    .style('stroke-dasharray', '1,0');
  elem
    .append('marker')
    .attr('id', id + '_' + type + '-pointStart')
    .attr('class', 'marker ' + type)
    .attr('viewBox', '0 0 11.5 14')
    .attr('refX', 4)
    .attr('refY', 7)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('markerWidth', 11.5)
    .attr('markerHeight', 14)
    .attr('orient', 'auto')
    .append('polygon')
    .attr('points', '0,7 11.5,14 11.5,0')
    .attr('class', 'arrowMarkerPath')
    .style('stroke-width', 0)
    .style('stroke-dasharray', '1,0');
  elem
    .append('marker')
    .attr('id', id + '_' + type + '-pointEnd-margin') //arrows with gap(offset)
    .attr('class', 'marker ' + type)
    .attr('viewBox', '0 0 11.5 14')
    .attr('refX', 11.5) // Adjust to position the arrowhead relative to the line
    .attr('refY', 7) // Half of 14 for vertical center
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('markerWidth', 10.5)
    .attr('markerHeight', 14)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 0 0 L 11.5 7 L 0 14 z')
    .attr('class', 'arrowMarkerPath')
    .style('stroke-width', 0)
    .style('stroke-dasharray', '1,0');
  elem
    .append('marker')
    .attr('id', id + '_' + type + '-pointStart-margin')
    .attr('class', 'marker ' + type)
    .attr('viewBox', '0 0 11.5 14')
    .attr('refX', 1)
    .attr('refY', 7)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('markerWidth', 11.5)
    .attr('markerHeight', 14)
    .attr('orient', 'auto')
    .append('polygon')
    .attr('points', '0,7 11.5,14 11.5,0')
    .attr('class', 'arrowMarkerPath')
    .style('stroke-width', 0)
    .style('stroke-dasharray', '1,0');
};
const circle = (elem, type, id) => {
  elem
    .append('marker')
    .attr('id', id + '_' + type + '-circleEnd')
    .attr('class', 'marker ' + type)
    .attr('viewBox', '0 0 10 10')
    .attr('refY', 5) // What!!!??
    .attr('refX', 10.75)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('markerWidth', 14)
    .attr('markerHeight', 14)
    .attr('orient', 'auto')
    .append('circle')
    .attr('cx', '5')
    .attr('cy', '5')
    .attr('r', '5')
    .attr('class', 'arrowMarkerPath')
    .style('stroke-width', 0)
    .style('stroke-dasharray', '1,0');

  elem
    .append('marker')
    .attr('id', id + '_' + type + '-circleStart')
    .attr('class', 'marker ' + type)
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 0)
    .attr('refY', 5)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('markerWidth', 14)
    .attr('markerHeight', 14)
    .attr('orient', 'auto')
    .append('circle')
    .attr('cx', '5')
    .attr('cy', '5')
    .attr('r', '5')
    .attr('class', 'arrowMarkerPath')
    .style('stroke-width', 0)
    .style('stroke-dasharray', '1,0');
  elem
    .append('marker')
    .attr('id', id + '_' + type + '-circleEnd-margin')
    .attr('class', 'marker ' + type)
    .attr('viewBox', '0 0 10 10')
    .attr('refY', 5) // What!!!??
    .attr('refX', 12.25)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('markerWidth', 14)
    .attr('markerHeight', 14)
    .attr('orient', 'auto')
    .append('circle')
    .attr('cx', '5')
    .attr('cy', '5')
    .attr('r', '5')
    .attr('class', 'arrowMarkerPath')
    .style('stroke-width', 0)
    .style('stroke-dasharray', '1,0');

  elem
    .append('marker')
    .attr('id', id + '_' + type + '-circleStart-margin')
    .attr('class', 'marker ' + type)
    .attr('viewBox', '0 0 10 10')
    .attr('refX', -2)
    .attr('refY', 5)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('markerWidth', 14)
    .attr('markerHeight', 14)
    .attr('orient', 'auto')
    .append('circle')
    .attr('cx', '5')
    .attr('cy', '5')
    .attr('r', '5')
    .attr('class', 'arrowMarkerPath')
    .style('stroke-width', 0)
    .style('stroke-dasharray', '1,0');
};
const cross = (elem, type, id) => {
  elem
    .append('marker')
    .attr('id', id + '_' + type + '-crossEnd')
    .attr('class', 'marker cross ' + type)
    .attr('viewBox', '0 0 15 15')
    .attr('refX', 17.7)
    .attr('refY', 7.5)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('markerWidth', 12)
    .attr('markerHeight', 12)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 1,1 L 14,14 M 1,14 L 14,1')
    .attr('class', 'arrowMarkerPath')
    .style('stroke-width', 2.5);

  elem
    .append('marker')
    .attr('id', id + '_' + type + '-crossStart')
    .attr('class', 'marker cross ' + type)
    .attr('viewBox', '0 0 15 15')
    .attr('refX', -3.5)
    .attr('refY', 7.5)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('markerWidth', 12)
    .attr('markerHeight', 12)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 1,1 L 14,14 M 1,14 L 14,1')
    .attr('class', 'arrowMarkerPath')
    .style('stroke-width', 2.5)
    .style('stroke-dasharray', '1,0');
  elem
    .append('marker')
    .attr('id', id + '_' + type + '-crossEnd-margin')
    .attr('class', 'marker cross ' + type)
    .attr('viewBox', '0 0 15 15')
    .attr('refX', 17.7)
    .attr('refY', 7.5)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('markerWidth', 12)
    .attr('markerHeight', 12)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 1,1 L 14,14 M 1,14 L 14,1')
    .attr('class', 'arrowMarkerPath')
    .style('stroke-width', 2.5);

  elem
    .append('marker')
    .attr('id', id + '_' + type + '-crossStart-margin')
    .attr('class', 'marker cross ' + type)
    .attr('viewBox', '0 0 15 15')
    .attr('refX', -3.5)
    .attr('refY', 7.5)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('markerWidth', 12)
    .attr('markerHeight', 12)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 1,1 L 14,14 M 1,14 L 14,1')
    .attr('class', 'arrowMarkerPath')
    .style('stroke-width', 2.5)
    .style('stroke-dasharray', '1,0');
};
const barb = (elem, type, id) => {
  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-barbEnd')
    .attr('refX', 14)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 14)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 19,7 L9,13 L14,7 L9,1 Z');
};
const barbNeo = (elem, type, id) => {
  const config = configApi.getConfig();
  const { themeVariables } = config;
  const { archEdgeArrowColor } = themeVariables;
  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-barbEnd')
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 14)
    .attr('markerUnits', 'strokeWidth')
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 19,7 L11,14 L13,7 L11,0 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-barbEnd-margin')
    .attr('refX', 17)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 14)
    .attr('markerUnits', 'strokeWidth')
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 19,7 L11,14 L13,7 L11,0 Z')
    .attr('fill', `${archEdgeArrowColor}`);
};
// erDiagram specific markers
const only_one = (elem, type, id) => {
  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-onlyOneStart')
    .attr('class', 'marker onlyOne ' + type)
    .attr('refX', 0)
    .attr('refY', 9)
    .attr('markerWidth', 18)
    .attr('markerHeight', 18)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M9,0 L9,18 M15,0 L15,18');

  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-onlyOneEnd')
    .attr('class', 'marker onlyOne ' + type)
    .attr('refX', 18)
    .attr('refY', 9)
    .attr('markerWidth', 18)
    .attr('markerHeight', 18)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M3,0 L3,18 M9,0 L9,18');
};
const only_one_neo = (elem, type, id) => {
  const config = configApi.getConfig();
  const { themeVariables } = config;
  const { strokeWidth } = themeVariables;

  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-onlyOneStart')
    .attr('class', 'marker onlyOne ' + type)
    .attr('refX', 0)
    .attr('refY', 9)
    .attr('markerWidth', 18)
    .attr('markerHeight', 18)
    .attr('orient', 'auto')
    .attr('markerUnits', 'userSpaceOnUse')
    .append('path')
    .attr('d', 'M9,0 L9,18 M15,0 L15,18')
    .attr('stroke-width', `${strokeWidth}`);

  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-onlyOneEnd')
    .attr('class', 'marker onlyOne ' + type)
    .attr('refX', 18)
    .attr('refY', 9)
    .attr('markerWidth', 18)
    .attr('markerHeight', 18)
    .attr('orient', 'auto')
    .attr('markerUnits', 'userSpaceOnUse')
    .append('path')
    .attr('d', 'M3,0 L3,18 M9,0 L9,18')
    .attr('stroke-width', `${strokeWidth}`);
};

const zero_or_one = (elem, type, id) => {
  const startMarker = elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-zeroOrOneStart')
    .attr('class', 'marker zeroOrOne ' + type)
    .attr('refX', 0)
    .attr('refY', 9)
    .attr('markerWidth', 30)
    .attr('markerHeight', 18)
    .attr('orient', 'auto');
  startMarker
    .append('circle')
    .attr('fill', 'white') // Fill white for now?
    .attr('cx', 21)
    .attr('cy', 9)
    .attr('r', 6);
  startMarker.append('path').attr('d', 'M9,0 L9,18');

  const endMarker = elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-zeroOrOneEnd')
    .attr('class', 'marker zeroOrOne ' + type)
    .attr('refX', 30)
    .attr('refY', 9)
    .attr('markerWidth', 30)
    .attr('markerHeight', 18)
    .attr('orient', 'auto');
  endMarker
    .append('circle')
    .attr('fill', 'white') // Fill white for now?
    .attr('cx', 9)
    .attr('cy', 9)
    .attr('r', 6);
  endMarker.append('path').attr('d', 'M21,0 L21,18');
};

const zero_or_one_neo = (elem, type, id) => {
  const config = configApi.getConfig();
  const { themeVariables } = config;
  const { strokeWidth } = themeVariables;
  const startMarker = elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-zeroOrOneStart')
    .attr('class', 'marker zeroOrOne ' + type)
    .attr('refX', 0)
    .attr('refY', 9)
    .attr('markerWidth', 30)
    .attr('markerHeight', 18)
    .attr('orient', 'auto')
    .attr('markerUnits', 'userSpaceOnUse');
  startMarker
    .append('circle')
    .attr('fill', 'white') // Fill white for now?
    .attr('cx', 21)
    .attr('cy', 9)
    .attr('stroke-width', `${strokeWidth}`)
    .attr('r', 6);
  startMarker.append('path').attr('d', 'M9,0 L9,18').attr('stroke-width', `${strokeWidth}`);

  const endMarker = elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-zeroOrOneEnd')
    .attr('class', 'marker zeroOrOne ' + type)
    .attr('refX', 30)
    .attr('refY', 9)
    .attr('markerWidth', 30)
    .attr('markerHeight', 18)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('orient', 'auto');
  endMarker
    .append('circle')
    .attr('fill', 'white') // Fill white for now?
    .attr('cx', 9)
    .attr('cy', 9)
    .attr('stroke-width', `${strokeWidth}`)
    .attr('r', 6);
  endMarker.append('path').attr('d', 'M21,0 L21,18').attr('stroke-width', `${strokeWidth}`);
};

const one_or_more = (elem, type, id) => {
  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-oneOrMoreStart')
    .attr('class', 'marker oneOrMore ' + type)
    .attr('refX', 18)
    .attr('refY', 18)
    .attr('markerWidth', 45)
    .attr('markerHeight', 36)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,18 Q 18,0 36,18 Q 18,36 0,18 M42,9 L42,27');

  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-oneOrMoreEnd')
    .attr('class', 'marker oneOrMore ' + type)
    .attr('refX', 27)
    .attr('refY', 18)
    .attr('markerWidth', 45)
    .attr('markerHeight', 36)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M3,9 L3,27 M9,18 Q27,0 45,18 Q27,36 9,18');
};

const one_or_more_neo = (elem, type, id) => {
  const config = configApi.getConfig();
  const { themeVariables } = config;
  const { strokeWidth } = themeVariables;
  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-oneOrMoreStart')
    .attr('class', 'marker oneOrMore ' + type)
    .attr('refX', 18)
    .attr('refY', 18)
    .attr('markerWidth', 45)
    .attr('markerHeight', 36)
    .attr('orient', 'auto')
    .attr('markerUnits', 'userSpaceOnUse')
    .append('path')
    .attr('d', 'M0,18 Q 18,0 36,18 Q 18,36 0,18 M42,9 L42,27')
    .attr('stroke-width', `${strokeWidth}`);

  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-oneOrMoreEnd')
    .attr('class', 'marker oneOrMore ' + type)
    .attr('refX', 27)
    .attr('refY', 18)
    .attr('markerWidth', 45)
    .attr('markerHeight', 36)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M3,9 L3,27 M9,18 Q27,0 45,18 Q27,36 9,18')
    .attr('stroke-width', `${strokeWidth}`);
};

const zero_or_more = (elem, type, id) => {
  const startMarker = elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-zeroOrMoreStart')
    .attr('class', 'marker zeroOrMore ' + type)
    .attr('refX', 18)
    .attr('refY', 18)
    .attr('markerWidth', 57)
    .attr('markerHeight', 36)
    .attr('orient', 'auto');
  startMarker.append('circle').attr('fill', 'white').attr('cx', 48).attr('cy', 18).attr('r', 6);
  startMarker.append('path').attr('d', 'M0,18 Q18,0 36,18 Q18,36 0,18');

  const endMarker = elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-zeroOrMoreEnd')
    .attr('class', 'marker zeroOrMore ' + type)
    .attr('refX', 39)
    .attr('refY', 18)
    .attr('markerWidth', 57)
    .attr('markerHeight', 36)
    .attr('orient', 'auto');
  endMarker.append('circle').attr('fill', 'white').attr('cx', 9).attr('cy', 18).attr('r', 6);
  endMarker.append('path').attr('d', 'M21,18 Q39,0 57,18 Q39,36 21,18');
};

const zero_or_more_neo = (elem, type, id) => {
  const config = configApi.getConfig();
  const { themeVariables } = config;
  const { strokeWidth } = themeVariables;
  const startMarker = elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-zeroOrMoreStart')
    .attr('class', 'marker zeroOrMore ' + type)
    .attr('refX', 18)
    .attr('refY', 18)
    .attr('markerWidth', 57)
    .attr('markerHeight', 36)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('orient', 'auto');
  startMarker
    .append('circle')
    .attr('fill', 'white')
    .attr('cx', 45.5)
    .attr('cy', 18)
    .attr('r', 6)
    .attr('stroke-width', `${strokeWidth}`);
  startMarker
    .append('path')
    .attr('d', 'M0,18 Q18,0 36,18 Q18,36 0,18')
    .attr('stroke-width', `${strokeWidth}`);

  const endMarker = elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-zeroOrMoreEnd')
    .attr('class', 'marker zeroOrMore ' + type)
    .attr('refX', 39)
    .attr('refY', 18)
    .attr('markerWidth', 57)
    .attr('markerHeight', 36)
    .attr('orient', 'auto')
    .attr('markerUnits', 'userSpaceOnUse');
  endMarker
    .append('circle')
    .attr('fill', 'white')
    .attr('cx', 11)
    .attr('cy', 18)
    .attr('r', 6)
    .attr('stroke-width', `${strokeWidth}`);
  endMarker
    .append('path')
    .attr('d', 'M21,18 Q39,0 57,18 Q39,36 21,18')
    .attr('stroke-width', `${strokeWidth}`);
};

const requirement_arrow = (elem, type, id) => {
  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-requirement_arrowEnd')
    .attr('refX', 20)
    .attr('refY', 10)
    .attr('markerWidth', 20)
    .attr('markerHeight', 20)
    .attr('orient', 'auto')
    .attr('markerUnits', 'userSpaceOnUse')
    .append('path')
    .attr(
      'd',
      `M0,0
      L20,10
      M20,10
      L0,20`
    );
};

const requirement_arrow_neo = (elem, type, id) => {
  const config = configApi.getConfig();
  const { themeVariables } = config;
  const { strokeWidth } = themeVariables;

  elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-requirement_arrowEnd')
    .attr('refX', 20)
    .attr('refY', 10)
    .attr('markerWidth', 20)
    .attr('markerHeight', 20)
    .attr('orient', 'auto')
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('stroke-width', `${strokeWidth}`)
    .attr('viewBox', '0 0 25 20')
    .append('path')
    .attr(
      'd',
      `M0,0
      L20,10
      M20,10
      L0,20`
    )
    .attr('stroke-linejoin', 'miter');
};

const requirement_contains = (elem, type, id) => {
  const containsNode = elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-requirement_containsStart')
    .attr('refX', 0)
    .attr('refY', 10)
    .attr('markerWidth', 20)
    .attr('markerHeight', 20)
    .attr('orient', 'auto')
    .attr('markerUnits', 'userSpaceOnUse')
    .append('g');

  containsNode.append('circle').attr('cx', 10).attr('cy', 10).attr('r', 9).attr('fill', 'none');

  containsNode.append('line').attr('x1', 1).attr('x2', 19).attr('y1', 10).attr('y2', 10);

  containsNode.append('line').attr('y1', 1).attr('y2', 19).attr('x1', 10).attr('x2', 10);
};

const requirement_contains_neo = (elem, type, id) => {
  const config = configApi.getConfig();
  const { themeVariables } = config;
  const { strokeWidth } = themeVariables;
  const containsNode = elem
    .append('defs')
    .append('marker')
    .attr('id', id + '_' + type + '-requirement_containsStart')
    .attr('refX', 0)
    .attr('refY', 10)
    .attr('markerWidth', 20)
    .attr('markerHeight', 20)
    .attr('orient', 'auto')
    .attr('markerUnits', 'userSpaceOnUse')
    .append('g');

  containsNode.append('circle').attr('cx', 10).attr('cy', 10).attr('r', 9).attr('fill', 'none');

  containsNode.append('line').attr('x1', 1).attr('x2', 19).attr('y1', 10).attr('y2', 10);

  containsNode.append('line').attr('y1', 1).attr('y2', 19).attr('x1', 10).attr('x2', 10);
  containsNode.selectAll('*').attr('stroke-width', `${strokeWidth}`);
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
  barbNeo,
  only_one,
  zero_or_one,
  one_or_more,
  zero_or_more,
  only_one_neo,
  zero_or_one_neo,
  one_or_more_neo,
  zero_or_more_neo,
  requirement_arrow,
  requirement_contains,
  requirement_arrow_neo,
  requirement_contains_neo,
};
export default insertMarkers;
