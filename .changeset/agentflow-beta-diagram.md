---
'mermaid': minor
---

feat: add the `agentflow-beta` diagram type for describing agentic workflows — agents, the flows they run, the tasks and tools inside them, and how control and data move between them.

```
agentflow-beta TB
  flow reviewer["Review Agent"]
    changes["Gather changes"]@{ shape: input }
    analyse["Analyse"]@{ shape: task }
    lint["run_linter"]@{ shape: tool }
    changes --> analyse --> lint
  end
```

- `flow … end` containers, a `global … end` scope block for nodes that must stay outside their referencing flow, and `connector` declarations for external systems.
- Node shapes addressed by domain-facing aliases (`task`, `tool`, `input`, `decision`, `refdoc`, `action`) via inline `@{ … }` metadata, and `@{ view: collapsed }` to fold a container down to a summary node.
- Edge operators carry semantics: `-->` sequence, `-.-` reference, `--x` failure, plus the labelled-branch form.
- `getSemanticModel()` projects the parsed diagram into a presentation-free semantic view for downstream consumers, and `getDiagnostics()` reports structured warnings with source positions.
- A `flowContainerStroke` theme variable across all built-in themes, and an `agentflow` config namespace for spacing, padding, and title margin.

The diagram is beta: the syntax may still change before it is declared stable.
