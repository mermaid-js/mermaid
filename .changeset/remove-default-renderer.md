---
'mermaid': major
---

**Removed: the `defaultRenderer` option of the `flowchart`, `class` and `state` config sections.**

Use the top-level `layout` option instead:

```yaml
---
config:
  layout: dagre # or elk
---
```

### Why

`defaultRenderer` named a rendering engine back when there was more than one. There is not.
All of its accepted values — `dagre`, `dagre-wrapper`, `dagre-d3` — had come to select the
same unified renderer, and its `elk` value did nothing but set `layout: elk` on your behalf.
The option's documented purpose no longer existed.

What it still did was stranger than doing nothing. The detectors branched on whether the
value was _recognised_, so a **valid** value routed a diagram to the modern renderer and an
**invalid** one silently routed it to the legacy renderer. Since the default was always a
valid value, the legacy `class` and `state` renderers were unreachable except by
misconfiguring the option.

### What changes for you

- `layout` selects the layout algorithm, as it already did. Nothing else does.
- `graph`, `classDiagram` and `stateDiagram` always render with the unified diagram. This
  was already true for every valid configuration.
- The legacy `flowchart`, `class` and `state` diagram ids are gone. `flowchart-v2`,
  `classDiagram` and `stateDiagram` are what `detectType` now returns for that syntax.
- `flowchart-elk` as an explicit diagram keyword still works.

Configuration that still sets `defaultRenderer` is ignored rather than rejected, so nothing
throws — but it no longer has any effect, and diagrams that relied on
`flowchart: { defaultRenderer: 'elk' }` to get an ELK layout should set `layout: elk`.
