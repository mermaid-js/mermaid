---
'mermaid': major
---

feat!: **ELK is now bundled with mermaid and is the default layout algorithm.**

ELK previously shipped as a separate `@mermaid-js/layout-elk` package that sites had to install and register. It is now part of mermaid itself and registered automatically, so `layout: elk` — and the `elk.stress`, `elk.force`, `elk.mrtree`, `elk.sporeOverlap`, `elk.box` and `elk.rectpacking` variants — work with no setup.

**This changes how existing diagrams look.** Flowchart, state, class, entity-relationship, requirement, use-case and agentflow diagrams that do not specify a `layout` are now laid out by ELK instead of dagre. To keep the previous layout, set dagre explicitly:

```yaml
---
config:
  layout: dagre
---
```

or globally, `mermaid.initialize({ layout: 'dagre' })`.

Mindmap is unchanged: it keeps laying out with dagre unless a layout is explicitly requested.

Other notes:

- ELK is loaded as a separate chunk in the ESM builds, so it is only fetched when a diagram actually uses it. The single-file IIFE build (`mermaid.min.js`) inlines it and grows by roughly 500 kB gzipped.
- The **tiny** build deliberately omits ELK to stay small, and falls back to dagre for diagrams that ask for an ELK layout. Its size is unchanged.
- `@mermaid-js/layout-elk` is no longer needed on normal builds — existing `mermaid.registerLayoutLoaders(elkLayouts)` calls keep working and can be removed. It is still published, and remains the way to add ELK to the tiny build.
- State diagrams now resolve their layout through the same registration check as every other diagram, so an unavailable layout falls back instead of failing to render.
