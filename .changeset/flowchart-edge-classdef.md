---
'mermaid': minor
---

feat(flowchart): add classDef styling support for edges via @::: inline syntax

Introduces a new `@:::className` inline syntax for applying `classDef` styles directly to flowchart edges, mirroring the existing `:::className` syntax for nodes.

Supported forms:

- `edgeId@:::className` — edge with an explicit ID and a class
- `@:::className` — class only, no explicit ID

Works on all edge types: bare arrows (`-->`), pipe-labeled (`-->|text|`), and inline-text (`-- text -->`). The existing `class <edgeId> <className>` statement syntax is unchanged.
