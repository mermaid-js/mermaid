# IPSEP-COLA — implementation-agnostic pseudocode

Source: _IPSEP-COLA: An Incremental Procedure for Separation Constraint Layout of Graphs_ —
Tim Dwyer, Yehuda Koren, Kim Marriott. The pseudocode below is the reconstruction this
implementation was written against (sections 4.1–4.2 and figures 8–10 of the paper).

The paper contains apparent sign/bound inconsistencies in the displayed QPSC formula and in
figure 8, so the reconstruction leaves `COMPUTE_GRADIENT` and `OPTIMAL_FEASIBLE_LINE_STEP`
abstract rather than silently correcting the source. This implementation resolves both for the
concrete objective `f(x) = ½·x'Ax - b'x` — see `solver/qpsc.ts`.

## Where each section lives

| §   | Pseudocode                                          | Implementation                                                   |
| --- | --------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | `IPSEP_COLA`                                        | `solver/ipsepCola.ts`                                            |
| 1   | `BUILD_STRESS_MATRIX` / `BUILD_MAJORISATION_VECTOR` | `solver/stress.ts`                                               |
| 1   | `CONSTRAINTS_FOR_AXIS`                              | `adapter/constraints.ts` (via `layoutCore.ts`)                   |
| 2   | `SOLVE_QPSC`                                        | `solver/qpsc.ts`                                                 |
| 3   | Block representation                                | `solver/types.ts`, `solver/blocks.ts`                            |
| 4   | `PROJECT`, `VIOLATION`                              | `solver/project.ts`, `BlockState.violation`                      |
| 5   | `UPDATE_BLOCK_POSITION`                             | `BlockState.updateBlockPosition`                                 |
| 6   | `MERGE_BLOCKS`                                      | `BlockState.mergeBlocks`                                         |
| 7   | `EXPAND_BLOCK`                                      | `BlockState.expandBlock`                                         |
| 8   | `COMPUTE_DERIVATIVE`                                | `BlockState.computeLagrangeMultipliers`                          |
| 9   | `SPLIT_BLOCKS`                                      | `BlockState.splitBlocks`                                         |
| 10  | Tree / constraint utilities                         | `findTreePath`, `variablesConnectedTo`, `mostViolatedConstraint` |
| 11  | `INITIALIZE_QPSC_STATE`                             | `BlockState` constructor                                         |

## Mermaid-specific deviations

Each is documented at its call site; collected here for review.

1. **Block-state reuse (§11).** The pseudocode initialises the block state once, outside the
   majorisation loop. That is only sound for a fixed constraint set, because blocks hold
   references to constraint objects. Mermaid's non-overlap constraints are regenerated from the
   live layout every iteration (which is what the `positions` argument of `CONSTRAINTS_FOR_AXIS`
   signals), so the state is re-seeded whenever they are.
2. **Feasibility guards.** `PROJECT` (§4) assumes a satisfiable constraint set. The union of
   flow and non-overlap constraints can close a cycle, so cyclic constraints are dropped before
   solving (`removeCyclicConstraints`) and `PROJECT` additionally parks any constraint
   `EXPAND_BLOCK` cannot repair instead of looping forever.
3. **Deterministic initial layout (§1).** Reference implementations randomise `INITIAL_LAYOUT`.
   Mermaid renders must be reproducible, so the starting point is a BFS ranking along the flow
   axis (`adapter/initialLayout.ts`).
4. **Groups.** Subgraphs take no part in the constraint system; their frames are fitted around
   the placed leaf nodes afterwards.

---

## 1. Algorithm structure

```
IPSEP_COLA(Graph G, SeparationConstraints constraints)

    positions <- INITIAL_LAYOUT(G)
    INITIALIZE_QPSC_STATE(positions)

    repeat
        previousPositions <- positions

        for each dimension axis do
            A <- BUILD_STRESS_MATRIX(G)
            b <- BUILD_MAJORISATION_VECTOR(G, positions, axis)
            C <- CONSTRAINTS_FOR_AXIS(constraints, axis, positions)
            x <- coordinates of all variables along axis
            x <- SOLVE_QPSC(A, b, C, x)
            assign x back to positions along axis
        end for

    until STRESS_MAJORISATION_HAS_CONVERGED(previousPositions, positions)

    return positions
```

