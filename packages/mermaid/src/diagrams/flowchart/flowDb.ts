import { select } from 'd3';
import utils, { getEdgeId } from '../../utils.js';
import { getConfig, defaultConfig } from '../../diagram-api/diagramAPI.js';
import common from '../common/common.js';
import { isValidShape, type ShapeID } from '../../rendering-util/rendering-elements/shapes.js';
import type { Node, Edge } from '../../rendering-util/types.js';
import { log } from '../../logger.js';
import * as yaml from 'js-yaml';
import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
  setDiagramTitle,
  getDiagramTitle,
} from '../common/commonDb.js';
import type {
  FlowVertex,
  FlowClass,
  FlowSubGraph,
  FlowText,
  FlowEdge,
  FlowLink,
  FlowVertexTypeParam,
} from './types.js';
import type { NodeMetaData, EdgeMetaData } from '../../types.js';

const MERMAID_DOM_ID_PREFIX = 'flowchart-';
let vertexCounter = 0;
let config = getConfig();
let vertices = new Map<string, FlowVertex>();
let edges: FlowEdge[] & { defaultInterpolate?: string; defaultStyle?: string[] } = [];
let classes = new Map<string, FlowClass>();
let subGraphs: FlowSubGraph[] = [];
let subGraphLookup = new Map<string, FlowSubGraph>();
let tooltips = new Map<string, string>();
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
  for (const vertex of vertices.values()) {
    if (vertex.id === id) {
      return vertex.domId;
    }
  }
  return id;
};

/**
 * Function called by parser when a node definition has been found
 */
export const addVertex = function (
  id: string,
  textObj: FlowText,
  type: FlowVertexTypeParam,
  style: string[],
  classes: string[],
  dir: string,
  props = {},
  metadata: any
) {
  if (!id || id.trim().length === 0) {
    return;
  }
  // Extract the metadata from the shapeData, the syntax for adding metadata for nodes and edges is the same
  // so at this point we don't know if it's a node or an edge, but we can still extract the metadata
  let doc;
  if (metadata !== undefined) {
    let yamlData;
    // detect if shapeData contains a newline character
    if (!metadata.includes('\n')) {
      yamlData = '{\n' + metadata + '\n}';
    } else {
      yamlData = metadata + '\n';
    }
    doc = yaml.load(yamlData, { schema: yaml.JSON_SCHEMA }) as NodeMetaData;
  }

  // Check if this is an edge
  const edge = edges.find((e) => e.id === id);
  if (edge) {
    const edgeDoc = doc as EdgeMetaData;
    if (edgeDoc?.animate) {
      edge.animate = edgeDoc.animate;
    }
    if (edgeDoc?.animation) {
      edge.animation = edgeDoc.animation;
    }
    return;
  }

  let txt;

  let vertex = vertices.get(id);
  if (vertex === undefined) {
    vertex = {
      id,
      labelType: 'text',
      domId: MERMAID_DOM_ID_PREFIX + id + '-' + vertexCounter,
      styles: [],
      classes: [],
    };
    vertices.set(id, vertex);
  }
  vertexCounter++;

  if (textObj !== undefined) {
    config = getConfig();
    txt = sanitizeText(textObj.text.trim());
    vertex.labelType = textObj.type;
    // strip quotes if string starts and ends with a quote
    if (txt.startsWith('"') && txt.endsWith('"')) {
      txt = txt.substring(1, txt.length - 1);
    }
    vertex.text = txt;
  } else {
    if (vertex.text === undefined) {
      vertex.text = id;
    }
  }
  if (type !== undefined) {
    vertex.type = type;
  }
  if (style !== undefined && style !== null) {
    style.forEach(function (s) {
      vertex.styles.push(s);
    });
  }
  if (classes !== undefined && classes !== null) {
    classes.forEach(function (s) {
      vertex.classes.push(s);
    });
  }
  if (dir !== undefined) {
    vertex.dir = dir;
  }
  if (vertex.props === undefined) {
    vertex.props = props;
  } else if (props !== undefined) {
    Object.assign(vertex.props, props);
  }

  if (doc !== undefined) {
    if (doc.shape) {
      if (doc.shape !== doc.shape.toLowerCase() || doc.shape.includes('_')) {
        throw new Error(`No such shape: ${doc.shape}. Shape names should be lowercase.`);
      } else if (!isValidShape(doc.shape)) {
        throw new Error(`No such shape: ${doc.shape}.`);
      }
      vertex.type = doc?.shape;
    }

    if (doc?.label) {
      vertex.text = doc?.label;
    }
    if (doc?.icon) {
      vertex.icon = doc?.icon;
      if (!doc.label?.trim() && vertex.text === id) {
        vertex.text = '';
      }
    }
    if (doc?.form) {
      vertex.form = doc?.form;
    }
    if (doc?.pos) {
      vertex.pos = doc?.pos;
    }
    if (doc?.img) {
      vertex.img = doc?.img;
      if (!doc.label?.trim() && vertex.text === id) {
        vertex.text = '';
      }
    }
    if (doc?.constraint) {
      vertex.constraint = doc.constraint;
    }
    if (doc.w) {
      vertex.assetWidth = Number(doc.w);
    }
    if (doc.h) {
      vertex.assetHeight = Number(doc.h);
    }
  }
};

