---
'mermaid': patch
---

fix(themes): venn diagrams follow the `redux-color` and `redux-dark-color` palettes. Neither theme defined any `venn*` variable, so every circle fell back to a single `primaryColor` and the diagram rendered in one flat tone. The sets now take the same categorical palette as flowchart subgraphs, and an explicit `style` on a set still wins.
