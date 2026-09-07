---
'mermaid': patch
---

fix(themes): `redux-dark`, `redux-dark-color` and `neo-dark` shipped `secondBkg` as the literal string `calculated`, so railroad rendered the invalid `fill: calculated`; it is now computed as `theme-dark` does. The same three themes had gantt done-task labels at 1.07:1 contrast — a light fill under their light task ink — now 5.7:1 or better. The ER and requirement stylesheets also validate `look` before interpolating it into a CSS selector.
