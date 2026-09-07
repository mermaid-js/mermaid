---
'mermaid': minor
---

feat: `defaultRenderer: dagre` is the new name and default of the unified renderer

The `defaultRenderer` option of the `flowchart`, `class` and `state` config sections now accepts `dagre`, and `dagre` is its default value. The names used in earlier versions, `dagre-wrapper` and `dagre-d3`, keep working as aliases of `dagre`: all three select the same unified renderer, so existing configuration needs no change.

```yaml
---
config:
  flowchart:
    defaultRenderer: dagre
---
```

`defaultRenderer` selects the rendering engine, not the layout algorithm. A diagram with `defaultRenderer: dagre` is still laid out by ELK, the v12 default, unless `layout: dagre` is also set.

Because `dagre-d3` is now an alias of `dagre`, `state: { defaultRenderer: 'dagre-d3' }` no longer selects the legacy state renderer; `stateDiagram` code always renders with the unified renderer whenever a renderer is configured.
