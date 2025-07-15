import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { D3Element } from '../../types.js';
import { sanitizeText } from '../../diagrams/common/common.js';
import { log } from '../../logger.js';
import type { MindmapNode } from './mindmapTypes.js';
import defaultConfig from '../../defaultConfig.js';

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
  private count = 0;
  private elements: Record<number, D3Element> = {};
  public readonly nodeType: typeof nodeType;

  constructor() {
    this.getLogger = this.getLogger.bind(this);
    this.nodeType = nodeType;
    this.clear();
    this.getType = this.getType.bind(this);
    this.getMindmap = this.getMindmap.bind(this);
    this.getElementById = this.getElementById.bind(this);
    this.getParent = this.getParent.bind(this);
    this.getMindmap = this.getMindmap.bind(this);
    this.addNode = this.addNode.bind(this);
    this.decorateNode = this.decorateNode.bind(this);
  }
  public clear() {
    this.nodes = [];
    this.count = 0;
    this.elements = {};
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
    };

    const parent = this.getParent(level);
    if (parent) {
      parent.children.push(node);
      this.nodes.push(node);
    } else {
      if (this.nodes.length === 0) {
        this.nodes.push(node);
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

  public getLogger() {
    return log;
  }
}
