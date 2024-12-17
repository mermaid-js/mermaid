import { getConfig } from '../../diagram-api/diagramAPI.js';
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

class UsecaseDB {
  private aliases = new Map<string, string>();
  private links: UsecaseLink[] = [];
  private nodes: UsecaseNode[] = [];
  private nodesMap = new Map<string, UsecaseNode>();
  private systemBoundaries: any[] = [];

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
    source = common.sanitizeText(source, this.getConfig());
    target = common.sanitizeText(target, this.getConfig());
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

  getRelationships(): UsecaseLink[] {
    return this.links;
  }

  getSystemBoundaries() {
    return this.systemBoundaries;
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
  getRelationships: db.getRelationships.bind(db),
  getDiagramTitle: db.getDiagramTitle.bind(db),
  getSystemBoundaries: db.getSystemBoundaries.bind(db),
  setDiagramTitle: db.setDiagramTitle.bind(db),
  addSystemBoundary: db.addSystemBoundary.bind(db),
};
