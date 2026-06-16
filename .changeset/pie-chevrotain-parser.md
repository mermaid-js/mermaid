---
'mermaid': patch
---

Migrate the pie chart parser to Chevrotain

The pie chart diagram is now parsed by a new Chevrotain-based parser instead of the langium parser. Behavior and rendered output are unchanged — the new parser is validated at parity against the previous one across the full pie test suite.

This is the first step of an incremental migration of Mermaid's parsers to Chevrotain. An internal, experimental `parser` configuration option selects the engine per diagram during the transition — e.g. `mermaid.initialize({ parser: { pie: 'legacy' } })` to fall back to the previous parser. This option is honored only via `initialize()` / `setConfig()` (not directives or frontmatter) and carries no semver guarantees; it will be removed once the migration completes.
