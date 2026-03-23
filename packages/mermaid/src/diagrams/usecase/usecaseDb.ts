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
  parseDiagram: (code: string) => void;
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
}

const RE_SYSTEM         = /system\s+"(.+?)"/;
const RE_LABEL_ALIAS    = /"(.+?)"\s+as\s+(\w+)/;
const RE_REL_BLOCK      = /^(include|extend|generalization|dependency|realization|anchor|constraint|containment):/i;
const RE_NOTE           = /^note\s+"(.+?)"\s+as\s+(\w+)/;
const RE_COLLABORATION  = /^collaboration\s+/;

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

export const addActor         = (alias: string, label: string): void => { model.actors[alias] = label || alias; };
export const setSystem        = (label: string): void => { model.system = label; };
export const addExternal      = (alias: string, label: string): void => { model.externalSystems[alias] = label || alias; };
export const addUseCase       = (alias: string, label: string): void => { model.usecases[alias] = label || alias; };
export const addCollaboration = (alias: string, label: string): void => { model.collaborations[alias] = label || alias; };
export const addNote          = (alias: string, label: string): void => { model.notes[alias] = label || alias; };

type EntityKind = 'actor' | 'usecase' | 'external' | 'collaboration' | 'note' | 'unknown';

function kindOf(alias: string): EntityKind {
  if (model.actors[alias])          { return 'actor'; }
  if (model.usecases[alias])        { return 'usecase'; }
  if (model.externalSystems[alias]) { return 'external'; }
  if (model.collaborations[alias])  { return 'collaboration'; }
  if (model.notes[alias])           { return 'note'; }
  return 'unknown';
}

type AllowedRule = [EntityKind, EntityKind][] | 'any';

const ALLOWED: Partial<Record<RelationshipType, AllowedRule>> = {
  association: [['actor','usecase'],['usecase','actor'],['usecase','usecase'],['usecase','collaboration'],['collaboration','usecase']],
  include: [['usecase', 'usecase']],
  extend: [['usecase', 'usecase']],
  generalization: [['actor','actor'],['usecase','usecase'],['external','external'],['collaboration','collaboration']],
  dependency: [['usecase','usecase'],['usecase','external'],['actor','usecase'],['external','usecase'],['collaboration','usecase'],['collaboration','actor'],['collaboration','external'],['collaboration','collaboration']],
  realization: [['usecase','usecase'],['actor','usecase'],['actor','external'],['actor','note'],['external','usecase'],['collaboration','usecase'],['collaboration','actor'],['collaboration','external'],['collaboration','collaboration']],
  anchor: [['note','usecase'],['note','actor'],['note','external'],['note','collaboration']],
  constraint: 'any',
  containment: [['usecase','usecase'],['external','usecase'],['collaboration','actor'],['collaboration','note']],
};

function isAllowed(from: string, type: RelationshipType, to: string): boolean {
  const rules = ALLOWED[type];
  if (rules === undefined || rules === 'any') {
    return true;
  }
  const fk = kindOf(from);
  const tk = kindOf(to);
  return rules.some(([f, t]) => f === fk && t === tk);
}

