import { getConfig } from '../../diagram-api/diagramAPI.js';
import { v4 } from 'uuid';
import type { D3Element } from '../../types.js';
import { sanitizeText } from '../../diagrams/common/common.js';
import { log } from '../../logger.js';
import type { MindmapNode } from './mindmapTypes.js';
import defaultConfig from '../../defaultConfig.js';
import type { LayoutData, Node, Edge } from '../../rendering-util/types.js';
import { getUserDefinedConfig } from '../../config.js';
import { MAX_SECTIONS } from './svgDraw.js';
import * as utils from '../../utils.js';

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

const nodeType = {
  DEFAULT: 0,
  NO_BORDER: 0,
  ROUNDED_RECT: 1,
  RECT: 2,
  CIRCLE: 3,
  CLOUD: 4,
  BANG: 5,
  HEXAGON: 6,
} as const;

export class MindmapDB {
  private nodes: MindmapNode[] = [];
  private nodeMap = new Map<string, MindmapNode>();
  private count = 0;
  private elements: Record<number, D3Element> = {};
  private baseLevel?: number;
  private funs: ((root: Element) => void)[] = [];
  public readonly nodeType: typeof nodeType;

  constructor() {
    this.getLogger = this.getLogger.bind(this);
    this.nodeType = nodeType;
    this.clear();
    this.getType = this.getType.bind(this);
    this.getElementById = this.getElementById.bind(this);
    this.getParent = this.getParent.bind(this);
    this.getMindmap = this.getMindmap.bind(this);
    this.addNode = this.addNode.bind(this);
    this.decorateNode = this.decorateNode.bind(this);
    this.setLink = this.setLink.bind(this);
    this.setTooltip = this.setTooltip.bind(this);
    this.setClickEvent = this.setClickEvent.bind(this);
    this.bindFunctions = this.bindFunctions.bind(this);
  }
  public clear() {
    this.nodes = [];
    this.nodeMap = new Map();
    this.count = 0;
    this.elements = {};
    this.funs = [];
    this.baseLevel = undefined;
  }

