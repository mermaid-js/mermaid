---
'mermaid': patch
---

fix(flowchart): warn when a click callback is ignored

`click ... call foo()` was dropped silently unless `securityLevel` was `loose`, so a diagram
that looked correct simply did nothing when clicked and gave no hint why. Binding now logs a
warning naming the node and the current security level.
