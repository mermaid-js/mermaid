import { select } from 'd3';
import utils from '../../utils';
import * as configApi from '../../config';
import common from '../common/common';
import mermaidAPI from '../../mermaidAPI';
import { log } from '../../logger';

const MERMAID_DOM_ID_PREFIX = 'flowchart-';
let vertexCounter = 0;
let config = configApi.getConfig();
let vertices = {};
let edges = [];
let classes = [];
let subGraphs = [];
let subGraphLookup = {};
let tooltips = {};
let subCount = 0;
let firstGraphFlag = true;
let direction;

let version; // As in graph

// Functions to be run after graph rendering
let funs = [];

export const parseDirective = function (statement, context, type) {
  mermaidAPI.parseDirective(this, statement, context, type);
};

/**
 * Function to lookup domId from id in the graph definition.
 * @param id
 * @public
 */
export const lookUpDomId = function (id) {
  const veritceKeys = Object.keys(vertices);
  for (let i = 0; i < veritceKeys.length; i++) {
    if (vertices[veritceKeys[i]].id === id) {
      return vertices[veritceKeys[i]].domId;
    }
  }
  return id;
};

/**
 * Function called by parser when a node definition has been found
 * @param id
 * @param text
 * @param type
 * @param style
 * @param classes
 */
export const addVertex = function (_id, text, type, style, classes, dir) {
  let txt;
  let id = _id;
  if (typeof id === 'undefined') {
    return;
  }
  if (id.trim().length === 0) {
    return;
  }

  // if (id[0].match(/\d/)) id = MERMAID_DOM_ID_PREFIX + id;

  if (typeof vertices[id] === 'undefined') {
    vertices[id] = {
      id: id,
      domId: MERMAID_DOM_ID_PREFIX + id + '-' + vertexCounter,
      styles: [],
      classes: [],
    };
  }
  vertexCounter++;
  if (typeof text !== 'undefined') {
    config = configApi.getConfig();
    txt = common.sanitizeText(text.trim(), config);

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
      style.forEach(function (s) {
        vertices[id].styles.push(s);
      });
    }
  }
  if (typeof classes !== 'undefined') {
    if (classes !== null) {
      classes.forEach(function (s) {
        vertices[id].classes.push(s);
      });
    }
  }
  if (typeof dir !== 'undefined') {
    vertices[id].dir = dir;
  }
};

/**
 * Function called by parser when a link/edge definition has been found
 * @param start
 * @param end
 * @param type
 * @param linktext
 */
