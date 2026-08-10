import type { DiagramDB } from '../../diagram-api/types.js';

// ─── Layer Type Catalogue ───────────────────────────────────────────────────

export type LayerType =
  // I/O
  | 'Input'
  | 'Output'
  // Fully-connected
  | 'Dense'
  | 'Linear'
  // Convolutional
  | 'Conv1D'
  | 'Conv2D'
  | 'Conv3D'
  // Pooling
  | 'MaxPool1D'
  | 'MaxPool2D'
  | 'MaxPool3D'
  | 'AvgPool1D'
  | 'AvgPool2D'
  | 'AvgPool3D'
  | 'GlobalAvgPool'
  | 'GlobalMaxPool'
  // Normalisation
  | 'BatchNorm'
  | 'LayerNorm'
  | 'GroupNorm'
  // Regularisation / structural
  | 'Dropout'
  | 'Flatten'
  | 'Reshape'
  | 'Embedding'
  // Recurrent
  | 'LSTM'
  | 'GRU'
  | 'RNN'
  | 'Bidirectional'
  // Merge / element-wise
  | 'Add'
  | 'Concat'
  | 'Multiply'
  // Attention
  | 'Attention'
  | 'MultiHeadAttention'
  // Activation (standalone)
  | 'Activation'
  | 'ReLU'
  | 'Sigmoid'
  | 'Softmax'
  | 'Tanh'
  | 'GELU';

export type LayerCategory =
  | 'input'
  | 'output'
  | 'dense'
  | 'conv'
  | 'pool'
  | 'norm'
  | 'dropout'
  | 'structural'
  | 'recurrent'
  | 'merge'
  | 'attention'
  | 'activation';

export type NetworkMode = 'sequential' | 'graph';
export type RenderStyle = 'block' | 'neuron';

// ─── Data Structures ────────────────────────────────────────────────────────

export interface NeuralNodeDef {
  id: string;
  layerType: LayerType;
  /** Raw parameter strings from the grammar, e.g. ["32", "3x3", "relu"] */
  params: string[];
  /** Computed by renderer from input shape + layer params */
  inputShape?: number[];
  outputShape?: number[];
}

export interface NeuralEdgeDef {
  from: string;
  to: string;
}

export interface NeuralnetFields {
  mode: NetworkMode;
  nodes: Map<string, NeuralNodeDef>;
  nodeOrder: string[];
  edges: NeuralEdgeDef[];
}

// ─── Style Options ───────────────────────────────────────────────────────────

export interface NeuralnetStyleOptions {
  fontFamily: string;
  primaryColor: string;
  primaryTextColor: string;
  lineColor: string;
  darkMode?: boolean;
  // Per-category fill colours (theme-overridable)
  nnInputFill: string;
  nnOutputFill: string;
  nnDenseFill: string;
  nnConvFill: string;
  nnPoolFill: string;
  nnNormFill: string;
  nnDropoutFill: string;
  nnStructuralFill: string;
  nnRecurrentFill: string;
  nnMergeFill: string;
  nnAttentionFill: string;
  nnActivationFill: string;
  nnTextColor: string;
}

// ─── Database Interface ──────────────────────────────────────────────────────

export interface NeuralnetDB extends DiagramDB {
  clear: () => void;

  setMode: (mode: NetworkMode) => void;
  getMode: () => NetworkMode;

  setRenderStyle: (style: RenderStyle) => void;
  getRenderStyle: () => RenderStyle;

  addNode: (node: NeuralNodeDef) => void;
  getNodes: () => Map<string, NeuralNodeDef>;
  getNodeOrder: () => string[];

  addEdge: (edge: NeuralEdgeDef) => void;
  getEdges: () => NeuralEdgeDef[];

  setDiagramTitle: (title: string) => void;
  getDiagramTitle: () => string;
  setAccTitle: (title: string) => void;
  getAccTitle: () => string;
  setAccDescription: (descr: string) => void;
  getAccDescription: () => string;
}
