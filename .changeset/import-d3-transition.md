---
'mermaid': patch
---

fix: Import `d3-transition` where tooltips use `selection.transition()`, so hovering a flowchart, class or state node with a tooltip no longer throws `transition is not a function` when bundled with d3 >= 7.9.1
