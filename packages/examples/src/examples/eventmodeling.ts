import type { DiagramMetadata } from '../types.js';

export default {
  id: 'eventmodeling',
  name: 'Event Modeling Diagram',
  description:
    'Describe systems using an example of how information has changed within them over time',
  examples: [
    {
      title: 'Event Modeling',
      isDefault: true,
      code: `eventmodeling

tf 01 ui CartUI
tf 02 cmd AddItem
tf 03 evt ItemAdded
tf 04 rmo CartItems ->> 03
tf 05 evt AccountingItemAdded
`,
    },
  ],
} satisfies DiagramMetadata;
