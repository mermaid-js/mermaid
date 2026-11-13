# @mermaid-js/plugin-katex

[KaTeX](https://katex.org/) math rendering for Mermaid.

`mermaid` bundles and registers it, so most projects don't need this package. It's for Mermaid builds that ship without it, such as the tiny build (`mermaid.tiny.js`):

```js
import mermaid from 'mermaid';
import loadKatex from '@mermaid-js/plugin-katex';

mermaid.registerKatex(loadKatex);
```
