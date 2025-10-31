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
  ClassDef,
} from './usecaseTypes.js';
import { DEFAULT_DIRECTION, ARROW_TYPE } from './usecaseTypes.js';
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
  classDefs: new Map(),
  direction: DEFAULT_DIRECTION,
  config: DEFAULT_USECASE_CONFIG,
} as const;

let actors = new Map<string, Actor>();
let useCases = new Map<string, UseCase>();
let systemBoundaries = new Map<string, SystemBoundary>();
let relationships: Relationship[] = [];
let classDefs = new Map<string, ClassDef>();
let direction: Direction = DEFAULT_DIRECTION;
const config: Required<UsecaseDiagramConfig> = structuredClone(DEFAULT_USECASE_CONFIG);

const getConfig = (): Required<UsecaseDiagramConfig> => structuredClone(config);

const clear = (): void => {
  actors = new Map();
  useCases = new Map();
  systemBoundaries = new Map();
  relationships = [];
  classDefs = new Map();
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
    const validArrowTypes = [0, 1, 2, 3, 4, 5, 6]; // SOLID_ARROW, BACK_ARROW, LINE_SOLID, CIRCLE_ARROW, CROSS_ARROW
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

// ClassDef management
const addClassDef = (classDef: ClassDef): void => {
  if (!classDef.id) {
    throw new Error(
      `Invalid classDef: ClassDef must have an id. Received: ${JSON.stringify(classDef)}`
    );
  }

  classDefs.set(classDef.id, classDef);
  log.debug(`Added classDef: ${classDef.id}`);
};

const getClassDefs = (): Map<string, ClassDef> => classDefs;

const getClassDef = (id: string): ClassDef | undefined => classDefs.get(id);

/**
 * Get compiled styles from class definitions
 * Similar to flowchart's getCompiledStyles method
 */
const getCompiledStyles = (classNames: string[]): string[] => {
  let compiledStyles: string[] = [];
  for (const className of classNames) {
    const cssClass = classDefs.get(className);
    if (cssClass?.styles) {
      compiledStyles = [...compiledStyles, ...(cssClass.styles ?? [])].map((s) => s.trim());
    }
  }
  return compiledStyles;
};

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
    const classesArray = ['default', 'usecase-actor'];
    const cssCompiledStyles = getCompiledStyles(classesArray);

    // Determine which shape to use based on whether actor has an icon
    const actorShape = actor.metadata?.icon ? 'usecaseActorIcon' : 'usecaseActor';

    const node: Node = {
      id: actor.id,
      label: actor.name,
      description: actor.description ? [actor.description] : undefined,
      shape: actorShape, // Use icon shape if icon is present, otherwise stick figure
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
      cssStyles: actor.styles ?? [], // Direct styles
      cssCompiledStyles, // Compiled styles from class definitions
      // Pass actor metadata to the shape handler
      metadata: actor.metadata,
    } as Node & { metadata?: ActorMetadata };
    nodes.push(node);
  }

  // Convert use cases to nodes
  for (const useCase of useCases.values()) {
    // Build CSS classes string
    let cssClasses = 'usecase-element';
    const classesArray = ['default', 'usecase-element'];
    if (useCase.classes && useCase.classes.length > 0) {
      cssClasses += ' ' + useCase.classes.join(' ');
      classesArray.push(...useCase.classes);
    }

    // Get compiled styles from class definitions
    const cssCompiledStyles = getCompiledStyles(classesArray);
    const node: Node = {
      id: useCase.id,
      label: useCase.name,
      description: useCase.description ? [useCase.description] : undefined,
      shape: 'ellipse', // Use ellipse shape for use cases
      isGroup: false,
      padding: 10,
      look: globalConfig.look,
      cssClasses,
      cssStyles: useCase.styles ?? [], // Direct styles
      cssCompiledStyles, // Compiled styles from class definitions
      // If use case belongs to a system boundary, set parentId
      ...(useCase.systemBoundary && { parentId: useCase.systemBoundary }),
    };
    nodes.push(node);
  }

  // Convert system boundaries to group nodes
  for (const boundary of systemBoundaries.values()) {
    const classesArray = [
      'default',
      'system-boundary',
      `system-boundary-${boundary.type ?? 'rect'}`,
    ];
    const cssCompiledStyles = getCompiledStyles(classesArray);

    const node: ClusterNode & { boundaryType?: string } = {
      id: boundary.id,
      label: boundary.name,
      shape: 'usecaseSystemBoundary', // Use custom usecase system boundary cluster shape
      isGroup: true, // System boundaries are clusters (containers for other nodes)
      padding: 20,
      look: globalConfig.look,
      cssClasses: `system-boundary system-boundary-${boundary.type ?? 'rect'}`,
      cssStyles: boundary.styles ?? [], // Direct styles
      cssCompiledStyles, // Compiled styles from class definitions
      // Pass boundary type to the shape handler
      boundaryType: boundary.type,
    };
    nodes.push(node);
  }

  // Convert relationships to edges
  relationships.forEach((relationship, index) => {
    // Determine arrow types based on relationship.arrowType
    let arrowTypeEnd = 'none';
    let arrowTypeStart = 'none';

    switch (relationship.arrowType) {
      case ARROW_TYPE.SOLID_ARROW: // -->
        arrowTypeEnd = 'arrow_point';
        break;
      case ARROW_TYPE.BACK_ARROW: // <--
        arrowTypeStart = 'arrow_point';
        break;
      case ARROW_TYPE.CIRCLE_ARROW: // --o
        arrowTypeEnd = 'arrow_circle';
        break;
      case ARROW_TYPE.CROSS_ARROW: // --x
        arrowTypeEnd = 'arrow_cross';
        break;
      case ARROW_TYPE.CIRCLE_ARROW_REVERSED: // o--
        arrowTypeStart = 'arrow_circle';
        break;
      case ARROW_TYPE.CROSS_ARROW_REVERSED: // x--
        arrowTypeStart = 'arrow_cross';
        break;
      case ARROW_TYPE.LINE_SOLID: // --
        // Both remain 'none'
        break;
    }

    const edge: Edge = {
      id: relationship.id || `edge-${index}`,
      start: relationship.from,
      end: relationship.to,
      source: relationship.from,
      target: relationship.to,
      label: relationship.label,
      labelpos: 'c', // Center label position for proper dagre layout
      type: relationship.type,
      arrowTypeEnd,
      arrowTypeStart,
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

  addClassDef,
  getClassDefs,
  getClassDef,

  // Direction management
  setDirection,
  getDirection,

  // Add getData method for unified rendering
  getData,
};
