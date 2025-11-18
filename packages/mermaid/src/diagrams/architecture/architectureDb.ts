import { getConfig as commonGetConfig } from '../../config.js';
import type { ArchitectureDiagramConfig } from '../../config.type.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import type { DiagramDB } from '../../diagram-api/types.js';
import type { D3Element } from '../../types.js';
import { cleanAndMerge, getEdgeId } from '../../utils.js';
import type { LayoutData, Node, Edge } from '../../rendering-util/types.js';

import {
  clear as commonClear,
  getAccDescription,
  getAccTitle,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle,
} from '../common/commonDb.js';
import type {
  ArchitectureAlignment,
  ArchitectureDirectionPair,
  ArchitectureDirectionPairMap,
  ArchitectureEdge,
  ArchitectureGroup,
  ArchitectureJunction,
  ArchitectureNode,
  ArchitectureService,
  ArchitectureSpatialMap,
  ArchitectureState,
} from './architectureTypes.js';
import {
  getArchitectureDirectionAlignment,
  getArchitectureDirectionPair,
  isArchitectureDirection,
  isArchitectureJunction,
  isArchitectureService,
  shiftPositionByArchitectureDirectionPair,
} from './architectureTypes.js';

const DEFAULT_ARCHITECTURE_CONFIG: Required<ArchitectureDiagramConfig> =
  DEFAULT_CONFIG.architecture;
export class ArchitectureDB implements DiagramDB {
  private nodes: Record<string, ArchitectureNode> = {};
  private groups: Record<string, ArchitectureGroup> = {};
  private edges: ArchitectureEdge[] = [];
  private registeredIds: Record<string, 'node' | 'group'> = {};
  private dataStructures?: ArchitectureState['dataStructures'];
  private elements: Record<string, D3Element> = {};

  constructor() {
    this.clear();
  }

  public clear(): void {
    this.nodes = {};
    this.groups = {};
    this.edges = [];
    this.registeredIds = {};
    this.dataStructures = undefined;
    this.elements = {};
    commonClear();
  }

  public addService({
    id,
    icon,
    in: parent,
    title,
    iconText,
  }: Omit<ArchitectureService, 'edges'>): void {
    if (this.registeredIds[id] !== undefined) {
      throw new Error(
        `The service id [${id}] is already in use by another ${this.registeredIds[id]}`
      );
    }
    if (parent !== undefined) {
      if (id === parent) {
        throw new Error(`The service [${id}] cannot be placed within itself`);
      }
      if (this.registeredIds[parent] === undefined) {
        throw new Error(
          `The service [${id}]'s parent does not exist. Please make sure the parent is created before this service`
        );
      }
      if (this.registeredIds[parent] === 'node') {
        throw new Error(`The service [${id}]'s parent is not a group`);
      }
    }

    this.registeredIds[id] = 'node';

    this.nodes[id] = {
      id,
      type: 'service',
      icon,
      iconText,
      title,
      edges: [],
      in: parent,
    };
  }

  public getServices(): ArchitectureService[] {
    return Object.values(this.nodes).filter(isArchitectureService);
  }

  public addJunction({ id, in: parent }: Omit<ArchitectureJunction, 'edges'>): void {
    this.registeredIds[id] = 'node';

    this.nodes[id] = {
      id,
      type: 'junction',
      edges: [],
      in: parent,
    };
  }

  public getJunctions(): ArchitectureJunction[] {
    return Object.values(this.nodes).filter(isArchitectureJunction);
  }

  public getNodes(): ArchitectureNode[] {
    return Object.values(this.nodes);
  }

  public getNode(id: string): ArchitectureNode | null {
    return this.nodes[id] ?? null;
  }

