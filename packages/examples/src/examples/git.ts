import type { DiagramMetadata } from '../types.js';

export default {
  id: 'gitGraph',
  name: 'Git Graph',
  description: 'Visualize Git repository history and branch relationships',
  examples: [
    {
      title: 'Basic Git Flow',
      isDefault: true,
      code: `gitGraph
    commit id: "a3f82c1"
    branch develop
    checkout develop
    commit id: "b7e41d9"
    commit id: "c9d52e4"
    checkout main
    merge develop id: "d4e8f3a"
    commit id: "e1b6c90"
    branch feature
    checkout feature
    commit id: "f2a8d17"
    commit id: "a8c3f54"
    checkout main
    merge feature id: "b9d7e21"`,
    },
    {
      title: 'Release and Hotfix Workflow',
      code: `gitGraph
    commit id: "initial setup"
    branch develop
    commit id: "feat: login page"
    commit id: "feat: search"
    checkout main
    merge develop tag: "v1.0.0"
    checkout develop
    commit id: "feat: user profile"
    checkout main
    branch hotfix
    commit id: "fix: crash on load"
    checkout main
    merge hotfix tag: "v1.0.1"
    checkout develop
    cherry-pick id: "fix: crash on load"
    commit id: "feat: dark mode"
    checkout main
    merge develop tag: "v1.1.0"`,
    },
    {
      title: 'Highlighted Commits',
      code: `gitGraph TB:
    commit id: "v2 groundwork"
    commit id: "schema migration" type: HIGHLIGHT
    commit id: "revert experiment" type: REVERSE
    commit id: "stabilize" tag: "v2.0.0-rc1"`,
    },
  ],
} satisfies DiagramMetadata;
