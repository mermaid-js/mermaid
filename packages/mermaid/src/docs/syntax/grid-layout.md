# Grid Layout

## Introduction

Use `layout: grid` when you want deterministic row and column placement instead of a layout derived mainly from edge direction. You can place every item explicitly, constrain only a row or column, or let Mermaid fill the remaining cells automatically.

Grid layout supports flowchart, agentflow, state, class, entity relationship, requirement, use case, and mindmap diagrams. Flowchart and agentflow support inline `@{ ... }` placement metadata. All supported diagram types can use `config.grid.placements`.

## Enable the layout

```mermaid-example
---
config:
  layout: grid
---
flowchart TB
  A@{ row: 1, column: 1 } --> B@{ row: 1, column: 2 }
  B --> C@{ row: 2, column: 2 }
```

## Examples for other diagram types

The flowchart example above uses inline placement metadata. The following examples use automatic grid placement for the other supported diagram types.

### Agentflow

```mermaid-example
---
config:
  layout: grid
---
agentflow-beta
  request["Receive request"]@{ shape: input, row: 1, column: 1 }
  plan["Plan work"]@{ shape: task, row: 1, column: 2  }
  run["Run tool"]@{ shape: tool, row: 1, column: 3  }
  publish["Publish result"]@{ shape: action, row: 1, column: 4  }

  request --> plan --> run --> publish
```

### State diagram

```mermaid-example
---
config:
  layout: grid
  grid:
    columnGap: 300
    placements:
      Draft: { row: 1, column: 1 }
      Review: { row: 1, column: 2 }
      Published: { row: 2, column: 2 }
---
stateDiagram-v2

  Draft --> Review
  Review --> Published
  Review --> Draft : changes requested
```

### Class diagram

```mermaid-example
---
config:
  layout: grid
  grid:
   columnGap: 100
   rowGap: 100
   placements:
    Customer: { row: 1, column: 1 }
    Order: {row: 1, column: 2}
    Payment: {row: 2, column: 2}
    Shipment: {row: 1, column: 3}
---
classDiagram
  Customer --> Order : places
  Customer --> Payment : makes
  Order --> Payment : pays with
  Order --> Shipment : creates
```

### Entity relationship diagram

```mermaid-example
---
config:
  layout: grid
  grid:
   columnGap: 100
   rowGap: 100
   placements:
    CUSTOMER : { row: 1, column: 1 }
    ORDER: {row: 1, column: 2}
    PAYMENT: {row: 2, column: 2}
    LINE_ITEM: {row: 1, column: 3}
---
erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE_ITEM : contains
  ORDER ||--o| PAYMENT : has
```

### Requirement diagram

```mermaid-example
---
config:
  layout: grid
---
requirementDiagram
  requirement checkout {
    id: 1
    text: "Customers can complete an order"
    risk: high
    verifymethod: test
  }

  element storefront {
    type: service
    docref: "checkout"
  }

  storefront - satisfies -> checkout
```

### Use case diagram

```mermaid-example
---
config:
  layout: grid
  grid:
    placements:
      Customer: {row: 2, column: 1}
      Browse: {row: 1, column: 2}
      Checkout: {row: 2, column: 2}
      Track: {row: 3, column: 2}
---
usecase-beta
  actor Customer
  Browse("Browse products")
  Checkout("Complete checkout")
  Track("Track order")

  Customer --> Browse
  Customer --> Checkout
  Customer --> Track
```

### Mindmap

```mermaid-example
---
config:
  layout: grid
  grid:
    placements:
      Release: {row: 2, column: 2}
      Plan: {row: 1, column: 2}
      Build: {row: 2, column: 2}
      Test: {row: 3, column: 2}
      Deploy: {row: 3, column: 2}
---
mindmap
  root((Release))
    Plan
    Build
      Test
    Deploy
```

## Placement metadata

Flowchart and agentflow nodes and expanded subgraphs accept four grid-specific metadata keys:

- `row`
- `column`
- `horizontalAlign`
- `verticalAlign`

Coordinates are:

- positive integers starting at `1`
- local to the direct parent group
- sparse but collapsed (rows `1` and `100` render as adjacent occupied tracks)

When inline metadata and `config.grid.placements` both set the same property, inline metadata takes precedence.

```mermaid-example
---
config:
  layout: grid
  grid:
    rowGap: 32
    columnGap: 40
    cellGap: 12
---
flowchart TB
  A@{ row: 1, column: 1 }
  B@{ row: 2, column: 1 }
  C@{ row: 2, column: 2, horizontalAlign: right }
  A --> B
  B --> C
```

## Placement maps

All supported diagram types can use the global placement map:

```mermaid-example
---
config:
  layout: grid
  grid:
    placements:
      A: { row: 1, column: 1 }
      B: { row: 2, column: 1 }
      C: { row: 2, column: 2 }
---
flowchart TB
  A --> B
  B --> C
```

The placement-map keys are the node ids produced by the diagram type. Flowchart and agentflow ids are usually the ids you author directly.

Placements for ids that are not present in the diagram are ignored with a console warning. This
allows a shared or generated placement map to contain entries for optional nodes.

