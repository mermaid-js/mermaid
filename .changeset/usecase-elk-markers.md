---
'mermaid': patch
---

fix: keep association markers apart on use-case ovals under ELK. Ovals get the same vertical padding as horizontal, edge attachment points on them are spread across the side, and the ELK renderer now accounts for every end-marker offset (extension, circle, cross, …) so a short entry stub can no longer flip a marker around.
