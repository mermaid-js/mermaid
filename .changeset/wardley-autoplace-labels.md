---
'mermaid': minor
---

feat(wardley): opt-in automatic label placement (`autoPlaceLabels`)

New opt-in `autoPlaceLabels` config flag for the `wardley-beta` diagram. When
enabled, component, anchor, link and annotation labels are automatically
repositioned to avoid overlapping each other, node markers, pipeline boxes,
the chart boundary and link lines. Labels moved far from their node get a thin
leader line; a collision-free manual `label [x, y]` is kept exactly as
authored, and pipeline child labels prefer to sit underneath their node.

Off by default — existing maps render unchanged. Enable it via config:

```js
mermaid.initialize({ 'wardley-beta': { autoPlaceLabels: true } });
```
