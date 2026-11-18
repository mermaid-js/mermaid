---
editLink: false
---

<!-- This page is ported from the Agentflow language reference, which is maintained outside this repository. Changes made only here are lost at the next port: please open an issue instead of editing this file. -->

# Dotted link

A dotted link (`-.-`) gives a task access to a connector.

## Syntax

```text
task -.- connector
connector -.- task
```

A dotted link has no direction, so both orders mean the same.

## Settings

| Setting | Required | Value | Example |
| ------- | -------- | ----- | ------- |
| —       | —        | —     | —       |

A dotted link takes no settings. Settings written on one are ignored.

## Connects

| From      | To        |
| --------- | --------- |
| task      | connector |
| connector | task      |

A dotted link is not part of the order of steps. The task can sit in any flow.

## Rules

- A dotted link joins a task and a connector, nothing else. → [`EDGE_KIND_INVALID`](../diagnostics.md#edge_kind_invalid) (error)
- Both ends are nodes that exist. → [`REF_UNRESOLVED`](../diagnostics.md#ref_unresolved) (error)
- The same task and connector are linked once. → [`CONNECTOR_BINDING_DUPLICATE`](../diagnostics.md#connector_binding_duplicate) (warning)
- A connector is linked to at least one other node, which must be a task. → [`CONNECTOR_UNBOUND`](../diagnostics.md#connector_unbound) (error); a link from anything but a task is [`EDGE_KIND_INVALID`](../diagnostics.md#edge_kind_invalid) (error)

## Example

<!-- expect: valid -->

```mermaid-example
agentflow TB
  connector github["GitHub"]@{ protocol: "mcp", url: "https://api.githubcopilot.com/mcp/" }
  connector slack["Slack"]@{ protocol: "mcp", url: "https://example.com/slack/mcp" }

  flow triage["Issue triage"]
    read["Read issues"]@{ instruction: "List the open issues labelled bug." }
    post["Post summary"]@{ instruction: "Post a summary of the bugs to the team channel." }
    read --> post
    read -.- github
    slack -.- post
  end
```

### Common mistake

A dotted link from a flow instead of a task.

<!-- expect: EDGE_KIND_INVALID -->

```mermaid-example
agentflow TB
  connector github["GitHub"]@{ protocol: "mcp", url: "https://api.githubcopilot.com/mcp/" }

  flow triage["Issue triage"]
    read["Read issues"]@{ instruction: "List the open issues labelled bug." }
  end

  triage -.- github
```

> Only a task can link to connector "github", but "triage" is a flow. Link the connector to a task inside it.
