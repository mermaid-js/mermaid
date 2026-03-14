---
'mermaid': patch
---

fix: round up label width in all diagrams to prevent subpixel rendering issues

On Safari, subpixel gets rounded differently than in Chromium-based browsers,
leading to issues like [#6640](https://github.com/mermaid-js/mermaid/issues/6640).
This change, rounds up the size of the labels and its containers to prevent the
issue.
