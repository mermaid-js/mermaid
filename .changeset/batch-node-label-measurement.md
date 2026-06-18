---
'mermaid': patch
---

perf(rendering): batch node-label measurement and construction

Large diagrams spent most of their render time in forced reflows: `labelHelper`
built each node's label and then immediately read its size, so every label forced
a synchronous layout over the growing node tree.

`labelHelper` is now split into build (DOM writes) → measure (the single forced
read) → finalize (DOM writes), and `prebuildNodeLabels` runs all the builds first
and then all the reads back-to-back, so only the first read forces a layout. When
every label is HTML the build path also assembles one markup string and parses it
with a single `insertAdjacentHTML` instead of constructing each foreignObject via
the DOM API.

Output is unchanged: a `labelSignature` check rebuilds inline when a shape mutates
the node after prebuild, reused labels are raised to preserve paint order, image
labels are awaited before measuring, and a non-browser environment probe falls
back to per-element construction. Measured ~17% faster total / ~45% faster measure
phase on large flowcharts.