## 2. QPSC solver

```
SOLVE_QPSC(A, b, C, x)

    repeat
        gradient <- COMPUTE_GRADIENT(A, b, x)
        step     <- DOT(gradient, gradient) / DOT(gradient, A * gradient)

        oldX    <- x
        targetX <- oldX - step * gradient

        noSplitOccurred <- SPLIT_BLOCKS(targetX)
        projectedX      <- PROJECT(targetX, C)

        direction <- projectedX - oldX
        alpha     <- OPTIMAL_FEASIBLE_LINE_STEP(A, b, oldX, direction, interval = [0, 1])

        x <- oldX + alpha * direction

    until DISTANCE(oldX, x) is sufficiently small AND noSplitOccurred

    return x
```

## 3. Block representation

Variables joined by active constraints are grouped into blocks. An active constraint is a
separation constraint currently holding with equality. Within a block, active constraints form
a spanning tree.

```
BLOCK
    variables
    variableCount
    activeConstraints
    referencePosition

blockOf[v]   block containing variable v
offset[v]    displacement of v from its block reference position

POSITION(v) = blockOf[v].referencePosition + offset[v]
```

## 4. Projection onto the feasible region

```
PROJECT(targetX, C)

    for each non-empty block B do
        UPDATE_BLOCK_POSITION(B, targetX)
    end for

    constraint <- MOST_VIOLATED_CONSTRAINT(C)

    while VIOLATION(constraint) > 0 do
        leftBlock  <- blockOf[LEFT(constraint)]
        rightBlock <- blockOf[RIGHT(constraint)]

        if leftBlock != rightBlock then
            MERGE_BLOCKS(leftBlock, rightBlock, constraint)
        else
            EXPAND_BLOCK(leftBlock, constraint, targetX)
        end if

        constraint <- MOST_VIOLATED_CONSTRAINT(C)
    end while

    for each variable v do
        x[v] <- POSITION(v)
    end for

    return x

VIOLATION(c) = POSITION(LEFT(c)) + GAP(c) - POSITION(RIGHT(c))
```

## 5. Optimal block position

```
UPDATE_BLOCK_POSITION(B, targetX)

    total <- 0
    for each variable v in B.variables do
        total <- total + targetX[v] - offset[v]
    end for

    B.referencePosition <- total / B.variableCount
```

## 6. Merge two blocks

```
MERGE_BLOCKS(leftBlock, rightBlock, c)

    L <- leftBlock
    R <- rightBlock

    shift <- offset[LEFT(c)] + GAP(c) - offset[RIGHT(c)]

    newReferencePosition <-
        ( L.referencePosition * L.variableCount
        + (R.referencePosition - shift) * R.variableCount )
        / (L.variableCount + R.variableCount)

    L.referencePosition  <- newReferencePosition
    L.activeConstraints  <- L.activeConstraints UNION R.activeConstraints UNION {c}

    for each variable v in R.variables do
        blockOf[v] <- L
        offset[v]  <- offset[v] + shift
    end for

    L.variables     <- L.variables UNION R.variables
    L.variableCount <- L.variableCount + R.variableCount

    mark R as empty
```

## 7. Expand a block

If a violated constraint connects two variables already in the same block, the active tree must
be restructured: select a valid active edge to remove, shift one resulting component enough to
satisfy the violated constraint, and insert the violated constraint as a new active edge.