/**
 * Function called by parser when a link/edge definition has been found
 *
 */
export const addSingleLink = function (_start: string, _end: string, type: any, id?: string) {
  const start = _start;
  const end = _end;

  const edge: FlowEdge = {
    start: start,
    end: end,
    type: undefined,
    text: '',
    labelType: 'text',
    classes: [],
  };
  log.info('abc78 Got edge...', edge);
  const linkTextObj = type.text;

  if (linkTextObj !== undefined) {
    edge.text = sanitizeText(linkTextObj.text.trim());

    // strip quotes if string starts and ends with a quote
    if (edge.text.startsWith('"') && edge.text.endsWith('"')) {
      edge.text = edge.text.substring(1, edge.text.length - 1);
    }
    edge.labelType = linkTextObj.type;
  }

  if (type !== undefined) {
    edge.type = type.type;
    edge.stroke = type.stroke;
    edge.length = type.length > 10 ? 10 : type.length;
  }
  if (id) {
    edge.id = id;
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

interface LinkData {
  id: string;
}

function isLinkData(value: unknown): value is LinkData {
  return (
    value !== null &&
    typeof value === 'object' &&
    'id' in value &&
    typeof (value as LinkData).id === 'string'
  );
}

export const addLink = function (_start: string[], _end: string[], linkData: unknown) {
  const id = isLinkData(linkData) ? linkData.id.replace('@', '') : undefined;

  log.info('addLink', _start, _end, id);

  for (const start of _start) {
    for (const end of _end) {
      addSingleLink(start, end, linkData, id);
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
      edges[pos].style = style;
      // if edges[pos].style does have fill not set, set it to none
      if (
        (edges[pos]?.style?.length ?? 0) > 0 &&
        !edges[pos]?.style?.some((s) => s?.startsWith('fill'))
      ) {
        edges[pos]?.style?.push('fill:none');
      }
    }
  });
};

export const addClass = function (ids: string, _style: string[]) {
  const style = _style
    .join()
    .replace(/\\,/g, '§§§')
    .replace(/,/g, ';')
    .replace(/§§§/g, ',')
    .split(';');
  ids.split(',').forEach(function (id) {
    let classNode = classes.get(id);
    if (classNode === undefined) {
      classNode = { id, styles: [], textStyles: [] };
      classes.set(id, classNode);
    }

    if (style !== undefined && style !== null) {
      style.forEach(function (s) {
        if (/color/.exec(s)) {
          const newStyle = s.replace('fill', 'bgFill'); // .replace('color', 'fill');
          classNode.textStyles.push(newStyle);
        }
        classNode.styles.push(s);
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
  if (/.*</.exec(direction)) {
    direction = 'RL';
  }
  if (/.*\^/.exec(direction)) {
    direction = 'BT';
  }
  if (/.*>/.exec(direction)) {
    direction = 'LR';
  }
  if (/.*v/.exec(direction)) {
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
    const vertex = vertices.get(id);
    if (vertex) {
      vertex.classes.push(className);
    }
    const edge = edges.find((e) => e.id === id);
    if (edge) {
      edge.classes.push(className);
    }
    const subGraph = subGraphLookup.get(id);
    if (subGraph) {
      subGraph.classes.push(className);
    }
  }
};

const setTooltip = function (ids: string, tooltip: string) {
  if (tooltip === undefined) {
    return;
  }
  tooltip = sanitizeText(tooltip);
  for (const id of ids.split(',')) {
    tooltips.set(version === 'gen-1' ? lookUpDomId(id) : id, tooltip);
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
      if (item.startsWith('"') && item.endsWith('"')) {
        item = item.substr(1, item.length - 2);
      }
      argList[i] = item;
    }
  }

  /* if no arguments passed into callback, default to passing in id */
  if (argList.length === 0) {
    argList.push(id);
  }

  const vertex = vertices.get(id);
  if (vertex) {
    vertex.haveCallback = true;
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
    const vertex = vertices.get(id);
    if (vertex !== undefined) {
      vertex.link = utils.formatUrl(linkStr, config);
      vertex.linkTarget = target;
    }
  });
  setClass(ids, 'clickable');
};

export const getTooltip = function (id: string) {
  return tooltips.get(id);
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

      tooltipElem.transition().duration(200).style('opacity', '.9');
      tooltipElem
        .text(el.attr('title'))
        .style('left', window.scrollX + rect.left + (rect.right - rect.left) / 2 + 'px')
        .style('top', window.scrollY + rect.bottom + 'px');
      tooltipElem.html(tooltipElem.html().replace(/&lt;br\/&gt;/g, '<br/>'));
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
 *
 */
export const clear = function (ver = 'gen-1') {
  vertices = new Map();
  classes = new Map();
  edges = [];
  funs = [setupToolTips];
  subGraphs = [];
  subGraphLookup = new Map();
  subCount = 0;
  tooltips = new Map();
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
  if (_id === _title && /\s/.exec(_title.text)) {
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

  id = id ?? 'subGraph' + subCount;
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
  subGraphLookup.set(id, subGraph);
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
      if (str.startsWith('x')) {
        type = 'double_' + type;
        line = line.slice(1);
      }
      break;
    case '>':
      type = 'arrow_point';
      if (str.startsWith('<')) {
        type = 'double_' + type;
        line = line.slice(1);
      }
      break;
    case 'o':
      type = 'arrow_circle';
      if (str.startsWith('o')) {
        type = 'double_' + type;
        line = line.slice(1);
      }
      break;
  }

  let stroke = 'normal';
  let length = line.length - 1;

  if (line.startsWith('=')) {
    stroke = 'thick';
  }

  if (line.startsWith('~')) {
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
  for (const sg of allSgs) {
    if (sg.nodes.includes(_id)) {
      return true;
    }
  }
  return false;
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

const getTypeFromVertex = (vertex: FlowVertex): ShapeID => {
  if (vertex.img) {
    return 'imageSquare';
  }
  if (vertex.icon) {
    if (vertex.form === 'circle') {
      return 'iconCircle';
    }
    if (vertex.form === 'square') {
      return 'iconSquare';
    }
    if (vertex.form === 'rounded') {
      return 'iconRounded';
    }
    return 'icon';
  }
  switch (vertex.type) {
    case 'square':
    case undefined:
      return 'squareRect';
    case 'round':
      return 'roundedRect';
    case 'ellipse':
      // @ts-expect-error -- Ellipses are broken, see https://github.com/mermaid-js/mermaid/issues/5976
      return 'ellipse';
    default:
      return vertex.type;
  }
};

const findNode = (nodes: Node[], id: string) => nodes.find((node) => node.id === id);
const destructEdgeType = (type: string | undefined) => {
  let arrowTypeStart = 'none';
  let arrowTypeEnd = 'arrow_point';
  switch (type) {
    case 'arrow_point':
    case 'arrow_circle':
    case 'arrow_cross':
      arrowTypeEnd = type;
      break;

    case 'double_arrow_point':
    case 'double_arrow_circle':
    case 'double_arrow_cross':
      arrowTypeStart = type.replace('double_', '');
      arrowTypeEnd = arrowTypeStart;
      break;
  }
  return { arrowTypeStart, arrowTypeEnd };
};

const addNodeFromVertex = (
  vertex: FlowVertex,
  nodes: Node[],
  parentDB: Map<string, string>,
  subGraphDB: Map<string, boolean>,
  config: any,
  look: string
) => {
  const parentId = parentDB.get(vertex.id);
  const isGroup = subGraphDB.get(vertex.id) ?? false;

  const node = findNode(nodes, vertex.id);
  if (node) {
    node.cssStyles = vertex.styles;
    node.cssCompiledStyles = getCompiledStyles(vertex.classes);
    node.cssClasses = vertex.classes.join(' ');
  } else {
    const baseNode = {
      id: vertex.id,
      label: vertex.text,
      labelStyle: '',
      parentId,
      padding: config.flowchart?.padding || 8,
      cssStyles: vertex.styles,
      cssCompiledStyles: getCompiledStyles(['default', 'node', ...vertex.classes]),
      cssClasses: 'default ' + vertex.classes.join(' '),
      dir: vertex.dir,
      domId: vertex.domId,
      look,
      link: vertex.link,
      linkTarget: vertex.linkTarget,
      tooltip: getTooltip(vertex.id),
      icon: vertex.icon,
      pos: vertex.pos,
      img: vertex.img,
      assetWidth: vertex.assetWidth,
      assetHeight: vertex.assetHeight,
      constraint: vertex.constraint,
    };
    if (isGroup) {
      nodes.push({
        ...baseNode,
        isGroup: true,
        shape: 'rect',
      });
    } else {
      nodes.push({
        ...baseNode,
        isGroup: false,
        shape: getTypeFromVertex(vertex),
      });
    }
  }
};

function getCompiledStyles(classDefs: string[]) {
  let compiledStyles: string[] = [];
  for (const customClass of classDefs) {
    const cssClass = classes.get(customClass);
    if (cssClass?.styles) {
      compiledStyles = [...compiledStyles, ...(cssClass.styles ?? [])].map((s) => s.trim());
    }
    if (cssClass?.textStyles) {
      compiledStyles = [...compiledStyles, ...(cssClass.textStyles ?? [])].map((s) => s.trim());
    }
  }
  return compiledStyles;
}

export const getData = () => {
  const config = getConfig();
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const subGraphs = getSubGraphs();
  const parentDB = new Map<string, string>();
  const subGraphDB = new Map<string, boolean>();

  // Setup the subgraph data for adding nodes
  for (let i = subGraphs.length - 1; i >= 0; i--) {
    const subGraph = subGraphs[i];
    if (subGraph.nodes.length > 0) {
      subGraphDB.set(subGraph.id, true);
    }
    for (const id of subGraph.nodes) {
      parentDB.set(id, subGraph.id);
    }
  }

  // Data is setup, add the nodes
  for (let i = subGraphs.length - 1; i >= 0; i--) {
    const subGraph = subGraphs[i];
    nodes.push({
      id: subGraph.id,
      label: subGraph.title,
      labelStyle: '',
      parentId: parentDB.get(subGraph.id),
      padding: 8,
      cssCompiledStyles: getCompiledStyles(subGraph.classes),
      cssClasses: subGraph.classes.join(' '),
      shape: 'rect',
      dir: subGraph.dir,
      isGroup: true,
      look: config.look,
    });
  }

  const n = getVertices();
  n.forEach((vertex) => {
    addNodeFromVertex(vertex, nodes, parentDB, subGraphDB, config, config.look || 'classic');
  });

  const e = getEdges();
  e.forEach((rawEdge, index) => {
    const { arrowTypeStart, arrowTypeEnd } = destructEdgeType(rawEdge.type);
    const styles = [...(e.defaultStyle ?? [])];

    if (rawEdge.style) {
      styles.push(...rawEdge.style);
    }
    const edge: Edge = {
      id: getEdgeId(rawEdge.start, rawEdge.end, { counter: index, prefix: 'L' }, rawEdge.id),
      start: rawEdge.start,
      end: rawEdge.end,
      type: rawEdge.type ?? 'normal',
      label: rawEdge.text,
      labelpos: 'c',
      thickness: rawEdge.stroke,
      minlen: rawEdge.length,
      classes:
        rawEdge?.stroke === 'invisible'
          ? ''
          : 'edge-thickness-normal edge-pattern-solid flowchart-link',
      arrowTypeStart:
        rawEdge?.stroke === 'invisible' || rawEdge?.type === 'arrow_open' ? 'none' : arrowTypeStart,
      arrowTypeEnd:
        rawEdge?.stroke === 'invisible' || rawEdge?.type === 'arrow_open' ? 'none' : arrowTypeEnd,
      arrowheadStyle: 'fill: #333',
      cssCompiledStyles: getCompiledStyles(rawEdge.classes),
      labelStyle: styles,
      style: styles,
      pattern: rawEdge.stroke,
      look: config.look,
      animate: rawEdge.animate,
      animation: rawEdge.animation,
    };

    edges.push(edge);
  });

  return { nodes, edges, other: {}, config };
};

export default {
  defaultConfig: () => defaultConfig.flowchart,
  setAccTitle,
  getAccTitle,
  getAccDescription,
  getData,
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
