# Tidy-tree Layout Instructions

Instructions to use the Tidy-tree layout algorithm.

## Getting Started

### Installation

```bash
npm install non-layered-tidy-tree-layout
# or
yarn add non-layered-tidy-tree-layout

```

There's also a built version: `dist/non-layered-tidy-tree-layout.js` for use with browser `<script>` tag, or as a Javascript module.

## Tidy tree Layouts

Mermaid also supports a Tidy Tree layout for mindmaps.

```
---
config:
  layout: tidy-tree
---
mindmap
root((mindmap is a long thing))
  A
  B
  C
  D
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
