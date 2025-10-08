import { log } from '../../logger.js';
import {
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
} from '../common/commonDb.js';
import type {
  UsecaseFields,
  UsecaseDB,
  Actor,
  UseCase,
  SystemBoundary,
  Relationship,
  ActorMetadata,
  Direction,
} from './usecaseTypes.js';
import { DEFAULT_DIRECTION } from './usecaseTypes.js';
import type { RequiredDeep } from 'type-fest';
import type { UsecaseDiagramConfig } from '../../config.type.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import { getConfig as getGlobalConfig } from '../../diagram-api/diagramAPI.js';
import type { LayoutData, Node, ClusterNode, Edge } from '../../rendering-util/types.js';

export const DEFAULT_USECASE_CONFIG: Required<UsecaseDiagramConfig> = DEFAULT_CONFIG.usecase;

export const DEFAULT_USECASE_DB: RequiredDeep<UsecaseFields> = {
  actors: new Map(),
  useCases: new Map(),
  systemBoundaries: new Map(),
  relationships: [],
  direction: DEFAULT_DIRECTION,
  config: DEFAULT_USECASE_CONFIG,
} as const;

let actors = new Map<string, Actor>();
let useCases = new Map<string, UseCase>();
let systemBoundaries = new Map<string, SystemBoundary>();
let relationships: Relationship[] = [];
let direction: Direction = DEFAULT_DIRECTION;
const config: Required<UsecaseDiagramConfig> = structuredClone(DEFAULT_USECASE_CONFIG);

const getConfig = (): Required<UsecaseDiagramConfig> => structuredClone(config);

const clear = (): void => {
  actors = new Map();
  useCases = new Map();
  systemBoundaries = new Map();
  relationships = [];
  direction = DEFAULT_DIRECTION;
  commonClear();
};

// Actor management
const addActor = (actor: Actor): void => {
  if (!actor.id || !actor.name) {
    throw new Error(
      `Invalid actor: Actor must have both id and name. Received: ${JSON.stringify(actor)}`
    );
  }

  if (!actors.has(actor.id)) {
    actors.set(actor.id, actor);
    log.debug(`Added actor: ${actor.id} (${actor.name})`);
  } else {
    log.debug(`Actor ${actor.id} already exists`);
  }
};

const getActors = (): Map<string, Actor> => actors;

const getActor = (id: string): Actor | undefined => actors.get(id);

// UseCase management
const addUseCase = (useCase: UseCase): void => {
  if (!useCase.id || !useCase.name) {
    throw new Error(
      `Invalid use case: Use case must have both id and name. Received: ${JSON.stringify(useCase)}`
    );
  }

  if (!useCases.has(useCase.id)) {
    useCases.set(useCase.id, useCase);
    log.debug(`Added use case: ${useCase.id} (${useCase.name})`);
  } else {
    log.debug(`Use case ${useCase.id} already exists`);
  }
};

const getUseCases = (): Map<string, UseCase> => useCases;

const getUseCase = (id: string): UseCase | undefined => useCases.get(id);

// SystemBoundary management
const addSystemBoundary = (systemBoundary: SystemBoundary): void => {
  if (!systemBoundary.id || !systemBoundary.name) {
    throw new Error(
      `Invalid system boundary: System boundary must have both id and name. Received: ${JSON.stringify(systemBoundary)}`
    );
  }

  if (!systemBoundaries.has(systemBoundary.id)) {
    systemBoundaries.set(systemBoundary.id, systemBoundary);
    log.debug(`Added system boundary: ${systemBoundary.name}`);
  } else {
    log.debug(`System boundary ${systemBoundary.id} already exists`);
  }
};

const getSystemBoundaries = (): Map<string, SystemBoundary> => systemBoundaries;

const getSystemBoundary = (id: string): SystemBoundary | undefined => systemBoundaries.get(id);

// Relationship management
const addRelationship = (relationship: Relationship): void => {
  // Validate relationship structure
  if (!relationship.id || !relationship.from || !relationship.to) {
    throw new Error(
      `Invalid relationship: Relationship must have id, from, and to fields. Received: ${JSON.stringify(relationship)}`
    );
  }

  if (!relationship.type) {
    throw new Error(
      `Invalid relationship: Relationship must have a type. Received: ${JSON.stringify(relationship)}`
    );
  }

  // Validate relationship type
  const validTypes = ['association', 'include', 'extend'];
  if (!validTypes.includes(relationship.type)) {
    throw new Error(
      `Invalid relationship type: ${relationship.type}. Valid types are: ${validTypes.join(', ')}`
    );
  }

  // Validate arrow type if present
  if (relationship.arrowType !== undefined) {
    const validArrowTypes = [0, 1, 2]; // SOLID_ARROW, BACK_ARROW, LINE_SOLID
    if (!validArrowTypes.includes(relationship.arrowType)) {
      throw new Error(
        `Invalid arrow type: ${relationship.arrowType}. Valid arrow types are: ${validArrowTypes.join(', ')}`
      );
    }
  }

  relationships.push(relationship);
  log.debug(
    `Added relationship: ${relationship.from} -> ${relationship.to} (${relationship.type})`
  );
};

