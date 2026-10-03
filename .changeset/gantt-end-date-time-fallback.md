---
'mermaid': patch
---

fix(gantt): render bars for end dates that do not strictly match the dateFormat

End dates such as `2026-01-05` when the `dateFormat` includes a time (e.g.
`YYYY-MM-DD HH:mm`), or dates with a time when the `dateFormat` cannot parse them
strictly, previously produced a zero-length bar because `getEndDate` fell through
to the duration parser. `getEndDate` now falls back to non-strict date parsing,
mirroring the existing `getStartDate` behavior, so start/end date pairs always
render a duration bar.
