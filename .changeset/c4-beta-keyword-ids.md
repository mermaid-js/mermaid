---
'@mermaid-js/parser': patch
'mermaid': patch
---

fix(c4-beta): allow element kind keywords (`person`, `softwareSystem`, `container`, `component`, `group`, `deploymentNode`, `infrastructureNode`) to be used as element ids and relationship endpoints, so e.g. `softwareSystem softwareSystem "System"` parses.
