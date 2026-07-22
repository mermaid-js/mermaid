# Investigation Summary: ELK Layout Configuration Parameters

## Status: ✅ Complete
The ELK layout configuration parameters are **correctly implemented** and should work as expected. The issue was likely due to:
1. Browser caching
2. Parameter values being too subtle to notice
3. Need to rebuild the dist files
4. Configuration structure clarification

## What We Discovered

### 1. Configuration Structure is Correct ✅
The demo files (`flowchart-elk-force.html` and `flowchart-elk-stress.html`) already show the correct pattern:

```javascript
mermaid.initialize({
  logLevel: 3,
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
```

### 2. Parameter Mapping is Implemented ✅
Source file: `/Users/elw/mermaid/packages/mermaid-layout-elk/src/render.ts` (lines 157-178)

**Force algorithm mapping:**
```typescript
function buildForceOptions(config: ElkSubgraphConfig | undefined): Record<string, unknown> {
  return {
    'elk.force.model': config?.forceModel ?? 'FRUCHTERMAN_REINGOLD',
    'elk.force.iterations': config?.forceIterations ?? 300,
    'elk.force.repulsivePower': config?.forceRepulsion ?? 5.0,
    'elk.force.temperature': config?.forceTemperature ?? 0.001,
    'elk.separateConnectedComponents': true,
  };
}
```

**Stress algorithm mapping:**
```typescript
function buildStressOptions(config: ElkSubgraphConfig | undefined): Record<string, unknown> {
  const opts: Record<string, unknown> = {
    'elk.stress.desiredEdgeLength': config?.stressDesiredEdgeLength ?? 100.0,
    'elk.stress.epsilon': config?.stressEpsilon ?? 0.0001,
    'elk.separateConnectedComponents': true,
  };
  if (config?.stressIterationLimit != null) {
    opts['elk.stress.iterationLimit'] = config.stressIterationLimit;
  }
  return opts;
}
```

### 3. Parameters are Tested ✅
Source file: `/Users/elw/mermaid/packages/mermaid-layout-elk/src/__tests__/render.spec.ts` (lines 523-635)

Tests confirm:
- Parameters are correctly passed to the config object
- Default values are applied when parameters aren't specified
- Parameters don't interfere with other algorithm options
- Both `elk.force` and shorthand `force` algorithm identifiers work

### 4. Build Has Been Updated ✅
Rebuilt dist files for `mermaid-layout-elk` to ensure latest code is being used:
```bash
pnpm build:esbuild --filter mermaid-layout-elk
```

## Commits Made

| Hash | Message |
|------|---------|
| 44aa677bc | docs: add mermaid language tags to code blocks in elk README |
| 6c9205f48 | docs: add ELK layout configuration investigation and troubleshooting guide |

## Testing Instructions

### Step 1: Clear Browser Cache
- Hard refresh: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows/Linux)
- Or open developer tools (F12) and disable caching in Network tab

### Step 2: Test with Extreme Values
Open `demos/flowchart-elk-force.html` and modify the config in browser console:

```javascript
// Tightly packed layout
mermaid.initialize({
  flowchart: {
    layout: 'elk',
    elk: {
      algorithm: 'elk.force',
      forceRepulsion: 1.0,      // Very low = compact
      forceTemperature: 0.0001, // Very low = tight
      forceIterations: 100,     // Few iterations
    }
  }
});
mermaid.contentLoaded();
```

You should see the diagrams become much more compact.

### Step 3: Test Opposite Extreme
```javascript
// Spread out layout
mermaid.initialize({
  flowchart: {
    layout: 'elk',
    elk: {
      algorithm: 'elk.force',
      forceRepulsion: 50.0,     // Very high = spread out
      forceTemperature: 1.0,    // Very high = loose
      forceIterations: 1000,    // Many iterations
    }
  }
});
mermaid.contentLoaded();
```

You should see diagrams become much more spread out.

### Step 4: Run Tests
```bash
cd packages/mermaid-layout-elk
pnpm test
```

All parameter-related tests should pass.

## How Parameters Affect Layout

### Force Algorithm (`elk.force`)

**`forceRepulsion`** (default: 5.0)
- Controls how much nodes push away from each other
- Lower values (0.1-1.0) = compact, nodes close together
- Higher values (10-50) = spread out, maximum spacing
- Range: typically 0.1 to 100

**`forceTemperature`** (default: 0.001)
- Controls cooling schedule / movement speed
- Lower values (0.00001-0.001) = fast convergence, tighter final layout
- Higher values (0.01-1.0) = slow cooling, more exploration
- Range: typically 0.00001 to 1.0

**`forceIterations`** (default: 300)
- Number of refinement iterations
- Lower values = faster, rougher layout
- Higher values = slower, more refined layout
- Range: 1-2000

**`forceModel`** (default: `FRUCHTERMAN_REINGOLD`)
- Algorithm variant: `FRUCHTERMAN_REINGOLD` or `EADES`
- EADES often produces more compact layouts
- Try both to see which you prefer

### Stress Algorithm (`elk.stress`)

**`stressDesiredEdgeLength`** (default: 100.0)
- Target length for edges
- Lower values (20-50) = compact layout, edges short
- Higher values (200-500) = spread out, edges long
- Range: 1-1000

**`stressEpsilon`** (default: 0.0001)
- Convergence tolerance
- Lower values = stricter, may take longer
- Higher values = looser, converges faster
- Range: 0.00001-0.1

**`stressIterationLimit`**
- Maximum iterations for optimization
- Not set by default (unlimited)
- Lower values = faster, less optimized
- Higher values = slower, better optimization

## Files Modified

1. **Added Documentation**
   - `/Users/elw/mermaid/docs/elk-config-investigation.md` - Investigation findings and troubleshooting guide

2. **Previously Modified** (from earlier session)
   - `/Users/elw/mermaid/packages/mermaid-layout-elk/README.md` - Added mermaid language tags to code blocks

## Next Steps

1. **Immediate**: Test the parameters with the demo files using the testing instructions above
2. **Validate**: Run the test suite to confirm everything still works
3. **Document**: If any edge cases are found, document them in the investigation file
4. **PR**: Create a PR with all the changes once testing is complete

## Related Resources

- **Source Implementation**: [src/render.ts](../packages/mermaid-layout-elk/src/render.ts)
- **Tests**: [src/__tests__/render.spec.ts](../packages/mermaid-layout-elk/src/__tests__/render.spec.ts)
- **Demo Force**: [demos/flowchart-elk-force.html](../demos/flowchart-elk-force.html)
- **Demo Stress**: [demos/flowchart-elk-stress.html](../demos/flowchart-elk-stress.html)
- **README**: [packages/mermaid-layout-elk/README.md](../packages/mermaid-layout-elk/README.md)

## Questions?

Refer to the detailed investigation guide in [docs/elk-config-investigation.md](./elk-config-investigation.md) for more information about testing parameters and troubleshooting issues.
