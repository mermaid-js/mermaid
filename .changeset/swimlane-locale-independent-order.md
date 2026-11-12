---
'mermaid': patch
---

fix(swimlane): the layout no longer depends on the browser's language, because ids that tie on rank are now ordered by code unit and not with `localeCompare`. Diagrams whose ids differ only by case, or that use non-ASCII ids, can be laid out differently from before for English readers
