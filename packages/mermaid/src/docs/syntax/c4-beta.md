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
softwareSystem banking "Internet Banking System" "Allows customers to view accounts and make payments."
softwareSystem mainframe "Mainframe Banking System" "Stores core banking information." :::external
softwareSystem email "E-mail System" "The internal e-mail system." :::external

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
person|softwareSystem|container|component|group|deploymentNode|infrastructureNode <id> "Name" ("Description" ("Technology")?)? (:::tag)*
```

- `:::external` is a built-in convention tag that marks an element as outside the system under discussion. It renders the element in grey by default; override the look with a `style external ...` statement (see [Tags and styling](#tags-and-styling)).
- `"Technology"` can only be given when a `"Description"` is present (use `""` for an empty description).
- `person` elements render with the classic C4 person notation (head and body).

```mermaid-example
c4-beta container
person customer "Customer" "A customer of the bank."
container spa "Single-Page Application" "Provides banking functionality." "JavaScript/Angular"
softwareSystem mainframe "Mainframe Banking System" :::external
```

### Nesting and boundaries

Any element can contain other elements using braces. An element with children is rendered as a boundary:

```mermaid-example
c4-beta container
title Internet Banking System - Containers

person customer "Personal Banking Customer"
softwareSystem banking "Internet Banking System" {
    container spa "Single-Page Application" "Provides banking functionality." "JavaScript/Angular"
    container api "API Application" "Provides a JSON/HTTPS API." "Java/Spring MVC"
    container db "Database" "Stores user credentials." "Oracle 12c"
}

customer --> spa : "Views account balances using" "HTTPS"
spa --> api : "Makes API calls to" "JSON/HTTPS"
api --> db : "Reads from and writes to" "SQL/TCP"
```

### Relationships

In the C4 model every line is a **unidirectional**, specifically-labelled relationship that captures intent and direction of the interaction. Prefer `-->` (and `<--` when you want to point the other way):

```
(N:)? <sourceId> --> <targetId> (: "Description" ("Technology")?)? (:::tag)*
(N:)? <sourceId> <-- <targetId> (: "Description" ("Technology")?)? (:::tag)*
```

```mermaid-example
c4-beta context
softwareSystem core "Core System"
softwareSystem partner "Partner System" :::external

core --> partner : "Pushes settlement records to" "JSON/HTTPS"
partner --> core : "Returns settlement confirmations to" "JSON/HTTPS"
```

Label each relationship with a specific verb phrase that explains _why_ the interaction exists ("Pushes settlement records to", "Reads customer profiles from"). Avoid bare labels such as "Uses": they describe a dependency, not an interaction, and make the diagram harder to read.

`<-->` is supported as a shorthand for two relationships drawn in both directions, but it is **discouraged**: a bidirectional arrow hides the two distinct interactions and their separate labels. Prefer two explicit unidirectional relationships instead:

```mermaid-example
c4-beta context
softwareSystem core "Core System"
softwareSystem partner "Partner System" :::external

core <--> partner : "Syncs with"
```

### Dynamic diagrams

In a `dynamic` diagram, relationships are numbered in declaration order and the step number is rendered as a label prefix. An explicit `N:` prefix overrides the counter, and numbering continues from it.

Repeating the same step number on consecutive relationships marks them as **parallel interactions** (v\<MERMAID_RELEASE_VERSION>+): they all render with that number, and auto-numbering resumes from the highest number used plus one. For example, steps `1`, `2:`, `2:` leave the next auto-numbered relationship as `3`:

```mermaid-example
c4-beta dynamic
title Internet Banking System - Sign In

container spa "Single-Page Application" "" "JavaScript/Angular"
container api "API Application" "" "Java/Spring MVC"
container db "Database" "" "Oracle 12c"

spa --> api : "Submits credentials to" "JSON/HTTPS"
2: api --> db : "Calls select * from users" "SQL/TCP"
2: api --> db : "Logs the attempt to" "SQL/TCP"
db --> api : "Returns user data to"
api --> spa : "Sends back an authentication token to"
```

### Deployment diagrams

In a `deployment` diagram, `deploymentNode` elements describe infrastructure. Deployment nodes always render as boundaries, even without children, labeled `Name [Deployment Node: Technology]`, and can be nested arbitrarily:

```mermaid-example
c4-beta deployment
title Internet Banking System - Deployment

deploymentNode aws "Amazon Web Services" "" "AWS" {
    deploymentNode region "US-East-1" "" "AWS Region" {
        deploymentNode ecs "ECS Cluster" "" "AWS ECS" {
            container api "API Application" "Provides a JSON/HTTPS API." "Java/Spring MVC"
        }
        deploymentNode rds "Database Server" "" "AWS RDS" {
            container db "Database" "Stores user credentials." "Oracle 12c"
        }
    }
}

