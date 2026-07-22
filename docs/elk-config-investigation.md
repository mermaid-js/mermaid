# ELK Layout Configuration Parameters Investigation

## Summary
The ELK layout configuration parameters (`forceRepulsion`, `forceTemperature`, `stressDesiredEdgeLength`, etc.) **are correctly implemented** in the mermaid codebase and should work as expected. The parameters are properly mapped from the configuration schema to ELK library options.

## Configuration Structure

The correct way to pass ELK parameters to mermaid.initialize() is:

```javascript
mermaid.initialize({
  flowchart: {
    layout: 'elk',
    elk: {
      algorithm: 'elk.force',  // or 'elk.stress', 'elk.layered', etc.
      forceModel: 'FRUCHTERMAN_REINGOLD',
      forceIterations: 300,
      forceRepulsion: 5.0,
      forceTemperature: 0.001,
    }
  }
});
```

### Key Points
1. Parameters must be nested under `flowchart > elk`, NOT at the root level
2. Algorithm is specified in the `elk` object as `algorithm: 'elk.force'` or `algorithm: 'elk.stress'`
3. The configuration applies to all `flowchart-elk` diagrams loaded after initialization

## Parameter Mappings

### Force Algorithm Parameters
The source code in [packages/mermaid-layout-elk/src/render.ts](../packages/mermaid-layout-elk/src/render.ts) shows how parameters are mapped to ELK options:

| Mermaid Config | ELK Option | Default Value |
|---|---|---|
| `forceModel` | `elk.force.model` | `FRUCHTERMAN_REINGOLD` |
| `forceIterations` | `elk.force.iterations` | `300` |
| `forceRepulsion` | `elk.force.repulsivePower` | `5.0` |
| `forceTemperature` | `elk.force.temperature` | `0.001` |

Valid `forceModel` values: `FRUCHTERMAN_REINGOLD`, `EADES`

### Stress Algorithm Parameters
| Mermaid Config | ELK Option | Default Value |
|---|---|---|
| `stressDesiredEdgeLength` | `elk.stress.desiredEdgeLength` | `100.0` |
| `stressEpsilon` | `elk.stress.epsilon` | `0.0001` |
| `stressIterationLimit` | `elk.stress.iterationLimit` | (not set if undefined) |

## Working Examples

See these demo files for working examples:
- `/Users/elw/mermaid/demos/flowchart-elk-force.html` - Force layout with parameters
- `/Users/elw/mermaid/demos/flowchart-elk-stress.html` - Stress layout with parameters
- `/Users/elw/mermaid/demos/flowchart-elk-force-vs-stress.html` - Comparison demo

## Testing Parameters Effectively

### Force Layout Parameters
To see the effect of force parameters, try these extremes:

```javascript
// More spread out (less repulsion, more temperature)
mermaid.initialize({
  flowchart: {
    layout: 'elk',
    elk: {
      algorithm: 'elk.force',
      forceRepulsion: 1.0,      // Low repulsion = tighter layout
      forceTemperature: 0.1,    // High temperature = more movement
      forceIterations: 500,     // More iterations = better convergence
    }
  }
});

// More compact (more repulsion, less temperature)
mermaid.initialize({
  flowchart: {
    layout: 'elk',
    elk: {
      algorithm: 'elk.force',
      forceRepulsion: 20.0,     // High repulsion = spread out
      forceTemperature: 0.0001, // Low temperature = faster convergence
      forceIterations: 100,     // Fewer iterations = less refinement
    }
  }
});
```

### Stress Layout Parameters
```javascript
// Tighter edges
mermaid.initialize({
  flowchart: {
    layout: 'elk',
    elk: {
      algorithm: 'elk.stress',
      stressDesiredEdgeLength: 50,      // Smaller = more compact
      stressIterationLimit: 1000,       // More iterations = better optimization
      stressEpsilon: 0.001,             // Looser convergence tolerance
    }
  }
});

// Looser edges
mermaid.initialize({
  flowchart: {
    layout: 'elk',
    elk: {
      algorithm: 'elk.stress',
      stressDesiredEdgeLength: 200,     // Larger = more spread out
      stressIterationLimit: 100,        // Fewer iterations = faster
      stressEpsilon: 0.0001,            // Stricter convergence tolerance
    }
  }
});
```

## Verification

The parameters are tested in [packages/mermaid-layout-elk/src/__tests__/render.spec.ts](../packages/mermaid-layout-elk/src/__tests__/render.spec.ts):

```typescript
// Test confirms parameters are correctly mapped
it('should include elk.force options when algorithm is elk.force', () => {
  const state = buildElkGraphFromLayoutData(
    {
      ...defaultLayoutData,
      config: { elk: { forceModel: 'EADES', forceIterations: 500 } },
    },
    createElkContext('elk.force') as any
  );

  expect(state.elkGraph.layoutOptions['elk.force.model']).toBe('EADES');
  expect(state.elkGraph.layoutOptions['elk.force.iterations']).toBe(500);
  expect(state.elkGraph.layoutOptions['elk.force.repulsivePower']).toBe(5.0);
  expect(state.elkGraph.layoutOptions['elk.force.temperature']).toBe(0.001);
});
```

Run tests to verify:
```bash
cd packages/mermaid-layout-elk
pnpm test
```

## Troubleshooting

### Issue: Parameters don't seem to affect the layout

**Possible causes:**

1. **Browser caching** - Clear browser cache or do a hard refresh (Cmd+Shift+R on Mac)
2. **Parameter values too subtle** - Try using more extreme values (10x the default)
3. **Building might be needed** - After code changes, rebuild with `pnpm build:esbuild`
4. **Diagram not updated** - Make sure `mermaid.initialize()` is called BEFORE rendering diagrams

### Issue: Changes not visible after code modification

Run the build command to update dist files:
```bash
pnpm build:esbuild --filter mermaid-layout-elk
```

This will regenerate the ESM module files that the demo HTML files use.

## Key Files

| File | Purpose |
|---|---|
| [src/render.ts](../packages/mermaid-layout-elk/src/render.ts) | Parameter mapping logic |
| [src/__tests__/render.spec.ts](../packages/mermaid-layout-elk/src/__tests__/render.spec.ts) | Parameter tests |
| [README.md](../packages/mermaid-layout-elk/README.md) | User-facing documentation |
| [demos/flowchart-elk-force.html](../demos/flowchart-elk-force.html) | Force layout demo |
| [demos/flowchart-elk-stress.html](../demos/flowchart-elk-stress.html) | Stress layout demo |

## Next Steps

1. ✅ Rebuild the project: `pnpm build:esbuild --filter mermaid-layout-elk`
2. Clear your browser cache
3. Open the demo files in a fresh browser window
4. Try modifying parameters with extreme values to see clear differences
5. If parameters still don't work, check browser console for errors
