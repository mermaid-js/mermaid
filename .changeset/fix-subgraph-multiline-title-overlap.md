---
'mermaid': patch
---

fix: reserve room for multiline flowchart subgraph titles instead of painting them over the first row of nodes

Dagre sizes a subgraph purely from its children's bounding box and never budgets space for the subgraph's own title, so a title that wraps onto more than one line (via `<br>`, a long string, or a markdown title) was rendered directly on top of the first row of nodes and their edge labels. The layout now measures each subgraph's title before layout, grows the subgraph's box downward to fit it while keeping the title's top edge fixed, and shifts everything else the growth would otherwise run into — including nodes and edges outside the subgraph — down by the same amount. Resolves #3806.
