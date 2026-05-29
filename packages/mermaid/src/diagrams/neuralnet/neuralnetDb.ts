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
  NeuralnetDB,
  NeuralNodeDef,
  NeuralEdgeDef,
  NetworkMode,
} from './neuralnetTypes.js';

let mode: NetworkMode = 'graph';
let nodes: Map<string, NeuralNodeDef> = new Map();
let nodeOrder: string[] = [];
let edges: NeuralEdgeDef[] = [];
let autoIdCounter = 0;

const clear = (): void => {
  mode = 'graph';
  nodes = new Map();
  nodeOrder = [];
  edges = [];
  autoIdCounter = 0;
  commonClear();
};

const setMode = (m: NetworkMode): void => {
  mode = m;
};

const getMode = (): NetworkMode => mode;

const addNode = (node: NeuralNodeDef): void => {
  const resolvedId = node.id || `_node${autoIdCounter++}`;
  const resolved: NeuralNodeDef = { ...node, id: resolvedId };
  nodes.set(resolvedId, resolved);
  nodeOrder.push(resolvedId);
};

const getNodes = (): Map<string, NeuralNodeDef> => nodes;

const getNodeOrder = (): string[] => nodeOrder;

const addEdge = (edge: NeuralEdgeDef): void => {
  edges.push(edge);
};

const getEdges = (): NeuralEdgeDef[] => edges;

export const db: NeuralnetDB = {
  clear,

  setMode,
  getMode,

  addNode,
  getNodes,
  getNodeOrder,

  addEdge,
  getEdges,

  setDiagramTitle,
  getDiagramTitle,
  setAccTitle,
  getAccTitle,
  setAccDescription,
  getAccDescription,
};
