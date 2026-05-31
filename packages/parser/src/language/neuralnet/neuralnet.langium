grammar NeuralnetGrammar
import "../common/common";

entry Neuralnet:
  NEWLINE*
  "neuralnet" (mode="sequential")? (renderStyle="neuron")? NEWLINE*
  (
    TitleAndAccessibilities
    | nodes+=NeuralNode
    | edges+=NeuralEdge
    | NEWLINE
  )*
;

// A layer node. In sequential mode, id is optional (auto-generated).
// In graph mode, id: is used to reference the node in edges.
// Examples:
//   Conv2D[32, 3x3, relu]
//   conv1: Conv2D[32, 3x3, relu]
NeuralNode:
  (id=NN_WORD COLON)? type=NN_TYPE_KW ("[" (params+=NeuralParam ("," params+=NeuralParam)*)? "]")? EOL
;

// Directed edge between two named nodes.
// Example: conv1 --> pool1
NeuralEdge:
  from=NN_WORD NN_ARROW to=NN_WORD EOL
;

// NN_WORD covers IDs, numbers, dimensions (3x3), and activation names (relu).
// NN_TYPE_KW takes precedence via terminal ordering, so layer keywords are never
// captured here — only raw param values (32, 0.5, tanh, same, etc.).
NeuralParam:
  value=NN_WORD
;

// Layer type keywords — matched before NN_WORD so they take precedence
terminal NN_TYPE_KW returns string:
  /Input|Output|Dense|Linear|Conv1D|Conv2D|Conv3D|MaxPool1D|MaxPool2D|MaxPool3D|AvgPool1D|AvgPool2D|AvgPool3D|GlobalAvgPool|GlobalMaxPool|BatchNorm|LayerNorm|GroupNorm|Dropout|Flatten|Reshape|Embedding|LSTM|GRU|RNN|Bidirectional|Add|Concat|Multiply|Attention|MultiHeadAttention|Activation|ReLU|Sigmoid|Softmax|Tanh|GELU/;

// Single token for both node IDs (conv1, input) and param values (32, 3x3, relu, 0.5)
// Declared after NN_TYPE_KW so layer keywords are never matched as NN_WORD
terminal NN_WORD returns string: /[a-zA-Z0-9][a-zA-Z0-9._x]*/;

terminal COLON: ':';
terminal NN_ARROW: /-->/;
