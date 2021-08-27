const ReqMarkers = {
  CONTAINS: 'contains',
  ARROW: 'arrow',
};

const insertLineEndings = (parentNode, conf) => {
  let containsNode = parentNode
    .append('defs')
    .append('marker')
    .attr('id', ReqMarkers.CONTAINS + '_line_ending')
    .attr('refX', 0)
    .attr('refY', conf.line_height / 2)
    .attr('markerWidth', conf.line_height)
    .attr('markerHeight', conf.line_height)
    .attr('orient', 'auto')
    .append('g');

  containsNode
    .append('circle')
    .attr('cx', conf.line_height / 2)
    .attr('cy', conf.line_height / 2)
    .attr('r', conf.line_height / 2)
    // .attr('stroke', conf.rect_border_color)
    // .attr('stroke-width', 1)
    .attr('fill', 'none');

  containsNode
    .append('line')
    .attr('x1', 0)
    .attr('x2', conf.line_height)
    .attr('y1', conf.line_height / 2)
    .attr('y2', conf.line_height / 2)
    // .attr('stroke', conf.rect_border_color)
    .attr('stroke-width', 1);

  containsNode
    .append('line')
    .attr('y1', 0)
    .attr('y2', conf.line_height)
    .attr('x1', conf.line_height / 2)
    .attr('x2', conf.line_height / 2)
    // .attr('stroke', conf.rect_border_color)
    .attr('stroke-width', 1);

  parentNode
    .append('defs')
    .append('marker')
    .attr('id', ReqMarkers.ARROW + '_line_ending')
    .attr('refX', conf.line_height)
    .attr('refY', 0.5 * conf.line_height)
    .attr('markerWidth', conf.line_height)
    .attr('markerHeight', conf.line_height)
    .attr('orient', 'auto')
    .append('path')
    .attr(
      'd',
      `M0,0
      L${conf.line_height},${conf.line_height / 2}
      M${conf.line_height},${conf.line_height / 2}
      L0,${conf.line_height}`
    )
    .attr('stroke-width', 1);
  // .attr('stroke', conf.rect_border_color);
};

export default {
  ReqMarkers,
  insertLineEndings,
};
