# @mermaid-js/mermaid-flowchart-drag

**Standalone drag-and-drop plugin for mermaid flowcharts.**

Works on the **rendered SVG DOM** — no dependency on mermaid runtime internals. Attach it to any flowchart SVG and users can freely reposition nodes with smooth bezier edge updates.

## Quick start

```html
<pre class="mermaid">
flowchart LR
  A[Start] --> B[End]
</pre>

<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
  import { FlowchartDrag } from 'https://cdn.jsdelivr.net/npm/@mermaid-js/mermaid-flowchart-drag/dist/index.js';

  await mermaid.run({ nodes: document.querySelectorAll('.mermaid') });

  const svg = document.querySelector('.mermaid svg');
  const drag = new FlowchartDrag(svg);
  drag.enable();
</script>
```

## Why standalone?

The plugin never touches mermaid's internal data structures. It reads the SVG DOM
to find `<g class="node">` elements, extracts their current transforms, listens
for pointer events, and rewrites edge `d` paths using a cubic-bezier algorithm.

This means:

- **No fork, no patch** — works with any version of mermaid
- **No imports from `mermaid`** — pure DOM API
- **Plug-and-play** — attach to any rendered flowchart SVG

## Features

- Smooth cubic-bezier S-curves for edge paths
- Rectangle-boundary intersection for clean edge endpoints
- Edge labels follow the updated bezier curve
- Undo / redo stack (Ctrl+Z / Ctrl+Shift+Z)
- Programmatic enable / disable / destroy
- ViewBox expansion so nodes can be dragged outside initial bounds

## API

### `new FlowchartDrag(svg, config?)`

| Param    | Type                  | Description                        |
| -------- | --------------------- | ---------------------------------- |
| `svg`    | `SVGSVGElement`       | The rendered flowchart SVG element |
| `config` | `FlowchartDragConfig` | Optional settings (see below)      |

### Config options

| Option               | Default | Description                                   |
| -------------------- | ------- | --------------------------------------------- |
| `enableKeyboardUndo` | `true`  | Listen for Ctrl+Z / Ctrl+Shift+Z              |
| `maxUndoStack`       | `50`    | Max undo steps                                |
| `expandViewBox`      | `true`  | Expand viewBox so nodes can be dragged freely |
| `viewBoxPadding`     | `80`    | Padding added when expanding viewBox          |
| `onDragStart`        | —       | `(nodeId, pos) => void`                       |
| `onDrag`             | —       | `(nodeId, pos) => void`                       |
| `onDragEnd`          | —       | `(nodeId, pos) => void`                       |

### Methods

- `.enable()` — start listening for drag
- `.disable()` — stop listening
- `.undo()` / `.redo()` — undo / redo last move
- `.getNodePositions()` — `Record<string, {x, y}>`
- `.refresh()` — re-parse SVG after mermaid re-renders
- `.destroy()` — full cleanup

## Build

```sh
pnpm build
```
