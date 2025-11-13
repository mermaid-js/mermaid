# Wardley Maps (v<MERMAID_RELEASE_VERSION>+)

> Wardley Maps are visual representations of business strategy that map value chains and component evolution. They help identify strategic opportunities, dependencies, and guide technology decisions.

## Introduction

Wardley Maps position components along two axes:

- **Visibility** (Y-axis): How visible/valuable a component is to users (0.0 = infrastructure, 1.0 = user-facing)
- **Evolution** (X-axis): How evolved/mature a component is (0.0 = genesis/novel, 1.0 = commodity/utility)

This dual positioning enables strategic analysis of:

- Value chain dependencies
- Evolution of components over time
- Build vs. buy decisions
- Inertia and resistance to change

## Basic Example

```mermaid-example
wardley-beta
title Tea Shop Value Chain

anchor Business [0.95, 0.63]
component Cup of Tea [0.79, 0.61]
component Tea [0.63, 0.81]
component Hot Water [0.52, 0.80]
component Kettle [0.43, 0.35]
component Power [0.10, 0.70]

Business -> Cup of Tea
Cup of Tea -> Tea
Cup of Tea -> Hot Water
Hot Water -> Kettle
Kettle -> Power

evolve Kettle 0.62
evolve Power 0.89

note "Standardising power allows Kettles to evolve faster" [0.30, 0.49]
```

## Syntax

### Diagram Declaration

Every Wardley diagram starts with the `wardley-beta` keyword:

```mermaid
wardley-beta
title Your Map Title
size [width, height]
```

- `wardley-beta` - Required diagram type identifier (beta release)
- `title` - Optional title displayed at top
- `size` - Optional canvas dimensions in pixels (default: `[1100, 600]`)

### Coordinate System

**IMPORTANT**: Wardley Maps use the OnlineWardleyMaps (OWM) format: `[visibility, evolution]`

- **First value (Visibility)**: 0.0-1.0 (bottom to top) - Y-axis position
- **Second value (Evolution)**: 0.0-1.0 (left to right) - X-axis position

This is **opposite** of typical (x, y) notation!

```mermaid
wardley-beta
title Coordinate Examples

component Infrastructure [0.30, 0.20]  # Low visibility, low evolution
component Product [0.70, 0.60]         # High visibility, mid evolution
component User Need [0.90, 0.95]       # High visibility, high evolution
```

### Components and Anchors

#### Components

```mermaid
component Name [visibility, evolution]
component Name [visibility, evolution] label [offsetX, offsetY]
component Name [visibility, evolution] (decorator)
```

Example:

```mermaid-example
wardley-beta
title Components

component API [0.60, 0.70]
component Database [0.40, 0.85] label [-50, 10]
component "Custom Service" [0.55, 0.35]
```

#### Anchors

Anchors represent users or customers with bold labels:

```mermaid-example
wardley-beta
title Anchors

anchor Customer [0.90, 0.95]
anchor Business [0.85, 0.90]

component Service [0.70, 0.75]

Customer -> Service
Business -> Service
```

### Decorators

#### Inertia

Mark components resistant to change:

```mermaid-example
wardley-beta
title Inertia

component Legacy System [0.45, 0.40] (inertia)
component New Platform [0.65, 0.45]

Legacy System -> New Platform
```

#### Source Strategy

Indicate build/buy/outsource decisions:

- `(build)` - Triangle symbol
- `(buy)` - Diamond symbol
- `(outsource)` - Square symbol
- `(market)` - Circle symbol

```mermaid-example
wardley-beta
title Sourcing Strategy

anchor Customer [0.80, 0.95]
component Custom App [0.45, 0.85] (build)
component Off-the-shelf Tool [0.85, 0.65] (buy)
component Managed Service [0.60, 0.40] (outsource)
component Cloud Platform [0.95, 0.25] (market)

Customer -> Custom App
Custom App -> Off-the-shelf Tool
Custom App -> Managed Service
Off-the-shelf Tool -> Cloud Platform
```

### Links and Dependencies

