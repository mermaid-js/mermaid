# Release: mermaid.min.js (Flowchart-Only + ELK Default)

**Version:** 11.12.1  
**Based on:** `copilot/release-graph` branch (PR #1)

## Summary of Changes

This release produces a streamlined, flowchart-only build of Mermaid with the
ELK layout engine enabled by default.

### Key Changes

- **ELK as default layout engine** – The `defaultRenderer` in
  `FlowchartDiagramConfig` was changed from `dagre-wrapper` to `elk`, so
  diagrams use ELK without needing
  `%%{init: {"flowchart": {"defaultRenderer": "elk"}} }%%` front-matter.

- **Removed all non-flowchart diagrams** – 21 diagram types were deleted
  (sequence, state, class, ER, gantt, git, pie, timeline, user-journey, mindmap,
  kanban, quadrant-chart, requirement, architecture, sankey, C4, block, packet,
  radar, xychart, treemap, info). Only `flowchart`, `flowchartV2`,
  `flowchartElk`, and `error` remain registered.

- **Cleaned up dependent code** – `defaultConfig.ts` no longer carries
  configuration for removed diagrams; unused shape renderers (`classBox`,
  `erBox`, `requirementBox`) were removed; `DiagramOrientation` was relocated to
  `diagrams/common/types.ts`; and test suites were updated accordingly.

## Build Artifacts

| File                         | Description                                |
| ---------------------------- | ------------------------------------------ |
| `release/mermaid.min.js`     | Minified IIFE build for direct browser use |
| `release/mermaid.min.js.map` | Source map for debugging                   |
