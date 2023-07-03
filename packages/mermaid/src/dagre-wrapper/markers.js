/** Setup arrow head and define the marker. The result is appended to the svg. */

import { log } from '../logger.js';

const getSvgParent = (elem) => {
  let container = elem;

  // the intent here is to find the first parent element that is NOT part of the SVG element
  // I know there has to be a better way, but could not find one that worked
  // tried using checking if elem was instanceof SVGGraphicsElement or SVGElement, but it failed to detect correctly
  if (container._groups) {
    container = container._groups[0][0];
  }
  if (container.tagName.toLowerCase() === 'g') {
    container = container.parentElement;
  }
  if (container.localName.toLowerCase() === 'svg') {
    container = container.parentElement;
  }
  return container;
};

const getBackgroundColor = (elem) => {
  let parent = getSvgParent(elem);

  let backgroundColor;
  while (parent && parent.tagName.toLowerCase() !== 'body') {
    if(parent instanceof Element) {
      const computedStyle = getComputedStyle(parent);
      backgroundColor = computedStyle.backgroundColor;

      if (backgroundColor !== 'rgba(0, 0, 0, 0)') {
        break;
      }
      parent = parent.parentNode;
    }
  }

  return backgroundColor === 'rgba(0, 0, 0, 0)' ? 'white' : backgroundColor;
};

// Only add the number of markers that the diagram needs
const insertMarkers = (elem, markerArray, type, id) => {
  markerArray.forEach((markerName) => {
    markers[markerName](elem, type, id);
  });
};

const extension = (elem, type, id) => {
  log.trace('Making markers for ', id);
  const backgroundColor = getBackgroundColor(elem);

  elem
    .append('defs')
    .append('marker')
    .attr('id', type + '-extensionStart')
    .attr('class', 'marker extension ' + type)
    .attr('refX', 0)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 1,7 L18,13 V 2 Z')
    .attr('fill', backgroundColor);

  elem
    .append('defs')
    .append('marker')
    .attr('id', type + '-extensionEnd')
    .attr('class', 'marker extension ' + type)
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 1,1 V 13 L18,7 Z')
    .attr('fill', backgroundColor); // this is actual shape for arrowhead
};

const realization = (elem, type, id) => {
  log.trace('Making markers for ', id);
  let backgroundColor = getBackgroundColor(elem);

  elem
    .append('defs')
    .append('marker')
    .attr('id', type + '-realizationStart')
    .attr('class', 'marker realization ' + type)
    .attr('refX', 0)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 1,7 L18,13 V 2 Z')
    .attr('fill', backgroundColor);

  elem
    .append('defs')
    .append('marker')
    .attr('id', type + '-realizationEnd')
    .attr('class', 'marker realization ' + type)
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 1,1 V 13 L18,7 Z')
    .attr('fill', backgroundColor); // this is actual shape for arrowhead
};

const composition = (elem, type) => {
  elem
    .append('defs')
    .append('marker')
    .attr('id', type + '-compositionStart')
    .attr('class', 'marker composition ' + type)
    .attr('refX', 0)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', type + '-compositionEnd')
    .attr('class', 'marker composition ' + type)
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');
};
const aggregation = (elem, type) => {
  elem
    .append('defs')
    .append('marker')
    .attr('id', type + '-aggregationStart')
    .attr('class', 'marker aggregation ' + type)
    .attr('refX', 0)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', type + '-aggregationEnd')
    .attr('class', 'marker aggregation ' + type)
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');
};
const dependency = (elem, type) => {
  elem
    .append('defs')
    .append('marker')
    .attr('id', type + '-dependencyStart')
    .attr('class', 'marker dependency ' + type)
    .attr('refX', 0)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 5,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', type + '-dependencyEnd')
    .attr('class', 'marker dependency ' + type)
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L14,7 L9,1 Z');
};
const lollipop = (elem, type) => {
  elem
    .append('defs')
    .append('marker')
    .attr('id', type + '-lollipopStart')
    .attr('class', 'marker lollipop ' + type)
    .attr('refX', 0)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('circle')
    .attr('stroke', 'black')
    .attr('fill', 'white')
    .attr('cx', 6)
    .attr('cy', 7)
    .attr('r', 6);
};
const point = (elem, type) => {
  elem
    .append('marker')
    .attr('id', type + '-pointEnd')
    .attr('class', 'marker ' + type)
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 10)
    .attr('refY', 5)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('markerWidth', 12)
    .attr('markerHeight', 12)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 0 0 L 10 5 L 0 10 z')
    .attr('class', 'arrowMarkerPath')
    .style('stroke-width', 1)
    .style('stroke-dasharray', '1,0');
  elem
    .append('marker')
    .attr('id', type + '-pointStart')
    .attr('class', 'marker ' + type)
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 0)
    .attr('refY', 5)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('markerWidth', 12)
    .attr('markerHeight', 12)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 0 5 L 10 10 L 10 0 z')
    .attr('class', 'arrowMarkerPath')
    .style('stroke-width', 1)
    .style('stroke-dasharray', '1,0');
};
const circle = (elem, type) => {
  elem
    .append('marker')
    .attr('id', type + '-circleEnd')
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
    .attr('id', type + '-circleStart')
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
const cross = (elem, type) => {
  elem
    .append('marker')
    .attr('id', type + '-crossEnd')
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
    .attr('id', type + '-crossStart')
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
const barb = (elem, type) => {
  elem
    .append('defs')
    .append('marker')
    .attr('id', type + '-barbEnd')
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 14)
    .attr('markerUnits', 'strokeWidth')
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 19,7 L9,13 L14,7 L9,1 Z');
};

// TODO rename the class diagram markers to something shape descriptive and semantic free
const markers = {
  extension,
  realization,
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