export const addConnection = (from: string, type: RelationshipType, to: string, label?: string): void => {
  if (!isAllowed(from, type, to)) {
    log.warn(`usecase: skipped invalid connection — ${from} -[${type}]-> ${to}`);
    return;
  }

  let finalLabel = label?.replace(/"/g, '').trim();
  
  if (type === 'include') {
    finalLabel = '<<include>>';
  } else if (type === 'extend') {
    finalLabel = '<<extend>>';
  }

  model.connections.push({ 
    from: from.trim(), 
    type, 
    to: to.trim(), 
    label: finalLabel 
  });
};

const inferUseCases = (): void => {
  const seen = new Set<string>();
  model.connections.forEach((c) => { 
    seen.add(c.from); 
    seen.add(c.to); 
  });
  seen.forEach((id) => {
    if (!model.actors[id] && !model.externalSystems[id] && !model.usecases[id] && !model.collaborations[id] && !model.notes[id]) {
      model.usecases[id] = id;
    }
  });
};

export const parseDiagram = (code: string): void => {
  const lines = code.split('\n');
  let mode: 'actor' | 'usecase' | 'external' | 'collaboration' | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line === 'usecaseDiagram' || line.startsWith('%%') || line.startsWith('#')) {
      continue;
    }

    if (line.startsWith('system')) {
      const m = RE_SYSTEM.exec(line);
      if (m) { setSystem(m[1]); }
      continue;
    }
    
    if (line === '}') { mode = null; continue; }

    const noteM = RE_NOTE.exec(line);
    if (noteM) { addNote(noteM[2], noteM[1]); continue; }

    const relM = RE_REL_BLOCK.exec(line);
    if (relM) {
      const type = relM[1].toLowerCase() as RelationshipType;
      const content = line.slice(line.indexOf(':') + 1).trim();
      
      content.split(';').forEach((pair) => {
        const isAnchor = pair.includes('--') && !pair.includes('-->');
        const sep = isAnchor ? '--' : '-->';
        
        if (pair.includes(sep)) {
          const parts = pair.split(sep);
          const from = parts[0].trim();
          const rest = parts[1].trim();
          
          const [to, ...labelParts] = rest.split(':');
          const label = labelParts.join(':').trim(); 
          
          if (from && to) {
            addConnection(from, type, to.trim(), label);
          }
        }
      });
      continue;
    }

    if (line.startsWith('actor')) {
      processDefinitions(line.replace(/^actor/, ''), 'actor');
      mode = 'actor';
      continue;
    }
    if (line.startsWith('usecase')) {
      processDefinitions(line.replace(/^usecase/, ''), 'usecase');
      mode = 'usecase';
      continue;
    }
    if (line.startsWith('external')) {
      processDefinitions(line.replace(/^externalSystem|^external/, ''), 'external');
      mode = 'external';
      continue;
    }
    if (RE_COLLABORATION.test(line)) {
      processDefinitions(line.replace(/^collaboration\s+/, ''), 'collaboration');
      mode = 'collaboration';
      continue;
    }

    if (line.includes('..>')) {
      const [from, rest] = line.split('..>').map(s => s.trim());
      const [to, label] = rest.split(':').map(s => s.trim());
      const type = label?.toLowerCase().includes('extend') ? 'extend' : 'include';
      addConnection(from, type, to, label);
      continue;
    }

    if (line.includes('-->')) {
      const [from, targets] = line.split('-->').map(s => s.trim());
      targets.split(';').forEach((t) => {
        const [to, label] = t.split(':').map(s => s.trim());
        if (to) { addConnection(from, 'association', to.trim(), label); }
      });
      continue;
    }

    if (mode) { processDefinitions(line, mode); }
  }
  inferUseCases();
};

function processDefinitions(content: string, type: 'actor' | 'usecase' | 'external' | 'collaboration'): void {
  content.split(';').forEach((part) => {
    const p = part.trim();
    if (!p || p.includes('-->') || p.includes('..>') || p.includes('--')) {
      return;
    }
    const m = RE_LABEL_ALIAS.exec(p);
    if (m) {
      const [, label, alias] = m;
      if (type === 'actor') { addActor(alias, label); }
      else if (type === 'external') { addExternal(alias, label); }
      else if (type === 'collaboration') { addCollaboration(alias, label); }
      else { addUseCase(alias, label); }
    } else {
      const alias = p.split(/\s+/)[0];
      if (alias && alias !== '{') {
        if (type === 'actor') { addActor(alias, alias); }
        else if (type === 'external') { addExternal(alias, alias); }
        else if (type === 'collaboration') { addCollaboration(alias, alias); }
        else { addUseCase(alias, alias); }
      }
    }
  });
}

export const getModel           = (): UseCaseModel => model;
export const getActors          = (): Record<string, string> => model.actors;
export const getUseCases        = (): Record<string, string> => model.usecases;
export const getExternalSystems = (): Record<string, string> => model.externalSystems;
export const getCollaborations  = (): Record<string, string> => model.collaborations;
export const getNotes           = (): Record<string, string> => model.notes;
export const getConnections     = (): Connection[] => model.connections;
export const getSystem          = (): string | null => model.system;
export const clear              = (): void => { model = createEmptyModel(); };
export const setTitle           = (title: string): void => { model.title = title; };
export const getTitle           = (): string => model.title;

const db: UseCaseDB = {
  clear, setTitle, getTitle, parseDiagram, getModel,
  addActor, setSystem, addExternal, addUseCase, addCollaboration, addNote, addConnection,
  getActors, getUseCases, getExternalSystems, getCollaborations, getNotes, getConnections, getSystem,
};

export default db;