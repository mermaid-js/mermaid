# @mermaid-js/layout-elk

The [ELK](https://www.eclipse.org/elk/) layout engine for Mermaid.

> [!IMPORTANT]
> **Most projects no longer need this package.** ELK is bundled with `mermaid`
> and registered automatically, and it is the default layout — a plain
> `flowchart` is laid out with ELK without any configuration.
>
> This package exists for Mermaid builds that ship without ELK, which today
> means the **tiny** build (`mermaid.tiny.js`). There, registering it is the
> only way to get an ELK layout.

## Do I need it?

| Using                                   | Need this package?                      |
| --------------------------------------- | --------------------------------------- |
| `mermaid` (any normal build, incl. CDN) | No — ELK is built in and is the default |
| `mermaid.tiny.js`                       | Yes, if you want ELK                    |

If you are on a normal build, delete the dependency and the registration call:

```diff
  import mermaid from 'mermaid';
- import elkLayouts from '@mermaid-js/layout-elk';
-
- mermaid.registerLayoutLoaders(elkLayouts);
```

Registering it anyway is harmless — it re-registers the same layouts — but it
loads a second copy of the layout code for no benefit.

## Usage

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
  import elkLayouts from 'https://cdn.jsdelivr.net/npm/@mermaid-js/layout-elk@0/dist/mermaid-layout-elk.esm.min.mjs';

  mermaid.registerLayoutLoaders(elkLayouts);
</script>
```

## Supported layouts

- `elk` — the default, which is `elk.layered`
- `elk.stress` — stress layout
- `elk.force` — force layout
- `elk.mrtree` — multi-root tree layout
- `elk.sporeOverlap` — spore overlap layout
- `elk.box` — box packing
- `elk.rectpacking` — rectangle packing

```
---
config:
  layout: elk.stress
---

flowchart TD
  A --> B
  A --> C
```

A single container can also select its own algorithm with `@{ algorithm: … }`,
which additionally accepts `elk.layered` and `elk.radial`.

<!-- TODO: Add images for these layouts, as GitHub doesn't support natively. -->
