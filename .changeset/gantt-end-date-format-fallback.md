---
'mermaid': patch
---

fix(gantt): end dates whose precision differs from `dateFormat` no longer render a zero-width bar

`getEndDate` parsed the end date strictly against `dateFormat` and, on failure, only tried to read
the string as a duration. A date that is valid but written to a different precision than the format
(`2026-01-05` under `YYYY-MM-DD HH:mm`, or `2026-01-05 12:00` under `YYYY-MM-DD`) matched neither, so
the end time fell back to the start time and the task rendered as a bar of zero width. `getStartDate`
already has a lenient fallback for exactly this case, which is why the start of such a task resolved
correctly while its end did not. Durations and unparseable end dates keep their previous behaviour.
