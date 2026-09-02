---
'mermaid': minor
---

**`theme`, `look` and `layout` can now be set per diagram type**, in each diagram's config section — `mermaid.initialize({ look: 'classic', flowchart: { look: 'handDrawn' } })`, or the same under `config` in front matter. The schema uses the same mechanism to give a diagram type its own default. Resolution, highest first: front matter or directive, `initialize()`, the diagram type's default, the global default; a diagram-scoped value beats a global one set in the same layer.

Swimlanes take `layout: swimlane` from that schema default instead of having it forced by their `init` hook, so `swimlane: { layout: ... }` and a `layout` in front matter are now honoured. An unregistered layout also always falls back to `dagre` with a warning rather than throwing — state diagrams skipped that fallback, and mindmaps threw when `cose-bilkent` was absent, as it is in `@mermaid-js/tiny`.
