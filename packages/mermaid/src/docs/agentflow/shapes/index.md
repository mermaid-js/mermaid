---
editLink: false
---

<!-- This page is ported from the Agentflow language reference, which is maintained outside this repository. Changes made only here are lost at the next port: please open an issue instead of editing this file. -->

# Shapes

A workflow has five shapes and two kinds of link.

| Shape                       | Sits in                              | Required settings                         | Optional settings      | Arrow in from               | Arrow out to         | Dotted link to |
| --------------------------- | ------------------------------------ | ----------------------------------------- | ---------------------- | --------------------------- | -------------------- | -------------- |
| [Flow](./flow.md)           | top level of the workflow, or a flow | —                                         | `model`, `instruction` | flow, task, decision, input | flow, task, decision | —              |
| [Task](./task.md)           | a flow                               | `instruction`                             | —                      | flow, task, decision        | flow, task, decision | connector      |
| [Decision](./decision.md)   | a flow                               | —                                         | `instruction`          | flow, task, decision        | flow, task, decision | —              |
| [Input](./input.md)         | top level of the workflow            | `trigger`; a schedule also `cron` or `at` | `timezone`             | —                           | flow                 | —              |
| [Connector](./connector.md) | top level of the workflow            | `protocol`, `url`                         | —                      | —                           | —                    | task           |

| Arrow                           | Write it  | Connects                                                |
| ------------------------------- | --------- | ------------------------------------------------------- |
| [Arrow](./arrow.md)             | `a --> b` | flows, tasks and decisions in order; an input to a flow |
| [Dotted link](./dotted-link.md) | `a -.- b` | a task and a connector                                  |

Every node has an id, and no two nodes share one. You can use an id in an arrow before the line that defines the node.

The rules each shape follows are on its page. Rules about links are on the [Arrow](./arrow.md) and [Dotted link](./dotted-link.md) pages. The full list of errors and warnings is in [Diagnostics](../diagnostics.md). The schedule trigger's settings are in [Triggers](../triggers.md).
