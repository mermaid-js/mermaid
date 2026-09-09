---
'@mermaid-js/layout-elk': minor
---

feat: draw line hops where ELK edges cross, controlled by `elk.lineHops`.

Where two edges cross, the one that gives way is drawn with a small arc (or a visible gap) so it is clear which line passes over which. On by default; set `elk.lineHops: false` to draw plain crossings, or `'gap'` to use gaps instead of arcs.

```yaml
---
config:
  layout: elk
  elk:
    lineHops: gap
---
```

The crossing detection and both styles already existed and were used by swimlanes — this registers the `afterPaint` hook that lets ELK use them. An edge that takes a hop loses its corner rounding on that segment, which is the trade for a readable crossing; curved edges are skipped rather than rewritten, to avoid corrupting their geometry.

**Existing ELK diagrams with crossing edges will render differently.**
