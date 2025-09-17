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
} from './usecaseTypes.js';
import type { RequiredDeep } from 'type-fest';
import type { UsecaseDiagramConfig } from '../../config.type.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';

export const DEFAULT_USECASE_CONFIG: Required<UsecaseDiagramConfig> = DEFAULT_CONFIG.usecase;

export const DEFAULT_USECASE_DB: RequiredDeep<UsecaseFields> = {
  actors: new Map(),
  useCases: new Map(),
  systemBoundaries: new Map(),
  relationships: [],
  config: DEFAULT_USECASE_CONFIG,
} as const;

let actors = new Map<string, Actor>();
let useCases = new Map<string, UseCase>();
let systemBoundaries = new Map<string, SystemBoundary>();
let relationships: Relationship[] = [];
const config: Required<UsecaseDiagramConfig> = structuredClone(DEFAULT_USECASE_CONFIG);

const getConfig = (): Required<UsecaseDiagramConfig> => structuredClone(config);

const clear = (): void => {
  actors = new Map();
  useCases = new Map();
  systemBoundaries = new Map();
  relationships = [];
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
};
