# Grid line hops

The grid renderer draws a small arc where two routed edges cross. This makes a
crossing distinct from a connection without changing the route or node positions.

Set `grid.lineHops` in frontmatter, a directive, or `mermaid.initialize()`:

| Value   | Behavior                            |
| ------- | ----------------------------------- |
| `'arc'` | Draw an arc at crossings (default). |
| `'gap'` | Leave a visible gap at crossings.   |
| `false` | Draw plain crossings without hops.  |

```yaml
config:
  layout: grid
  grid:
    lineHops: gap
```

Hops preserve the edge's corner radius and arrowhead offsets. The renderer
reduces or omits a hop when there is too little space near a bend or endpoint.
Smoothing curves such as `basis` are left unchanged.

The grid renderer must be registered before selecting `layout: grid`. This
option does not register a layout; see the
[layout maker's guide](../community/layout-makers-guide.md#registering-the-layout).