  public addGroup({ id, icon, in: parent, title }: ArchitectureGroup): void {
    if (this.registeredIds?.[id] !== undefined) {
      throw new Error(
        `The group id [${id}] is already in use by another ${this.registeredIds[id]}`
      );
    }
    if (parent !== undefined) {
      if (id === parent) {
        throw new Error(`The group [${id}] cannot be placed within itself`);
      }
      if (this.registeredIds?.[parent] === undefined) {
        throw new Error(
          `The group [${id}]'s parent does not exist. Please make sure the parent is created before this group`
        );
      }
      if (this.registeredIds?.[parent] === 'node') {
        throw new Error(`The group [${id}]'s parent is not a group`);
      }
    }

    this.registeredIds[id] = 'group';

    this.groups[id] = {
      id,
      icon,
      title,
      in: parent,
    };
  }
  public getGroups(): ArchitectureGroup[] {
    return Object.values(this.groups);
  }
  public addEdge({
    lhsId,
    rhsId,
    lhsDir,
    rhsDir,
    lhsInto,
    rhsInto,
    lhsGroup,
    rhsGroup,
    title,
  }: ArchitectureEdge): void {
    if (!isArchitectureDirection(lhsDir)) {
      throw new Error(
        `Invalid direction given for left hand side of edge ${lhsId}--${rhsId}. Expected (L,R,T,B) got ${String(lhsDir)}`
      );
    }
    if (!isArchitectureDirection(rhsDir)) {
      throw new Error(
        `Invalid direction given for right hand side of edge ${lhsId}--${rhsId}. Expected (L,R,T,B) got ${String(rhsDir)}`
      );
    }

    if (this.nodes[lhsId] === undefined && this.groups[lhsId] === undefined) {
      throw new Error(
        `The left-hand id [${lhsId}] does not yet exist. Please create the service/group before declaring an edge to it.`
      );
    }
    if (this.nodes[rhsId] === undefined && this.groups[rhsId] === undefined) {
      throw new Error(
        `The right-hand id [${rhsId}] does not yet exist. Please create the service/group before declaring an edge to it.`
      );
    }

    const lhsGroupId = this.nodes[lhsId].in;
    const rhsGroupId = this.nodes[rhsId].in;
    if (lhsGroup && lhsGroupId && rhsGroupId && lhsGroupId == rhsGroupId) {
      throw new Error(
        `The left-hand id [${lhsId}] is modified to traverse the group boundary, but the edge does not pass through two groups.`
      );
    }
    if (rhsGroup && lhsGroupId && rhsGroupId && lhsGroupId == rhsGroupId) {
      throw new Error(
        `The right-hand id [${rhsId}] is modified to traverse the group boundary, but the edge does not pass through two groups.`
      );
    }

    const edge = {
      lhsId,
      lhsDir,
      lhsInto,
      lhsGroup,
      rhsId,
      rhsDir,
      rhsInto,
      rhsGroup,
      title,
    };

    this.edges.push(edge);
    if (this.nodes[lhsId] && this.nodes[rhsId]) {
      this.nodes[lhsId].edges.push(this.edges[this.edges.length - 1]);
      this.nodes[rhsId].edges.push(this.edges[this.edges.length - 1]);
    }
  }

  public getEdges(): ArchitectureEdge[] {
    return this.edges;
  }

