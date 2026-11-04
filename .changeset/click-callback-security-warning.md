---
'mermaid': patch
---

Warn when a `click` callback is ignored because `securityLevel` is not `"loose"`. Previously the callback was silently dropped, leaving users with no indication why their click handlers never fired (#6809).
