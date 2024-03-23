import createLabel from '../createLabel.js';
import { createText } from '../../rendering-util/createText.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import { select } from 'd3';
import { evaluate, sanitizeText } from '../../diagrams/common/common.js';
import { decodeEntities } from '../../utils.js';

export const labelHelper = async (parent, node, _classes, isNode) => {
  const config = getConfig();
  let classes;
  const useHtmlLabels = node.useHtmlLabels || evaluate(config.flowchart.htmlLabels);
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

  const textNode = label.node();
  let text;
  if (node.labelType === 'markdown') {
    // text = textNode;
    text = createText(
      label,
      sanitizeText(decodeEntities(labelText), config),
      {
        useHtmlLabels,
        width: node.width || config.flowchart.wrappingWidth,
        classes: 'markdown-node-label',
      },
      config
    );
  } else {
    text = textNode.appendChild(
      createLabel(sanitizeText(decodeEntities(labelText), config), node.labelStyle, false, isNode)
    );
  }
  // Get the size of the label
  let bbox = text.getBBox();
  const halfPadding = node.padding / 2;

  if (evaluate(config.flowchart.htmlLabels)) {
    const div = text.children[0];
    const dv = select(text);

    // if there are images, need to wait for them to load before getting the bounding box
    const images = div.getElementsByTagName('img');
    if (images) {
      const noImgText = labelText.replace(/<img[^>]*>/g, '').trim() === '';

      await Promise.all(
        [...images].map(
          (img) =>
            new Promise((res) => {
              /**
               *
               */
              function setupImage() {
                img.style.display = 'flex';
                img.style.flexDirection = 'column';

                if (noImgText) {
                  // default size if no text
                  const bodyFontSize = config.fontSize
                    ? config.fontSize
                    : window.getComputedStyle(document.body).fontSize;
                  const enlargingFactor = 5;
                  const width = parseInt(bodyFontSize, 10) * enlargingFactor + 'px';
                  img.style.minWidth = width;
                  img.style.maxWidth = width;
                } else {
                  img.style.width = '100%';
                }
                res(img);
              }
              setTimeout(() => {
                if (img.complete) {
                  setupImage();
                }
              });
              img.addEventListener('error', setupImage);
              img.addEventListener('load', setupImage);
            })
        )
      );
    }

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
