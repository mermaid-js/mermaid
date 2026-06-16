# Pie parser-update fixtures

Pie diagram sources for manually verifying that the **Chevrotain** pie parser renders identically to
the legacy (langium) parser during the parser migration. Each `.mmd` exercises a slice of the pie
syntax surface (title, showData, accTitle/accDescr single + multiline, decimals/zero, comments,
single-quoted labels, frontmatter).

These files are **not** picked up by the DDLT layout sweep (which only scans `../layout-tests`).

## Rendering under each engine

Pie uses the legacy parser by default. To render with the Chevrotain parser, select it via config —
honored only through `initialize()` / `setConfig()` (not via `%%{init}%%` or frontmatter):

```js
mermaid.initialize({ parser: { pie: 'chevrotain' } });
```

Render the same fixture under both engines and confirm the output is visually identical.
