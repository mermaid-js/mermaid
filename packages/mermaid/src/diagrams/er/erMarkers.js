const ERMarkers = {
  ONLY_ONE_START: 'ONLY_ONE_START',
  ONLY_ONE_END: 'ONLY_ONE_END',
  ZERO_OR_ONE_START: 'ZERO_OR_ONE_START',
  ZERO_OR_ONE_END: 'ZERO_OR_ONE_END',
  ONE_OR_MORE_START: 'ONE_OR_MORE_START',
  ONE_OR_MORE_END: 'ONE_OR_MORE_END',
  ZERO_OR_MORE_START: 'ZERO_OR_MORE_START',
  ZERO_OR_MORE_END: 'ZERO_OR_MORE_END',
  MD_PARENT_END: 'MD_PARENT_END',
  MD_PARENT_START: 'MD_PARENT_START',
};

/**
 * Insert ER diagram markers into SVG <defs>
 * Marker geometry is normalized to ensure consistent alignment
 * across browsers and zoom levels.
 *
 * @param {any} elem
 * @param {any} conf
 */
const insertMarkers = function (elem, conf) {
  /* ===============================
     Parent markers
     =============================== */

  elem
    .append('defs')
    .append('marker')
    .attr('id', ERMarkers.MD_PARENT_START)
    .attr('refX', 9)
    .attr('refY', 7)
    .attr('markerWidth', 18)
    .attr('markerHeight', 14)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', ERMarkers.MD_PARENT_END)
    .attr('refX', 9)
    .attr('refY', 7)
    .attr('markerWidth', 18)
    .attr('markerHeight', 14)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');

  /* ===============================
     Only-one markers
     =============================== */

  elem
    .append('defs')
    .append('marker')
    .attr('id', ERMarkers.ONLY_ONE_START)
    .attr('refX', 9)
    .attr('refY', 9)
    .attr('markerWidth', 18)
    .attr('markerHeight', 18)
    .attr('orient', 'auto')
    .append('path')
    .attr('stroke', conf.stroke)
    .attr('fill', 'none')
    .attr('d', 'M6,0 L6,18 M12,0 L12,18');

  elem
    .append('defs')
    .append('marker')
    .attr('id', ERMarkers.ONLY_ONE_END)
    .attr('refX', 9)
    .attr('refY', 9)
    .attr('markerWidth', 18)
    .attr('markerHeight', 18)
    .attr('orient', 'auto')
    .append('path')
    .attr('stroke', conf.stroke)
    .attr('fill', 'none')
    .attr('d', 'M6,0 L6,18 M12,0 L12,18');

  /* ===============================
     Zero-or-one markers
     =============================== */

  let marker = elem
    .append('defs')
    .append('marker')
    .attr('id', ERMarkers.ZERO_OR_ONE_START)
    .attr('refX', 15)
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
    .attr('refX', 15)
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

  /* ===============================
     ONE-OR-MORE (FIXED)
     =============================== */

  const ONE_OR_MORE_WIDTH = 36;
  const ONE_OR_MORE_CENTER = ONE_OR_MORE_WIDTH / 2;

  elem
    .append('defs')
    .append('marker')
    .attr('id', ERMarkers.ONE_OR_MORE_START)
    .attr('refX', ONE_OR_MORE_CENTER)
    .attr('refY', 18)
    .attr('markerWidth', ONE_OR_MORE_WIDTH)
    .attr('markerHeight', 36)
    .attr('orient', 'auto')
    .append('path')
    .attr('stroke', conf.stroke)
    .attr('fill', 'none')
    .attr('d', 'M0,18 Q18,0 36,18 Q18,36 0,18 M36,9 L36,27');

  elem
    .append('defs')
    .append('marker')
    .attr('id', ERMarkers.ONE_OR_MORE_END)
    .attr('refX', ONE_OR_MORE_CENTER)
    .attr('refY', 18)
    .attr('markerWidth', ONE_OR_MORE_WIDTH)
    .attr('markerHeight', 36)
    .attr('orient', 'auto')
    .append('path')
    .attr('stroke', conf.stroke)
    .attr('fill', 'none')
    .attr('d', 'M0,9 L0,27 M0,18 Q18,0 36,18 Q18,36 0,18');

  /* ===============================
     ZERO-OR-MORE markers
     =============================== */

  const ZERO_OR_MORE_WIDTH = 42;
  const ZERO_OR_MORE_CENTER = ZERO_OR_MORE_WIDTH / 2;

  marker = elem
    .append('defs')
    .append('marker')
    .attr('id', ERMarkers.ZERO_OR_MORE_START)
    .attr('refX', ZERO_OR_MORE_CENTER)
    .attr('refY', 18)
    .attr('markerWidth', ZERO_OR_MORE_WIDTH)
    .attr('markerHeight', 36)
    .attr('orient', 'auto');

  marker
    .append('circle')
    .attr('stroke', conf.stroke)
    .attr('fill', 'white')
    .attr('cx', 36)
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
    .attr('refX', ZERO_OR_MORE_CENTER)
    .attr('refY', 18)
    .attr('markerWidth', ZERO_OR_MORE_WIDTH)
    .attr('markerHeight', 36)
    .attr('orient', 'auto');

  marker
    .append('circle')
    .attr('stroke', conf.stroke)
    .attr('fill', 'white')
    .attr('cx', 6)
    .attr('cy', 18)
    .attr('r', 6);

  marker
    .append('path')
    .attr('stroke', conf.stroke)
    .attr('fill', 'none')
    .attr('d', 'M6,18 Q24,0 42,18 Q24,36 6,18');
};

export default {
  ERMarkers,
  insertMarkers,
};
