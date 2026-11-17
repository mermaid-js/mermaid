---
mermaid: patch
---

fix: a `style` statement naming a block id that was never declared now logs a warning instead of throwing `TypeError: Cannot set properties of undefined`. A `class` statement on the same unknown id was already tolerated.
