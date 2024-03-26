import { select } from 'd3';
import utils from '../../utils.js';
import { getConfig, defaultConfig } from '../../diagram-api/diagramAPI.js';
import common from '../common/common.js';
import { log } from '../../logger.js';
import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
  setDiagramTitle,
  getDiagramTitle,
} from '../common/commonDb.js';
import type { FlowVertex, FlowClass, FlowSubGraph, FlowText, FlowEdge, FlowLink } from './types.js';

const MERMAID_DOM_ID_PREFIX = 'flowchart-';
let vertexCounter = 0;
let config = getConfig();
let vertices: Record<string, FlowVertex> = {};
let edges: FlowEdge[] & { defaultInterpolate?: string; defaultStyle?: string[] } = [];
let classes: Record<string, FlowClass> = {};
let subGraphs: FlowSubGraph[] = [];
let subGraphLookup: Record<string, FlowSubGraph> = {};
let tooltips: Record<string, string> = {};
let subCount = 0;
let firstGraphFlag = true;
let direction: string;

let version: string; // As in graph

// Functions to be run after graph rendering
let funs: ((element: Element) => void)[] = []; // cspell:ignore funs

const sanitizeText = (txt: string) => common.sanitizeText(txt, config);

/**
 * Function to lookup domId from id in the graph definition.
 *
 * @param id - id of the node
 */
export const lookUpDomId = function (id: string) {
  const vertexKeys = Object.keys(vertices);
  for (const vertexKey of vertexKeys) {
    if (vertices[vertexKey].id === id) {
      return vertices[vertexKey].domId;
    }
  }
  return id;
};

/**
 * Function called by parser when a node definition has been found
 *
 */
export const addVertex = function (
  id: string,
  textObj: FlowText,
  type: 'group',
  style: string[],
  classes: string[],
  dir: string,
  props = {}
) {
  if (!id || id.trim().length === 0) {
    return;
  }
  let txt;

  if (vertices[id] === undefined) {
    vertices[id] = {
      id,
      labelType: 'text',
      domId: MERMAID_DOM_ID_PREFIX + id + '-' + vertexCounter,
      styles: [],
      classes: [],
    };
  }
  vertexCounter++;
  if (textObj !== undefined) {
    config = getConfig();
    txt = sanitizeText(textObj.text.trim());
    vertices[id].labelType = textObj.type;
    // strip quotes if string starts and ends with a quote
    if (txt[0] === '"' && txt[txt.length - 1] === '"') {
      txt = txt.substring(1, txt.length - 1);
    }
    vertices[id].text = txt;
  } else {
    if (vertices[id].text === undefined) {
      vertices[id].text = id;
    }
  }
  if (type !== undefined) {
    vertices[id].type = type;
  }
  if (style !== undefined && style !== null) {
    style.forEach(function (s) {
      vertices[id].styles.push(s);
    });
  }
  if (classes !== undefined && classes !== null) {
    classes.forEach(function (s) {
      vertices[id].classes.push(s);
    });
  }
  if (dir !== undefined) {
    vertices[id].dir = dir;
  }
  if (vertices[id].props === undefined) {
    vertices[id].props = props;
  } else if (props !== undefined) {
    Object.assign(vertices[id].props, props);
  }
};

/**
 * Function called by parser when a link/edge definition has been found
 *
 */
export const addSingleLink = function (_start: string, _end: string, type: any) {
  const start = _start;
  const end = _end;

  const edge: FlowEdge = { start: start, end: end, type: undefined, text: '', labelType: 'text' };
  log.info('abc78 Got edge...', edge);
  const linkTextObj = type.text;

  if (linkTextObj !== undefined) {
    edge.text = sanitizeText(linkTextObj.text.trim());

    // strip quotes if string starts and ends with a quote
    if (edge.text[0] === '"' && edge.text[edge.text.length - 1] === '"') {
      edge.text = edge.text.substring(1, edge.text.length - 1);
    }
    edge.labelType = linkTextObj.type;
  }

  if (type !== undefined) {
    edge.type = type.type;
    edge.stroke = type.stroke;
    edge.length = type.length > 10 ? 10 : type.length;
  }

  if (edges.length < (config.maxEdges ?? 500)) {
    log.info('Pushing edge...');
    edges.push(edge);
  } else {
    throw new Error(
      `Edge limit exceeded. ${edges.length} edges found, but the limit is ${config.maxEdges}.

Initialize mermaid with maxEdges set to a higher number to allow more edges.
You cannot set this config via configuration inside the diagram as it is a secure config.
You have to call mermaid.initialize.`
    );
  }
};

export const addLink = function (_start: string[], _end: string[], type: unknown) {
  log.info('addLink', _start, _end, type);
  for (const start of _start) {
    for (const end of _end) {
      addSingleLink(start, end, type);
    }
  }
};

/**
 * Updates a link's line interpolation algorithm
 *
 */
