import type { DiagramMetadata } from '../types.js';

export default {
  id: 'timeline',
  name: 'Timeline Diagram',
  description: 'Visualize events and milestones in chronological order',
  examples: [
    {
      isDefault: true,
      code: `timeline
    title History of Social Media Platform
    2002 : LinkedIn
    2004 : Facebook
         : Google
    2005 : YouTube
    2006 : Twitter`,
      title: 'Project Timeline',
    },
  ],
} satisfies DiagramMetadata;
