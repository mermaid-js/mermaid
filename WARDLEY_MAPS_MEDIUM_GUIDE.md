# The Complete Guide to Wardley Maps in Mermaid

## Create Strategic Maps with Simple Text-Based Syntax

---

Wardley Maps are powerful strategic visualization tools that help you understand your business landscape, make better decisions, and communicate complex strategies. Now, with Mermaid's text-based approach, creating these maps is as simple as writing a few lines of code.

---

## What You'll Learn

This comprehensive guide covers everything you need to know:

- The basics of Wardley Map syntax
- How to position components correctly
- Creating relationships and showing evolution
- Advanced features like pipelines and strategic markers
- Real-world examples from e-commerce, SaaS, and enterprise
- Best practices and troubleshooting tips

Whether you're new to Wardley Mapping or looking to integrate maps into your documentation workflow, this guide has you covered.

---

## Part 1: Understanding the Basics

### What are Wardley Maps?

Created by Simon Wardley, Wardley Maps help you:

**Visualize your value chain** - Map everything from user needs down to underlying infrastructure

**Understand evolution** - See how components mature from novel experiments to commodity utilities

**Make strategic decisions** - Decide what to build, buy, or outsource based on position and maturity

**Communicate effectively** - Share your strategic thinking with teams and stakeholders

### Why Use Mermaid for Wardley Maps?

**Text-based** - Store maps in version control, update them like code

**Integrated everywhere** - Works in GitHub, GitLab, documentation sites, wikis, note-taking apps

**AI-friendly** - Large Language Models can generate maps from conversations

**Collaborative** - Easy to share, review, and iterate on maps with your team

**Consistent** - Standardized syntax across your entire organization

---

## Part 2: Your First Wardley Map

### The Minimum Viable Map

Every Wardley Map starts with two things: a declaration and a title.

```mermaid
wardley
title My First Strategic Map
```

That's it! You've created a Wardley Map. Now let's add some substance.

### Understanding the Coordinate System

Wardley Maps use a two-axis coordinate system that might seem unusual at first. The format is:

**[visibility, evolution]**

Not the typical (x, y) you might expect!

**Visibility** (the Y-axis) measures how visible a component is to users:

- **1.0** = Top of the map, directly visible to users (like a mobile app)
- **0.5** = Middle, supporting systems (like an API or database)
- **0.0** = Bottom, deep infrastructure (like servers or networks)

**Evolution** (the X-axis) measures how mature or commoditized a component is:

- **0.0** = Left side, genesis/novel (experimental, uncertain)
- **0.25** = Custom-built solutions (your competitive advantage)
- **0.50** = Product stage (off-the-shelf vendor solutions)
- **0.75** = Commodity/utility (standardized, cloud services)
- **1.0** = Fully commoditized

Think of it this way:

```
         User-Facing (1.0)
                ↑
                |
    Novel ←─────┼─────→ Commodity
   (0.0)        |        (1.0)
                |
                ↓
      Infrastructure (0.0)
```

This is called the OnlineWardleyMaps (OWM) format, and it's the community standard.

### Adding Your First Components

Components are the building blocks of your map:

```mermaid
wardley
title Simple Application Stack

component Mobile App [0.85, 0.75]
component API Gateway [0.65, 0.60]
component Database [0.45, 0.50]
component Cloud Hosting [0.25, 0.95]
```

Notice how:

- The Mobile App has high visibility (0.85) and medium evolution (0.75)
- Cloud Hosting has low visibility (0.25) but is highly evolved/commoditized (0.95)

### Connecting Components

Show dependencies with arrows:

```mermaid
wardley
title Application Dependencies

component Mobile App [0.85, 0.75]
component API Gateway [0.65, 0.60]
component Database [0.45, 0.50]

Mobile App -> API Gateway
API Gateway -> Database
```

### Adding Users

Users are special - they're shown as bold anchors:

```mermaid
wardley
title Customer-Facing System

anchor Customers [0.95, 0.90]
component Mobile App [0.85, 0.75]
component Backend [0.65, 0.60]

Customers -> Mobile App
Mobile App -> Backend
```

---

## Part 3: Positioning Strategy

### Where Should Components Go?

Positioning is both an art and a science. Here's how to think about it:

**For Visibility (Y-axis):**

**High Visibility (0.8 - 1.0)**

