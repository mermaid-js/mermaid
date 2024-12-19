import type { BaseDiagramConfig, MermaidConfig } from '../../config.type.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { LayoutData } from '../../mermaid.js';
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
    this.aliases = new Map();
    this.links = [];
    this.nodes = [];
    this.nodesMap = new Map();
    this.systemBoundaries = [];
    commonClear();
  }

  addAlias(token: string): string {
    const [source, target] = token.split('as').map((_) => _.trim());
    this.aliases.set(source, target);
    return source;
  }

  addParticipants(participant: { service: string } | { actor: string }) {
    if ('actor' in participant && !this.nodes.some((node) => node.id === participant.actor)) {
      this.nodes.push(new UsecaseNode(participant.actor));
    } else if (
      'service' in participant &&
      !this.nodes.some((node) => node.id === participant.service)
    ) {
      this.nodes.push(new UsecaseNode(participant.service));
    }
  }

  addRelationship(source: string, target: string, token: string): void {
    source = common.sanitizeText(source, getConfig());
    target = common.sanitizeText(target, getConfig());
    const sourceNode = this.getNode(source);
    const targetNode = this.getNode(target);
    const label = (/--(.+?)(-->|->)/.exec(token)?.[1] ?? '').trim();
    const arrow = token.includes('-->') ? '-->' : '->';
    this.links.push(new UsecaseLink(sourceNode, targetNode, arrow, label));
  }

  addSystemBoundary(useCases: string[], title?: string) {
    if (title) {
      title = common.sanitizeText(title.trim(), getConfig());
      if (title.startsWith('title')) {
        title = title.slice(5).trim();
      }
    }
    this.systemBoundaries.push({ id: 'boundary-' + this.systemBoundaries.length, useCases, title });
  }

  getActors() {
    return this.links.map((link) => link.source.id).filter((source) => !source.startsWith('('));
  }

  getConfig() {
    return getConfig() as BaseDiagramConfig;
  }

  getData(): LayoutData {
    const edges: Edge[] = this.links.map((link) => ({
      id: `${link.source.id}-${link.target.id}`,
      classes: 'edge-thickness-normal edge-pattern-solid flowchart-link',
      start: link.source.id,
      end: link.target.id,
      arrowTypeStart: undefined,
      arrowTypeEnd: 'arrow_point',
      label: link.label,
      minlen: 1,
      pattern: link.arrow == '-->' ? 'dashed' : link.arrow == '->' ? 'solid' : 'dotted',
      thickness: 'normal',
      type: 'arrow_point',
    }));

    const baseNode = {
      shape: 'squareRect',
      cssClasses: 'default',
      padding: 15,
      look: 'classic',
      isGroup: false,
      styles: [],
    };

    const parentLookup = new Map(
      this.getSystemBoundaries().flatMap((boundary) =>
        boundary.useCases.map((useCase) => [useCase, boundary.id])
      )
    );

    const nodes: Node[] = [
      ...this.nodes.map(
        (node) =>
          ({
            ...baseNode,
            id: node.id,
            label: this.aliases.get(node.id) ?? node.id,
            parentId: parentLookup.get(node.id),
          }) as Node
      ),
      ...this.getSystemBoundaries().map(
        (boundary) =>
          ({
            ...baseNode,
            id: boundary.id,
            type: 'normal',
            label: boundary.title ?? 'System Boundary',
            shape: 'rect',
            isGroup: true,
            styles: [],
          }) as Node
      ),
    ];

    nodes
      .filter((node) => node.label?.startsWith('(') && node.label.endsWith(')'))
      .forEach((node) => {
        node.label = node.label!.slice(1, -1);
        node.rx = 50;
        node.ry = 50;
      });

    // @ts-ignore TODO fix types
    const config: MermaidConfig = this.getConfig();

    return {
      nodes,
      edges,
      config,
      markers: ['point', 'circle', 'cross'],
      other: {},
      direction: 'LR',
      rankSpacing: 50,
      type: 'usecase',
    };
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
    public id: string,
    public useCases: string[],
    public title?: string
  ) {}
}

export class UsecaseLink {
  constructor(
    public source: UsecaseNode,
    public target: UsecaseNode,
    public arrow: ArrowType,
    public label: string
  ) {}
}

export class UsecaseNode {
  constructor(public id: string) {}
}

type ArrowType = '->' | '-->';

// Export an instance of the class
const db = new UsecaseDB();
export default {
  clear: db.clear.bind(db),
  addParticipants: db.addParticipants.bind(db),
  addRelationship: db.addRelationship.bind(db),
  addAlias: db.addAlias.bind(db),
  getAccDescription,
  getAccTitle,
  getActors: db.getActors.bind(db),
  getConfig: db.getConfig.bind(db),
  getData: db.getData.bind(db),
  getRelationships: db.getRelationships.bind(db),
  getDiagramTitle: db.getDiagramTitle.bind(db),
  getSystemBoundaries: db.getSystemBoundaries.bind(db),
  setAccDescription,
  setAccTitle,
  setDiagramTitle: db.setDiagramTitle.bind(db),
  addSystemBoundary: db.addSystemBoundary.bind(db),
};
