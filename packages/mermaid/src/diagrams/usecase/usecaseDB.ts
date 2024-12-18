import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { LayoutData, MermaidConfig } from '../../mermaid.js';
import type { Edge, Node } from '../../rendering-util/types.js';
import common from '../common/common.js';
import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  setDiagramTitle,
  getDiagramTitle,
  clear as commonClear,
} from '../common/commonDb.js';

export class UsecaseDB {
  private aliases = new Map<string, string>();
  private links: UsecaseLink[] = [];
  private nodes: UsecaseNode[] = [];
  private nodesMap = new Map<string, UsecaseNode>();
  private systemBoundaries: UsecaseSystemBoundary[] = [];

  constructor() {
    this.clear();
  }

  clear(): void {
    this.links = [];
    this.nodes = [];
    this.nodesMap = new Map();
    commonClear();
  }

  addAlias(token: string): string {
    const [source, target] = token.split('as').map((_) => _.trim());
    this.aliases.set(source, target);
    return source;
  }

  addRelationship(source: string, target: string, arrow: string): void {
    source = common.sanitizeText(source, getConfig());
    target = common.sanitizeText(target, getConfig());
    const sourceNode = this.getNode(source);
    const targetNode = this.getNode(target);
    this.links.push(new UsecaseLink(sourceNode, targetNode, arrow));
  }

  addSystemBoundary(elements: string[], title?: string) {
    this.systemBoundaries.push({ elements, title });
  }

  getConfig() {
    return getConfig().usecase!;
  }

  getData(): LayoutData {
    const edges: Edge[] = this.links.map((link) => ({
      id: `${link.source.ID}-${link.target.ID}`,
      type: 'normal',
    }));

    const nodes: Node[] = [
      ...this.nodes.map((node) => ({
        id: node.ID,
        type: 'normal',
        label: this.aliases.get(node.ID) ?? node.ID,
        isGroup: false,
      })),
      ...this.systemBoundaries.map((boundary) => ({
        id: boundary.title ?? 'System Boundary',
        type: 'normal',
        label: boundary.title ?? 'System Boundary',
        isGroup: true,
        children: boundary.elements.map((element) => ({
          id: element,
          type: 'normal',
          label: this.aliases.get(element) ?? element,
          isGroup: false,
        })),
      })),
    ];

    const config = this.getConfig() as MermaidConfig;

    return {
      nodes,
      edges,
      config,
    };
  }

  getRelationships(): UsecaseLink[] {
    return this.links;
  }

  getSystemBoundaries() {
    return this.systemBoundaries.map((boundary) => ({
      useCases: boundary.elements,
      title: boundary.title,
    }));
  }

  getAccDescription = getAccDescription;
  getAccTitle = getAccTitle;
  getDiagramTitle = getDiagramTitle;

  setAccTitle = setAccTitle;
  setAccDescription = setAccDescription;
  setDiagramTitle = setDiagramTitle;

  private getNode(id: string): UsecaseNode {
    if (!this.nodesMap.has(id)) {
      const node = new UsecaseNode(id);
      this.nodesMap.set(id, node);
      this.nodes.push(node);
    }
    return this.nodesMap.get(id)!;
  }
}

export class UsecaseSystemBoundary {
  constructor(
    public elements: string[],
    public title?: string
  ) {}
}

export class UsecaseLink {
  constructor(
    public source: UsecaseNode,
    public target: UsecaseNode,
    public arrow: string
  ) {}
}

export class UsecaseNode {
  constructor(public ID: string) {}
}

// Export an instance of the class
const db = new UsecaseDB();
export default {
  clear: db.clear.bind(db),
  addRelationship: db.addRelationship.bind(db),
  addAlias: db.addAlias.bind(db),
  getConfig: db.getConfig.bind(db),
  getData: db.getData.bind(db),
  getRelationships: db.getRelationships.bind(db),
  getDiagramTitle: db.getDiagramTitle.bind(db),
  getSystemBoundaries: db.getSystemBoundaries.bind(db),
  setDiagramTitle: db.setDiagramTitle.bind(db),
  addSystemBoundary: db.addSystemBoundary.bind(db),
};