  /**
   * Returns the current diagram's adjacency list, spatial map, & group alignments.
   * If they have not been created, run the algorithms to generate them.
   * @returns
   */
  public getDataStructures() {
    if (this.dataStructures === undefined) {
      // Tracks how groups are aligned with one another. Generated while creating the adj list
      const groupAlignments: Record<
        string,
        Record<string, Exclude<ArchitectureAlignment, 'bend'>>
      > = {};

      // Create an adjacency list of the diagram to perform BFS on
      // Outer reduce applied on all services
      // Inner reduce applied on the edges for a service
      const adjList = Object.entries(this.nodes).reduce<
        Record<string, ArchitectureDirectionPairMap>
      >((prevOuter, [id, service]) => {
        prevOuter[id] = service.edges.reduce<ArchitectureDirectionPairMap>((prevInner, edge) => {
          // track the direction groups connect to one another
          const lhsGroupId = this.getNode(edge.lhsId)?.in;
          const rhsGroupId = this.getNode(edge.rhsId)?.in;
          if (lhsGroupId && rhsGroupId && lhsGroupId !== rhsGroupId) {
            const alignment = getArchitectureDirectionAlignment(edge.lhsDir, edge.rhsDir);
            if (alignment !== 'bend') {
              groupAlignments[lhsGroupId] ??= {};
              groupAlignments[lhsGroupId][rhsGroupId] = alignment;
              groupAlignments[rhsGroupId] ??= {};
              groupAlignments[rhsGroupId][lhsGroupId] = alignment;
            }
          }

          if (edge.lhsId === id) {
            // source is LHS
            const pair = getArchitectureDirectionPair(edge.lhsDir, edge.rhsDir);
            if (pair) {
              prevInner[pair] = edge.rhsId;
            }
          } else {
            // source is RHS
            const pair = getArchitectureDirectionPair(edge.rhsDir, edge.lhsDir);
            if (pair) {
              prevInner[pair] = edge.lhsId;
            }
          }
          return prevInner;
        }, {});
        return prevOuter;
      }, {});

      // Configuration for the initial pass of BFS
      const firstId = Object.keys(adjList)[0];
      const visited = { [firstId]: 1 };
      // If a key is present in this object, it has not been visited
      const notVisited = Object.keys(adjList).reduce(
        (prev, id) => (id === firstId ? prev : { ...prev, [id]: 1 }),
        {} as Record<string, number>
      );

      // Perform BFS on the adjacency list
      const BFS = (startingId: string): ArchitectureSpatialMap => {
        const spatialMap = { [startingId]: [0, 0] };
        const queue = [startingId];
        while (queue.length > 0) {
          const id = queue.shift();
          if (id) {
            visited[id] = 1;
            delete notVisited[id];
            const adj = adjList[id];
            const [posX, posY] = spatialMap[id];
            Object.entries(adj).forEach(([dir, rhsId]) => {
              if (!visited[rhsId]) {
                spatialMap[rhsId] = shiftPositionByArchitectureDirectionPair(
                  [posX, posY],
                  dir as ArchitectureDirectionPair
                );
                queue.push(rhsId);
              }
            });
          }
        }
        return spatialMap;
      };
      const spatialMaps = [BFS(firstId)];

      // If our diagram is disconnected, keep adding additional spatial maps until all disconnected graphs have been found
      while (Object.keys(notVisited).length > 0) {
        spatialMaps.push(BFS(Object.keys(notVisited)[0]));
      }
      this.dataStructures = {
        adjList,
        spatialMaps,
        groupAlignments,
      };
    }
    return this.dataStructures;
  }

  public setElementForId(id: string, element: D3Element): void {
    this.elements[id] = element;
  }

  public getElementById(id: string): D3Element {
    return this.elements[id];
  }

  public getConfig(): Required<ArchitectureDiagramConfig> {
    return cleanAndMerge({
      ...DEFAULT_ARCHITECTURE_CONFIG,
      ...commonGetConfig().architecture,
    });
  }

  public getConfigField<T extends keyof ArchitectureDiagramConfig>(
    field: T
  ): Required<ArchitectureDiagramConfig>[T] {
    return this.getConfig()[field];
  }

  public setAccTitle = setAccTitle;
  public getAccTitle = getAccTitle;
  public setDiagramTitle = setDiagramTitle;
  public getDiagramTitle = getDiagramTitle;
  public getAccDescription = getAccDescription;
  public setAccDescription = setAccDescription;

