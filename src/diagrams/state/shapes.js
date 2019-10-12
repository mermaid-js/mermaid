import * as d3 from 'd3';
import idCache from './id-cache.js';
import stateDb from './stateDb';
import utils from '../../utils';
import { getConfig, conf } from '../../config';

// let conf;

/**
 * Draws a start state as a black circle
 */
export const drawStartState = g =>
  g
    .append('circle')
    .style('stroke', 'black')
    .style('fill', 'black')
    .attr('r', getConfig().state.sizeUnit)
    .attr('cx', getConfig().state.padding + getConfig().state.sizeUnit)
    .attr('cy', getConfig().state.padding + getConfig().state.sizeUnit);

/**
 * Draws a start state as a black circle
 */
export const drawDivider = g =>
  g
    .append('line')
    .style('stroke', 'grey')
    .style('stroke-dasharray', '3')
    .attr('x1', getConfig().state.textHeight)
    .attr('class', 'divider')
    .attr('x2', getConfig().state.textHeight * 2)
    .attr('y1', 0)
    .attr('y2', 0);

/**
 * Draws a an end state as a black circle
 */
export const drawSimpleState = (g, stateDef) => {
  const state = g
    .append('text')
    .attr('x', 2 * getConfig().state.padding)
    .attr('y', getConfig().state.textHeight + 2 * getConfig().state.padding)
    .attr('font-size', getConfig().state.fontSize)
    .attr('class', 'state-title')
    .text(stateDef.id);

  const classBox = state.node().getBBox();
  g.insert('rect', ':first-child')
    .attr('x', getConfig().state.padding)
    .attr('y', getConfig().state.padding)
    .attr('width', classBox.width + 2 * getConfig().state.padding)
    .attr('height', classBox.height + 2 * getConfig().state.padding)
    .attr('rx', getConfig().state.radius);

  return state;
};

/**
 * Draws a state with descriptions
 * @param {*} g
 * @param {*} stateDef
 */
export const drawDescrState = (g, stateDef) => {
  const addTspan = function(textEl, txt, isFirst) {
    const tSpan = textEl
      .append('tspan')
      .attr('x', 2 * getConfig().state.padding)
      .text(txt);
    if (!isFirst) {
      tSpan.attr('dy', getConfig().state.textHeight);
    }
  };
  const title = g
    .append('text')
    .attr('x', 2 * getConfig().state.padding)
    .attr('y', getConfig().state.textHeight + 1.5 * getConfig().state.padding)
    .attr('font-size', getConfig().state.fontSize)
    .attr('class', 'state-title')
    .text(stateDef.id);

  const titleBox = title.node().getBBox();
  const titleHeight = titleBox.height;

  const description = g
    .append('text') // text label for the x axis
    .attr('x', getConfig().state.padding)
    .attr(
      'y',
      titleHeight +
        getConfig().state.padding * 0.2 +
        getConfig().state.dividerMargin +
        getConfig().state.textHeight
    )
    .attr('class', 'state-description');

  let isFirst = true;
  stateDef.descriptions.forEach(function(descr) {
    addTspan(description, descr, isFirst);
    isFirst = false;
  });

  const descrLine = g
    .append('line') // text label for the x axis
    .attr('x1', getConfig().state.padding)
    .attr('y1', getConfig().state.padding + titleHeight + getConfig().state.dividerMargin / 2)
    .attr('y2', getConfig().state.padding + titleHeight + getConfig().state.dividerMargin / 2)
    .attr('class', 'descr-divider');
  const descrBox = description.node().getBBox();
  console.warn(descrBox.width, titleBox.width);
  const width = Math.max(descrBox.width, titleBox.width);

  descrLine.attr('x2', width + 3 * getConfig().state.padding);
  // const classBox = title.node().getBBox();

  g.insert('rect', ':first-child')
    .attr('x', getConfig().state.padding)
    .attr('y', getConfig().state.padding)
    .attr('width', width + 2 * getConfig().state.padding)
    .attr('height', descrBox.height + titleHeight + 2 * getConfig().state.padding)
    .attr('rx', getConfig().state.radius);

  return g;
};

/**
 * Adds the creates a box around the existing content and adds a
 * panel for the id on top of the content.
 */
