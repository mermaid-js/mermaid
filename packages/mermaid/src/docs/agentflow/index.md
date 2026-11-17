---
editLink: false
---

<!-- This page is ported from the Agentflow language reference, which is maintained outside this repository. Changes made only here are lost at the next port: please open an issue instead of editing this file. -->

# Agentflow Semantics (v<MERMAID_RELEASE_VERSION>+)

Agentflow is a language for writing an AI workflow as a Mermaid diagram. These pages describe what makes an agentflow diagram a valid workflow: one that can be run, not only drawn.

An agentflow diagram starts with the `agentflow` keyword.

A diagram is built from these parts:

- **Flows** group the steps of one piece of work. A flow can set the model and a shared instruction for the steps directly inside it.
- **Tasks** are the steps. Each one has an instruction that says what the AI agent should do.
- **Decisions** let the agent pick one of several labelled branches.
- **Arrows** set the order: `a --> b` runs `b` after `a`.
- **Inputs** say what starts a flow. Each one has a **trigger**: a schedule (repeat with `cron`, or run once with `at`) or a webhook. See [Triggers](./triggers.md).
- **Connectors** give tasks access to outside tools over MCP. A dotted link (`-.-`) links a task to the connector it uses.

This workflow triages new GitHub issues every weekday morning:

<!-- expect: valid -->

```mermaid-example
agentflow TB
  weekday[/"Weekdays at 09:00"/]@{ trigger: "schedule", cron: "0 9 * * 1-5" }
  connector github["GitHub"]
  github@{ protocol: "mcp", url: "https://api.githubcopilot.com/mcp/" }

  flow triage["Issue triage"]
    read["Read new issues"]@{ instruction: "List the issues opened since yesterday." }
    kind{"Bug or question?"}
    label["Label the bug"]@{ instruction: "Add the bug label and a one-line summary." }
    answer["Answer the question"]@{ instruction: "Reply with a short, helpful answer." }
    read --> kind
    kind -- bug --> label
    kind -- question --> answer
    read -.- github
    label -.- github
    answer -.- github
  end

  weekday --> triage
```

`weekday` is the input, `github` the connector, `triage` the flow and `kind` the decision. The rest are tasks.

## Why there are rules

A workflow that runs has to make sense as a workflow, not just render. A task needs an instruction. A decision's branches need labels. A loop needs a way out. A connector has to be linked to a task.

The rules on these pages decide whether a diagram is a valid workflow: which shapes go where, what each arrow can connect, and which settings each shape takes.

```note
Mermaid draws an agentflow diagram whether or not it follows these rules. The library does not check them, so an invalid workflow still renders. The examples on these pages that break a rule are drawn the same way as the valid ones, and the text next to each says what is wrong with it.
```

[Mermaid Flow](https://mermaid.ai/flow) is an existing editor for agentflow diagrams. It checks a workflow against these rules as you edit, so every workflow error or warning it shows has an entry in [Diagnostics](./diagnostics.md).

## Where to start

- **New to agentflow?** Take the [Learn](./learn/your-first-agent.md) tour from the first page. It ends with a one-page [cheat sheet](./learn/cheat-sheet.md).
- **Looking something up?** [Shapes](./shapes/index.md) has one page per shape and arrow: syntax, settings, where it can go, and the rules it follows.
- **Got an error or warning?** [Diagnostics](./diagnostics.md) lists each one, what it means, and how to fix it.
- **Starting a flow on a schedule or a webhook?** [Triggers](./triggers.md) covers each trigger and its settings.
- **Styling and layout?** The [Agentflow syntax page](../syntax/agentflow.md) covers how the diagram is drawn: themes, layout, collapsing containers and configuration.
