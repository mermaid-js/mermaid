import { getNodeClasses } from './util.js';
import { getConfig } from '$root/diagram-api/diagramAPI.js';
import { createText } from '../../createText.js';
import { select } from 'd3';
import type { Node } from '$root/rendering-util/types.d.ts';
import { evaluate } from '$root/diagrams/common/common.js';
import { calculateTextDimensions, calculateTextWidth } from '$root/utils.js';
import { styles2String } from '$root/rendering-util/rendering-elements/shapes/handDrawnShapeStyles.js';

export const classBox = async (parent: SVGAElement, node: Node): Promise<SVGAElement> => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const mainGroup = parent
    .insert('g')
    .attr('class', getNodeClasses(node))
    .attr('style', nodeStyles)
    .attr('id', node.domId || node.id);
  let labelGroup = null;
  let membersGroup = null;
  let methodsGroup = null;

  let labelGroupHeight = 0;
  let membersGroupHeight = 0;

  const config = getConfig();

  const PADDING = config.class.padding;
  const GAP = PADDING;

  if (node.label) {
    labelGroup = mainGroup.insert('g').attr('class', 'label-group');
    // TODO: Add Padding
    await helper(labelGroup, node, 0);
    const labelGroupBBox = labelGroup.node().getBBox();
    labelGroupHeight = labelGroupBBox.height;
  }

  if (node.members) {
    membersGroup = mainGroup.insert('g').attr('class', 'members-group');
    let yOffset = 0;
    for (const member of node.members) {
      await helper(membersGroup, member, yOffset);
      yOffset += calculateTextDimensions(member.text, config).height;
    }
    membersGroupHeight = membersGroup.node().getBBox().height;
    membersGroup.attr('transform', `translate(0, ${labelGroupHeight + GAP * 3})`);
  }

  if (node.methods) {
    methodsGroup = mainGroup.insert('g').attr('class', 'methods-group');
    let methodsYOffset = 0;
    for (const method of node.methods) {
      await helper(methodsGroup, method, methodsYOffset);
      methodsYOffset += calculateTextDimensions(method.text, config).height;
    }
    // TODO: Update transform
    methodsGroup.attr(
      'transform',
      `translate(0, ${labelGroupHeight + (membersGroupHeight ? membersGroupHeight + GAP * 5 : GAP * 3)})`
    );
  }

  const mainGroupBBox = mainGroup.node().getBBox();
  const labelGroupBBox = labelGroup.node().getBBox();
  // Center label
  labelGroup.attr(
    'transform',
    `translate(${mainGroupBBox.width / 2 - labelGroupBBox.width / 2}, 0)`
  );

  // Insert the rectangle around the main group
  mainGroup
    .insert('rect', ':first-child')
    .attr('class', 'basic label-container')
    .attr('style', nodeStyles)
    .attr('data-id', 'abc')
    .attr('data-et', 'node')
    .attr('x', mainGroupBBox.x - PADDING)
    .attr('y', mainGroupBBox.y - PADDING)
    .attr('width', mainGroupBBox.width + 2 * PADDING)
    .attr('height', mainGroupBBox.height + 2 * PADDING);

  // Render separating lines.
  if (node.label) {
    mainGroup
      .insert('line')
      .attr('x1', 0 - PADDING)
      .attr('y1', labelGroupHeight - GAP)
      .attr('x2', mainGroupBBox.width + PADDING)
      .attr('y2', labelGroupHeight - GAP)
      .attr('class', 'divider');
  }

  if (node.members.length > 0 && node.methods.length > 0) {
    mainGroup
      .insert('line')
      .attr('x1', 0 - PADDING)
      .attr('y1', labelGroupHeight + membersGroupHeight + GAP * 2)
      .attr('x2', mainGroupBBox.width + PADDING)
      .attr('y2', labelGroupHeight + membersGroupHeight + GAP * 2)
      .attr('class', 'divider');
  }

  return mainGroup;
};

const helper = async (parentGroup, node, yOffset) => {
  const textEl = parentGroup.insert('g').attr('class', 'label').attr('style', node.labelStyle);
  const textContent = node.text;
  const config = getConfig();
  const text = await createText(
    textEl,
    textContent,
    {
      width: calculateTextWidth(textContent, config),
      classes: 'markdown-node-label',
      style: node.labelStyle,
      useHtmlLabels: true,
    },
    config
  );

  let bbox = text.getBBox();

  if (evaluate(config.flowchart.htmlLabels)) {
    const div = text.children[0];
    const dv = select(text);

    bbox = div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  }

  textEl.attr('transform', 'translate(' + 0 + ', ' + (-bbox.height / 2 + yOffset) + ')');
  if (node.centerLabel) {
    textEl.attr('transform', 'translate(' + -bbox.width / 2 + ', ' + -bbox.height / 2 + ')');
  }
};
