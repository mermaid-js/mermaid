# ELK Diagram Rendering Fixes

## Problem
The ELK layout demo files (`flowchart-elk-force.html`, `flowchart-elk-stress.html`, etc.) contained invalid Mermaid diagram syntax that caused rendering to fail with "Syntax error in text mermaid version 11.16.0".

## Root Cause
- **Invalid diagram type**: `flowchart-elk` is not a recognized Mermaid diagram type in version 11.16.0
- **Correct syntax**: Use `flowchart TD` (or other standard diagram types) with ELK layout configuration applied separately

## Changes Made

### 1. Static Examples (all demo files)
Fixed the following files by replacing `flowchart-elk TD` with `flowchart TD`:
- ✅ `demos/flowchart-elk.html`
- ✅ `demos/flowchart-elk-force.html` (Examples 1 & 2)
- ✅ `demos/flowchart-elk-stress.html` (Examples 1 & 2)
- ✅ `demos/flowchart-elk-force-vs-stress.html` (Force & Stress examples)

### 2. Dynamic Diagram Generation
Fixed `generateMermaidDiagram()` function in both force and stress demos:
```javascript
// OLD (INVALID):
let mermaidCode = `flowchart-elk TD\n`;

// NEW (VALID):
let mermaidCode = `flowchart TD\n`;
```

### 3. Dynamic Diagram Rendering
Improved `updateDynamicDiagram()` function to properly reset Mermaid's internal state:
```javascript
// Remove the data-processed attribute to allow Mermaid to re-process
diagramElement.removeAttribute('data-processed');

// Clear the diagram element and set new code
diagramElement.textContent = mermaidCode;

// Trigger mermaid re-render
mermaid.run();
```

## How ELK Layout is Applied
Instead of using an invalid diagram type, ELK layout is configured via:

1. **Mermaid initialization** (in `<script>` block):
```javascript
mermaid.registerLayoutLoaders(layouts);
mermaid.initialize({
  flowchart: {
    layout: 'elk',
    elk: {
      algorithm: 'elk.stress',  // or 'elk.force'
      stressDesiredEdgeLength: 100,
      stressEpsilon: 0.0001,
    },
  },
});
```

2. **Per-diagram config** (using Mermaid init directive):
```mermaid
%%{init: {'elk': {'algorithm': 'elk.force'}}}%%
flowchart TD
  A --> B
```

## Verification
All demos should now:
- ✅ Load without syntax errors
- ✅ Render flowcharts with ELK layout algorithms (stress-minimization or force-directed)
- ✅ Support dynamic node/edge count adjustment via sliders
- ✅ Trigger proper diagram re-rendering on control changes

## Files Not Modified
Test/Cypress files retain `flowchart-elk` syntax for backwards compatibility testing:
- `cypress/platform/ashish2.html`
- `cypress/platform/flow-elk.html`
- `cypress/platform/knsv2.html`

These are intentionally left unchanged as they may be used for regression testing.
