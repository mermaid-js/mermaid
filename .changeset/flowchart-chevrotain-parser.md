---
'mermaid': patch
---

Migrate the flowchart parser to Chevrotain

The flowchart diagram is now parsed by a new Chevrotain-based parser instead of the jison parser. Behavior and rendered output are unchanged — the new parser is validated at parity against the previous one (identical `FlowDB` state) across the full flowchart test suite, which now runs on both engines.

The legacy (jison) flowchart parser is retained and selectable for rollback via the internal, experimental `parser` config option — e.g. `mermaid.initialize({ parser: { flowchart: 'legacy' } })`. This option is honored only through `initialize()` / `setConfig()` (not directives or frontmatter) and carries no semver guarantees; it will be removed once the migration completes.

Note: parse-error messages for invalid flowcharts are now produced by Chevrotain and differ in wording from the previous jison messages.
