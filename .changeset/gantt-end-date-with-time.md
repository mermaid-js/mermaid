---
'mermaid': patch
---

fix: Gantt end dates carrying a time (e.g. `2023-07-22 18:00` with dateFormat `YYYY-MM-DD`) no longer collapse to a zero duration; `getEndDate` now falls back to `new Date()` like `getStartDate` does

