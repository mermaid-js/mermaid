# HOLA `alignmentTweaking`

This folder implements **Step 4: Opportunistic improvement** for the `hola` layout pipeline.

## Theory context (from `hola2015.pdf`, Section 4.4)

The step is described in four sub-steps:

- **4.4(a) Near-alignment tightening**  
  Detect node pairs/groups that are almost aligned and snap them into exact alignment.
- **4.4(b) Even distribution using neighbor stress**  
  Run a stress pass that only uses neighboring-node terms (local forces), improving spacing regularity while ignoring long-range forces.
- **4.4(c) Orientation adjustment**  
  Rotate by 90 degrees when portrait-shaped (`width < height`), choosing deterministic rotation direction to maximize SOUTH-oriented trees, then run another neighbor-stress projection.
- **4.4(d) Final cleanup and routing**  
  Remove dummy nodes and re-route edges orthogonally (preserving deliberate bends where needed), as a final chance to optimize edge geometry with updated node positions.

This folder is the implementation of that Step 4 stage.

## Entry point

Main export: `tweakAlignment(layoutData, options)` in [`index.ts`](./index.ts).

Pipeline order in code:

1. `alignmentTweaking` (4a)
2. `_evenDistribution` (4b)
3. `orientationalAdjustment` (4c)
4. `finalCleanupAndRouting` (4d)

The `tweakAlignment` function allows enabling/disabling rotation and final cleanup, plus thresholds/iteration controls.

## Theory-to-code mapping (4.4)

### 4.4(a) Near-alignment tightening

Implemented by:

- [`alignmentDetector.ts`](./alignmentDetector.ts)  
  Finds near-horizontal and near-vertical groups using an alignment threshold.
- [`alignmentEnforcer.ts`](./alignmentEnforcer.ts)  
  Applies alignments by snapping to an averaged x/y coordinate.

Behavior notes:

- Detector groups are threshold-based and greedy (sorted scan + break when threshold exceeded).
- Enforcer includes a conservative shift heuristic to avoid risky large moves.
- Constraint checks are currently lightweight (`wouldViolateConstraints` currently returns `false`).

### 4.4(b) Neighbor stress optimization

Implemented by [`neighborStressOptimizer.ts`](./neighborStressOptimizer.ts):

- Builds adjacency from edges (direct neighbors only)
- Computes stress using only adjacent pairs
- Runs gradient-descent-style updates with bounded iterations/tolerance
- Exposes neighbor-distance stats for diagnostics

This is explicitly “local stress” behavior, aligned with the theory’s “neighbor stress” intent.

### 4.4(c) Orientation adjustment

Implemented by [`layoutRotation.ts`](./layoutRotation.ts):

- Computes layout bounding box
- Rotates only when `width < height`
- Chooses clockwise/counter-clockwise deterministically via tree-direction heuristic to maximize SOUTH outcomes
- Rotates node positions and edge points, then normalizes coordinates

### 4.4(d) Final cleanup + final routing

Implemented by [`finalCleanup.ts`](./finalCleanup.ts):

- Identifies/removes dummy nodes (`node.isDummy`)
- Merges edge segments split by dummy nodes
- Re-routes edges with a final orthogonal pass (simple Manhattan strategy)
- Simplifies resulting polylines by removing collinear intermediate points

## Module overview

- `index.ts`: Orchestrates Step 4 pipeline and exposes options.
- `alignmentDetector.ts`: Finds horizontal/vertical near-alignments.
- `alignmentEnforcer.ts`: Applies alignment candidates with shift heuristics.
- `neighborStressOptimizer.ts`: Local (neighbor-only) stress minimizer.
- `layoutRotation.ts`: Aspect-ratio-driven 90-degree orientation adjustment.
- `finalCleanup.ts`: Dummy-node cleanup + final edge reroute/simplification.
- `tweakAlignment.spec.ts`: Tests for Step 4 behavior.

## Options in `tweakAlignment`

`tweakAlignment(layoutData, options)` supports:

- `alignmentThreshold`
- `neighborStressIterations`
- `neighborStressTolerance`
- `enableRotation`
- `applyFinalRelaxation`
- `enableFinalCleanup`

Defaults come from `Constants.ts` (alignment threshold and neighbor-stress settings).

## Debugging tips

- If nodes fail to align as expected, reduce `alignmentThreshold` noise or inspect detector grouping in `alignmentDetector.ts`.
- If spacing still looks uneven, increase `neighborStressIterations` or tighten tolerance.
- If orientation seems counterintuitive, inspect tree-root detection and direction scoring in `layoutRotation.ts`.
- If edges become too simplified/unnatural after Step 4, inspect `finalCleanup.ts` routing/simplification behavior.
