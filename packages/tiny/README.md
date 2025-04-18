# Tiny Mermaid

This is a tiny version of mermaid that is optimized for the web. It is a subset of the mermaid library and is designed to be used in the browser via CDN.

## Lazy loading

The original mermaid library supports lazy loading, so it will be faster on the initial load, and only load the required diagrams.
This is not supported in the tiny mermaid library. So it's always recommended to use the full mermaid library unless you have a very specific reason to reduce the bundle size.

## Removals from mermaid

This does not support

- Mindmap Diagram
- Architecture Diagram
- Katex rendering
- Lazy loading

## Usage via NPM

This package is not meant to be installed directly from npm. It is designed to be used via CDN.
If you need to use mermaid in your project, please install the full [`mermaid` package](https://www.npmjs.com/package/mermaid) instead.

## Usage via CDN

### Latest version

```html
<script src="https://cdn.jsdelivr.net/npm/@mermaid-js/tiny/dist/mermaid.tiny.js"></script>
```

### Specific version

```html
<!-- Format -->
<script src="https://cdn.jsdelivr.net/npm/@mermaid-js/tiny@<MERMAID_MAJOR_VERSION>/dist/mermaid.tiny.js"></script>

<!-- Pinning major version -->
<script src="https://cdn.jsdelivr.net/npm/@mermaid-js/tiny@11/dist/mermaid.tiny.js"></script>

<!-- Pinning specific version -->
<script src="https://cdn.jsdelivr.net/npm/@mermaid-js/tiny@11.6.0/dist/mermaid.tiny.js"></script>
```
