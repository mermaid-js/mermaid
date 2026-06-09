import createLabel from '../createLabel.js';
import { createText } from '../../rendering-util/createText.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import { getEffectiveHtmlLabels } from '../../config.js';
import { select } from 'd3';
import { sanitizeText } from '../../diagrams/common/common.js';
import { decodeEntities } from '../../utils.js';
import { configureLabelImages } from '../../rendering-util/rendering-elements/shapes/labelImageUtils.js';
import type { D3Selection, Point } from '../../types.js';
import type { Node } from '../nodes.js';

export const labelHelper = async <T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node,
  _classes?: string,
  isNode?: boolean
) => {
  const config = getConfig();
  let classes;
  const useHtmlLabels = node.useHtmlLabels || getEffectiveHtmlLabels(config);
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

  let text: SVGGraphicsElement;
  if (node.labelType === 'markdown') {
    // text = textNode;
    // TODO: createText returns a `Promise`, but the original (pre-TypeScript)
    // code never awaited it; the cast preserves that behavior.
    text = createText(
      label,
      sanitizeText(decodeEntities(labelText), config),
      {
        useHtmlLabels,
        width: node.width || config.flowchart!.wrappingWidth,
        classes: 'markdown-node-label',
      },
      config
    ) as unknown as SVGGraphicsElement;
  } else {
    text = await createLabel(
      label,
      sanitizeText(decodeEntities(labelText), config),
      node.labelStyle,
      false,
      isNode
    );
  }
  // Get the size of the label
  let bbox = text.getBBox();
  const halfPadding = node.padding / 2;

  if (getEffectiveHtmlLabels(config)) {
    const div = text.children[0] as HTMLElement;
    const dv = select(text);

    // if there are images, need to wait for them to load before getting the bounding box
    await configureLabelImages(div);

    bbox = div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  }

  // Center the label
  if (useHtmlLabels) {
    label.attr('transform', 'translate(' + -bbox.width / 2 + ', ' + -bbox.height / 2 + ')');
  } else {
    label.attr('transform', 'translate(' + 0 + ', ' + -bbox.height / 2 + ')');
  }
  if (node.centerLabel) {
    label.attr('transform', 'translate(' + -bbox.width / 2 + ', ' + -bbox.height / 2 + ')');
  }
  label.insert('rect', ':first-child');

  return { shapeSvg, bbox, halfPadding, label };
};

export const updateNodeBounds = <T extends SVGGraphicsElement>(
  node: Node,
  element: D3Selection<T>
) => {
  const bbox = element.node()!.getBBox();
  node.width = bbox.width;
  node.height = bbox.height;
};

export function insertPolygonShape(
  parent: D3Selection<SVGGElement>,
  w: number,
  h: number,
  points: Point[]
) {
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
