# Agentflow fixtures

Working set for the redux-colour work on agentflow.

None of these pin a theme or look. They do not need to: agentflow declares `redux-color`
and `neo` as its own defaults in `config.schema.yaml`, so opening any of them shows the
palette straight away. Leaving the front matter out also means the Dev Explorer's own
theme and look controls still govern, so the same file can be compared across themes —
that is why the copied spec fixture had its `theme: default` block removed.

| Fixtures            | Source                                                                                                                                                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `01` … `08`         | every `mermaid-example` block in `src/docs/syntax/agentflow.md`, in document order                                                                                                                                                                 |
| `09` … `14`         | the e2e fixtures under `e2e/diagrams/agentflow/` covering ground the docs do not: all v0.8 node shapes, every container kind, collapsed containers with cross-boundary edges, the `global` block, the input-value pattern, and multiple connectors |
| `15-support-triage` | written for this work — four containers (one collapsed), two connectors, a `global` refdoc, labelled decision branches, and all seven node kinds in one picture                                                                                    |

`15-support-triage` is the one to judge colour on: it is the only fixture where sibling
containers and every node kind appear together, so colouring per container and colouring
per node kind look obviously different on it.

`e2e/rendering/agentflow/agentflow-fixtures.spec.ts` sweeps this directory from the
filesystem, so a fixture dropped in here is snapshot-tested without touching the spec —
the same arrangement `e2e/rendering/usecase/usecase.spec.ts` uses for `diagrams/use-case`.
