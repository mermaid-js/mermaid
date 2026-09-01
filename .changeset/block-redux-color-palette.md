---
'mermaid': patch
---

fix(block): apply the redux colour palette to composite blocks. Composites now take a per-container colour under `redux-color` and `redux-dark-color`, matching how flowchart subgraphs are coloured — one counter over containers, in declaration order, with the plain shapes left on the flat theme colour. `redux-color` is the default theme, so this is what a block diagram drawn with no theme set now looks like. `classDef`/`style` still win.