api --> db : "Reads from and writes to" "SQL/TCP"
```

Relationships should connect leaf elements; a relationship between two boundaries is rendered, but mermaid logs a warning.

Use `infrastructureNode` for DNS, load balancers, firewalls, and other supporting infrastructure (v\<MERMAID_RELEASE_VERSION>+). Unlike a `deploymentNode`, an infrastructure node renders as a leaf box rather than a boundary, so it can sit inside a deployment node and act as a relationship endpoint:

```mermaid-example
c4-beta deployment
title Internet Banking System - Deployment

deploymentNode dc "Big Bank plc data center" "" "Ubuntu" {
    infrastructureNode lb "Load Balancer" "Routes traffic to web servers." "nginx"
    deploymentNode web "Web Server" "" "Ubuntu" {
        container app "Web Application" "Serves the SPA." "Java/Spring MVC"
    }
}

lb --> app : "Forwards requests to" "HTTPS"
```

A deployment node can declare how many instances are deployed with `instances "<count>"` (v\<MERMAID_RELEASE_VERSION>+). The count is rendered as an `xN` badge on the node and accepts a single number or a range such as `1..N`, `0..1` or `5..10`:

```mermaid-example
c4-beta deployment
title Internet Banking System - Deployment

deploymentNode dc "Big Bank plc data center" "" "Ubuntu" {
    deploymentNode web "bigbank-web" "" "Ubuntu" instances "4" {
        container app "Web Application" "Serves the SPA." "Java/Spring MVC"
    }
}
```

#### Worked example: a live deployment

Putting it together, here is the canonical C4 "Live" deployment of the Internet Banking System: the customer's devices, a data center with load-balanced web and API tiers (each a multi-instance `deploymentNode`), an `infrastructureNode` load balancer in front of them, and a primary database replicating to a failover:

```mermaid-example
c4-beta deployment
title Internet Banking System - Live Deployment

deploymentNode mobile "Customer's mobile device" "" "Apple iOS" {
    container mobileApp "Mobile App" "Provides banking features." "Xamarin"
}
deploymentNode computer "Customer's computer" "" "Microsoft Windows or Apple macOS" {
    deploymentNode browser "Web Browser" "" "Chrome, Firefox, Safari or Edge" {
        container spa "Single-Page App" "Provides banking features." "JavaScript/Angular"
    }
}
deploymentNode dc "Big Bank plc data center" "" "Big Bank plc" {
    infrastructureNode lb "Load Balancer" "Routes requests to the web and API tiers." "nginx"
    deploymentNode webNode "bigbank-web***" "" "Ubuntu 16.04 LTS" instances "4" {
        deploymentNode webTomcat "Apache Tomcat" "" "Apache Tomcat 8.x" {
            container webApp "Web Application" "Delivers the static content and the SPA." "Java/Spring MVC"
        }
    }
    deploymentNode apiNode "bigbank-api***" "" "Ubuntu 16.04 LTS" instances "8" {
        deploymentNode apiTomcat "Apache Tomcat" "" "Apache Tomcat 8.x" {
            container apiApp "API Application" "Provides banking features via a JSON/HTTPS API." "Java/Spring MVC"
        }
    }
    deploymentNode db01 "bigbank-db01" "" "Ubuntu 16.04 LTS" {
        deploymentNode oraclePrimary "Oracle - Primary" "" "Oracle 12c" {
            container dbPrimary "Database" "Stores user accounts and transactions." "Oracle 12c"
        }
    }
    deploymentNode db02 "bigbank-db02" "" "Ubuntu 16.04 LTS" instances "0..1" {
        deploymentNode oracleSecondary "Oracle - Secondary" "" "Oracle 12c" {
            container dbSecondary "Database" "Stores user accounts and transactions." "Oracle 12c"
        }
    }
}

mobileApp --> lb : "Makes API calls to" "json/HTTPS"
spa --> lb : "Makes API calls to" "json/HTTPS"
lb --> webApp : "Forwards requests to" "HTTPS"
lb --> apiApp : "Forwards requests to" "HTTPS"
apiApp --> dbPrimary : "Reads from and writes to" "JDBC"
dbPrimary --> dbSecondary : "Replicates data to"
```

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
softwareSystem core "Core System"

user --> core : "Manages accounts using"
```

### Title

A `title` line sets the diagram title:

```
title Internet Banking System - System Context
```
