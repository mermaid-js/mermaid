import type { DiagramMetadata } from '../types.js';

export default {
  id: 'timeline',
  name: 'Timeline Diagram',
  description: 'Visualize events and milestones in chronological order',
  examples: [
    {
      title: 'Project Timeline',
      isDefault: true,
      code: `timeline
    title History of Social Media Platform
    2002 : LinkedIn
    2004 : Facebook
         : Google
    2005 : YouTube
    2006 : Twitter`,
    },
    {
      title: 'Product Roadmap with Sections',
      code: `timeline
    title Product Roadmap 2024
    section Q1 Foundations
        January : Team hired : Tech stack chosen
        February : MVP scoped
        March : Alpha release
    section Q2 Growth
        April : Beta program opens
        May : Mobile app : Public API
        June : v1.0 launch`,
    },
  ],
} satisfies DiagramMetadata;
