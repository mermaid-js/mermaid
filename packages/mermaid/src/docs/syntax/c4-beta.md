# C4 Diagrams (beta) (v<MERMAID_RELEASE_VERSION>+)

> A C4 diagram describes a software system at different zoom levels: System Context, Container, Component, Dynamic and Deployment, following the [C4 model](https://c4model.com/).

The `c4-beta` diagram type is a new, experimental take on C4 diagrams with a compact, Structurizr-inspired syntax. It replaces the PlantUML-compatible syntax of the [legacy C4 diagram](c4.md) and is rendered through the unified layout pipeline.

```warning
This is an experimental diagram. The syntax may change in future releases.
```

## Example

```mermaid-example
c4-beta context
title Internet Banking System - System Context

person customer "Personal Banking Customer" "A customer of the bank."
system banking "Internet Banking System" "Allows customers to view accounts and make payments."
external system mainframe "Mainframe Banking System" "Stores core banking information."
external system email "E-mail System" "The internal e-mail system."

customer --> banking : "Views accounts using"
banking --> mainframe : "Gets account information from" "XML/HTTPS"
banking --> email : "Sends e-mail using" "SMTP"
email --> customer : "Sends e-mails to"
```

## Syntax

A diagram starts with the `c4-beta` keyword followed by an optional diagram kind:

```
c4-beta context | container | component | dynamic | deployment
```

The kind defaults to `context`. The kind is advisory: every element renders in every kind, but mermaid logs a warning when an element is unexpected for the declared kind (for example a `component` in a `context` diagram).

### Elements

```
(external)? person|system|container|component|group|node <id> "Name" ("Description" ("Technology")?)? (:::tag)*
```

- `external` renders the element in grey, marking it as outside the system under discussion.
- `"Technology"` can only be given when a `"Description"` is present (use `""` for an empty description).
- `person` elements render with the classic C4 person notation (head and body).

```mermaid-example
c4-beta container
person customer "Customer" "A customer of the bank."
container spa "Single-Page Application" "Provides banking functionality." "JavaScript/Angular"
external system mainframe "Mainframe Banking System"
```

### Nesting and boundaries

Any element can contain other elements using braces. An element with children is rendered as a boundary:

```mermaid-example
c4-beta container
title Internet Banking System - Containers

person customer "Personal Banking Customer"
system banking "Internet Banking System" {
    container spa "Single-Page Application" "Provides banking functionality." "JavaScript/Angular"
    container api "API Application" "Provides a JSON/HTTPS API." "Java/Spring MVC"
    container db "Database" "Stores user credentials." "Oracle 12c"
}

customer --> spa : "Uses" "HTTPS"
spa --> api : "Makes API calls to" "JSON/HTTPS"
api --> db : "Reads from and writes to" "SQL/TCP"
```

### Relationships

```
(N:)? <sourceId> -->|<--|<--> <targetId> (: "Description" ("Technology")?)? (:::tag)*
```

```mermaid-example
c4-beta context
system core "Core System"
external system partner "Partner System"

core <--> partner : "Syncs with" "JSON/HTTPS"
```

### Dynamic diagrams

In a `dynamic` diagram, relationships are numbered in declaration order and the step number is rendered as a label prefix. An explicit `N:` prefix overrides the counter, and numbering continues from it:

```mermaid-example
c4-beta dynamic
title Internet Banking System - Sign In

container spa "Single-Page Application" "" "JavaScript/Angular"
container api "API Application" "" "Java/Spring MVC"
container db "Database" "" "Oracle 12c"

spa --> api : "Submits credentials to" "JSON/HTTPS"
api --> db : "Calls select * from users" "SQL/TCP"
db --> api : "Returns user data to"
4: api --> spa : "Sends back an authentication token to"
```

### Deployment diagrams

In a `deployment` diagram, `node` elements describe infrastructure. Nodes always render as boundaries, even without children, labeled `Name [Node: Technology]`, and can be nested arbitrarily:

```mermaid-example
c4-beta deployment
title Internet Banking System - Deployment

node aws "Amazon Web Services" "" "AWS" {
    node region "US-East-1" "" "AWS Region" {
        node ecs "ECS Cluster" "" "AWS ECS" {
            container api "API Application" "Provides a JSON/HTTPS API." "Java/Spring MVC"
        }
        node rds "Database Server" "" "AWS RDS" {
            container db "Database" "Stores user credentials." "Oracle 12c"
        }
    }
}

api --> db : "Reads from and writes to" "SQL/TCP"
```

Relationships should connect leaf elements; a relationship between two boundaries is rendered, but mermaid logs a warning.

### Tags and styling

Elements and relationships accept `:::tag` markers. A `style` statement assigns visual styles to every element or relationship carrying the tag:

```
style <tag> key:value (, key:value)*
```

Supported keys:

| Key      | Applies to                 | Values                         |
| -------- | -------------------------- | ------------------------------ |
| `fill`   | elements                   | hex color (`#rgb` / `#rrggbb`) |
| `stroke` | elements and relationships | hex color                      |
| `color`  | elements and relationships | hex color (text color)         |
| `shape`  | elements                   | `cylinder`                     |
| `line`   | relationships              | `solid`, `dashed`, `dotted`    |

Tag styles are applied after the built-in element colors, so they override them. Each tag also adds a `c4-tag-<name>` CSS class for theming with `classDefs` or custom CSS.

```mermaid-example
c4-beta container
style database shape:cylinder
style async line:dashed
style team-a fill:#1f2937, stroke:#111827

container api "API Application" "Provides a JSON/HTTPS API." "Java/Spring MVC" :::team-a
container db "Database" "Stores user credentials." "Oracle 12c" :::database

api --> db : "Reads from and writes to" "SQL/TCP" :::async
```

### Direction

The layout direction can be set with `direction TB|BT|LR|RL` (default `TB`):

```mermaid-example
c4-beta context
direction LR

person user "User"
system core "Core System"

user --> core : "Uses"
```

### Title

A `title` line sets the diagram title:

```
title Internet Banking System - System Context
```
