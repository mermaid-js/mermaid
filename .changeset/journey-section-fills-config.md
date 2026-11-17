---
'mermaid': patch
---

fix: journey diagrams use the `journey.sectionFills` and `journey.sectionColours` passed to `initialize()`, which were appended to the defaults and never shown, and the fills and label colours the user set are no longer hidden by the theme