- User interfaces
- Customer-facing features
- Mobile apps and websites
- _Example: "Shopping Cart" at 0.85_

**Medium Visibility (0.5 - 0.7)**

- APIs and services
- Business logic
- Integration layers
- _Example: "API Gateway" at 0.65_

**Low Visibility (0.3 - 0.5)**

- Databases
- Message queues
- Internal tools
- _Example: "PostgreSQL" at 0.40_

**Infrastructure (0.0 - 0.2)**

- Servers and networking
- Cloud platforms
- Basic utilities
- _Example: "AWS EC2" at 0.15_

**For Evolution (X-axis):**

**Genesis (0.0 - 0.25)**

- Brand new, experimental
- High uncertainty
- Changing rapidly
- Few people understand it
- _Example: "AI-Powered Recommendations" at 0.15_

**Custom (0.25 - 0.50)**

- Tailored to your needs
- Competitive advantage
- Still evolving
- Requires expertise
- _Example: "Proprietary Algorithm" at 0.40_

**Product (0.50 - 0.75)**

- Off-the-shelf solutions
- Multiple vendors available
- Well understood
- Some customization possible
- _Example: "Salesforce CRM" at 0.65_

**Commodity (0.75 - 1.0)**

- Standardized and stable
- Pay-as-you-go utilities
- Minimal differentiation
- Fully understood
- _Example: "AWS S3 Storage" at 0.90_

### Practical Positioning Example

```mermaid
wardley
title E-Commerce Positioning

anchor Shoppers [0.95, 0.90]

component "Product Recommendation" [0.80, 0.25]
component "Shopping Cart" [0.85, 0.65]
component "Payment Processing" [0.70, 0.85]
component "Cloud Hosting" [0.30, 0.95]

Shoppers -> "Product Recommendation"
Shoppers -> "Shopping Cart"
"Shopping Cart" -> "Payment Processing"
"Payment Processing" -> "Cloud Hosting"
```

In this example:

- Product Recommendation is highly visible but novel (competitive advantage)
- Shopping Cart is highly visible and productized (well-understood pattern)
- Payment Processing is less visible but highly commoditized (Stripe, etc.)
- Cloud Hosting is infrastructure and fully commoditized

---

## Part 4: Showing Evolution

### Evolution Arrows

One of the most powerful features of Wardley Maps is showing how components will evolve:

```mermaid
wardley
title Platform Evolution

component Custom Analytics [0.70, 0.35]
component Manual Reports [0.75, 0.20]

evolve Custom Analytics 0.65
evolve Manual Reports 0.55
```

The `evolve` command draws an arrow from the component's current position to where it's heading on the evolution axis.

### Custom Evolution Stages

Don't like Genesis → Custom → Product → Commodity? Define your own:

```mermaid
wardley
title Data Maturity Journey

evolution Unmodelled -> Divergent -> Convergent -> Modelled

component Raw Data [0.80, 0.05]
component Structured Data [0.70, 0.35]
component Data Products [0.60, 0.70]

evolve Structured Data 0.65
```

### Custom Stage Widths

Make stages different sizes to reflect reality:

```mermaid
wardley
title Realistic Evolution Stages

evolution Genesis@0.15 -> Custom@0.40 -> Product@0.70 -> Commodity@0.95

component "Novel AI Feature" [0.85, 0.10]
component "Core Platform" [0.70, 0.45]
component "Infrastructure" [0.30, 0.92]
```

The `@value` syntax sets where each stage ends.

### Dual-Label Stages

Use different labels for top and bottom of the map:

```mermaid
wardley
title Technical and Business Views

evolution Novel / Exploratory -> Emerging / Advancing -> Good / Stabilising -> Best / Accepted

component "Feature A" [0.80, 0.15]
component "Feature B" [0.70, 0.55]
```

This helps when different audiences need different terminology.

---

## Part 5: Relationships and Links

### Basic Dependencies

The simple arrow shows "depends on":

```mermaid
ComponentA -> ComponentB
```

### Flow Links

Show the direction of data or value flow:

```mermaid
wardley
title Data Flow Example

component Frontend [0.85, 0.75]
component Backend [0.65, 0.60]
component Cache [0.55, 0.70]
component Database [0.45, 0.50]

Frontend +> Backend
Backend +> Cache
Backend +> Database
Cache +< Database
```

