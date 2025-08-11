# @mermaid-js/layout-tidy-tree

This package provides a bidirectional tidy tree layout engine for Mermaid based on the non-layered-tidy-tree-layout algorithm.

> [!NOTE]
> The Tidy Tree Layout engine will not be available in all providers that support mermaid by default.
> The websites will have to install the @mermaid-js/layout-tidy-tree package to use the Tidy Tree layout engine.

## Usage

```
---
config:
  layout: tidy-tree
---
mindmap
root((mindmap))
  A
  B
```

### With bundlers

```sh
npm install @mermaid-js/layout-tidy-tree
```

```ts
import mermaid from 'mermaid';
import tidyTreeLayouts from '@mermaid-js/layout-tidy-tree';

mermaid.registerLayoutLoaders(tidyTreeLayouts);
```

### With CDN

```html
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
  import tidyTreeLayouts from 'https://cdn.jsdelivr.net/npm/@mermaid-js/layout-tidy-tree@0/dist/mermaid-layout-tidy-tree.esm.min.mjs';

  mermaid.registerLayoutLoaders(tidyTreeLayouts);
</script>
```

## Tidy Tree Layout Overview

tidy-tree: The bidirectional tidy tree layout

The bidirectional tidy tree layout algorithm creates two separate trees that grow horizontally in opposite directions from a central root node:
Left tree: grows horizontally to the left (children alternate: 1st, 3rd, 5th...)
Right tree: grows horizontally to the right (children alternate: 2nd, 4th, 6th...)

This creates a balanced, symmetric layout that is ideal for mindmaps, organizational charts, and other tree-based diagrams.

Layout Structure:
[Child 3] ← [Child 1] ← [Root] → [Child 2] → [Child 4]
↓ ↓ ↓ ↓
[GrandChild] [GrandChild] [GrandChild] [GrandChild]
