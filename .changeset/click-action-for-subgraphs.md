---
'mermaid': patch
---

fix: support `click` directive on flowchart subgraphs

`click subgraphId "https://example.com"` now works on flowchart subgraphs, not just individual nodes. The rendered cluster label becomes a clickable link, respecting `linkTarget` and `securityLevel: 'sandbox'`. Resolves #5428.
