import type { Selection } from 'd3';
import { arc as d3arc, select } from 'd3';
import type { MermaidConfig, TimelineDiagramConfig } from '../../config.type.js';
import type { SVG, SVGGroup } from '../../diagram-api/types.js';
import type { D3Selection } from '../../types.js';
import type {
  CircleData,
  FaceData,
  SectionData,
  TaskData,
  TextObject,
} from '../common/commonTypes.js';
import { requiredNode } from '../../utils/guards.js';
import type { TimelineTask } from './timelineDb.js';

let nodeCount = 0;

/**
 * Unlike the shared `RectData` in commonTypes, `fill` and `stroke` are
 * optional here: the timeline renderer draws rects without them (e.g.
 * background rects), so this shape cannot extend the common one compatibly.
 */
export interface TimelineRectData {
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  rx?: number;
  ry?: number;
  anchor?: string;
  class?: string;
}

export type TimelineFaceData = FaceData;

export type TimelineCircleData = CircleData;

/**
 * Unlike the shared `TextData` in commonTypes, `anchor` is optional here (the
 * timeline renderer draws texts without it), so this shape cannot extend the
 * common one compatibly.
 */
export interface TimelineTextData {
  x: number;
  y: number;
  text: string;
  textMargin: number;
  anchor?: string;
  class?: string;
}

export interface TimelineLabelData extends TimelineTextData {
  labelMargin: number;
}

export type TimelineSectionData = SectionData;

export type TimelineTaskData = TaskData;

/** The shared `TextObject` without the fields the timeline never sets. */
export type TimelineTextObject = Omit<TextObject, 'anchor' | 'style' | 'tspan' | 'valign'>;

/**
 * Unlike the shared `Bound` in commonTypes, `fill` is optional and `stroke`
 * is absent, so this shape cannot extend the common one compatibly.
 */
export interface TimelineBounds {
  startx: number;
  starty: number;
  stopx: number;
  stopy: number;
  fill?: string;
}

export interface TimelineNode {
  number: number | string;
  descr: string;
  section: number | string;
  width: number;
  padding: number;
  maxHeight: number;
  class?: string;
  type?: string;
  height?: number;
}

export type DrawnTimelineNode = TimelineNode & { height: number };

export interface TimelineMeasureNode {
  descr: string | TimelineTask;
  width: number;
  padding: number;
  number?: number | string;
  section?: number | string;
  maxHeight?: number;
}

type TextAttrs = Record<string, string>;

export const drawRect = function (elem: SVG | SVGGroup, rectData: TimelineRectData) {
  const rectElem = elem.append('rect');
  rectElem.attr('x', rectData.x);
  rectElem.attr('y', rectData.y);
  // `?? null` keeps d3's "remove the attribute" semantics for undefined values
  rectElem.attr('fill', rectData.fill ?? null);
  rectElem.attr('stroke', rectData.stroke ?? null);
  rectElem.attr('width', rectData.width);
  rectElem.attr('height', rectData.height);
  rectElem.attr('rx', rectData.rx ?? null);
  rectElem.attr('ry', rectData.ry ?? null);

  if (rectData.class !== undefined) {
    rectElem.attr('class', rectData.class);
  }

  return rectElem;
};

