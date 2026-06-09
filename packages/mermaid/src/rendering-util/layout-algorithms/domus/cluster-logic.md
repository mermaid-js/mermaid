# Cluster Handling Semantics Reference

## Overview

## 1. Cluster Identification

**Key properties on `Node` type:**

- `isGroup: boolean` - Marks a node as a cluster/group container
- `parentId: string` - References the parent cluster (for nested hierarchies)

## 2. Node Sorting for Rendering Order

Groups are sorted to the **end of the node list** by area (largest first):

```typescript
function sortGroupNodesToEnd(nodes: Node[]): Node[] {
  const nonGroupNodes = nodes.filter((n) => !n.isGroup);
  const groupNodes = nodes
    .filter((n) => n.isGroup)
    .sort((a, b) => b.width * b.height - a.width * a.height);
  return [...nonGroupNodes, ...groupNodes];
}
```

---

## 3. Cluster Bounds Calculation

Groups are sized to **contain all their children** with padding:

```typescript
function calculateGroupBounds(group, children, edges, nodeMap) {
  // Calculate bounding box of all children (including nested groups)
  bounds = { minX, minY, maxX, maxY };

  // Include edge labels between children
  // Include edge routing points within group

  // Apply padding
  bounds.minX -= groupPadding;
  bounds.minY -= groupPadding;
  bounds.maxX += groupPadding;
  bounds.maxY += groupPadding;

  // Group center = bounding box center
  group.x = (bounds.minX + bounds.maxX) / 2;
  group.y = (bounds.minY + bounds.maxY) / 2;
  group.width = bounds.maxX - bounds.minX + groupPadding * 2;
  group.height = bounds.maxY - bounds.minY + groupPadding * 2;
}
```

---

## 4. Hierarchical Processing Order

Groups are processed **bottom-up** (children before parents):

```typescript
function processGroupHierarchy(groupIds: string[]) {
  groupIds.forEach((groupId) => {
    const childGroups = groupHierarchy.get(groupId) ?? [];
    if (childGroups.length > 0) {
      processGroupHierarchy(childGroups); // Process children first
    }
  });

  // Then process current level groups
  groupIds.forEach((groupId) => {
    // Calculate bounds and position
  });
}
```

---

## 5. Layer Management for Groups

Groups inherit layers from their relationships:

```typescript
// Groups get layer = max(source layers) + 1 for incoming edges
// Children must have layer >= parent layer
// Groups' layers propagate to children
```

---

## 6. Group Overlap Resolution

**Same-layer groups**: Move horizontally only
**Different-layer groups**: Move vertically only

```typescript
function resolveGroupOverlaps(data4Layout, groupPadding, nodeMap) {
  const MIN_SPACING = 100;

  while (hasOverlaps && maxIterations > 0) {
    for each pair of groups (g1, g2) {
      if (g1.parentId !== g2.parentId) continue;  // Only same parent

      if (sameLayers) {
        // Horizontal separation only
        separation.x = overlapX + MIN_SPACING;
        // Keep same Y
      } else {
        // Vertical separation only
        separation.y = overlapY + MIN_SPACING;
        // Keep same X
      }

      displaceGroup(g1, separation.group1, data4Layout);
      displaceGroup(g2, separation.group2, data4Layout);
    }
  }
}
```

---

## 7. Child Containment Validation

Nodes that accidentally overlap groups they don't belong to are moved outside:

```typescript
function checkAllChildrenInGroup(data4Layout) {
  // Clean up invalid parent references
  // For each node NOT belonging to a group but inside its bounds:
  //   - Find closest boundary
  //   - Move node outside that boundary with offset
}
```

---

## 8. Group Displacement

When moving a group, **all descendants move together**:

```typescript
function displaceGroup(group, displacement, data4Layout) {
  group.x += displacement.x;
  group.y += displacement.y;

  const moveChildren = (parentId) => {
    data4Layout.nodes.forEach((node) => {
      if (node.parentId === parentId) {
        node.x += displacement.x;
        node.y += displacement.y;
        if (node.isGroup) moveChildren(node.id); // Recursive
      }
    });
  };
  moveChildren(group.id);
}
```

---

## 9. Key Configuration Parameters

```typescript
interface ColaOptions {
  groupAttraction?: number; // Force pulling children toward center (default: 0.01)
  groupPadding?: number; // Space around children inside group (default: 15)
}

// In resolveGroupOverlaps
const MIN_SPACING = 100; // Minimum gap between sibling groups
```

---

## 10. Force-Based Group Cohesion

During iteration, children are attracted to their group's center:

```typescript
// Calculate group centers from children positions
groupCenters.forEach((group) => {
  group.x /= group.count; // Average of child x positions
  group.y /= group.count; // Average of child y positions
});

// Apply attraction force
if (node.parentId) {
  const groupCenter = groupCenters.get(node.parentId);
  const force = groupAttraction * distance * attractionFactor * cooling;
  displacements[node.id].x += (dx / dist) * force;
  displacements[node.id].y += (dy / dist) * force;
}
```

---

## Summary Flow

1. **Decompose** graph into core (cyclic) and tree components
2. **Layout core** nodes with layer assignment
3. **Reinsert tree** nodes with subtree centering
4. **Assign layers** to groups based on edge relationships
5. **Apply force-directed** positioning (applyHola) with group attraction
6. **Sort groups** to end (largest first for rendering)
7. **Calculate group bounds** bottom-up
8. **Resolve overlaps** between sibling groups
9. **Validate containment** - move misplaced nodes outside
10. **Route edges** orthogonally
11. **Final bounds** recalculation
