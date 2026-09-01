---
'mermaid': major
---

**`redux-color` is now the default theme and `neo` the default look for nine diagram types** — flowchart, swimlane, class, ER, requirement, sequence, state, use case and Venn. Those rendered without an explicit `theme` and `look` change appearance; every other diagram type keeps `default` and `classic`. To keep the previous appearance, set both explicitly — `mermaid.initialize({ theme: 'default', look: 'classic' })`, or the same two keys under `config` in front matter.

An unrecognised `theme` name now resolves to the default theme in name as well as in variables; previously the invalid name stayed in place while the default's variables were loaded, and every palette-aware stylesheet gates on the name. `theme: 'null'`, the documented way to disable the pre-defined themes, is unaffected. Note that `neo` paints node strokes with a gradient when the theme sets `useGradient`, which `base` does; setting a custom `nodeBorder` on `base` turns the gradient off.
