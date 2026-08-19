# agentflow — implementation notes

Implementation of the `agentflow-beta` diagram type. User-facing documentation
lives in [`src/docs/syntax/agentflow.md`](../../docs/syntax/agentflow.md).

(This file is `NOTES.md` rather than `README.md` because `packages/mermaid/.gitignore`
ignores `README.*` — the package README is generated.)

## Why the parser is JISON

The project rule is that new diagram types use Langium. Agentflow is a recorded
exception, not an oversight: its surface syntax _is_ flowchart's, and it reuses
flowchart's edge-operator lexing and inline `@{ ... }` shape-data verbatim. Both
exist only as JISON lexer states today, so a Langium agentflow would mean
reimplementing them and then keeping two independent definitions of the same
user-facing syntax in step. The full rationale, and the condition under which
this should be revisited, is at the top of
[`parser/agentflow.jison`](./parser/agentflow.jison).

## About the `§` references in this folder

Comments and test names here cite section numbers — `§5.1`, `§11`, `§13`, and so
on. These refer to the **agentflow syntax specification**, the versioned document
that defines the diagram's semantics (edge-operator meanings, metadata
applicability, instance resolution, capability evaluation). The specification is
maintained separately from this repository and moves faster than the renderer; the
section numbers are pinned to the spec version noted alongside each citation.

The specification is not the contract this package ships. What ships is:

- the grammar in [`parser/agentflow.jison`](./parser/agentflow.jison),
- the semantic projection asserted by the conformance fixtures in
  [`conformance/fixtures/`](./conformance/fixtures), where each `.mmd` is paired
  with an `.expected.json`,
- and the diagnostics enumerated in [`diagnostics.ts`](./diagnostics.ts).

If a comment and the code disagree, the code and its fixtures win.

## Layout

| Path               | Contents                                                             |
| ------------------ | -------------------------------------------------------------------- |
| `parser/`          | JISON grammar and its unit tests                                     |
| `agentflowDb.ts`   | Parse target; owns vertices, edges, containers, and element mappings |
| `diagnostics.ts`   | Structured warning vocabulary and `getDiagnostics()` support         |
| `transformData.ts` | Layout-data massaging applied before render                          |
| `renderer.ts`      | Draw entry point, on top of the unified renderer                     |
| `styles.ts`        | Theme-variable to CSS mapping                                        |
| `conformance/`     | `.mmd` / `.expected.json` fixture pairs and their runner             |
