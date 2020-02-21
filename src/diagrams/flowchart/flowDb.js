import * as d3 from 'd3';
import { logger } from '../../logger';
import utils from '../../utils';
import { getConfig } from '../../config';

// const MERMAID_DOM_ID_PREFIX = 'mermaid-dom-id-';
const MERMAID_DOM_ID_PREFIX = '';

const config = getConfig();
let vertices = {};
let edges = [];
let classes = [];
let subGraphs = [];
let subGraphLookup = {};
let tooltips = {};
let subCount = 0;
let firstGraphFlag = true;
let direction;
// Functions to be run after graph rendering
let funs = [];

/**
 * Function called by parser when a node definition has been found
 * @param id
 * @param text
 * @param type
 * @param style
 * @param classes
 */
export const addVertex = function(_id, text, type, style, classes) {
  let txt;
  let id = _id;
  if (typeof id === 'undefined') {
    return;
  }
  if (id.trim().length === 0) {
    return;
  }

  if (id[0].match(/\d/)) id = MERMAID_DOM_ID_PREFIX + id;

  if (typeof vertices[id] === 'undefined') {
    vertices[id] = { id: id, styles: [], classes: [] };
  }
  if (typeof text !== 'undefined') {
    txt = utils.sanitize(text.trim(), config);

    // strip quotes if string starts and ends with a quote
    if (txt[0] === '"' && txt[txt.length - 1] === '"') {
      txt = txt.substring(1, txt.length - 1);
    }

    vertices[id].text = txt;
  } else {
    if (typeof vertices[id].text === 'undefined') {
      vertices[id].text = _id;
    }
  }
  if (typeof type !== 'undefined') {
    vertices[id].type = type;
  }
  if (typeof style !== 'undefined') {
    if (style !== null) {
      style.forEach(function(s) {
        vertices[id].styles.push(s);
      });
    }
  }
  if (typeof classes !== 'undefined') {
    if (classes !== null) {
      classes.forEach(function(s) {
        vertices[id].classes.push(s);
      });
    }
  }
};

/**
 * Function called by parser when a link/edge definition has been found
 * @param start
 * @param end
 * @param type
 * @param linktext
 */
export const addSingleLink = function(_start, _end, type, linktext) {
  let start = _start;
  let end = _end;
  if (start[0].match(/\d/)) start = MERMAID_DOM_ID_PREFIX + start;
  if (end[0].match(/\d/)) end = MERMAID_DOM_ID_PREFIX + end;
  logger.info('Got edge...', start, end);

  const edge = { start: start, end: end, type: undefined, text: '' };
  linktext = type.text;

  if (typeof linktext !== 'undefined') {
    edge.text = utils.sanitize(linktext.trim(), config);

    // strip quotes if string starts and exnds with a quote
    if (edge.text[0] === '"' && edge.text[edge.text.length - 1] === '"') {
      edge.text = edge.text.substring(1, edge.text.length - 1);
    }
  }

  if (typeof type !== 'undefined') {
    edge.type = type.type;
    edge.stroke = type.stroke;
  }
  edges.push(edge);
};
export const addLink = function(_start, _end, type, linktext) {
  let i, j;
  for (i = 0; i < _start.length; i++) {
    for (j = 0; j < _end.length; j++) {
      addSingleLink(_start[i], _end[j], type, linktext);
    }
  }
};

/**
 * Updates a link's line interpolation algorithm
 * @param pos
 * @param interpolate
 */
export const updateLinkInterpolate = function(positions, interp) {
  positions.forEach(function(pos) {
    if (pos === 'default') {
      edges.defaultInterpolate = interp;
    } else {
      edges[pos].interpolate = interp;
    }
  });
};

/**
 * Updates a link with a style
 * @param pos
 * @param style
 */
export const updateLink = function(positions, style) {
  positions.forEach(function(pos) {
    if (pos === 'default') {
      edges.defaultStyle = style;
    } else {
      if (utils.isSubstringInArray('fill', style) === -1) {
        style.push('fill:none');
      }
      edges[pos].style = style;
    }
  });
};

export const addClass = function(id, style) {
  if (typeof classes[id] === 'undefined') {
    classes[id] = { id: id, styles: [], textStyles: [] };
  }

  if (typeof style !== 'undefined') {
    if (style !== null) {
      style.forEach(function(s) {
        if (s.match('color')) {
          const newStyle1 = s.replace('fill', 'bgFill');
          const newStyle2 = newStyle1.replace('color', 'fill');
          classes[id].textStyles.push(newStyle2);
        }
        classes[id].styles.push(s);
      });
    }
  }
};