export const drawFace = function (element: SVG | SVGGroup, faceData: TimelineFaceData) {
  const radius = 15;
  const circleElement = element
    .append('circle')
    .attr('cx', faceData.cx)
    .attr('cy', faceData.cy)
    .attr('class', 'face')
    .attr('r', radius)
    .attr('stroke-width', 2)
    .attr('overflow', 'visible');

  const face = element.append('g');

  //left eye
  face
    .append('circle')
    .attr('cx', faceData.cx - radius / 3)
    .attr('cy', faceData.cy - radius / 3)
    .attr('r', 1.5)
    .attr('stroke-width', 2)
    .attr('fill', '#666')
    .attr('stroke', '#666');

  //right eye
  face
    .append('circle')
    .attr('cx', faceData.cx + radius / 3)
    .attr('cy', faceData.cy - radius / 3)
    .attr('r', 1.5)
    .attr('stroke-width', 2)
    .attr('fill', '#666')
    .attr('stroke', '#666');

  function smile(face: SVGGroup) {
    const arc = d3arc<unknown>()
      .startAngle(Math.PI / 2)
      .endAngle(3 * (Math.PI / 2))
      .innerRadius(radius / 2)
      .outerRadius(radius / 2.2);
    //mouth
    face
      .append('path')
      .attr('class', 'mouth')
      .attr('d', arc)
      .attr('transform', 'translate(' + faceData.cx + ',' + (faceData.cy + 2) + ')');
  }

  function sad(face: SVGGroup) {
    const arc = d3arc<unknown>()
      .startAngle((3 * Math.PI) / 2)
      .endAngle(5 * (Math.PI / 2))
      .innerRadius(radius / 2)
      .outerRadius(radius / 2.2);
    //mouth
    face
      .append('path')
      .attr('class', 'mouth')
      .attr('d', arc)
      .attr('transform', 'translate(' + faceData.cx + ',' + (faceData.cy + 7) + ')');
  }

  function ambivalent(face: SVGGroup) {
    face
      .append('line')
      .attr('class', 'mouth')
      .attr('stroke', 2)
      .attr('x1', faceData.cx - 5)
      .attr('y1', faceData.cy + 7)
      .attr('x2', faceData.cx + 5)
      .attr('y2', faceData.cy + 7)
      .attr('class', 'mouth')
      .attr('stroke-width', '1px')
      .attr('stroke', '#666');
  }

  if (faceData.score > 3) {
    smile(face);
  } else if (faceData.score < 3) {
    sad(face);
  } else {
    ambivalent(face);
  }

  return circleElement;
};

export const drawCircle = function (element: SVG | SVGGroup, circleData: TimelineCircleData) {
  const circleElement = element.append('circle');
  circleElement.attr('cx', circleData.cx);
  circleElement.attr('cy', circleData.cy);
  circleElement.attr('class', 'actor-' + circleData.pos);
  circleElement.attr('fill', circleData.fill);
  circleElement.attr('stroke', circleData.stroke);
  circleElement.attr('r', circleData.r);

  const circleClass = (circleElement as unknown as { class?: string }).class;
  if (circleClass !== undefined) {
    circleElement.attr('class', circleClass);
  }

  if (circleData.title !== undefined) {
    circleElement.append('title').text(circleData.title);
  }

  return circleElement;
};

export const drawText = function (elem: SVG | SVGGroup, textData: TimelineTextData) {
  // Remove and ignore br:s
  const nText = textData.text.replace(/<br\s*\/?>/gi, ' ');

  const textElem = elem.append('text');
  textElem.attr('x', textData.x);
  textElem.attr('y', textData.y);
  textElem.attr('class', 'legend');

  if (textData.anchor !== undefined) {
    textElem.style('text-anchor', textData.anchor);
  }

  if (textData.class !== undefined) {
    textElem.attr('class', textData.class);
  }

  const span = textElem.append('tspan');
  span.attr('x', textData.x + textData.textMargin * 2);
  span.text(nText);

  return textElem;
};

export const drawLabel = function (elem: SVG | SVGGroup, txtObject: TimelineLabelData) {
  function genPoints(x: number, y: number, width: number, height: number, cut: number) {
    return (
      x +
      ',' +
      y +
      ' ' +
      (x + width) +
      ',' +
      y +
      ' ' +
      (x + width) +
      ',' +
      (y + height - cut) +
      ' ' +
      (x + width - cut * 1.2) +
      ',' +
      (y + height) +
      ' ' +
      x +
      ',' +
      (y + height)
    );
  }
  const polygon = elem.append('polygon');
  polygon.attr('points', genPoints(txtObject.x, txtObject.y, 50, 20, 7));
  polygon.attr('class', 'labelBox');

  txtObject.y = txtObject.y + txtObject.labelMargin;
  txtObject.x = txtObject.x + 0.5 * txtObject.labelMargin;
  drawText(elem, txtObject);
};

export const drawSection = function (
  elem: SVG | SVGGroup,
  section: TimelineSectionData,
  conf: Required<TimelineDiagramConfig>
) {
  const g = elem.append('g');

  const rect = getNoteRect();
  rect.x = section.x;
  rect.y = section.y;
  rect.fill = section.fill;
  rect.width = conf.width;
  rect.height = conf.height;
  rect.class = 'journey-section section-type-' + section.num;
  rect.rx = 3;
  rect.ry = 3;
  drawRect(g, rect);

  _drawTextCandidateFunc(conf)(
    section.text,
    g,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    { class: 'journey-section section-type-' + section.num },
    conf,
    section.colour
  );
};

