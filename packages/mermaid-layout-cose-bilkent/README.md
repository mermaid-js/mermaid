# @mermaid-js/layout-cose-bilkent

The [cose-bilkent](https://github.com/cytoscape/cytoscape.js-cose-bilkent) layout engine for Mermaid, which mindmaps use by default.

`mermaid` bundles and registers this layout, so most projects don't need this package. It lets builds that ship without it, such as the tiny build (`mermaid.tiny.js`), use `layout: cose-bilkent`:

```js
import mermaid from 'mermaid';
import coseBilkentLayouts from '@mermaid-js/layout-cose-bilkent';

mermaid.registerLayoutLoaders(coseBilkentLayouts);
```