```mermaid
A -> B              # Basic dependency
A -> B; label       # With annotation
A +> B              # Flow (with arrow marker)
A +< B              # Reverse flow
A +<> B             # Bi-directional flow
A +'text'> B        # Labeled flow
```

Example:

```mermaid-example
wardley-beta
title Link Types

component User [0.90, 0.95]
component App [0.75, 0.75]
component API [0.60, 0.60]
component Cache [0.65, 0.45]
component Database [0.15, 0.80]

User -> App
App +> API
API -> Database
API +<> Cache
Cache +'backup'> Database
```

### Evolution and Movement

#### Evolution Arrows

Show component evolution with red dashed arrows:

```mermaid-example
wardley-beta
title Evolution

component Database [0.40, 0.50]
component API [0.55, 0.60]

Database -> API

evolve Database 0.75
evolve API 0.80
```

#### Trend Indicators

Show predicted future position:

```mermaid
Component -.- (x, y)
```

Note: Trends use standard (x, y) order, not [visibility, evolution]!

### Pipelines

Pipeline components share visibility and only vary by evolution:

```mermaid-example
wardley-beta
title Pipeline Evolution

component Database [0.40, 0.60]

pipeline Database {
  component "File System" [0.25]
  component "SQL DB" [0.50]
  component "NoSQL" [0.70]
  component "Cloud DB" [0.85]
}
```

### Custom Evolution Stages

Define custom axis labels:

```mermaid-example
wardley-beta
title Custom Stages

evolution Unmodelled -> Divergent -> Convergent -> Modelled

component Raw Data [0.15, 0.20]
component Analysis [0.45, 0.50]
component Reports [0.75, 0.70]
```

#### Dual Labels

```mermaid-example
wardley-beta
title Dual Label Stages

evolution Genesis / Concept -> Custom / Emerging -> Product / Converging -> Commodity / Accepted

component Novel Idea [0.05, 0.20]
component Custom Solution [0.35, 0.50]
component Product [0.65, 0.70]
component Utility [0.95, 0.90]
```

#### Custom Stage Widths

Specify custom boundary widths using `@` notation:

```mermaid-example
wardley-beta
title Custom Widths

evolution Genesis@0.2 -> Custom@0.4 -> Product@0.75 -> Commodity@1.0

component Novel [0.75, 0.15]
component Bespoke [0.70, 0.35]
component Product [0.65, 0.65]
component Utility [0.60, 0.90]
```

### Annotations and Notes

#### Notes

Add contextual notes at specific coordinates:

```
note "text" [visibility, evolution]
```

> **Note**: Text must be enclosed in quotes.

```mermaid-example
wardley-beta
title Notes

component API [0.60, 0.70]
component Database [0.40, 0.50]

API -> Database

note "Critical decision point" [0.65, 0.55]
note "High risk area" [0.40, 0.35]
```

#### Numbered Annotations

Create numbered references with optional annotation box:

```
annotations [x, y]              # Optional: position for annotation numbers
annotation number,[x, y] "text"
```

> **Note**: Annotation text must be enclosed in quotes.

```mermaid-example
wardley-beta
title Annotations

component API [0.60, 0.70]
component Cache [0.50, 0.55]
component Database [0.40, 0.40]

API -> Cache
Cache -> Database

annotations [0.10, 0.90]
annotation 1,[0.60, 0.65] "Critical component"
annotation 2,[0.50, 0.50] "Performance layer"
annotation 3,[0.40, 0.35] "Data persistence"
```

### Visual Elements

#### Areas

Labeled regions for grouping:

```mermaid-example
wardley-beta
title Areas

area Frontend [0.80, 0.75]
area Backend [0.55, 0.60]
area Infrastructure [0.30, 0.40]

component UI [0.90, 0.85]
component API [0.65, 0.70]
component Database [0.45, 0.50]
component Cloud [0.25, 0.30]

UI -> API
API -> Database
Database -> Cloud
```

#### Accelerators and Deaccelerators

Forces affecting evolution:

