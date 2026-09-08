---
'@mermaid-js/layout-elk': minor
---

feat: `elk.preset` picks a named combination of the options that decide where nodes end up.

Three options settle node positions, and they sit in different phases of the layout: which layer a node lands in, where it goes within that layer, and which edges get reversed to make the graph acyclic. Choosing them well means knowing all three interact; `preset` names the combinations worth using.

- `default` — network simplex layering, balanced Brandes-Koepf placement at the top level and inside subgraphs, and depth-first cycle breaking. Balanced placement centres branches and composite-state entries; depth-first breaking gives shorter back edges on graphs that loop.
- `legacy` — reproduces what earlier versions actually rendered: Brandes-Koepf placement with ELK's own greedy cycle breaking.
- `modelOrder` — as `depthFirst`, but breaks cycles by greedy model order, which disturbs declaration order least at the cost of longer back edges.
- `depthFirst` — the previous default: network simplex layering and top-level placement, Brandes-Koepf placement inside subgraphs, `NONE` alignment, and depth-first cycle breaking.

```yaml
---
config:
  layout: elk
  elk:
    preset: legacy
---
```

Setting `layeringStrategy`, `nodePlacementStrategy`, `nodePlacementAlignment` or `cycleBreakingStrategy` explicitly overrides the preset for that one option and leaves the rest in place, so a preset is a starting point rather than a lock.

**Node placement keeps `BRANDES_KOEPF`, but its alignment changes from `NONE` to `BALANCED` and cycle breaking from `GREEDY` to `DEPTH_FIRST`, so existing ELK diagrams will lay out differently.** `preset: legacy` restores the previous behaviour, and is the single switch for it — this is the net change against the last release, measured from what shipped rather than from any intermediate state.

Subgraph contents use `BRANDES_KOEPF` under every preset. For `modelOrder` and `depthFirst` that is deliberately not the root's strategy: network simplex inside a frame produced routes that left the subgraph on its bounding-box corner. The two sides are tuned independently, so `nodePlacementStrategy` set explicitly still applies to both.

Note that `legacy` uses `GREEDY` cycle breaking rather than the `GREEDY_MODEL_ORDER` the schema previously advertised. That default was declared in the schema but never listed in the shipped defaults, so it reached ELK as undefined and ELK's own default applied — `legacy` reproduces what was rendered, not what was documented.