export const addIdAndBox = (g, stateDef) => {
  // TODO Move hardcodings to conf
  const addTspan = function(textEl, txt, isFirst) {
    const tSpan = textEl
      .append('tspan')
      .attr('x', 2 * getConfig().state.padding)
      .text(txt);
    if (!isFirst) {
      tSpan.attr('dy', getConfig().state.textHeight);
    }
  };
  const title = g
    .append('text')
    .attr('x', 2 * getConfig().state.padding)
    .attr('y', getConfig().state.titleShift)
    .attr('font-size', getConfig().state.fontSize)
    .attr('class', 'state-title')
    .text(stateDef.id);

  const titleHeight = title.node().getBBox().height;

  const lineY = 1 - getConfig().state.textHeight;
  const descrLine = g
    .append('line') // text label for the x axis
    .attr('x1', 0)
    .attr('y1', lineY)
    .attr('y2', lineY)
    .attr('class', 'descr-divider');

  const graphBox = g.node().getBBox();
  title.attr('x', graphBox.width / 2 - title.node().getBBox().width / 2);
  descrLine.attr('x2', graphBox.width + getConfig().state.padding);

  // White color
  g.insert('rect', ':first-child')
    .attr('x', graphBox.x)
    .attr('y', lineY)
    .attr('class', 'composit')
    .attr('width', graphBox.width + getConfig().state.padding)
    .attr(
      'height',
      graphBox.height + getConfig().state.textHeight + getConfig().state.titleShift + 1
    )
    .attr('rx', '0');

  // Title background
  g.insert('rect', ':first-child')
    .attr('x', graphBox.x)
    .attr(
      'y',
      getConfig().state.titleShift - getConfig().state.textHeight - getConfig().state.padding
    )
    .attr('width', graphBox.width + getConfig().state.padding)
    // Just needs to be higher then the descr line, will be clipped by the white color box
    .attr('height', getConfig().state.textHeight * 3)
    .attr('rx', getConfig().state.radius);

  // Full background
  g.insert('rect', ':first-child')
    .attr('x', graphBox.x)
    .attr(
      'y',
      getConfig().state.titleShift - getConfig().state.textHeight - getConfig().state.padding
    )
    .attr('width', graphBox.width + getConfig().state.padding)
    .attr('height', graphBox.height + 3 + 2 * getConfig().state.textHeight)
    .attr('rx', getConfig().state.radius);

  return g;
};

const drawEndState = g => {
  g.append('circle')
    .style('stroke', 'black')
    .style('fill', 'white')
    .attr('r', getConfig().state.sizeUnit + getConfig().state.miniPadding)
    .attr(
      'cx',
      getConfig().state.padding + getConfig().state.sizeUnit + getConfig().state.miniPadding
    )
    .attr(
      'cy',
      getConfig().state.padding + getConfig().state.sizeUnit + getConfig().state.miniPadding
    );

  return g
    .append('circle')
    .style('stroke', 'black')
    .style('fill', 'black')
    .attr('r', getConfig().state.sizeUnit)
    .attr('cx', getConfig().state.padding + getConfig().state.sizeUnit + 2)
    .attr('cy', getConfig().state.padding + getConfig().state.sizeUnit + 2);
};
const drawForkJoinState = (g, stateDef) => {
  let width = getConfig().state.forkWidth;
  let height = getConfig().state.forkHeight;

  if (stateDef.parentId) {
    let tmp = width;
    width = height;
    height = tmp;
  }
  return g
    .append('rect')
    .style('stroke', 'black')
    .style('fill', 'black')
    .attr('width', width)
    .attr('height', height)
    .attr('x', getConfig().state.padding)
    .attr('y', getConfig().state.padding);
};

export const drawText = function(elem, textData, width) {
  // Remove and ignore br:s
  const nText = textData.text.replace(/<br\/?>/gi, ' ');

  const textElem = elem.append('text');
  textElem.attr('x', textData.x);
  textElem.attr('y', textData.y);
  textElem.style('text-anchor', textData.anchor);
  textElem.attr('fill', textData.fill);
  if (typeof textData.class !== 'undefined') {
    textElem.attr('class', textData.class);
  }

  const span = textElem.append('tspan');
  span.attr('x', textData.x + textData.textMargin * 2);
  span.attr('fill', textData.fill);
  span.text(nText);

  return textElem;
};

const _drawLongText = (_text, x, y, g) => {
  let textHeight = 0;
  let textWidth = 0;
  const textElem = g.append('text');
  textElem.style('text-anchor', 'start');
  textElem.attr('class', 'noteText');

  let text = _text.replace(/\r\n/g, '<br/>');
  text = text.replace(/\n/g, '<br/>');
  const lines = text.split(/<br\/?>/gi);
  for (const line of lines) {
    const txt = line.trim();

    if (txt.length > 0) {
      const span = textElem.append('tspan');
      span.text(txt);
      const textBounds = span.node().getBBox();
      textHeight += textBounds.height;
      span.attr('x', x + getConfig().state.noteMargin);
      span.attr('y', y + textHeight + 1.25 * getConfig().state.noteMargin);
      // textWidth = Math.max(textBounds.width, textWidth);
    }
  }
  return { textWidth: textElem.node().getBBox().width, textHeight };
};

