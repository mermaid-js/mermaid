// cspell:ignore usecase usecases usecasediagram usecaserenderer collab collabs colour bbox
import { log } from '../../logger.js';
import type { DiagramDB } from '../../diagram-api/types.js';

export type RelationshipType =
  | 'association'
  | 'include'
  | 'extend'
  | 'generalization'
  | 'dependency'
  | 'realization'
  | 'anchor'
  | 'constraint'
  | 'containment';

export interface Connection {
  from: string;
  type: RelationshipType;
  to: string;
  label?: string;
}

export interface UseCaseModel {
  title: string;
  actors: Record<string, string>;
  system: string | null;
  externalSystems: Record<string, string>;
  usecases: Record<string, string>;
  collaborations: Record<string, string>;
  notes: Record<string, string>;
  connections: Connection[];
}

export interface UseCaseDB extends DiagramDB {
  clear: () => void;
  setTitle: (title: string) => void;
  getTitle: () => string;
  getModel: () => UseCaseModel;
  addActor: (alias: string, label: string) => void;
  setSystem: (label: string) => void;
  addExternal: (alias: string, label: string) => void;
  addUseCase: (alias: string, label: string) => void;
  addCollaboration: (alias: string, label: string) => void;
  addNote: (alias: string, label: string) => void;
  addConnection: (from: string, type: RelationshipType, to: string, label?: string) => void;
  getActors: () => Record<string, string>;
  getUseCases: () => Record<string, string>;
  getExternalSystems: () => Record<string, string>;
  getCollaborations: () => Record<string, string>;
  getNotes: () => Record<string, string>;
  getConnections: () => Connection[];
  getSystem: () => string | null;
  inferUseCases: () => void;
}

let model: UseCaseModel = createEmptyModel();

function createEmptyModel(): UseCaseModel {
  return {
    title: 'System',
    actors: {},
    system: null,
    externalSystems: {},
    usecases: {},
    collaborations: {},
    notes: {},
    connections: [],
  };
}

export const addActor = (alias: string, label: string): void => {
  model.actors[alias] = label || alias;
};
export const setSystem = (label: string): void => {
  model.system = label;
};
export const addExternal = (alias: string, label: string): void => {
  model.externalSystems[alias] = label || alias;
};
export const addUseCase = (alias: string, label: string): void => {
  model.usecases[alias] = label || alias;
};
export const addCollaboration = (alias: string, label: string): void => {
  model.collaborations[alias] = label || alias;
};
export const addNote = (alias: string, label: string): void => {
  model.notes[alias] = label || alias;
};

type EntityKind = 'actor' | 'usecase' | 'external' | 'collaboration' | 'note' | 'unknown';

function kindOf(alias: string): EntityKind {
  if (model.actors[alias]) {
    return 'actor';
  }
  if (model.usecases[alias]) {
    return 'usecase';
  }
  if (model.externalSystems[alias]) {
    return 'external';
  }
  if (model.collaborations[alias]) {
    return 'collaboration';
  }
  if (model.notes[alias]) {
    return 'note';
  }
  return 'unknown';
}

const ALLOWED: Record<RelationshipType, [EntityKind, EntityKind][]> = {
  association: [
    ['actor', 'usecase'],
    ['usecase', 'actor'],
    ['usecase', 'usecase'],
    ['usecase', 'collaboration'],
    ['collaboration', 'usecase'],
  ],
  include: [['usecase', 'usecase']],
  extend: [['usecase', 'usecase']],
  generalization: [
    ['actor', 'actor'],
    ['usecase', 'usecase'],
    ['external', 'external'],
    ['collaboration', 'collaboration'],
  ],
  dependency: [
    ['usecase', 'usecase'],
    ['usecase', 'external'],
    ['actor', 'usecase'],
    ['external', 'usecase'],
    ['collaboration', 'usecase'],
  ],
  realization: [
    ['usecase', 'usecase'],
    ['actor', 'usecase'],
    ['actor', 'external'],
    ['external', 'usecase'],
    ['collaboration', 'usecase'],
  ],
  anchor: [
    ['note', 'usecase'],
    ['note', 'actor'],
    ['note', 'external'],
    ['note', 'collaboration'],
  ],
  constraint: [
    ['note', 'note'],
    ['note', 'usecase'],
    ['note', 'actor'],
    ['note', 'external'],
    ['note', 'collaboration'],
    ['usecase', 'note'],
    ['actor', 'note'],
    ['external', 'note'],
    ['collaboration', 'note'],
  ],
  containment: [
    ['usecase', 'usecase'],
    ['external', 'usecase'],
    ['collaboration', 'usecase'],
    ['collaboration', 'note'],
  ],
};

function isAllowed(from: string, type: RelationshipType, to: string): boolean {
  const rules = ALLOWED[type];
  if (!rules) {
    return false;
  }
  const fk = kindOf(from);
  const tk = kindOf(to);
  // Plain 'association' may reference entities not yet declared — they will
  // be inferred as usecases by inferUseCases() after parsing finishes.
  // Allow unknown only for plain associations. All explicitly-typed relationships
  // must have both sides already declared.
  if (type === 'association' && (fk === 'unknown' || tk === 'unknown')) {
    return true;
  }
  return rules.some(([f, t]) => f === fk && t === tk);
}

export const addConnection = (
  from: string,
  type: RelationshipType,
  to: string,
  label?: string
): void => {
  if (!isAllowed(from, type, to)) {
    log.warn(`Invalid relationship: ${from} -[${type}]-> ${to}`);
    return;
  }
  let finalLabel = label?.replace(/"/g, '').trim() || undefined;
  if (type === 'include') {
    finalLabel = '<<include>>';
  }
  if (type === 'extend') {
    finalLabel = '<<extend>>';
  }
  model.connections.push({ from: from.trim(), type, to: to.trim(), label: finalLabel });
};

/** Infer usecases from connection endpoints that were not explicitly declared. */
export const inferUseCases = (): void => {
  const seen = new Set<string>();
  model.connections.forEach((c) => {
    seen.add(c.from);
    seen.add(c.to);
  });
  seen.forEach((id) => {
    if (
      !model.actors[id] &&
      !model.externalSystems[id] &&
      !model.usecases[id] &&
      !model.collaborations[id] &&
      !model.notes[id]
    ) {
      model.usecases[id] = id;
    }
  });
};

export const getModel = (): UseCaseModel => model;
export const getActors = (): Record<string, string> => model.actors;
export const getUseCases = (): Record<string, string> => model.usecases;
export const getExternalSystems = (): Record<string, string> => model.externalSystems;
export const getCollaborations = (): Record<string, string> => model.collaborations;
export const getNotes = (): Record<string, string> => model.notes;
export const getConnections = (): Connection[] => model.connections;
export const getSystem = (): string | null => model.system;
export const clear = (): void => {
  model = createEmptyModel();
};
export const setTitle = (title: string): void => {
  model.title = title;
};
export const getTitle = (): string => model.title;

const db: UseCaseDB = {
  clear,
  setTitle,
  getTitle,
  getModel,
  addActor,
  setSystem,
  addExternal,
  addUseCase,
  addCollaboration,
  addNote,
  addConnection,
  getActors,
  getUseCases,
  getExternalSystems,
  getCollaborations,
  getNotes,
  getConnections,
  getSystem,
  inferUseCases,
};
export default db;
