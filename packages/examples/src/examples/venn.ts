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
    union A,B    label: AB, background: skyblue
    union B,C    label: BC, background: orange
    union A,C    label: AC, background: lightgreen
    union A,B,C  label: ABC, color: red,  background: white
    `,
    },
  ],
} satisfies DiagramMetadata;
