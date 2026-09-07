---
'mermaid': patch
---

fix(flowchart): stop stadium labels from wrapping into a circle and exempt selected shapes from automatic label wrapping.

Long stadium labels wrapped to `flowchart.wrappingWidth`, grew taller without growing wider, and turned the stadium into a circle. Stadium now keeps its semicircular caps with an outer width of at least 1.5 times its height and enough clearance that the label stays inside the arcs.

Stadium (`terminal`, `pill`), circle (`circ`), diamond (`diam`, `decision`, `question`), double circle (`dbl-circ`, `double-circle`), Display (`curv-trap`, `curved-trapezoid`, `display`) and Delay (`delay`, `half-rounded-rectangle`) no longer wrap their labels at `flowchart.wrappingWidth`. Explicit line breaks are kept, and an explicit node width still takes precedence.

Agentflow `decision` (`diamond`) nodes are exempt in the same way and do not wrap at `agentflow.wrappingWidth`.
