---
editLink: false
---

<!-- This page is ported from the Agentflow language reference, which is maintained outside this repository. Changes made only here are lost at the next port: please open an issue instead of editing this file. -->

# Flow

A flow is a named group of steps, and the only shape that holds other shapes.

## Syntax

```text
flow id
  …
end

flow id["Title"]
  …
end

flow id["Title"]@{ model: "…", instruction: "…" }
  …
end
```

The title is optional. Settings can also go on their own line, anywhere in the diagram: `id@{ model: "…" }`.

## Settings

| Setting       | Required | Value | Example                                              |
| ------------- | -------- | ----- | ---------------------------------------------------- |
| `model`       | no       | text  | `model: "claude-sonnet-4-5"`                         |
| `instruction` | no       | text  | `instruction: "You write friendly support replies."` |

`model` applies to the tasks directly inside the flow, and `instruction` to the steps directly inside it. Neither reaches a nested flow: set them on that flow too.

## Where it can go

A flow sits at the top level of the workflow or inside another flow, and holds tasks, decisions and other flows.

| Arrow                                   | In from                     | Out to               |
| --------------------------------------- | --------------------------- | -------------------- |
| [Arrow](./arrow.md) (`-->`)             | flow, task, decision, input | flow, task, decision |
| [Dotted link](./dotted-link.md) (`-.-`) | —                           | —                    |

## Rules

- A flow holds at least one task or decision of its own. → [`FLOW_EMPTY`](../diagnostics.md#flow_empty) (warning)
- An arrow can't point at a node inside a flow from outside that flow. Point it at the flow. An input can start any flow, even one inside another flow. → [`REF_OUT_OF_SCOPE`](../diagnostics.md#ref_out_of_scope) (error)
- When a flow has an arrow to what comes next, its last step has no arrow of its own out of the flow. → [`FLOW_CONFLICTING_TRANSITIONS`](../diagnostics.md#flow_conflicting_transitions) (error)
- A flow takes only the `model` and `instruction` settings. → [`METADATA_UNKNOWN_KEY`](../diagnostics.md#metadata_unknown_key) (warning)
- Each setting is text. → [`METADATA_INVALID_VALUE`](../diagnostics.md#metadata_invalid_value) (error)
- The instruction has no unfilled placeholder such as `<REPO>`. → [`INSTRUCTION_PLACEHOLDER`](../diagnostics.md#instruction_placeholder) (error)
- A flow's id is used by no other node. → [`ID_DUPLICATE`](../diagnostics.md#id_duplicate) (error)

## Example

<!-- expect: valid -->

```mermaid-example
agentflow TB
  flow research["Research"]@{ model: "claude-sonnet-4-5", instruction: "Cite every source you use." }
    find["Find sources"]@{ instruction: "Find three recent sources on the topic." }
    notes["Take notes"]@{ instruction: "Write short notes on each source." }
    find --> notes
  end

  flow write["Write"]
    draft["Draft"]@{ instruction: "Write a 600-word post from the notes." }
  end

  research --> write
```

### Common mistake

The flow continues to `write`, and its last task also points somewhere else.

<!-- expect: FLOW_CONFLICTING_TRANSITIONS -->

```mermaid-example
agentflow TB
  flow research["Research"]
    find["Find sources"]@{ instruction: "Find three recent sources on the topic." }
  end

  flow write["Write"]
    draft["Draft"]@{ instruction: "Write a 600-word post from the sources." }
  end

  flow archive["Archive"]
    save["Save sources"]@{ instruction: "Save the source links to the archive." }
  end

  research --> write
  find --> archive
```

> Flow "research" continues to "write" when it finishes, but its last task "find" also has an arrow to "archive". Keep one of the two.
