---
'mermaid': patch
---

fix: respect `markdownAutoWrap: false` to prevent text auto-wrapping in flowchart markdown labels with `htmlLabels` enabled.

Markdown labels with `markdownAutoWrap: false, htmlLabels: false` set doesn't work
correctly.