The flow operators:

- `+>` means flow from left to right
- `+<` means flow from right to left
- `+<>` means bidirectional flow

### Labeled Links

Add text to explain relationships:

```mermaid
wardley
title Service Integration

component Mobile App [0.85, 0.75]
component Auth Service [0.70, 0.80]
component API Gateway [0.65, 0.65]

Mobile App "authenticates via" Auth Service
Mobile App "calls" API Gateway
```

---

## Part 6: Pipelines

### What Are Pipelines?

Pipelines show different evolutionary stages of a single component, all at the same visibility level. They're perfect for showing how something transforms over time.

### Basic Pipeline Syntax

```mermaid
wardley
title Database Evolution

component Database [0.57, 0.45]

pipeline Database {
  component "File-Based" [0.25]
  component "SQL Database" [0.50]
  component "Cloud Database" [0.80]
}
```

Notice that:

- The parent component sets the visibility (0.57)
- Pipeline components only specify evolution
- This shows the journey from genesis to commodity

### Real-World Pipeline Example

```mermaid
wardley
title Kettle Evolution Pipeline
size [1100, 800]

component Kettle [0.57, 0.45]
component Power [0.10, 0.70]

Kettle -> Power

pipeline Kettle {
  component "Campfire Kettle" [0.35] label [-60, 35]
  component "Electric Kettle" [0.53] label [-60, 35]
  component "Smart Kettle" [0.72] label [-30, 35]
}
```

This clearly shows how kettles evolved from campfire-heated to smart IoT devices.

### When to Use Pipelines

Use pipelines when:

- Showing product evolution over time
- Comparing maturity stages of similar components
- Planning migration paths
- Demonstrating technology evolution

---

## Part 7: Visual Elements

### Notes

Add explanatory text anywhere on the map:

```mermaid
wardley
title Strategic Annotations

component Database [0.50, 0.45]
component Cache [0.60, 0.70]

note Focus optimization efforts here [0.55, 0.60]
note Consider cloud migration [0.45, 0.35]
```

Notes help explain your strategic thinking and decision rationale.

### Annotations

Create numbered reference markers with descriptions:

```mermaid
wardley
title System Architecture

component Frontend [0.85, 0.75]
component API [0.65, 0.60]
component Database [0.45, 0.50]

annotations [0.90, 0.10]
annotation 1,[0.85, 0.70] React framework chosen for component reusability
annotation 2,[0.65, 0.55] RESTful API with GraphQL planned for Q3
annotation 3,[0.45, 0.45] PostgreSQL for ACID compliance requirements
```

The `annotations [x, y]` command positions the legend, while each annotation creates a numbered marker.

### Areas

Create visual grouping boxes:

```mermaid
wardley
title System Layers

area "Frontend Layer" [0.85, 0.80]
area "Backend Layer" [0.65, 0.60]
area "Data Layer" [0.45, 0.50]

component UI [0.85, 0.80]
component API [0.65, 0.60]
component Database [0.45, 0.50]
```

Areas help visualize logical boundaries, system layers, or team ownership.

---

## Part 8: Advanced Strategic Markers

### Source Strategies

Mark components with build vs. buy decisions:

```mermaid
wardley
title Build vs Buy Strategy

component "Custom CRM" [0.70, 0.40] (build)
component "Email Service" [0.60, 0.85] (buy)
component "Cloud Hosting" [0.30, 0.95] (market)
component "Analytics" [0.55, 0.50] (outsource)
```

**Four strategy options:**

- `(build)` - Build in-house for competitive advantage
- `(buy)` - Purchase vendor solution
- `(outsource)` - Contract to third party
- `(market)` - Use commodity utility

### Inertia

Mark components that resist change:

```mermaid
wardley
title Legacy System Constraints

component "Legacy Mainframe" [0.95, 0.15] (inertia)
component "Old Database" [0.80, 0.25] inertia
component "New Cloud Platform" [0.50, 0.85]

"Legacy Mainframe" -> "Old Database"
"New Cloud Platform" -> "Old Database"
```

Inertia indicates systems that are difficult to change due to:

- Technical dependencies
- Organizational politics
- Regulatory requirements
- High switching costs

### Accelerators

Forces that speed up evolution:

