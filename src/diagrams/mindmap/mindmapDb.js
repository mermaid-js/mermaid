/** Created by knut on 15-01-14. */
import { log, sanitizeText, getConfig } from '../../diagram-api/diagramAPI';

var message = '';
var info = false;
const root = {};
let nodes = [];
let cnt = 0;
let elements = {};
export const clear = () => {
  nodes = [];
  cnt = 0;
  elements = {};
};

const getParent = function (level) {
  for (let i = nodes.length - 1; i >= 0; i--) {
    if (nodes[i].level < level) {
      return nodes[i];
    }
  }
  // No parent found
  return null;
};

export const getMindmap = () => {
  console.log('getMindmap', nodes[0]);
  return nodes.length > 0 ? nodes[0] : null;
};
export const addNode = (level, id, descr, type) => {
  const conf = getConfig();
  const node = {
    id: cnt++,
    nodeId: sanitizeText(id),
    level,
    descr: sanitizeText(descr),
    type,
    children: [],
    width: getConfig().mindmap.maxNodeWidth,
  };
  switch (node.type) {
    case nodeType.ROUNDED_RECT:
      node.padding = 2 * conf.mindmap.padding;
      break;
    case nodeType.RECT:
      node.padding = 2 * conf.mindmap.padding;
      break;
    default:
      node.padding = conf.mindmap.padding;
  }
  const parent = getParent(level);
  if (parent) {
    parent.children.push(node);
    // Keep all nodes in the list
    nodes.push(node);
  } else {
    if (nodes.length === 0) {
      // First node, the root
      nodes.push(node);
    } else {
      // Syntax error ... there can only bee one root
      let error = new Error(
        'There can be only one root. No parent could be found for ("' + node.descr + '")'
      );
      error.hash = {
        text: 'branch ' + name,
        token: 'branch ' + name,
        line: '1',
        loc: { first_line: 1, last_line: 1, first_column: 1, last_column: 1 },
        expected: ['"checkout ' + name + '"'],
      };
      throw error;
    }
  }
};

export const nodeType = {
  DEFAULT: 0,
  NO_BORDER: 0,
  ROUNDED_RECT: 1,
  RECT: 2,
  CIRCLE: 3,
};

export const getType = (startStr, endStr) => {
  console.log('In get type', startStr, endStr);
  switch (startStr) {
    case '[':
      return nodeType.RECT;
    case '(':
      return nodeType.ROUNDED_RECT;
    case '((':
      return nodeType.CIRCLE;
    case ')':
      return nodeType.CLOUD;
    case '))':
      return nodeType.BANG;
    default:
      return nodeType.DEFAULT;
  }
};

export const setElementForId = (id, element) => {
  elements[id] = element;
};

export const decorateNode = (decoration) => {
  console.log('decorateNode', decoration);
  const node = nodes[nodes.length - 1];
  if (decoration && decoration.icon) {
    node.icon = sanitizeText(decoration.icon);
  }
  if (decoration && decoration.class) {
    node.class = sanitizeText(decoration.class);
  }
};

const type2Str = (type) => {
  switch (type) {
    case nodeType.DEFAULT:
      return 'no-border';
    case nodeType.RECT:
      return 'rect';
    case nodeType.ROUNDED_RECT:
      return 'rounded-rect';
    case nodeType.CIRCLE:
      return 'circle';
    case nodeType.CLOUD:
      return 'cloud';
    case nodeType.BANG:
      return 'bang';
    default:
      return 'no-border';
  }
};

export default {
  getMindmap,
  addNode,
  clear,
  nodeType,
  getType,
  decorateNode,
  setElementForId,
  getElementById: (id) => elements[id],
  // getNodeById: (id) => nodes.find((node) => node.id === id),
  getNodeById: (id) => nodes[id],
  type2Str,
  // parseError
};
