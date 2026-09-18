---
'@mermaid-js/parser': patch
'mermaid': patch
---

fix(c4-beta): allow element kind keywords (`person`, `system`, `container`, `component`, `group`, `node`) to be used as element ids and relationship endpoints, so e.g. `system system "System"` parses.
