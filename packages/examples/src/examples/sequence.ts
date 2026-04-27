import type { DiagramMetadata } from '../types.js';

export default {
  id: 'sequence',
  name: 'Sequence Diagram',
  description: 'Visualize interactions between objects over time',
  examples: [
    {
      title: 'Basic Sequence',
      isDefault: true,
      code: `sequenceDiagram
    Alice->>+John: Hello John, how are you?
    Alice->>+John: John, can you hear me?
    John-->>-Alice: Hi Alice, I can hear you!
    John-->>-Alice: I feel great!`,
    },
  ],
} satisfies DiagramMetadata;
