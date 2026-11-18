---
editLink: false
---

<!-- This page is ported from the Agentflow language reference, which is maintained outside this repository. Changes made only here are lost at the next port: please open an issue instead of editing this file. -->

# Task

A task is one step of work, described by its instruction.

## Syntax

```text
id["Label"]@{ instruction: "…" }
id["Label"]@{ shape: task, instruction: "…" }
id@{ instruction: "…" }
```

Without a label, the id is the label. Settings can also go on their own line, after the task: `id@{ instruction: "…" }`.

## Settings

| Setting       | Required | Value | Example                                             |
| ------------- | -------- | ----- | --------------------------------------------------- |
| `instruction` | yes      | text  | `instruction: "Summarise the ticket in two lines."` |

## Where it can go

A task sits inside a flow and holds nothing.

| Arrow                                   | In from              | Out to               |
| --------------------------------------- | -------------------- | -------------------- |
| [Arrow](./arrow.md) (`-->`)             | flow, task, decision | flow, task, decision |
| [Dotted link](./dotted-link.md) (`-.-`) | connector            | connector            |

## Rules

- A task sits inside a flow. → [`TASK_OUTSIDE_FLOW`](../diagnostics.md#task_outside_flow) (error)
- A task has an instruction that isn't blank. → [`INSTRUCTION_MISSING`](../diagnostics.md#instruction_missing) (error)
- A task with an empty label still needs an instruction. → [`TASK_MISSING_LABEL`](../diagnostics.md#task_missing_label) (error)
- A task takes only the `instruction` setting. → [`METADATA_UNKNOWN_KEY`](../diagnostics.md#metadata_unknown_key) (warning)
- The instruction is text. → [`METADATA_INVALID_VALUE`](../diagnostics.md#metadata_invalid_value) (error)
- The instruction has no unfilled placeholder such as `<REPO>`. → [`INSTRUCTION_PLACEHOLDER`](../diagnostics.md#instruction_placeholder) (error)
- A task's id is used by no other node. → [`ID_DUPLICATE`](../diagnostics.md#id_duplicate) (error)

## Example

<!-- expect: valid -->

```mermaid-example
agentflow TB
  flow support["Support"]
    summarise["Summarise"]@{ instruction: "Summarise the ticket in two lines." }
    reply["Reply"]
    summarise --> reply
  end
  reply@{ instruction: "Write a polite reply that answers the ticket." }
```

### Common mistake

A task at the top level of the workflow.

<!-- expect: TASK_OUTSIDE_FLOW -->

```mermaid-example
agentflow TB
  summarise["Summarise"]@{ instruction: "Summarise the ticket in two lines." }
```

> Task "summarise" is outside every flow. Move it into a flow.
