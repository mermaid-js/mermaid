---
'mermaid': minor
---

feat(layout): add the `grid-decomposed` layout algorithm. It applies HOLA's topological decomposition (undirected leaf peeling: trees are removed from the core) and then draws every resulting part — the core, and each peeled tree — as its own `grid-like` drawing, packed beside the others as an unconnected diagram. Each peeled tree is re-rooted on a duplicate of the core node it hung from, drawn with a dashed outline, so the edge peeling cut is still drawn and no edge runs between two parts. A core always contains a cycle, so it is laid out without the flow ordering, which would otherwise collapse the cycle into a single column. It exists to inspect and test that decomposition; select it with `layout: 'grid-decomposed'`.
