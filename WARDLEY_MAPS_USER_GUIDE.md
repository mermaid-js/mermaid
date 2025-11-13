# Wardley Maps User Guide

## Complete Guide to Creating Strategic Maps with Mermaid

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Basic Syntax](#basic-syntax)
4. [Components and Positioning](#components-and-positioning)
5. [Relationships and Links](#relationships-and-links)
6. [Evolution](#evolution)
7. [Pipelines](#pipelines)
8. [Visual Elements](#visual-elements)
9. [Advanced Features](#advanced-features)
10. [Complete Examples](#complete-examples)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Introduction

### What are Wardley Maps?

Wardley Maps are strategic visualization tools created by Simon Wardley. They help you:

- **Visualize your value chain** - from user needs to underlying components
- **Understand evolution** - how components change from novel to commodity
- **Make strategic decisions** - build vs. buy, where to innovate, what to outsource
- **Communicate strategy** - share your thinking with teams and stakeholders

### Why Use Mermaid for Wardley Maps?

- **Text-based** - Version control friendly, easy to update
- **Integrated** - Works in GitHub, documentation sites, wikis, note-taking apps
- **Consistent** - Standardized syntax across your organization
- **Collaborative** - Easy to share and iterate on maps
- **AI-friendly** - Large Language Models can generate maps from conversations

---

## Getting Started

### Basic Structure

Every Wardley Map starts with a declaration and title:

```mermaid
wardley
title My First Map
```

### Coordinate System

Wardley Maps use a two-axis system:

**Format**: `[visibility, evolution]`

- **Visibility** (Y-axis): 0.0 (bottom/invisible) to 1.0 (top/visible to user)
- **Evolution** (X-axis): 0.0 (left/genesis) to 1.0 (right/commodity)

```
          Visible (1.0)
                ↑
                |
    Genesis ← [0.5, 0.8] → Commodity
      (0.0)     |            (1.0)
                |
                ↓
         Invisible (0.0)
```

**Important**: This is the OnlineWardleyMaps (OWM) format - `[visibility, evolution]` not `[x, y]`!

### Canvas Size

Optionally specify canvas dimensions:

```mermaid
wardley
title My Map
size [1100, 800]
```

---

## Basic Syntax

### Components

Components are the building blocks of your value chain:

```mermaid
component ComponentName [visibility, evolution]
```

**Examples**:

```mermaid
component User Interface [0.85, 0.75]
component Database [0.45, 0.60]
component Cloud Hosting [0.30, 0.95]
```

### Anchors

Anchors represent users or customers (shown in bold):

```mermaid
anchor AnchorName [visibility, evolution]
```

**Examples**:

```mermaid
anchor Customer [0.95, 0.90]
anchor Business User [0.95, 0.70]
```

### Links

Connect components to show dependencies:

```mermaid
ComponentA -> ComponentB
```

**Example**:

```mermaid
wardley
title Simple Value Chain

anchor User [0.95, 0.90]
component Website [0.80, 0.75]
component Database [0.50, 0.60]

User -> Website
Website -> Database
```

---

## Components and Positioning

### Naming Components

Use descriptive names. Spaces are allowed:

```mermaid
component User Interface [0.85, 0.75]
component "API Gateway" [0.70, 0.65]
component Payment Processing [0.60, 0.80]
```

### Positioning Strategy

**Visibility** (how visible to users):

- **0.9-1.0**: Directly user-facing (UI, customer service)
- **0.6-0.8**: User-aware but indirect (APIs, business logic)
- **0.3-0.5**: Support systems (databases, message queues)
- **0.0-0.2**: Infrastructure (servers, networks)

**Evolution** (maturity stage):

- **0.0-0.25**: Genesis (novel, experimental, uncertain)
- **0.25-0.50**: Custom (tailored solutions, competitive advantage)
- **0.50-0.75**: Product (off-the-shelf, vendor solutions)
- **0.75-1.0**: Commodity (standardized, utilities, cloud services)

### Label Positioning

Adjust label positions to avoid overlaps:

```mermaid
component Kettle [0.43, 0.35] label [-57, 4]
component Power [0.10, 0.70] label [-27, 20]
```

The `label [x, y]` offsets the label from the component position.

---

## Relationships and Links

### Dependency Links

Basic arrow showing one component depends on another:

```mermaid
ComponentA -> ComponentB
```

### Flow Links

Show flow of value or information:

```mermaid
ComponentA +> ComponentB  # Flow from A to B
ComponentA +< ComponentB  # Flow from B to A
ComponentA +<> ComponentB # Bidirectional flow
```

### Labeled Links

Add text to explain relationships:

```mermaid
ComponentA "uses" ComponentB
ComponentA "API calls" ComponentB
```

### Complete Example

```mermaid
wardley
title Application Architecture

anchor Users [0.95, 0.85]
component Mobile App [0.85, 0.75]
component API Gateway [0.70, 0.65]
component Auth Service [0.60, 0.80]
component Database [0.50, 0.60]

Users -> Mobile App
Mobile App -> API Gateway
API Gateway "authenticates via" Auth Service
API Gateway +> Database
```

---

## Evolution

### Evolution Arrows

Show how components are expected to evolve:

```mermaid
evolve ComponentName newEvolutionValue
```

The arrow shows movement from current position to the new evolution stage.

**Example**:

```mermaid
wardley
title Platform Evolution

component Custom Analytics [0.70, 0.35]
component Reporting Tool [0.65, 0.55]

evolve Custom Analytics 0.60
evolve Reporting Tool 0.80
```

### Custom Evolution Stages

Override default stages with your own:

```mermaid
evolution StageA -> StageB -> StageC -> StageD
```

**Example**:

```mermaid
wardley
title Data Maturity Model
evolution Unmodelled -> Divergent -> Convergent -> Modelled

component Raw Data [0.80, 0.05]
component Structured Data [0.70, 0.35]
component Data Products [0.60, 0.70]

evolve Structured Data 0.65
```

### Custom Stage Widths

Adjust stage boundaries using `@boundary`:

```mermaid
evolution Genesis@0.1 -> Custom@0.3 -> Product@0.6 -> Commodity@0.9
```

The `@value` sets where each stage ends.

### Dual-Label Stages

Use different labels for top and bottom:

```mermaid
evolution Novel / Exploratory -> Emerging / Advancing -> Good / Stabilising -> Best / Accepted
```

---

## Pipelines

### What are Pipelines?

Pipelines show evolutionary stages of a single component, all at the same visibility level.

### Basic Pipeline Syntax

```mermaid
component ParentComponent [visibility, evolution]

pipeline ParentComponent {
  component "Stage 1" [evolution1]
  component "Stage 2" [evolution2]
  component "Stage 3" [evolution3]
}
```

### Pipeline Example

```mermaid
wardley
title Database Evolution

component Database [0.57, 0.45]
component Application [0.75, 0.60]

Application -> Database

pipeline Database {
  component "File System" [0.25]
  component "SQL Database" [0.50]
  component "Cloud Database" [0.75]
}
```

**Key Points**:

- Pipeline components inherit visibility from parent (0.57 in this case)
- Only specify evolution value for each stage
- Pipeline components show the journey from genesis to commodity

### Linking Pipeline Components

You can create explicit links:

```mermaid
pipeline Kettle {
  component Campfire Kettle [0.35] label [-60, 35]
  component Electric Kettle [0.53] label [-60, 35]
  component Smart Kettle [0.72] label [-30, 35]
}

Campfire Kettle -> Kettle
Electric Kettle -> Kettle
Smart Kettle -> Kettle
```

---

## Visual Elements

### Notes

Add explanatory notes to your map:

```mermaid
note Text content here [visibility, evolution]
```

**Example**:

```mermaid
wardley
title Strategic Notes

component Database [0.50, 0.45]
component Cache [0.60, 0.70]

note Focus optimization here [0.55, 0.60]
note Consider migration to cloud [0.45, 0.35]
```

### Annotations

Create numbered reference markers:

```mermaid
annotations [visibility, evolution]
annotation 1,[vis, evo] Description text
annotation 2,[vis, evo] More description
annotation 3,[vis, evo] Additional context
```

**Example**:

```mermaid
wardley
title Architecture Decisions

component Frontend [0.85, 0.75]
component Backend [0.65, 0.60]
component Database [0.45, 0.50]

annotations [0.90, 0.10]
annotation 1,[0.85, 0.70] React chosen for component reusability
annotation 2,[0.65, 0.55] Microservices enable independent scaling
annotation 3,[0.45, 0.45] PostgreSQL for ACID compliance
```

The `annotations [x, y]` sets the position for the legend.

### Areas

Create visual grouping boxes:

```mermaid
area "Label" [visibility, evolution]
```

**Example**:

```mermaid
wardley
title System Layers

area "User Layer" [0.85, 0.80]
area "Application Layer" [0.65, 0.60]
area "Data Layer" [0.45, 0.50]

component UI [0.85, 0.80]
component API [0.65, 0.60]
component Database [0.45, 0.50]
```

Areas help visualize logical groupings or system boundaries.

---

## Advanced Features

### Source Strategies

Mark components with strategic decisions:

```mermaid
component Name [vis, evo] (strategy)
```

**Strategies**:

- `(build)` - Build in-house
- `(buy)` - Purchase solution
- `(outsource)` - Contract to third party
- `(market)` - Use commodity/utility

**Example**:

```mermaid
wardley
title Build vs Buy Decisions

component Custom CRM [0.70, 0.40] (build)
component Email Service [0.60, 0.85] (buy)
component Hosting [0.30, 0.95] (market)
component Data Analysis [0.50, 0.50] (outsource)
```

### Inertia

Mark components resistant to change:

```mermaid
component Name [vis, evo] (inertia)
component Name [vis, evo] inertia
```

**Example**:

```mermaid
wardley
title Legacy Systems

component Legacy Mainframe [0.95, 0.15] (inertia)
component Old Database [0.80, 0.25] inertia
component New Cloud Platform [0.50, 0.85]

Legacy Mainframe -> Old Database
New Cloud Platform -> Old Database
```

Inertia indicates systems that are difficult to change due to technical, organizational, or political factors.

### Accelerators

Mark forces that speed up evolution:

```mermaid
accelerator "Label" [visibility, evolution]
```

**Example**:

```mermaid
wardley
title Market Forces

component Mobile Apps [0.80, 0.60]
component Cloud Services [0.40, 0.90]

accelerator "Open Source Movement" [0.35, 0.85]
accelerator "API Economy" [0.70, 0.75]
```

### Deaccelerators

Mark forces that slow down evolution:

```mermaid
deaccelerator "Label" [visibility, evolution]
```

**Example**:

```mermaid
wardley
title Regulatory Constraints

component Healthcare Platform [0.85, 0.65]
component Patient Data [0.70, 0.40]

deaccelerator "HIPAA Compliance" [0.65, 0.35]
deaccelerator "Legacy Integration" [0.80, 0.20]
```

### Combining Features

You can combine multiple features:

```mermaid
wardley
title Complete Strategic View
size [1200, 900]

evolution Genesis -> Custom -> Product -> Commodity

anchor Customers [0.95, 0.90]

area "Differentiators" [0.75, 0.65]
area "Commodity Services" [0.35, 0.85]

component "Mobile App" [0.85, 0.70] (build)
component "API Layer" [0.70, 0.60] (build)
component "Payment Processing" [0.60, 0.80] (buy)
component "Authentication" [0.65, 0.85] (outsource)
component "Cloud Hosting" [0.30, 0.95] (market)
component "Legacy System" [0.80, 0.20] (inertia)

Customers -> "Mobile App"
"Mobile App" -> "API Layer"
"API Layer" -> "Payment Processing"
"API Layer" -> Authentication
"API Layer" -> "Legacy System"
"Payment Processing" -> "Cloud Hosting"
Authentication -> "Cloud Hosting"

evolve "Payment Processing" 0.90
evolve "API Layer" 0.75

accelerator "Containerization" [0.25, 0.90]
deaccelerator "Regulatory Compliance" [0.75, 0.25]

note Focus innovation on mobile experience [0.85, 0.65]
note Migrate legacy to cloud [0.80, 0.15]

annotations [0.10, 0.05]
annotation 1,[0.85, 0.65] Primary user touchpoint
annotation 2,[0.70, 0.55] Integration hub
annotation 3,[0.30, 0.90] Commodity infrastructure
```

---

## Complete Examples

### Example 1: E-Commerce Platform

```mermaid
wardley
title E-Commerce Platform Strategy
size [1200, 900]

evolution Genesis -> Custom -> Product -> Commodity

anchor Customers [0.95, 0.88]

area "Customer Experience" [0.82, 0.75]
area "Business Logic" [0.60, 0.55]
area "Infrastructure" [0.30, 0.85]

component "Mobile App" [0.88, 0.75] (build) label [15, -5]
component "Web Store" [0.82, 0.70] (build)
component "Product Catalog" [0.75, 0.65] (buy)
component "Shopping Cart" [0.70, 0.55] (build)
component "Payment Gateway" [0.62, 0.82] (buy)
component "Order Management" [0.58, 0.50] (build)
component "Inventory System" [0.50, 0.45] (buy)
component "CRM" [0.55, 0.60] (outsource)
component "Email Service" [0.45, 0.88] (market)
component "CDN" [0.35, 0.92] (market)
component "Database" [0.40, 0.75] (buy)
component "Cloud Hosting" [0.25, 0.95] (market)

Customers -> "Mobile App"
Customers -> "Web Store"
"Mobile App" -> "Product Catalog"
"Web Store" -> "Product Catalog"
"Product Catalog" -> "Shopping Cart"
"Shopping Cart" -> "Payment Gateway"
"Shopping Cart" -> "Order Management"
"Order Management" -> "Inventory System"
"Order Management" -> CRM
CRM -> "Email Service"
"Product Catalog" -> Database
"Inventory System" -> Database
Database -> "Cloud Hosting"
"Web Store" -> CDN
"Mobile App" -> CDN

evolve "Shopping Cart" 0.70
evolve "Order Management" 0.65
evolve Database 0.85

accelerator "Serverless Architecture" [0.20, 0.90]
accelerator "API-First Design" [0.65, 0.70]
deaccelerator "Legacy Inventory" [0.45, 0.35]

note Build unique shopping experience [0.80, 0.65]
note Buy commodity services [0.30, 0.88]
note Focus engineering on cart and checkout [0.70, 0.50]

annotations [0.08, 0.05]
annotation 1,[0.85, 0.70] Primary revenue driver
annotation 2,[0.62, 0.77] Critical conversion point
annotation 3,[0.25, 0.90] Elastic scaling required
```

### Example 2: SaaS Product Development

```mermaid
wardley
title SaaS Product Evolution
size [1200, 900]

evolution MVP -> Growing -> Scaling -> Enterprise

anchor End Users [0.95, 0.85]
anchor Business Customers [0.95, 0.70]

area "Product Features" [0.75, 0.68]
area "Platform Services" [0.55, 0.52]
area "Infrastructure" [0.30, 0.88]

component "Dashboard UI" [0.85, 0.65] (build)
component "Analytics Views" [0.78, 0.58] (build)
component "API Access" [0.70, 0.70] (build)
component "Collaboration Tools" [0.72, 0.45] (build)
component "Core Engine" [0.62, 0.52] (build)
component "Auth & Permissions" [0.65, 0.78] (buy)
component "Data Processing" [0.55, 0.48] (build)
component "Notification Service" [0.50, 0.75] (outsource)
component "Search Engine" [0.48, 0.60] (buy)
component "Message Queue" [0.42, 0.70] (buy)
component "Object Storage" [0.35, 0.90] (market)
component "PostgreSQL" [0.38, 0.82] (buy)
component "Redis Cache" [0.40, 0.85] (buy)
component "Kubernetes" [0.28, 0.92] (market)
component "Cloud Provider" [0.25, 0.95] (market)

End Users -> "Dashboard UI"
Business Customers -> "API Access"
"Dashboard UI" -> "Analytics Views"
"Dashboard UI" -> "Collaboration Tools"
"Analytics Views" -> "Core Engine"
"API Access" -> "Core Engine"
"Collaboration Tools" -> "Notification Service"
"Core Engine" -> "Data Processing"
"Core Engine" -> "Auth & Permissions"
"Data Processing" -> "Search Engine"
"Data Processing" -> "Message Queue"
"Search Engine" -> PostgreSQL
"Message Queue" -> PostgreSQL
PostgreSQL -> "Cloud Provider"
"Object Storage" -> "Cloud Provider"
"Redis Cache" -> "Cloud Provider"
Kubernetes -> "Cloud Provider"
"Data Processing" -> "Object Storage"
"Core Engine" -> "Redis Cache"

pipeline "Core Engine" {
  component "Prototype Engine" [0.15] label [-50, 25]
  component "Production Engine" [0.52] label [-50, 25]
  component "Enterprise Engine" [0.78] label [-50, 25]
}

evolve "Core Engine" 0.75
evolve "Data Processing" 0.65
evolve "Analytics Views" 0.70

accelerator "Open Source Libraries" [0.35, 0.85]
accelerator "Containerization" [0.25, 0.88]
deaccelerator "Data Privacy Regulations" [0.58, 0.40]
deaccelerator "Enterprise Security Requirements" [0.68, 0.72]

note Differentiate on analytics and UX [0.80, 0.58]
note Leverage cloud commodities [0.28, 0.90]
note Build core IP here [0.60, 0.48]

annotations [0.08, 0.05]
annotation 1,[0.85, 0.60] Primary user interface
annotation 2,[0.62, 0.48] Proprietary algorithms
annotation 3,[0.40, 0.83] Scalable data layer
annotation 4,[0.25, 0.92] Auto-scaling infrastructure
```

### Example 3: Digital Transformation Journey

```mermaid
wardley
title Enterprise Digital Transformation
size [1200, 900]

evolution Legacy -> Transitional -> Modern -> Cloud Native

anchor Internal Users [0.95, 0.75]
anchor External Partners [0.95, 0.55]

area "Legacy Systems" [0.82, 0.18]
area "Transition Layer" [0.62, 0.45]
area "Modern Platform" [0.42, 0.78]

component "Web Portal" [0.78, 0.65] (build)
component "Mobile Interface" [0.72, 0.70] (build)
component "Integration Hub" [0.65, 0.50] (build)
component "Event Bus" [0.58, 0.55] (buy)
component "API Gateway" [0.62, 0.62] (buy)
component "Microservices" [0.52, 0.68] (build)
component "Legacy Mainframe" [0.88, 0.12] (inertia)
component "Monolithic App" [0.80, 0.22] (inertia)
component "Oracle DB" [0.75, 0.35] (inertia)
component "New Database" [0.45, 0.75] (buy)
component "Container Platform" [0.38, 0.85] (market)
component "Cloud Services" [0.32, 0.92] (market)

Internal Users -> "Web Portal"
Internal Users -> "Mobile Interface"
External Partners -> "API Gateway"
"Web Portal" -> "Integration Hub"
"Mobile Interface" -> "Integration Hub"
"API Gateway" -> "Integration Hub"
"Integration Hub" -> "Event Bus"
"Integration Hub" -> "Legacy Mainframe"
"Integration Hub" -> "Monolithic App"
"Event Bus" -> Microservices
Microservices -> "New Database"
Microservices -> "Oracle DB"
"New Database" -> "Container Platform"
"Container Platform" -> "Cloud Services"
"Legacy Mainframe" -> "Oracle DB"
"Monolithic App" -> "Oracle DB"

evolve "Integration Hub" 0.75
evolve Microservices 0.80
evolve "Oracle DB" 0.55

accelerator "Cloud Adoption" [0.30, 0.88]
accelerator "DevOps Culture" [0.48, 0.75]
deaccelerator "Regulatory Compliance" [0.80, 0.25]
deaccelerator "Technical Debt" [0.85, 0.15]
deaccelerator "Organizational Resistance" [0.70, 0.30]

note Strangler pattern for migration [0.65, 0.45]
note Legacy systems under governance [0.82, 0.20]
note Cloud-first for new services [0.38, 0.82]

annotations [0.08, 0.05]
annotation 1,[0.75, 0.63] User-facing modernization
annotation 2,[0.65, 0.45] Critical integration layer
annotation 3,[0.88, 0.15] Gradual decommissioning planned
annotation 4,[0.52, 0.65] Modern architecture target
```

---

## Best Practices

### 1. Start Simple

Begin with your value chain:

- Identify your users (anchors)
- List key components
- Show dependencies
- Add evolution information

Don't try to map everything at once.

### 2. Use Meaningful Names

```mermaid
# Good
component User Authentication [0.70, 0.85]
component Payment Gateway [0.60, 0.82]

# Avoid
component Auth [0.70, 0.85]
component PG [0.60, 0.82]
```

### 3. Position Thoughtfully

**Visibility** questions:

- How visible is this to users?
- Is it user-facing or infrastructure?

**Evolution** questions:

- How mature/commoditized is this?
- Is it novel, custom-built, product, or utility?

### 4. Show Strategic Intent

Use annotations to explain decisions:

```mermaid
annotation 1,[0.85, 0.70] Build here for differentiation
annotation 2,[0.30, 0.90] Buy commodity to reduce costs
```

### 5. Keep Maps Focused

Create multiple maps rather than one mega-map:

- **Strategic map**: High-level business view
- **Technical map**: Detailed system architecture
- **Team map**: What each team owns

### 6. Iterate and Update

Maps are living documents:

- Review quarterly
- Update as strategy evolves
- Version control in git
- Discuss changes with team

### 7. Use Consistent Coordinates

Align similar components across maps:

```mermaid
# Keep cloud services in same area
component AWS Lambda [0.25, 0.95]
component Google Cloud [0.28, 0.95]
component Azure Functions [0.27, 0.95]
```

### 8. Label Clearly

When components overlap, use label offsets:

```mermaid
component Kettle [0.43, 0.35] label [-57, 4]
component Power [0.10, 0.70] label [-27, 20]
```

### 9. Add Context with Notes

```mermaid
note This will evolve to product within 6 months [0.45, 0.55]
note Consider migration path to cloud [0.30, 0.65]
```

### 10. Document Decisions

Use strategy markers and annotations:

```mermaid
component Analytics Engine [0.65, 0.45] (build)
annotation 1,[0.65, 0.40] Core competitive advantage
```

---

## Troubleshooting

### Common Issues

#### Issue: Components Not Showing

**Problem**: Component declaration missing coordinates

```mermaid
# Wrong
component Database

# Correct
component Database [0.45, 0.60]
```

#### Issue: Links Not Connecting

**Problem**: Component names don't match exactly

```mermaid
# Wrong
component User Interface [0.85, 0.75]
User interface -> Database  # lowercase 'interface'

# Correct
component User Interface [0.85, 0.75]
User Interface -> Database  # matches exactly
```

#### Issue: Coordinates Seem Backwards

**Problem**: Using [x, y] instead of [visibility, evolution]

```mermaid
# Wrong - this puts user needs at bottom-right
component User Needs [0.05, 0.95]

# Correct - user needs at top-left
component User Needs [0.95, 0.05]
```

**Remember**: `[visibility, evolution]` not `[x, y]`!

#### Issue: Evolution Arrow Not Showing

**Problem**: Component doesn't exist or name mismatch

```mermaid
# Wrong
component Database [0.45, 0.60]
evolve database 0.80  # lowercase

# Correct
component Database [0.45, 0.60]
evolve Database 0.80  # matches case
```

#### Issue: Pipeline Components Overlap

**Problem**: Evolution values too close

```mermaid
# Wrong
pipeline Kettle {
  component Stage1 [0.50]
  component Stage2 [0.51]  # too close
}

# Correct
pipeline Kettle {
  component Stage1 [0.35]
  component Stage2 [0.65]  # well separated
}
```

#### Issue: Labels Overlapping

**Solution**: Use label offsets

```mermaid
component Kettle [0.43, 0.35] label [-57, 4]
component Power [0.10, 0.70] label [-27, 20]
```

#### Issue: Map Too Crowded

**Solutions**:

1. Create multiple focused maps
2. Group with areas
3. Increase canvas size: `size [1400, 1000]`
4. Remove less critical components

#### Issue: Custom Stages Not Showing

**Problem**: Missing evolution declaration

```mermaid
# Wrong
component Data [0.70, 0.35]

# Correct
evolution Genesis -> Custom -> Product -> Commodity
component Data [0.70, 0.35]
```

---

## Tips for Success

### For Strategy Sessions

1. **Start with user needs** - Begin with anchors at top
2. **Work backwards** - Identify what's needed to deliver value
3. **Question assumptions** - Challenge position and evolution
4. **Discuss movement** - Use evolve arrows to show future state

### For Documentation

1. **One map per concern** - Don't mix business and technical
2. **Add context** - Use notes and annotations liberally
3. **Version control** - Track changes over time
4. **Link to decisions** - Reference ADRs or strategy docs

### For Team Alignment

1. **Collaborative creation** - Build maps together
2. **Regular reviews** - Update in sprint planning or retros
3. **Visual discussions** - Use maps in technical design reviews
4. **Shared vocabulary** - Agree on component names and positions

---

## Quick Reference

### Syntax Cheat Sheet

```mermaid
wardley
title Map Title
size [width, height]

# Evolution stages (optional)
evolution Stage1 -> Stage2 -> Stage3 -> Stage4
evolution Stage1@0.1 -> Stage2@0.4 -> Stage3@0.7 -> Stage4@0.95

# Components
anchor AnchorName [visibility, evolution]
component ComponentName [visibility, evolution]
component "With Spaces" [vis, evo] label [x, y]
component Name [vis, evo] (build|buy|outsource|market)
component Name [vis, evo] (inertia)

# Links
ComponentA -> ComponentB
ComponentA +> ComponentB
ComponentA +< ComponentB
ComponentA +<> ComponentB
ComponentA "label text" ComponentB

# Evolution
evolve ComponentName newEvolution

# Pipelines
pipeline ParentComponent {
  component Stage1 [evolution1]
  component Stage2 [evolution2]
}

# Visual elements
note Text here [vis, evo]
area "Label" [vis, evo]
accelerator "Label" [vis, evo]
deaccelerator "Label" [vis, evo]

# Annotations
annotations [vis, evo]
annotation 1,[vis, evo] Description text
annotation 2,[vis, evo] More description
```

### Coordinate Ranges

| Element        | Visibility (Y) | Evolution (X) |
| -------------- | -------------- | ------------- |
| User-facing    | 0.8 - 1.0      | Any           |
| Business logic | 0.5 - 0.7      | Any           |
| Infrastructure | 0.2 - 0.4      | Any           |
| Genesis        | Any            | 0.0 - 0.25    |
| Custom         | Any            | 0.25 - 0.50   |
| Product        | Any            | 0.50 - 0.75   |
| Commodity      | Any            | 0.75 - 1.0    |

---

## Learning Resources

### Books and Articles

- **"Wardley Maps" by Simon Wardley** - The definitive guide ([free online](https://medium.com/wardleymaps))
- **Online Wardley Maps** - Interactive mapping tool ([onlinewardleymaps.com](https://onlinewardleymaps.com))
- **Wardley Maps Community** - Discussion and examples ([community.wardleymaps.com](https://community.wardleymaps.com))

### Video Tutorials

- Search YouTube for "Wardley Mapping Tutorial"
- Simon Wardley's presentations and talks

### Practice

- Start with your team's current project
- Map your organization's technology stack
- Analyze a competitor's public strategy
- Map your career development path

---

## Appendix: Full Example with All Features

```mermaid
wardley
title Complete Feature Showcase
size [1400, 1000]

evolution Genesis@0.1 -> Custom@0.35 -> Product@0.65 -> Commodity@0.90

anchor End Users [0.95, 0.88]
anchor Business Admins [0.95, 0.72]

area "User Experience Layer" [0.82, 0.75]
area "Application Layer" [0.62, 0.58]
area "Data Layer" [0.42, 0.45]
area "Infrastructure Layer" [0.28, 0.88]

component "Mobile App" [0.88, 0.78] (build) label [15, -5]
component "Web Portal" [0.82, 0.72] (build)
component "Admin Console" [0.78, 0.68] (build)
component "API Gateway" [0.72, 0.62] (buy)
component "Auth Service" [0.68, 0.80] (outsource)
component "Business Logic" [0.62, 0.55] (build)
component "Analytics Engine" [0.58, 0.48] (build)
component "Search Service" [0.55, 0.65] (buy)
component "Message Queue" [0.48, 0.70] (buy)
component "Cache Layer" [0.52, 0.75] (buy)
component "Database Cluster" [0.42, 0.65] (buy)
component "Object Storage" [0.38, 0.88] (market)
component "CDN" [0.35, 0.92] (market)
component "Container Orchestration" [0.30, 0.90] (market)
component "Cloud Provider" [0.25, 0.95] (market)
component "Legacy System" [0.85, 0.15] (inertia)

End Users -> "Mobile App"
End Users -> "Web Portal"
Business Admins -> "Admin Console"
"Mobile App" -> "API Gateway"
"Web Portal" -> "API Gateway"
"Admin Console" -> "API Gateway"
"API Gateway" -> "Auth Service"
"API Gateway" -> "Business Logic"
"Business Logic" -> "Analytics Engine"
"Business Logic" -> "Search Service"
"Business Logic" -> "Message Queue"
"Business Logic" -> "Cache Layer"
"Business Logic" -> "Database Cluster"
"Business Logic" -> "Legacy System"
"Analytics Engine" -> "Database Cluster"
"Database Cluster" -> "Object Storage"
"Mobile App" -> CDN
"Web Portal" -> CDN
"Database Cluster" -> "Container Orchestration"
"Message Queue" -> "Container Orchestration"
"Container Orchestration" -> "Cloud Provider"
"Object Storage" -> "Cloud Provider"
CDN -> "Cloud Provider"

pipeline "Business Logic" {
  component "Monolith v1" [0.25] label [-45, 25]
  component "Services v2" [0.55] label [-45, 25]
  component "Microservices v3" [0.78] label [-50, 25]
}

evolve "Business Logic" 0.75
evolve "Analytics Engine" 0.65
evolve "Database Cluster" 0.80
evolve "Legacy System" 0.35

accelerator "Cloud Native Tools" [0.28, 0.85]
accelerator "API Economy" [0.70, 0.68]
accelerator "Open Source" [0.52, 0.72]
deaccelerator "Legacy Integration" [0.82, 0.18]
deaccelerator "Compliance Requirements" [0.65, 0.52]
deaccelerator "Technical Debt" [0.58, 0.42]

note Build unique value here [0.85, 0.73]
note Leverage cloud commodities [0.30, 0.90]
note Migrate away from legacy [0.82, 0.12]
note Core business logic differentiation [0.60, 0.50]

annotations [0.08, 0.05]
annotation 1,[0.85, 0.75] Primary user touchpoints - mobile first strategy
annotation 2,[0.72, 0.58] API-first architecture enables flexibility
annotation 3,[0.62, 0.52] Proprietary algorithms and business rules
annotation 4,[0.42, 0.62] Scalable data persistence layer
annotation 5,[0.28, 0.88] Fully managed cloud services reduce ops burden
annotation 6,[0.85, 0.18] Gradual decommissioning over 18 months
```

---

## Conclusion

Wardley Maps help you:

- ✅ Visualize your strategic landscape
- ✅ Make informed build vs. buy decisions
- ✅ Communicate strategy clearly
- ✅ Plan evolution and change
- ✅ Align teams around shared understanding

With Mermaid's text-based approach, you can now:

- Version control your strategy
- Embed maps in documentation
- Generate maps with AI
- Collaborate easily with teams

Start simple, iterate often, and let your maps evolve with your understanding!

---

**Questions or feedback?**

- GitHub Issues: https://github.com/mermaid-js/mermaid/issues
- Mermaid Docs: https://mermaid.js.org
- Wardley Maps Community: https://community.wardleymaps.com

**Happy Mapping!** 🗺️
