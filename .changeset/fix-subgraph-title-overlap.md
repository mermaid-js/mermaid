---
'mermaid': patch
---

fix: Prevent edge labels from overlapping with subgraph titles (#7264)

Adjusted cluster boundary calculations to exclude the title area when cutting edge paths at subgraph intersections, preventing edges and labels from overlapping with subgraph titles.
