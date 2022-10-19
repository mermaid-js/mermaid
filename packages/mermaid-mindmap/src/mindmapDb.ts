/** Created by knut on 23-07-2022. */
import { sanitizeText, getConfig, log } from './mermaidUtils';
import type { DetailedError } from 'mermaid';

interface Node {
  id: number;
  nodeId: string;
  level: number;
  descr: string;
  type: number;
  children: Node[];
  width: number;
  padding: number;
  icon?: string;
  class?: string;
}

let nodes: Node[] = [];
let cnt = 0;
export const clear = () => {
  nodes = [];
  cnt = 0;
};

const getParent = function (level: number) {
  for (let i = nodes.length - 1; i >= 0; i--) {
    if (nodes[i].level < level) {
      return nodes[i];
    }
  }
  // No parent found
  return null;
};

export const getMindmap = () => {
  return nodes.length > 0 ? nodes[0] : null;
};

export const addNode = (level: number, id: string, descr: string, type: number) => {
  log.info('addNode', level, id, descr, type);
  const conf = getConfig();
  const padding = conf.mindmap?.padding ?? 15;
  const node: Node = {
    id: cnt++,
    nodeId: sanitizeText(id),
    level,
    descr: sanitizeText(descr),
    type,
    children: [],
    width: getConfig().mindmap?.maxNodeWidth ?? 200,
    padding: type === nodeType.ROUNDED_RECT || type === nodeType.RECT ? 2 * padding : padding,
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
      const error = new Error(
        'There can be only one root. No parent could be found for ("' + node.descr + '")'
      );
      // @ts-ignore TODO: Add mermaid error
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
  CLOUD: 4,
  BANG: 5,
};

export const getType = (startStr: string, endStr: string): number => {
  log.debug('In get type', startStr, endStr);
  switch (startStr) {
    case '[':
      return nodeType.RECT;
    case '(':
      return endStr === ')' ? nodeType.ROUNDED_RECT : nodeType.CLOUD;
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

export const decorateNode = (decoration: { icon: string; class: string }) => {
  const node = nodes[nodes.length - 1];
  if (decoration && decoration.icon) {
    node.icon = sanitizeText(decoration.icon);
  }
  if (decoration && decoration.class) {
    node.class = sanitizeText(decoration.class);
  }
};

export const type2Str = (type: number) => {
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

export type ParseErrorFunction = (err: string | DetailedError, hash?: any) => void;
export let parseError: ParseErrorFunction;
export const setErrorHandler = (handler: ParseErrorFunction) => {
  parseError = handler;
};

// Expose logger to grammar
export const getLogger = () => log;

export const getNodeById = (id: number): Node => nodes[id];
