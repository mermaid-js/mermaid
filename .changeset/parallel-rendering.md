---
'mermaid': minor
---

feat: render and parse diagrams concurrently instead of serializing every call through a global execution queue

`mermaid.render`, `mermaid.parse` and `mermaid.run` no longer funnel every call through a single execution queue. Each call now prepares its own isolated state and a coordinator only serializes the calls that would actually interfere with each other:

- Calls whose fully resolved configuration is identical run concurrently; calls needing a conflicting configuration (e.g. a different `theme` in frontmatter or an `%%{init}%%` directive) wait for each other in FIFO order.
- Diagram types audited for concurrency (currently `pie`, `flowchart`, `sequence` and the built-in error diagram) declare exactly which shared internals they touch; all remaining types conservatively serialize among themselves — exactly the safety the old queue provided — while still running in parallel with audited types.
- `mermaid.run` now renders the diagrams found on the page concurrently.

Supporting changes:

- Diagram DBs that are instantiated per render no longer share the module-level accessibility title/description state (`commonDb`); each instance now carries its own, so concurrent renders cannot overwrite each other's titles. The pie diagram's DB has been converted to this per-render class pattern (`PieDB`).
- Langium-based parsers capture `parser.parser.yy` before their first `await`, so a concurrent parse can no longer swap the DB out from under them.
- Lazy-loading the same diagram type concurrently now shares a single loader call.
- `flowchart.arrowMarkerAbsolute` now defaults to `false` (matching the root `arrowMarkerAbsolute` default that the flowchart `init` always copied over it before rendering).