/**
 * Called by parser when a graph definition is found, stores the direction of the chart.
 * @param dir
 */
export const setDirection = function(dir) {
  direction = dir;
  if (direction.match(/.*</)) {
    direction = 'RL';
  }
  if (direction.match(/.*\^/)) {
    direction = 'BT';
  }
  if (direction.match(/.*>/)) {
    direction = 'LR';
  }
  if (direction.match(/.*v/)) {
    direction = 'TB';
  }
};

/**
 * Called by parser when a special node is found, e.g. a clickable element.
 * @param ids Comma separated list of ids
 * @param className Class to add
 */
export const setClass = function(ids, className) {
  ids.split(',').forEach(function(_id) {
    let id = _id;
    if (_id[0].match(/\d/)) id = MERMAID_DOM_ID_PREFIX + id;
    if (typeof vertices[id] !== 'undefined') {
      vertices[id].classes.push(className);
    }

    if (typeof subGraphLookup[id] !== 'undefined') {
      subGraphLookup[id].classes.push(className);
    }
  });
};

const setTooltip = function(ids, tooltip) {
  ids.split(',').forEach(function(id) {
    if (typeof tooltip !== 'undefined') {
      tooltips[id] = utils.sanitize(tooltip, config);
    }
  });
};

const setClickFun = function(_id, functionName) {
  let id = _id;
  if (_id[0].match(/\d/)) id = MERMAID_DOM_ID_PREFIX + id;
  if (config.securityLevel !== 'loose') {
    return;
  }
  if (typeof functionName === 'undefined') {
    return;
  }
  if (typeof vertices[id] !== 'undefined') {
    funs.push(function() {
      const elem = document.querySelector(`[id="${id}"]`);
      if (elem !== null) {
        elem.addEventListener(
          'click',
          function() {
            window[functionName](id);
          },
          false
        );
      }
    });
  }
};

/**
 * Called by parser when a link is found. Adds the URL to the vertex data.
 * @param ids Comma separated list of ids
 * @param linkStr URL to create a link for
 * @param tooltip Tooltip for the clickable element
 */
export const setLink = function(ids, linkStr, tooltip) {
  ids.split(',').forEach(function(_id) {
    let id = _id;
    if (_id[0].match(/\d/)) id = MERMAID_DOM_ID_PREFIX + id;
    if (typeof vertices[id] !== 'undefined') {
      vertices[id].link = utils.formatUrl(linkStr, config);
    }
  });
  setTooltip(ids, tooltip);
  setClass(ids, 'clickable');
};
export const getTooltip = function(id) {
  return tooltips[id];
};

/**
 * Called by parser when a click definition is found. Registers an event handler.
 * @param ids Comma separated list of ids
 * @param functionName Function to be called on click
 * @param tooltip Tooltip for the clickable element
 */
export const setClickEvent = function(ids, functionName, tooltip) {
  ids.split(',').forEach(function(id) {
    setClickFun(id, functionName);
  });
  setTooltip(ids, tooltip);
  setClass(ids, 'clickable');
};

export const bindFunctions = function(element) {
  funs.forEach(function(fun) {
    fun(element);
  });
};
export const getDirection = function() {
  return direction.trim();
};
/**
 * Retrieval function for fetching the found nodes after parsing has completed.
 * @returns {{}|*|vertices}
 */
export const getVertices = function() {
  return vertices;
};

/**
 * Retrieval function for fetching the found links after parsing has completed.
 * @returns {{}|*|edges}
 */
export const getEdges = function() {
  return edges;
};

/**
 * Retrieval function for fetching the found class definitions after parsing has completed.
 * @returns {{}|*|classes}
 */
export const getClasses = function() {
  return classes;
};

const setupToolTips = function(element) {
  let tooltipElem = d3.select('.mermaidTooltip');
  if ((tooltipElem._groups || tooltipElem)[0][0] === null) {
    tooltipElem = d3
      .select('body')
      .append('div')
      .attr('class', 'mermaidTooltip')
      .style('opacity', 0);
  }

  const svg = d3.select(element).select('svg');

  const nodes = svg.selectAll('g.node');
  nodes
    .on('mouseover', function() {
      const el = d3.select(this);
      const title = el.attr('title');
      // Dont try to draw a tooltip if no data is provided
      if (title === null) {
        return;
      }
      const rect = this.getBoundingClientRect();

      tooltipElem
        .transition()
        .duration(200)
        .style('opacity', '.9');
      tooltipElem
        .html(el.attr('title'))
        .style('left', rect.left + (rect.right - rect.left) / 2 + 'px')
        .style('top', rect.top - 14 + document.body.scrollTop + 'px');
      el.classed('hover', true);
    })
    .on('mouseout', function() {
      tooltipElem
        .transition()
        .duration(500)
        .style('opacity', 0);
      const el = d3.select(this);
      el.classed('hover', false);
    });
};
funs.push(setupToolTips);

