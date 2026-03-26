# Use Case Diagrams

> A Use Case Diagram is a UML diagram that shows the interactions between actors and a system, capturing functional requirements visually.

Mermaid can render use case diagrams.
```mermaid-example
usecaseDiagram
    actor "Customer" as C
    system "Shop System" {
        usecase "Browse Products" as BP
        usecase "Checkout" as CO
        usecase "Login" as LG
    }
    C --> BP; CO
    include: CO-->LG
```

## Syntax

### Actors

Actors represent external entities (users or systems) that interact with the system. Define them with the `actor` keyword.
```mermaid-example
usecaseDiagram
    actor "Customer" as C
    actor "Admin" as A
    system "App" {
        usecase "Login" as L
    }
    C --> L
    A --> L
```

### Use Cases

Use cases represent system functions. They are rendered as ellipses and must be declared inside a `system {}` boundary or inferred from connections.
```mermaid-example
usecaseDiagram
    actor "User" as U
    system "App" {
        usecase "Login" as L
        usecase "Dashboard" as D
    }
    U --> L; D
```

### System Boundary

The system boundary groups related use cases inside a labeled rectangle.
```mermaid-example
usecaseDiagram
    actor "User" as U
    system "Banking App" {
        usecase "View Balance" as VB
        usecase "Transfer Funds" as TF
    }
    U --> VB; TF
```

### External Systems

External systems are entities outside the main system boundary, rendered as rectangles. Use the `external` keyword.
```mermaid-example
usecaseDiagram
    actor "Customer" as C
    external "Payment API" as PAY
    system "Shop" {
        usecase "Checkout" as CO
    }
    C --> CO
    dependency: CO-->PAY
```

### Notes

Notes attach additional information to elements. Use `anchor` to link a note to an element.
```mermaid-example
usecaseDiagram
    actor "User" as U
    system "App" {
        usecase "Login" as L
    }
    note "Requires 2FA" as N1
    U --> L
    anchor: N1-->L
```

### Collaborations

Collaborations represent a set of roles and their connectors that define behavior. They are rendered as dashed ellipses.
```mermaid-example
usecaseDiagram
    actor "User" as U
    collaboration "Auth Flow" as AF
    system "App" {
        usecase "Login" as L
    }
    U --> L
    dependency: AF-->L
```

## Relationship Types

Use case diagrams support 9 relationship types.

### Association (`-->`)

The default relationship between an actor and a use case.
```mermaid-example
usecaseDiagram
    actor "User" as U
    system "App" {
        usecase "Login" as L
        usecase "Dashboard" as D
    }
    U --> L; D
```

### Include

A use case that is always included as part of another. Rendered as a dashed arrow with `<<include>>` label.
```mermaid-example
usecaseDiagram
    actor "User" as U
    system "App" {
        usecase "Checkout" as CO
        usecase "Login" as L
    }
    U --> CO
    include: CO-->L
```

### Extend

A use case that conditionally extends another. Rendered as a dashed arrow with `<<extend>>` label.
```mermaid-example
usecaseDiagram
    actor "User" as U
    system "App" {
        usecase "Browse" as B
        usecase "Add to Cart" as AC
    }
    U --> B
    extend: B-->AC
```

### Generalization

Inheritance between two actors or two use cases. Rendered with a hollow arrowhead.
```mermaid-example
usecaseDiagram
    actor "User" as U
    actor "Admin" as A
    system "App" {
        usecase "Login" as L
    }
    U --> L
    A --> L
    generalization: A-->U
```

### Dependency

A dashed arrow showing that one element depends on another.
```mermaid-example
usecaseDiagram
    external "Payment API" as PAY
    system "Shop" {
        usecase "Process Payment" as PP
    }
    dependency: PP-->PAY
```

### Realization

Shows that a use case realizes (implements) another. Rendered as a dashed arrow with a hollow arrowhead.
```mermaid-example
usecaseDiagram
    system "App" {
        usecase "Login" as L
        usecase "Biometric Login" as BL
    }
    realization: BL-->L
```

### Anchor

Links a note to an element. The note must be the source.
```mermaid-example
usecaseDiagram
    actor "User" as U
    system "App" {
        usecase "Login" as L
    }
    note "Requires PIN" as N1
    U --> L
    anchor: N1-->L
```

### Constraint

Connects notes to other elements or elements to each other with a dotted constraint line. The only relationship that can connect two notes.
```mermaid-example
usecaseDiagram
    system "App" {
        usecase "Login" as L
    }
    note "Note A" as NA
    note "Note B" as NB
    anchor: NA-->L
    constraint: NA-->NB
```

### Containment

Shows that one use case physically contains another. Rendered with a circle-cross marker at the start.
```mermaid-example
usecaseDiagram
    system "App" {
        usecase "Checkout" as CO
        usecase "Internal Log" as IL
    }
    containment: CO-->IL
```

## Multiple Relationships Example
```mermaid-example
usecaseDiagram
    actor "User" as U
    actor "Admin" as ADM
    external "Payment API" as PAY
    system "All Relationship Types" {
        usecase "Login" as LG
        usecase "Pay" as PY
        usecase "Place Order" as PO
        usecase "Refund" as RF
        usecase "Audit Log" as AL
        usecase "Internal Log" as IL
    }
    note "Requires Auth" as N1
    U --> LG; PO
    ADM --> AL; RF
    include: PO-->LG; PO-->PY
    extend: RF-->PO
    generalization: ADM-->U
    dependency: PY-->PAY
    realization: AL-->LG
    anchor: N1-->LG
    constraint: IL-->PY
    containment: PO-->IL
```

## Theming

Use case diagrams respect Mermaid's standard theme variables.
```mermaid-example
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#ffffce','secondaryColor':'#ffffff','primaryBorderColor':'#000000','lineColor':'#000000'}}}%%
usecaseDiagram
    actor "User" as U
    system "App" {
        usecase "Login" as L
        usecase "Dashboard" as D
    }
    U --> L; D
    include: D-->L
```

### Available theme variables

| Variable             | Description                        |
| -------------------- | ---------------------------------- |
| `primaryColor`       | Fill color for actors and use cases |
| `primaryBorderColor` | Border color for all elements       |
| `primaryTextColor`   | Text color                          |
| `secondaryColor`     | System boundary fill color          |
| `tertiaryColor`      | Note fill color                     |
| `lineColor`          | Connector and arrow color           |