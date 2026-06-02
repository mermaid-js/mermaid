import type { DiagramMetadata } from '../types.js';

export default {
  id: 'treemap',
  name: 'Treemap',
  description: 'Visualize hierarchical data as nested rectangles',
  examples: [
    {
      title: 'Treemap',
      isDefault: true,
      code: `treemap-beta
"Section 1"
    "Leaf 1.1": 12
    "Section 1.2"
      "Leaf 1.2.1": 12
"Section 2"
    "Leaf 2.1": 20
    "Leaf 2.2": 25`,
    },
  ],
} satisfies DiagramMetadata;
