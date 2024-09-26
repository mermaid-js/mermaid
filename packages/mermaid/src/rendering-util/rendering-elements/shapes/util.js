import { createText } from '../../createText.js';
import { getConfig } from '../../../diagram-api/diagramAPI.js';
import { select } from 'd3';
import { evaluate, sanitizeText } from '../../../diagrams/common/common.js';
import { decodeEntities } from '../../../utils.js';
import { log } from '../../../logger.js';

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
    addSvgBackground: !!node.icon || !!node.img,
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
  log.debug('updateNodeBounds: #####################################');
  log.debug('updateNodeBounds:', node.id, node.width, node.height);
  log.debug('updateNodeBounds: #####################################');
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

export function createPathFromPoints(points) {
  const pointStrings = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`);
  pointStrings.push('Z');
  return pointStrings.join(' ');
}

export function generateFullSineWavePoints(x1, y1, x2, y2, amplitude, numCycles) {
  const points = [];
  const steps = 50; // Number of segments to create a smooth curve
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  const cycleLength = deltaX / numCycles;

  // Calculate frequency and phase shift
  const frequency = (2 * Math.PI) / cycleLength;
  const midY = y1 + deltaY / 2;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x1 + t * deltaX;
    const y = midY + amplitude * Math.sin(frequency * (x - x1));

    points.push({ x, y });
  }

  return points;
}

export function generateCirclePoints(
  centerX, // x-coordinate of center of circle
  centerY, // x-coordinate of center of circle
  radius, // radius of circle
  numPoints, // total points required
  startAngle, //  angle where arc will start
  endAngle // angle where arc will end
) {
  const points = [];

  // Convert angles to radians
  const startAngleRad = (startAngle * Math.PI) / 180;
  const endAngleRad = (endAngle * Math.PI) / 180;

  // Calculate the angle range in radians
  const angleRange = endAngleRad - startAngleRad;

  // Calculate the angle step
  const angleStep = angleRange / (numPoints - 1);

  for (let i = 0; i < numPoints; i++) {
    const angle = startAngleRad + i * angleStep;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push({ x: -x, y: -y });
  }

  return points;
}
