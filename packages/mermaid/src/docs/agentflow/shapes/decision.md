---
editLink: false
---

<!-- This page is ported from the Agentflow language reference, which is maintained outside this repository. Changes made only here are lost at the next port: please open an issue instead of editing this file. -->

# Decision

A decision picks one of its labelled branches.

## Syntax

```text
id{"Question?"}
id["Question?"]@{ shape: decision }
id{"Question?"}@{ instruction: "…" }
```

The branches are arrows that leave the decision, each with a label: `id -- yes --> next` or `id -->|yes| next`.

## Settings

| Setting       | Required | Value | Example                                                   |
| ------------- | -------- | ----- | --------------------------------------------------------- |
| `instruction` | no       | text  | `instruction: "Treat crashes and wrong results as bugs."` |

A branch takes an `instruction` too. See [Arrow](./arrow.md#settings).

## Where it can go

A decision sits inside a flow and holds nothing.

| Arrow                                   | In from              | Out to (branches)    |
| --------------------------------------- | -------------------- | -------------------- |
| [Arrow](./arrow.md) (`-->`)             | flow, task, decision | flow, task, decision |
| [Dotted link](./dotted-link.md) (`-.-`) | —                    | —                    |

## Rules

- A decision sits inside a flow. → [`TASK_OUTSIDE_FLOW`](../diagnostics.md#task_outside_flow) (error)
- A decision has at least two branches. → [`DECISION_TOO_FEW_BRANCHES`](../diagnostics.md#decision_too_few_branches) (warning)
- Every branch has a label. → [`DECISION_BRANCH_UNGUARDED`](../diagnostics.md#decision_branch_unguarded) (error)
- No two branches share a label. → [`DECISION_BRANCH_AMBIGUOUS`](../diagnostics.md#decision_branch_ambiguous) (warning)
- No two branches go to the same node. → [`DECISION_BRANCH_SHARED_TARGET`](../diagnostics.md#decision_branch_shared_target) (error)
- Every loop can end: a decision in it has a branch that leaves the loop, and every loop inside it, however small, takes at least one decision branch. → [`CYCLE_NO_EXIT`](../diagnostics.md#cycle_no_exit) (error)
- A decision takes only the `instruction` setting. → [`METADATA_UNKNOWN_KEY`](../diagnostics.md#metadata_unknown_key) (warning)
- The instruction is text. → [`METADATA_INVALID_VALUE`](../diagnostics.md#metadata_invalid_value) (error)
- The instruction has no unfilled placeholder such as `<REPO>`. → [`INSTRUCTION_PLACEHOLDER`](../diagnostics.md#instruction_placeholder) (error)
- A decision's id is used by no other node. → [`ID_DUPLICATE`](../diagnostics.md#id_duplicate) (error)

## Example

<!-- expect: valid -->

```mermaid-example
agentflow TB
  flow support["Support"]
    read["Read ticket"]@{ instruction: "Read the ticket and decide whether it is a bug or a question." }
    kind{"Bug or question?"}@{ instruction: "Treat crashes and wrong results as bugs." }
    fix["File a bug"]@{ instruction: "Open a bug report with steps to reproduce." }
    answer["Answer"]@{ instruction: "Reply to the question using the help center." }
    read --> kind
    kind -- bug --> fix
    kind -- question --> answer
  end
```

### Common mistake

Two branches with the same label.

<!-- expect: DECISION_BRANCH_AMBIGUOUS -->

```mermaid-example
agentflow TB
  flow support["Support"]
    read["Read ticket"]@{ instruction: "Read the ticket and decide whether it is a bug or a question." }
    kind{"Bug or question?"}
    fix["File a bug"]@{ instruction: "Open a bug report with steps to reproduce." }
    answer["Answer"]@{ instruction: "Reply to the question using the help center." }
    read --> kind
    kind -- bug --> fix
    kind -- bug --> answer
  end
```

> Decision "kind" has more than one branch labelled "bug". Give each branch its own label.
