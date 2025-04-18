import { createText } from '../../createText.js';
import type { Node } from '../../types.js';
import { getConfig } from '../../../diagram-api/diagramAPI.js';
import { select } from 'd3';
import defaultConfig from '../../../defaultConfig.js';
import { evaluate, sanitizeText } from '../../../diagrams/common/common.js';
import { decodeEntities, handleUndefinedAttr, parseFontSize } from '../../../utils.js';
import type { D3Selection, Point } from '../../../types.js';

export const labelHelper = async <T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node,
  _classes?: string
) => {
  let cssClasses;
  const useHtmlLabels = node.useHtmlLabels || evaluate(getConfig()?.htmlLabels);
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
  const labelEl = shapeSvg
    .insert('g')
    .attr('class', 'label')
    .attr('style', handleUndefinedAttr(node.labelStyle));

  // Replace label with default value if undefined
  let label;
  if (node.label === undefined) {
    label = '';
  } else {
    label = typeof node.label === 'string' ? node.label : node.label[0];
  }

  const text = await createText(labelEl, sanitizeText(decodeEntities(label), getConfig()), {
    useHtmlLabels,
    width: node.width || getConfig().flowchart?.wrappingWidth,
    // @ts-expect-error -- This is currently not used. Should this be `classes` instead?
    cssClasses: 'markdown-node-label',
    style: node.labelStyle,
    addSvgBackground: !!node.icon || !!node.img,
  });
  // Get the size of the label
  let bbox = text.getBBox();
  const halfPadding = (node?.padding ?? 0) / 2;

  if (useHtmlLabels) {
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
                  const [parsedBodyFontSize = defaultConfig.fontSize] = parseFontSize(bodyFontSize);
                  const width = parsedBodyFontSize * enlargingFactor + 'px';
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
export const insertLabel = async <T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  label: string,
  options: {
    labelStyle?: string | undefined;
    icon?: boolean | undefined;
    img?: string | undefined;
    useHtmlLabels?: boolean | undefined;
    padding: number;
    width?: number | undefined;
    centerLabel?: boolean | undefined;
    addSvgBackground?: boolean | undefined;
  }
) => {
  const useHtmlLabels = options.useHtmlLabels || evaluate(getConfig()?.flowchart?.htmlLabels);

  // Create the label and insert it after the rect
  const labelEl = parent
    .insert('g')
    .attr('class', 'label')
    .attr('style', options.labelStyle || '');

  const text = await createText(labelEl, sanitizeText(decodeEntities(label), getConfig()), {
    useHtmlLabels,
    width: options.width || getConfig()?.flowchart?.wrappingWidth,
    style: options.labelStyle,
    addSvgBackground: !!options.icon || !!options.img,
  });
  // Get the size of the label
  let bbox = text.getBBox();
  const halfPadding = options.padding / 2;

  if (evaluate(getConfig()?.flowchart?.htmlLabels)) {
    const div = text.children[0];
    const dv = select(text);

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
  if (options.centerLabel) {
    labelEl.attr('transform', 'translate(' + -bbox.width / 2 + ', ' + -bbox.height / 2 + ')');
  }
  labelEl.insert('rect', ':first-child');
  return { shapeSvg: parent, bbox, halfPadding, label: labelEl };
};
export const updateNodeBounds = <T extends SVGGraphicsElement>(
  node: Node,
  // D3Selection<SVGGElement> is for the roughjs case, D3Selection<T> is for the non-roughjs case
  element: D3Selection<SVGGElement> | D3Selection<T>
) => {
  const bbox = element.node()!.getBBox();
  node.width = bbox.width;
  node.height = bbox.height;
};

/**
 * @param parent - Parent element to append the polygon to
 * @param w - Width of the polygon
 * @param h - Height of the polygon
 * @param points - Array of points to create the polygon
 */
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

export const getNodeClasses = (node: Node, extra?: string) =>
  (node.look === 'handDrawn' ? 'rough-node' : 'node') + ' ' + node.cssClasses + ' ' + (extra || '');

export function createPathFromPoints(points: Point[]) {
  const pointStrings = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`);
  pointStrings.push('Z');
  return pointStrings.join(' ');
}

export function generateFullSineWavePoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  amplitude: number,
  numCycles: number
) {
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

/**
 * @param centerX - x-coordinate of center of circle
 * @param centerY - y-coordinate of center of circle
 * @param radius - radius of circle
 * @param numPoints - total points required
 * @param startAngle - angle where arc will start
 * @param endAngle - angle where arc will end
 */
export function generateCirclePoints(
  centerX: number,
  centerY: number,
  radius: number,
  numPoints: number,
  startAngle: number,
  endAngle: number
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
