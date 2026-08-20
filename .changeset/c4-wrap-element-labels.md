---
'mermaid': patch
---

fix(c4): wrap element labels to `c4.width` again

C4 element labels (`System`, `Container`, `Component`, `Person` and their `_Ext` variants) stopped wrapping in 11.17.0, so long descriptions rendered on one unbroken line and the shape grew sideways well past the configured `c4.width`. The unified-shapes label helper gated wrapping on the root-level `wrap` option, which has no schema default and is therefore `undefined`; it now gates on `c4.wrap` (default `true`), which is what the legacy renderer used.
