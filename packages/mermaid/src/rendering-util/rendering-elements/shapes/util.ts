import {
  createText,
  escapeAttr,
  finalizeDeferredHtmlLabel,
  htmlLabelMarkup,
  registerDeferredHtmlLabel,
} from '../../createText.js';
import type { Node } from '../../types.js';
import { getConfig } from '../../../diagram-api/diagramAPI.js';
import { evaluate, getEffectiveHtmlLabels } from '../../../config.js';
import { select } from 'd3';
import { sanitizeText } from '../../../diagrams/common/common.js';
import { decodeEntities, handleUndefinedAttr } from '../../../utils.js';
import type { D3Selection, Point } from '../../../types.js';
import { configureLabelImages } from './labelImageUtils.js';
import { profiler } from '../../../profiler.js';

type CreatedText = Awaited<ReturnType<typeof createText>>;

/** A node label built but not yet measured (see {@link buildNodeLabel}). */
interface NodeLabelBuild {
  shapeSvg: D3Selection<SVGGElement>;
  labelEl: D3Selection<SVGGElement>;
  text: CreatedText;
  useHtmlLabels: boolean;
  halfPadding: number;
}

/** The measured, positioned label that {@link labelHelper} returns to shapes. */
export interface NodeLabel {
  shapeSvg: D3Selection<SVGGElement>;
  bbox: DOMRect;
  halfPadding: number;
  label: D3Selection<SVGGElement>;
}

// Labels built and measured ahead of time by prebuildNodeLabels, keyed by node
// identity. labelHelper returns these instead of building+measuring inline;
// clearPrebuiltLabels removes any that were never consumed.
const prebuiltLabels = new Map<Node, NodeLabel>();

/**
 * Build a node's label DOM (the outer `g`, the label `g`, and the text/foreign
 * object) without measuring it. With `deferMeasure`, the HTML path also skips its
 * internal `getBoundingClientRect`, so a caller can build many labels before
 * reading any size — see {@link prebuildNodeLabels}.
 */
async function buildNodeLabel<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node,
  _classes: string | undefined,
  deferMeasure: boolean
): Promise<NodeLabelBuild> {
  const useHtmlLabels = node.useHtmlLabels || evaluate(getConfig()?.htmlLabels);
  const cssClasses = _classes ?? 'node default';

  // Add outer g element
  const shapeSvg = parent
    .insert('g')
    .attr('class', cssClasses)
    .attr('id', node.domId || node.id) as unknown as D3Selection<SVGGElement>;

  // Create the label and insert it after the rect
  const labelEl = shapeSvg
    .insert('g')
    .attr('class', 'label')
    .attr('style', handleUndefinedAttr(node.labelStyle)) as unknown as D3Selection<SVGGElement>;

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
      deferMeasure,
    },
    getConfig()
  );

  // HTML labels may contain images we must wait for before measuring. This is a
  // build-time concern (not a layout read), so it stays out of the measure pass.
  if (useHtmlLabels) {
    await configureLabelImages(text.children[0] as HTMLDivElement);
  }

  return { shapeSvg, labelEl, text, useHtmlLabels, halfPadding: (node?.padding ?? 0) / 2 };
}

/**
 * Read a built label's size. This is the only forced-reflow step; keeping it
 * separate from {@link buildNodeLabel} and {@link finalizeNodeLabel} lets a batch
 * run all reads back-to-back so only the first forces a layout.
 *
 * For HTML labels the size is the inner div's bounding client rect; `text` is the
 * oversized foreignObject, so its `getBBox()` would be discarded — only the SVG
 * `<text>` path measures `getBBox`.
 */
function measureNodeLabel(build: NodeLabelBuild): DOMRect {
  const { text, useHtmlLabels } = build;
  if (useHtmlLabels) {
    // Apply the width fix for labels that deferred it (no-op for inline ones).
    finalizeDeferredHtmlLabel(text as unknown as SVGForeignObjectElement);
    const div = text.children[0] as HTMLDivElement;
    return injected.profiling && profiler.tickSync
      ? profiler.tickSync('getBoundingClientRect', () => div.getBoundingClientRect())
      : div.getBoundingClientRect();
  }
  return injected.profiling && profiler.tickSync
    ? profiler.tickSync('getBBox', () => text.getBBox())
    : text.getBBox();
}

