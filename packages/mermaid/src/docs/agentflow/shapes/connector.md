---
editLink: false
---

<!-- This page is ported from the Agentflow language reference, which is maintained outside this repository. Changes made only here are lost at the next port: please open an issue instead of editing this file. -->

# Connector

A connector is an outside service, reached over MCP, that the tasks linked to it can use.

## Syntax

```text
connector id["Label"]@{ protocol: "mcp", url: "…" }

connector id["Label"]
id@{ protocol: "mcp", url: "…" }
```

The `connector` keyword is what makes it a connector. The label is optional.

## Settings

| Setting    | Required | Value          | Example                          |
| ---------- | -------- | -------------- | -------------------------------- |
| `protocol` | yes      | one of `"mcp"` | `protocol: "mcp"`                |
| `url`      | yes      | a full address | `url: "https://example.com/mcp"` |

## Where it can go

A connector sits at the top level of the workflow and holds nothing. Tasks in any flow can link to it.

| Arrow                                   | In from | Out to |
| --------------------------------------- | ------- | ------ |
| [Arrow](./arrow.md) (`-->`)             | —       | —      |
| [Dotted link](./dotted-link.md) (`-.-`) | task    | task   |

## Rules

- A connector sits at the top level of the workflow. → [`CONNECTOR_NOT_ROOT`](../diagnostics.md#connector_not_root) (error)
- It has at least one link to a node that isn't a connector (a link from anything but a task is [`EDGE_KIND_INVALID`](../diagnostics.md#edge_kind_invalid)). → [`CONNECTOR_UNBOUND`](../diagnostics.md#connector_unbound) (error)
- Only tasks link to it, and only with a dotted link. → [`EDGE_KIND_INVALID`](../diagnostics.md#edge_kind_invalid) (error)
- A task links to it once. → [`CONNECTOR_BINDING_DUPLICATE`](../diagnostics.md#connector_binding_duplicate) (warning)
- Its id isn't `system`, which belongs to the built-in tools. → [`CONNECTOR_ID_RESERVED`](../diagnostics.md#connector_id_reserved) (error)
- It has both `protocol` and `url`. → [`METADATA_REQUIRED`](../diagnostics.md#metadata_required) (error)
- `protocol` is `"mcp"` and `url` is a full address. → [`METADATA_INVALID_VALUE`](../diagnostics.md#metadata_invalid_value) (error)
- A connector takes no other setting. → [`METADATA_UNKNOWN_KEY`](../diagnostics.md#metadata_unknown_key) (warning)
- Its id is used by no other node. → [`ID_DUPLICATE`](../diagnostics.md#id_duplicate) (error)

## Example

<!-- expect: valid -->

```mermaid-example
agentflow TB
  connector github["GitHub"]
  github@{ protocol: "mcp", url: "https://api.githubcopilot.com/mcp/" }

  flow triage["Issue triage"]
    read["Read issues"]@{ instruction: "List the open issues labelled bug." }
    label["Label issues"]@{ instruction: "Add a priority label to each bug." }
    read --> label
    read -.- github
    github -.- label
  end
```

### Common mistake

A connector written inside a flow.

<!-- expect: CONNECTOR_NOT_ROOT -->

```mermaid-example
agentflow TB
  flow triage["Issue triage"]
    connector github["GitHub"]@{ protocol: "mcp", url: "https://api.githubcopilot.com/mcp/" }
    read["Read issues"]@{ instruction: "List the open issues labelled bug." }
    read -.- github
  end
```

> Connector "github" is inside flow "triage", but connectors belong at the top level of the workflow. Move it out of the flow.