export const addSingleLink = function (_start, _end, type, linktext) {
  let start = _start;
  let end = _end;
  // if (start[0].match(/\d/)) start = MERMAID_DOM_ID_PREFIX + start;
  // if (end[0].match(/\d/)) end = MERMAID_DOM_ID_PREFIX + end;
  // log.info('Got edge...', start, end);

  const edge = { start: start, end: end, type: undefined, text: '' };
  linktext = type.text;

  if (typeof linktext !== 'undefined') {
    edge.text = common.sanitizeText(linktext.trim(), config);

    // strip quotes if string starts and exnds with a quote
    if (edge.text[0] === '"' && edge.text[edge.text.length - 1] === '"') {
      edge.text = edge.text.substring(1, edge.text.length - 1);
    }
  }

  if (typeof type !== 'undefined') {
    edge.type = type.type;
    edge.stroke = type.stroke;
    edge.length = type.length;
  }
  edges.push(edge);
};
export const addLink = function (_start, _end, type, linktext) {
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
export const updateLinkInterpolate = function (positions, interp) {
  positions.forEach(function (pos) {
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
export const updateLink = function (positions, style) {
  positions.forEach(function (pos) {
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

export const addClass = function (id, style) {
  if (typeof classes[id] === 'undefined') {
    classes[id] = { id: id, styles: [], textStyles: [] };
  }

  if (typeof style !== 'undefined') {
    if (style !== null) {
      style.forEach(function (s) {
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
export const setDirection = function (dir) {
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
export const setClass = function (ids, className) {
  ids.split(',').forEach(function (_id) {
    // let id = version === 'gen-2' ? lookUpDomId(_id) : _id;
    let id = _id;
    // if (_id[0].match(/\d/)) id = MERMAID_DOM_ID_PREFIX + id;
    if (typeof vertices[id] !== 'undefined') {
      vertices[id].classes.push(className);
    }

    if (typeof subGraphLookup[id] !== 'undefined') {
      subGraphLookup[id].classes.push(className);
    }
  });
};

const setTooltip = function (ids, tooltip) {
  ids.split(',').forEach(function (id) {
    if (typeof tooltip !== 'undefined') {
      tooltips[version === 'gen-1' ? lookUpDomId(id) : id] = common.sanitizeText(tooltip, config);
    }
  });
};

const setClickFun = function (id, functionName, functionArgs) {
  let domId = lookUpDomId(id);
  // if (_id[0].match(/\d/)) id = MERMAID_DOM_ID_PREFIX + id;
  if (configApi.getConfig().securityLevel !== 'loose') {
    return;
  }
  if (typeof functionName === 'undefined') {
    return;
  }
  let argList = [];
  if (typeof functionArgs === 'string') {
    /* Splits functionArgs by ',', ignoring all ',' in double quoted strings */
    argList = functionArgs.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    for (let i = 0; i < argList.length; i++) {
      let item = argList[i].trim();
      /* Removes all double quotes at the start and end of an argument */
      /* This preserves all starting and ending whitespace inside */
      if (item.charAt(0) === '"' && item.charAt(item.length - 1) === '"') {
        item = item.substr(1, item.length - 2);
      }
      argList[i] = item;
    }
  }

  /* if no arguments passed into callback, default to passing in id */
  if (argList.length === 0) {
    argList.push(id);
  }

  if (typeof vertices[id] !== 'undefined') {
    vertices[id].haveCallback = true;
    funs.push(function () {
      const elem = document.querySelector(`[id="${domId}"]`);
      if (elem !== null) {
        elem.addEventListener(
          'click',
          function () {
            utils.runFunc(functionName, ...argList);
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
 */
export const setLink = function (ids, linkStr, target) {
  ids.split(',').forEach(function (id) {
    if (typeof vertices[id] !== 'undefined') {
      vertices[id].link = utils.formatUrl(linkStr, config);
      vertices[id].linkTarget = target;
    }
  });
  setClass(ids, 'clickable');
};
export const getTooltip = function (id) {
  return tooltips[id];
};

/**
 * Called by parser when a click definition is found. Registers an event handler.
 * @param ids Comma separated list of ids
 * @param functionName Function to be called on click
 * @param tooltip Tooltip for the clickable element
 */
export const setClickEvent = function (ids, functionName, functionArgs) {
  ids.split(',').forEach(function (id) {
    setClickFun(id, functionName, functionArgs);
  });
  setClass(ids, 'clickable');
};

export const bindFunctions = function (element) {
  funs.forEach(function (fun) {
    fun(element);
  });
};
export const getDirection = function () {
  return direction.trim();
};
/**
 * Retrieval function for fetching the found nodes after parsing has completed.
 * @returns {{}|*|vertices}
 */
export const getVertices = function () {
  return vertices;
};

/**
 * Retrieval function for fetching the found links after parsing has completed.
 * @returns {{}|*|edges}
 */
export const getEdges = function () {
  return edges;
};

/**
 * Retrieval function for fetching the found class definitions after parsing has completed.
 * @returns {{}|*|classes}
 */
export const getClasses = function () {
  return classes;
};

const setupToolTips = function (element) {
  let tooltipElem = select('.mermaidTooltip');
  if ((tooltipElem._groups || tooltipElem)[0][0] === null) {
    tooltipElem = select('body').append('div').attr('class', 'mermaidTooltip').style('opacity', 0);
  }

  const svg = select(element).select('svg');

  const nodes = svg.selectAll('g.node');
  nodes
    .on('mouseover', function () {
      const el = select(this);
      const title = el.attr('title');

      // Dont try to draw a tooltip if no data is provided
      if (title === null) {
        return;
      }
      const rect = this.getBoundingClientRect();

      tooltipElem.transition().duration(200).style('opacity', '.9');
      tooltipElem
        .html(el.attr('title'))
        .style('left', window.scrollX + rect.left + (rect.right - rect.left) / 2 + 'px')
        .style('top', window.scrollY + rect.top - 14 + document.body.scrollTop + 'px');
      el.classed('hover', true);
    })
    .on('mouseout', function () {
      tooltipElem.transition().duration(500).style('opacity', 0);
      const el = select(this);
      el.classed('hover', false);
    });
};
funs.push(setupToolTips);

/**
 * Clears the internal graph db so that a new graph can be parsed.
 */
export const clear = function (ver) {
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
  version = ver || 'gen-1';
};
export const setGen = (ver) => {
  version = ver || 'gen-1';
};
/**
 *
 * @returns {string}
 */
export const defaultStyle = function () {
  return 'fill:#ffa;stroke: #f66; stroke-width: 3px; stroke-dasharray: 5, 5;fill:#ffa;stroke: #666;';
};

/**
 * Clears the internal graph db so that a new graph can be parsed.
 */
export const addSubGraph = function (_id, list, _title) {
  // console.log('addSubGraph', _id, list, _title);
  let id = _id.trim();
  let title = _title;
  if (_id === _title && _title.match(/\s/)) {
    id = undefined;
  }
  function uniq(a) {
    const prims = { boolean: {}, number: {}, string: {} };
    const objs = [];

    let dir; //  = unbdefined; direction.trim();
    const nodeList = a.filter(function (item) {
      const type = typeof item;
      if (item.stmt && item.stmt === 'dir') {
        dir = item.value;
        return false;
      }
      if (item.trim() === '') {
        return false;
      }
      if (type in prims) {
        return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true); // eslint-disable-line
      } else {
        return objs.indexOf(item) >= 0 ? false : objs.push(item);
      }
    });
    return { nodeList, dir };
  }

  let nodeList = [];

  const { nodeList: nl, dir } = uniq(nodeList.concat.apply(nodeList, list));
  nodeList = nl;
  if (version === 'gen-1') {
    log.warn('LOOKING UP');
    for (let i = 0; i < nodeList.length; i++) {
      nodeList[i] = lookUpDomId(nodeList[i]);
    }
  }

  id = id || 'subGraph' + subCount;
  // if (id[0].match(/\d/)) id = lookUpDomId(id);
  title = title || '';
  title = common.sanitizeText(title, config);
  subCount = subCount + 1;
  const subGraph = { id: id, nodes: nodeList, title: title.trim(), classes: [], dir };

  log.info('Adding', subGraph.id, subGraph.nodes, subGraph.dir);

  /**
   * Deletes an id from all subgraphs
   */
  // const del = _id => {
  //   subGraphs.forEach(sg => {
  //     const pos = sg.nodes.indexOf(_id);
  //     if (pos >= 0) {
  //       sg.nodes.splice(pos, 1);
  //     }
  //   });
  // };

  // // Removes the members of this subgraph from any other subgraphs, a node only belong to one subgraph
  // subGraph.nodes.forEach(_id => del(_id));

  // Remove the members in the new subgraph if they already belong to another subgraph
  subGraph.nodes = makeUniq(subGraph, subGraphs).nodes;
  subGraphs.push(subGraph);
  subGraphLookup[id] = subGraph;
  return id;
};

const getPosForId = function (id) {
  for (let i = 0; i < subGraphs.length; i++) {
    if (subGraphs[i].id === id) {
      return i;
    }
  }
  return -1;
};
let secCount = -1;
const posCrossRef = [];
const indexNodes2 = function (id, pos) {
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
      count: 0,
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
          count: posCount + res.count,
        };
      } else {
        posCount = posCount + res.count;
      }
    }
    count = count + 1;
  }

  return {
    result: false,
    count: posCount,
  };
};

export const getDepthFirstPos = function (pos) {
  return posCrossRef[pos];
};
export const indexNodes = function () {
  secCount = -1;
  if (subGraphs.length > 0) {
    indexNodes2('none', subGraphs.length - 1, 0);
  }
};

export const getSubGraphs = function () {
  return subGraphs;
};

export const firstGraph = () => {
  if (firstGraphFlag) {
    firstGraphFlag = false;
    return true;
  }
  return false;
};

const destructStartLink = (_str) => {
  let str = _str.trim();
  let type = 'arrow_open';

  switch (str[0]) {
    case '<':
      type = 'arrow_point';
      str = str.slice(1);
      break;
    case 'x':
      type = 'arrow_cross';
      str = str.slice(1);
      break;
    case 'o':
      type = 'arrow_circle';
      str = str.slice(1);
      break;
  }

  let stroke = 'normal';

  if (str.indexOf('=') !== -1) {
    stroke = 'thick';
  }

  if (str.indexOf('.') !== -1) {
    stroke = 'dotted';
  }

  return { type, stroke };
};

const countChar = (char, str) => {
  const length = str.length;
  let count = 0;
  for (let i = 0; i < length; ++i) {
    if (str[i] === char) {
      ++count;
    }
  }
  return count;
};

const destructEndLink = (_str) => {
  const str = _str.trim();
  let line = str.slice(0, -1);
  let type = 'arrow_open';

  switch (str.slice(-1)) {
    case 'x':
      type = 'arrow_cross';
      if (str[0] === 'x') {
        type = 'double_' + type;
        line = line.slice(1);
      }
      break;
    case '>':
      type = 'arrow_point';
      if (str[0] === '<') {
        type = 'double_' + type;
        line = line.slice(1);
      }
      break;
    case 'o':
      type = 'arrow_circle';
      if (str[0] === 'o') {
        type = 'double_' + type;
        line = line.slice(1);
      }
      break;
  }

  let stroke = 'normal';
  let length = line.length - 1;

  if (line[0] === '=') {
    stroke = 'thick';
  }

  let dots = countChar('.', line);

  if (dots) {
    stroke = 'dotted';
    length = dots;
  }

  return { type, stroke, length };
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
      // -- xyz -->  - take arrow type from ending
      startInfo.type = info.type;
    } else {
      // x-- xyz -->  - not supported
      if (startInfo.type !== info.type) return { type: 'INVALID', stroke: 'INVALID' };

      startInfo.type = 'double_' + startInfo.type;
    }

    if (startInfo.type === 'double_arrow') {
      startInfo.type = 'double_arrow_point';
    }

    startInfo.length = info.length;
    return startInfo;
  }

  return info;
};

// Todo optimizer this by caching existing nodes
const exists = (allSgs, _id) => {
  let res = false;
  allSgs.forEach((sg) => {
    const pos = sg.nodes.indexOf(_id);
    if (pos >= 0) {
      res = true;
    }
  });
  return res;
};
/**
 * Deletes an id from all subgraphs
 */
const makeUniq = (sg, allSubgraphs) => {
  const res = [];
  sg.nodes.forEach((_id, pos) => {
    if (!exists(allSubgraphs, _id)) {
      res.push(sg.nodes[pos]);
    }
  });
  return { nodes: res };
};

export default {
  parseDirective,
  defaultConfig: () => configApi.defaultConfig.flowchart,
  addVertex,
  lookUpDomId,
  addLink,
  updateLinkInterpolate,
  updateLink,
  addClass,
  setDirection,
  setClass,
  setTooltip,
  getTooltip,
  setClickEvent,
  setLink,
  bindFunctions,
  getDirection,
  getVertices,
  getEdges,
  getClasses,
  clear,
  setGen,
  defaultStyle,
  addSubGraph,
  getDepthFirstPos,
  indexNodes,
  getSubGraphs,
  destructLink,
  lex: {
    firstGraph,
  },
  exists,
  makeUniq,
};