let taskCount = -1;
/**
 * Draws an actor in the diagram with the attached line
 *
 * @param elem - The HTML element
 * @param task - The task to render
 * @param conf - The global configuration
 * @param diagramId - The diagram's SVG element ID
 */
export const drawTask = function (
  elem: SVG | SVGGroup,
  task: TimelineTaskData,
  conf: Required<TimelineDiagramConfig>,
  diagramId: string
) {
  const center = task.x + conf.width / 2;
  const g = elem.append('g');
  taskCount++;
  const maxHeight = 300 + 5 * 30;
  g.append('line')
    .attr('id', diagramId + '-task' + taskCount)
    .attr('x1', center)
    .attr('y1', task.y)
    .attr('x2', center)
    .attr('y2', maxHeight)
    .attr('class', 'task-line')
    .attr('stroke-width', '1px')
    .attr('stroke-dasharray', '4 2')
    .attr('stroke', '#666');

  drawFace(g, {
    cx: center,
    cy: 300 + (5 - task.score) * 30,
    score: task.score,
  });

  const rect = getNoteRect();
  rect.x = task.x;
  rect.y = task.y;
  rect.fill = task.fill;
  rect.width = conf.width;
  rect.height = conf.height;
  rect.class = 'task task-type-' + task.num;
  rect.rx = 3;
  rect.ry = 3;
  drawRect(g, rect);

  _drawTextCandidateFunc(conf)(
    task.task,
    g,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    { class: 'task' },
    conf,
    task.colour
  );
};

/**
 * Draws a background rectangle
 *
 * @param elem - The html element
 * @param bounds - The bounds of the drawing
 */
export const drawBackgroundRect = function (elem: SVG | SVGGroup, bounds: TimelineBounds) {
  const rectElem = drawRect(elem, {
    x: bounds.startx,
    y: bounds.starty,
    width: bounds.stopx - bounds.startx,
    height: bounds.stopy - bounds.starty,
    fill: bounds.fill,
    class: 'rect',
  });
  rectElem.lower();
};

export const getTextObj = function (): TimelineTextObject {
  return {
    x: 0,
    y: 0,
    fill: undefined,
    'text-anchor': 'start',
    width: 100,
    height: 100,
    textMargin: 0,
    rx: 0,
    ry: 0,
  };
};

export const getNoteRect = function (): TimelineRectData {
  return {
    x: 0,
    y: 0,
    width: 100,
    anchor: 'start',
    height: 100,
    rx: 0,
    ry: 0,
  };
};

type DrawTextFn = (
  content: string,
  g: SVGGroup,
  x: number,
  y: number,
  width: number,
  height: number,
  textAttrs: TextAttrs,
  conf: Required<TimelineDiagramConfig>,
  colour: string
) => void;

