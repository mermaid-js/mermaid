# 📊 Layout Algorithms in Mermaid

Mermaid is a popular JavaScript-based diagramming tool that supports auto-layout for graphs using pluggable layout engines. Layout algorithms play a critical role in rendering nodes and edges in a clean, readable, and meaningful way. Mermaid currently uses engines like **Dagre** and **ELK**, and will soon introduce a powerful new layout engine: **IPSep-CoLa**.

---

## 🔹 Dagre Layout

**Dagre** is a layout engine inspired by the **Sugiyama algorithm**, optimized for directed acyclic graphs (DAGs). It arranges nodes in layers and computes edge routing to minimize crossings and improve readability.

### Key Features:

- **Layered (Sugiyama-style) layout**: Ideal for top-down or left-to-right flow.
- **Edge routing**: Attempts to reduce edge crossings and bends.
- **Ranking**: Vertices are assigned ranks to group related elements into the same level.
- **Lightweight and fast**: Suitable for small to medium-sized graphs.

### Technical Overview:

- Works in four stages:
  1. **Cycle Removal**
  2. **Layer Assignment**
  3. **Node Ordering**
  4. **Coordinate Assignment**
- Outputs crisp layouts where edge direction is clear and logical.

### Limitations:

- No native support for **grouped or nested structures**.
- Not ideal for graphs with **non-hierarchical** or **dense cyclic connections**.
- Limited edge label placement capabilities.

---

## 🔸 ELK (Eclipse Layout Kernel)

**ELK** is a modular, extensible layout framework developed as part of the Eclipse ecosystem. It supports a wide variety of graph types and layout strategies.

### Key Features:

- **Multiple layout styles**: Hierarchical, force-based, layered, orthogonal, etc.
- **Support for ports**: Allows fine-grained edge anchoring on specific sides of nodes.
- **Group and hierarchy awareness**: Ideal for nested and compartmentalized diagrams.
- **Rich configuration**: Offers control over spacing, edge routing, direction, padding, and more.

### Technical Overview:

- Uses a **model-driven approach** with a well-defined intermediate representation (ELK Graph Model).
- Different engines are plugged in depending on the chosen layout strategy.
- Works well with large, complex, and deeply nested graphs.

### Limitations:

- Requires verbose configuration for best results.
- Can be slower than Dagre for small or simple diagrams.
- More complex to integrate and control dynamically.

---

## 🆕 IPSep-CoLa

### 🌐 Introduction

**IPSep-CoLa** stands for **Incremental Procedure for Separation Constraint Layout**, a next-generation layout algorithm tailored for **grouped, nested, and labeled graphs**. It is an enhancement over standard force-directed layouts, offering constraint enforcement and iterative refinement.

It is particularly useful for diagrams where:

- **Group integrity** is important (e.g., modules, clusters).
- **Edge labels** need smart placement.
- **Overlaps** must be prevented even under tight space constraints.

---

### ⚙️ How IPSep-CoLa Works

#### 1. **Constraint-Based Force Simulation**:

It builds on top of standard force-directed approaches (like CoLa), but adds **constraints** to influence the final positions of nodes:

- **Separation constraints**: Minimum distances between nodes, edge labels, and groups.
- **Containment constraints**: Child nodes must stay within the bounds of parent groups.
- **Alignment constraints**: Nodes can be aligned in rows or columns if desired.

#### 2. **Incremental Refinement**:

Unlike one-pass algorithms, IPSep-CoLa works in **phases**:

- Initial layout is produced using a base force simulation.
- The layout is iteratively adjusted using **constraint solvers**.
- Additional forces (spring, collision avoidance, containment) are incrementally added.

#### 3. **Edge Label Handling**:

One of the distinguishing features of IPSep-CoLa is its support for **multi-segment edge routing with mid-edge label positioning**, ensuring labels do not clutter or overlap.

---

### 📌 Use Cases

IPSep-CoLa is ideal for:

- **Hierarchical graphs** with complex nesting (e.g., software architecture, UML diagrams).
- **Clustered views** (e.g., social network groupings).
- **Diagrams with heavy labeling** where label placement affects readability.
- **Diagrams with strict visual structure** needs — maintaining boundaries, margins, or padding.

---

## 🔍 Comparison Table

| Feature                   | Dagre       | ELK                 | IPSep-CoLa (Upcoming)          |
| ------------------------- | ----------- | ------------------- | ------------------------------ |
| Layout Type               | Layered DAG | Modular (varied)    | Constraint-driven force layout |
| Edge Labeling             | ⚠️ Basic    | ✅ Yes              | ✅ Smart Placement             |
| Overlap Avoidance         | ⚠️ Partial  | ✅ Configurable     | ✅ Automatic                   |
| Layout Performance        | ✅ Fast     | ⚠️ Medium           | ⚠️ Medium                      |
| Customization Flexibility | ⚠️ Limited  | ✅ Extensive        | ✅ Moderate to High            |
| Best For                  | Simple DAGs | Complex hierarchies | Grouped and labeled graphs     |

---

## 🧾 Summary

Each layout engine in Mermaid serves a different purpose:

- **Dagre** is best for fast, simple, and readable DAGs.
- **ELK** is powerful for modular, layered, or port-based diagrams with a need for rich customization.
- **IPSep-CoLa** will soon offer a flexible, constraint-respecting layout engine that excels at **visual clarity in grouped and complex diagrams**.

The addition of IPSep-CoLa to Mermaid's layout stack represents a significant leap forward in layout control and quality — making it easier than ever to visualize rich, structured, and annotated graphs.

---