```mermaid
wardley
title Market Forces

component "Mobile Apps" [0.80, 0.60]
component "Cloud Services" [0.40, 0.90]

accelerator "Open Source Movement" [0.35, 0.85]
accelerator "API Economy" [0.70, 0.75]
accelerator "Serverless Computing" [0.38, 0.88]
```

### Deaccelerators

Forces that slow down evolution:

```mermaid
wardley
title Regulatory Constraints

component "Healthcare Platform" [0.85, 0.65]
component "Patient Records" [0.70, 0.40]

deaccelerator "HIPAA Compliance" [0.65, 0.35]
deaccelerator "Legacy Integration" [0.80, 0.20]
deaccelerator "Regulatory Approval Process" [0.75, 0.30]
```

---

## Part 9: Complete Real-World Examples

### Example 1: E-Commerce Platform Strategy

This example shows a complete e-commerce platform with build vs. buy decisions, evolution paths, and strategic notes.

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

**Key Strategic Insights:**

**Build for differentiation** - The mobile app and shopping cart are built in-house because they provide competitive advantage

**Buy commoditized services** - Email, CDN, and cloud hosting are purchased utilities

**Planned evolution** - The shopping cart and order management systems are evolving toward productization

**Infrastructure as commodity** - All infrastructure is treated as utility, minimizing operational overhead

### Example 2: SaaS Product Development Journey

This example shows how a SaaS product evolves through different maturity stages, with a pipeline showing the core engine's evolution.

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

**Key Strategic Insights:**

**Pipeline shows maturity** - The core engine pipeline illustrates the journey from MVP to enterprise-grade

**Build the core IP** - Analytics, UI, and core engine are built in-house for competitive advantage

**Outsource non-differentiating** - Notifications, search, and infrastructure are purchased

**Evolution targets** - Clear vision for where key components should evolve

### Example 3: Enterprise Digital Transformation

This example shows a traditional enterprise's journey from legacy systems to modern cloud-native architecture.

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

**Key Strategic Insights:**

**Strangler pattern** - The integration hub enables gradual migration from legacy to modern

**Inertia markers** - Legacy systems are explicitly marked as resistant to change

**Dual-speed IT** - Modern cloud-native services coexist with legacy systems

**Strategic forces** - Accelerators (cloud, DevOps) vs. deaccelerators (compliance, debt)

---

## Part 10: Best Practices

### Start Simple and Iterate

Don't try to map everything at once. Start with:

**Step 1: Identify your users**

```mermaid
anchor Customers [0.95, 0.90]
```

**Step 2: Add key components**

```mermaid
component Mobile App [0.85, 0.75]
component Backend API [0.65, 0.60]
component Database [0.45, 0.55]
```

**Step 3: Show dependencies**

```mermaid
Customers -> Mobile App
Mobile App -> Backend API
Backend API -> Database
```

**Step 4: Add evolution information**

```mermaid
evolve Backend API 0.75
evolve Database 0.80
```

Iterate from there, adding detail as needed.

### Use Meaningful Names

**Good:**

```mermaid
component User Authentication Service [0.70, 0.85]
component Payment Gateway Integration [0.60, 0.82]
component Customer Database [0.50, 0.70]
```

**Avoid:**

```mermaid
component Auth [0.70, 0.85]
component PG [0.60, 0.82]
component DB [0.50, 0.70]
```

Clear names make maps self-documenting and easier to discuss.

### Position Components Thoughtfully

Ask yourself these questions:

**For Visibility:**

- How visible is this to end users?
- Is it user-facing or infrastructure?
- Who directly interacts with it?

**For Evolution:**

- How mature is this component?
- How standardized is it?
- How many vendors offer it?
- Could we easily switch to alternatives?

### Show Strategic Intent

Use annotations to explain decisions:

```mermaid
annotation 1,[0.85, 0.70] Built in-house for competitive differentiation
annotation 2,[0.30, 0.90] Buy commodity to reduce operational costs
annotation 3,[0.65, 0.45] Outsource to focus engineering on core value
```

### Keep Maps Focused

Create multiple maps rather than one mega-map:

**Strategic map** - High-level business view for executives

**Technical map** - Detailed system architecture for engineers

**Team map** - What each team owns and maintains

**Product map** - Feature evolution and roadmap

### Version Control Your Strategy

Store maps in git alongside code:

```
/docs
  /strategy
    platform-architecture.md
    q1-2024-priorities.md
    build-vs-buy-decisions.md
```

