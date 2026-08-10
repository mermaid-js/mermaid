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
  RenderStyle,
} from './neuralnetTypes.js';

let mode: NetworkMode = 'graph';
let renderStyle: RenderStyle = 'block';
let nodes = new Map<string, NeuralNodeDef>();
let nodeOrder: string[] = [];
let edges: NeuralEdgeDef[] = [];
let autoIdCounter = 0;

const clear = (): void => {
  mode = 'graph';
  renderStyle = 'block';
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

const setRenderStyle = (s: RenderStyle): void => {
  renderStyle = s;
};
const getRenderStyle = (): RenderStyle => renderStyle;

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
  setRenderStyle,
  getRenderStyle,

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
