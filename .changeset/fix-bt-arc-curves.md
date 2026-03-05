---
'mermaid': patch
---

fix: correct BT orientation arc sweep flags in gitGraph drawArrow()

Swapped SVG arc sweep-flag values in the BT (bottom-to-top) orientation branches of `drawArrow()` so curves bend in the correct direction. Affects both rerouting and non-rerouting code paths for merge and non-merge arrows.

Resolves #6593
