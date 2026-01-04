import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { D3Element } from '../../types.js';
import { sanitizeText } from '../../diagrams/common/common.js';
import { log } from '../../logger.js';
import type { IshikawaNode } from './ishikawaTypes.js';
import defaultConfig from '../../defaultConfig.js';
import type { DiagramDB } from '../../diagram-api/types.js';
import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
  setDiagramTitle,
  getDiagramTitle,
} from '../common/commonDb.js';

export class IshikawaDB implements DiagramDB {
  private nodes: IshikawaNode[] = [];
  private nodeIdCounter = 0;
  private elements: Record<number, D3Element> = {};
  private problemStatement = '';
  private categories: string[] = [];

  public readonly nodeType = {
    DEFAULT: 0,
    NO_BORDER: 0,
    ROUNDED_RECT: 1,
    RECT: 2,
    CIRCLE: 3,
    CLOUD: 4,
    BANG: 5,
    HEXAGON: 6,
  } as const;

  constructor() {
    this.clear();

    // Needed for JISON since it only supports direct properties
    this.addNode = this.addNode.bind(this);
    this.getIshikawa = this.getIshikawa.bind(this);
    this.getParent = this.getParent.bind(this);
    this.setProblemStatement = this.setProblemStatement.bind(this);
    this.getProblemStatement = this.getProblemStatement.bind(this);
    this.addCategory = this.addCategory.bind(this);
    this.getCategories = this.getCategories.bind(this);
    this.getType = this.getType.bind(this);
    this.setElementForNodeId = this.setElementForNodeId.bind(this);
    this.decorateNode = this.decorateNode.bind(this);
    this.nodeTypeToString = this.nodeTypeToString.bind(this);
    this.getLogger = this.getLogger.bind(this);
    this.getElementByNodeId = this.getElementByNodeId.bind(this);
    this.setAccTitle = this.setAccTitle.bind(this);
    this.setAccDescription = this.setAccDescription.bind(this);
  }

  public clear() {
    commonClear();
    this.nodes = [];
    this.nodeIdCounter = 0;
    this.elements = {};
    this.problemStatement = '';
    this.categories = [];
  }

  private getParent(level: number): IshikawaNode | null {
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      if (this.nodes[i].level < level) {
        return this.nodes[i];
      }
    }
    // No parent found
    return null;
  }

  public getIshikawa(): IshikawaNode | null {
    return this.nodes.length > 0 ? this.nodes[0] : null;
  }

  public setProblemStatement(problem: string) {
    this.problemStatement = sanitizeText(problem, getConfig());
    // Also create the root node if it doesn't exist
    if (this.nodes.length === 0) {
      this.addNode(0, 'problem', problem, this.nodeType.DEFAULT);
    } else {
      // Update existing root node's description
      const root = this.getIshikawa();
      if (root) {
        root.description = this.problemStatement;
      }
    }
  }

  public getProblemStatement(): string {
    // Try to get from the root node first, then fall back to the stored value
    const root = this.getIshikawa();
    if (root) {
      return root.description;
    }
    return this.problemStatement;
  }

  public addCategory(category: string): string {
    const sanitizedCategory = sanitizeText(category, getConfig());
    if (!this.categories.includes(sanitizedCategory)) {
      this.categories.push(sanitizedCategory);
    }
    // Also create a category node
    this.addNode(1, 'category', category, this.nodeType.DEFAULT);
    return sanitizedCategory;
  }

  public getCategories(): string[] {
    return this.categories;
  }

  public addNode(level: number, id: string, description: string, type: number, category?: string) {
    log.info('addNode', level, id, description, type, category);
    const configuration = getConfig();
    let padding: number = configuration.ishikawa?.padding ?? defaultConfig.ishikawa?.padding ?? 20;
    switch (type) {
      case this.nodeType.ROUNDED_RECT:
      case this.nodeType.RECT:
      case this.nodeType.HEXAGON:
        padding *= 2;
    }

    const node = {
      id: this.nodeIdCounter++,
      nodeId: sanitizeText(id, configuration),
      level,
      description: sanitizeText(description, configuration),
      type,
      children: [],
      width: configuration.ishikawa?.maxNodeWidth ?? defaultConfig.ishikawa?.maxNodeWidth ?? 200,
      padding,
      category: category ? sanitizeText(category, configuration) : undefined,
    } satisfies IshikawaNode;

    const parent = this.getParent(level);
    if (parent) {
      parent.children.push(node);
      // Keep all nodes in the list
      this.nodes.push(node);
    } else {
      if (this.nodes.length === 0) {
        // First node, the root (problem statement)
        this.nodes.push(node);
      } else {
        // Syntax error ... there can only be one root
        throw new Error(
          'There can be only one root. No parent could be found for ("' + node.description + '")'
        );
      }
    }
  }

  public getType(startStr: string, endStr: string): number {
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

  public setElementForNodeId(nodeId: number, element: D3Element) {
    this.elements[nodeId] = element;
  }

  public decorateNode(decoration?: { class?: string; icon?: string }) {
    if (!decoration) {
      return;
    }
    const configuration = getConfig();
    const node = this.nodes[this.nodes.length - 1];
    if (decoration.icon) {
      node.icon = sanitizeText(decoration.icon, configuration);
    }
    if (decoration.class) {
      node.class = sanitizeText(decoration.class, configuration);
    }
  }

  public nodeTypeToString(type: number): string {
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
        return 'hexagon';
      default:
        return 'no-border';
    }
  }

  // Alias for backward compatibility
  public type2Str = (type: number) => this.nodeTypeToString(type);

  // Expose logger to grammar
  public getLogger() {
    return log;
  }

  public getElementByNodeId(nodeId: number): D3Element {
    return this.elements[nodeId];
  }

  // Alias for backward compatibility
  public getElementById = (nodeId: number) => this.getElementByNodeId(nodeId);

  // Common DB methods
  public setAccTitle = setAccTitle;
  public getAccTitle = getAccTitle;
  public setAccDescription = setAccDescription;
  public getAccDescription = getAccDescription;
  public setDiagramTitle = setDiagramTitle;
  public getDiagramTitle = getDiagramTitle;
}
