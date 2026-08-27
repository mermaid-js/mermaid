---
'@mermaid-js/layout-elk': minor
---

feat: `elk.preset` picks a named combination of the options that decide where nodes end up.

Three options settle node positions, and they sit in different phases of the layout: which layer a node lands in, where it goes within that layer, and which edges get reversed to make the graph acyclic. Choosing them well means knowing all three interact; `preset` names the combinations worth using.

- `default` — network simplex layering, linear segments placement, greedy model order cycle breaking. Keeps chains of nodes aligned.
- `legacy` — reproduces what earlier versions actually rendered: Brandes-Koepf placement with ELK's own greedy cycle breaking.
- `depthFirst` — as `default`, but breaks cycles depth first, which gives shorter back edges on graphs that have many.

```yaml
---
config:
  layout: elk
  elk:
    preset: legacy
---
```

Setting `layeringStrategy`, `nodePlacementStrategy` or `cycleBreakingStrategy` explicitly overrides the preset for that one option and leaves the rest in place, so a preset is a starting point rather than a lock.

**The default placement strategy changes from `NETWORK_SIMPLEX` to `LINEAR_SEGMENTS`, so existing ELK diagrams will lay out differently.** `preset: legacy` restores the previous behaviour.

Note that `legacy` uses `GREEDY` cycle breaking rather than the `GREEDY_MODEL_ORDER` the schema previously advertised. That default was declared in the schema but never listed in the shipped defaults, so it reached ELK as undefined and ELK's own default applied — `legacy` reproduces what was rendered, not what was documented.
