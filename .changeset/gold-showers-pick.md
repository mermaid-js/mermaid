---
'mermaid': patch
---

Fix duplicate SVG element IDs when rendering multiple diagrams on the same page. Internal element IDs (nodes, edges, markers, clusters) are now prefixed with the diagram's SVG element ID for the following diagram types: flowchart, class, C4, sequence, gantt, kanban, and timeline. Other diagram types (state, ER, journey, mindmap, gitGraph, XY chart, pie, radar, packet, architecture, treemap) are not yet covered and will be addressed in follow-up PRs. Custom CSS or JS using exact ID selectors like `#arrowhead` should use attribute-ending selectors like `[id$="-arrowhead"]` instead.
