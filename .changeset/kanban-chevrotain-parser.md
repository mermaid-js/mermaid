---
'mermaid': patch
---

chore: convert the kanban parser from JISON to Chevrotain

The grammar is unchanged — every kanban diagram parses to the same state as before. Syntax errors
now report the line and column of the offending token instead of a JISON stack trace.
