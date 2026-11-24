---
'mermaid': patch
---

fix: stop `excludes` from extending gantt tasks whose end was given as an explicit date in the chart `dateFormat` (e.g. `Task: 01/07/25,25/07/25` with `dateFormat DD/MM/YY`)
