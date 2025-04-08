import type { DiagramMetadata } from '../types.js';

export default {
  id: 'journey',
  name: 'User Journey Diagram',
  description: 'Visualize user interactions and experiences with a system',
  examples: [
    {
      title: 'My Working Day',
      isDefault: true,
      code: `journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me`,
    },
  ],
} satisfies DiagramMetadata;
