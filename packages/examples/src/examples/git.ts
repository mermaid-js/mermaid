import type { DiagramMetadata } from '../types.js';

export default {
  id: 'gitGraph',
  name: 'Git Graph',
  description: 'Visualize Git repository history and branch relationships',
  examples: [
    {
      title: 'Basic Git Flow',
      code: `gitGraph
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit
    branch feature
    checkout feature
    commit
    commit
    checkout main
    merge feature`,
      isDefault: true,
    },
  ],
} satisfies DiagramMetadata;
