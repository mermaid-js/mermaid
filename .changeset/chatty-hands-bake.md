---
'mermaid': patch
---

fix(flowchart,class): fix newline handling in tooltips

`<br>`, `<br/>`, and newlines in tooltips for flowchart and class diagrams now
all work as newlines, even after changes in Firefox 140 and Chrome 136.

author: @jrobichaud
author: @aloisklink
