import type { DiagramMetadata } from '../types.js';

export default {
  id: 'venn',
  name: 'Venn Diagram',
  description: 'Represent relationships in overlapping circles',
  examples: [
    {
      title: 'Sales Revenue',
      isDefault: true,
      code: `venn-beta
    title "Three overlapping sets"
    set A
    set B
    set C
    union A,B["AB"]
    union B,C["BC"]
    union A,C["AC"]
    union A,B,C["ABC"]
    style A,B fill:skyblue
    style B,C fill:orange
    style A,C fill:lightgreen
    style A,B,C fill:white, color:red
    `,
    },
  ],
} satisfies DiagramMetadata;
