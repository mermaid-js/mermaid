---
'mermaid': patch
---

perf(flowchart): avoid O(n²) parse cost on deeply-indented diagrams

Two whitespace-related regex pathologies made deeply-indented flowcharts parse in
quadratic time:

- `anyCommentRegex` (used by diagram type detection and preprocessing) re-scanned
  each indent run from every position because of its leading greedy `\s*`. Guarding
  where the run may start makes it linear, with byte-identical output.
- The jison flowchart lexer matched a single whitespace char per `SPACE` token,
  emitting one token per space; it now matches a whitespace run. The grammar only
  uses `SPACE` as a separator, so parsing is unchanged.

A deeply-indented fixture that took ~1.4 s to parse now takes ~30 ms.
