---
'mermaid': patch
---

fix(gantt): forget task ids from previously rendered diagrams, so an unknown id in `after`, `until` or `click` no longer resolves to an unrelated task
