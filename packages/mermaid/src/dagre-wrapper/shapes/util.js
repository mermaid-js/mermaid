import createLabel from '../createLabel.js';
import { getConfig } from '../../config.js';
import { decodeEntities } from '../../mermaidAPI.js';
import { select } from 'd3';
import { evaluate, sanitizeText } from '../../diagrams/common/common.js';
export const labelHelper = (parent, node, _classes, isNode) => {
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
    .attr('id', node.domId || node.id);

  // Create the label and insert it after the rect
  const label = shapeSvg.insert('g').attr('class', 'label').attr('style', node.labelStyle);

  // Replace labelText with default value if undefined
  let labelText;
  if (node.labelText === undefined) {
    labelText = '';
  } else {
    labelText = typeof node.labelText === 'string' ? node.labelText : node.labelText[0];
  }

  const text = label
    .node()
    .appendChild(
      createLabel(
        sanitizeText(decodeEntities(labelText), getConfig()),
        node.labelStyle,
        false,
        isNode
      )
    );

  // Get the size of the label
  let bbox = text.getBBox();

  if (evaluate(getConfig().flowchart.htmlLabels)) {
    const div = text.children[0];
    const dv = select(text);
    bbox = div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  }

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

/**
 * @param parent
 * @param w
 * @param h
 * @param points
 */
export function insertPolygonShape(parent, w, h, points) {
  return parent
    .insert('polygon', ':first-child')
    .attr(
      'points',
      points
        .map(function (d) {
          return d.x + ',' + d.y;
        })
        .join(' ')
    )
    .attr('class', 'label-container')
    .attr('transform', 'translate(' + -w / 2 + ',' + h / 2 + ')');
}
