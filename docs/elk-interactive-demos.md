# ELK Interactive Demos Guide

## Overview

The ELK layout demos now include **interactive parameter controls** that let you adjust layout algorithms in real-time and see live diagram updates. This is perfect for:

- **Learning** how different parameters affect layout
- **Testing** optimal settings for your diagrams
- **Experimenting** with algorithm variations
- **Sharing** configurations via the copy-to-clipboard feature

## Force-Directed Layout Demo

**File**: `demos/flowchart-elk-force.html`

### Parameters

| Parameter | Range | Default | Effect |
|-----------|-------|---------|--------|
| **Force Model** | FRUCHTERMAN_REINGOLD, EADES | FRUCHTERMAN_REINGOLD | Determines force calculation algorithm |
| **Force Repulsion** | 0.1 - 50 | 5.0 | Node separation (↓ compact, ↑ spread out) |
| **Force Temperature** | 0.0001 - 0.1 | 0.001 | Convergence speed (↓ fast, ↑ explore more) |
| **Force Iterations** | 1 - 1000 | 300 | Layout refinement (higher = better) |

### How to Use

1. **Open** `demos/flowchart-elk-force.html` in your browser
2. **Adjust sliders** - See diagrams update in real-time
3. **Watch the config** - Current settings displayed in JSON format
4. **Copy config** - Click "📋 Copy Config" to copy JavaScript code to clipboard
5. **Reset** - Click "↻ Reset to Defaults" to restore original settings

### Example Workflows

**For Sparse Networks** (many nodes, few connections):
- ↑ Increase `forceRepulsion` to 15-20 (spreads nodes apart)
- ↑ Increase `forceTemperature` to 0.01 (allows more exploration)
- ↑ Increase `forceIterations` to 500 (more refinement)

**For Dense Networks** (many connections):
- ↓ Decrease `forceRepulsion` to 2-3 (compact layout)
- ↓ Keep `forceTemperature` at default (fast convergence)
- Keep `forceIterations` at 300-400

**For Quick Layouts** (speed over quality):
- Use `forceIterations: 100-150`
- Use `forceTemperature: 0.1` (faster convergence)

---

## Stress-Minimization Layout Demo

**File**: `demos/flowchart-elk-stress.html`

### Parameters

| Parameter | Range | Default | Effect |
|-----------|-------|---------|--------|
| **Desired Edge Length** | 10 - 500 | 100 | Target distance between connected nodes |
| **Iteration Limit** | 0 - 2000 | 0 (unlimited) | Maximum optimization iterations |
| **Epsilon** | 0.00001 - 0.1 | 0.0001 | Convergence precision (↓ strict, ↑ loose) |

### How to Use

1. **Open** `demos/flowchart-elk-stress.html` in your browser
2. **Adjust sliders** - Diagrams update immediately
3. **Experiment with edge length** - The most impactful parameter
4. **Fine-tune epsilon** - For convergence behavior
5. **Check iteration limit** - Set to 0 for unlimited, or cap at specific value

### Example Workflows

**For Hierarchical Layouts**:
- Set `stressDesiredEdgeLength: 150-200`
- Keep `epsilon: 0.0001`
- `iterationLimit: 0` (unlimited)

**For Compact Layouts**:
- Set `stressDesiredEdgeLength: 50-80`
- Use `epsilon: 0.0001` (strict convergence)
- Set `iterationLimit: 500`

**For Quick Convergence**:
- Set `stressIterationLimit: 200`
- Use `epsilon: 0.001` (loose convergence)

---

## Copying Configurations

Both demos have a **"📋 Copy Config"** button that copies code like this:

```javascript
// Force Demo
mermaid.initialize({
  flowchart: {
    layout: 'elk',
    elk: {
      algorithm: 'elk.force',
      forceModel: 'FRUCHTERMAN_REINGOLD',
      forceIterations: 300,
      forceRepulsion: 5.0,
      forceTemperature: 0.001,
    },
  },
});

// Stress Demo
mermaid.initialize({
  flowchart: {
    layout: 'elk',
    elk: {
      algorithm: 'elk.stress',
      stressDesiredEdgeLength: 100,
      stressEpsilon: 0.0001,
      // stressIterationLimit: undefined (optional)
    },
  },
});
```

Paste this into your own Mermaid configuration to use the same settings!

---

## Tips & Tricks

### Visual Hints

Each parameter has a small help text explaining its effect:
- 🔽 Lower values typically = compact, dense layouts
- 🔼 Higher values typically = spread out, spacious layouts

### Real-Time Feedback

- Diagrams re-render as you drag sliders
- Configuration JSON updates instantly
- No page reload needed

### Comparison Testing

1. Adjust all parameters for Force demo
2. Note the output
3. Switch to Stress demo
4. Compare layout approaches

### Default Reset

Always available - click "↻ Reset to Defaults" to quickly restore original behavior

---

## Algorithm Comparison

| Aspect | Force (elk.force) | Stress (elk.stress) |
|--------|-------------------|-------------------|
| **Best for** | General graphs, networks | Structured, hierarchical layouts |
| **Speed** | Fast | Slower (optimization-based) |
| **Parameters** | More granular | Fewer, simpler parameters |
| **Quality** | Good, physics-based | Excellent, optimized |
| **Node Spacing** | Repulsion-based | Distance minimization |

---

## Troubleshooting

### Diagrams not updating?
- Check browser console for errors
- Ensure JavaScript is enabled
- Try clicking "Reset to Defaults"

### Slider changes aren't visible?
- Try adjusting `forceRepulsion` or `stressDesiredEdgeLength` first (more dramatic)
- Increase `forceIterations` for better visual refinement

### Want to contribute improvements?
- See CONTRIBUTING.md for guidelines
- Parameter ranges, UI design suggestions welcome!

---

## Learn More

- [ELK Layout Configuration Guide](./elk-config-investigation.md)
- [Investigation Summary](./INVESTIGATION_SUMMARY.md)
- [ELK Official Docs](https://www.eclipse.org/elk/)
