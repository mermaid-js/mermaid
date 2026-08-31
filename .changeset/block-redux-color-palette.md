---
'mermaid': patch
---

fix(block): apply the redux colour palette to block diagrams. Blocks now take a per-block colour under `redux-color` and `redux-dark-color` — the same mechanism flowchart subgraphs use — instead of rendering flat. `redux-color` is the default theme, so this is what a block diagram drawn with no theme set now looks like. Colours follow declaration order, a composite takes its slot before the blocks it contains, `space` consumes none, and `classDef`/`style` still win.
