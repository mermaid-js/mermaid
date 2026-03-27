# Wardley Map Diagram

> A Wardley Map visualizes a value chain on two axes: **evolution** (x-axis, from Genesis to Commodity) and **visibility** (y-axis, from infrastructure at 0 to user-facing at 1). Created by Simon Wardley, these maps help teams reason about build-vs-buy decisions, technology maturity, and strategic positioning.

## Comprehensive Example

```mermaid-example
wardleyMap
  title Tea Shop Strategy
  accTitle: Tea Shop Wardley Map
  accDescr: Strategic map for a tea shop showing components from customer to infrastructure

  anchor customer "Customer" [0.15, 0.95]
  component cup "Cup of Tea" [0.25, 0.85]
  component web "Online Ordering" [0.35, 0.78]
  component tea "Tea" [0.45, 0.65]
  component water "Hot Water" [0.6, 0.55]
  component kettle "Kettle" [0.7, 0.45] buy
  component power "Power" [0.85, 0.35]

  customer -> cup
  customer -> web
  cup -> tea
  cup -> water
  water -> kettle
  kettle -> power

  evolve web 0.62
  evolve kettle 0.82
```

## Basic Structure

Every diagram starts with the `wardleyMap` keyword. All other statements are indented below it.

```
wardleyMap
  title My Map
  accTitle: Accessible Title
  accDescr: A description for screen readers

  component id "Label" [x, y]
  id1 -> id2
```

**Coordinates** are normalized values between 0 and 1:

- **x** (evolution): 0 = Genesis, 1 = Commodity
- **y** (visibility): 0 = infrastructure/invisible, 1 = user-facing

## Components

### Standard Component

```
component id "Label" [x, y]
```

Rendered as a filled circle. The `id` is a unique alphanumeric identifier used in edges and other references; the `"Label"` is what appears on the map.

### Anchor (User Need)

```
anchor id "Label" [x, y]
```

Rendered as a diamond. Use anchors for user needs or entry points at the top of the value chain.

### Market Component

```
component id "Label" [x, y] market
```

Rendered as a double circle, representing a marketplace or exchange.

### Ecosystem Component

```
component id "Label" [x, y] ecosystem
```

Rendered as a triple circle, representing an ecosystem or platform play.

### Component Modifiers

Modifiers appear after the coordinates (and after an optional component type):

| Modifier            | Syntax                                       | Meaning                                               |
| ------------------- | -------------------------------------------- | ----------------------------------------------------- |
| Sourcing: build     | `component id "Label" [x, y] build`          | Built in-house                                        |
| Sourcing: buy       | `component id "Label" [x, y] buy`            | Purchased off-the-shelf                               |
| Sourcing: outsource | `component id "Label" [x, y] outsource`      | Outsourced to a third party                           |
| Inertia             | `component id "Label" [x, y] inertia`        | Resistance to change (shown as a barrier marker)      |
| Label offset        | `component id "Label" [x, y] label [dx, dy]` | Manually position the label relative to the component |

Modifiers can be combined:

```
component legacy "Legacy DB" [0.7, 0.4] buy inertia label [-20, 10]
```

## Edges

Edges connect components by their IDs.

| Type       | Syntax   | Appearance            |
| ---------- | -------- | --------------------- |
| Dependency | `a -> b` | Solid line with arrow |
| Flow       | `a +> b` | Dashed blue line      |
| Constraint | `a => b` | Thick line            |

### Edge Annotations

Dependency and flow edges support inline annotations:

```
a -> b ; "data sync"
a +> b ; "event stream"
```

The annotation text appears alongside the edge.

## Evolution

The `evolve` keyword draws a dashed arrow from a component's current position to a new x-position, indicating planned movement along the evolution axis.

```
evolve id 0.8
```

To rename the component at its evolved position:

```
evolve id -> newId 0.8
```

```mermaid-example
wardleyMap
  component platform "Platform" [0.35, 0.7]
  component crm "CRM" [0.45, 0.55]

  platform -> crm

  evolve platform 0.6
  evolve crm -> crmSaas 0.85
```

## Pipelines

A pipeline groups related components along the evolution axis at a fixed visibility level. It renders as a horizontal bar spanning from `startX` to `endX` at vertical position `y`, with child components positioned inside it.

```
pipeline id "Label" [y, startX, endX] {
  childId "Child Label" [x]
  anotherId "Another" [x]
}
```

- `y` is the visibility position of the pipeline.
- `startX` and `endX` define the evolution range.
- Each child has its own `id`, `"Label"`, and a single `[x]` coordinate (evolution position within the pipeline).

```mermaid-example
wardleyMap
  component user "User" [0.2, 0.95]
  pipeline compute "Compute" [0.5, 0.3, 0.9] {
    bare "Bare Metal" [0.35]
    vm "VMs" [0.55]
    container "Containers" [0.72]
    serverless "Serverless" [0.88]
  }

  user -> compute
```

## Notes and Annotations

### Notes

Place freestanding text on the map:

```
note "Important context here" [x, y]
```

### Numbered Annotations

Attach a numbered callout to a component:

```
annotation 1 "This needs attention" targetId
```

The number is rendered as a circled label pointing at the target component.

## Areas and Overlays

Shade rectangular regions of the map to highlight strategic zones. Each area is defined by two corner coordinates `[x1, y1, x2, y2]`.

| Area type      | Typical meaning                         |
| -------------- | --------------------------------------- |
| `pioneers`     | Exploring genesis/novel space           |
| `settlers`     | Industrializing custom-built components |
| `townplanners` | Optimizing commodity/utility components |
| `interest`     | General area of interest or focus       |

