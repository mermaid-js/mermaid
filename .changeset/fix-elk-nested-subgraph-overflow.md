---
'@mermaid-js/layout-elk': patch
---

Fix nested subgraphs overflowing their parent when a subgraph title is wider than its content

ELK only reserves vertical space for `INSIDE` node labels on compound nodes and ignores their width, so a subgraph could be laid out narrower than its own title. The painter then widened just that rectangle after layout, pushing it outside its parent subgraph and over its siblings.

The ELK renderer now measures subgraph titles the same way the painter draws them (unwrapped) and re-runs the layout with extra horizontal padding for every subgraph that is narrower than its painted title, so parents and siblings are placed around the final width.