/** Write the measured size back and position the label. Pure DOM writes. */
function finalizeNodeLabel(build: NodeLabelBuild, bbox: DOMRect, node: Node): NodeLabel {
  const { shapeSvg, labelEl, text, useHtmlLabels, halfPadding } = build;
  if (useHtmlLabels) {
    const dv = select(text);
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
    labelEl.attr('transform', 'translate(' + -bbox.width / 2 + ', ' + -bbox.height / 2 + ')');
  } else {
    labelEl.attr('transform', 'translate(' + 0 + ', ' + -bbox.height / 2 + ')');
  }
  if (node.centerLabel) {
    labelEl.attr('transform', 'translate(' + -bbox.width / 2 + ', ' + -bbox.height / 2 + ')');
  }
  labelEl.insert('rect', ':first-child');
  return { shapeSvg, bbox, halfPadding, label: labelEl };
}

export const labelHelper = async <T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node,
  _classes?: string
): Promise<NodeLabel> => {
  // Fast path: a label already built and measured by prebuildNodeLabels into the
  // same parent. Re-apply the caller's classes, since the prebuild used the node's
  // default classes.
  const prebuilt = prebuiltLabels.get(node);
  if (prebuilt) {
    prebuiltLabels.delete(node);
    prebuilt.shapeSvg.attr('class', _classes ?? 'node default');
    return prebuilt;
  }

  const build = await buildNodeLabel(parent, node, _classes, false);
  const bbox = measureNodeLabel(build);
  return finalizeNodeLabel(build, bbox, node);
};

/**
 * Build and measure many node labels in two phases — build all (DOM writes), then
 * read all sizes (one forced reflow) — instead of interleaving build+measure per
 * node, which forces a reflow over the growing tree for every label and dominates
 * the measure phase on large diagrams. Results are cached and returned by the
 * matching {@link labelHelper} call.
 *
 * Only pass nodes rendered directly into `parent`; skip groups and linked nodes
 * (labelHelper builds those under their own wrapper). Anything not prebuilt simply
 * falls back to inline build+measure, so this is purely an optimization. Call
 * {@link clearPrebuiltLabels} afterwards to drop any entries never consumed.
 */
export async function prebuildNodeLabels<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  nodes: Node[]
): Promise<void> {
  // Phase 1 — build every label (deferred measurement: writes only). When every
  // label is HTML and the environment can parse batched SVG markup, build them all
  // with one insertAdjacentHTML (the browser parser is ~2x cheaper than building
  // each foreignObject/div/span via the DOM API); otherwise build each one
  // individually. Both paths run sequentially, so the `labelBuild` bucket is exact.
  const phase1 = async () => {
    if (nodes.length > 0 && canBatchSvgHtml() && nodes.every(nodeUsesHtmlLabels)) {
      const batched = await buildNodeLabelsBatched(parent, nodes);
      if (batched) {
        return batched;
      }
    }
    return buildNodeLabelsIndividually(parent, nodes);
  };
  const builds =
    injected.profiling && profiler.tick
      ? await profiler.tick('labelBuild', phase1)
      : await phase1();

  // Phase 2 — read every size (reads run back-to-back: one reflow), then finalize.
  const measured = builds.map((b) => ({ ...b, bbox: measureNodeLabel(b.build) }));
  for (const { node, build, bbox } of measured) {
    prebuiltLabels.set(node, finalizeNodeLabel(build, bbox, node));
  }
}

/** Whether a node renders an HTML (foreignObject) label — matches buildNodeLabel. */
function nodeUsesHtmlLabels(node: Node): boolean {
  return Boolean(node.useHtmlLabels || evaluate(getConfig()?.htmlLabels));
}

let svgHtmlBatchSupport: boolean | undefined;

/**
 * One-time probe: can this environment parse batched SVG markup containing an xhtml
 * foreignObject body via insertAdjacentHTML, with correct namespaces? True in
 * modern browsers; may be false in headless/jsdom, where we fall back to
 * per-element construction so correctness never depends on the parser.
 */