This lets you:

- Track strategic evolution over time
- Review changes in pull requests
- Link to decisions in ADRs
- Collaborate on strategy like code

### Iterate Regularly

Maps are living documents:

**Quarterly reviews** - Update positions and evolution

**After major decisions** - Reflect changes in strategy

**Sprint planning** - Reference maps when prioritizing work

**Architecture reviews** - Use maps to guide technical decisions

### Align Similar Components

Keep consistency across maps:

```mermaid
# Keep cloud services in the same area
component AWS Lambda [0.25, 0.95]
component Google Cloud Run [0.26, 0.94]
component Azure Functions [0.25, 0.96]
```

### Add Context Liberally

```mermaid
note Migration planned for Q3 2024 [0.45, 0.55]
note Performance bottleneck - optimization needed [0.60, 0.45]
note Under active development [0.70, 0.40]
note Decommissioning in 6 months [0.85, 0.15]
```

### Document Your Reasoning

Use strategy markers and annotations together:

```mermaid
component Analytics Engine [0.65, 0.45] (build)
annotation 1,[0.65, 0.40] Core competitive advantage - proprietary algorithms
```

This captures not just what you're doing, but why.

---

## Part 11: Common Mistakes and How to Fix Them

### Mistake 1: Components Not Showing

**Problem:** Missing coordinates

```mermaid
# Wrong - no position specified
component Database
```

**Solution:** Always include [visibility, evolution]

```mermaid
# Correct
component Database [0.45, 0.60]
```

### Mistake 2: Links Not Connecting

**Problem:** Component names don't match exactly

```mermaid
# Wrong - case mismatch
component User Interface [0.85, 0.75]
User interface -> Database
```

**Solution:** Match names exactly, including case and spaces

```mermaid
# Correct
component User Interface [0.85, 0.75]
User Interface -> Database
```

### Mistake 3: Coordinates Seem Backwards

**Problem:** Using [x, y] instead of [visibility, evolution]

```mermaid
# Wrong - this puts user needs at bottom-right
component User Needs [0.05, 0.95]
```

**Solution:** Remember it's [visibility, evolution]

```mermaid
# Correct - user needs at top-left
component User Needs [0.95, 0.05]
```

### Mistake 4: Evolution Arrows Not Appearing

**Problem:** Component name doesn't exist or has typo

```mermaid
# Wrong
component Database [0.45, 0.60]
evolve database 0.80  # lowercase 'd'
```

**Solution:** Match the exact component name

```mermaid
# Correct
component Database [0.45, 0.60]
evolve Database 0.80
```

### Mistake 5: Pipeline Components Overlapping

**Problem:** Evolution values too close together

```mermaid
# Wrong - stages too close
pipeline Kettle {
  component Stage1 [0.50]
  component Stage2 [0.51]
  component Stage3 [0.52]
}
```

**Solution:** Space them out for clarity

```mermaid
# Correct
pipeline Kettle {
  component Stage1 [0.30]
  component Stage2 [0.55]
  component Stage3 [0.80]
}
```

### Mistake 6: Labels Overlapping Components

**Problem:** Default label positions cause overlaps

**Solution:** Use label offsets

```mermaid
component Kettle [0.43, 0.35] label [-57, 4]
component Power [0.10, 0.70] label [-27, 20]
```

The `label [x, y]` moves the text relative to the component position.

### Mistake 7: Map Too Crowded

**Solutions:**

Create multiple focused maps:

```mermaid
# Instead of one huge map, create:
# - strategic-overview.md
# - technical-details.md
# - infrastructure.md
```

Use areas for grouping:

```mermaid
area "Frontend" [0.85, 0.75]
area "Backend" [0.65, 0.60]
area "Data" [0.45, 0.50]
```

Increase canvas size:

```mermaid
wardley
title Large Complex System
size [1400, 1000]
```

### Mistake 8: Custom Stages Not Showing

**Problem:** Missing evolution declaration

```mermaid
# Wrong
component Data [0.70, 0.35]
```

**Solution:** Declare custom stages first

```mermaid
# Correct
evolution Genesis -> Custom -> Product -> Commodity
component Data [0.70, 0.35]
```

---

## Part 12: Quick Reference Guide

### Complete Syntax Overview

**Basic Structure:**

