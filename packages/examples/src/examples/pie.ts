import type { DiagramMetadata } from '../types.js';

export default {
  id: 'pie',
  name: 'Pie Chart',
  description: 'Visualize data as proportional segments of a circle',
  examples: [
    {
      title: 'Basic Pie Chart',
      isDefault: true,
      code: `pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15`,
    },
    {
      title: 'Workday Breakdown with Values',
      code: `pie showData title Where the workday goes (minutes)
    "Focused work" : 210
    "Meetings" : 120
    "Email and chat" : 90
    "Breaks" : 45
    "Context switching" : 15`,
    },
  ],
} satisfies DiagramMetadata;
