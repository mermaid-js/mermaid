import { getConfig as commonGetConfig } from '../../config.js';
import type { ArchitectureDiagramConfig } from '../../config.type.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import type { DiagramDB } from '../../diagram-api/types.js';
import type { D3Element } from '../../types.js';
import { cleanAndMerge } from '../../utils.js';
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
  ArchitectureAdjacencyList,
  ArchitectureDirectionPairMap,
  ArchitectureEdge,
  ArchitectureGroup,
  ArchitectureGroupAlignments,
  ArchitectureJunction,
  ArchitectureLayoutHint,
  ArchitectureNode,
  ArchitectureService,
  ArchitectureSpatialMap,
  ArchitectureState,
} from './architectureTypes.js';
import {
  architectureGroupAlignmentKey,
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
  private nodes = new Map<string, ArchitectureNode>();
  private groups = new Map<string, ArchitectureGroup>();
  private edges: ArchitectureEdge[] = [];
  private layoutHints: ArchitectureLayoutHint[] = [];
  private registeredIds = new Map<string, 'node' | 'group'>();
  private dataStructures?: ArchitectureState['dataStructures'];
  private elements = new Map<string, D3Element>();
  private diagramId = '';

  constructor() {
    this.clear();
  }

  public setDiagramId(id: string): void {
    this.diagramId = id;
  }

  public getDiagramId(): string {
    return this.diagramId;
  }

  public clear(): void {
    this.nodes = new Map();
    this.groups = new Map();
    this.edges = [];
    this.layoutHints = [];
    this.registeredIds = new Map();
    this.dataStructures = undefined;
    this.elements = new Map();
    this.diagramId = '';
    commonClear();
  }

  public addService({
    id,
    icon,
    in: parent,
    title,
    iconText,
  }: Omit<ArchitectureService, 'edges'>): void {
    if (this.registeredIds.has(id)) {
      throw new Error(
        `The service id [${id}] is already in use by another ${this.registeredIds.get(id)}`
      );
    }
    if (parent !== undefined) {
      if (id === parent) {
        throw new Error(`The service [${id}] cannot be placed within itself`);
      }
      if (!this.registeredIds.has(parent)) {
        throw new Error(
          `The service [${id}]'s parent does not exist. Please make sure the parent is created before this service`
        );
      }
      if (this.registeredIds.get(parent) === 'node') {
        throw new Error(`The service [${id}]'s parent is not a group`);
      }
    }

    this.registeredIds.set(id, 'node');

    this.nodes.set(id, {
      id,
      type: 'service',
      icon,
      iconText,
      title,
      edges: [],
      in: parent,
    });
  }

  public getServices(): ArchitectureService[] {
    return [...this.nodes.values()].filter(isArchitectureService);
  }

  public addJunction({ id, in: parent }: Omit<ArchitectureJunction, 'edges'>): void {
    if (this.registeredIds.has(id)) {
      throw new Error(
        `The junction id [${id}] is already in use by another ${this.registeredIds.get(id)}`
      );
    }
    if (parent !== undefined) {
      if (id === parent) {
        throw new Error(`The junction [${id}] cannot be placed within itself`);
      }
      if (!this.registeredIds.has(parent)) {
        throw new Error(
          `The junction [${id}]'s parent does not exist. Please make sure the parent is created before this junction`
        );
      }
      if (this.registeredIds.get(parent) === 'node') {
        throw new Error(`The junction [${id}]'s parent is not a group`);
      }
    }

    this.registeredIds.set(id, 'node');

    this.nodes.set(id, {
      id,
      type: 'junction',
      edges: [],
      in: parent,
    });
  }

  public getJunctions(): ArchitectureJunction[] {
    return [...this.nodes.values()].filter(isArchitectureJunction);
  }

  public getNodes(): ArchitectureNode[] {
    return [...this.nodes.values()];
  }

  public getNode(id: string): ArchitectureNode | null {
    return this.nodes.get(id) ?? null;
  }

  public addGroup({ id, icon, in: parent, title }: ArchitectureGroup): void {
    if (this.registeredIds.has(id)) {
      throw new Error(
        `The group id [${id}] is already in use by another ${this.registeredIds.get(id)}`
      );
    }
    if (parent !== undefined) {
      if (id === parent) {
        throw new Error(`The group [${id}] cannot be placed within itself`);
      }
      if (!this.registeredIds.has(parent)) {
        throw new Error(
          `The group [${id}]'s parent does not exist. Please make sure the parent is created before this group`
        );
      }
      if (this.registeredIds.get(parent) === 'node') {
        throw new Error(`The group [${id}]'s parent is not a group`);
      }
    }

    this.registeredIds.set(id, 'group');

    this.groups.set(id, {
      id,
      icon,
      title,
      in: parent,
    });
  }
  public getGroups(): ArchitectureGroup[] {
    return [...this.groups.values()];
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

    if (!this.nodes.has(lhsId) && !this.groups.has(lhsId)) {
      throw new Error(
        `The left-hand id [${lhsId}] does not yet exist. Please create the service/group before declaring an edge to it.`
      );
    }
    if (!this.nodes.has(rhsId) && !this.groups.has(rhsId)) {
      throw new Error(
        `The right-hand id [${rhsId}] does not yet exist. Please create the service/group before declaring an edge to it.`
      );
    }

    const lhsGroupId = this.nodes.get(lhsId)!.in;
    const rhsGroupId = this.nodes.get(rhsId)!.in;
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
    const lhsNode = this.nodes.get(lhsId);
    const rhsNode = this.nodes.get(rhsId);
    if (lhsNode && rhsNode) {
      lhsNode.edges.push(this.edges[this.edges.length - 1]);
      rhsNode.edges.push(this.edges[this.edges.length - 1]);
    }
  }

  public getEdges(): ArchitectureEdge[] {
    return this.edges;
  }

  public addLayoutHint(hint: ArchitectureLayoutHint): void {
    if (hint.members.length < 2) {
      throw new Error(
        `An align directive requires at least two members; got ${hint.members.length}`
      );
    }
    const seen = new Set<string>();
    hint.members.forEach((id) => {
      if (this.registeredIds.get(id) !== 'node') {
        throw new Error(
          `align ${hint.direction} references [${id}], which is not a service or junction`
        );
      }
      if (seen.has(id)) {
        throw new Error(`align ${hint.direction} lists [${id}] more than once`);
      }
      seen.add(id);
    });
    this.layoutHints.push(hint);
  }

  public getLayoutHints(): ArchitectureLayoutHint[] {
    return this.layoutHints;
  }

  /**
   * Returns the current diagram's adjacency list, spatial map, & group alignments.
   * If they have not been created, run the algorithms to generate them.
   * @returns
   */
  public getDataStructures() {
    if (this.dataStructures === undefined) {
      // Tracks how groups are aligned with one another. Generated while creating the adj list
      const groupAlignments: ArchitectureGroupAlignments = new Map();

      // Create an adjacency list of the diagram to perform BFS on
      // Outer Map applied on all services
      // Inner Map applied on the edges for a service
      const adjList: ArchitectureAdjacencyList = new Map();
      for (const [id, service] of this.nodes.entries()) {
        const directionMap: ArchitectureDirectionPairMap = new Map();
        for (const edge of service.edges) {
          // track the direction groups connect to one another
          const lhsGroupId = this.getNode(edge.lhsId)?.in;
          const rhsGroupId = this.getNode(edge.rhsId)?.in;
          if (lhsGroupId && rhsGroupId && lhsGroupId !== rhsGroupId) {
            const alignment = getArchitectureDirectionAlignment(edge.lhsDir, edge.rhsDir);
            if (alignment !== 'bend') {
              groupAlignments.set(architectureGroupAlignmentKey(lhsGroupId, rhsGroupId), alignment);
            }
          }

          if (edge.lhsId === id) {
            // source is LHS
            const pair = getArchitectureDirectionPair(edge.lhsDir, edge.rhsDir);
            if (pair) {
              directionMap.set(pair, edge.rhsId);
            }
          } else {
            // source is RHS
            const pair = getArchitectureDirectionPair(edge.rhsDir, edge.lhsDir);
            if (pair) {
              directionMap.set(pair, edge.lhsId);
            }
          }
        }

        adjList.set(id, directionMap);
      }

      const visited = new Set<string>();
      // If a key is present in this set, it has not been visited
      const notVisited = new Set(adjList.keys());

      // Perform BFS on the adjacency list
      const BFS = (startingId: string): ArchitectureSpatialMap => {
        const spatialMap: ArchitectureSpatialMap = new Map([[startingId, [0, 0]]]);
        const queue = [startingId];
        while (queue.length > 0) {
          const id = queue.shift();
          if (id) {
            visited.add(id);
            notVisited.delete(id);
            const adj = adjList.get(id);
            if (!adj) {
              throw new Error(
                `BFS error: adjacency list for id ${id} not found. Please report this as a bug.`
              );
            }
            const pos = spatialMap.get(id);
            if (!pos) {
              throw new Error(
                `BFS error: position for id ${id} not found in spatial map. Please report this as a bug.`
              );
            }
            const [posX, posY] = pos;
            adj.forEach((rhsId, dir) => {
              if (!visited.has(rhsId)) {
                spatialMap.set(rhsId, shiftPositionByArchitectureDirectionPair([posX, posY], dir));
                queue.push(rhsId);
              }
            });
          }
        }
        return spatialMap;
      };
      const spatialMaps: ArchitectureSpatialMap[] = [];

      // Keep performing BFS until all nodes have been visited.
      // If our diagram is disconnected, keep adding additional spatial maps until all disconnected graphs have been found
      while (notVisited.size > 0) {
        const firstId = notVisited.values().next().value!;
        spatialMaps.push(BFS(firstId));
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
    this.elements.set(id, element);
  }

  public getElementById(id: string): D3Element {
    return this.elements.get(id);
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
}

/**
 * Typed wrapper for resolving an architecture diagram's config fields. Returns the default value if undefined
 * @param field - the config field to access
 * @returns
 */
// export function getConfigField<T extends keyof ArchitectureDiagramConfig>(
//   field: T
// ): Required<ArchitectureDiagramConfig>[T] {
//   return db.getConfig()[field];
// }
