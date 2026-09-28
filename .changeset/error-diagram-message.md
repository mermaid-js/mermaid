---
'mermaid': patch
---

fix(error): show the actual error message in the error diagram

When a diagram fails to parse, the error diagram now draws the real error message below the
"Syntax error in text" headline, wrapped to at most four lines. Hosts that only show the SVG
(GitHub, GitLab, Obsidian, exported images) no longer hide what actually went wrong, e.g. that the
flowchart edge limit was exceeded and `maxEdges` needs raising via `mermaid.initialize`.
