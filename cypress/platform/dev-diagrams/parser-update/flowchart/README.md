# Flowchart parser-update fixtures

Flowchart diagram sources for manually verifying that the **Chevrotain** flowchart parser renders
identically to the legacy (jison) parser during the parser migration. Each `.mmd` exercises a slice of
the flowchart syntax surface:

| File                           | Covers                                                               |
| ------------------------------ | -------------------------------------------------------------------- |
| `flowchart-01-basic`           | header + direction, edges, diamond, pipe edge labels                 |
| `flowchart-02-shapes`          | every node shape (square … ellipse, trapezoid/lean variants)         |
| `flowchart-03-edges`           | every edge/arrow type (normal, dotted, thick, invisible, x/o ends)   |
| `flowchart-04-chaining`        | `&` multi-node chains on both sides of a link                        |
| `flowchart-05-subgraphs`       | subgraphs with/without titles, nested `direction`                    |
| `flowchart-06-styling`         | `classDef`, `class`, `:::`, `style`, `linkStyle` + `interpolate`     |
| `flowchart-07-text-strings`    | quoted labels, markdown strings, entities                            |
| `flowchart-08-interactions`    | `click` href / call / link with targets + tooltips                   |
| `flowchart-09-accessibility`   | `accTitle`, multiline `accDescr`                                     |
| `flowchart-10-shape-data`      | `@{ … }` node shape data (shape/label, multi-node, edges, multiline) |
| `flowchart-11-unicode-special` | unicode ids/labels, dotted/dashed ids                                |
| `flowchart-12-graph-comments`  | legacy `graph` keyword, `%%` comments, `;` separators                |

These files are **not** picked up by the DDLT layout sweep (which only scans `../layout-tests`).

## Rendering under each engine

During the migration the flowchart parser is selectable via the internal `parser` config — honored
only through `initialize()` / `setConfig()` (not via `%%{init}%%` or frontmatter, since `parser` is a
`secure` key):

```js
mermaid.initialize({ parser: { flowchart: 'chevrotain' } }); // the migrated engine
mermaid.initialize({ parser: { flowchart: 'legacy' } }); // the legacy (jison) engine
```

Render the same fixture under both engines and confirm the output is visually identical. Parser-level
parity over these fixtures is also checked automatically (both engines must fill `FlowDB` identically).
