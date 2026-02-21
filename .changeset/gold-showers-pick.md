---
'mermaid': patch
---

Fix duplicate SVG element IDs when rendering multiple diagrams on the same page. Marker IDs (e.g. `arrowhead`, `crosshead`) are now prefixed with the diagram's SVG element ID. Custom CSS or JS using exact ID selectors like `#arrowhead` should use attribute-ending selectors like `[id$="-arrowhead"]` instead.
