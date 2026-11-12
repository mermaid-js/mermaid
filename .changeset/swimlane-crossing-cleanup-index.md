---
'mermaid': patch
---

fix(swimlane): a `swimlane-beta` diagram with many crossing edges now lays out in a fraction of the time, with the same layout. The crossing cleanup counts a candidate route's crossings from an index instead of walking every pair of edges.
