---
'@mermaid-js/layout-elk': minor
---

feat: `elk.preset` picks a named combination of the options that decide where nodes end up.

Three options settle node positions, and they sit in different phases of the layout: which layer a node lands in, where it goes within that layer, and which edges get reversed to make the graph acyclic. Choosing them well means knowing all three interact; `preset` names the combinations worth using.

- `default` — network simplex layering and placement with depth-first cycle breaking at the top level; subgraph contents are placed with Brandes-Koepf. Depth-first breaking gives shorter back edges on graphs that loop.
- `legacy` — reproduces what earlier versions actually rendered: Brandes-Koepf placement with ELK's own greedy cycle breaking.
- `modelOrder` — as `default`, but breaks cycles by greedy model order, which disturbs declaration order least at the cost of longer back edges.
- `depthFirst` — a name for what `default` already is, so a diagram can say depth-first rather than rely on the default staying put.

```yaml
---
config:
  layout: elk
  elk:
    preset: legacy
---
```

Setting `layeringStrategy`, `nodePlacementStrategy` or `cycleBreakingStrategy` explicitly overrides the preset for that one option and leaves the rest in place, so a preset is a starting point rather than a lock.

**Node placement changes from `BRANDES_KOEPF` to `NETWORK_SIMPLEX`, so existing ELK diagrams will lay out differently.** `preset: legacy` restores the previous behaviour, and is the single switch for it — this is the net change against the last release, measured from what shipped rather than from any intermediate state.

Subgraph contents keep `BRANDES_KOEPF`, which is deliberately not the root's strategy: network simplex inside a frame produced routes that left the subgraph on its bounding-box corner. The two sides are tuned independently, so `nodePlacementStrategy` set explicitly still applies to both.

Note that `legacy` uses `GREEDY` cycle breaking rather than the `GREEDY_MODEL_ORDER` the schema previously advertised. That default was declared in the schema but never listed in the shipped defaults, so it reached ELK as undefined and ELK's own default applied — `legacy` reproduces what was rendered, not what was documented.
