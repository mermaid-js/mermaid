---
'mermaid': patch
---

fix(timeline): ensure consistent vertical line lengths with visible arrowheads

Fixed timeline diagrams where vertical dashed lines from tasks had inconsistent lengths. All vertical lines now extend to the same depth regardless of the number of events in each column, with sufficient padding to clearly display both the dashed line pattern and complete arrowheads.
