---
'mermaid': minor
---

**`theme`, `look` and `layout` can now be set per diagram type.** Each diagram's config section accepts the three keys, so `mermaid.initialize({ look: 'classic', flowchart: { look: 'handDrawn' } })` draws flowcharts hand-drawn and everything else classic, and the same works under `config` in a diagram's front matter.

The schema uses the same mechanism to give a diagram type its own default, which is how `redux-color` and `neo` become the defaults for nine diagram types without changing the rest. Resolution order, highest first: the diagram's front matter or directive, then `initialize()`, then the diagram type's default, then the global default. Within each of the first two, a diagram-scoped value beats a global one set alongside it.
