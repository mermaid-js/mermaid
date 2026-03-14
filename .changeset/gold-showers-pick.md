---
'mermaid': minor
---

Fix duplicate SVG element IDs when rendering multiple diagrams on the same page. Internal element IDs (nodes, edges, markers, clusters) are now prefixed with the diagram's SVG element ID across all diagram types. Custom CSS or JS using exact ID selectors like `#arrowhead` should use attribute-ending selectors like `[id$="-arrowhead"]` instead.