  public getParent(level: number): MindmapNode | null {
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      if (this.nodes[i].level < level) {
        return this.nodes[i];
      }
    }
    return null;
  }

  public getMindmap(): MindmapNode | null {
    return this.nodes.length > 0 ? this.nodes[0] : null;
  }

  public addNode(level: number, id: string, descr: string, type: number): void {
    log.info('addNode', level, id, descr, type);

    let isRoot = false;

    if (this.nodes.length === 0) {
      this.baseLevel = level;
      level = 0;
      isRoot = true;
    } else if (this.baseLevel !== undefined) {
      level = level - this.baseLevel;
      isRoot = false;
    }

    const conf = getConfig();
    let padding = conf.mindmap?.padding ?? defaultConfig.mindmap.padding;

    switch (type) {
      case this.nodeType.ROUNDED_RECT:
      case this.nodeType.RECT:
      case this.nodeType.HEXAGON:
        padding *= 2;
        break;
    }

    const node: MindmapNode = {
      id: this.count++,
      nodeId: sanitizeText(id, conf),
      level,
      descr: sanitizeText(descr, conf),
      type,
      children: [],
      width: conf.mindmap?.maxNodeWidth ?? defaultConfig.mindmap.maxNodeWidth,
      padding,
      isRoot,
    };

    const parent = this.getParent(level);
    if (parent) {
      parent.children.push(node);
      this.nodes.push(node);
      this.nodeMap.set(node.nodeId, node);
    } else {
      if (isRoot) {
        this.nodes.push(node);
        this.nodeMap.set(node.nodeId, node);
      } else {
        throw new Error(
          `There can be only one root. No parent could be found for ("${node.descr}")`
        );
      }
    }
  }

  public getType(startStr: string, endStr: string) {
    log.debug('In get type', startStr, endStr);
    switch (startStr) {
      case '[':
        return this.nodeType.RECT;
      case '(':
        return endStr === ')' ? this.nodeType.ROUNDED_RECT : this.nodeType.CLOUD;
      case '((':
        return this.nodeType.CIRCLE;
      case ')':
        return this.nodeType.CLOUD;
      case '))':
        return this.nodeType.BANG;
      case '{{':
        return this.nodeType.HEXAGON;
      default:
        return this.nodeType.DEFAULT;
    }
  }

  public setElementForId(id: number, element: D3Element): void {
    this.elements[id] = element;
  }
  public getElementById(id: number) {
    return this.elements[id];
  }

  public decorateNode(decoration?: { class?: string; icon?: string }): void {
    if (!decoration) {
      return;
    }

    const config = getConfig();
    const node = this.nodes[this.nodes.length - 1];
    if (decoration.icon) {
      node.icon = sanitizeText(decoration.icon, config);
    }
    if (decoration.class) {
      node.class = sanitizeText(decoration.class, config);
    }
  }

  public setLink(nodeId: string, linkStr: string, target?: string): void {
    const node = this.nodeMap.get(nodeId);
    if (node !== undefined) {
      node.link = utils.formatUrl(linkStr, getConfig());
      node.linkTarget = target;
    }
  }

  public setTooltip(nodeId: string, tooltip?: string): void {
    if (tooltip === undefined) {
      return;
    }
    const node = this.nodeMap.get(nodeId);
    if (node !== undefined) {
      node.tooltip = sanitizeText(tooltip, getConfig());
    }
  }

  public setClickEvent(nodeId: string, functionName: string, functionArgs?: string): void {
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
        if (item.startsWith('"') && item.endsWith('"')) {
          item = item.slice(1, -1);
        }
        argList[i] = item;
      }
    }

    /* if no arguments passed into callback, default to passing in nodeId */
    if (argList.length === 0) {
      argList.push(nodeId);
    }

    const node = this.nodeMap.get(nodeId);
    if (node !== undefined) {
      node.haveCallback = true;
      const domId = `node_${node.id}`;
      this.funs.push((root: Element) => {
        const elem = root.querySelector(`[id="${domId}"]`);
        if (elem !== null) {
          elem.addEventListener(
            'click',
            () => {
              utils.runFunc(functionName, ...argList);
            },
            false
          );
        }
      });
    }
  }

  public bindFunctions(element: Element): void {
    this.funs.forEach((fun) => {
      fun(element);
    });
  }

  type2Str(type: number): string {
    switch (type) {
      case this.nodeType.DEFAULT:
        return 'no-border';
      case this.nodeType.RECT:
        return 'rect';
      case this.nodeType.ROUNDED_RECT:
        return 'rounded-rect';
      case this.nodeType.CIRCLE:
        return 'circle';
      case this.nodeType.CLOUD:
        return 'cloud';
      case this.nodeType.BANG:
        return 'bang';
      case this.nodeType.HEXAGON:
        return 'hexgon'; // cspell: disable-line
      default:
        return 'no-border';
    }
  }

  /**
   * Assign section numbers to nodes based on their position relative to root
   * @param node - The mindmap node to process
   * @param sectionNumber - The section number to assign (undefined for root)
   */
  public assignSections(node: MindmapNode, sectionNumber?: number): void {
    // For root node, section should be undefined (not -1)
    if (node.level === 0) {
      node.section = undefined;
    } else {
      // For non-root nodes, assign the section number
      node.section = sectionNumber;
    }
    // For root node's children, assign section numbers based on their index
    // For other nodes, inherit parent's section number
    if (node.children) {
      for (const [index, child] of node.children.entries()) {
        const childSectionNumber = node.level === 0 ? index % (MAX_SECTIONS - 1) : sectionNumber;
        this.assignSections(child, childSectionNumber);
      }
    }
  }

  /**
   * Convert mindmap tree structure to flat array of nodes
   * @param node - The mindmap node to process
   * @param processedNodes - Array to collect processed nodes
   */
  public flattenNodes(node: MindmapNode, processedNodes: MindmapLayoutNode[]): void {
    // Build CSS classes for the node
    const cssClasses = ['mindmap-node'];

    if (node.isRoot === true) {
      // Root node gets special classes
      cssClasses.push('section-root', 'section--1');
    } else if (node.section !== undefined) {
      // Child nodes get section class based on their section number
      cssClasses.push(`section-${node.section}`);
    }

    // Add any custom classes from the node
    if (node.class) {
      cssClasses.push(node.class);
    }

    const classes = cssClasses.join(' ');

    // Map mindmap node type to valid shape name
    const getShapeFromType = (type: number) => {
      switch (type) {
        case nodeType.CIRCLE:
          return 'mindmapCircle';
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
          return 'defaultMindmapNode';
        case nodeType.NO_BORDER:
        default:
          return 'rect';
      }
    };

    const processedNode: MindmapLayoutNode = {
      id: node.id.toString(),
      domId: 'node_' + node.id.toString(),
      label: node.descr,
      labelType: 'markdown',
      isGroup: false,
      shape: getShapeFromType(node.type),
      width: node.width,
      height: node.height ?? 0,
      padding: node.padding,
      cssClasses: classes,
      cssStyles: [],
      look: 'default',
      icon: node.icon,
      x: node.x,
      y: node.y,
      link: node.link,
      linkTarget: node.linkTarget,
      haveCallback: node.haveCallback,
      tooltip: node.tooltip,
      // Mindmap-specific properties
      level: node.level,
      nodeId: node.nodeId,
      type: node.type,
      section: node.section,
    };

    processedNodes.push(processedNode);

    // Recursively process children
    if (node.children) {
      for (const child of node.children) {
        this.flattenNodes(child, processedNodes);
      }
    }
  }

  /**
   * Generate edges from parent-child relationships in mindmap tree
   * @param node - The mindmap node to process
   * @param edges - Array to collect edges
   */
  public generateEdges(node: MindmapNode, edges: MindmapLayoutEdge[]): void {
    if (!node.children) {
      return;
    }
    for (const child of node.children) {
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
        start: node.id.toString(),
        end: child.id.toString(),
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
      this.generateEdges(child, edges);
    }
  }

  /**
   * Get structured data for layout algorithms
   * Following the pattern established by ER diagrams
   * @returns Structured data containing nodes, edges, and config
   */
  public getData(): LayoutData {
    const mindmapRoot = this.getMindmap();
    const config = getConfig();

    const userDefinedConfig = getUserDefinedConfig();
    const hasUserDefinedLayout = userDefinedConfig.layout !== undefined;

    const finalConfig = config;
    if (!hasUserDefinedLayout) {
      finalConfig.layout = 'cose-bilkent';
    }

    if (!mindmapRoot) {
      return {
        nodes: [],
        edges: [],
        config: finalConfig,
      };
    }
    log.debug('getData: mindmapRoot', mindmapRoot, config);

    // Assign section numbers to all nodes based on their position relative to root
    this.assignSections(mindmapRoot);

    // Convert tree structure to flat arrays
    const processedNodes: MindmapLayoutNode[] = [];
    const processedEdges: MindmapLayoutEdge[] = [];

    this.flattenNodes(mindmapRoot, processedNodes);
    this.generateEdges(mindmapRoot, processedEdges);

    log.debug(
      `getData: processed ${processedNodes.length} nodes and ${processedEdges.length} edges`
    );

    // Create shapes map for ELK compatibility
    const shapes = new Map<string, any>();
    for (const node of processedNodes) {
      shapes.set(node.id, {
        shape: node.shape,
        width: node.width,
        height: node.height,
        padding: node.padding,
      });
    }

    return {
      nodes: processedNodes,
      edges: processedEdges,
      config: finalConfig,
      // Store the root node for mindmap-specific layout algorithms
      rootNode: mindmapRoot,
      // Properties required by dagre layout algorithm
      markers: ['point'], // Mindmaps don't use markers
      direction: 'TB', // Top-to-bottom direction for mindmaps
      nodeSpacing: 50, // Default spacing between nodes
      rankSpacing: 50, // Default spacing between ranks
      // Add shapes for ELK compatibility
      shapes: Object.fromEntries(shapes),
      // Additional properties that layout algorithms might expect
      type: 'mindmap',
      diagramId: 'mindmap-' + v4(),
    };
  }

  // Expose logger to grammar
  public getLogger() {
    return log;
  }
}
