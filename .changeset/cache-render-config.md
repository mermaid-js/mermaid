---
'mermaid': patch
---

fix: render about twice as fast by no longer deep-cloning the config on every internal `getConfig()` call
