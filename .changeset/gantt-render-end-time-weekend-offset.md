---
'mermaid': patch
---

fix(gantt): don't render task bars ending on an excluded (e.g. weekend) day

`renderEndTime` could get stuck on an excluded day when a run of excluded
days extended through the end of a task's naive duration window, causing
gantt task bars to visually end mid-weekend instead of on the next valid
day. `renderEndTime` now always matches the fully adjusted `endTime`.
