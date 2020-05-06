import createLabel from '../createLabel';

export const labelHelper = (parent, node, _classes) => {
  let classes;
  if (!_classes) {
    classes = 'node default';
  } else {
    classes = _classes;
  }
  // Add outer g element
  const shapeSvg = parent
    .insert('g')
    .attr('class', classes)
    .attr('id', node.id);

  // Create the label and insert it after the rect
  const label = shapeSvg.insert('g').attr('class', 'label');

  const text = label.node().appendChild(createLabel(node.labelText, node.labelStyle));

  // Get the size of the label
  const bbox = text.getBBox();

  const halfPadding = node.padding / 2;

  // Center the label
  label.attr('transform', 'translate(' + -bbox.width / 2 + ', ' + -bbox.height / 2 + ')');

  return { shapeSvg, bbox, halfPadding, label };
};

export const updateNodeBounds = (node, element) => {
  const bbox = element.node().getBBox();
  node.width = bbox.width;
  node.height = bbox.height;
};

export function insertPolygonShape(parent, w, h, points) {
  return parent
    .insert('polygon', ':first-child')
    .attr(
      'points',
      points
        .map(function(d) {
          return d.x + ',' + d.y;
        })
        .join(' ')
    )
    .attr('class', 'label-container')
    .attr('transform', 'translate(' + -w / 2 + ',' + h / 2 + ')');
}
