const ERMarkers = {
  ONLY_ONE_START: 'ONLY_ONE_START',
  ONLY_ONE_END: 'ONLY_ONE_END',
  ZERO_OR_ONE_START: 'ZERO_OR_ONE_START',
  ZERO_OR_ONE_END: 'ZERO_OR_ONE_END',
  ONE_OR_MORE_START: 'ONE_OR_MORE_START',
  ONE_OR_MORE_END: 'ONE_OR_MORE_END',
  ZERO_OR_MORE_START: 'ZERO_OR_MORE_START',
  ZERO_OR_MORE_END: 'ZERO_OR_MORE_END',
};

/**
 * Put the markers into the svg DOM for later use with edge paths
 */
const insertMarkers = function (elem, conf) {
  let marker;

  elem
    .append('defs')
    .append('marker')
    .attr('id', ERMarkers.ONLY_ONE_START)
    .attr('refX', 0)
    .attr('refY', 9)
    .attr('markerWidth', 18)
    .attr('markerHeight', 18)
    .attr('orient', 'auto')
    .append('path')
    .attr('stroke', conf.stroke)
    .attr('fill', 'none')
    .attr('d', 'M9,0 L9,18 M15,0 L15,18');

  elem
    .append('defs')
    .append('marker')
    .attr('id', ERMarkers.ONLY_ONE_END)
    .attr('refX', 18)
    .attr('refY', 9)
    .attr('markerWidth', 18)
    .attr('markerHeight', 18)
    .attr('orient', 'auto')
    .append('path')
    .attr('stroke', conf.stroke)
    .attr('fill', 'none')
    .attr('d', 'M3,0 L3,18 M9,0 L9,18');

  marker = elem
    .append('defs')
    .append('marker')
    .attr('id', ERMarkers.ZERO_OR_ONE_START)
    .attr('refX', 0)
    .attr('refY', 9)
    .attr('markerWidth', 30)
    .attr('markerHeight', 18)
    .attr('orient', 'auto');
  marker
    .append('circle')
    .attr('stroke', conf.stroke)
    .attr('fill', 'white')
    .attr('cx', 21)
    .attr('cy', 9)
    .attr('r', 6);
  marker.append('path').attr('stroke', conf.stroke).attr('fill', 'none').attr('d', 'M9,0 L9,18');

  marker = elem
    .append('defs')
    .append('marker')
    .attr('id', ERMarkers.ZERO_OR_ONE_END)
    .attr('refX', 30)
    .attr('refY', 9)
    .attr('markerWidth', 30)
    .attr('markerHeight', 18)
    .attr('orient', 'auto');
  marker
    .append('circle')
    .attr('stroke', conf.stroke)
    .attr('fill', 'white')
    .attr('cx', 9)
    .attr('cy', 9)
    .attr('r', 6);
  marker.append('path').attr('stroke', conf.stroke).attr('fill', 'none').attr('d', 'M21,0 L21,18');

  elem
    .append('defs')
    .append('marker')
    .attr('id', ERMarkers.ONE_OR_MORE_START)
    .attr('refX', 18)
    .attr('refY', 18)
    .attr('markerWidth', 45)
    .attr('markerHeight', 36)
    .attr('orient', 'auto')
    .append('path')
    .attr('stroke', conf.stroke)
    .attr('fill', 'none')
    .attr('d', 'M0,18 Q 18,0 36,18 Q 18,36 0,18 M42,9 L42,27');

  elem
    .append('defs')
    .append('marker')
    .attr('id', ERMarkers.ONE_OR_MORE_END)
    .attr('refX', 27)
    .attr('refY', 18)
    .attr('markerWidth', 45)
    .attr('markerHeight', 36)
    .attr('orient', 'auto')
    .append('path')
    .attr('stroke', conf.stroke)
    .attr('fill', 'none')
    .attr('d', 'M3,9 L3,27 M9,18 Q27,0 45,18 Q27,36 9,18');

  marker = elem
    .append('defs')
    .append('marker')
    .attr('id', ERMarkers.ZERO_OR_MORE_START)
    .attr('refX', 18)
    .attr('refY', 18)
    .attr('markerWidth', 57)
    .attr('markerHeight', 36)
    .attr('orient', 'auto');
  marker
    .append('circle')
    .attr('stroke', conf.stroke)
    .attr('fill', 'white')
    .attr('cx', 48)
    .attr('cy', 18)
    .attr('r', 6);
  marker
    .append('path')
    .attr('stroke', conf.stroke)
    .attr('fill', 'none')
    .attr('d', 'M0,18 Q18,0 36,18 Q18,36 0,18');

  marker = elem
    .append('defs')
    .append('marker')
    .attr('id', ERMarkers.ZERO_OR_MORE_END)
    .attr('refX', 39)
    .attr('refY', 18)
    .attr('markerWidth', 57)
    .attr('markerHeight', 36)
    .attr('orient', 'auto');
  marker
    .append('circle')
    .attr('stroke', conf.stroke)
    .attr('fill', 'white')
    .attr('cx', 9)
    .attr('cy', 18)
    .attr('r', 6);
  marker
    .append('path')
    .attr('stroke', conf.stroke)
    .attr('fill', 'none')
    .attr('d', 'M21,18 Q39,0 57,18 Q39,36 21,18');

  return;
};

export default {
  ERMarkers,
  insertMarkers,
};
