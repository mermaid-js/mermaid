// cspell:ignore usecase usecases usecasediagram
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
}

export interface UseCaseModel {
  title: string;
  actors: Record<string, string>;
  system: string | null;
  externalSystems: Record<string, string>;
  usecases: Record<string, string>;
  connections: Connection[];
}

export interface UseCaseDB extends DiagramDB {
  clear: () => void;
  setTitle: (title: string) => void;
  getTitle: () => string;
  parseDiagram: (code: string) => void;
  getModel: () => UseCaseModel;
  addActor: (alias: string, label: string) => void;
  setSystem: (label: string) => void;
  addExternal: (alias: string, label: string) => void;
  addUseCase: (alias: string, label: string) => void;
  addConnection: (from: string, type: RelationshipType, to: string) => void;
  getActors: () => Record<string, string>;
  getUseCases: () => Record<string, string>;
  getExternalSystems: () => Record<string, string>;
  getConnections: () => Connection[];
  getSystem: () => string | null;
}

const RE_SYSTEM       = /system\s+"(.+?)"/;
const RE_LABEL_ALIAS  = /"(.+?)"\s+as\s+(\w+)/;
const RE_REL_BLOCK    = /^(include|extend|generalization|dependency|realization|anchor|constraint|containment):/i;

let model: UseCaseModel = createEmptyModel();

function createEmptyModel(): UseCaseModel {
  return {
    title: 'System',
    actors: {},
    system: null,
    externalSystems: {},
    usecases: {},
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

export const addConnection = (from: string, type: RelationshipType, to: string): void => {
  model.connections.push({ from: from.trim(), type, to: to.trim() });
};

const inferUseCases = (): void => {
  const entities = new Set<string>();
  model.connections.forEach((c) => { entities.add(c.from); entities.add(c.to); });
  entities.forEach((entity) => {
    if (!model.actors[entity] && !model.externalSystems[entity] && !model.usecases[entity]) {
      model.usecases[entity] = entity;
    }
  });
};

export const parseDiagram = (code: string): void => {
  const lines = code.split('\n');
  let mode: 'actor' | 'usecase' | 'external' | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line === 'useCase' || line === 'usecaseDiagram' || line.startsWith('#')) {
      continue;
    }

    if (line.startsWith('system')) {
      const m = RE_SYSTEM.exec(line);
      if (m) { setSystem(m[1]); }
      continue;
    }

    if (line === '}') { mode = null; continue; }

    if (line.startsWith('actor')) {
      mode = 'actor';
      processDefinitions(line.replace(/^actor/, ''), 'actor');
      continue;
    }
    if (line.startsWith('usecase')) {
      mode = 'usecase';
      processDefinitions(line.replace(/^usecase/, ''), 'usecase');
      continue;
    }
    if (line.startsWith('external')) {
      mode = 'external';
      processDefinitions(line.replace(/^external/, ''), 'external');
      continue;
    }

    const relMatch = RE_REL_BLOCK.exec(line);
    if (relMatch) {
      const type = relMatch[1].toLowerCase() as RelationshipType;
      const content = line.slice(line.indexOf(':') + 1);
      content.split(';').forEach((pair) => {
        if (pair.includes('-->')) {
          const [from, to] = pair.split('-->').map((s) => s.trim());
          if (from && to) { addConnection(from, type, to); }
        }
      });
      continue;
    }

    if (line.includes('..>')) {
      const parts = line.split('..>');
      const from = parts[0].trim();
      const rest = parts[1].trim();
      let to: string;
      let type: RelationshipType = 'include';
      if (rest.includes(':')) {
        const sub = rest.split(':');
        to = sub[0].trim();
        if (sub[1].toLowerCase().includes('extend')) { type = 'extend'; }
      } else {
        const sub = rest.split(/\s+/);
        to = sub[0].trim();
        if (sub[1]?.toLowerCase().includes('extend')) { type = 'extend'; }
      }
      addConnection(from, type, to);
      continue;
    }

    if (line.includes('-->')) {
      const [fromPart, targetsPart] = line.split('-->');
      const from = fromPart.trim();
      targetsPart.split(';').forEach((t) => {
        const to = t.trim();
        if (to) { addConnection(from, 'association', to); }
      });
      continue;
    }

    if (mode) { processDefinitions(line, mode); }
  }

  inferUseCases();
};

function processDefinitions(
  content: string,
  type: 'actor' | 'usecase' | 'external',
): void {
  content.split(';').forEach((part) => {
    const p = part.trim();
    if (!p || p.includes('-->') || p.includes('..>')) { return; }

    const m = RE_LABEL_ALIAS.exec(p);
    if (m) {
      const [, label, alias] = m;
      if (type === 'actor')         { addActor(alias, label); }
      else if (type === 'external') { addExternal(alias, label); }
      else                          { addUseCase(alias, label); }
    } else {
      const alias = p.split(/\s+/)[0];
      if (alias) {
        if (type === 'actor')         { addActor(alias, alias); }
        else if (type === 'external') { addExternal(alias, alias); }
        else                          { addUseCase(alias, alias); }
      }
    }
  });
}

export const getModel = (): UseCaseModel => model;
export const getActors = (): Record<string, string> => model.actors;
export const getUseCases = (): Record<string, string> => model.usecases;
export const getExternalSystems = (): Record<string, string> => model.externalSystems;
export const getConnections = (): Connection[] => model.connections;
export const getSystem = (): string | null => model.system;

export const clear = (): void => {
  model = createEmptyModel();
  log.debug('usecaseDb cleared');
};

export const setTitle = (title: string): void => { model.title = title; };
export const getTitle = (): string => model.title;

const db: UseCaseDB = {
  clear,
  setTitle,
  getTitle,
  parseDiagram,
  getModel,
  addActor,
  setSystem,
  addExternal,
  addUseCase,
  addConnection,
  getActors,
  getUseCases,
  getExternalSystems,
  getConnections,
  getSystem,
};

export default db;