const getRelationships = (): Relationship[] => relationships;

// Direction management
const setDirection = (dir: Direction): void => {
  // Normalize TD to TB (same as flowchart)
  if (dir === 'TD') {
    direction = 'TB';
  } else {
    direction = dir;
  }
  log.debug('Direction set to:', direction);
};

const getDirection = (): Direction => direction;

// Convert usecase diagram data to LayoutData format for unified rendering
const getData = (): LayoutData => {
  const globalConfig = getGlobalConfig();
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Convert actors to nodes
  for (const actor of actors.values()) {
    const node: Node = {
      id: actor.id,
      label: actor.name,
      description: actor.description ? [actor.description] : undefined,
      shape: 'usecaseActor', // Use custom actor shape
      isGroup: false,
      padding: 10,
      look: globalConfig.look,
      // Add metadata as data attributes for styling
      cssClasses: `usecase-actor ${
        actor.metadata && Object.keys(actor.metadata).length > 0
          ? Object.entries(actor.metadata)
              .map(([key, value]) => `actor-${key}-${value}`)
              .join(' ')
          : ''
      }`.trim(),
      // Pass actor metadata to the shape handler
      metadata: actor.metadata,
    } as Node & { metadata?: ActorMetadata };
    nodes.push(node);
  }

  // Convert use cases to nodes
  for (const useCase of useCases.values()) {
    const node: Node = {
      id: useCase.id,
      label: useCase.name,
      description: useCase.description ? [useCase.description] : undefined,
      shape: 'ellipse', // Use ellipse shape for use cases
      isGroup: false,
      padding: 10,
      look: globalConfig.look,
      cssClasses: 'usecase-element',
      // If use case belongs to a system boundary, set parentId
      ...(useCase.systemBoundary && { parentId: useCase.systemBoundary }),
    };
    nodes.push(node);
  }

  // Convert system boundaries to group nodes
  for (const boundary of systemBoundaries.values()) {
    const node: ClusterNode & { boundaryType?: string } = {
      id: boundary.id,
      label: boundary.name,
      shape: 'usecaseSystemBoundary', // Use custom usecase system boundary cluster shape
      isGroup: true, // System boundaries are clusters (containers for other nodes)
      padding: 20,
      look: globalConfig.look,
      cssClasses: `system-boundary system-boundary-${boundary.type ?? 'rect'}`,
      // Pass boundary type to the shape handler
      boundaryType: boundary.type,
    };
    nodes.push(node);
  }

  // Convert relationships to edges
  relationships.forEach((relationship, index) => {
    const edge: Edge = {
      id: relationship.id || `edge-${index}`,
      start: relationship.from,
      end: relationship.to,
      source: relationship.from,
      target: relationship.to,
      label: relationship.label,
      type: relationship.type,
      arrowTypeEnd:
        relationship.arrowType === 0
          ? 'arrow_point' // Forward arrow (-->)
          : 'none', // No end arrow for back arrow or line
      arrowTypeStart:
        relationship.arrowType === 1
          ? 'arrow_point' // Back arrow (<--)
          : 'none', // No start arrow for forward arrow or line
      classes: `relationship relationship-${relationship.type}`,
      look: globalConfig.look,
      thickness: 'normal',
      pattern: 'solid',
    };
    edges.push(edge);
  });

  return {
    nodes,
    edges,
    config: globalConfig,
    // Additional properties that layout algorithms might expect
    type: 'usecase',
    layoutAlgorithm: 'dagre', // Default layout algorithm
    direction: getDirection(), // Use the current direction setting
    nodeSpacing: 50, // Default node spacing
    rankSpacing: 50, // Default rank spacing
    markers: ['arrow_point'], // Arrow point markers used in usecase diagrams
  };
};

export const db: UsecaseDB = {
  getConfig,

  clear,
  setDiagramTitle,
  getDiagramTitle,
  setAccTitle,
  getAccTitle,
  setAccDescription,
  getAccDescription,

  addActor,
  getActors,
  getActor,

  addUseCase,
  getUseCases,
  getUseCase,

  addSystemBoundary,
  getSystemBoundaries,
  getSystemBoundary,

  addRelationship,
  getRelationships,

  // Direction management
  setDirection,
  getDirection,

  // Add getData method for unified rendering
  getData,
};
