# Wardley Map Diagrams

Wardley Maps are a visual technique for mapping business value chains and strategic positioning. They use two dimensions:

- **X-axis (Evolution)**: Genesis -> Custom Built -> Product -> Commodity
- **Y-axis (Visibility)**: Infrastructure (bottom) -> User-facing needs (top)

## Syntax Guide

### Basic Structure

```mermaid
wardleyMap
  component <id> "<label>" [<x>, <y>]
  <source_id> -> <target_id>
  evolve <component_id> <value>
```

### Component Types

Define components with their position on the map. Several component types are supported:

```mermaid
wardleyMap
  component api "API" [0.65, 0.75]
  anchor user "User" [0.5, 0.95]
  component mkt "Marketplace" [0.6, 0.7] market
  component eco "Platform" [0.4, 0.6] ecosystem
```

- `component` — standard component (default)
- `anchor` — a fixed reference point (e.g. users, customers)
- `market` / `ecosystem` — type modifier appended after coordinates

**Position Format**: `[x, y]` where both values are 0-1 (normalized coordinates)

### Component Options

Components support additional modifiers after the coordinates:

```mermaid
wardleyMap
  component legacy "Legacy DB" [0.3, 0.5] inertia
  component svc "Service" [0.5, 0.5] build
  component vendor "Vendor Tool" [0.7, 0.5] buy
  component ext "External" [0.8, 0.5] outsource
  component a "Adjusted" [0.5, 0.5] label [10, -5]
```

- `inertia` — marks a component as resistant to change
- `build` / `buy` / `outsource` — sourcing strategy
- `label [dx, dy]` — custom label offset

### Edge Types

Show how components relate to each other with different edge types:

```mermaid
wardleyMap
  component a "Component A" [0.3, 0.8]
  component b "Component B" [0.6, 0.6]
  component c "Component C" [0.5, 0.4]

  a -> b
  a +> c
  b => c
  a -> b ; "uses API"
```

- `->` — dependency edge (solid line)
- `+>` — flow edge (data/value flow, rendered differently)
- `=>` — constraint edge (constraint relationship)
- `; "text"` — optional annotation on any edge type

### Evolution

Mark how evolved each component is and optionally rename on evolution:

```mermaid
wardleyMap
  component api "API" [0.6, 0.7]
  evolve api 0.8
  evolve api -> apiV2 0.9
```

- `evolve <id> <value>` — set evolution target
- `evolve <id> -> <newLabel> <value>` — evolve with rename

### Notes and Annotations

```mermaid
wardleyMap
  component api "API" [0.6, 0.7]
  note "Key bottleneck" [0.55, 0.65]
  annotation 1 "Critical path" api
```

- `note "<text>" [x, y]` — free-floating note at a position
- `annotation <number> "<text>" <componentId>` — numbered annotation attached to a component

### Areas

Overlay regions on the map to highlight team zones or areas of interest:

```mermaid
wardleyMap
  pioneers "Innovation" [0.0, 0.0, 0.25, 1.0]
  settlers "Growth" [0.25, 0.0, 0.5, 1.0]
  townplanners "Scale" [0.5, 0.0, 1.0, 1.0]
  interest "Focus Area" [0.3, 0.3, 0.7, 0.7]
```

- `pioneers` / `settlers` / `townplanners` — Wardley doctrine team zones
- `interest` — general highlight area

### Pipelines

Group related components into a pipeline:

```mermaid
wardleyMap
  pipeline platform "Platform" [0.7, 0.3, 0.8] {
    svcA "Service A" [0.4]
    svcB "Service B" [0.7]
  }
```

### Submaps

Reference another map as a submap component:

```mermaid
wardleyMap
  component web "Web" [0.55, 0.85]
  submap auth "Auth" [0.5, 0.5] ref "auth-map"
  web -> auth
```

### Accelerators

Mark components as being accelerated or decelerated:

```mermaid
wardleyMap
  component api "API" [0.6, 0.7]
  component legacy "Legacy" [0.3, 0.5]
  accelerator api
  deaccelerator legacy
```

### Custom Axis Labels

Override the default axis labels:

```mermaid
wardleyMap
  xAxis "Genesis", "Custom", "Product", "Utility"
  yAxis "Invisible", "Visible"
  component a "A" [0.5, 0.5]
```

### Accessibility Features

```mermaid
wardleyMap
  accTitle: My Strategic Map
  accDescr: Shows how our platform components evolve over time

  component user "User" [0.5, 0.95]
```

## Examples

### Basic Wardley Map