## Automatic placement

If either coordinate is omitted, Mermaid fills it deterministically:

- explicit `(row, column)` cells are reserved first
- `row` only picks the first free column in that row
- `column` only picks the first free row in that column
- when both are omitted, Mermaid scans row-major using `grid.columns` when it is greater than `0`; otherwise, it uses `ceil(sqrt(itemCount))`

Automatic placement runs independently within each group. Two or more direct siblings with the same explicit `(row, column)` share one cell as a vertical stack in declaration order.

## Alignment and stacking

- `horizontalAlign`: `left`, `center`, `right`
- `verticalAlign`: `top`, `center`, `bottom`

Horizontal alignment applies to each item. Vertical alignment applies to the whole stack in an explicitly shared cell. Items in the same cell must resolve to the same vertical alignment; otherwise, Mermaid reports `GRID_CELL_ALIGNMENT_CONFLICT`.

```mermaid-example
---
config:
  layout: grid
  grid:
    cellGap: 16
---
flowchart TB
  A["Alpha"]@{ row: 1, column: 1, horizontalAlign: left, verticalAlign: bottom }
  B["Beta"]@{ row: 1, column: 1, horizontalAlign: right, verticalAlign: bottom }
  A --> B
```

## Nested groups

Groups are laid out recursively from the inside out. Child coordinates are always local to the immediate parent group; diagram direction (`TB`, `BT`, `LR`, `RL`) does not rotate or mirror the authored grid.

```mermaid-example
---
config:
  layout: grid
  grid:
    placements:
      A: { row: 1, column: 1 }
      B: { row: 2, column: 1 }
      C: { row: 1, column: 2 }
      G: { row: 1, column: 1 }
---
flowchart TB
  subgraph G["Group One"]
    A["Alpha"]
    B["Beta"]
  end
  C["Peer"]
  A --> C
  B --> C
```

## Configuration

| Setting            | Default   | Purpose                                                             |
| ------------------ | --------- | ------------------------------------------------------------------- |
| `placements`       | `{}`      | Maps node ids to placement values.                                  |
| `columns`          | `0`       | Sets the auto-placement column count. `0` selects it automatically. |
| `rowGap`           | `50`      | Sets the gap between occupied rows.                                 |
| `columnGap`        | `50`      | Sets the gap between occupied columns.                              |
| `cellGap`          | `20`      | Sets the gap between items stacked in one cell.                     |
| `containerPadding` | `20`      | Sets the minimum padding inside groups.                             |
| `titleGap`         | `8`       | Sets the clearance between a group title and its child grid.        |
| `horizontalAlign`  | `center`  | Sets the default horizontal alignment within a cell.                |
| `verticalAlign`    | `center`  | Sets the default vertical alignment for a cell stack.               |
| `curve`            | `rounded` | Sets the edge rendering curve.                                      |
| `edgeCornerRadius` | `5`       | Sets the corner radius for `rounded` edges.                         |

For accepted values and validation rules, see the [grid layout configuration reference](/config/schema-docs/config-defs-grid-layout-config.html).

## Edge routing

Grid layout calculates edge routes after positioning the nodes and groups. The calculated route:

- uses horizontal and vertical segments
- avoids measured nodes, unrelated groups, and group titles
- may pass through unused space within a grid cell
- crosses group boundaries when connecting nodes in different groups
- attempts to keep parallel and reverse edges on separate ports and lanes

In dense nested diagrams, parallel hierarchy edges can share part of an internal corridor while keeping distinct endpoint ports. If no valid route exists around node or group geometry, Mermaid reports `GRID_ROUTE_NOT_FOUND`.

Edge labels are placed after the initial routes are calculated. Mermaid attempts to reroute edges around those labels. If it cannot find a safe bounded detour, an edge can pass through another edge's label rather than failing the whole diagram.

## Edge curves

Grid edges use `rounded` rendering by default. Set `grid.curve` to any Mermaid
flowchart curve style, including `basis`, `cardinal`, `catmullRom`, `step`, or
`rounded`.

`edgeCornerRadius` controls the corner radius for `rounded` edges. It is ignored
by other curve styles, and each corner is automatically limited by the adjacent
segment lengths.

```mermaid-example
---
config:
  layout: grid
  grid:
    curve: rounded
    edgeCornerRadius: 10
---
flowchart TB
  A@{ row: 1, column: 1 } --> B@{ row: 2, column: 2 }
```

```mermaid-example
---
config:
  layout: grid
  grid:
    curve: linear
---
flowchart TB
  A@{ row: 1, column: 1 } --> B@{ row: 2, column: 2 }
```

`linear` and `rounded` preserve the calculated route corridor. Other curves interpolate between the obstacle-aware route points and can move outside that corridor. The interpolated curve is not revalidated against obstacles.

## Current limits

Grid layout does **not** support:

- row or column spanning
- in-cell layouts other than vertical stacking; use a nested subgraph to create a separate grid within a cell
- track-level row/column alignment declarations
- manual absolute coordinates or manual edge waypoints
