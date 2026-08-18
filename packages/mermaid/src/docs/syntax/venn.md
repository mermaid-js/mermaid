# Venn diagrams (v11.12.3+)

Venn diagrams show relationships between sets using overlapping circles.

> **Warning**
> This is a new diagram type in Mermaid. Its syntax may evolve in future versions.

## Syntax

- Start with `venn-beta`.
- Use `set` for a single set name.
- Use `intersection` for an overlap of two or more set names (the older `union` keyword is also supported for backward compatibility).
- Identifiers in `intersection` / `union` must be defined by earlier `set` lines.
- Set identifiers can be bare words (`A`, `Set_1`) or quoted strings (`"Foo Bar"`).

```mermaid-example
venn-beta
  title "Team overlap"
  set Frontend
  set Backend
  intersection Frontend,Backend["APIs"]
```

### Labels

Use bracket syntax `["..."]` to set a display label while keeping the identifier short:

```mermaid-example
venn-beta
  set A["Alpha"]
  set B["Beta"]
  intersection A,B["AB"]
```

### Higher-arity intersections / unions

`intersection` (or `union`) accepts three or more set names. The diagram renders the implied
pairwise overlaps automatically, so the label on the higher-arity intersection has a
visible region to sit in:

```mermaid-example
venn-beta
  set Desirable
  set Feasible
  set Viable
  intersection Desirable,Feasible,Viable["Innovation"]
```

### Sizes

Use `:N` suffix to set the size of a set or intersection:

```mermaid-example
venn-beta
  set A["Alpha"]:20
  set B["Beta"]:12
  intersection A,B["AB"]:3
```

### Text nodes

- Use `text` to place labels inside a set or intersection.
- Indented `text` lines attach to the most recent `set` or `intersection` / `union`.
- Use bracket syntax `["..."]` to set a display label for text nodes.

```mermaid-example
venn-beta
  set A["Frontend"]
    text A1["React"]
    text A2["Design Systems"]
  set B["Backend"]
    text B1["API"]
  intersection A,B["Shared"]
    text AB1["OpenAPI"]
```

### Styling

Use `style` statements to apply visual styles to sets, intersections, and text nodes:

- `fill`: change the fill color
- `color`: change the text color
- `stroke`: change the stroke color
- `stroke-width`: change the stroke width
- `fill-opacity`: change the fill opacity

```mermaid-example
venn-beta
  set A["Alpha"]:20
    text A1["React"]
    text A2["Design Systems"]
  set B["Beta"]:12
  intersection A,B["AB"]:3
  style A fill:#ff6b6b
  style A,B color:#333
  style A1 color:red
```
