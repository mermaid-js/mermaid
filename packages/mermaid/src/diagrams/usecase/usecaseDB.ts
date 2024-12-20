import type { BaseDiagramConfig, MermaidConfig } from '../../config.type.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';

import { log, setLogLevel } from '../../logger.js';
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

function isUseCaseLabel(label: string | undefined) {
  if (!label) {
    return false;
  }
  label = label.trim();
  return label.startsWith('(') && label.endsWith(')');
}

export class UsecaseDB {
  private aliases = new Map<string, string>();
  private links: UsecaseLink[] = [];
  private nodesMap = new Map<string, UsecaseNode>();
  private systemBoundaries: UsecaseSystemBoundary[] = [];

  constructor() {
    this.clear();
  }

  clear(): void {
    this.aliases = new Map();
    this.links = [];
    this.nodesMap = new Map();
    this.systemBoundaries = [];
    commonClear();
  }

  addAlias(token: string): string {
    const [source, target] = token.split('as').map((_) => _.trim());
    this.aliases.set(source, target);
    return source;
  }

  addParticipant(participant: { service: string; as?: string } | { actor: string; as?: string }) {
    setLogLevel('info');
    log.info('addParticipants', participant);
    const nodeType = 'actor' in participant ? 'actor' : 'service';
    const id = 'actor' in participant ? participant.actor.trim() : participant.service.trim();
    const _ = this.getOrCreateNode(id, nodeType);
    if (participant.as) {
      this.addAlias(`${id} as ${participant.as}`);
    }
  }

  /**
   * Adds an edge to the graph
   * @param source - id of node
   * @param target - id of node
   * @param arrowString - '--&gt;' or '-&gt;' or '-- some text --&gt;'
   */
  addRelationship(source: string, target: string, arrowString: string): void {
    source = common.sanitizeText(source, getConfig());
    target = common.sanitizeText(target, getConfig());
    const sourceNode = this.getOrCreateNode(source, isUseCaseLabel(source) ? 'usecase' : 'actor');
    const targetNode = this.getOrCreateNode(target, isUseCaseLabel(target) ? 'usecase' : 'service');
    const label = (/--(.+?)(-->|->)/.exec(arrowString)?.[1] ?? '').trim();
    const arrow = arrowString.includes('-->') ? '-->' : '->';
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
    return [...this.nodesMap.values()]
      .filter((node) => node.nodeType === 'actor')
      .map((node) => node.id);
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
      ...[...this.nodesMap.values()].map(
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

    // Remove () from use case labels
    // and make them rounded.
    nodes
      .filter((node) => isUseCaseLabel(node.label))
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

  getServices(): string[] {
    return [...this.nodesMap.values()]
      .filter((node) => node.nodeType === 'service')
      .map((node) => node.id);
  }

  getSystemBoundaries() {
    return this.systemBoundaries;
  }

  getUseCases(): string[] {
    return [...this.nodesMap.values()]
      .filter((node) => node.nodeType === 'usecase')
      .map((node) => node.id);
  }

  getAccDescription = getAccDescription;
  getAccTitle = getAccTitle;
  getDiagramTitle = getDiagramTitle;

  setAccTitle = setAccTitle;
  setAccDescription = setAccDescription;
  setDiagramTitle = setDiagramTitle;

  private getOrCreateNode(id: string, nodeType: UsecaseNodeType): UsecaseNode {
    if (!this.nodesMap.has(id)) {
      const node = new UsecaseNode(id, nodeType);
      this.nodesMap.set(id, node);
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

/**
 * can be any of actor, service, or usecase
 */
export class UsecaseNode {
  constructor(
    public id: string,
    public nodeType: UsecaseNodeType | undefined
  ) {}
}

type UsecaseNodeType = 'actor' | 'service' | 'usecase';

type ArrowType = '->' | '-->';

// Export an instance of the class
const db = new UsecaseDB();
export default {
  clear: db.clear.bind(db),
  addParticipant: db.addParticipant.bind(db),
  addRelationship: db.addRelationship.bind(db),
  addAlias: db.addAlias.bind(db),
  getAccDescription,
  getAccTitle,
  getActors: db.getActors.bind(db),
  getConfig: db.getConfig.bind(db),
  getData: db.getData.bind(db),
  getRelationships: db.getRelationships.bind(db),
  getDiagramTitle: db.getDiagramTitle.bind(db),
  getServices: db.getServices.bind(db),
  getSystemBoundaries: db.getSystemBoundaries.bind(db),
  getUseCases: db.getUseCases.bind(db),
  setAccDescription,
  setAccTitle,
  setDiagramTitle: db.setDiagramTitle.bind(db),
  addSystemBoundary: db.addSystemBoundary.bind(db),
};
