---
editLink: false
---

<!-- This page is ported from the Agentflow language reference, which is maintained outside this repository. Changes made only here are lost at the next port: please open an issue instead of editing this file. -->

# 6. Starting a flow

An input says what starts a flow. Write it with slashes, `id[/"Label"/]`, put it at the top level of the workflow, and point an arrow from it to the flow.

<!-- expect: valid -->

```mermaid-example
agentflow TB
  weekday[/"Weekdays at 09:00"/]@{ trigger: "schedule", cron: "0 9 * * 1-5" }

  flow triage["Issue triage"]
    read["Read issues"]@{ instruction: "Summarise every open issue." }
  end

  weekday --> triage
```

Every input has a `trigger`, and the trigger is `"schedule"`: it starts the flow at set times. A schedule takes exactly one of `cron` and `at`, and an optional `timezone`.

`cron` repeats, written in crontab format: minute, hour, day of month, month, day of week. `at` runs once, at a date and 24-hour time written `YYYY-MM-DDTHH:MM`. [Triggers](../triggers.md) has the full details.

<!-- expect: valid -->

```mermaid-example
agentflow TB
  launch[/"Launch day"/]@{ trigger: "schedule", at: "2026-12-24T09:00", timezone: "Europe/Madrid" }

  flow announce["Announce"]
    post["Post"]@{ instruction: "Post the launch announcement." }
  end

  launch --> announce
```

A schedule with neither `cron` nor `at` has nothing to go by.

<!-- expect: METADATA_REQUIRED -->

```mermaid-example
agentflow TB
  launch[/"Launch day"/]@{ trigger: "schedule" }

  flow announce["Announce"]
    post["Post"]@{ instruction: "Post the launch announcement." }
  end

  launch --> announce
```

> Input "launch" is missing its schedule, which a "schedule" trigger needs. Add "cron" to repeat, such as "0 9 \* \* 1-5", or "at" to run once, such as "2026-12-24T09:00".

An input only starts flows. An arrow from an input to a task, or into an input, is an error.

That's the tour. Keep the [cheat sheet](./cheat-sheet.md) at hand, and look up any shape in [Shapes](../shapes/index.md).
