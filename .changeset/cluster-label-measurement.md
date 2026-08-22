---
'mermaid': minor
---

feat: `defaultMeasureLayout` accepts a `unwrapGroupLabels` option so a layout engine can ask for cluster labels to be measured at their natural width instead of the `flowchart.wrappingWidth` fallback.

`insertCluster` paints a plain cluster label with an infinite width while the measurement pass wrapped it at 200px, so a layout that sizes compound nodes from the measured label sized them too narrow. Layouts now opt in explicitly; core no longer inspects the layout's name. Markdown cluster labels stay wrapped, since those are painted wrapped.

`@mermaid-js/layout-elk` opts in, which changes the size of labelled subgraphs in ELK-laid-out diagrams. Diagrams laid out with dagre are unaffected.
