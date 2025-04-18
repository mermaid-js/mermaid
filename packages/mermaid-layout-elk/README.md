# @mermaid-js/layout-elk

This package provides a layout engine for Mermaid based on the [ELK](https://www.eclipse.org/elk/) layout engine.

> [!NOTE]  
> The ELK Layout engine will not be available in all providers that support mermaid by default.
> The websites will have to install the `@mermaid-js/layout-elk` package to use the ELK layout engine.

## Usage

```
flowchart-elk TD
  A --> B
  A --> C
```

```
---
config:
  layout: elk
---

flowchart TD
  A --> B
  A --> C
```

```
---
config:
  layout: elk.stress
---

flowchart TD
  A --> B
  A --> C
```

### With bundlers

```sh
npm install @mermaid-js/layout-elk
```

```ts
import mermaid from 'mermaid';
import elkLayouts from '@mermaid-js/layout-elk';

mermaid.registerLayoutLoaders(elkLayouts);
```

### With CDN

```html
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
  import elkLayouts from 'https://cdn.jsdelivr.net/npm/@mermaid-js/layout-elk@11/dist/mermaid-layout-elk.esm.min.mjs';

  mermaid.registerLayoutLoaders(elkLayouts);
</script>
```

## Supported layouts

- `elk`: The default layout, which is `elk.layered`.
- `elk.layered`: Layered layout
- `elk.stress`: Stress layout
- `elk.force`: Force layout
- `elk.mrtree`: Multi-root tree layout
- `elk.sporeOverlap`: Spore overlap layout

<!-- TODO: Add images for these layouts, as GitHub doesn't support natively -->