```
pioneers "Exploration" [0.0, 0.0, 0.25, 1.0]
settlers "Industrialization" [0.25, 0.0, 0.5, 1.0]
townplanners "Optimization" [0.5, 0.0, 1.0, 1.0]
```

The label is optional:

```
interest [0.3, 0.6, 0.7, 0.9]
```

## Submaps

Reference another Wardley Map as a component on the current map:

```
submap id "Label" [x, y] ref "other-map-name"
```

The submap renders as a distinct component shape and carries a reference string that identifies the linked map.

## Accelerators

Mark a component as being accelerated or decelerated in its evolution:

```
accelerator targetId
deaccelerator targetId
```

These add visual indicators to the target component showing the direction and force of evolutionary change.

## Custom Axis Labels

Override the default axis labels:

```
xAxis "Genesis", "Custom", "Product (+rental)", "Commodity (+utility)"
yAxis "Invisible", "Visible"
```

The x-axis accepts up to four comma-separated labels for the evolution stages. The y-axis accepts two labels for the visibility endpoints.

## Coordinates Reference

| Axis           | Value       | Meaning                                       |
| -------------- | ----------- | --------------------------------------------- |
| x (evolution)  | 0.00 - 0.25 | Genesis -- novel, uncertain, rapidly changing |
| x (evolution)  | 0.25 - 0.50 | Custom Built -- understood but still bespoke  |
| x (evolution)  | 0.50 - 0.75 | Product -- standardized, off-the-shelf        |
| x (evolution)  | 0.75 - 1.00 | Commodity -- ubiquitous, utility, stable      |
| y (visibility) | 0.0         | Infrastructure / invisible to the user        |
| y (visibility) | 0.5         | Supporting services / middleware              |
| y (visibility) | 1.0         | User-facing / directly visible                |

## Full Syntax Reference

| Feature                | Syntax                                                  |
| ---------------------- | ------------------------------------------------------- |
| Diagram start          | `wardleyMap`                                            |
| Title                  | `title My Map Title`                                    |
| Accessible title       | `accTitle: text`                                        |
| Accessible description | `accDescr: text`                                        |
| Standard component     | `component id "Label" [x, y]`                           |
| Market component       | `component id "Label" [x, y] market`                    |
| Ecosystem component    | `component id "Label" [x, y] ecosystem`                 |
| Anchor (user need)     | `anchor id "Label" [x, y]`                              |
| Sourcing strategy      | append `build`, `buy`, or `outsource` after coordinates |
| Inertia                | append `inertia` after coordinates                      |
| Label offset           | append `label [dx, dy]` after coordinates               |
| Dependency edge        | `a -> b`                                                |
| Flow edge              | `a +> b`                                                |
| Constraint edge        | `a => b`                                                |
| Edge annotation        | `a -> b ; "text"` or `a +> b ; "text"`                  |
| Evolve                 | `evolve id 0.8`                                         |
| Evolve with rename     | `evolve id -> newId 0.8`                                |
| Pipeline               | `pipeline id "Label" [y, startX, endX] { ... }`         |
| Pipeline child         | `childId "Label" [x]` (inside pipeline block)           |
| Note                   | `note "text" [x, y]`                                    |
| Annotation             | `annotation 1 "text" targetId`                          |
| Pioneers area          | `pioneers "Label" [x1, y1, x2, y2]`                     |
| Settlers area          | `settlers "Label" [x1, y1, x2, y2]`                     |
| Townplanners area      | `townplanners "Label" [x1, y1, x2, y2]`                 |
| Interest area          | `interest "Label" [x1, y1, x2, y2]`                     |
| Submap                 | `submap id "Label" [x, y] ref "reference"`              |
| Accelerator            | `accelerator targetId`                                  |
| Deaccelerator          | `deaccelerator targetId`                                |
| Custom x-axis          | `xAxis "Label1", "Label2", "Label3", "Label4"`          |
| Custom y-axis          | `yAxis "Bottom", "Top"`                                 |

## Kitchen Sink Example

```mermaid-example
wardleyMap
  title Platform Strategy 2026
  accTitle: Platform Wardley Map
  accDescr: Full-featured example showing all major Wardley Map constructs

  xAxis "Genesis", "Custom Built", "Product", "Commodity"
  yAxis "Invisible", "Visible"

  pioneers "Explore" [0.0, 0.0, 0.25, 1.0]
  settlers "Build" [0.25, 0.0, 0.55, 1.0]

  anchor user "End User" [0.15, 0.95]
  component app "Web App" [0.4, 0.85]
  component api "API Layer" [0.5, 0.72] build
  component ml "ML Models" [0.2, 0.6] ecosystem inertia
  component db "Database" [0.75, 0.45] buy
  component infra "Cloud Infra" [0.9, 0.3]
  component monitor "Monitoring" [0.6, 0.38] outsource label [-15, 8]

  user -> app
  app -> api
  api -> ml
  api -> db
  api +> monitor ; "metrics"
  db => infra

  evolve app 0.62
  evolve ml -> mlv2 0.45

  pipeline compute "Compute" [0.5, 0.3, 0.92] {
    vm "VMs" [0.55]
    k8s "Kubernetes" [0.72]
    lambda "Serverless" [0.88]
  }

  note "Migrate by Q3" [0.7, 0.58]
  annotation 1 "Key risk" ml

  submap billing "Billing System" [0.65, 0.65] ref "billing-map"

  accelerator api
  deaccelerator ml
```
