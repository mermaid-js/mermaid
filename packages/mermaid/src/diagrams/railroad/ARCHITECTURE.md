# Railroad Diagram — Implementation Notes

## Design rationale: why an expression language and not ABNF/EBNF

The surface syntax of this diagram type is a functional expression language
(`sequence(...)`, `stack(...)`, `bypass(...)`, etc.) rather than a grammar
notation like ABNF or EBNF.

Two reasons drove this decision:

**1. Railroad diagrams are typically generated, not hand-authored.**
Real-world use cases involve taking an existing grammar (ABNF, EBNF, PEG, etc.)
and visualising it. The tool generating the mermaid source already understands
the grammar formalism; it does not need mermaid to re-parse one. The expression
language gives generators a stable, unambiguous target to emit.

**2. The expression language operates at the abstraction level of the diagram,
not the abstraction level of grammars.**
ABNF describes language structure (what strings are valid). The expression
language describes visual layout (how tracks, boxes, branches, and loops are
composed). These are different concerns. Keeping them separate means the diagram
type is not tied to any particular grammar formalism and can visualise things
that are not grammars at all (state machines, protocol flows, decision trees).

## Three-phase design

The rendering pipeline is split into three distinct phases, each with a clear responsibility boundary:

```
Parser  →  Expr  →resolve(gridSize)→  LayoutBox  →render(ctx)→  SVG
```

### Phase 1 — Parse (`parse-expression.ts`)

Produces an `Expr` tree from the source text. `Expr` is pure structure: it captures the grammar of the diagram (what is nested inside what) but has no knowledge of pixels, grid size, or fonts.

All five factory functions in `Expression` return `Expr`:
`textBox`, `sequence`, `stack`, `bypass`, `loop`.

### Phase 2 — Resolve (`expression.ts` → `Expr.resolve`)

Called once per rule in `renderer.ts` with the configured `gridSize`. Walks the `Expr` tree and produces a `LayoutBox` tree where every dimension is a plain `number` in grid units.

`textBox` is the only node that actually needs `gridSize` — it calls
`calculateTextDimensions` (mermaid utility, real SVG measurement) and divides
the pixel result by `gridSize`. All composite nodes (`sequence`, `stack`, etc.)
resolve their children and do plain integer arithmetic.

### Phase 3 — Render (`expression.ts` → `LayoutBox.render`)

Called by the renderer with a `RenderContext` that owns a `TrackBuilder` and
the `gridSize`. This is the only place where grid units are multiplied by
`gridSize` to produce pixel coordinates for SVG attributes.

## Why this separation matters

- **`textBox` is the only leaf with variable width.** Its width depends on font
  metrics (pixels), which must be divided by the grid size to yield grid units.
  All other nodes derive their size from their children.
- **Composites stay clean.** `sequence`, `stack`, `bypass`, and `loop` never
  touch pixels — their `resolve()` methods do pure grid-unit arithmetic on the
  already-resolved children.
- **`RenderContext.gridSize` flows downward only.** It is never read back up
  into layout decisions; it is only used to multiply grid units into pixel
  coordinates when appending SVG elements.

## Configuration

`gridSize` is read from `db.getConfig().gridSize` in the renderer and defaults
to `24` (defined in `config.schema.yaml` under `RailroadDiagramConfig`). Users
can override it via `mermaid.initialize({ railroad: { gridSize: 32 } })`.

## Text measurement

`measureTextGridUnits(text, gridSize)` in `expression.ts` uses
`calculateTextDimensions` from `../../utils.js`. When the DOM is unavailable
(unit tests, SSR), it falls back to a character-width approximation. The
fallback is intentionally conservative so boxes are never too narrow.
