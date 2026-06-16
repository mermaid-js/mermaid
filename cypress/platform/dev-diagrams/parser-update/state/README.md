# State diagram parser-update fixtures

State diagram sources for verifying that the **Chevrotain** state parser produces the same `db` as
the legacy jison parser. `state.parity.spec.ts` runs every fixture through both engines and diffs
the resulting `StateDB`. To render with the legacy parser: `mermaid.initialize({ parser: { state: 'legacy' } })`.
