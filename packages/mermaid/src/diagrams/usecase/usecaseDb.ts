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
  notes: Record<string, string>;
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
  addNote: (alias: string, label: string) => void;
  addConnection: (from: string, type: RelationshipType, to: string) => void;
  getActors: () => Record<string, string>;
  getUseCases: () => Record<string, string>;
  getExternalSystems: () => Record<string, string>;
  getNotes: () => Record<string, string>;
  getConnections: () => Connection[];
  getSystem: () => string | null;
}

const RE_SYSTEM      = /system\s+"(.+?)"/;
const RE_LABEL_ALIAS = /"(.+?)"\s+as\s+(\w+)/;
const RE_REL_BLOCK   = /^(include|extend|generalization|dependency|realization|anchor|constraint|containment):/i;
const RE_NOTE        = /^note\s+"(.+?)"\s+as\s+(\w+)/;

let model: UseCaseModel = createEmptyModel();

function createEmptyModel(): UseCaseModel {
  return { title: 'System', actors: {}, system: null, externalSystems: {}, usecases: {}, notes: {}, connections: [] };
}

export const addActor    = (alias: string, label: string): void => { model.actors[alias] = label || alias; };
export const setSystem   = (label: string): void => { model.system = label; };
export const addExternal = (alias: string, label: string): void => { model.externalSystems[alias] = label || alias; };
export const addUseCase  = (alias: string, label: string): void => { model.usecases[alias] = label || alias; };
export const addNote     = (alias: string, label: string): void => { model.notes[alias] = label || alias; };

type EntityKind = 'actor' | 'usecase' | 'external' | 'note' | 'unknown';

function kindOf(alias: string): EntityKind {
  if (model.actors[alias])          { return 'actor'; }
  if (model.usecases[alias])        { return 'usecase'; }
  if (model.externalSystems[alias]) { return 'external'; }
  if (model.notes[alias])           { return 'note'; }
  return 'unknown';
}

const ALLOWED: Partial<Record<RelationshipType, [EntityKind, EntityKind][]>> = {
  association:    [['actor','usecase'], ['external','usecase'], ['usecase','external']],
  include:        [['usecase','usecase']],
  extend:         [['usecase','usecase']],
  generalization: [['actor','actor'], ['usecase','usecase']],
  dependency:     [['usecase','usecase'], ['usecase','external']],
  realization:    [['usecase','usecase']],
  constraint:     [['usecase','usecase']],
  anchor:         [['note','usecase'], ['note','actor'], ['note','external']],
  containment:    [], 
};

function isAllowed(from: string, type: RelationshipType, to: string): boolean {
  const rules = ALLOWED[type];
  if (!rules) { return true; }
  if (rules.length === 0) { return false; } 
  const fk = kindOf(from);
  const tk = kindOf(to);
  return rules.some(([f, t]) => f === fk && t === tk);
}

export const addConnection = (from: string, type: RelationshipType, to: string): void => {
  if (!isAllowed(from, type, to)) {
    log.warn(`usecase: invalid connection ${from} -[${type}]-> ${to} — skipped`);
    return;
  }
  model.connections.push({ from: from.trim(), type, to: to.trim() });
};

const inferUseCases = (): void => {
  const seen = new Set<string>();
  model.connections.forEach((c) => { seen.add(c.from); seen.add(c.to); });
  seen.forEach((id) => {
    if (!model.actors[id] && !model.externalSystems[id] && !model.usecases[id] && !model.notes[id]) {
      model.usecases[id] = id;
    }
  });
};

export const parseDiagram = (code: string): void => {
  const lines = code.split('\n');
  let mode: 'actor' | 'usecase' | 'external' | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line === 'useCase' || line === 'usecaseDiagram') { continue; }
    if (line.startsWith('%%') || line.startsWith('#'))            { continue; }

    if (line.startsWith('system')) {
      const m = RE_SYSTEM.exec(line);
      if (m) { setSystem(m[1]); }
      continue;
    }
    if (line === '}') { mode = null; continue; }

    const noteM = RE_NOTE.exec(line);
    if (noteM) { addNote(noteM[2], noteM[1]); continue; }

    if (line.startsWith('actor'))         { mode = 'actor';   processDefinitions(line.replace(/^actor/, ''), 'actor');   continue; }
    if (line.startsWith('usecase'))       { mode = 'usecase'; processDefinitions(line.replace(/^usecase/, ''), 'usecase'); continue; }
    if (line.startsWith('external') || line.startsWith('externalSystem')) {
      mode = 'external';
      processDefinitions(line.replace(/^externalSystem|^external/, ''), 'external');
      continue;
    }

    const relM = RE_REL_BLOCK.exec(line);
    if (relM) {
      const type = relM[1].toLowerCase() as RelationshipType;
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
      const [fromPart, rest] = line.split('..>');
      const from = fromPart.trim();
      const sub  = rest.trim().split(':');
      const to   = sub[0].trim();
      const type: RelationshipType = sub[1]?.toLowerCase().includes('extend') ? 'extend' : 'include';
      addConnection(from, type, to);
      continue;
    }

    if (line.includes('-->')) {
      const [fromPart, targets] = line.split('-->');
      const from = fromPart.trim();
      targets.split(';').forEach((t) => {
        const to = t.trim();
        if (to) { addConnection(from, 'association', to); }
      });
      continue;
    }

    if (mode) { processDefinitions(line, mode); }
  }

  inferUseCases();
};

function processDefinitions(content: string, type: 'actor' | 'usecase' | 'external'): void {
  content.split(';').forEach((part) => {
    const p = part.trim();
    if (!p || p.includes('-->') || p.includes('..>')) { return; }
    const m = RE_LABEL_ALIAS.exec(p);
    if (m) {
      const [, label, alias] = m;
      if (type === 'actor')    { addActor(alias, label); }
      else if (type === 'external') { addExternal(alias, label); }
      else                          { addUseCase(alias, label); }
    } else {
      const alias = p.split(/\s+/)[0];
      if (alias) {
        if (type === 'actor')    { addActor(alias, alias); }
        else if (type === 'external') { addExternal(alias, alias); }
        else                          { addUseCase(alias, alias); }
      }
    }
  });
}

export const getModel            = (): UseCaseModel => model;
export const getActors           = (): Record<string, string> => model.actors;
export const getUseCases         = (): Record<string, string> => model.usecases;
export const getExternalSystems  = (): Record<string, string> => model.externalSystems;
export const getNotes            = (): Record<string, string> => model.notes;
export const getConnections      = (): Connection[] => model.connections;
export const getSystem           = (): string | null => model.system;

export const clear    = (): void => { model = createEmptyModel(); log.debug('usecaseDb cleared'); };
export const setTitle = (title: string): void => { model.title = title; };
export const getTitle = (): string => model.title;

const db: UseCaseDB = {
  clear, setTitle, getTitle, parseDiagram, getModel,
  addActor, setSystem, addExternal, addUseCase, addNote, addConnection,
  getActors, getUseCases, getExternalSystems, getNotes, getConnections, getSystem,
};

export default db;
