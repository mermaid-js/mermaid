---
editLink: false
---

<!-- This page is ported from the Agentflow language reference, which is maintained outside this repository. Changes made only here are lost at the next port: please open an issue instead of editing this file. -->

# Cheat sheet

Every shape, arrow and setting on one page.

## Shapes

| Shape                               | Write it                                                   | Sits in                                     |
| ----------------------------------- | ---------------------------------------------------------- | ------------------------------------------- |
| [Flow](../shapes/flow.md)           | `flow id["Title"]` … `end`                                 | top level of the workflow, or inside a flow |
| [Task](../shapes/task.md)           | `id["Label"]`                                              | inside a flow                               |
| [Decision](../shapes/decision.md)   | `id{"Question?"}` or `id["Question?"]@{ shape: decision }` | inside a flow                               |
| [Input](../shapes/input.md)         | `id[/"Label"/]` or `id["Label"]@{ shape: input }`          | top level of the workflow                   |
| [Connector](../shapes/connector.md) | `connector id["Label"]`                                    | top level of the workflow                   |

## Arrows

| Arrow                                   | Write it                                  | Connects                                                     |
| --------------------------------------- | ----------------------------------------- | ------------------------------------------------------------ |
| [Arrow](../shapes/arrow.md)             | `a --> b`, `a --> b --> c`, `a --> b & c` | flows, tasks and decisions to each other; an input to a flow |
| [Branch](../shapes/arrow.md)            | `d -- yes --> b` or `d -->\|yes\| b`      | an arrow leaving a decision is a branch, so it needs a label |
| [Dotted link](../shapes/dotted-link.md) | `task -.- connector`                      | a task and a connector, in either order                      |

## Settings

Settings go in `@{ … }` after the node, or on their own line as `id@{ … }`.

| Shape     | Setting       | Required                                  | Value                                                              |
| --------- | ------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| flow      | `model`       | no                                        | text                                                               |
| flow      | `instruction` | no                                        | text                                                               |
| task      | `instruction` | yes                                       | text                                                               |
| decision  | `instruction` | no                                        | text                                                               |
| branch    | `instruction` | no                                        | text, set through an arrow id: `d e1@-- yes --> b` then `e1@{ … }` |
| input     | `trigger`     | yes                                       | `"schedule"`                                                       |
| input     | `cron`        | a schedule needs `cron` or `at`, not both | text in crontab format, such as `"0 9 * * 1-5"`                    |
| input     | `at`          | a schedule needs `cron` or `at`, not both | a date and 24-hour time, such as `"2026-12-24T09:00"`              |
| input     | `timezone`    | no                                        | a time zone name, such as `"UTC"`                                  |
| connector | `protocol`    | yes                                       | `"mcp"`                                                            |
| connector | `url`         | yes                                       | a full address, such as `"https://example.com/mcp"`                |

An instruction can't hold an unfilled placeholder such as `<REPO>`. The schedule trigger and the `cron` format are in [Triggers](../triggers.md).

## A complete workflow

<!-- expect: valid -->

```mermaid-example
agentflow TB
  weekday[/"Weekdays at 09:00"/]@{ trigger: "schedule", cron: "0 9 * * 1-5" }
  connector github["GitHub"]@{ protocol: "mcp", url: "https://api.githubcopilot.com/mcp/" }

  flow triage["Issue triage"]@{ model: "claude-sonnet-4-5" }
    read["Read issues"]@{ instruction: "List the issues opened since yesterday." }
    kind{"Any bugs?"}
    label["Label bugs"]@{ instruction: "Add a priority label to each bug." }
    report["Report"]@{ instruction: "Post a one-line summary: no new bugs today." }
    read --> kind
    kind -- yes --> label
    kind -- no --> report
    read -.- github
    label -.- github
  end

  weekday --> triage
```
