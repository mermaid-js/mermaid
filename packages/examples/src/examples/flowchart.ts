import type { DiagramMetadata } from '../types.js';

export default {
  id: 'flowchart-v2',
  name: 'Flowchart',
  description: 'Visualize flowcharts and directed graphs',
  examples: [
    {
      title: 'Basic Flowchart',
      isDefault: true,
      code: `flowchart TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[fa:fa-car Car]`,
    },
  ],
} satisfies DiagramMetadata;
