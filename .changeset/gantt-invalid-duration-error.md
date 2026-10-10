---
'mermaid': patch
---

fix(gantt): throw a syntax error for task end tokens that are neither a valid date nor a valid duration (e.g. `24de`, `24d+`, `24d7`) instead of silently dropping the task (#6586).