/**
 * Draws an actor in the diagram with the attaced line
 * @param center - The center of the the actor
 * @param pos The position if the actor in the liost of actors
 * @param description The text in the box
 */

export const drawNote = (text, g) => {
  g.attr('class', 'state-note');
  const note = g
    .append('rect')
    .attr('x', 0)
    .attr('y', getConfig().state.padding);
  const rectElem = g.append('g');

  const { textWidth, textHeight } = _drawLongText(text, 0, 0, rectElem);
  note.attr('height', textHeight + 2 * getConfig().state.noteMargin);
  note.attr('width', textWidth + getConfig().state.noteMargin * 2);

  return note;
};

/**
 * Starting point for drawing a state. The function finds out the specifics
 * about the state and renders with approprtiate function.
 * @param {*} elem
 * @param {*} stateDef
 */

let cnt = 0;
export const drawState = function(elem, stateDef, graph, doc) {
  const id = stateDef.id;
  const stateInfo = {
    id: id,
    label: stateDef.id,
    width: 0,
    height: 0
  };

  const g = elem
    .append('g')
    .attr('id', id)
    .attr('class', 'stateGroup');

  if (stateDef.type === 'start') drawStartState(g);
  if (stateDef.type === 'end') drawEndState(g);
  if (stateDef.type === 'fork' || stateDef.type === 'join') drawForkJoinState(g, stateDef);
  if (stateDef.type === 'note') drawNote(stateDef.note.text, g);
  if (stateDef.type === 'divider') drawDivider(g);
  if (stateDef.type === 'default' && stateDef.descriptions.length === 0)
    drawSimpleState(g, stateDef);
  if (stateDef.type === 'default' && stateDef.descriptions.length > 0) drawDescrState(g, stateDef);

  const stateBox = g.node().getBBox();
  stateInfo.width = stateBox.width + 2 * getConfig().state.padding;
  stateInfo.height = stateBox.height + 2 * getConfig().state.padding;

  idCache.set(id, stateInfo);
  // stateCnt++;
  return stateInfo;
};

let edgeCount = 0;
export const drawEdge = function(elem, path, relation) {
  const getRelationType = function(type) {
    switch (type) {
      case stateDb.relationType.AGGREGATION:
        return 'aggregation';
      case stateDb.relationType.EXTENSION:
        return 'extension';
      case stateDb.relationType.COMPOSITION:
        return 'composition';
      case stateDb.relationType.DEPENDENCY:
        return 'dependency';
    }
  };

  path.points = path.points.filter(p => !Number.isNaN(p.y));

  // The data for our line
  const lineData = path.points;

  // This is the accessor function we talked about above
  const lineFunction = d3
    .line()
    .x(function(d) {
      return d.x;
    })
    .y(function(d) {
      return d.y;
    })
    .curve(d3.curveBasis);

  const svgPath = elem
    .append('path')
    .attr('d', lineFunction(lineData))
    .attr('id', 'edge' + edgeCount)
    .attr('class', 'transition');
  let url = '';
  if (getConfig().state.arrowMarkerAbsolute) {
    url =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      window.location.search;
    url = url.replace(/\(/g, '\\(');
    url = url.replace(/\)/g, '\\)');
  }

  svgPath.attr(
    'marker-end',
    'url(' + url + '#' + getRelationType(stateDb.relationType.DEPENDENCY) + 'End' + ')'
  );

  if (typeof relation.title !== 'undefined') {
    const g = elem.append('g').attr('class', 'stateLabel');
    const label = g
      .append('text')
      .attr('text-anchor', 'middle')
      .text(relation.title);
    const { x, y } = utils.calcLabelPosition(path.points);
    label.attr('x', x).attr('y', y);
    const bounds = label.node().getBBox();
    g.insert('rect', ':first-child')
      .attr('class', 'box')
      .attr('x', bounds.x - getConfig().state.padding / 2)
      .attr('y', bounds.y - getConfig().state.padding / 2)
      .attr('width', bounds.width + getConfig().state.padding)
      .attr('height', bounds.height + getConfig().state.padding);
    // Debug points
    // path.points.forEach(point => {
    //   g.append('circle')
    //     .style('stroke', 'red')
    //     .style('fill', 'red')
    //     .attr('r', 1)
    //     .attr('cx', point.x)
    //     .attr('cy', point.y);
    // });
    // g.append('circle')
    //   .style('stroke', 'blue')
    //   .style('fill', 'blue')
    //   .attr('r', 1)
    //   .attr('cx', x)
    //   .attr('cy', y);
  }

  edgeCount++;
};