  /**
   * Converts architecture diagram data to LayoutData format for unified rendering
   */
  public getData(): LayoutData {
    const config = commonGetConfig();
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const groups = this.getGroups();
    for (const group of groups) {
      const padding = this.getConfigField('padding');
      const fontSize = this.getConfigField('fontSize');

      const groupWidth = 200;
      let groupHeight = 150;

      if (group.title || group.icon) {
        groupHeight += fontSize + padding;
      }

      nodes.push({
        id: group.id,
        label: group.title,
        parentId: group.in,
        isGroup: true,
        shape: 'rect',
        icon: group.icon ? `mermaid-architecture:${group.icon}` : undefined,
        width: groupWidth,
        height: groupHeight,
        padding: padding,
        cssClasses: 'architecture-group',
        cssCompiledStyles: [
          'stroke: #cccccc',
          'stroke-width: 2px',
          'stroke-dasharray: 8,8',
          'fill: transparent',
        ],
        labelStyle: '',
        look: config.look || 'classic',
        rx: 5,
        ry: 5,
      });
    }

    const services = this.getServices();
    for (const service of services) {
      const iconSize = this.getConfigField('iconSize');
      let nodeWidth = iconSize;
      let nodeHeight = iconSize;

      if (service.title) {
        nodeHeight += iconSize * 0.3;
        nodeWidth = Math.max(nodeWidth, iconSize * 1.5);
      }

      nodes.push({
        id: service.id,
        label: service.title,
        parentId: service.in,
        isGroup: false,
        shape: service.icon || (service as any).iconText ? 'icon' : 'squareRect',
        icon: service.icon ? `mermaid-architecture:${service.icon}` : 'mermaid-architecture:blank',
        width: service.width || nodeWidth,
        height: service.height || nodeHeight,
        cssClasses: 'architecture-service',
        look: config.look,
        padding: this.getConfigField('padding') / 4,
        description: (service as any).iconText ? [(service as any).iconText] : undefined,
        assetWidth: iconSize,
        assetHeight: iconSize,
      });
    }

    const junctions = this.getJunctions();
    for (const junction of junctions) {
      nodes.push({
        id: junction.id,
        parentId: junction.in,
        isGroup: false,
        shape: 'squareRect',
        width: 2,
        height: 2,
        cssClasses: 'architecture-junction',
        look: config.look,
        type: 'junction' as any,
        padding: 0,
      });
    }

    const architectureEdges = this.getEdges();
    let edgeCounter = 0;
    for (const edge of architectureEdges) {
      const edgeData = {
        id: getEdgeId(edge.lhsId, edge.rhsId, { counter: edgeCounter, prefix: 'L' }),
        start: edge.lhsId,
        end: edge.rhsId,
        source: edge.lhsId,
        target: edge.rhsId,
        label: edge.title || '',
        labelpos: 'c',
        type: 'normal',
        minlen: 2,
        weight: 1,
        classes: 'edge-thickness-normal edge-pattern-solid architecture-edge',
        look: config.look || 'classic',
        curve: 'linear',
        arrowTypeStart: edge.lhsInto ? 'point' : 'none',
        arrowTypeEnd: edge.rhsInto ? 'point' : 'none',
        arrowheadStyle: 'fill: #333',
        thickness: 'normal',
        pattern: 'solid',
        style: ['stroke: #333333', 'stroke-width: 3px', 'fill: none'],
        cssCompiledStyles: [],
        labelStyle: [],
        lhsDir: edge.lhsDir,
        rhsDir: edge.rhsDir,
        lhsInto: edge.lhsInto,
        rhsInto: edge.rhsInto,
        lhsGroup: edge.lhsGroup,
        rhsGroup: edge.rhsGroup,
      } as Edge & {
        lhsDir: any;
        rhsDir: any;
        lhsInto?: boolean;
        rhsInto?: boolean;
        lhsGroup?: boolean;
        rhsGroup?: boolean;
      };

      edges.push(edgeData);
      edgeCounter++;
    }

    const result = {
      nodes,
      edges,
      config,
      dataStructures: this.getDataStructures(),
    };

    return result;
  }
}
