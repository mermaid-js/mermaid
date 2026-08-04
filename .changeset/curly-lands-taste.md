---
'mermaid': patch
---

fix: increase protections against prototype pollution

User-controlled input already has protections against prototype pollution.

Fixes: GHSA-c4c3-pg64-4m4v

commit: c55def8e582cb499191b5630d3221722ed3e7fc4
author: @aloisklink
