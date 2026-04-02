# Value Stream Map (v<MERMAID_RELEASE_VERSION>+)

## Introduction

A Value Stream Map (VSM) is a lean management tool used to visualize and analyze the flow of materials and information required to bring a product or service to a customer. It helps identify waste, bottlenecks, and opportunities for improvement.

## Usage

VSM diagrams are useful for process improvement teams, lean practitioners, and anyone looking to document and optimize workflows. They work well for both manufacturing shop floors and office/knowledge work environments.

## Syntax

A VSM diagram starts with the `vsm` keyword, followed by an optional flow line, step definitions, queues, and an optional summary.

```md
vsm
supplier "Name" >> step1 >> step2 >> customer "Name"

    step1 "Step Label"
        cycletime 1h
        push

    queue 3d

    step2 "Step Label"
        cycletime 30m
        pull
```

## Examples

```mermaid-example
vsm
    title Widget Production

    supplier "Steel Co" >> stamping >> welding >> assembly >> customer "Customer"

    stamping "Stamping"
        cycletime 1s
        changeover 1h
        push

    queue 3d

    welding "Welding"
        cycletime 38s
        changeover 10m
        push

    queue 2d

    assembly "Assembly"
        cycletime 62s
        pull

    queue 1d

    summary all
```

```mermaid-example
vsm
    title Expense Report Process

    from "Start" >> review >> digitize >> fill >> submit >> to "Accounting"

    review "Review Receipts"
        cycletime 1m-5m
        push

    queue 0m

    digitize "Digitize Receipts"
        cycletime 1m-10m
        push

    queue 0m

    fill "Complete Expense Form"
        cycletime 10m-15m

    queue 0m

    submit "Send"
        cycletime 1m-2m

    summary all
```

## Details of Syntax

### Title

`title`: An optional title rendered at the top center of the diagram.

```
vsm
    title My Value Stream
    ...
```

### Flow Line

The flow line provides a visual overview of the entire value stream. It connects endpoints and process steps with `>>` arrows.

```
vsm
    supplier "Vendor" >> step1 >> step2 >> customer "Client"
```

### Endpoints

Endpoints represent the start and end of the value stream. Two pairs of keywords are available and can be used interchangeably:

- `supplier` / `customer` - Use when modeling a traditional supply chain
- `from` / `to` - Use as a generic alternative for any flow

```
vsm
    supplier "Steel Co" >> step1 >> customer "End User"

vsm
    from "Design" >> step1 >> to "Production"
```

### Steps

Steps represent process activities. Each step has an ID (used in the flow line) and a quoted label (displayed in the box).

```
vsm
    step1 "Step Label"
        cycletime 5m
        changeover 30m
        push
```

Available step attributes:

| Attribute       | Format            | Description                        |
| --------------- | ----------------- | ---------------------------------- |
| `cycletime`     | duration or range | Time to process one unit           |
| `changeover`    | duration or range | Time to switch between products    |
| `uptime`        | percentage        | Percentage of time equipment is up |
| `batch`         | number            | Units processed per batch          |
| `push` / `pull` | keyword           | Flow type for this step            |

### Durations

Durations can be a single value or a range. Both sides of a range must include the unit. Values must be whole integers (e.g., `30m` not `0.5h`).

Supported units: `s` (seconds), `m` (minutes), `h` (hours), `d` (days), `w` (weeks).

```
cycletime 1h
cycletime 1h-1d
changeover 30m-2h
```

### Queues

Queues represent wait time between steps. Place them between step definitions.

```
queue 3d
queue 2w-3w
```

### Summary

The `summary` block controls which calculated metrics are displayed at the bottom of the diagram. If omitted, no summary is rendered.

Use `summary all` to show everything, or list specific items:

```
summary all

summary
    leadtime
    processtime
    waste
    efficiency
```

| Item          | Description                                         |
| ------------- | --------------------------------------------------- |
| `leadtime`    | Total time from start to finish (processing + wait) |
| `processtime` | Total time spent actively processing                |
| `waste`       | Total time spent waiting in queues                  |
| `efficiency`  | Processing time as a percentage of lead time        |

When durations use ranges, summary values display best-case and worst-case calculations.

### Comments

Comments use the standard Mermaid `%%` syntax.

```
vsm
    %% This is a comment
    from "Start" >> step1 >> to "End"
```

### Accessibility

Standard Mermaid accessibility attributes are supported:

```
vsm
    title My VSM
    accTitle: Value stream map of widget production
    accDescr: Shows the flow from raw materials to finished product
    ...
```

<!--- cspell:ignore cycletime processtime leadtime changeover --->
