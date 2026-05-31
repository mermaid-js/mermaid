import type { DiagramMetadata } from '../types.js';

export default {
  id: 'neuralnet',
  name: 'Neural Network',
  description: 'Visualizing neural network layers and topologies',
  examples: [
    {
      title: 'My CNN',
      isDefault: true,
      code: `neuralnet sequential
  title My CNN
  Input[28, 28, 1]
  Conv2D[32, 3x3, relu]
  MaxPool2D[2x2]
  Flatten
  Dense[128, relu]
  Dense[10, softmax]
`,
    },
  ],
} satisfies DiagramMetadata;
