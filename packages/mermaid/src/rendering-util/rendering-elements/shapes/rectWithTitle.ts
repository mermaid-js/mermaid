import type { Node } from '../../types.js';
import { select } from 'd3';
import { evaluate } from '../../../diagrams/common/common.js';
import { updateNodeBounds } from './util.js';
import createLabel from '../createLabel.js';
import intersect from '../intersect/index.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import { getConfig } from '../../../diagram-api/diagramAPI.js';
import { createRoundedRectPathD } from './roundedRectPath.js';
import { log } from '../../../logger.js';
import type { D3Selection } from '../../../types.js';

export async function rectWithTitle<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  let classes;
  if (!node.cssClasses) {
    classes = 'node default';
  } else {
    classes = 'node ' + node.cssClasses;
  }

  // Add outer g element
  const shapeSvg = parent
    // @ts-ignore - d3 typings are not correct
    .insert('g')
    .attr('class', classes)
    .attr('id', node.domId || node.id);

  // Create the title label and insert it after the rect
  const g = shapeSvg.insert('g');

  const label = shapeSvg.insert('g').attr('class', 'label').attr('style', nodeStyles);

  const description = node.description;

  const title = node.label;

  const text = label.node()!.appendChild(await createLabel(title, node.labelStyle, true, true));
  let bbox = { width: 0, height: 0 };
  if (evaluate(getConfig()?.flowchart?.htmlLabels)) {
    const div = text.children[0];
    const dv = select(text);
    bbox = div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  }
  log.info('Text 2', description);
  const textRows = description || [];
  const titleBox = text.getBBox();
  const descr = label
    .node()!
    .appendChild(
      await createLabel(
        textRows.join ? textRows.join('<br/>') : textRows,
        node.labelStyle,
        true,
        true
      )
    );

  //if (evaluate(getConfig()?.flowchart?.htmlLabels)) {
  const div = descr.children[0];
  const dv = select(descr);
  bbox = div.getBoundingClientRect();
  dv.attr('width', bbox.width);
  dv.attr('height', bbox.height);
  // }

  const halfPadding = (node.padding || 0) / 2;
  select(descr).attr(
    'transform',
    'translate( ' +
      (bbox.width > titleBox.width ? 0 : (titleBox.width - bbox.width) / 2) +
      ', ' +
      (titleBox.height + halfPadding + 5) +
      ')'
  );
  select(text).attr(
    'transform',
    'translate( ' +
      (bbox.width < titleBox.width ? 0 : -(titleBox.width - bbox.width) / 2) +
      ', ' +
      0 +
      ')'
  );
  // Get the size of the label

  // Bounding box for title and text
  bbox = label.node()!.getBBox();

  // Center the label
  label.attr(
    'transform',
    'translate(' + -bbox.width / 2 + ', ' + (-bbox.height / 2 - halfPadding + 3) + ')'
  );

  const totalWidth = bbox.width + (node.padding || 0);
  const totalHeight = bbox.height + (node.padding || 0);
  const x = -bbox.width / 2 - halfPadding;
  const y = -bbox.height / 2 - halfPadding;
  let rect;
  let innerLine;
  if (node.look === 'handDrawn') {
    // @ts-ignore No typings for rough
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});
    const roughNode = rc.path(
      createRoundedRectPathD(x, y, totalWidth, totalHeight, node.rx || 0),
      options
    );

    const roughLine = rc.line(
      -bbox.width / 2 - halfPadding,
      -bbox.height / 2 - halfPadding + titleBox.height + halfPadding,
      bbox.width / 2 + halfPadding,
      -bbox.height / 2 - halfPadding + titleBox.height + halfPadding,
      options
    );

    innerLine = shapeSvg.insert(() => {
      log.debug('Rough node insert CXC', roughNode);
      return roughLine;
    }, ':first-child');
    rect = shapeSvg.insert(() => {
      log.debug('Rough node insert CXC', roughNode);
      return roughNode;
    }, ':first-child');
  } else {
    rect = g.insert('rect', ':first-child');
    innerLine = g.insert('line');
    rect
      .attr('class', 'outer title-state')
      .attr('style', nodeStyles)
      .attr('x', -bbox.width / 2 - halfPadding)
      .attr('y', -bbox.height / 2 - halfPadding)
      .attr('width', bbox.width + (node.padding || 0))
      .attr('height', bbox.height + (node.padding || 0));

    innerLine
      .attr('class', 'divider')
      .attr('x1', -bbox.width / 2 - halfPadding)
      .attr('x2', bbox.width / 2 + halfPadding)
      .attr('y1', -bbox.height / 2 - halfPadding + titleBox.height + halfPadding)
      .attr('y2', -bbox.height / 2 - halfPadding + titleBox.height + halfPadding);
  }
  updateNodeBounds(node, rect);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
}
