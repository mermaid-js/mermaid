import type { DiagramMetadata } from '../types.js';

export default {
  id: 'block',
  name: 'Block Diagram',
  description: 'Create block-based visualizations with beta styling',
  examples: [
    {
      title: 'Basic Block Layout',
      isDefault: true,
      code: `block-beta
columns 1
  db(("DB"))
  blockArrowId6<["&nbsp;&nbsp;&nbsp;"]>(down)
  block:ID
    A
    B["A wide one in the middle"]
    C
  end
  space
  D
  ID --> D
  C --> D
  style B fill:#969,stroke:#333,stroke-width:4px`,
    },
  ],
} satisfies DiagramMetadata;