```
EXPAND_BLOCK(B, violatedConstraint, targetX)

    active <- copy of B.activeConstraints

    COMPUTE_LAGRANGE_MULTIPLIERS(
        startVariable     = LEFT(violatedConstraint),
        activeConstraints = active,
        targetX)

    path <- FIND_TREE_PATH(LEFT(violatedConstraint), RIGHT(violatedConstraint), active)

    candidateSplitConstraints <- empty set
    for each consecutive pair (path[i], path[i+1]) do
        if there exists active constraint c such that
               LEFT(c) = path[i] AND RIGHT(c) = path[i+1]
        then
            add c to candidateSplitConstraints
        end if
    end for

    splitConstraint <- constraint in candidateSplitConstraints
                       having the smallest Lagrange multiplier

    remove splitConstraint from active

    rightComponent <- VARIABLES_CONNECTED_TO(RIGHT(violatedConstraint), active)

    amount <- VIOLATION(violatedConstraint)
    for each variable v in rightComponent do
        offset[v] <- offset[v] + amount
    end for

    B.activeConstraints <- active UNION {violatedConstraint}

    UPDATE_BLOCK_POSITION(B, targetX)
```

## 8. Lagrange-multiplier traversal

```
COMPUTE_DERIVATIVE(variable, activeConstraints, parentVariable, targetX)

    derivative <- POSITION(variable) - targetX[variable]

    for each active constraint c incident to variable do
        neighbor <- the other endpoint of c
        if neighbor = parentVariable then
            continue
        end if

        if LEFT(c) = variable then
            childDerivative <- COMPUTE_DERIVATIVE(RIGHT(c), activeConstraints, variable, targetX)
            lagrangeMultiplier[c] <- childDerivative
            derivative <- derivative + childDerivative

        else if RIGHT(c) = variable then
            childDerivative <- COMPUTE_DERIVATIVE(LEFT(c), activeConstraints, variable, targetX)
            lagrangeMultiplier[c] <- -childDerivative
            derivative <- derivative + childDerivative
        end if
    end for

    return derivative
```

## 9. Split obsolete blocks

Projection itself does not generally undo old merges. Before the next projection, negative
Lagrange multipliers identify active constraints that should be removed. Removing one such edge
splits the active tree into two blocks.

```
SPLIT_BLOCKS(targetX)

    noSplitOccurred <- true

    for each non-empty block B do
        UPDATE_BLOCK_POSITION(B, targetX)
        active <- copy of B.activeConstraints
        COMPUTE_LAGRANGE_MULTIPLIERS(arbitrary variable in B, active, targetX)

        while there exists an active constraint with negative Lagrange multiplier do
            noSplitOccurred <- false
            splitConstraint <- active constraint having the most negative Lagrange multiplier
            remove splitConstraint from active

            rightVariables <- VARIABLES_CONNECTED_TO(RIGHT(splitConstraint), active)
            leftVariables  <- B.variables - rightVariables

            create new block R
            R.variables <- rightVariables
            B.variables <- leftVariables

            for each variable v in rightVariables do
                blockOf[v] <- R
            end for

            B.variableCount <- SIZE(B.variables)
            R.variableCount <- SIZE(R.variables)

            B.activeConstraints <- active constraints whose endpoints both belong to B.variables
            R.activeConstraints <- active constraints whose endpoints both belong to R.variables

            UPDATE_BLOCK_POSITION(B, targetX)
            UPDATE_BLOCK_POSITION(R, targetX)

            COMPUTE_LAGRANGE_MULTIPLIERS(arbitrary variable in B, B.activeConstraints, targetX)
        end while
    end for

    return noSplitOccurred
```

## 10. Tree and constraint utilities

```
FIND_TREE_PATH(start, end, activeConstraints)
    traverse the active-constraint tree from start, record predecessors,
    reconstruct the unique path from start to end

VARIABLES_CONNECTED_TO(start, activeConstraints)
    traverse the active-constraint graph from start, return all reachable variables

MOST_VIOLATED_CONSTRAINT(C)
    return constraint c in C maximizing POSITION(LEFT(c)) + GAP(c) - POSITION(RIGHT(c))
```

## 11. Initialization and incremental reuse

```
INITIALIZE_QPSC_STATE(initialPositions)

    for each dimension do
        for each variable v do
            create block B containing only v
            B.variables         <- {v}
            B.variableCount     <- 1
            B.activeConstraints <- empty
            B.referencePosition <- initialPositions[v]
            blockOf[v] <- B
            offset[v]  <- 0
        end for
    end for
```
