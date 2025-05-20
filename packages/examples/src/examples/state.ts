import type { DiagramMetadata } from '../types.js';

export default {
  id: 'stateDiagram',
  name: 'State Diagram',
  description: 'Visualize the states and transitions of a system',
  examples: [
    {
      title: 'Basic State Diagram',
      code: `stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`,
      isDefault: true,
    },
  ],
} satisfies DiagramMetadata;
