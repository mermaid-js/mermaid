---
'mermaid': patch
---

fix(swimlane): a `swimlane-beta` diagram with many crossing or parallel edges now lays out in a fraction of the time, with the same layout. The crossing cleanup and the passes after it score a candidate route from indexes of the routes instead of walking every edge or pair of edges.
