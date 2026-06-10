import type { Selection } from 'd3';
import { arc as d3arc } from 'd3';
import type { JourneyDiagramConfig } from '../../config.type.js';
import type { SVG, SVGGroup } from '../../diagram-api/types.js';
import type {
  Bound,
  CircleData,
  FaceData,
  RectData,
  SectionData,
  TaskData,
  TextData,
} from '../common/commonTypes.js';
import * as svgDrawCommon from '../common/svgDrawCommon.js';
import type { D3Selection } from '../../types.js';

export type JourneyFaceData = FaceData;

export type JourneyCircleData = CircleData;

export interface JourneyLabelData extends TextData {
  labelMargin: number;
}

export interface JourneySectionData extends SectionData {
  num: number;
  taskCount: number;
}

export interface JourneyActor {
  color: string;
  position: number;
}

export interface JourneyTaskData extends TaskData {
  num: number;
  people: string[];
  actors: Record<string, JourneyActor>;
}

type TextAttrs = Record<string, string>;

export const drawRect = function (elem: SVG | SVGGroup, rectData: RectData) {
  return svgDrawCommon.drawRect(elem, rectData);
};

export const drawFace = function (element: SVG | SVGGroup, faceData: JourneyFaceData) {
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

export const drawCircle = function (element: SVG | SVGGroup, circleData: JourneyCircleData) {
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

export const drawText = function (elem: SVG | SVGGroup, textData: TextData) {
  return svgDrawCommon.drawText(elem, textData);
};

export const drawLabel = function (elem: SVG | SVGGroup, txtObject: JourneyLabelData) {
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
  section: JourneySectionData,
  conf: Required<JourneyDiagramConfig>
) {
  const g = elem.append('g');

  const rect = svgDrawCommon.getNoteRect();
  rect.x = section.x;
  rect.y = section.y;
  rect.fill = section.fill;
  // section width covers all nested tasks
  rect.width =
    conf.width * section.taskCount + // width of the tasks
    conf.diagramMarginX * (section.taskCount - 1); // width of space between tasks
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
 * @param diagramId - The diagram's SVG element ID for scoping
 */
export const drawTask = function (
  elem: SVG | SVGGroup,
  task: JourneyTaskData,
  conf: Required<JourneyDiagramConfig>,
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

  const rect = svgDrawCommon.getNoteRect();
  rect.x = task.x;
  rect.y = task.y;
  rect.fill = task.fill;
  rect.width = conf.width;
  rect.height = conf.height;
  rect.class = 'task task-type-' + task.num;
  rect.rx = 3;
  rect.ry = 3;
  drawRect(g, rect);

  let xPos = task.x + 14;
  task.people.forEach((person) => {
    const colour = task.actors[person].color;

    const circle = {
      cx: xPos,
      cy: task.y,
      r: 7,
      fill: colour,
      stroke: '#000',
      title: person,
      pos: task.actors[person].position,
    };

    drawCircle(g, circle);
    xPos += 10;
  });

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
export const drawBackgroundRect = function (elem: SVG | SVGGroup, bounds: Bound) {
  svgDrawCommon.drawBackgroundRect(elem, bounds);
};

type DrawTextFn = (
  content: string,
  g: SVGGroup,
  x: number,
  y: number,
  width: number,
  height: number,
  textAttrs: TextAttrs,
  conf: Required<JourneyDiagramConfig>,
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
    conf: Required<JourneyDiagramConfig>,
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
    conf: Required<JourneyDiagramConfig>
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

  return function (conf: Required<JourneyDiagramConfig>): DrawTextFn {
    return conf.textPlacement === 'fo' ? byFo : conf.textPlacement === 'old' ? byText : byTspan;
  };
})();

const initGraphics = function (graphics: SVG, id: string) {
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

export default {
  drawRect,
  drawCircle,
  drawSection,
  drawText,
  drawLabel,
  drawTask,
  drawBackgroundRect,
  initGraphics,
};
