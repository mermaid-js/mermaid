---
description: 'Try the Mermaid v13 alpha: a plugin-based, DOM-free proof of concept of a rewritten rendering engine. Install it, render flowcharts in Node, workers or the browser, and tell us what breaks.'
outline: 'deep' # shows all h3 headings in outline in Vitepress
---

# Try the Mermaid v13 alpha

```tip
**This alpha is a proof of concept.** It tries one path for Mermaid v13, a full rewrite of the rendering engine. The other path is to bring the same gains to v12 in gradual updates. Your feedback in the [v13 discussion](https://github.com/orgs/mermaid-js/discussions/8685) decides which one we take.
```

The alpha renders without a browser DOM, so it works in Node, Deno, web workers and browsers. Its output is deterministic, and it has no third-party runtime dependencies. We publish alphas while we build the proof of concept. Please try them and tell us what breaks.

```warning
This is an **alpha**. Don't use it in production. APIs, output and defaults can change between alpha releases.
```

## What works in the alpha

- **Flowcharts only.** Flowchart is the only diagram type with a v13 renderer so far. Mermaid still detects every other v12 diagram type, but rendering one fails with an `UNSUPPORTED_DIAGRAM` error until that type is ported.
- **ESM only, Node 20 or newer.** The alpha ships no `mermaid.min.js`, IIFE or "tiny" build. Bundle it with your own bundler (Vite, webpack, esbuild, Rollup, …).
- **New output formats.** Flowcharts render to SVG, and also to text (ASCII or Unicode box drawing).

## Install

Alphas have their own `v13-alpha` dist-tag, so `mermaid@latest` stays on v12:

```bash
npm install mermaid@v13-alpha
# or
pnpm add mermaid@v13-alpha
```

### Alpha builds

We publish alpha builds often, numbered `13.0.0-alpha.1`, `13.0.0-alpha.2`, `13.0.0-alpha.3` and so on. The `v13-alpha` tag always points to the newest build.

- **Pin an exact build.** Any build can change APIs or output, so a version range could pull in a breaking change without you noticing:

  ```bash
  npm install mermaid@13.0.0-alpha.3 --save-exact
  ```

- **Move to the newest build** when you're ready, and read the release notes for what changed:

  ```bash
  npm install mermaid@v13-alpha --save-exact
  ```

- **See which builds exist:**

  ```bash
  npm view mermaid versions --json | grep 13.0.0-alpha
  ```

- **Retest on the newest build before you report a problem.** It may already be fixed.

## Render a diagram

`render`, `parse`, `initialize` and `run` take the same arguments as in v12. Existing code like this keeps working:

```js
import mermaid from 'mermaid';

mermaid.initialize({ theme: 'default' });

const { svg } = await mermaid.render(
  'my-diagram',
  `flowchart LR
    A[Start] --> B{Works?}
    B -- Yes --> C[Ship it]
    B -- No --> D[File an issue]`
);
document.querySelector('#container').innerHTML = svg;
```

`run()` and `startOnLoad` still render every `.mermaid` element on the page.

## Things you can only do in v13

**Render on the server, with no DOM or jsdom:**

```js
// Node script, no browser needed
import mermaid from 'mermaid';

const { svg, width, height, warnings } = await mermaid.render('id', 'flowchart LR\n  A --> B');
```

**Render to text:**

```js
const { text } = await mermaid.render('id', 'flowchart LR\n  A --> B', { format: 'ascii' });
console.log(text);
```

**Use the command line:**

```bash
npx mermaid@v13-alpha render diagram.mmd --format ascii
npx mermaid@v13-alpha render diagram.mmd --format svg > diagram.svg
```

**Use structured errors.** A failed render rejects with a `MermaidError` that has a `code` (`SYNTAX`, `UNSUPPORTED_DIAGRAM`, `LIMIT`, …) plus `line` and `column`, instead of raw parser text.

**Keep a diagram live:** `mermaid.mount(element, text)` renders into an element and gives you `update(text)` and `destroy()`.

## Before you upgrade an existing site

Most v12 setups render without code changes. Check these first. Like everything on this page, they describe the alpha and may change.

- `mermaidAPI.*` has been removed. Use the top-level functions (`initialize`, `render`, …).
- Labels are SVG text, not HTML, so `htmlLabels` and `dompurifyConfig` no longer apply. Whether HTML labels come back, for example as an opt-in plugin, is [open for discussion](https://github.com/orgs/mermaid-js/discussions/8685).
- Click callbacks (`click A callback`, `call fn()`) need the `@mermaid-js/plugin-interactions` plugin. Links (`click A "url"`) work without it.
- `securityLevel: 'loose'` now behaves like `default`.
- Custom CSS that targets element ids, `<marker>`, `.label-container` or the `<style>` element inside the SVG must move to the kept class names and the `--mermaid-*` CSS variables.

## Give feedback

Report bugs as issues. If a diagram renders differently from v12, or something breaks, [open a v13 alpha bug report](https://github.com/mermaid-js/mermaid/issues/new?template=v13_alpha_bug.yml). The template adds the `v13` label and asks for:

- the exact alpha build, e.g. `13.0.0-alpha.3` (`npm ls mermaid` shows it)
- the diagram source
- what you expected, and what you got (a screenshot helps)

Opinions about the direction belong in the [v13 discussion](https://github.com/orgs/mermaid-js/discussions/8685): rewrite or gradual updates, which trade-offs you can live with, and what you would give up for a smaller, faster Mermaid.
