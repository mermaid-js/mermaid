---
'mermaid': minor
---

**`theme`, `look` and `layout` can now be set per diagram type.** Each diagram's config section accepts the three keys, so `mermaid.initialize({ look: 'classic', flowchart: { look: 'handDrawn' } })` draws flowcharts hand-drawn and everything else classic, and the same works under `config` in a diagram's front matter.

The schema uses the same mechanism to give a diagram type its own default, which is how `redux-color` and `neo` become the defaults for nine diagram types without changing the rest. Resolution order, highest first: the diagram's front matter or directive, then `initialize()`, then the diagram type's default, then the global default. Within each of the first two, a diagram-scoped value beats a global one set alongside it.

Swimlanes now take their `layout: swimlane` from that schema default instead of having it forced by the diagram's `init` hook, so `mermaid.initialize({ swimlane: { layout: 'dagre' } })` and a `layout` in a swimlane's front matter are finally honoured — previously both were overridden.

A layout that is not registered in the running build now always falls back to `dagre` with a warning, rather than throwing. State diagrams used to skip that fallback entirely, and mindmaps threw outright when neither the requested layout nor `cose-bilkent` was registered — which is every build without the large features, `@mermaid-js/tiny` included. A diagram type can therefore name `elk` as its default without every build having to ship it.
