---
editLink: false
---

<!-- This page is ported from the Agentflow language reference, which is maintained outside this repository. Changes made only here are lost at the next port: please open an issue instead of editing this file. -->

# Agentflow Semantics (v12.3.0+)

Draw an AI workflow as a diagram, and run it as drawn. Three pieces make that work:

- **agentflow** is the language: an open-source Mermaid diagram type for drawing agentic flows and attaching metadata to them. A diagram starts with the `agentflow` keyword. The language itself has no rules about what makes a working workflow: Mermaid draws the diagram and keeps its metadata as written, even when it breaks the rules below.
- **agentflow semantics** are the rules on these pages. They decide when an agentflow diagram is a valid workflow.
- **[Mermaid Flow](https://mermaid.ai/flow)** is where it comes to life. With Mermaid Flow you can edit your diagrams and run them. Its editor and its interpreter both follow these rules, so the diagram you draw is the workflow that runs.

A diagram is built from these parts:

- **Flows** group the steps of one piece of work. A flow can set the model and a shared instruction for the steps directly inside it.
- **Tasks** are the steps. Each one has an instruction that says what the AI agent should do.
- **Decisions** let the agent pick one of several labelled branches.
- **Arrows** set the order: `a --> b` runs `b` after `a`.
- **Inputs** say what starts a flow: a schedule that repeats with `cron`, or runs once with `at`.
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

Because the workflow runs, the diagram has to make sense as a workflow, not just render. A task needs an instruction. A decision's branches need labels. A loop needs a way out. A connector has to be linked to a task.

The rules on these pages decide whether a diagram is a valid workflow: which shapes go where, what each arrow can connect, and which settings each shape takes.

```note
Mermaid does not check these rules, so a workflow that breaks one still renders. The examples on these pages that break a rule are drawn the same way as the valid ones, and the text next to each says what is wrong with it.
```

Mermaid Flow checks your workflow against these rules as you edit, so every workflow error or warning it shows has an entry in [Diagnostics](./diagnostics.md).

## Where to start

- **New to agentflow?** Take the [Learn](./learn/your-first-agent.md) tour from the first page. It ends with a one-page [cheat sheet](./learn/cheat-sheet.md).
- **Looking something up?** [Shapes](./shapes/index.md) has one page per shape and arrow: syntax, settings, where it can go, and the rules it follows.
- **Got an error or warning?** [Diagnostics](./diagnostics.md) lists each one, what it means, and how to fix it.
- **Starting a flow on a schedule?** [Triggers](./triggers.md) covers the schedule trigger and its settings.
- **Styling and layout?** The [Agentflow syntax page](../syntax/agentflow.md) covers how the diagram is drawn: themes, layout, collapsing containers and configuration.