```mermaid
wardley
title Your Map Title
size [width, height]
```

**Custom Evolution Stages:**

```mermaid
evolution Stage1 -> Stage2 -> Stage3 -> Stage4
evolution Stage1@0.1 -> Stage2@0.4 -> Stage3@0.7 -> Stage4@0.95
evolution Label1 / AltLabel1 -> Label2 / AltLabel2 -> ...
```

**Components and Anchors:**

```mermaid
anchor Name [visibility, evolution]
component Name [visibility, evolution]
component "Name With Spaces" [vis, evo] label [x, y]
component Name [vis, evo] (build)
component Name [vis, evo] (buy)
component Name [vis, evo] (outsource)
component Name [vis, evo] (market)
component Name [vis, evo] (inertia)
component Name [vis, evo] inertia
```

**Links and Relationships:**

```mermaid
ComponentA -> ComponentB
ComponentA +> ComponentB
ComponentA +< ComponentB
ComponentA +<> ComponentB
ComponentA "label text" ComponentB
```

**Evolution Arrows:**

```mermaid
evolve ComponentName targetEvolution
```

**Pipelines:**

```mermaid
pipeline ParentComponent {
  component Stage1 [evolution1]
  component Stage2 [evolution2]
  component Stage3 [evolution3]
}
```

**Visual Elements:**

```mermaid
note Text content [visibility, evolution]
area "Label" [visibility, evolution]
accelerator "Label" [visibility, evolution]
deaccelerator "Label" [visibility, evolution]
```

**Annotations:**

```mermaid
annotations [visibility, evolution]
annotation 1,[vis, evo] Description text
annotation 2,[vis, evo] More description
```

### Coordinate Guidelines

**Visibility (Y-axis) ranges:**

- User-facing: 0.8 to 1.0
- Business logic: 0.5 to 0.7
- Support systems: 0.3 to 0.5
- Infrastructure: 0.0 to 0.2

**Evolution (X-axis) ranges:**

- Genesis (novel): 0.0 to 0.25
- Custom-built: 0.25 to 0.50
- Product/service: 0.50 to 0.75
- Commodity/utility: 0.75 to 1.0

---

## Conclusion: Your Strategic Mapping Journey Begins

You now have everything you need to create powerful Wardley Maps with Mermaid:

✅ Understanding of the coordinate system
✅ Knowledge of all syntax features
✅ Real-world examples to learn from
✅ Best practices for effective mapping
✅ Troubleshooting guide for common issues

### What Wardley Maps Help You Do

**Visualize your landscape** - See your entire value chain from users to infrastructure

**Make strategic decisions** - Know what to build, buy, or outsource

**Plan evolution** - Understand how components will mature over time

**Communicate effectively** - Share strategy with teams and stakeholders

**Align your organization** - Create shared understanding of priorities

### Getting Started Today

**Step 1:** Pick a system you know well (your current project, team's platform, or product)

**Step 2:** Start simple - identify users and key components

**Step 3:** Position components based on visibility and evolution

**Step 4:** Show dependencies with arrows

**Step 5:** Add strategic markers (build/buy, evolution, notes)

**Step 6:** Iterate and refine as understanding grows

### Remember

Maps are tools for thinking, not perfect representations of reality. They're meant to:

- Facilitate discussion
- Challenge assumptions
- Guide decisions
- Evolve with your understanding

Don't aim for perfection. Aim for clarity and shared understanding.

### Continue Learning

**Read Simon Wardley's book** - The definitive guide to Wardley Mapping (free online at medium.com/wardleymaps)

**Join the community** - community.wardleymaps.com has active discussions

**Practice regularly** - Map different scenarios to build intuition

**Share your maps** - Get feedback from colleagues and peers

**Iterate constantly** - Update maps as your strategy evolves

### Start Mapping

The best way to learn Wardley Mapping is to start creating maps. Begin with something simple, share it with your team, and iterate based on feedback.

Your strategic thinking will become clearer, your decisions more informed, and your communication more effective.

**Happy mapping!** 🗺️

---

_For more on Wardley Maps in Mermaid, visit the [official documentation](https://mermaid.js.org) or join the [Mermaid community](https://github.com/mermaid-js/mermaid)._

_Questions or feedback? Open an issue on the [Mermaid GitHub repository](https://github.com/mermaid-js/mermaid/issues)._
