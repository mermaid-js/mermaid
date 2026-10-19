---
'mermaid': patch
---

fix(kanban): pass `:::className` assignments through `getData()` so they are applied to rendered nodes

The kanban parser accepted and stored `cssClasses` via `decorateNode()`, but `getData()` rebuilt section and item nodes without carrying `cssClasses` across, making the `:::` syntax a no-op in the rendered SVG. Sections and items now keep their assigned classes. Adds regression tests for #8119.
