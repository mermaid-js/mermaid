---
'@mermaid-js/parser': patch
'mermaid': patch
---

fix(wardley): allow hyphens in unquoted component names

Multi-word names containing hyphens — e.g. `real-time processing`, `end-user`, `on-call engineer` — now parse without quoting, bringing the grammar in line with the OnlineWardleyMaps (OWM) convention. `A->B` (no-space arrow) still tokenises correctly.
