---
editLink: false
---

<!-- This page is ported from the Agentflow language reference, which is maintained outside this repository. Changes made only here are lost at the next port: please open an issue instead of editing this file. -->

<!-- The examples misspell these words on purpose. -->
<!-- cspell:ignore eddit promt -->

# Diagnostics

Every error and warning Mermaid Flow can show for a workflow. An error means the workflow can't run as written. A warning points at something that runs but is likely a mistake.

| Id                                                                | Severity | Applies to                  | In one line                                                  |
| ----------------------------------------------------------------- | -------- | --------------------------- | ------------------------------------------------------------ |
| **Placing nodes**                                                 |          |                             |                                                              |
| [`TASK_OUTSIDE_FLOW`](#task_outside_flow)                         | error    | task, decision              | A task or decision sits outside every flow.                  |
| [`CONNECTOR_NOT_ROOT`](#connector_not_root)                       | error    | connector                   | A connector sits inside a flow.                              |
| [`INPUT_NOT_ROOT`](#input_not_root)                               | error    | input                       | An input sits inside a flow.                                 |
| [`FLOW_EMPTY`](#flow_empty)                                       | warning  | flow                        | A flow is empty, or holds only other flows.                  |
| [`ID_DUPLICATE`](#id_duplicate)                                   | error    | any node                    | Two nodes share an id.                                       |
| [`SHAPE_UNSUPPORTED`](#shape_unsupported)                         | error    | any node                    | A node uses a shape that isn't available.                    |
| **Writing tasks**                                                 |          |                             |                                                              |
| [`INSTRUCTION_MISSING`](#instruction_missing)                     | error    | task                        | A task has no instruction.                                   |
| [`TASK_MISSING_LABEL`](#task_missing_label)                       | error    | task                        | A task has an empty label and no instruction.                |
| [`INSTRUCTION_PLACEHOLDER`](#instruction_placeholder)             | error    | flow, task, decision, arrow | An instruction still holds a placeholder such as `<REPO>`.   |
| **Referring to things**                                           |          |                             |                                                              |
| [`REF_UNRESOLVED`](#ref_unresolved)                               | error    | arrow, dotted link          | A link points at an id no node has.                          |
| [`REF_OUT_OF_SCOPE`](#ref_out_of_scope)                           | error    | arrow                       | An arrow reaches into a flow from outside (inputs excepted). |
| [`REF_FORWARD`](#ref_forward)                                     | —        | —                           | No longer raised.                                            |
| **Connectors**                                                    |          |                             |                                                              |
| [`CONNECTOR_UNBOUND`](#connector_unbound)                         | error    | connector                   | The connector has no link, except to other connectors.       |
| [`CONNECTOR_ID_RESERVED`](#connector_id_reserved)                 | error    | connector                   | A connector uses the reserved id `system`.                   |
| [`CONNECTOR_BINDING_DUPLICATE`](#connector_binding_duplicate)     | warning  | dotted link                 | The same task and connector are linked twice.                |
| **Arrows**                                                        |          |                             |                                                              |
| [`EDGE_KIND_INVALID`](#edge_kind_invalid)                         | error    | arrow, dotted link          | A link joins two shapes it can't join.                       |
| [`EDGE_LABEL_UNSUPPORTED`](#edge_label_unsupported)               | error    | arrow                       | An arrow that isn't a branch has a label.                    |
| [`EDGE_INSTRUCTION_UNSUPPORTED`](#edge_instruction_unsupported)   | error    | arrow                       | An arrow that isn't a branch has an instruction.             |
| [`EDGE_REDUNDANT`](#edge_redundant)                               | warning  | arrow                       | The same arrow is drawn twice.                               |
| [`EDGE_SHORTCUT`](#edge_shortcut)                                 | error    | arrow                       | An arrow skips a step its source already reaches.            |
| [`EDGE_UNSUPPORTED`](#edge_unsupported)                           | error    | any link                    | A link uses an operator that isn't available.                |
| [`PIPE_PREFER_CHAINED`](#pipe_prefer_chained)                     | —        | —                           | No longer raised.                                            |
| **Decisions**                                                     |          |                             |                                                              |
| [`DECISION_TOO_FEW_BRANCHES`](#decision_too_few_branches)         | warning  | decision                    | A decision has fewer than two branches.                      |
| [`DECISION_BRANCH_UNGUARDED`](#decision_branch_unguarded)         | error    | branch                      | A branch has no label.                                       |
| [`DECISION_BRANCH_AMBIGUOUS`](#decision_branch_ambiguous)         | warning  | branch                      | Two branches share a label.                                  |
| [`DECISION_BRANCH_SHARED_TARGET`](#decision_branch_shared_target) | error    | branch                      | Two branches go to the same node.                            |
| **How the workflow moves**                                        |          |                             |                                                              |
| [`FLOW_CONFLICTING_TRANSITIONS`](#flow_conflicting_transitions)   | error    | last step of a flow, arrow  | A flow and its last step both say what comes next.           |
| [`CYCLE_NO_EXIT`](#cycle_no_exit)                                 | error    | loop                        | A loop, or a loop inside it, takes no decision branch out.   |
| [`CYCLE_TASK_EXIT`](#cycle_task_exit)                             | warning  | arrow                       | A task's arrow leaves a loop, so its target runs every lap.  |
| [`UNREACHABLE_COMPONENT`](#unreachable_component)                 | warning  | any node                    | Nothing leads to a node.                                     |
| **Settings**                                                      |          |                             |                                                              |
| [`METADATA_UNKNOWN_KEY`](#metadata_unknown_key)                   | warning  | any node, branch            | A setting the shape doesn't take.                            |
| [`METADATA_INVALID_VALUE`](#metadata_invalid_value)               | error    | any node                    | A setting has a value it can't take.                         |
| [`METADATA_REQUIRED`](#metadata_required)                         | error    | input, connector            | A required setting is missing.                               |
| [`METADATA_KEY_CONFLICT`](#metadata_key_conflict)                 | error    | input                       | Two settings that exclude each other are both set.           |

## Placing nodes

<a id="task_outside_flow"></a>

### TASK_OUTSIDE_FLOW

**error** · task, decision · active

**Why.** A task or decision is a step of a flow, so it has to sit inside one.

<!-- expect: TASK_OUTSIDE_FLOW -->

```mermaid-example
agentflow TB
  summarise["Summarise"]@{ instruction: "Summarise the ticket in two lines." }
```

> Task "summarise" is outside every flow. Move it into a flow.

**Fix.** Wrap the task or decision in `flow id` … `end`.

**Related.** [`CONNECTOR_NOT_ROOT`](#connector_not_root), [`INPUT_NOT_ROOT`](#input_not_root)

<a id="connector_not_root"></a>

### CONNECTOR_NOT_ROOT

**error** · connector · active

**Why.** A connector is shared by the whole workflow, so it can't belong to one flow.

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

**Fix.** Move the `connector` line above or below the flow, outside every `flow` … `end`. Its dotted links can stay where they are.

**Related.** [`TASK_OUTSIDE_FLOW`](#task_outside_flow), [`INPUT_NOT_ROOT`](#input_not_root)

<a id="input_not_root"></a>

### INPUT_NOT_ROOT

**error** · input · active

**Why.** An input starts flows from outside, so it can't sit inside one.

<!-- expect: INPUT_NOT_ROOT -->

```mermaid-example
agentflow TB
  flow triage["Issue triage"]
    weekday[/"Weekdays at 09:00"/]@{ trigger: "schedule", cron: "0 9 * * 1-5" }
    read["Read issues"]@{ instruction: "Summarise every open issue." }
  end
```

> Input "weekday" is inside flow "triage", but inputs belong at the top level of the workflow. Move it out of the flow.

**Fix.** Move the input outside every flow, and point an arrow from it to the flow: `weekday --> triage`.

**Related.** [`CONNECTOR_NOT_ROOT`](#connector_not_root), [`EDGE_KIND_INVALID`](#edge_kind_invalid)

<a id="flow_empty"></a>

### FLOW_EMPTY

**warning** · flow · active

**Why.** A flow that holds nothing, or only other flows, has nothing of its own to run. Any other shape directly inside it counts as something to run.

<!-- expect: FLOW_EMPTY -->

```mermaid-example
agentflow TB
  flow drafts["Drafts"]
  end
```

> Flow "drafts" is empty. Add a task to it, or remove it.

A flow that only holds other flows is flagged too:

<!-- expect: FLOW_EMPTY -->

```mermaid-example
agentflow TB
  flow support["Support"]
    flow triage["Triage"]
      read["Read ticket"]@{ instruction: "Read the ticket." }
    end
  end
```

> Flow "support" only holds other flows, so it has nothing of its own to run. Add a task to it.

**Fix.**

1. Add a task to the flow.
2. Remove the flow.

**Related.** [`TASK_OUTSIDE_FLOW`](#task_outside_flow)

<a id="id_duplicate"></a>

### ID_DUPLICATE

**error** · any node · active

**Why.** Arrows and settings find a node by its id. Two nodes with one id make every reference to it unclear.

<!-- expect: ID_DUPLICATE -->

```mermaid-example
agentflow TB
  flow blog["Blog post"]
    draft["Draft"]@{ instruction: "Write a 600-word post." }
    draft["Edit"]@{ instruction: "Tighten the post to 400 words." }
  end
```

> "draft" is the id of 2 nodes. Give each node its own id.

**Fix.** Rename one of the nodes, and update the arrows that should point at it.

A line such as `draft@{ instruction: "…" }` only adds settings to a node, so it never counts as a second node.

**Related.** [`REF_UNRESOLVED`](#ref_unresolved)

<a id="shape_unsupported"></a>

### SHAPE_UNSUPPORTED

**error** · any node · active

**Why.** The node's shape is one Mermaid draws, but the workflow can't run it. While a diagram has an unavailable shape or link, the other checks are skipped, so fix this first.

The message names the node and its shape:

<!-- template: SHAPE_UNSUPPORTED -->

```text
Node "<id>" uses the "<shape>" shape, which isn't available. Use "task", "flow" or "decision".
```

**Fix.** Rewrite the node as one of the available shapes: a [task](./shapes/task.md), [decision](./shapes/decision.md), [input](./shapes/input.md), [connector](./shapes/connector.md) or [flow](./shapes/flow.md).

**Related.** [`EDGE_UNSUPPORTED`](#edge_unsupported)

## Writing tasks

<a id="instruction_missing"></a>

### INSTRUCTION_MISSING

**error** · task · active

**Why.** A label names a step, but it doesn't say what the step should do. A task without an instruction can't run.

<!-- expect: INSTRUCTION_MISSING -->

```mermaid-example
agentflow TB
  flow support["Support"]
    summarise["Summarise"]
  end
```

> Task "summarise" has no instruction, so the workflow can't run it. Add an instruction that says what the step should do.

**Fix.** Add an instruction: `summarise["Summarise"]@{ instruction: "Summarise the ticket in two lines." }`. An instruction of only spaces counts as missing.

**Related.** [`TASK_MISSING_LABEL`](#task_missing_label), [`INSTRUCTION_PLACEHOLDER`](#instruction_placeholder)

<a id="task_missing_label"></a>

### TASK_MISSING_LABEL

**error** · task · active

**Why.** A task whose label is empty, and that has no instruction, has nothing to do.

<!-- expect: TASK_MISSING_LABEL -->

```mermaid-example
agentflow TB
  flow support["Support"]
    summarise[" "]
  end
```

> Task "summarise" has no label or instruction, so it has nothing to do. Add an instruction.

**Fix.** Add an instruction, and a label if you want one.

**Related.** [`INSTRUCTION_MISSING`](#instruction_missing)

<a id="instruction_placeholder"></a>

### INSTRUCTION_PLACEHOLDER

**error** · flow, task, decision, arrow · active

**Why.** A value in capitals inside angle brackets, such as `<REPO>`, is a placeholder nobody filled in. The step has no real instruction to run.

<!-- expect: INSTRUCTION_PLACEHOLDER -->

```mermaid-example
agentflow TB
  flow triage["Issue triage"]
    open["Open issue"]@{ instruction: "Open an issue in <REPO> describing the bug." }
  end
```

> The instruction on task "open" still has the placeholder "\<REPO>". Replace it with a real value.

**Fix.** Replace each placeholder with the real value. Lowercase tokens such as `<repo>` are not placeholders and are left alone.

**Related.** [`INSTRUCTION_MISSING`](#instruction_missing)

## Referring to things

<a id="ref_unresolved"></a>

### REF_UNRESOLVED

**error** · arrow, dotted link · active

**Why.** A link points at an id that no node has, usually a typo. The workflow can't follow it.

<!-- expect: REF_UNRESOLVED -->

```mermaid-example
agentflow TB
  flow blog["Blog post"]
    draft["Draft"]@{ instruction: "Write a 600-word post." }
    edit["Edit"]@{ instruction: "Tighten the post to 400 words." }
    draft --> eddit
  end
```

> An arrow connects to "eddit", but there's no node with that id. Check the spelling, or add the node.

**Fix.**

1. Fix the spelling of the id.
2. Add the missing node.

**Related.** [`ID_DUPLICATE`](#id_duplicate), [`REF_OUT_OF_SCOPE`](#ref_out_of_scope)

<a id="ref_out_of_scope"></a>

### REF_OUT_OF_SCOPE

**error** · arrow · active

**Why.** The nodes inside a flow belong to that flow. An arrow from outside the flow can reach the flow, but not the nodes inside it.

<!-- expect: REF_OUT_OF_SCOPE -->

```mermaid-example
agentflow TB
  flow team["Team"]
    plan["Plan"]@{ instruction: "Split the work into two parts." }
    flow writers["Writers"]
      write["Write"]@{ instruction: "Write the first part." }
    end
    plan --> write
  end
```

> "plan" can't connect to "write", because "write" is inside flow "writers". Point the arrow at flow "writers" instead.

**Fix.** Point the arrow at the flow the message names. An input's arrow is never flagged: an input can start any flow, even one inside another flow.

**Related.** [`REF_UNRESOLVED`](#ref_unresolved)

<a id="ref_forward"></a>

### REF_FORWARD

— · deprecated

No longer raised. You can use an id in an arrow before the line that defines the node.

## Connectors

<a id="connector_unbound"></a>

### CONNECTOR_UNBOUND

**error** · connector · active

**Why.** A connector is only used through the tasks linked to it. With no link, nothing can use it. Any link counts here except one to another connector: a link from anything but a task is [`EDGE_KIND_INVALID`](#edge_kind_invalid) instead.

<!-- expect: CONNECTOR_UNBOUND -->

```mermaid-example
agentflow TB
  connector github["GitHub"]@{ protocol: "mcp", url: "https://api.githubcopilot.com/mcp/" }

  flow triage["Issue triage"]
    read["Read issues"]@{ instruction: "List the open issues labelled bug." }
  end
```

> Connector "github" isn't linked to any task, so nothing can use it. Link it to the task that needs it: \<task> -.- github.

**Fix.**

1. Link the connector to the task that needs it: `read -.- github`.
2. Remove the connector.

**Related.** [`EDGE_KIND_INVALID`](#edge_kind_invalid), [`CONNECTOR_BINDING_DUPLICATE`](#connector_binding_duplicate)

<a id="connector_id_reserved"></a>

### CONNECTOR_ID_RESERVED

**error** · connector · active

**Why.** The id `system` belongs to the built-in tools. A connector with that id would clash with them.

<!-- expect: CONNECTOR_ID_RESERVED -->

```mermaid-example
agentflow TB
  connector system["Tools"]@{ protocol: "mcp", url: "https://example.com/mcp" }

  flow triage["Issue triage"]
    read["Read issues"]@{ instruction: "List the open issues labelled bug." }
    read -.- system
  end
```

> The id "system" is reserved for built-in tools. Give this connector a different id.

**Fix.** Rename the connector, and update its dotted links. A task or flow can still use the id `system`.

**Related.** [`ID_DUPLICATE`](#id_duplicate)

<a id="connector_binding_duplicate"></a>

### CONNECTOR_BINDING_DUPLICATE

**warning** · dotted link · active

**Why.** A dotted link has no direction, so `read -.- github` and `github -.- read` are the same link. The second one adds nothing.

<!-- expect: CONNECTOR_BINDING_DUPLICATE -->

```mermaid-example
agentflow TB
  connector github["GitHub"]@{ protocol: "mcp", url: "https://api.githubcopilot.com/mcp/" }

  flow triage["Issue triage"]
    read["Read issues"]@{ instruction: "List the open issues labelled bug." }
    read -.- github
    github -.- read
  end
```

> "read" is already linked to connector "github". Remove the extra dotted link.

**Fix.** Remove the extra dotted link. Different tasks can each link to the same connector.

**Related.** [`EDGE_REDUNDANT`](#edge_redundant), [`CONNECTOR_UNBOUND`](#connector_unbound)

## Arrows

<a id="edge_kind_invalid"></a>

### EDGE_KIND_INVALID

**error** · arrow, dotted link · active

**Why.** Each link joins only certain shapes. An arrow joins flows, tasks and decisions, or an input to a flow. A dotted link joins a task and a connector. The message says which end is wrong.

<!-- expect: EDGE_KIND_INVALID -->

```mermaid-example
agentflow TB
  connector github["GitHub"]@{ protocol: "mcp", url: "https://api.githubcopilot.com/mcp/" }

  flow triage["Issue triage"]
    read["Read issues"]@{ instruction: "List the open issues labelled bug." }
    read --> github
  end
```

> Connector "github" can't be the target of an arrow. Link it with a dotted link instead: \<task> -.- github.

**Fix.**

1. Link a connector to a task with a dotted link: `read -.- github`.
2. Link a connector to a task, not to a flow or a decision.
3. Point an input's arrow at a flow, and don't point arrows into an input.

**Related.** [`CONNECTOR_UNBOUND`](#connector_unbound), [`EDGE_UNSUPPORTED`](#edge_unsupported)

<a id="edge_label_unsupported"></a>

### EDGE_LABEL_UNSUPPORTED

**error** · arrow · active

**Why.** A label tells a decision which branch is which. On any other arrow, nothing reads it.

<!-- expect: EDGE_LABEL_UNSUPPORTED -->

```mermaid-example
agentflow TB
  flow support["Support"]
    read["Read ticket"]@{ instruction: "Summarise the ticket in two lines." }
    reply["Reply"]@{ instruction: "Write a polite reply that answers the ticket." }
    read -- then --> reply
  end
```

> The arrow from "read" to "reply" has a label, but only branches leaving a decision can have one. Remove the label, or add a decision.

**Fix.**

1. Remove the label: `read --> reply`.
2. Add a decision before the arrow, and make it a branch.

**Related.** [`EDGE_INSTRUCTION_UNSUPPORTED`](#edge_instruction_unsupported), [`DECISION_BRANCH_UNGUARDED`](#decision_branch_unguarded)

<a id="edge_instruction_unsupported"></a>

### EDGE_INSTRUCTION_UNSUPPORTED

**error** · arrow · active

**Why.** An instruction on an arrow only has a place on a branch. On any other arrow, it isn't clear which step should follow it.

<!-- expect: EDGE_INSTRUCTION_UNSUPPORTED -->

```mermaid-example
agentflow TB
  flow support["Support"]
    read["Read ticket"]@{ instruction: "Summarise the ticket in two lines." }
    reply["Reply"]@{ instruction: "Write a polite reply that answers the ticket." }
    read e1@--> reply
    e1@{ instruction: "Keep the customer's name." }
  end
```

> The arrow from "read" to "reply" has an instruction, but only branches leaving a decision can have one. Move it into a task.

**Fix.** Move the guidance into the instruction of the next task, or add a task for it.

**Related.** [`EDGE_LABEL_UNSUPPORTED`](#edge_label_unsupported)

<a id="edge_redundant"></a>

### EDGE_REDUNDANT

**warning** · arrow · active

**Why.** Drawing the same arrow twice adds nothing. It is usually left over from an edit.

<!-- expect: EDGE_REDUNDANT -->

```mermaid-example
agentflow TB
  flow blog["Blog post"]
    draft["Draft"]@{ instruction: "Write a 600-word post." }
    edit["Edit"]@{ instruction: "Tighten the post to 400 words." }
    draft --> edit
    draft --> edit
  end
```

> There is already an arrow from "draft" to "edit". Remove the extra one.

**Fix.** Remove the extra arrow. `a --> b` and `b --> a` are a loop, not a repeat.

**Related.** [`DECISION_BRANCH_SHARED_TARGET`](#decision_branch_shared_target), [`CONNECTOR_BINDING_DUPLICATE`](#connector_binding_duplicate)

<a id="edge_shortcut"></a>

### EDGE_SHORTCUT

**error** · arrow · active

**Why.** A task continues along every arrow that leaves it. If it already reaches a step through another node, a direct arrow to that step hands it the same work a second time.

<!-- expect: EDGE_SHORTCUT -->

```mermaid-example
agentflow TB
  flow blog["Blog post"]
    draft["Draft"]@{ instruction: "Write a 600-word post." }
    edit["Edit"]@{ instruction: "Tighten the post to 400 words." }
    publish["Publish"]@{ instruction: "Publish the edited post." }
    draft --> edit --> publish
    draft --> publish
  end
```

> The arrow from "draft" to "publish" skips a step: "draft" already reaches "publish" through "edit". Remove this arrow.

**Fix.** Remove the arrow that skips the step. Branches leaving a decision are never shortcuts.

**Related.** [`EDGE_REDUNDANT`](#edge_redundant)

<a id="edge_unsupported"></a>

### EDGE_UNSUPPORTED

**error** · any link · active

**Why.** The link uses an operator Mermaid draws, but the workflow can't follow it. While a diagram has an unavailable shape or link, the other checks are skipped, so fix this first.

The message names the link by its two ends:

<!-- template: EDGE_UNSUPPORTED -->

```text
The arrow from "<a>" to "<b>" uses "<operator>", which isn't available. Use an arrow (-->) to connect steps, or a dotted link (-.-) to link a connector.
```

**Fix.** Use an [arrow](./shapes/arrow.md) (`-->`) between steps, or a [dotted link](./shapes/dotted-link.md) (`-.-`) between a task and a connector.

**Related.** [`SHAPE_UNSUPPORTED`](#shape_unsupported), [`EDGE_KIND_INVALID`](#edge_kind_invalid)

<a id="pipe_prefer_chained"></a>

### PIPE_PREFER_CHAINED

— · deprecated

No longer raised. A chain such as `a --> b --> c` and one arrow per line mean the same.

## Decisions

<a id="decision_too_few_branches"></a>

### DECISION_TOO_FEW_BRANCHES

**warning** · decision · active

**Why.** A decision picks between branches. With fewer than two, there is nothing to choose.

<!-- expect: DECISION_TOO_FEW_BRANCHES -->

```mermaid-example
agentflow TB
  flow support["Support"]
    read["Read ticket"]@{ instruction: "Read the ticket." }
    kind{"Bug?"}
    fix["File a bug"]@{ instruction: "Open a bug report with steps to reproduce." }
    read --> kind
    kind -- yes --> fix
  end
```

> Decision "kind" has only 1 branch. Add another, because a decision needs at least 2.

A decision with no branches at all reads:

<!-- template: DECISION_TOO_FEW_BRANCHES -->

```text
Decision "<id>" has no branches. Add at least 2.
```

**Fix.**

1. Add another labelled branch.
2. Replace the decision with a regular arrow (`-->`).

**Related.** [`DECISION_BRANCH_UNGUARDED`](#decision_branch_unguarded)

<a id="decision_branch_unguarded"></a>

### DECISION_BRANCH_UNGUARDED

**error** · branch · active

**Why.** A decision chooses a branch by its label. A branch with no label can't be chosen. An instruction on the branch doesn't replace the label.

<!-- expect: DECISION_BRANCH_UNGUARDED -->

```mermaid-example
agentflow TB
  flow support["Support"]
    read["Read ticket"]@{ instruction: "Read the ticket." }
    kind{"Bug?"}
    fix["File a bug"]@{ instruction: "Open a bug report with steps to reproduce." }
    answer["Answer"]@{ instruction: "Reply using the help center." }
    read --> kind
    kind -- yes --> fix
    kind --> answer
  end
```

> The branch from "kind" to "answer" has no label, so the decision can't choose it. Add a label.

**Fix.** Add a label: `kind -- no --> answer`.

**Related.** [`DECISION_BRANCH_AMBIGUOUS`](#decision_branch_ambiguous), [`EDGE_LABEL_UNSUPPORTED`](#edge_label_unsupported)

<a id="decision_branch_ambiguous"></a>

### DECISION_BRANCH_AMBIGUOUS

**warning** · branch · active

**Why.** Two branches with the same label can't be told apart. Each one is flagged.

<!-- expect: DECISION_BRANCH_AMBIGUOUS -->

```mermaid-example
agentflow TB
  flow support["Support"]
    read["Read ticket"]@{ instruction: "Read the ticket." }
    kind{"Bug?"}
    fix["File a bug"]@{ instruction: "Open a bug report with steps to reproduce." }
    answer["Answer"]@{ instruction: "Reply using the help center." }
    read --> kind
    kind -- yes --> fix
    kind -- yes --> answer
  end
```

> Decision "kind" has more than one branch labelled "yes". Give each branch its own label.

**Fix.** Give each branch its own label.

**Related.** [`DECISION_BRANCH_SHARED_TARGET`](#decision_branch_shared_target)

<a id="decision_branch_shared_target"></a>

### DECISION_BRANCH_SHARED_TARGET

**error** · branch · active

**Why.** Two branches that go to the same node lead to the same place, so the choice changes nothing. Each one is flagged.

<!-- expect: DECISION_BRANCH_SHARED_TARGET -->

```mermaid-example
agentflow TB
  flow support["Support"]
    read["Read ticket"]@{ instruction: "Read the ticket." }
    kind{"Bug?"}
    fix["File a bug"]@{ instruction: "Open a bug report with steps to reproduce." }
    read --> kind
    kind -- yes --> fix
    kind -- maybe --> fix
  end
```

> Decision "kind" has more than one branch to "fix". Combine them into one branch.

**Fix.**

1. Point one of them at a different node.
2. Combine the branches into one. If that leaves the decision with one branch, it is [`DECISION_TOO_FEW_BRANCHES`](#decision_too_few_branches): replace the decision with a regular arrow (`-->`).

**Related.** [`DECISION_BRANCH_AMBIGUOUS`](#decision_branch_ambiguous), [`EDGE_REDUNDANT`](#edge_redundant)

## How the workflow moves

<a id="flow_conflicting_transitions"></a>

### FLOW_CONFLICTING_TRANSITIONS

**error** · last step of a flow, arrow · active

**Why.** When a flow finishes, either the flow says what comes next or its last step does. If both do, it isn't clear which arrow applies.

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

**Fix.**

1. Remove the flow's arrow and keep the step's.
2. Remove the step's arrow and keep the flow's.

**Related.** [`REF_OUT_OF_SCOPE`](#ref_out_of_scope)

<a id="cycle_no_exit"></a>

### CYCLE_NO_EXIT

**error** · loop · active

**Why.** A loop ends only when a decision in it takes a branch that leads out. Without one, the loop runs forever. An arrow out of a task is not a way out, because a task continues along every arrow that leaves it. Neither is the arrow out of a flow whose last step is a decision: it is taken whatever the decision picks.

<!-- expect: CYCLE_NO_EXIT -->

```mermaid-example
agentflow TB
  flow editor["Editor"]
    draft["Draft"]@{ instruction: "Write a 300-word product description." }
    review["Review"]@{ instruction: "List what to improve in the draft." }
    draft --> review
    review --> draft
  end
```

> The loop through "draft" never ends, because it has no decision with a branch leading out. Add a decision with a branch that leaves the loop.

When the loop has a decision but none of its branches leads out, the message reads:

<!-- template: CYCLE_NO_EXIT -->

```text
The loop through "<id>" never ends, because no decision in it has a branch leading out. Add a branch that leaves the loop.
```

A loop that can end can still hold a smaller loop that can't. Here `check` can leave the big loop, but `draft` and `research` go round each other without taking any of `check`'s branches.

<!-- expect: CYCLE_NO_EXIT -->

```mermaid-example
agentflow TB
  flow editor["Editor"]
    draft["Draft"]@{ instruction: "Write a 300-word product description." }
    check{"Good enough?"}
    publish["Publish"]@{ instruction: "Publish the approved description." }
    research["Research"]@{ instruction: "Find one more fact for the draft." }
    draft --> check
    check -- no --> draft
    check -- yes --> publish
    draft --> research
    research --> draft
  end
```

> The loop through "draft" never ends, because it has no decision with a branch leading out. Add a decision with a branch that leaves the loop.

**Fix.** Make every loop take a decision branch, with one branch that goes back and one that leaves:

```text
draft --> check
check -- no --> draft
check -- yes --> publish
```

**Related.** [`CYCLE_TASK_EXIT`](#cycle_task_exit), [`DECISION_TOO_FEW_BRANCHES`](#decision_too_few_branches)

<a id="cycle_task_exit"></a>

### CYCLE_TASK_EXIT

**warning** · arrow · active

**Why.** A task continues along every arrow that leaves it. When a task in a loop also points outside the loop, the target runs on every lap, not once at the end.

<!-- expect: CYCLE_TASK_EXIT -->

```mermaid-example
agentflow TB
  flow editor["Editor"]
    draft["Draft"]@{ instruction: "Write a 300-word product description." }
    check{"Good enough?"}
    publish["Publish"]@{ instruction: "Publish the approved description." }
    notify["Notify"]@{ instruction: "Tell the team a new draft is ready." }
    draft --> check
    check -- no --> draft
    check -- yes --> publish
    draft --> notify
  end
```

> Task "draft" has an arrow leaving its loop to "notify", so "notify" runs on every lap. To run it once after the loop, start that arrow from the loop's decision.

**Fix.**

1. Start the arrow from the loop's decision, as a labelled branch.
2. Keep it, if the target should run on every lap.

**Related.** [`CYCLE_NO_EXIT`](#cycle_no_exit)

<a id="unreachable_component"></a>

### UNREACHABLE_COMPONENT

**warning** · any node · active

**Why.** A node that nothing leads to never runs. You won't see this warning on a diagram. Every step with no arrow into it counts as a starting point. So does the first step written in a loop that nothing leads into. The id stays in the list so that tools reading diagnostics know it.

The message has one of these forms, for a node in a flow or at the top level of the workflow:

<!-- template: UNREACHABLE_COMPONENT -->

```text
Nothing in flow "<flow>" leads to "<id>", so it never runs. Add an arrow to it, or remove it.
```

<!-- template: UNREACHABLE_COMPONENT -->

```text
Nothing in the workflow leads to "<id>", so it never runs. Add an arrow to it, or remove it.
```

**Fix.** Add an arrow to the node, or remove it.

**Related.** [`FLOW_EMPTY`](#flow_empty)

## Settings

<a id="metadata_unknown_key"></a>

### METADATA_UNKNOWN_KEY

**warning** · any node, branch · active

**Why.** The shape doesn't take this setting, so it is ignored. It is usually a typo.

<!-- expect: METADATA_UNKNOWN_KEY -->

```mermaid-example
agentflow TB
  flow support["Support"]
    summarise["Summarise"]@{ instruction: "Summarise the ticket in two lines.", promt: "Be brief." }
  end
```

> Task "summarise" has an unknown setting "promt". Check the spelling, or remove it.

**Fix.** Fix the spelling, or remove the setting. Each [shape page](./shapes/index.md) lists the settings it takes.

**Related.** [`METADATA_INVALID_VALUE`](#metadata_invalid_value)

<a id="metadata_invalid_value"></a>

### METADATA_INVALID_VALUE

**error** · any node · active

**Why.** The setting is known, but its value can't be used: the wrong kind of value, a choice that isn't on the list, or text in the wrong format.

<!-- expect: METADATA_INVALID_VALUE -->

```mermaid-example
agentflow TB
  connector github["GitHub"]@{ protocol: "http", url: "https://api.githubcopilot.com/mcp/" }

  flow triage["Issue triage"]
    read["Read issues"]@{ instruction: "List the open issues labelled bug." }
    read -.- github
  end
```

> The "protocol" setting on connector "github" can't be "http". Use "mcp".

The message names what is wrong. A wrong kind of value reads like this:

<!-- template: METADATA_INVALID_VALUE -->

```text
The "<setting>" setting on <shape> "<id>" should be text, not a number.
```

**Fix.** Use a value of the kind the message asks for. The shape pages list each setting's values.

**Related.** [`METADATA_UNKNOWN_KEY`](#metadata_unknown_key), [`METADATA_REQUIRED`](#metadata_required)

<a id="metadata_required"></a>

### METADATA_REQUIRED

**error** · input, connector · active

**Why.** Some settings have no default. A connector needs `protocol` and `url`, an input needs a `trigger`, and a schedule needs a `cron` or an `at`.

<!-- expect: METADATA_REQUIRED -->

```mermaid-example
agentflow TB
  connector github["GitHub"]@{ protocol: "mcp" }

  flow triage["Issue triage"]
    read["Read issues"]@{ instruction: "List the open issues labelled bug." }
    read -.- github
  end
```

> Connector "github" is missing its "url" setting. Add one.

**Fix.** Add the setting the message names.

**Related.** [`METADATA_INVALID_VALUE`](#metadata_invalid_value), [`METADATA_KEY_CONFLICT`](#metadata_key_conflict)

<a id="metadata_key_conflict"></a>

### METADATA_KEY_CONFLICT

**error** · input · active

**Why.** A schedule runs either on repeat (`cron`) or once (`at`), not both.

<!-- expect: METADATA_KEY_CONFLICT -->

```mermaid-example
agentflow TB
  weekday[/"Weekdays at 09:00"/]@{ trigger: "schedule", cron: "0 9 * * 1-5", at: "2026-12-24T09:00" }

  flow triage["Issue triage"]
    read["Read issues"]@{ instruction: "Summarise every open issue." }
  end

  weekday --> triage
```

> Input "weekday" has both a "cron" and an "at" setting, but a schedule takes only one. Keep "cron" to repeat, or "at" to run once.

**Fix.**

1. Keep `cron` to repeat.
2. Keep `at` to run once.

**Related.** [`METADATA_REQUIRED`](#metadata_required)
