---
'mermaid': patch
---

fix: class diagram relation markers (composition, aggregation, extension, dependency, lollipop) no longer scale with the edge stroke width, so they stay outside the class box boundary in themes that set `strokeWidth: 2` (`redux`, `redux-dark`, `redux-color`, `redux-dark-color`, `neo`, `neo-dark`) with the default `classic` look.