const _drawTextCandidateFunc = (function () {
  function byText(
    content: string,
    g: SVGGroup,
    x: number,
    y: number,
    width: number,
    height: number,
    textAttrs: TextAttrs,
    colour: unknown
  ) {
    const text = g
      .append('text')
      .attr('x', x + width / 2)
      .attr('y', y + height / 2 + 5)
      .style('font-color', colour as string)
      .style('text-anchor', 'middle')
      .text(content);
    _setTextAttrs(text, textAttrs);
  }

  function byTspan<T extends SVGElement>(
    content: string,
    g: D3Selection<T>,
    x: number,
    y: number,
    width: number,
    height: number,
    textAttrs: TextAttrs,
    conf: Required<TimelineDiagramConfig>,
    colour?: string
  ) {
    const { taskFontSize, taskFontFamily } = conf;
    const fontSize = taskFontSize as number;

    const lines = content.split(/<br\s*\/?>/gi);
    for (let i = 0; i < lines.length; i++) {
      const dy = i * fontSize - (fontSize * (lines.length - 1)) / 2;
      const text = g
        .append('text')
        .attr('x', x + width / 2)
        .attr('y', y)
        .attr('fill', colour ?? null)
        .style('text-anchor', 'middle')
        .style('font-size', taskFontSize)
        .style('font-family', taskFontFamily);
      text
        .append('tspan')
        .attr('x', x + width / 2)
        .attr('dy', dy)
        .text(lines[i]);

      text
        .attr('y', y + height / 2.0)
        .attr('dominant-baseline', 'central')
        .attr('alignment-baseline', 'central');

      _setTextAttrs(text, textAttrs);
    }
  }

  function byFo(
    content: string,
    g: SVGGroup,
    x: number,
    y: number,
    width: number,
    height: number,
    textAttrs: TextAttrs,
    conf: Required<TimelineDiagramConfig>
  ) {
    const body = g.append('switch');
    const f = body
      .append('foreignObject')
      .attr('x', x)
      .attr('y', y)
      .attr('width', width)
      .attr('height', height)
      .attr('position', 'fixed');

    const text = f
      .append<HTMLDivElement>('xhtml:div')
      .style('display', 'table')
      .style('height', '100%')
      .style('width', '100%');

    text
      .append('div')
      .attr('class', 'label')
      .style('display', 'table-cell')
      .style('text-align', 'center')
      .style('vertical-align', 'middle')
      .text(content);

    byTspan(content, body, x, y, width, height, textAttrs, conf);
    _setTextAttrs(text, textAttrs);
  }

  function _setTextAttrs<T extends Element>(
    toText: Selection<T, unknown, Element | null, unknown>,
    fromTextAttrsDict: TextAttrs
  ) {
    for (const key in fromTextAttrsDict) {
      if (key in fromTextAttrsDict) {
        // noinspection JSUnfilteredForInLoop
        toText.attr(key, fromTextAttrsDict[key]);
      }
    }
  }

  return function (conf: Required<TimelineDiagramConfig>): DrawTextFn {
    return conf.textPlacement === 'fo' ? byFo : conf.textPlacement === 'old' ? byText : byTspan;
  };
})();

const initGraphics = function (graphics: SVG, id?: string) {
  nodeCount = 0;
  taskCount = -1;
  graphics
    .append('defs')
    .append('marker')
    .attr('id', id + '-arrowhead')
    .attr('refX', 5)
    .attr('refY', 2)
    .attr('markerWidth', 6)
    .attr('markerHeight', 4)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 0,0 V 4 L6,2 Z'); // this is actual shape for arrowhead
};

/**
 * @param text - The text to be wrapped
 * @param width - The max width of the text
 */
function wrap(text: D3Selection<SVGTextElement>, width: number) {
  text.each(function () {
    const text = select(this),
      words = text
        .text()
        .split(/(\s+|<br>)/)
        .reverse(),
      lineHeight = 1.1, // ems
      y = text.attr('y'),
      dy = parseFloat(text.attr('dy'));
    let word,
      line: string[] = [],
      tspan = text
        .text(null)
        .append('tspan')
        .attr('x', 0)
        .attr('y', y)
        .attr('dy', dy + 'em');
    for (let j = 0; j < words.length; j++) {
      word = words[words.length - 1 - j];
      line.push(word);
      tspan.text(line.join(' ').trim());
      if (
        requiredNode(tspan, 'timeline tspan').getComputedTextLength() > width ||
        word === '<br>'
      ) {
        line.pop();
        tspan.text(line.join(' ').trim());
        if (word === '<br>') {
          line = [''];
        } else {
          line = [word];
        }

        tspan = text
          .append('tspan')
          .attr('x', 0)
          .attr('y', y)
          .attr('dy', lineHeight + 'em')
          .text(word);
      }
    }
  });
}

