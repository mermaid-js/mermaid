---
'mermaid': major
---

**`redux-color` is now the default theme and `neo` the default look, for nine diagram types.** Flowcharts, swimlanes, class, ER, requirement, sequence, state, use case and Venn diagrams rendered without an explicit `theme` and `look` change appearance. Every other diagram type keeps the `default` theme and the `classic` look it has today. To keep the previous appearance for the nine, set both explicitly — `mermaid.initialize({ theme: 'default', look: 'classic' })`, or the same two keys under `config` in a diagram's front matter. All other built-in themes and looks are unchanged and still available.

An unrecognised `theme` name now resolves to the default theme in name as well as in variables. Previously the fallback loaded the default theme's variables but left the invalid name in place, and every palette-aware stylesheet gates its rules on that name — so the palette was loaded and never rendered. `theme: 'null'`, the documented way to disable the pre-defined themes, is unaffected.

Note that `neo` paints node strokes with a gradient when the active theme sets `useGradient`, which `base` does; setting a custom `nodeBorder` on `base` now turns the gradient off so your colour is what shows.
