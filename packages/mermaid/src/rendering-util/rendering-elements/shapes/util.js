import { createText } from 'mermaid/dist/rendering-util/createText.ts';
import { getConfig } from 'mermaid/dist/diagram-api/diagramAPI.js';
import { select } from 'd3';
import { evaluate, sanitizeText } from 'mermaid/dist/diagrams/common/common.js';
import { decodeEntities } from 'mermaid/dist/utils.js';

export const labelHelper = async (parent, node, _classes) => {
  let cssClasses;
  const useHtmlLabels = node.useHtmlLabels || evaluate(getConfig().flowchart.htmlLabels);
  if (!_classes) {
    cssClasses = 'node default';
  } else {
    cssClasses = _classes;
  }

  // Add outer g element
  const shapeSvg = parent
    .insert('g')
    .attr('class', cssClasses)
    .attr('id', node.domId || node.id);

  // Create the label and insert it after the rect
  const labelEl = shapeSvg.insert('g').attr('class', 'label').attr('style', node.labelStyle);

  // Replace label with default value if undefined
  let label;
  if (node.label === undefined) {
    label = '';
  } else {
    label = typeof node.label === 'string' ? node.label : node.label[0];
  }

  let text;
  text = await createText(labelEl, sanitizeText(decodeEntities(label), getConfig()), {
    useHtmlLabels,
    width: node.width || getConfig().flowchart.wrappingWidth,
    cssClasses: 'markdown-node-label',
    style: node.labelStyle,
  });
  // Get the size of the label
  let bbox = text.getBBox();
  const halfPadding = node.padding / 2;

  if (evaluate(getConfig().flowchart.htmlLabels)) {
    const div = text.children[0];
    const dv = select(text);

    // if there are images, need to wait for them to load before getting the bounding box
    const images = div.getElementsByTagName('img');
    if (images) {
      const noImgText = label.replace(/<img[^>]*>/g, '').trim() === '';

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
                  const bodyFontSize = getConfig().fontSize
                    ? getConfig().fontSize
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
    labelEl.attr('transform', 'translate(' + -bbox.width / 2 + ', ' + -bbox.height / 2 + ')');
  } else {
    labelEl.attr('transform', 'translate(' + 0 + ', ' + -bbox.height / 2 + ')');
  }
  if (node.centerLabel) {
    labelEl.attr('transform', 'translate(' + -bbox.width / 2 + ', ' + -bbox.height / 2 + ')');
  }
  labelEl.insert('rect', ':first-child');
  return { shapeSvg, bbox, halfPadding, label: labelEl };
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

export const getNodeClasses = (node, extra) =>
  (node.look === 'handDrawn' ? 'rough-node' : 'node') + ' ' + node.cssClasses + ' ' + (extra || '');
