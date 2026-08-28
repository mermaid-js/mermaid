---
'mermaid': major
---

**`redux-color` is now the default theme and `neo` the default look.** Every diagram rendered without an explicit `theme` and `look` changes appearance. To keep the previous look, set both explicitly — `mermaid.initialize({ theme: 'default', look: 'classic' })`, or the same two keys under `config` in a diagram's front matter. All other built-in themes and looks are unchanged and still available.

Note that `neo` paints node strokes with a gradient when the active theme sets `useGradient`, which `base` does; setting a custom `nodeBorder` on `base` now turns the gradient off so your colour is what shows.
