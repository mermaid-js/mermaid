# Changeset: ELK Force and Stress Algorithm Support

**PR**: [#7983](https://github.com/mermaid-js/mermaid/pull/7983)  
**Branch**: `feature/elk-force-stress-support`  
**Target**: `mermaid-js/mermaid:develop`  
**Author**: elijah  
**Date**: 2026-07-21

## Overview

This changeset adds comprehensive support for two additional ELK layout algorithms to the Mermaid diagram library:

1. **Force-Directed Layout** (`elk.force`) - Physics-based layout simulation
2. **Stress-Minimization Layout** (`elk.stress`) - Optimization-based layout algorithm

## Commits

### Commit 1: `ecc96e32a` - feat(layout-elk): Add force and stress algorithm support

**Core Implementation**

- Force-directed algorithm implementation with EADES and FRUCHTERMAN_REINGOLD physics models
- Stress-minimization algorithm implementation
- Algorithm detection helpers to route configuration options appropriately
- Layered-algorithm guards to prevent cross-algorithm property interference

**Configuration Updates**

- Config schema additions for force/stress options
- Runtime type definitions for new configuration parameters
- Syntax reference documentation updates

**Testing**

- 41 new test cases covering all algorithm branches and guards
- Edge case coverage for option validation and algorithm switching
- All existing tests continue to pass

**Files Modified**: 9

- `packages/mermaid-layout-elk/src/render.ts` - Core algorithm implementation (+156 lines)
- `packages/mermaid-layout-elk/src/__tests__/render.spec.ts` - Test suite (+220 lines)
- `packages/mermaid/src/config.type.ts` - TypeScript type definitions (+43 lines)
- `packages/mermaid/src/schemas/config.schema.yaml` - Schema updates (+47 lines)
- `packages/mermaid-layout-elk/README.md` - Package documentation (+83 lines)
- `packages/mermaid/src/docs/intro/syntax-reference.md` - Syntax docs (+57 lines)
- `packages/mermaid-layout-elk/package.json` - Dependency updates (+1 line)
- `pnpm-lock.yaml` - Lock file updates

### Commit 2: `851250bc7` - docs: Add ELK force and stress algorithm demo pages and completion report

**Interactive Demonstrations**

- `demos/flowchart-elk-force.html` - Force-directed algorithm showcase (+217 lines)
  - EADES physics model demo
  - FRUCHTERMAN_REINGOLD physics model demo
  - Interactive parameter adjustment examples
  - Visual comparison between models

- `demos/flowchart-elk-stress.html` - Stress-minimization algorithm showcase (+213 lines)
  - Basic stress-minimization demonstration
  - Parameter tuning examples
  - Comparison with other layout methods

- `demos/flowchart-elk-force-vs-stress.html` - Side-by-side algorithm comparison (+194 lines)
  - Direct visual comparison of force vs. stress layouts
  - Same diagram rendered with both algorithms
  - Educational annotations

**Completion Documentation**

- `docs/FEATURE_COMPLETION_ELK_FORCE_STRESS.md` - Comprehensive feature report (+176 lines)
  - Implementation summary
  - Algorithm details and configuration options
  - Code changes breakdown
  - Test coverage summary
  - Integration notes

## Changes Summary

| Metric              | Value        |
| ------------------- | ------------ |
| Total Files Changed | 13           |
| Total Insertions    | 1,525        |
| Total Deletions     | 111          |
| Net Change          | +1,414 lines |
| Test Cases Added    | 41           |
| Demo Pages Added    | 3            |

## Key Features

### Force-Directed Layout (`elk.force`)

**Supported Physics Models**

- `EADES` - Classic force-directed algorithm (good for tree-like structures)
- `FRUCHTERMAN_REINGOLD` - Industry-standard model (default, best for general graphs)

**Configuration Options**

```typescript
{
  forceModel: 'FRUCHTERMAN_REINGOLD' | 'EADES',  // default: FRUCHTERMAN_REINGOLD
  forceIterations: number,                         // default: 300
  forceRepulsion: number,                          // default: 5.0
  forceTemperature: number                         // default: 0.001
}
```

### Stress-Minimization Layout (`elk.stress`)

**Configuration Options**

```typescript
{
  stressDesiredEdgeLength?: number,
  stressIterationLimit?: number,
  stressEpsilon?: number
}
```

## Quality Assurance

✅ **Testing**

- 41 new test cases added
- All existing tests pass
- Edge cases covered (algorithm switching, invalid options, boundary conditions)

✅ **Code Quality**

- ESLint: Clean (no warnings or errors)
- TypeScript: Compilation successful
- Proper type definitions for all new configuration options

✅ **Documentation**

- Package README updated with algorithm descriptions
- Syntax reference documentation added
- Interactive demo pages with visual examples
- Inline code comments for algorithm selection logic

## Breaking Changes

**None.** This is a purely additive feature:

- Existing layered algorithm (`elk`/`elk.layered`) continues to work unchanged
- No changes to existing API signatures
- Backward compatible with all existing diagrams

## Migration Path

Users can opt-in to the new algorithms by specifying:

```
flowchart-elk TD
  ...
```

with configuration:

```javascript
mermaid.initialize({
  elk: {
    algorithm: 'force', // or 'stress', or 'layered' (default)
  },
});
```

## Testing Instructions

1. **Run test suite**

   ```bash
   npm test packages/mermaid-layout-elk
   ```

2. **View demos**
   - Open `demos/flowchart-elk-force.html` in a browser
   - Open `demos/flowchart-elk-stress.html` in a browser
   - Open `demos/flowchart-elk-force-vs-stress.html` for side-by-side comparison

3. **Manual verification**
   - Test algorithm switching with the same diagram
   - Verify parameter validation (invalid options rejected gracefully)
   - Confirm layered-specific options don't interfere with force/stress modes

## Deployment Checklist

- [x] All tests passing
- [x] ESLint clean
- [x] TypeScript compilation successful
- [x] Documentation updated
- [x] No breaking changes
- [x] Demo pages included
- [x] Type definitions complete
- [x] Config schema validated

## Related Issues

- Implements: New layout algorithm support for mermaid-layout-elk
- Enhances: ELK diagram capabilities with physics-based and optimization-based layouts

## References

- **ELK Documentation**: https://www.eclipse.org/elk/
- **Force-Directed Algorithms**: Classic graph layout technique for general-purpose use
- **Stress-Minimization**: Advanced optimization-based layout algorithm

---

**Changeset Generated**: 2026-07-21  
**Status**: Ready for Upstream Review