export const drawNode = function (
  elem: SVGGroup,
  node: TimelineNode,
  fullSection: number,
  conf: MermaidConfig,
  diagramId?: string,
  isEvent = false
): DrawnTimelineNode {
  const { theme, look } = conf;
  const isReduxTheme = theme?.includes('redux');
  const maxSections: number = conf?.themeVariables?.THEME_COLOR_LIMIT ?? 12;
  const section = (fullSection % maxSections) - 1;
  const nodeElem = elem.append('g');
  node.section = section;
  nodeElem.attr(
    'class',
    (node.class ? node.class + ' ' : '') + 'timeline-node ' + ('section-' + section)
  );
  const bkgElem = nodeElem.append('g');

  // Create the wrapped text element
  const textElem = nodeElem.append('g');

  const txt = textElem
    .append('text')
    .text(node.descr)
    .attr('dy', '1em')
    .attr('alignment-baseline', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('text-anchor', 'middle')
    .call(wrap, node.width);
  const bbox = requiredNode(txt, 'timeline node text').getBBox();
  const confFontSize = conf.fontSize as string | number | undefined;
  const fontSize = (confFontSize as string)?.replace
    ? (confFontSize as string).replace('px', '')
    : confFontSize;
  node.height = bbox.height + (fontSize as number) * 1.1 * 0.5 + node.padding;
  node.height = Math.max(node.height, node.maxHeight);
  node.width = node.width + 2 * node.padding;

  textElem.attr('transform', 'translate(' + node.width / 2 + ', ' + node.padding / 2 + ')');
  if (isReduxTheme) {
    textElem.attr(
      'transform',
      `translate(${node.width / 2}, ${isEvent ? node.padding / 2 + 3 : node.padding})`
    );
  }

  // Create the background element
  defaultBkg(bkgElem, node as DrawnTimelineNode, section, diagramId, conf);

  if (look === 'neo') {
    nodeElem.attr('data-look', `neo`);
    if (isReduxTheme) {
      // only reachable when `theme` is a redux theme, so it is always defined here
      const isDark = theme?.includes('dark') ?? false;
      const rootSvgNode = elem.node()?.ownerSVGElement ?? elem.node();
      const rootSvg = select(rootSvgNode);
      const svgId = rootSvg.attr('id') ?? '';
      const dropShadowId = svgId ? `${svgId}-drop-shadow` : 'drop-shadow';

      // Only add the filter once per SVG to avoid duplicate definitions
      if (rootSvg.select(`#${dropShadowId}`).empty()) {
        const existingDefs = rootSvg.select<SVGDefsElement>('defs');
        const defsEl = existingDefs.empty() ? rootSvg.append('defs') : existingDefs;
        defsEl
          .append('filter')
          .attr('id', dropShadowId)
          .attr('height', '130%')
          .attr('width', '130%')
          .append('feDropShadow')
          .attr('dx', '4')
          .attr('dy', '4')
          .attr('stdDeviation', 0)
          .attr('flood-opacity', isDark ? '0.2' : '0.06')
          .attr('flood-color', isDark ? '#FFFFFF' : '#000000');
      }
    }
  }

  return node as DrawnTimelineNode;
};

export const getVirtualNodeHeight = function (
  elem: SVG,
  node: TimelineMeasureNode,
  conf: MermaidConfig
): number {
  const textElem = elem.append('g');
  const txt = textElem
    .append('text')
    .text(node.descr as string)
    .attr('dy', '1em')
    .attr('alignment-baseline', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('text-anchor', 'middle')
    .call(wrap, node.width);
  const bbox = requiredNode(txt, 'timeline measurement text').getBBox();
  const confFontSize = conf.fontSize as string | number | undefined;
  const fontSize = (confFontSize as string)?.replace
    ? (confFontSize as string).replace('px', '')
    : confFontSize;
  textElem.remove();
  return bbox.height + (fontSize as number) * 1.1 * 0.5 + node.padding;
};

const defaultBkg = function (
  elem: SVGGroup,
  node: DrawnTimelineNode,
  section: number,
  diagramId: string | undefined,
  config: MermaidConfig
) {
  const { theme } = config;
  const r = theme?.includes('redux') ? 0 : 5;
  const rd = 5;
  // When r=0 (redux themes), use straight line segments for sharp corners instead of
  // degenerate quadratic bezier curves (q0,-0,0,-0) which are functionally a no-op.
  const d =
    r > 0
      ? `M0 ${node.height - rd} v${-node.height + 2 * rd} q0,-${r},${r},-${r} h${node.width - 2 * rd} q${r},0,${r},${r} v${node.height - rd} H0 Z`
      : `M0 ${node.height - rd} v${-(node.height - rd)} h${node.width} v${node.height} H0 Z`;
  elem
    .append('path')
    .attr('id', diagramId + '-node-' + nodeCount++)
    .attr('class', 'node-bkg node-' + node.type)
    .attr('d', d);
  if (!theme?.includes('redux')) {
    elem
      .append('line')
      .attr('class', 'node-line-' + section)
      .attr('x1', 0)
      .attr('y1', node.height)
      .attr('x2', node.width)
      .attr('y2', node.height);
  }
};

export default {
  drawRect,
  drawCircle,
  drawSection,
  drawText,
  drawLabel,
  drawTask,
  drawBackgroundRect,
  getTextObj,
  getNoteRect,
  initGraphics,
  drawNode,
  getVirtualNodeHeight,
};
