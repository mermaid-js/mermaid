---
'mermaid': patch
---

fix: escape theme palette colours before they're interpolated into generated CSS, mirroring the existing `look` handling. A `themeVariables` palette array (`borderColorArray`/`bkgColorArray`) is currently stripped by config sanitization before it can reach a diagram's stylesheet, but the interpolation sites themselves had no defense of their own if that ever changed.