```mermaid
wardleyMap
  component user "User" [0.5, 0.95]
  component web "Web UI" [0.55, 0.85]
  component api "API" [0.65, 0.75]
  component db "Database" [0.8, 0.5]

  user -> web
  web -> api
  api -> db

  evolve web 0.6
  evolve api 0.75
  evolve db 0.9
```

### E-Commerce Platform

```mermaid
wardleyMap
  accTitle: E-Commerce Platform
  accDescr: Strategic map showing component evolution

  anchor customers "Customers" [0.5, 0.98]
  component website "Website" [0.55, 0.85]
  component api "API Service" [0.65, 0.75]
  component auth "Auth Service" [0.6, 0.7]
  component db "Database" [0.75, 0.6]
  component cache "Cache" [0.8, 0.55]

  customers -> website
  website -> api
  api -> auth
  api -> db
  api -> cache

  evolve website 0.65
  evolve api 0.75
  evolve auth 0.85
  evolve db 0.88
  evolve cache 0.9
```

### Anchors, Inertia, Sourcing, and Flow Edges

```mermaid
wardleyMap
  anchor customer "Customer" [0.95, 0.5]
  component web "Web App" [0.85, 0.6]
  component api "API Gateway" [0.7, 0.65]
  component db "Database" [0.5, 0.8] inertia
  component cache "Cache" [0.55, 0.75] build
  component vendor "Vendor CRM" [0.6, 0.7] buy

  customer -> web
  web -> api
  api -> db
  api +> cache ; "data flow"
  api => db
  api -> vendor
```

### Evolve with Rename

```mermaid
wardleyMap
  component api "API v1" [0.4, 0.7]
  component db "MySQL" [0.5, 0.5]

  api -> db

  evolve api 0.7
  evolve db -> cloudDb 0.9
```

### Notes and Annotations

```mermaid
wardleyMap
  component api "API" [0.6, 0.7]
  component db "Database" [0.5, 0.5]

  api -> db

  note "Key bottleneck" [0.55, 0.65]
  annotation 1 "Critical path" api
  annotation 2 "Needs migration" db
```

### Areas (Pioneers, Settlers, Town Planners)

```mermaid
wardleyMap
  pioneers "Innovation Zone" [0.0, 0.0, 0.25, 1.0]
  settlers "Growth Zone" [0.25, 0.0, 0.5, 1.0]
  townplanners "Scale Zone" [0.5, 0.0, 1.0, 1.0]

  component novel "Novel Tech" [0.1, 0.5]
  component growing "Growing Svc" [0.35, 0.6]
  component mature "Mature Infra" [0.8, 0.4]
```

### Pipeline

```mermaid
wardleyMap
  anchor user "User" [0.95, 0.5]

  pipeline platform "Platform" [0.7, 0.3, 0.8] {
    svcA "Service A" [0.4]
    svcB "Service B" [0.7]
  }

  user -> platform
```

### Submap

```mermaid
wardleyMap
  component web "Web App" [0.85, 0.6]
  submap auth "Auth Subsystem" [0.5, 0.5] ref "auth-map"

  web -> auth
```

### Accelerators and Deaccelerators

```mermaid
wardleyMap
  component api "API" [0.6, 0.7]
  component legacy "Legacy System" [0.3, 0.5]
  component infra "Cloud Infra" [0.8, 0.3]

  api -> legacy
  api -> infra

  accelerator api
  deaccelerator legacy
```

### Custom Axis Labels

```mermaid
wardleyMap
  xAxis "Uncharted", "Emerging", "Good", "Best"
  yAxis "Invisible", "Visible"

  component a "Novel" [0.1, 0.5]
  component b "Mature" [0.8, 0.8]
  a -> b
```

### Full-Featured Map

```mermaid
wardleyMap
  accTitle: Platform Architecture
  accDescr: Full platform map demonstrating all feature types

  xAxis "Genesis", "Custom", "Product", "Commodity"

  anchor customer "Customer" [0.95, 0.5]
  component web "Web App" [0.85, 0.6]
  component mobile "Mobile App" [0.82, 0.55]
  component api "API Gateway" [0.7, 0.65]
  component auth "Auth Service" [0.6, 0.7]
  component db "Database" [0.5, 0.8] inertia
  component cache "Cache" [0.55, 0.75] build
  component infra "Infrastructure" [0.3, 0.9]
  component monitor "Monitoring" [0.4, 0.85] market

  customer -> web
  customer -> mobile
  web -> api
  mobile -> api
  api -> auth
  api -> db
  api +> cache ; "data flow"
  auth => db

  evolve api 0.8
  evolve db -> cloudDb 0.9

  note "Key bottleneck" [0.55, 0.65]
  annotation 1 "Critical path" api

  pioneers "Innovation" [0.0, 0.0, 0.25, 1.0]

  accelerator api
  deaccelerator infra
```

