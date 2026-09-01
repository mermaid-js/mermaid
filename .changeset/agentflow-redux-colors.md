---
'mermaid': minor
---

feat(agentflow): take the redux colour palette. Under `redux-color` and `redux-dark-color`, every agentflow node kind — tool, task, decision, input, refdoc, connector, action — gets its own colour from a fixed palette slot, so colour says what an element _is_ and stays put when the diagram is edited around it. Containers cycle a counter in declaration order, the way flowchart subgraphs do, from the slots above the kind range so a container frame never matches a node inside it. A collapsed container keeps its slot. `redux-dark-color` carries borders but no fills, so nodes there take palette strokes over the theme's own background.
