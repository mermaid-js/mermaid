---
'mermaid': major
---

refactor!: remove layout internal exports

Remove the
`clearLayoutRenderState`, `createCommonLayoutRenderer`, `defaultMeasureLayout`, `paintLayoutData` functions,
and the `CommonLayout*` types from Mermaid's public API.

These functions were only used by the `@mermaid-js/layout-elk` package,
which now bundles them. Removing them makes it easier to avoid major versions
of mermaid.
