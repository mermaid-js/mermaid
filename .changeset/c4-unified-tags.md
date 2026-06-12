---
'mermaid': minor
---

feat(c4): style elements and relationships via `AddElementTag` and `AddRelTag` in the C4 unified renderer. Tag styles (`$bgColor`, `$fontColor`, `$borderColor`, `$textColor`, `$lineColor`) are applied after per-type defaults and before `UpdateElementStyle`/`UpdateRelStyle` overrides, and every tag adds a sanitized `c4-tag-<name>` css class for theming.
