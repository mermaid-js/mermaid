---
'mermaid': patch
---

fix(flowchart): render sibling subgraphs in declaration order

In flowcharts where sibling subgraphs have no edges between them, the rendered order now matches how they were declared in the source. Previously they were rendered in reverse.

Fixes #7741
