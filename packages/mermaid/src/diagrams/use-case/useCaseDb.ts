import type { UseCaseDiagramConfig } from '../../config.type.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import { ImperativeState } from '../../utils/imperativeState.js';
import {
  clear as commonClear,
  getDiagramTitle,
  setDiagramTitle,
  getAccTitle,
  setAccTitle,
  getAccDescription,
  setAccDescription,
} from '../common/commonDb.js';
import type { UseCaseDB, UseCaseActor, UseCaseNode, UseCaseEdge } from './useCaseTypes.js';
import type { D3Element } from '../../types.js';

// eslint-disable-next-line @cspell/spellchecker
const DEFAULT_USECASE_CONFIG: Required<UseCaseDiagramConfig> = DEFAULT_CONFIG.usecase;

const state = new ImperativeState(() => ({
  actors: {} as Record<string, UseCaseActor>,
  useCases: {} as Record<string, UseCaseNode>,
  edges: [] as UseCaseEdge[],
  elements: {} as Record<string, D3Element>,
}));

const clear = () => {
  state.reset();
  commonClear();
};

const addActor = (actor: UseCaseActor) => {
  if (state.records.actors[actor.id]) {
    throw new Error(`Actor with id ${actor.id} already exists.`);
  }
  state.records.actors[actor.id] = actor;
};

const addUseCase = (node: UseCaseNode) => {
  if (state.records.useCases[node.id]) {
    throw new Error(`Use case with id ${node.id} already exists.`);
  }
  state.records.useCases[node.id] = node;
};

const addEdge = (edge: UseCaseEdge) => {
  state.records.edges.push(edge);
};

const getActors = () => Object.values(state.records.actors);
const getUseCases = () => Object.values(state.records.useCases);
const getEdges = () => state.records.edges;

const setElementForId = (id: string, el: D3Element) => {
  state.records.elements[id] = el;
};

const getElementById = (id: string) => state.records.elements[id];

export const db: UseCaseDB = {
  clear,
  setDiagramTitle,
  getDiagramTitle,
  setAccTitle,
  getAccTitle,
  setAccDescription,
  getAccDescription,

  addActor,
  addUseCase,
  addEdge,
  getActors,
  getUseCases,
  getEdges,
  setElementForId,
  getElementById,
};

export function getConfigField<T extends keyof UseCaseDiagramConfig>(
  field: T
): Required<UseCaseDiagramConfig>[T] {
  // eslint-disable-next-line @cspell/spellchecker
  const uc = getConfig().usecase;
  if (uc?.[field] !== undefined) {
    return uc[field] as Required<UseCaseDiagramConfig>[T];
  }
  // eslint-disable-next-line @cspell/spellchecker
  return DEFAULT_USECASE_CONFIG[field];
}
