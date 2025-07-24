import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { D3Element } from '../../types.js';
import { sanitizeText } from '../../diagrams/common/common.js';
import { log } from '../../logger.js';
import type { MindmapNode } from './mindmapTypes.js';
import defaultConfig from '../../defaultConfig.js';
import type { LayoutData, Node, Edge } from '../../rendering-util/types.js';

// Extend Node type for mindmap-specific properties
export type MindmapLayoutNode = Node & {
  level: number;
  nodeId: string;
  type: number;
  section?: number;
};

// Extend Edge type for mindmap-specific properties
export type MindmapLayoutEdge = Edge & {
  depth: number;
  section?: number;
};

let nodes: MindmapNode[] = [];
let cnt = 0;
let elements: Record<number, D3Element> = {};

const clear = () => {
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

const getMindmap = () => {
  return nodes.length > 0 ? nodes[0] : null;
};

const addNode = (level: number, id: string, descr: string, type: number) => {
  log.info('addNode', level, id, descr, type);
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
  } satisfies MindmapNode;

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
      return 'hexgon'; // cspell: disable-line
    default:
      return 'no-border';
  }
};

/**
 * Assign section numbers to nodes based on their position relative to root
 * @param node - The mindmap node to process
 * @param sectionNumber - The section number to assign (undefined for root)
 */
const assignSections = (node: MindmapNode, sectionNumber?: number): void => {
  // Assign section number to the current node
  node.section = sectionNumber;

  // For root node's children, assign section numbers based on their index
  // For other nodes, inherit parent's section number
  if (node.children) {
    node.children.forEach((child, index) => {
      const childSectionNumber = node.level === 0 ? index : sectionNumber;
      assignSections(child, childSectionNumber);
    });
  }
};

/**
 * Convert mindmap tree structure to flat array of nodes
 * @param node - The mindmap node to process
 * @param processedNodes - Array to collect processed nodes
 */
const flattenNodes = (node: MindmapNode, processedNodes: MindmapLayoutNode[]): void => {
  // Build CSS classes for the node
  let cssClasses = 'mindmap-node';

  // Add section-specific classes
  if (node.level === 0) {
    // Root node gets special classes
    cssClasses += ' section-root section--1';
  } else if (node.section !== undefined) {
    // Child nodes get section class based on their section number
    cssClasses += ` section-${node.section}`;
  }

  // Add any custom classes from the node
  if (node.class) {
    cssClasses += ` ${node.class}`;
  }

  // Map mindmap node type to valid shape name
  const getShapeFromType = (type: number) => {
    switch (type) {
      case nodeType.CIRCLE:
        return 'circle';
      case nodeType.RECT:
        return 'rect';
      case nodeType.ROUNDED_RECT:
        return 'rounded';
      case nodeType.CLOUD:
        return 'cloud';
      case nodeType.BANG:
        return 'bang';
      case nodeType.HEXAGON:
        return 'hexagon';
      case nodeType.DEFAULT:
      case nodeType.NO_BORDER:
      default:
        return 'rect';
    }
  };

  const processedNode: MindmapLayoutNode = {
    id: 'node_' + node.id.toString(),
    domId: 'node_' + node.id.toString(),
    label: node.descr,
    isGroup: false,
    shape: getShapeFromType(node.type),
    width: node.width,
    height: node.height ?? 0,
    padding: node.padding,
    cssClasses: cssClasses,
    cssStyles: [],
    look: 'default',
    icon: node.icon,
    x: node.x,
    y: node.y,
    // Mindmap-specific properties
    level: node.level,
    nodeId: node.nodeId,
    type: node.type,
    section: node.section,
  };

  processedNodes.push(processedNode);

  // Recursively process children
  if (node.children) {
    node.children.forEach((child) => flattenNodes(child, processedNodes));
  }
};

/**
 * Generate edges from parent-child relationships in mindmap tree
 * @param node - The mindmap node to process
 * @param edges - Array to collect edges
 */
const generateEdges = (node: MindmapNode, edges: MindmapLayoutEdge[]): void => {
  if (node.children) {
    node.children.forEach((child) => {
      // Build CSS classes for the edge
      let edgeClasses = 'edge';

      // Add section-specific classes based on the child's section
      if (child.section !== undefined) {
        edgeClasses += ` section-edge-${child.section}`;
      }

      // Add depth class based on the parent's level + 1 (depth of the edge)
      const edgeDepth = node.level + 1;
      edgeClasses += ` edge-depth-${edgeDepth}`;

      const edge: MindmapLayoutEdge = {
        id: `edge_${node.id}_${child.id}`,
        start: 'node_' + node.id.toString(),
        end: 'node_' + child.id.toString(),
        type: 'normal',
        curve: 'basis',
        thickness: 'normal',
        look: 'default',
        classes: edgeClasses,
        // Store mindmap-specific data
        depth: node.level,
        section: child.section,
      };

      edges.push(edge);

      // Recursively process child edges
      generateEdges(child, edges);
    });
  }
};

/**
 * Get structured data for layout algorithms
 * Following the pattern established by ER diagrams
 * @returns Structured data containing nodes, edges, and config
 */
const getData = (): LayoutData => {
  const mindmapRoot = getMindmap();
  const config = getConfig();

  if (!mindmapRoot) {
    return {
      nodes: [],
      edges: [],
      config,
    };
  }
  log.debug('getData: mindmapRoot', mindmapRoot, config);

  // Assign section numbers to all nodes based on their position relative to root
  assignSections(mindmapRoot);

  // Convert tree structure to flat arrays
  const processedNodes: MindmapLayoutNode[] = [];
  const processedEdges: MindmapLayoutEdge[] = [];

  flattenNodes(mindmapRoot, processedNodes);
  generateEdges(mindmapRoot, processedEdges);

  log.debug(`getData: processed ${processedNodes.length} nodes and ${processedEdges.length} edges`);

  // Create shapes map for ELK compatibility
  const shapes = new Map<string, any>();
  processedNodes.forEach((node) => {
    shapes.set(node.id, {
      shape: node.shape,
      width: node.width,
      height: node.height,
      padding: node.padding,
    });
  });

  return {
    nodes: processedNodes,
    edges: processedEdges,
    config,
    // Store the root node for mindmap-specific layout algorithms
    rootNode: mindmapRoot,
    // Properties required by dagre layout algorithm
    markers: [], // Mindmaps don't use markers
    direction: 'TB', // Top-to-bottom direction for mindmaps
    nodeSpacing: 50, // Default spacing between nodes
    rankSpacing: 50, // Default spacing between ranks
    // Add shapes for ELK compatibility
    shapes: Object.fromEntries(shapes),
    // Additional properties that layout algorithms might expect
    type: 'mindmap',
    diagramId: 'mindmap-' + Date.now(),
  };
};

// Expose logger to grammar
const getLogger = () => log;
const getElementById = (id: number) => elements[id];

const db = {
  clear,
  addNode,
  getMindmap,
  nodeType,
  getType,
  setElementForId,
  decorateNode,
  type2Str,
  getLogger,
  getElementById,
  getData,
} as const;

export default db;
