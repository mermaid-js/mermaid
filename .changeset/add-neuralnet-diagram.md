---
'mermaid': minor
'@mermaid-js/parser': minor
---

feat(neuralnet): add deep learning neural network diagram type

Adds `neuralnet` as a new diagram type for visualising deep learning neural network architectures.

Features:

- **Sequential mode**: layers listed top-to-bottom are auto-wired, no edge declarations needed
- **Graph mode**: named nodes with explicit `-->` edges, supports skip connections and branches
- **Tensor shape propagation**: output shapes computed automatically for Conv2D, MaxPool, Dense, Flatten, etc.
- **22 layer types**: Input, Dense, Linear, Conv1D/2D/3D, MaxPool/AvgPool (1D–3D), GlobalAvgPool/GlobalMaxPool, BatchNorm, LayerNorm, GroupNorm, Dropout, Flatten, Reshape, Embedding, LSTM, GRU, RNN, Bidirectional, Add, Concat, Multiply, Attention, MultiHeadAttention, Activation, ReLU, Sigmoid, Softmax, Tanh, GELU
- **Color-coded rendering** by layer category (input, dense, conv, pool, norm, recurrent, merge, attention, activation)
- Langium grammar, modular DB/renderer/styles, and unit tests
