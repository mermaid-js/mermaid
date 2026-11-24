---
description: 'Draw UML component diagrams: components, interfaces, ports, packages, and the relationships between them.'
---

# Component diagrams (v<MERMAID_RELEASE_VERSION>+)

```warning
Component diagrams are in beta. Diagrams start with the `component-beta` keyword, and the syntax may still change in a backwards-incompatible way before it is declared stable.
```

Component diagrams show how a system is split into components, the interfaces those components provide or require, and how they are wired together. Start a diagram with the `component-beta` keyword. Put each statement on its own physical line.

```mermaid-example
component-beta
direction LR
component Web["Web shop"]
component Orders["Order service"] <<service>>
interface IOrders["Orders API"]
Web --( IOrders
Orders --() IOrders
```

Use `direction` with `TD`, `TB`, `BT`, `LR`, or `RL` to choose the layout direction.

## Components

A component is declared with `component <id>`, an optional `["label"]`, and an optional `<<stereotype>>`:

```mermaid-example
component-beta
component A
component B["Billing"]
component C["Ledger"] <<service>>
```

## Interfaces

An interface is declared the same way, with `interface <id>` and an optional `["label"]`. A component **provides** an interface with `--()`, and **requires** it with `--(`. When one component provides an interface that another requires, both relationships draw against the same interface node, which is what produces the UML ball-and-socket assembly:

```mermaid-example
component-beta
component Orders
component Web
interface IOrders["Orders API"]
Orders --() IOrders
Web --( IOrders
```

## Actors

An actor is a person or an external system that uses the components. Declare it with `actor <id>`, an optional `["label"]` and an optional `<<stereotype>>`. An actor connects like a component: it can require an interface or link to a component directly.

```mermaid-example
component-beta
actor Customer
actor Bank <<external>>
component Shop
interface IShop["Shop UI"]
Shop --() IShop
Customer --( IShop
Shop --> Bank : pays via
```

## Ports

A port is declared with `port <id>` inside a component's body, and is referenced elsewhere as `<component>.<port>`:

```mermaid-example
component-beta
component Payments {
  port api
}
interface IPay
Payments.api --() IPay
```

## Packages and nesting

`package <id> { ... }` groups components and interfaces together, and a component's own `{ ... }` body can nest further components:

```mermaid-example
component-beta
package Backend {
  component Payments {
    port api
  }
  component Ledger
}
Payments ..> Ledger : writes to
```

## Relationships

- `A --() I` -- `A` provides interface `I` (lollipop)
- `A --( I` -- `A` requires interface `I` (socket)
- `A ..> B` -- dependency (dotted arrow)
- `A --> B` -- association (solid arrow)
- `A -- B` -- a plain link without an arrowhead

Any relationship may carry a `: label`:

```mermaid-example
component-beta
component Orders
component Ledger
Orders ..> Ledger : writes to
```

## Notes

```mermaid-example
component-beta
component Orders
note for Orders "handles checkout"
```

## Styling

`classDef`, `class`, and `style` work the same way they do in flowchart diagrams:

```mermaid-example
component-beta
component Orders
classDef hot fill:#f96,stroke:#333
class Orders hot
```

## Accessibility

Use `title`, `accTitle`, and `accDescr` to give the diagram a title and a description for assistive technology:

```mermaid-example
component-beta
title Shop architecture
accTitle: Shop architecture
accDescr: Components of the shop, their interfaces, and how they connect.
component Web
component Orders
Web --> Orders
```

## Configuration

| Parameter      | Description                               | Default |
| -------------- | ----------------------------------------- | ------- |
| wrappingWidth  | Label wrapping width, in pixels           | 150     |
| minNodeWidth   | Minimum component width, in pixels        | 80      |
| nodeSpacing    | Spacing between nodes on the same level   | 50      |
| rankSpacing    | Spacing between nodes on different levels | 50      |
| diagramPadding | Padding around the entire diagram         | 20      |

<!-- cspell:ignore Payments -->
