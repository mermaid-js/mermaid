/** Created by knut on 15-01-14. */
import { log, sanitizeText, getConfig } from '../../diagram-api/diagramAPI';

var message = '';
var info = false;
const root = {};
let nodes = [];

export const clear = () => {
  nodes = [];
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
  const node = {
    id: sanitizeText(id),
    level,
    descr: sanitizeText(descr),
    type,
    children: [],
    width: getConfig().mindmap.maxNodeWidth,
  };
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

export const getTypeFromStart = (str) => {
  switch (str) {
    case '[':
      return nodeType.RECT;
    case '(':
      return nodeType.ROUNDED_RECT;
    case '((':
      return nodeType.CIRCLE;
    default:
      return nodeType.DEFAULT;
  }
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
export default {
  getMindmap,
  addNode,
  clear,
  nodeType,
  getTypeFromStart,
  decorateNode,
  // parseError
};