```mermaid-example
wardley-beta
title Forces

component Legacy [0.20, 0.85]
component Modern [0.55, 0.60]
component AI [0.70, 0.35]

Legacy -> Modern
Modern -> AI

accelerator "AI Adoption" [0.55, 0.25]
deaccelerator "Legacy Constraints" [0.15, 0.75]
```

## Advanced Features

### Label Positioning

Fine-tune label placement:

```mermaid
component Name [visibility, evolution] label [offsetX, offsetY]
```

Negative X moves left, positive X moves right.
Negative Y moves up, positive Y moves down.

### Custom Canvas Size

```mermaid
wardley-beta
title Custom Size
size [800, 1000]
```

## Complete Example

```mermaid-example
wardley-beta
title Software Platform Strategy
size [1100, 800]

evolution Genesis@0.25 -> Custom@0.5 -> Product@0.75 -> Commodity@1.0

anchor Customer [0.90, 0.95]

area "User Experience" [0.85, 0.80]
area "Platform Services" [0.60, 0.55]
area "Infrastructure" [0.30, 0.90]

component "Mobile App" [0.80, 0.85] (build)
component "Web App" [0.75, 0.80] (build) label [-60, 10]
component "API Gateway" [0.70, 0.65] (buy)
component "Auth Service" [0.60, 0.55] (outsource)
component "Database" [0.50, 0.45] (buy) (inertia)
component "Cloud Platform" [0.30, 0.95] (market)

Customer -> "Mobile App"
Customer -> "Web App"
"Mobile App" -> "API Gateway"
"Web App" -> "API Gateway"
"API Gateway" -> "Auth Service"
"API Gateway" -> "Database"
"Database" -> "Cloud Platform"

evolve "API Gateway" 0.85
evolve "Database" 0.75

accelerator "Cloud Native" [0.20, 0.85]
deaccelerator "Legacy Data" [0.45, 0.35]

annotations [0.10, 0.20]
annotation 1,[0.78, 0.82] "User touchpoints"
annotation 2,[0.70, 0.60] "Integration layer"
annotation 3,[0.50, 0.40] "Data persistence"

note "Build mobile-first experience" [0.85, 0.90]
note "Migrate to cloud-native database" [0.60, 0.50]
```

## Configuration

Wardley Maps support Mermaid's theme system. Use standard Mermaid configuration to customize appearance.

## Resources

- [Wardley Mapping Book](https://medium.com/wardleymaps) by Simon Wardley
- [OnlineWardleyMaps](https://onlinewardleymaps.com/) - Interactive mapping tool
- [Wardley Maps Community](https://community.wardleymaps.com/)
- [Learn Wardley Mapping](https://learnwardleymapping.com/)

## Syntax Summary

| Element    | Syntax                              | Example                             |
| ---------- | ----------------------------------- | ----------------------------------- |
| Diagram    | `wardley-beta`                      | `wardley-beta`                      |
| Title      | `title Text`                        | `title My Map`                      |
| Size       | `size [width, height]`              | `size [1100, 800]`                  |
| Component  | `component Name [vis, evo]`         | `component API [0.6, 0.7]`          |
| Anchor     | `anchor Name [vis, evo]`            | `anchor User [0.9, 0.95]`           |
| Link       | `A -> B`                            | `API -> Database`                   |
| Flow       | `A +> B`                            | `User +> API`                       |
| Evolve     | `evolve Name targetEvo`             | `evolve API 0.85`                   |
| Note       | `note "Text" [vis, evo]`            | `note "Key insight" [0.4, 0.5]`     |
| Annotation | `annotation N,[x,y] "Text"`         | `annotation 1,[0.5,0.5] "Critical"` |
| Inertia    | `(inertia)`                         | `component DB [0.4, 0.6] (inertia)` |
| Strategy   | `(build\|buy\|outsource\|market)`   | `component API [0.6, 0.7] (buy)`    |
| Pipeline   | `pipeline Parent { ... }`           | See pipeline example above          |
| Evolution  | `evolution Stage1 -> Stage2 -> ...` | See evolution examples above        |
