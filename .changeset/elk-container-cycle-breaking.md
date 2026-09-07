---
'mermaid': patch
---

fix(elk): a composite state or subgraph containing a loop now opens on its own start node.

Cycle breaking was resolved for the root graph but never passed to containers, so a
container laid out on its own fell back to ELK's default, `GREEDY`, while the root ran
whatever `elk.preset` asked for. The two then reversed different edges of the same cycle.

In a composite state that loops, greedy reverses the edge that turns an ordinary state
into a source, and sources sit on the first layer — so the diagram opened on that state
alongside its start circle instead of on the start circle alone. Dagre reverses the other
edge, which is why the two layout engines disagreed on the same diagram.

Containers now resolve cycle breaking from the preset exactly as the root does. Only
containers that actually contain a cycle change; an acyclic subgraph gives a cycle-breaking
strategy nothing to do. `preset: legacy` still reaches containers with `GREEDY`, so it keeps
reproducing the earlier rendering inside frames as well as outside them.
