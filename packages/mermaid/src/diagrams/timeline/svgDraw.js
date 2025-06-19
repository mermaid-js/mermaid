import { arc as d3arc, select } from 'd3';
import { createText } from '../../rendering-util/createText.js';

const MAX_SECTIONS = 12;

/**
 * Process HTML content in node descriptions
 * @param {object} textElem - The SVG element to append text to
 * @param {object} node - The node object containing description and dimensions
 * @param {object} conf - Configuration object
 * @param {boolean} isVirtual - Whether this is for virtual height calculation
 */
const processHtmlContent = async function (textElem, node, conf, isVirtual = false) {
  // Create temporary text to get initial dimensions
  const tempText = textElem
    .append('text')
    .text(node.descr.replace(/<[^>]*>/g, ''))
    .attr('dy', '1em')
    .attr('alignment-baseline', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('text-anchor', 'middle')
    .call(wrap, node.width);

  if (!isVirtual) {
    tempText.attr('visibility', 'hidden');
  }

  const bbox = tempText.node().getBBox();
  tempText.remove();

  // Create the actual HTML content
  const textObj = await createText(
    textElem,
    node.descr,
    {
      useHtmlLabels: true,
      width: node.width,
      classes: 'timeline-node-label',
      isNode: true,
    },
    conf
  );

  if (!isVirtual) {
    select(textObj).attr('transform', 'translate(0, 0)');
  }

  // Process the foreign object
  const foreignObject = textElem.select('foreignObject');
  if (foreignObject.node()) {
    foreignObject.attr('width', `${10 * node.width}px`).attr('height', `${10 * node.width}px`);

    const div = foreignObject.select('div');
    if (div.node()) {
      div
        .style('display', 'table-cell')
        .style('white-space', 'nowrap')
        .style('line-height', '1.5')
        .style('max-width', node.width + 'px')
        .style('text-align', 'center');

      let divBBox = div.node().getBoundingClientRect();

      if (divBBox.width === node.width) {
        div
          .style('display', 'table')
          .style('white-space', 'break-spaces')
          .style('width', node.width + 'px');

        divBBox = div.node().getBoundingClientRect();
      }

      foreignObject.attr('width', node.width).attr('height', divBBox.height);

      if (!isVirtual) {
        foreignObject.attr('x', -node.width / 2).attr('y', 3);

        div.style('width', node.width + 'px');
      } else {
        bbox.height = divBBox.height;
      }
    }
  }

  return bbox;
};

export const drawRect = function (elem, rectData) {
  const rectElem = elem.append('rect');
  rectElem.attr('x', rectData.x);
  rectElem.attr('y', rectData.y);
  rectElem.attr('fill', rectData.fill);
  rectElem.attr('stroke', rectData.stroke);
  rectElem.attr('width', rectData.width);
  rectElem.attr('height', rectData.height);
  rectElem.attr('rx', rectData.rx);
  rectElem.attr('ry', rectData.ry);

  if (rectData.class !== undefined) {
    rectElem.attr('class', rectData.class);
  }

  return rectElem;
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
  // Remove and ignore br:s
  const nText = textData.text.replace(/<br\s*\/?>/gi, ' ');

  const textElem = elem.append('text');
  textElem.attr('x', textData.x);
  textElem.attr('y', textData.y);
  textElem.attr('class', 'legend');

  textElem.style('text-anchor', textData.anchor);

  if (textData.class !== undefined) {
    textElem.attr('class', textData.class);
  }

  const span = textElem.append('tspan');
  span.attr('x', textData.x + textData.textMargin * 2);
  span.text(nText);

  return textElem;
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
 * @param {any} elem The html element
 * @param {any} bounds The bounds of the drawing
 */
export const drawBackgroundRect = function (elem, bounds) {
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

export const getTextObj = function () {
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

export const getNoteRect = function () {
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
      .style('word-wrap', 'break-word')
      .style('overflow-wrap', 'break-word')
      .style('white-space', 'normal')
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

const initGraphics = function (graphics) {
  graphics
    .append('defs')
    .append('marker')
    .attr('id', 'arrowhead')
    .attr('refX', 5)
    .attr('refY', 2)
    .attr('markerWidth', 6)
    .attr('markerHeight', 4)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 0,0 V 4 L6,2 Z'); // this is actual shape for arrowhead
};

/**
 * @param {string} text The text to be wrapped
 * @param {number} width The max width of the text
 */
function wrap(text, width) {
  text.each(function () {
    var text = select(this),
      words = text
        .text()
        .split(/(\s+|<br>)/)
        .reverse(),
      word,
      line = [],
      lineHeight = 1.1, // ems
      y = text.attr('y'),
      dy = parseFloat(text.attr('dy')),
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
      if (tspan.node().getComputedTextLength() > width || word === '<br>') {
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

export const drawNode = async function (elem, node, fullSection, conf) {
  const section = (fullSection % MAX_SECTIONS) - 1;
  const nodeElem = elem.append('g');
  node.section = section;
  nodeElem.attr(
    'class',
    (node.class ? node.class + ' ' : '') + 'timeline-node ' + ('section-' + section)
  );
  const bkgElem = nodeElem.append('g');

  // Create the wrapped text element
  const textElem = nodeElem.append('g');

  const hasHtml = /<[a-z][\S\s]*>/i.test(node.descr);

  if (hasHtml) {
    const bbox = await processHtmlContent(textElem, node, conf, false);

    const fontSize = conf.fontSize?.replace ? conf.fontSize.replace('px', '') : conf.fontSize;
    node.height = bbox.height + fontSize * 1.1 * 0.5 + node.padding;
    node.height = Math.max(node.height, node.maxHeight);
    node.width = node.width + 2 * node.padding;
  } else {
    const txt = textElem
      .append('text')
      .text(node.descr)
      .attr('dy', '1em')
      .attr('alignment-baseline', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('text-anchor', 'middle')
      .call(wrap, node.width);
    const bbox = txt.node().getBBox();
    const fontSize = conf.fontSize?.replace ? conf.fontSize.replace('px', '') : conf.fontSize;
    node.height = bbox.height + fontSize * 1.1 * 0.5 + node.padding;
    node.height = Math.max(node.height, node.maxHeight);
    node.width = node.width + 2 * node.padding;
  }

  textElem.attr('transform', 'translate(' + node.width / 2 + ', ' + node.padding / 2 + ')');

  // Create the background element
  defaultBkg(bkgElem, node, section, conf);

  return node;
};

export const getVirtualNodeHeight = async function (elem, node, conf) {
  const textElem = elem.append('g');

  const hasHtml = /<[a-z][\S\s]*>/i.test(node.descr);

  let bbox;
  if (hasHtml) {
    bbox = await processHtmlContent(textElem, node, conf, true);
  } else {
    const txt = textElem
      .append('text')
      .text(node.descr)
      .attr('dy', '1em')
      .attr('alignment-baseline', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('text-anchor', 'middle')
      .call(wrap, node.width);
    bbox = txt.node().getBBox();
  }
  const fontSize = conf.fontSize?.replace ? conf.fontSize.replace('px', '') : conf.fontSize;
  textElem.remove();
  return bbox.height + fontSize * 1.1 * 0.5 + node.padding;
};

const defaultBkg = function (elem, node, section) {
  const rd = 5;
  elem
    .append('path')
    .attr('id', 'node-' + node.id)
    .attr('class', 'node-bkg node-' + node.type)
    .attr(
      'd',
      `M0 ${node.height - rd} v${-node.height + 2 * rd} q0,-5 5,-5 h${
        node.width - 2 * rd
      } q5,0 5,5 v${node.height - rd} H0 Z`
    );

  elem
    .append('line')
    .attr('class', 'node-line-' + section)
    .attr('x1', 0)
    .attr('y1', node.height)
    .attr('x2', node.width)
    .attr('y2', node.height);
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
