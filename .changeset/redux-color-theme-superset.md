---
'mermaid': patch
---

fix(themes): `redux-color` and `redux-dark-color` now define every variable their base themes define, instead of silently falling back to untuned values for `primaryBorderColor`, `clusterBkg`, `clusterBorder`, `altBackground`, `compositeTitleBackground` and the state and requirement edge-label backgrounds. Pie, gantt and user-journey also read the theme palette rather than a single pale tint, so pie slices are distinguishable and gantt sections are visibly banded.
