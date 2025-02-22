import { arc as d3arc } from 'd3';
import * as svgDrawCommon from '../common/svgDrawCommon.js';

export const drawRect = function (elem, rectData) {
  return svgDrawCommon.drawRect(elem, rectData);
};

export const drawFace = function (element, faceData) {
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

  /** @param {any} face */
  function smile(face) {
    const arc = d3arc()
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

  /** @param {any} face */
  function sad(face) {
    const arc = d3arc()
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

  /** @param {any} face */
  function ambivalent(face) {
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

export const drawCircle = function (element, circleData) {
  const circleElement = element.append('circle');
  circleElement.attr('cx', circleData.cx);
  circleElement.attr('cy', circleData.cy);
  circleElement.attr('class', 'actor-' + circleData.pos);
  circleElement.attr('fill', circleData.fill);
  circleElement.attr('stroke', circleData.stroke);
  circleElement.attr('r', circleData.r);

  if (circleElement.class !== undefined) {
    circleElement.attr('class', circleElement.class);
  }

  if (circleData.title !== undefined) {
    circleElement.append('title').text(circleData.title);
  }

  return circleElement;
};

export const drawText = function (elem, textData) {
  return svgDrawCommon.drawText(elem, textData);
};

export const drawLabel = function (elem, txtObject) {
  /**
   * @param {any} x
   * @param {any} y
   * @param {any} width
   * @param {any} height
   * @param {any} cut
   */
  function genPoints(x, y, width, height, cut) {
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

export const drawSection = function (elem, section, conf) {
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
 * @param {any} elem The HTML element
 * @param {any} task The task to render
 * @param {any} conf The global configuration
 */
export const drawTask = function (elem, task, conf) {
  const center = task.x + conf.width / 2;
  const g = elem.append('g');
  taskCount++;
  const maxHeight = 300 + 5 * 30;
  g.append('line')
    .attr('id', 'task' + taskCount)
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
 * @param {any} elem The html element
 * @param {any} bounds The bounds of the drawing
 */
export const drawBackgroundRect = function (elem, bounds) {
  svgDrawCommon.drawBackgroundRect(elem, bounds);
};

const _drawTextCandidateFunc = (function () {
  /**
   * @param {any} content
   * @param {any} g
   * @param {any} x
   * @param {any} y
   * @param {any} width
   * @param {any} height
   * @param {any} textAttrs
   * @param {any} colour
   */
  function byText(content, g, x, y, width, height, textAttrs, colour) {
    const text = g
      .append('text')
      .attr('x', x + width / 2)
      .attr('y', y + height / 2 + 5)
      .style('font-color', colour)
      .style('text-anchor', 'middle')
      .text(content);
    _setTextAttrs(text, textAttrs);
  }

  /**
   * @param {any} content
   * @param {any} g
   * @param {any} x
   * @param {any} y
   * @param {any} width
   * @param {any} height
   * @param {any} textAttrs
   * @param {any} conf
   * @param {any} colour
   */
  function byTspan(content, g, x, y, width, height, textAttrs, conf, colour) {
    const { taskFontSize, taskFontFamily } = conf;

    const lines = content.split(/<br\s*\/?>/gi);
    for (let i = 0; i < lines.length; i++) {
      const dy = i * taskFontSize - (taskFontSize * (lines.length - 1)) / 2;
      const text = g
        .append('text')
        .attr('x', x + width / 2)
        .attr('y', y)
        .attr('fill', colour)
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

  /**
   * @param {any} content
   * @param {any} g
   * @param {any} x
   * @param {any} y
   * @param {any} width
   * @param {any} height
   * @param {any} textAttrs
   * @param {any} conf
   */
  function byFo(content, g, x, y, width, height, textAttrs, conf) {
    const body = g.append('switch');
    const f = body
      .append('foreignObject')
      .attr('x', x)
      .attr('y', y)
      .attr('width', width)
      .attr('height', height)
      .attr('position', 'fixed');

    const text = f
      .append('xhtml:div')
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

  /**
   * @param {any} toText
   * @param {any} fromTextAttrsDict
   */
  function _setTextAttrs(toText, fromTextAttrsDict) {
    for (const key in fromTextAttrsDict) {
      if (key in fromTextAttrsDict) {
        // noinspection JSUnfilteredForInLoop
        toText.attr(key, fromTextAttrsDict[key]);
      }
    }
  }

  return function (conf) {
    return conf.textPlacement === 'fo' ? byFo : conf.textPlacement === 'old' ? byText : byTspan;
  };
})();

const initGraphics = function (graphics, id) {
  graphics
    .append('defs')
    .append('marker')
    .attr('id', id + '-arrowhead')
    .attr('class', 'mermaid-marker-journey-arrowhead')
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
