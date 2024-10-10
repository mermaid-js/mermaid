import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { D3Element } from '../../types.js';
import { sanitizeText } from '../../diagrams/common/common.js';
import { log } from '../../logger.js';
import type { KanbanInternalNode } from './kanbanTypes.js';
import type { Node, Edge, KanbanNode } from '../../rendering-util/types.js';
import defaultConfig from '../../defaultConfig.js';
import type { NodeMetaData } from '../../types.js';
import * as yaml from 'js-yaml';

let nodes: KanbanInternalNode[] = [];
let sections: KanbanInternalNode[] = [];
let cnt = 0;
let elements: Record<number, D3Element> = {};

const clear = () => {
  nodes = [];
  sections = [];
  cnt = 0;
  elements = {};
};
/*
 * if your level is the section level return null - then you do not belong to a level
 * otherwise return the current section
 */
const getSection = function (level: number) {
  if (nodes.length === 0) {
    // console.log('No nodes');
    return null;
  }
  const sectionLevel = nodes[0].level;
  let lastSection = null;
  for (let i = nodes.length - 1; i >= 0; i--) {
    if (nodes[i].level === sectionLevel && !lastSection) {
      lastSection = nodes[i];
      // console.log('lastSection found', lastSection);
    }
    // console.log('HERE', nodes[i].id, level, nodes[i].level, sectionLevel);
    if (nodes[i].level < sectionLevel) {
      throw new Error('Items without section detected, found section ("' + nodes[i].descr + '")');
    }
  }
  if (level === lastSection?.level) {
    return null;
  }

  // No found
  return lastSection;
};

const getSections = function () {
  return sections;
};

const getData = function () {
  const edges = [] as Edge[];
  const nodes: Node[] = [];

  const sections = getSections();
  const conf = getConfig();

  for (const section of sections) {
    const node = {
      id: section.nodeId,
      label: sanitizeText(section.descr, conf),
      isGroup: true,
      ticket: section.ticket,
      shape: 'kanbanSection',
    } satisfies KanbanNode;
    nodes.push(node);
    for (const item of section.children) {
      const childNode = {
        id: item.nodeId,
        parentId: section.nodeId,
        label: sanitizeText(item.descr, conf),
        isGroup: false,
        ticket: item?.ticket,
        priority: item?.priority,
        assigned: item?.assigned,
        icon: item?.icon,
        shape: 'kanbanItem',
        rx: 5,
        cssStyles: ['text-align: left'],
      } satisfies KanbanNode;
      nodes.push(childNode);
    }
  }

  return { nodes, edges, other: {}, config: getConfig() };
};

const addNode = (level: number, id: string, descr: string, type: number, shapeData: string) => {
  // log.info('addNode level=', level, 'id=', id, 'descr=', descr, 'type=', type);
  const conf = getConfig();
  let padding: number = conf.mindmap?.padding ?? defaultConfig.mindmap.padding;
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
    width: conf.mindmap?.maxNodeWidth ?? defaultConfig.mindmap.maxNodeWidth,
    padding,
  } satisfies KanbanInternalNode;

  if (shapeData !== undefined) {
    let yamlData;
    // detect if shapeData contains a newline character
    // console.log('shapeData', shapeData);
    if (!shapeData.includes('\n')) {
      // console.log('yamlData shapeData has no new lines', shapeData);
      yamlData = '{\n' + shapeData + '\n}';
    } else {
      // console.log('yamlData shapeData has new lines', shapeData);
      yamlData = shapeData + '\n';
    }
    const doc = yaml.load(yamlData, { schema: yaml.JSON_SCHEMA }) as NodeMetaData;
    // console.log('yamlData', doc);
    if (doc.shape && (doc.shape !== doc.shape.toLowerCase() || doc.shape.includes('_'))) {
      throw new Error(`No such shape: ${doc.shape}. Shape names should be lowercase.`);
    }

    if (doc?.shape) {
      node.type = doc?.shape;
    }
    if (doc?.label) {
      node.descr = doc?.label;
    }
    if (doc?.icon) {
      node.icon = doc?.icon;
    }
    if (doc?.assigned) {
      node.assigned = doc?.assigned;
    }
    if (doc?.ticket) {
      node.ticket = doc?.ticket;
    }

    if (doc?.priority) {
      node.priority = doc?.priority;
    }
  }

  const section = getSection(level);
  if (section) {
    section.children.push(node);
    // Keep all nodes in the list
    nodes.push(node);
  } else {
    sections.push(node);
  }
  nodes.push(node);
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
      return 'hexgon'; // cspell: disable-line
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
  getSections,
  getData,
  nodeType,
  getType,
  setElementForId,
  decorateNode,
  type2Str,
  getLogger,
  getElementById,
} as const;

export default db;
