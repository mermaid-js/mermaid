---
'mermaid': patch
---

Fixes Y-axis in XY bar charts not starting at zero. Ensures 0 aligns with X-axis baseline.

- Forced Y-axis to always include 0 in range.
- Adjusted layout/render logic to match visual expectation.
