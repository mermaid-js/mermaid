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
  (id=NN_ID COLON)? type=NN_TYPE_KW ("[" (params+=NeuralParam ("," params+=NeuralParam)*)? "]")? EOL
;

// Directed edge between two named nodes.
// Example: conv1 --> pool1
NeuralEdge:
  from=NN_ID NN_ARROW to=NN_ID EOL
;

// Accept NN_ID too — lowercase activation names (relu, tanh, softmax) are
// tokenized as NN_ID because it is defined before NN_PARAM_VAL.
// NN_TYPE_KW handles uppercase activation variants (ReLU, Tanh, GELU).
NeuralParam:
  value=(NN_PARAM_VAL | NN_ID | NN_TYPE_KW)
;

// Layer type keywords — uppercase-starting, matched before NN_ID
terminal NN_TYPE_KW returns string:
  /Input|Output|Dense|Linear|Conv1D|Conv2D|Conv3D|MaxPool1D|MaxPool2D|MaxPool3D|AvgPool1D|AvgPool2D|AvgPool3D|GlobalAvgPool|GlobalMaxPool|BatchNorm|LayerNorm|GroupNorm|Dropout|Flatten|Reshape|Embedding|LSTM|GRU|RNN|Bidirectional|Add|Concat|Multiply|Attention|MultiHeadAttention|Activation|ReLU|Sigmoid|Softmax|Tanh|GELU/;

// Node IDs: lowercase-starting identifiers to avoid conflict with NN_TYPE_KW
terminal NN_ID returns string: /[a-z][a-zA-Z0-9_]*/;

// Parameter values: numbers (32, 0.5), dimensions (3x3, 2x2), activation names (relu, tanh)
terminal NN_PARAM_VAL returns string: /[a-zA-Z0-9][a-zA-Z0-9._x]*/;

terminal COLON: ':';
terminal NN_ARROW: /-->/;