/**
 * Clears the internal graph db so that a new graph can be parsed.
 */
export const clear = function() {
  vertices = {};
  classes = {};
  edges = [];
  funs = [];
  funs.push(setupToolTips);
  subGraphs = [];
  subGraphLookup = {};
  subCount = 0;
  tooltips = [];
  firstGraphFlag = true;
};
/**
 *
 * @returns {string}
 */
export const defaultStyle = function() {
  return 'fill:#ffa;stroke: #f66; stroke-width: 3px; stroke-dasharray: 5, 5;fill:#ffa;stroke: #666;';
};

/**
 * Clears the internal graph db so that a new graph can be parsed.
 */
export const addSubGraph = function(_id, list, _title) {
  let id = _id.trim();
  let title = _title;
  if (_id === _title && _title.match(/\s/)) {
    id = undefined;
  }
  function uniq(a) {
    const prims = { boolean: {}, number: {}, string: {} };
    const objs = [];

    return a.filter(function(item) {
      const type = typeof item;
      if (item.trim() === '') {
        return false;
      }
      if (type in prims) {
        return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true); // eslint-disable-line
      } else {
        return objs.indexOf(item) >= 0 ? false : objs.push(item);
      }
    });
  }

  let nodeList = [];

  nodeList = uniq(nodeList.concat.apply(nodeList, list));
  for (let i = 0; i < nodeList.length; i++) {
    if (nodeList[i][0].match(/\d/)) nodeList[i] = MERMAID_DOM_ID_PREFIX + nodeList[i];
  }

  id = id || 'subGraph' + subCount;
  if (id[0].match(/\d/)) id = MERMAID_DOM_ID_PREFIX + id;
  title = title || '';
  title = utils.sanitize(title, config);
  subCount = subCount + 1;
  const subGraph = { id: id, nodes: nodeList, title: title.trim(), classes: [] };
  subGraphs.push(subGraph);
  subGraphLookup[id] = subGraph;
  return id;
};

const getPosForId = function(id) {
  for (let i = 0; i < subGraphs.length; i++) {
    if (subGraphs[i].id === id) {
      return i;
    }
  }
  return -1;
};
let secCount = -1;
const posCrossRef = [];
const indexNodes2 = function(id, pos) {
  const nodes = subGraphs[pos].nodes;
  secCount = secCount + 1;
  if (secCount > 2000) {
    return;
  }
  posCrossRef[secCount] = pos;
  // Check if match
  if (subGraphs[pos].id === id) {
    return {
      result: true,
      count: 0
    };
  }

  let count = 0;
  let posCount = 1;
  while (count < nodes.length) {
    const childPos = getPosForId(nodes[count]);
    // Ignore regular nodes (pos will be -1)
    if (childPos >= 0) {
      const res = indexNodes2(id, childPos);
      if (res.result) {
        return {
          result: true,
          count: posCount + res.count
        };
      } else {
        posCount = posCount + res.count;
      }
    }
    count = count + 1;
  }

  return {
    result: false,
    count: posCount
  };
};

export const getDepthFirstPos = function(pos) {
  return posCrossRef[pos];
};
export const indexNodes = function() {
  secCount = -1;
  if (subGraphs.length > 0) {
    indexNodes2('none', subGraphs.length - 1, 0);
  }
};

export const getSubGraphs = function() {
  return subGraphs;
};

export const firstGraph = () => {
  if (firstGraphFlag) {
    firstGraphFlag = false;
    return true;
  }
  return false;
};

