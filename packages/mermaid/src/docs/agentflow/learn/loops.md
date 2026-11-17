---
editLink: false
---

<!-- This page is ported from the Agentflow language reference, which is maintained outside this repository. Changes made only here are lost at the next port: please open an issue instead of editing this file. -->

# 4. Loops

An arrow back to an earlier step makes a loop. Every loop needs a way out: a decision in the loop with a branch that leaves it. A [smaller loop inside a bigger one](../diagnostics.md#cycle_no_exit) needs a decision branch of its own too.

<!-- expect: valid -->

```mermaid-example
agentflow TB
  flow editor["Editor"]
    draft["Draft"]@{ instruction: "Write a 300-word product description." }
    check{"Good enough?"}
    publish["Publish"]@{ instruction: "Publish the approved description." }
    draft --> check
    check -- no --> draft
    check -- yes --> publish
  end
```

Here `check -- no --> draft` repeats the draft, and `check -- yes --> publish` leaves the loop.

A loop without a decision never ends.

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

## Leave from the decision

A task continues along every arrow that leaves it. If a task in the loop also points outside it, that target runs on every lap. Start the arrow from the decision instead.

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

Next: [5. Using connectors](./using-connectors.md).
