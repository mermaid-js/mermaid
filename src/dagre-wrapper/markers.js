/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 */
const insertMarkers = elem => {
  elem
    .append('defs')
    .append('marker')
    .attr('id', 'extensionStart')
    .attr('class', 'extension')
    .attr('refX', 0)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 1,7 L18,13 V 1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', 'extensionEnd')
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 1,1 V 13 L18,7 Z'); // this is actual shape for arrowhead

  elem
    .append('defs')
    .append('marker')
    .attr('id', 'compositionStart')
    .attr('class', 'extension')
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
    .attr('id', 'compositionEnd')
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', 'aggregationStart')
    .attr('class', 'extension')
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
    .attr('id', 'aggregationEnd')
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', 'dependencyStart')
    .attr('class', 'extension')
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
    .attr('id', 'dependencyEnd')
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L14,7 L9,1 Z');

  elem
    .append('marker')
    .attr('id', 'normalEnd')
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 9)
    .attr('refY', 5)
    .attr('markerUnits', 'strokeWidth')
    .attr('markerWidth', 8)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 0 0 L 10 5 L 0 10 z')
    .attr('class', 'arrowheadPath')
    .style('stroke-width', 1)
    .style('stroke-dasharray', '1,0');
  elem
    .append('marker')
    .attr('id', 'normalStart')
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 9)
    .attr('refY', 5)
    .attr('markerUnits', 'strokeWidth')
    .attr('markerWidth', 8)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 0 0 L 10 5 L 0 10 z')
    .attr('class', 'arrowheadPath')
    .style('stroke-width', 1)
    .style('stroke-dasharray', '1,0');
  elem
    .append('marker')
    .attr('id', 'circleEnd')
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 10)
    .attr('refY', 5)
    .attr('markerUnits', 'strokeWidth')
    .attr('markerWidth', 7)
    .attr('markerHeight', 7)
    .attr('orient', 'auto')
    .append('circle')
    .attr('cx', '5')
    .attr('cy', '5')
    .attr('r', '5')
    .attr('fill', 'red')
    .attr('class', 'arrowheadPath')
    .style('stroke-width', 1)
    .style('stroke-dasharray', '1,0');

  elem
    .append('marker')
    .attr('id', 'circleStart')
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 0)
    .attr('refY', 5)
    .attr('markerUnits', 'strokeWidth')
    .attr('markerWidth', 7)
    .attr('markerHeight', 7)
    .attr('orient', 'auto')
    .append('circle')
    .attr('cx', '5')
    .attr('cy', '5')
    .attr('r', '5')
    .attr('fill', 'red')
    .attr('class', 'arrowheadPath')
    .style('stroke-width', 1)
    .style('stroke-dasharray', '1,0');
};

export default insertMarkers;
