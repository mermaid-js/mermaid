import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { D3Element } from '../../types.js';
import { sanitizeText } from '../../diagrams/common/common.js';
import { log } from '../../logger.js';
import type { IshikawaNode } from './ishikawaTypes.js';
import defaultConfig from '../../defaultConfig.js';

let nodes: IshikawaNode[] = [];
let cnt = 0;
let elements: Record<number, D3Element> = {};
let problemStatement = '';
let categories: string[] = [];

const clear = () => {
  nodes = [];
  cnt = 0;
  elements = {};
  problemStatement = '';
  categories = [];
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

const getIshikawa = () => {
  return nodes.length > 0 ? nodes[0] : null;
};

const setProblemStatement = (problem: string) => {
  problemStatement = sanitizeText(problem, getConfig());
  // Also create the root node if it doesn't exist
  if (nodes.length === 0) {
    addNode(0, 'problem', problem, nodeType.DEFAULT);
  }
};

const getProblemStatement = () => {
  // Try to get from the root node first, then fall back to the stored value
  const root = getIshikawa();
  if (root) {
    return root.descr;
  }
  return problemStatement;
};

const addCategory = (category: string) => {
  const sanitizedCategory = sanitizeText(category, getConfig());
  if (!categories.includes(sanitizedCategory)) {
    categories.push(sanitizedCategory);
  }
  // Also create a category node
  addNode(1, 'category', category, nodeType.DEFAULT);
  return sanitizedCategory;
};

const getCategories = () => {
  return categories;
};

const addNode = (level: number, id: string, descr: string, type: number, category?: string) => {
  log.info('addNode', level, id, descr, type, category);
  const conf = getConfig();
  let padding: number = conf.ishikawa?.padding ?? defaultConfig.ishikawa?.padding ?? 20;
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
    width: conf.ishikawa?.maxNodeWidth ?? defaultConfig.ishikawa?.maxNodeWidth ?? 200,
    padding,
    category: category ? sanitizeText(category, conf) : undefined,
  } satisfies IshikawaNode;

  const parent = getParent(level);
  if (parent) {
    parent.children.push(node);
    // Keep all nodes in the list
    nodes.push(node);
  } else {
    if (nodes.length === 0) {
      // First node, the root (problem statement)
      nodes.push(node);
    } else {
      // Syntax error ... there can only be one root
      throw new Error(
        'There can be only one root. No parent could be found for ("' + node.descr + '")'
      );
    }
  }
};

const nodeType = {
  DEFAULT: 0,
  NO_BORDER: 0,
  ROUNDED_RECT: 1,
  RECT: 2,
  CIRCLE: 3,
  CLOUD: 4,
  BANG: 5,
  HEXAGON: 6,
};

const getType = (startStr: string, endStr: string): number => {
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

const setElementForId = (id: number, element: D3Element) => {
  elements[id] = element;
};

const decorateNode = (decoration?: { class?: string; icon?: string }) => {
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

const type2Str = (type: number) => {
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
      return 'hexagon';
    default:
      return 'no-border';
  }
};

// Expose logger to grammar
const getLogger = () => log;
const getElementById = (id: number) => elements[id];

const db = {
  clear,
  addNode,
  getIshikawa,
  setProblemStatement,
  getProblemStatement,
  addCategory,
  getCategories,
  nodeType,
  getType,
  setElementForId,
  decorateNode,
  type2Str,
  getLogger,
  getElementById,
} as const;

export default db;