## Evolution Stages Explained

| Stage        | Range       | Description                            | Color      |
| ------------ | ----------- | -------------------------------------- | ---------- |
| Genesis      | 0.00 - 0.25 | Novel, uncertain, changing rapidly     | Red        |
| Custom Built | 0.25 - 0.50 | Understood, evolving towards standards | Orange     |
| Product      | 0.50 - 0.75 | Standardized, well-understood          | Light Blue |
| Commodity    | 0.75 - 1.00 | Mature, stable, cost-optimized         | Green      |

## Best Practices

### Positioning Components

- **Top of the map (0.9-1.0)**: User-facing needs and personas
- **Middle (0.5-0.8)**: Core platform capabilities
- **Bottom (0.2-0.5)**: Infrastructure and foundational services

### Evolution Values

- Use precise values to show progression: 0.15, 0.35, 0.60, 0.85
- Components typically start at 0.1-0.2 (Genesis)
- Well-established services reach 0.75-0.95 (Commodity)

### Dependency Mapping

- Draw dependencies from users down to infrastructure
- Show value chains: User -> Need -> Capability -> Infrastructure
- Use flow edges (`+>`) for data/value flow
- Use constraint edges (`=>`) for constraint relationships
- Identify missing or misaligned components

## Theming

Wardley maps support multiple theme options for different contexts:

- **Light theme (default)**: Professional presentation style
- **Dark theme**: Better for dark backgrounds
- **High-contrast theme**: Enhanced accessibility

## Accessibility

All Wardley maps include:

- **Semantic SVG structure**: Proper heading hierarchy
- **ARIA labels**: Descriptive labels for screen readers
- **Keyboard navigation**: Tab through components
- **Color-independent information**: Evolution shown via position, not just color
- **Diagram descriptions**: Use `accTitle` and `accDescr`

### Example with Accessibility

```mermaid
wardleyMap
  accTitle: Platform Architecture Map
  accDescr: Strategic map showing platform components and their evolution stages, from Genesis (innovative) to Commodity (mature). User-facing components at top, infrastructure at bottom.

  component user "Users" [0.5, 0.95]
  component app "Application" [0.55, 0.8]
  component api "API" [0.65, 0.7]
  component db "Database" [0.8, 0.5]

  user -> app
  app -> api
  api -> db

  evolve app 0.6
  evolve api 0.75
  evolve db 0.9
```

## Configuration

### Setting a Theme

```javascript
// In your mermaid configuration
mermaid.initialize({
  theme: 'light', // or 'dark', 'high-contrast'
  wardley: {
    width: 1400,
    height: 800,
    componentRadius: 8,
    useMaxWidth: true,
  },
});
```

## Tips for Effective Wardley Maps

1. **Start with user needs**: Begin at the top with what customers want
2. **Trace dependencies downward**: Show how needs are met
3. **Use consistent evolution**: Components in the same stage should cluster
4. **Identify gaps**: Look for missing components or unmet needs
5. **Plan transitions**: Mark how components will evolve with `evolve`
6. **Keep it readable**: Don't overcrowd with too many components
7. **Use areas**: Highlight pioneer/settler/town planner zones for team alignment
8. **Annotate key decisions**: Use notes and annotations to call out strategic points

## Common Patterns

### The Value Chain

```mermaid
wardleyMap
  anchor customer "Customer" [0.5, 0.95]
  component need "Need" [0.55, 0.8]
  component feature "Feature" [0.6, 0.65]
  component service "Service" [0.7, 0.5]
  component infrastructure "Infrastructure" [0.85, 0.3]

  customer -> need
  need -> feature
  feature -> service
  service -> infrastructure

  evolve need 0.8
  evolve feature 0.6
  evolve service 0.4
  evolve infrastructure 0.2
```

### Platform Layering

```mermaid
wardleyMap
  anchor users "Users" [0.5, 0.95]
  component frontend "Frontend" [0.55, 0.85]
  component middleware "Middleware" [0.65, 0.7]
  component backend "Backend" [0.75, 0.55]
  component database "Database" [0.85, 0.4]

  users -> frontend
  frontend -> middleware
  middleware -> backend
  backend -> database

  evolve frontend 0.7
  evolve middleware 0.6
  evolve backend 0.8
  evolve database 0.9
```

## See Also

- Wardley Mapping methodology by Simon Wardley
- Strategic positioning patterns
- Component evolution lifecycle