function canBatchSvgHtml(): boolean {
  if (svgHtmlBatchSupport !== undefined) {
    return svgHtmlBatchSupport;
  }
  svgHtmlBatchSupport = false;
  try {
    if (typeof document !== 'undefined') {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.insertAdjacentHTML(
        'beforeend',
        '<foreignObject><div xmlns="http://www.w3.org/1999/xhtml"></div></foreignObject>'
      );
      const div = g.querySelector('div');
      svgHtmlBatchSupport =
        !!div &&
        div.namespaceURI === 'http://www.w3.org/1999/xhtml' &&
        g.firstElementChild?.namespaceURI === 'http://www.w3.org/2000/svg';
    }
  } catch {
    svgHtmlBatchSupport = false;
  }
  return svgHtmlBatchSupport;
}

/** Per-node build path (one foreignObject/div/span at a time via the DOM API). */
async function buildNodeLabelsIndividually<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  nodes: Node[]
): Promise<{ node: Node; build: NodeLabelBuild }[]> {
  const builds: { node: Node; build: NodeLabelBuild }[] = [];
  for (const node of nodes) {
    builds.push({ node, build: await buildNodeLabel(parent, node, getNodeClasses(node), true) });
  }
  return builds;
}

/**
 * Batched build path: assemble the markup for every (HTML) label into one string
 * and parse it with a single insertAdjacentHTML, then re-select the elements.
 * Returns null (after cleaning up) if the parse didn't yield the expected
 * structure, so the caller can fall back to per-element construction.
 */
async function buildNodeLabelsBatched<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  nodes: Node[]
): Promise<{ node: Node; build: NodeLabelBuild }[] | null> {
  const parentEl = parent.node();
  if (!parentEl) {
    return null;
  }
  const config = getConfig();
  const defaultWidth = config.flowchart?.wrappingWidth ?? 200;

  const widths: number[] = [];
  const parts: string[] = [];
  for (const node of nodes) {
    const rawLabel =
      node.label === undefined ? '' : typeof node.label === 'string' ? node.label : node.label[0];
    const isMarkdown = node.labelType === 'markdown';
    const width = node.width || defaultWidth;
    widths.push(width);
    const fo = await htmlLabelMarkup(sanitizeText(decodeEntities(rawLabel), config), {
      markdown: isMarkdown,
      isNode: true,
      classes: isMarkdown ? 'markdown-node-label' : '',
      style: node.labelStyle,
      width,
      addSvgBackground: !!node.icon || !!node.img,
    });
    parts.push(
      `<g class="${escapeAttr(getNodeClasses(node))}" id="${escapeAttr(node.domId || node.id)}">` +
        `<g class="label" style="${escapeAttr(node.labelStyle ?? '')}">` +
        fo +
        `</g></g>`
    );
  }

  const before = parentEl.childElementCount;
  parentEl.insertAdjacentHTML('beforeend', parts.join(''));
  const groups = [...parentEl.children].slice(before);

  const builds: { node: Node; build: NodeLabelBuild }[] = [];
  if (groups.length === nodes.length) {
    for (const [i, node] of nodes.entries()) {
      const shapeSvg = groups[i] as SVGGElement;
      const labelEl = shapeSvg.firstElementChild as SVGGElement | null;
      const fo = labelEl?.firstElementChild as SVGForeignObjectElement | null;
      const div = fo?.firstElementChild as HTMLDivElement | null;
      if (!labelEl || !fo || !div) {
        builds.length = 0;
        break;
      }
      registerDeferredHtmlLabel(fo, div, widths[i]);
      builds.push({
        node,
        build: {
          shapeSvg: select(shapeSvg) as unknown as D3Selection<SVGGElement>,
          labelEl: select(labelEl) as unknown as D3Selection<SVGGElement>,
          text: fo as unknown as CreatedText,
          useHtmlLabels: true,
          halfPadding: (node?.padding ?? 0) / 2,
        },
      });
    }
  }
  if (builds.length !== nodes.length) {
    groups.forEach((g) => g.remove());
    return null;
  }
  return builds;
}

/**
 * Remove prebuilt labels that were never consumed by a labelHelper call. Pass the
 * exact nodes a {@link prebuildNodeLabels} call produced to clear only those — this
 * keeps nested, concurrent renders (e.g. dagre subgraphs) from clearing each
 * other's pending entries. With no argument, clears everything (safe for a single
 * flat pass).
 */
export function clearPrebuiltLabels(nodes?: Node[]): void {
  const targets = nodes ?? [...prebuiltLabels.keys()];
  for (const node of targets) {
    const cached = prebuiltLabels.get(node);
    if (cached) {
      cached.shapeSvg.remove();
      prebuiltLabels.delete(node);
    }
  }
}
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
