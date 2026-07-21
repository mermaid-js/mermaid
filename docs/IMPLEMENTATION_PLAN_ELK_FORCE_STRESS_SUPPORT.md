# Implementation Plan: First-Class Support for ELK Force (Fruchterman-Reingold) and ELK Stress (Kamada-Kawai) Algorithms

**Status**: ✅ COMPLETE  
**Date Created**: 2026-07-21  
**Date Completed**: 2026-07-21  
**Objective**: Add algorithm-aware configuration, schema validation, and documentation for `elk.force` and `elk.stress` layout algorithms in Mermaid.

---

## Overview

Mermaid's `@mermaid-js/layout-elk` package already registers `elk.force` and `elk.stress` as valid layout names, but treats them identically to `elk.layered` at the graph-construction level. Root graph construction emits `elk.layered.*` properties unconditionally, algorithm-specific tuning options are not surfaced through the config schema, and documentation does not guide users on when or how to use these algorithms.

This plan adds:

- Algorithm-aware root graph construction
- Schema-backed configuration properties for each algorithm
- Type safety through interface updates
- Comprehensive tests
- Updated documentation

---

## Requirements

1. **Algorithm-aware root graph construction**: `createRootElkGraph` must not emit `elk.layered.*` properties when the algorithm is `elk.force` or `elk.stress`.
2. **`elk.force` configuration surface**: Expose `forceModel`, `forceIterations`, `forceRepulsion`, `forceTemperature`.
3. **`elk.stress` configuration surface**: Expose `stressDesiredEdgeLength`, `stressIterationLimit`, `stressEpsilon`.
4. **Schema validation**: All new properties in `config.schema.yaml` with types, defaults, descriptions, and enum constraints.
5. **Type coherence**: `ElkSubgraphConfig` and `ElkLayoutContext` interfaces reflect new config properties.
6. **Subgraph layout options**: `buildSubgraphLayoutOptions` suppresses `elk.layered.*` for force/stress.
7. **Documentation**: `syntax-reference.md` and elk package `README.md` describe new algorithms and provide examples.
8. **Regression safety**: All existing tests pass; new tests cover force/stress code paths.

---

## Implementation Steps (10 total)

### Step 1: Update `config.schema.yaml`

**File**: `packages/mermaid/src/schemas/config.schema.yaml`  
**Task**: Add force/stress properties to the `elk` config block (lines ~118–180).

### Step 2: Extend `ElkSubgraphConfig` interface

**File**: `packages/mermaid-layout-elk/src/render.ts`  
**Task**: Add force/stress config fields to the interface (~line 47).

### Step 3: Add helper functions for algorithm detection

**File**: `packages/mermaid-layout-elk/src/render.ts`  
**Task**: Implement `isLayeredAlgorithm()`, `isForceAlgorithm()`, `isStressAlgorithm()`.

### Step 4: Add builder functions for algorithm-specific options

**File**: `packages/mermaid-layout-elk/src/render.ts`  
**Task**: Implement `buildLayeredOptions()`, `buildForceOptions()`, `buildStressOptions()`.

### Step 5: Refactor `createRootElkGraph` to be algorithm-aware

**File**: `packages/mermaid-layout-elk/src/render.ts`  
**Task**: Update `createRootElkGraph` to branch on algorithm type and call appropriate builder (~line 399).

### Step 6: Guard `buildSubgraphLayoutOptions` against layered-only properties

**File**: `packages/mermaid-layout-elk/src/render.ts`  
**Task**: Wrap `elk.layered.*` emission in algorithm check (~line 127).

### Step 7: Suppress `elk.direction` for force/stress at root level

**File**: `packages/mermaid-layout-elk/src/render.ts`  
**Task**: Wrap direction assignment in algorithm check (~line 314).

### Step 8: Guard `applyCyclicEntryConstraint` for layered only

**File**: `packages/mermaid-layout-elk/src/render.ts`  
**Task**: Add early return for non-layered algorithms (~line 253).

### Step 9: Add comprehensive tests ✅ COMPLETE

**File**: `packages/mermaid-layout-elk/src/__tests__/render.spec.ts`  
**Task**: Test cases for force/stress code paths, config propagation, layered-only option suppression.

**Status**: ✅ All 41 tests passing (27 existing + 16 new)

- 7 tests for force algorithm behavior
- 6 tests for stress algorithm behavior
- 3 regression tests for layered algorithm
- Test fixes: Corrected direction format in test inputs and removed double assignment of elk.direction

### Step 10: Update documentation ✅ COMPLETE

**Files**:

- `packages/mermaid/src/docs/intro/syntax-reference.md` — Added "Force and Stress Layout Algorithms" subsection with algorithm descriptions, configuration options, and code examples.
- `packages/mermaid-layout-elk/README.md` — Added comprehensive "Layout Algorithms and Configuration" section documenting all three algorithms (layered, force, stress) with configuration options and examples.

**Status**: ✅ All documentation complete

---

## Files to Modify

| File                                                       | Steps | Lines                   |
| ---------------------------------------------------------- | ----- | ----------------------- |
| `packages/mermaid/src/schemas/config.schema.yaml`          | 1     | ~118–180                |
| `packages/mermaid-layout-elk/src/render.ts`                | 2–8   | Multiple (see per-step) |
| `packages/mermaid-layout-elk/src/__tests__/render.spec.ts` | 9     | End of file             |
| `packages/mermaid/src/docs/intro/syntax-reference.md`      | 10    | ~130–220                |
| `packages/mermaid-layout-elk/README.md`                    | 10    | ~60–75                  |

---

## Testing Strategy

1. **Existing tests must pass**: No regressions to `elk.layered` or other diagram types.
2. **New tests for `elk.force`**: Algorithm detection, config propagation, absence of layered-specific keys.
3. **New tests for `elk.stress`**: Same as force.
4. **Config schema validation**: Schema accepts valid enum values, rejects invalid.
5. **E2E demos**: Verify diagrams render without errors in demos/ folder.

---

## Success Criteria

- [ ] All existing tests pass
- [ ] New tests for force/stress code paths pass
- [ ] Config schema validates correctly
- [ ] Documentation examples work end-to-end
- [ ] PR created with all changes
- [ ] Reviewed and ready to merge

---

## Notes

- ELK Force supports two models: Eades (spring-embedder) and Fruchterman-Reingold (default).
- ELK Stress uses stress-majorization; options include desired edge length and convergence epsilon.
- Neither algorithm uses `elk.direction` at the root level (they distribute nodes organically).
- `applyCyclicEntryConstraint` is layered-only; force/stress have no notion of "layers."
- Default values match ELK's own documented defaults to ensure consistency.
