import { getConfig } from '../../diagram-api/diagramAPI.js';
import { sanitizeText } from '../../diagrams/common/common.js';
import { log } from '../../logger.js';
import type { D3Element } from '../../mermaidAPI.js';

export interface MindMapNode {
  id: number;
  nodeId: string;
  level: number;
  descr: string;
  type: number;
  children: MindMapNode[];
  width: number;
  padding: number;
  section?: number;
  height?: number;
  class?: string;
  icon?: string;
  x?: number;
  y?: number;
}

let nodes: MindMapNode[] = [];
let cnt = 0;
let elements: Record<string, D3Element> = {};

export const clear = () => {
  nodes = [];
  cnt = 0;
  elements = {};
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
  let padding: number = conf.mindmap?.padding ?? 10;
  switch (type) {
    case nodeType.ROUNDED_RECT:
    case nodeType.RECT:
    case nodeType.HEXAGON:
      padding *= 2;
  }

  const node = {
    id: cnt++,
    nodeId: sanitizeText(id, conf),
    level,
    descr: sanitizeText(descr, conf),
    type,
    children: [],
    width: conf.mindmap?.maxNodeWidth ?? 200,
    padding,
  } satisfies MindMapNode;

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
  HEXAGON: 6,
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
    case '{{':
      return nodeType.HEXAGON;
    default:
      return nodeType.DEFAULT;
  }
};

export const setElementForId = (id: string, element: D3Element) => {
  elements[id] = element;
};

export const decorateNode = (decoration?: { class?: string; icon?: string }) => {
  if (!decoration) {
    return;
  }
  const config = getConfig();
  const node = nodes[nodes.length - 1];
  if (decoration.icon) {
    node.icon = sanitizeText(decoration.icon, config);
  }
  if (decoration.class) {
    node.class = sanitizeText(decoration.class, config);
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
    case nodeType.HEXAGON:
      return 'hexgon';
    default:
      return 'no-border';
  }
};

// Expose logger to grammar
export const getLogger = () => log;
export const getElementById = (id: string) => elements[id];