export const updateLinkInterpolate = function (
  positions: ('default' | number)[],
  interpolate: string
) {
  positions.forEach(function (pos) {
    if (pos === 'default') {
      edges.defaultInterpolate = interpolate;
    } else {
      edges[pos].interpolate = interpolate;
    }
  });
};

/**
 * Updates a link with a style
 *
 */
export const updateLink = function (positions: ('default' | number)[], style: string[]) {
  positions.forEach(function (pos) {
    if (typeof pos === 'number' && pos >= edges.length) {
      throw new Error(
        `The index ${pos} for linkStyle is out of bounds. Valid indices for linkStyle are between 0 and ${
          edges.length - 1
        }. (Help: Ensure that the index is within the range of existing edges.)`
      );
    }
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

export const addClass = function (ids: string, style: string[]) {
  ids.split(',').forEach(function (id) {
    if (classes[id] === undefined) {
      classes[id] = { id, styles: [], textStyles: [] };
    }

    if (style !== undefined && style !== null) {
      style.forEach(function (s) {
        if (s.match('color')) {
          const newStyle = s.replace('fill', 'bgFill').replace('color', 'fill');
          classes[id].textStyles.push(newStyle);
        }
        classes[id].styles.push(s);
      });
    }
  });
};

/**
 * Called by parser when a graph definition is found, stores the direction of the chart.
 *
 */
export const setDirection = function (dir: string) {
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
  if (direction === 'TD') {
    direction = 'TB';
  }
};

/**
 * Called by parser when a special node is found, e.g. a clickable element.
 *
 * @param ids - Comma separated list of ids
 * @param className - Class to add
 */
export const setClass = function (ids: string, className: string) {
  for (const id of ids.split(',')) {
    if (vertices[id]) {
      vertices[id].classes.push(className);
    }
    if (subGraphLookup[id]) {
      subGraphLookup[id].classes.push(className);
    }
  }
};

const setTooltip = function (ids: string, tooltip: string) {
  if (tooltip === undefined) {
    return;
  }
  tooltip = sanitizeText(tooltip);
  for (const id of ids.split(',')) {
    tooltips[version === 'gen-1' ? lookUpDomId(id) : id] = tooltip;
  }
};

const setClickFun = function (id: string, functionName: string, functionArgs: string) {
  const domId = lookUpDomId(id);
  // if (_id[0].match(/\d/)) id = MERMAID_DOM_ID_PREFIX + id;
  if (getConfig().securityLevel !== 'loose') {
    return;
  }
  if (functionName === undefined) {
    return;
  }
  let argList: string[] = [];
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

  if (vertices[id] !== undefined) {
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
 *
 * @param ids - Comma separated list of ids
 * @param linkStr - URL to create a link for
 * @param target - Target attribute for the link
 */
export const setLink = function (ids: string, linkStr: string, target: string) {
  ids.split(',').forEach(function (id) {
    if (vertices[id] !== undefined) {
      vertices[id].link = utils.formatUrl(linkStr, config);
      vertices[id].linkTarget = target;
    }
  });
  setClass(ids, 'clickable');
};

export const getTooltip = function (id: string) {
  if (tooltips.hasOwnProperty(id)) {
    return tooltips[id];
  }
  return undefined;
};

/**
 * Called by parser when a click definition is found. Registers an event handler.
 *
 * @param ids - Comma separated list of ids
 * @param functionName - Function to be called on click
 * @param functionArgs - Arguments to be passed to the function
 */
export const setClickEvent = function (ids: string, functionName: string, functionArgs: string) {
  ids.split(',').forEach(function (id) {
    setClickFun(id, functionName, functionArgs);
  });
  setClass(ids, 'clickable');
};

export const bindFunctions = function (element: Element) {
  funs.forEach(function (fun) {
    fun(element);
  });
};
export const getDirection = function () {
  return direction.trim();
};
/**
 * Retrieval function for fetching the found nodes after parsing has completed.
 *
 */
export const getVertices = function () {
  return vertices;
};

/**
 * Retrieval function for fetching the found links after parsing has completed.
 *
 */
export const getEdges = function () {
  return edges;
};

/**
 * Retrieval function for fetching the found class definitions after parsing has completed.
 *
 */
export const getClasses = function () {
  return classes;
};

const setupToolTips = function (element: Element) {
  let tooltipElem = select('.mermaidTooltip');
  // @ts-ignore TODO: fix this
  if ((tooltipElem._groups || tooltipElem)[0][0] === null) {
    // @ts-ignore TODO: fix this
    tooltipElem = select('body').append('div').attr('class', 'mermaidTooltip').style('opacity', 0);
  }

  const svg = select(element).select('svg');

  const nodes = svg.selectAll('g.node');
  nodes
    .on('mouseover', function () {
      const el = select(this);
      const title = el.attr('title');

      // Don't try to draw a tooltip if no data is provided
      if (title === null) {
        return;
      }
      const rect = (this as Element)?.getBoundingClientRect();

      // @ts-ignore TODO: fix this
      tooltipElem.transition().duration(200).style('opacity', '.9');
      tooltipElem
        .text(el.attr('title'))
        .style('left', window.scrollX + rect.left + (rect.right - rect.left) / 2 + 'px')
        .style('top', window.scrollY + rect.bottom + 'px');
      tooltipElem.html(tooltipElem.html().replace(/&lt;br\/&gt;/g, '<br/>'));
      el.classed('hover', true);
    })
    .on('mouseout', function () {
      // @ts-ignore TODO: fix this
      tooltipElem.transition().duration(500).style('opacity', 0);
      const el = select(this);
      el.classed('hover', false);
    });
};
funs.push(setupToolTips);

/**
 * Clears the internal graph db so that a new graph can be parsed.
 *
 */
export const clear = function (ver = 'gen-1') {
  vertices = {};
  classes = {};
  edges = [];
  funs = [setupToolTips];
  subGraphs = [];
  subGraphLookup = {};
  subCount = 0;
  tooltips = {};
  firstGraphFlag = true;
  version = ver;
  config = getConfig();
  commonClear();
};

export const setGen = (ver: string) => {
  version = ver || 'gen-2';
};

export const defaultStyle = function () {
  return 'fill:#ffa;stroke: #f66; stroke-width: 3px; stroke-dasharray: 5, 5;fill:#ffa;stroke: #666;';
};

export const addSubGraph = function (
  _id: { text: string },
  list: string[],
  _title: { text: string; type: string }
) {
  let id: string | undefined = _id.text.trim();
  let title = _title.text;
  if (_id === _title && _title.text.match(/\s/)) {
    id = undefined;
  }

  function uniq(a: any[]) {
    const prims: any = { boolean: {}, number: {}, string: {} };
    const objs: any[] = [];

    let dir; //  = undefined; direction.trim();
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
        return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true);
      } else {
        return objs.includes(item) ? false : objs.push(item);
      }
    });
    return { nodeList, dir };
  }

  const { nodeList, dir } = uniq(list.flat());
  if (version === 'gen-1') {
    for (let i = 0; i < nodeList.length; i++) {
      nodeList[i] = lookUpDomId(nodeList[i]);
    }
  }

  id = id || 'subGraph' + subCount;
  title = title || '';
  title = sanitizeText(title);
  subCount = subCount + 1;
  const subGraph = {
    id: id,
    nodes: nodeList,
    title: title.trim(),
    classes: [],
    dir,
    labelType: _title.type,
  };

  log.info('Adding', subGraph.id, subGraph.nodes, subGraph.dir);

  // Remove the members in the new subgraph if they already belong to another subgraph
  subGraph.nodes = makeUniq(subGraph, subGraphs).nodes;
  subGraphs.push(subGraph);
  subGraphLookup[id] = subGraph;
  return id;
};

const getPosForId = function (id: string) {
  for (const [i, subGraph] of subGraphs.entries()) {
    if (subGraph.id === id) {
      return i;
    }
  }
  return -1;
};
let secCount = -1;
const posCrossRef: number[] = [];
const indexNodes2 = function (id: string, pos: number): { result: boolean; count: number } {
  const nodes = subGraphs[pos].nodes;
  secCount = secCount + 1;
  if (secCount > 2000) {
    return {
      result: false,
      count: 0,
    };
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

export const getDepthFirstPos = function (pos: number) {
  return posCrossRef[pos];
};
export const indexNodes = function () {
  secCount = -1;
  if (subGraphs.length > 0) {
    indexNodes2('none', subGraphs.length - 1);
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

const destructStartLink = (_str: string): FlowLink => {
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

  if (str.includes('=')) {
    stroke = 'thick';
  }

  if (str.includes('.')) {
    stroke = 'dotted';
  }

  return { type, stroke };
};

const countChar = (char: string, str: string) => {
  const length = str.length;
  let count = 0;
  for (let i = 0; i < length; ++i) {
    if (str[i] === char) {
      ++count;
    }
  }
  return count;
};

const destructEndLink = (_str: string) => {
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

  if (line[0] === '~') {
    stroke = 'invisible';
  }

  const dots = countChar('.', line);

  if (dots) {
    stroke = 'dotted';
    length = dots;
  }

  return { type, stroke, length };
};

export const destructLink = (_str: string, _startStr: string) => {
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
      if (startInfo.type !== info.type) {
        return { type: 'INVALID', stroke: 'INVALID' };
      }

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
const exists = (allSgs: FlowSubGraph[], _id: string) => {
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
 *
 */
const makeUniq = (sg: FlowSubGraph, allSubgraphs: FlowSubGraph[]) => {
  const res: string[] = [];
  sg.nodes.forEach((_id, pos) => {
    if (!exists(allSubgraphs, _id)) {
      res.push(sg.nodes[pos]);
    }
  });
  return { nodes: res };
};

export const lex = {
  firstGraph,
};

export default {
  defaultConfig: () => defaultConfig.flowchart,
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
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
  lex,
  exists,
  makeUniq,
  setDiagramTitle,
  getDiagramTitle,
};
