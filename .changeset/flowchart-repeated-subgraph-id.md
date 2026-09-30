---
'mermaid': patch
---

fix: a flowchart that declares the same subgraph id more than once now renders as one merged subgraph with the ELK layout instead of producing NaN geometry. Classes and `view: collapsed` set on a repeated subgraph now apply to it, whichever declaration they follow.
