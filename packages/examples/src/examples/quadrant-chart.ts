import type { DiagramMetadata } from '../types.js';

export default {
  id: 'quadrantChart',
  name: 'Quadrant Chart',
  description: 'Visualize items in a 2x2 matrix based on two variables',
  examples: [
    {
      title: 'Product Positioning',
      isDefault: true,
      code: `quadrantChart
    title Reach and engagement of campaigns
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]
    Campaign C: [0.57, 0.69]
    Campaign D: [0.78, 0.34]
    Campaign E: [0.40, 0.34]
    Campaign F: [0.35, 0.78]`,
    },
  ],
} satisfies DiagramMetadata;
