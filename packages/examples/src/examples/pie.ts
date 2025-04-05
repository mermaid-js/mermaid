import type { DiagramMetadata } from '../types.js';

export default {
  id: 'pie',
  name: 'Pie Chart',
  description: 'Visualize data as proportional segments of a circle',
  examples: [
    {
      title: 'Basic Pie Chart',
      code: `pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15`,
      isDefault: true,
    },
  ],
} satisfies DiagramMetadata;
