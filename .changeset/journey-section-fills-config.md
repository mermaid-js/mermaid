---
'mermaid': patch
---

fix: journey diagrams use the `journey.sectionFills` and `journey.sectionColours` passed to `initialize()`, which were appended to the defaults and never shown, and a fill the user set is no longer hidden by the theme's section colours
