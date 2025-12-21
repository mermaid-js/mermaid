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
    sets A
    sets B
    sets C
    sets A,B    label: AB, background: skyblue
    sets B,C    label: BC, background: orange
    sets A,C    label: AC, background: lightgreen
    sets A,B,C  label: ABC, color: red,  background: white
    `,
    },
  ],
} satisfies DiagramMetadata;
