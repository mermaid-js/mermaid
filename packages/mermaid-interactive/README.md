# @mermaid-js/mermaid-interactive

> Parameterised, interactive Mermaid diagrams — without modifying Mermaid core.

Adds two declarative layers on top of standard Mermaid:

- **Templates** — reusable diagram structures with named parameters
- **Interactions** — collapsible nodes, hover tooltips, and state toggling

## How It Works

```
Extended Mermaid (.mermid)
          │
          ▼
  Template & Interaction Preprocessor
          │  (expands templates, encodes interactions as %% comments)
          ▼
  Standard Mermaid (.mmd)
          │
          ▼
  Mermaid Renderer
          │
          ▼
  Post-render Interaction Binder
          │  (reads %% comments, attaches tooltips & collapse toggles)
          ▼
  Interactive SVG / HTML
```

## Installation

```bash
pnpm add @mermaid-js/mermaid-interactive
```

## CLI Usage

Preprocess an extended Mermaid file to standard Mermaid:

```bash
# Output to stdout
mermaid-interactive diagram.mermid

# Write to file
mermaid-interactive diagram.mermid diagram.mmd
```

## API Usage

### Preprocessor (Node / build tool)

```ts
import { preprocess } from '@mermaid-js/mermaid-interactive';

const source = `
template flow(name) {
  graph TD
    A[Start] --> B[name]
    B --> C[End]
    interaction B { tooltip: "Middle step" }
}
use flow(name="Process X")
`;

const { diagram, interactions } = preprocess(source);
// diagram → standard Mermaid with %% @interact comments
// interactions → parsed interaction definitions
```

### Binder (Browser)

```ts
import mermaid from 'mermaid';
import { preprocess } from '@mermaid-js/mermaid-interactive';
import { bind } from '@mermaid-js/mermaid-interactive/binder';

const source = document.querySelector('.mermaid-interactive')!.textContent!;
const { diagram } = preprocess(source);

const { svg } = await mermaid.render('diagram-id', diagram);
container.innerHTML = svg;

const svgEl = container.querySelector('svg')!;
bind(svgEl, diagram); // attaches tooltips and collapse toggles
```

## Extended Syntax Quick Reference

### 1. Template Definition

```text
template <name>(<scalar>, <array>[]) {
  graph TD
    A[scalar] --> B[array[0]]
}
```

### 2. Template Invocation

```text
use <name>(
  scalar="My Value",
  array=["Item A", "Item B"]
)
```

### 3. Interaction Block

Inside or outside a template:

```text
interaction <nodeId> {
  collapsible: true
  defaultState: collapsed
  tooltip: "Description text"
}
```

## Supported Interaction Properties

| Property       | Type                      | Description                         |
| -------------- | ------------------------- | ----------------------------------- |
| `tooltip`      | string                    | Floating tooltip on hover           |
| `collapsible`  | boolean                   | Enable collapse/expand toggle       |
| `defaultState` | `expanded` \| `collapsed` | Initial state for collapsible nodes |

## Examples

See [`examples/`](./examples/) for ready-to-use `.mermid` files:

- [`basic.mermid`](./examples/basic.mermid) — inline interaction blocks, no templates
- [`template.mermid`](./examples/template.mermid) — parameterised template with interactions
- [`combined.mermid`](./examples/combined.mermid) — microservice group pattern

## Static / Documentation Fallback

When the JS binder is absent (GitHub, GitLab, PDF export), diagrams render
as plain Mermaid. All `%%` metadata comments are hidden by Mermaid's renderer.
No broken output. No user action required.

## Compatibility

| Environment              | Templates               | Interactions |
| ------------------------ | ----------------------- | ------------ |
| MkDocs + MkDocs-Material | ✅ (with plugin hook)   | ✅ (with JS) |
| Docusaurus               | ✅ (with remark plugin) | ✅ (with JS) |
| GitHub Markdown          | ✅ (static)             | ✗            |
| GitLab Markdown          | ✅ (static)             | ✗            |
| Static SVG / PNG         | ✅ (static)             | ✗            |

## Full Syntax Specification

See [`docs/syntax-spec.md`](./docs/syntax-spec.md).

## Licence

MIT
