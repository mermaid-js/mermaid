# @mermaid-js/mermaid-ssr

Renders Mermaid diagrams in Node without a browser. A JSDOM document stands in for the DOM, and the browser measurement APIs (`getBBox`, `getComputedTextLength`, `getBoundingClientRect`) are replaced by estimators that read real font metrics through [opentype.js](https://github.com/opentypejs/opentype.js).

Fonts are resolved from the diagram's CSS `font-family` list: system font directories are searched first, then the bundled Liberation Sans (metric-compatible with Arial) is used.

```bash
pnpm build:mermaid
pnpm --filter @mermaid-js/mermaid-ssr render diagram.mmd out.svg
echo 'flowchart TD; A-->B' | pnpm --filter @mermaid-js/mermaid-ssr render
pnpm --filter @mermaid-js/mermaid-ssr render:examples
```
