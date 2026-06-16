---
'mermaid': patch
---

Migrate the state diagram parser to Chevrotain

The state diagram (both `stateDiagram` and `stateDiagram-v2`) is now parsed by a new Chevrotain-based parser instead of the jison parser. Behavior and rendered output are unchanged — the new parser is validated at parity against the previous one across the full state test suite and a dedicated parity fixture corpus.

This is the second diagram in the incremental migration of Mermaid's parsers to Chevrotain (after pie), and the first **jison** parser to be migrated. As with pie, the engine can be selected per diagram via the internal `parser` config — `mermaid.initialize({ parser: { state: 'legacy' } })` falls back to the previous parser. This option is honored only via `initialize()` / `setConfig()` and carries no semver guarantees; it will be removed once the migration completes.
