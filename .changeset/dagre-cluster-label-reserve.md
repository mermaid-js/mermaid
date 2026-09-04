---
'mermaid': patch
---

Reserve each cluster's measured label height above its children in the dagre layout

Clusters now reserve vertical space for their own (possibly multi-line) header label based on its measured height, and every node clears the cumulative height of all its ancestor cluster headers, so nested cluster headers no longer overlap their children at any depth. Active only when `flowchart.subGraphTitleMargin` gives a non-zero total (its `top` and `bottom` combined); with the default margin the layout is byte-identical and costs no extra graph traversal.
