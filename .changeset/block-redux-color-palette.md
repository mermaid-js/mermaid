---
'mermaid': patch
---

fix(block): apply the redux colour palette to composite blocks. Composites now take a per-container colour under `redux-color` and `redux-dark-color`, matching how flowchart subgraphs are coloured — one counter over containers, in declaration order, with the plain shapes left on the flat theme colour. The palette is opt-in: block does not default to `redux-color` the way flowchart and several other diagram types do, so set `theme: redux-color` (or `redux-dark-color`) explicitly to see it. `classDef`/`style` still win.
