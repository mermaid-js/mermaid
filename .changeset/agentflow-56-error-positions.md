---
'mermaid': patch
---

fix(agentflow): report parser and `@{ }` YAML error positions in source coordinates (#56)

Parser positions no longer drift from the source the user sees:

- **Blank-line fold.** `agentflowParser` stripped trailing whitespace after a closing `}` with `/}\s*\n/g`, but `\s` swallowed a blank line immediately following an `@{ ... }` block. Every position after the fold (element mappings, `getData()` edge positions, thrown parse-error line numbers) drifted one line per folded blank. The normalisation now matches horizontal whitespace only (`/}[^\S\n]*\n/g`), preserving the blank line and the newline jison counts.
- **YAML block-relative coordinates.** A `js-yaml` failure inside an `<id>@{ ... }` block reported its `(R:C)` reference, `mark`, and excerpt prefixes relative to the block buffer rather than the source. `addVertex` now translates the failure into absolute source coordinates — rewriting the message, `mark`, and a JISON-style `hash.loc` — for both single-line `@{ ... }` and multi-line block bodies.