const destructStartLink = _str => {
  const str = _str.trim();

  switch (str) {
    case '<--':
      return { type: 'arrow', stroke: 'normal' };
    case 'x--':
      return { type: 'arrow_cross', stroke: 'normal' };
    case 'o--':
      return { type: 'arrow_circle', stroke: 'normal' };
    case '<-.':
      return { type: 'arrow', stroke: 'dotted' };
    case 'x-.':
      return { type: 'arrow_cross', stroke: 'dotted' };
    case 'o-.':
      return { type: 'arrow_circle', stroke: 'dotted' };
    case '<==':
      return { type: 'arrow', stroke: 'thick' };
    case 'x==':
      return { type: 'arrow_cross', stroke: 'thick' };
    case 'o==':
      return { type: 'arrow_circle', stroke: 'thick' };
    case '--':
      return { type: 'arrow_open', stroke: 'normal' };
    case '==':
      return { type: 'arrow_open', stroke: 'thick' };
    case '-.':
      return { type: 'arrow_open', stroke: 'dotted' };
  }
};

const destructEndLink = _str => {
  const str = _str.trim();

  switch (str) {
    case '--x':
      return { type: 'arrow_cross', stroke: 'normal' };
    case '-->':
      return { type: 'arrow', stroke: 'normal' };
    case '<-->':
      return { type: 'double_arrow_point', stroke: 'normal' };
    case 'x--x':
      return { type: 'double_arrow_cross', stroke: 'normal' };
    case 'o--o':
      return { type: 'double_arrow_circle', stroke: 'normal' };
    case 'o.-o':
      return { type: 'double_arrow_circle', stroke: 'dotted' };
    case '<==>':
      return { type: 'double_arrow_point', stroke: 'thick' };
    case 'o==o':
      return { type: 'double_arrow_circle', stroke: 'thick' };
    case 'x==x':
      return { type: 'double_arrow_cross', stroke: 'thick' };
    case 'x.-x':
      return { type: 'double_arrow_cross', stroke: 'dotted' };
    case 'x-.-x':
      return { type: 'double_arrow_cross', stroke: 'dotted' };
    case '<.->':
      return { type: 'double_arrow_point', stroke: 'dotted' };
    case '<-.->':
      return { type: 'double_arrow_point', stroke: 'dotted' };
    case 'o-.-o':
      return { type: 'double_arrow_circle', stroke: 'dotted' };
    case '--o':
      return { type: 'arrow_circle', stroke: 'normal' };
    case '---':
      return { type: 'arrow_open', stroke: 'normal' };
    case '-.-x':
      return { type: 'arrow_cross', stroke: 'dotted' };
    case '-.->':
      return { type: 'arrow', stroke: 'dotted' };
    case '-.-o':
      return { type: 'arrow_circle', stroke: 'dotted' };
    case '-.-':
      return { type: 'arrow_open', stroke: 'dotted' };
    case '.-x':
      return { type: 'arrow_cross', stroke: 'dotted' };
    case '.->':
      return { type: 'arrow', stroke: 'dotted' };
    case '.-o':
      return { type: 'arrow_circle', stroke: 'dotted' };
    case '.-':
      return { type: 'arrow_open', stroke: 'dotted' };
    case '==x':
      return { type: 'arrow_cross', stroke: 'thick' };
    case '==>':
      return { type: 'arrow', stroke: 'thick' };
    case '==o':
      return { type: 'arrow_circle', stroke: 'thick' };
    case '===':
      return { type: 'arrow_open', stroke: 'thick' };
  }
};

const destructLink = (_str, _startStr) => {
  const info = destructEndLink(_str);
  let startInfo;
  if (_startStr) {
    startInfo = destructStartLink(_startStr);

    if (startInfo.stroke !== info.stroke) {
      return { type: 'INVALID', stroke: 'INVALID' };
    }

    if (startInfo.type === 'arrow_open') {
      // -- xyz -->  - take arrow type form ending
      startInfo.type = info.type;
    } else {
      // x-- xyz -->  - not supported
      if (startInfo.type !== info.type) return { type: 'INVALID', stroke: 'INVALID' };

      startInfo.type = 'double_' + startInfo.type;
    }

    if (startInfo.type === 'double_arrow') {
      startInfo.type = 'double_arrow_point';
    }

    return startInfo;
  }

  return info;
};

export default {
  addVertex,
  addLink,
  updateLinkInterpolate,
  updateLink,
  addClass,
  setDirection,
  setClass,
  getTooltip,
  setClickEvent,
  setLink,
  bindFunctions,
  getDirection,
  getVertices,
  getEdges,
  getClasses,
  clear,
  defaultStyle,
  addSubGraph,
  getDepthFirstPos,
  indexNodes,
  getSubGraphs,
  destructLink,
  lex: {
    firstGraph
  }
};
