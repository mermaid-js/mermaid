import { createText } from '../../createText.js';
import type { Node } from '../../types.js';
import { getConfig } from '../../../diagram-api/diagramAPI.js';
import { evaluate, getEffectiveHtmlLabels } from '../../../config.js';
import { select } from 'd3';
import { sanitizeText } from '../../../diagrams/common/common.js';
import { decodeEntities, handleUndefinedAttr } from '../../../utils.js';
import type { D3Selection, Point } from '../../../types.js';
import { configureLabelImages } from './labelImageUtils.js';
import { profiler } from '../../../profiler.js';

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

  const addBackground = !!node.icon || !!node.img;
  const isMarkdown = node.labelType === 'markdown';
  const text = await createText(
    labelEl,
    sanitizeText(decodeEntities(label), getConfig()),
    {
      useHtmlLabels,
      width: node.width || getConfig().flowchart?.wrappingWidth,
      classes: isMarkdown ? 'markdown-node-label' : '',
      style: node.labelStyle,
      addSvgBackground: addBackground,
      markdown: isMarkdown,
    },
    getConfig()
  );

  // Get the size of the label.
  // For HTML labels the real size comes from the inner div's bounding client rect
  // (below); `text` is the oversized foreignObject, so its getBBox() would be
  // discarded. Only measure the SVG <text> path here — skipping the dead read
  // avoids a forced reflow per node, a significant cost on large diagrams.
  // (The `&& profiler.tickSync` guards on the reads below tolerate an older shared
  // profiler instance that predates `tickSync`; in production the whole
  // `injected.profiling` ternary folds away to a direct read.)
  const halfPadding = (node?.padding ?? 0) / 2;
  let bbox: DOMRect;

  if (useHtmlLabels) {
    const div = text.children[0] as HTMLDivElement;
    const dv = select(text);

    // if there are images, need to wait for them to load before getting the bounding box
    await configureLabelImages(div);

    bbox =
      injected.profiling && profiler.tickSync
        ? profiler.tickSync('getBoundingClientRect', () => div.getBoundingClientRect())
        : div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  } else {
    bbox =
      injected.profiling && profiler.tickSync
        ? profiler.tickSync('getBBox', () => text.getBBox())
        : text.getBBox();
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
  const useHtmlLabels = options.useHtmlLabels ?? getEffectiveHtmlLabels(getConfig());

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
  // Get the size of the label. For HTML labels the real size comes from the inner
  // div's bounding client rect; the SVG <text> getBBox() would be discarded, so
  // only measure it on the non-HTML path (avoids a dead forced reflow per node).
  const halfPadding = options.padding / 2;
  let bbox: DOMRect;

  if (getEffectiveHtmlLabels(getConfig())) {
    const div = text.children[0];
    const dv = select(text);

    bbox =
      injected.profiling && profiler.tickSync
        ? profiler.tickSync('getBoundingClientRect', () => div.getBoundingClientRect())
        : div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  } else {
    bbox =
      injected.profiling && profiler.tickSync
        ? profiler.tickSync('getBBox', () => text.getBBox())
        : text.getBBox();
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
  element: D3Selection<SVGGElement> | D3Selection<T>,
  /**
   * Pre-computed geometry the caller already knows (e.g. an axis-aligned rect
   * sized analytically from the label). When supplied, we skip `getBBox()` —
   * reading it forces a synchronous reflow over the growing node tree, which is
   * the dominant cost of the measure phase on large diagrams. Only pass this when
   * the value is exactly equal to what `element.getBBox()` would return (so it is
   * safe for plain rects, but not for hand-drawn/roughjs paths that overflow
   * their nominal box).
   */
  knownBounds?: { width: number; height: number }
) => {
  if (knownBounds) {
    node.width = knownBounds.width;
    node.height = knownBounds.height;
    return;
  }
  const bbox =
    injected.profiling && profiler.tickSync
      ? profiler.tickSync('getBBox', () => element.node()!.getBBox())
      : element.node()!.getBBox();
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

export function mergePaths(roughElement: SVGElement) {
  // Get all paths generated by RoughJS
  // eslint-disable-next-line unicorn/prefer-spread
  const paths: SVGPathElement[] = Array.from(roughElement.childNodes).filter(
    (node): node is SVGPathElement => (node as Element).tagName === 'path'
  );

  // Create a new path element
  const mergedPath: SVGPathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');

  // Combine all path data
  const combinedPathData: string = paths
    .map((path) => path.getAttribute('d'))
    .filter((d): d is string => d !== null)
    .join(' ');

  mergedPath.setAttribute('d', combinedPathData);

  // Find the fill path (usually the second path)
  const fillPath = paths.find((path) => path.getAttribute('fill') !== 'none');

  // Find the stroke path (usually the first path)
  const strokePath = paths.find((path) => path.getAttribute('stroke') !== 'none');

  // Helper function to safely get attribute
  const getAttr = (element: SVGPathElement | undefined, attr: string): string | undefined => {
    return element?.getAttribute(attr) ?? undefined;
  };

  // Apply the correct styles from respective paths
  if (fillPath) {
    const fillAttrs = {
      fill: getAttr(fillPath, 'fill'),
      'fill-opacity': getAttr(fillPath, 'fill-opacity') ?? '1',
    };

    Object.entries(fillAttrs).forEach(([attr, value]) => {
      if (value) {
        mergedPath.setAttribute(attr, value);
      }
    });
  }

  if (strokePath) {
    const strokeAttrs = {
      stroke: getAttr(strokePath, 'stroke'),
      'stroke-width': getAttr(strokePath, 'stroke-width') ?? '1',
      'stroke-opacity': getAttr(strokePath, 'stroke-opacity') ?? '1',
    };

    Object.entries(strokeAttrs).forEach(([attr, value]) => {
      if (value) {
        mergedPath.setAttribute(attr, value);
      }
    });
  }

  // Create a group to hold our merged path
  const group: SVGGElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.appendChild(mergedPath);

  return group;
}
