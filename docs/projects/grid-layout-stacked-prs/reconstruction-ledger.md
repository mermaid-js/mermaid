# Grid layout reconstruction ledger

Pinned source base: `47fffa05c044f460f8b9645c7a24429ed200a084`

Pinned source snapshot: `d7ce16a49f13425078cd66137b6a51eb2a426c44`

This ledger accounts for every path in the authoritative 140-path
`source_base..source_snapshot` diff. `split` means the path has executable seams owned by more than
one layer. Layer 4 restores the pinned source version of every source-diff path before running the
required generators. Of those paths, 134 remain byte-for-byte exact and are listed in
`exact-snapshot-paths.txt`. Five generated TypeDoc paths are listed with the other generator-owned
differences in `generated-doc-divergences.txt`. The browser spec has one release-layer reliability
seam: two direct IIFE consumers explicitly wait for `window.mermaid` before evaluating it.

## Baseline validation

The temporary detached worktree
`/home/tim/git/mermaid_worktrees/timmy/grid-layout-baseline` was created at the pinned base and
removed after validation.

| Command                                                    | Exit | Result                                                                                                                                     |
| ---------------------------------------------------------- | ---: | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm exec prettier --check` on shared changed files       |    0 | Passed                                                                                                                                     |
| `pnpm exec eslint --quiet` on shared changed files         |    0 | Passed; stale browser-data warning only                                                                                                    |
| `pnpm exec tsc -p packages/mermaid/tsconfig.json --noEmit` |    2 | Baseline dependency/build-output failure: generated parser AST and docs-only Vite plugin modules were unavailable from the pinned checkout |
| focused Vitest on existing helper/edge/line-jump suites    |    1 | Baseline startup failure for the same unavailable docs-only Vite plugin modules                                                            |
| `pnpm --filter mermaid types:verify-config`                |    0 | Passed                                                                                                                                     |
| `pnpm --filter mermaid docs:verify`                        |    3 | Baseline TypeDoc failure for the same generated parser AST and docs-only Vite plugin modules                                               |
| grid browser gate                                          |  N/A | The grid browser spec does not exist at the pinned base                                                                                    |

Existing dependency links and parser build output from the protected source checkout are reused in
the layer worktrees. No dependency installation or update is performed.

## Shared-file ownership

- `grid/layoutCore.ts`: L1 geometry transaction; L2 routed-point transaction; L3 label and render
  fields.
- `grid/layoutCore.spec.ts`: tests follow those three runtime seams.
- `grid/types.ts`: L1 placement/containment/geometry; L2 routing topology/errors; L3 curve and label
  semantics; L4 public-config projection.
- `grid/placement.ts` and `.spec.ts`: L1 internal placement/defaults; L3 curve/corner defaults; L4
  public config and authored placement IDs.
- `grid/performance.spec.ts`: L2 routing resource/performance coverage; L3 label-index coverage.
- `grid/routerSession.ts`: L2 routing transaction state; L3 curve/corner transaction fields.
- `grid/testMatrix.ddlt.spec.ts`: routing assertions are L2 in purpose but the registered DDLT
  harness is deferred to L4.
- `layout-utils/helpers.ts` and `.spec.ts`: L1 locale-independent deterministic ordering; L3 marker
  clearance.
- `rendering-elements/edges.js` and `.spec.js`, and `rendering-util/types.ts`: L3 generic routed-edge
  rendering fields; L4 authored placement ID exposure in the shared node type.

## Path inventory

Format: `owner<TAB>path`.

```text
L4	.changeset/grid-layout.md
L4	.esbuild/dev-explorer/diagram-viewer.ts
L4	demos/flowchart-grid.html
L4	demos/index.html
L4	docs/community/layout-makers-guide.md
L4	docs/config/layouts.md
L4	docs/config/schema-docs/config-defs-grid-layout-config.md
L4	docs/config/setup/mermaid/interfaces/LayoutData.md
L4	docs/config/setup/mermaid/interfaces/MermaidConfig.md
L4	docs/config/setup/mermaid/interfaces/ParseOptions.md
L4	docs/config/setup/mermaid/interfaces/ParseResult.md
L4	docs/config/setup/mermaid/interfaces/RenderResult.md
L4	docs/syntax/agentflow.md
L4	docs/syntax/classDiagram.md
L4	docs/syntax/entityRelationshipDiagram.md
L4	docs/syntax/flowchart.md
L4	docs/syntax/grid-layout.md
L4	docs/syntax/mindmap.md
L4	docs/syntax/requirementDiagram.md
L4	docs/syntax/stateDiagram.md
L4	docs/syntax/usecase.md
L4	e2e/diagrams/grid/agentflow-inline-placement.mmd
L4	e2e/diagrams/grid/class-placement-map.mmd
L4	e2e/diagrams/grid/er-authored-placement-ids.mmd
L4	e2e/diagrams/grid/flowchart-groups-loops-parallel-routes.mmd
L4	e2e/diagrams/grid/flowchart-inline-placement.mmd
L4	e2e/diagrams/grid/flowchart-svg-labels.mmd
L4	e2e/diagrams/grid/mindmap-authored-placement-ids.mmd
L4	e2e/diagrams/grid/requirement-automatic-placement.mmd
L4	e2e/diagrams/grid/state-placement-map.mmd
L4	e2e/diagrams/grid/usecase-placement-map.mmd
L4	e2e/helpers/util.ts
L4	e2e/platform/dev-diagrams/layout-tests/ddlt-manifest.json
L4	e2e/platform/dev-diagrams/layout-tests/grid/group-stack.mmd
L4	e2e/platform/dev-diagrams/layout-tests/grid/group-stack.sizes.json
L4	e2e/platform/dev-diagrams/layout-tests/grid/placement-matrix-lr.mmd
L4	e2e/platform/dev-diagrams/layout-tests/grid/placement-matrix-lr.sizes.json
L4	e2e/platform/dev-diagrams/layout-tests/grid/placement-matrix-tb.mmd
L4	e2e/platform/dev-diagrams/layout-tests/grid/placement-matrix-tb.sizes.json
L4	e2e/platform/dev-diagrams/layout-tests/grid/routing-cell-aware-empty-cell.mmd
L4	e2e/platform/dev-diagrams/layout-tests/grid/routing-cell-aware-empty-cell.sizes.json
L4	e2e/platform/dev-diagrams/layout-tests/grid/routing-group-member.mmd
L4	e2e/platform/dev-diagrams/layout-tests/grid/routing-group-member.sizes.json
L4	e2e/platform/dev-diagrams/layout-tests/grid/routing-hierarchy-portals.mmd
L4	e2e/platform/dev-diagrams/layout-tests/grid/routing-hierarchy-portals.sizes.json
L4	e2e/platform/dev-diagrams/layout-tests/grid/routing-loops-parallel-lr.mmd
L4	e2e/platform/dev-diagrams/layout-tests/grid/routing-loops-parallel-lr.sizes.json
L4	e2e/platform/dev-diagrams/layout-tests/grid/routing-outside-member.mmd
L4	e2e/platform/dev-diagrams/layout-tests/grid/routing-outside-member.sizes.json
L4	e2e/platform/dev-diagrams/layout-tests/grid/simple.mmd
L4	e2e/platform/dev-diagrams/layout-tests/grid/simple.sizes.json
L4	e2e/platform/dev-diagrams/layout-tests/grid/singleton-alignments.mmd
L4	e2e/platform/dev-diagrams/layout-tests/grid/singleton-alignments.sizes.json
L4	e2e/platform/dev-diagrams/layout-tests/grid/stack-default.mmd
L4	e2e/platform/dev-diagrams/layout-tests/grid/stack-default.sizes.json
L4	e2e/platform/dev-diagrams/layout-tests/grid/stack-gap-zero.mmd
L4	e2e/platform/dev-diagrams/layout-tests/grid/stack-gap-zero.sizes.json
L4	e2e/rendering/layout/grid-layout.spec.ts
L4	packages/mermaid/src/config.type.ts
L4	packages/mermaid/src/diagrams/agentflow/agentflowDb.ts
L4	packages/mermaid/src/diagrams/agentflow/parser/agentflow-metadata-no-validation.spec.ts
L4	packages/mermaid/src/diagrams/common/sanitizeMetadata.ts
L4	packages/mermaid/src/diagrams/er/erDb.spec.js
L4	packages/mermaid/src/diagrams/er/erDb.ts
L4	packages/mermaid/src/diagrams/er/erTypes.ts
L4	packages/mermaid/src/diagrams/flowchart/flowDb.spec.ts
L4	packages/mermaid/src/diagrams/flowchart/flowDb.ts
L4	packages/mermaid/src/diagrams/flowchart/parser/flow-edges.spec.js
L4	packages/mermaid/src/diagrams/flowchart/types.ts
L4	packages/mermaid/src/diagrams/mindmap/mindmapDb.getData.test.ts
L4	packages/mermaid/src/diagrams/mindmap/mindmapDb.ts
L4	packages/mermaid/src/docs/community/layout-makers-guide.md
L4	packages/mermaid/src/docs/config/layouts.md
L4	packages/mermaid/src/docs/config/schema-docs/config-defs-grid-layout-config.md
L4	packages/mermaid/src/docs/syntax/agentflow.md
L4	packages/mermaid/src/docs/syntax/classDiagram.md
L4	packages/mermaid/src/docs/syntax/entityRelationshipDiagram.md
L4	packages/mermaid/src/docs/syntax/flowchart.md
L4	packages/mermaid/src/docs/syntax/grid-layout.md
L4	packages/mermaid/src/docs/syntax/mindmap.md
L4	packages/mermaid/src/docs/syntax/requirementDiagram.md
L4	packages/mermaid/src/docs/syntax/stateDiagram.md
L4	packages/mermaid/src/docs/syntax/usecase.md
L3	packages/mermaid/src/rendering-util/edgeCornerRadius.spec.ts
L3	packages/mermaid/src/rendering-util/edgeCornerRadius.ts
L4	packages/mermaid/src/rendering-util/layout-algorithms/ddlt/backends.ts
L4	packages/mermaid/src/rendering-util/layout-algorithms/ddlt/discoverFixtures.ts
L4	packages/mermaid/src/rendering-util/layout-algorithms/ddlt/layout-fixtures.ddlt.spec.ts
L4	packages/mermaid/src/rendering-util/layout-algorithms/ddlt/types.ts
L3	packages/mermaid/src/rendering-util/layout-algorithms/elk/lineHops.ts
L2	packages/mermaid/src/rendering-util/layout-algorithms/grid/edge-routing.md
L3	packages/mermaid/src/rendering-util/layout-algorithms/grid/edgeLabels.spec.ts
L3	packages/mermaid/src/rendering-util/layout-algorithms/grid/edgeLabels.ts
L1	packages/mermaid/src/rendering-util/layout-algorithms/grid/groups.spec.ts
L1	packages/mermaid/src/rendering-util/layout-algorithms/grid/groups.ts
L4	packages/mermaid/src/rendering-util/layout-algorithms/grid/index.ts
split	packages/mermaid/src/rendering-util/layout-algorithms/grid/layoutCore.spec.ts
split	packages/mermaid/src/rendering-util/layout-algorithms/grid/layoutCore.ts
split	packages/mermaid/src/rendering-util/layout-algorithms/grid/performance.spec.ts
split	packages/mermaid/src/rendering-util/layout-algorithms/grid/placement.spec.ts
split	packages/mermaid/src/rendering-util/layout-algorithms/grid/placement.ts
L2	packages/mermaid/src/rendering-util/layout-algorithms/grid/router.spec.ts
L2	packages/mermaid/src/rendering-util/layout-algorithms/grid/router.ts
L2	packages/mermaid/src/rendering-util/layout-algorithms/grid/routerCompatibility.spec.ts
L2	packages/mermaid/src/rendering-util/layout-algorithms/grid/routerCompatibility.ts
L2	packages/mermaid/src/rendering-util/layout-algorithms/grid/routerConstraint.spec.ts
L2	packages/mermaid/src/rendering-util/layout-algorithms/grid/routerConstraint.ts
L2	packages/mermaid/src/rendering-util/layout-algorithms/grid/routerInstrumentation.spec.ts
L2	packages/mermaid/src/rendering-util/layout-algorithms/grid/routerInstrumentation.ts
L2	packages/mermaid/src/rendering-util/layout-algorithms/grid/routerPlanning.spec.ts
L2	packages/mermaid/src/rendering-util/layout-algorithms/grid/routerPlanning.ts
L2	packages/mermaid/src/rendering-util/layout-algorithms/grid/routerSearch.spec.ts
L2	packages/mermaid/src/rendering-util/layout-algorithms/grid/routerSearch.testUtils.ts
L2	packages/mermaid/src/rendering-util/layout-algorithms/grid/routerSearch.ts
split	packages/mermaid/src/rendering-util/layout-algorithms/grid/routerSession.ts
L2	packages/mermaid/src/rendering-util/layout-algorithms/grid/routerSparse.ts
L2	packages/mermaid/src/rendering-util/layout-algorithms/grid/routerTopology.spec.ts
L2	packages/mermaid/src/rendering-util/layout-algorithms/grid/routerTopology.ts
L4	packages/mermaid/src/rendering-util/layout-algorithms/grid/simple.ddlt.spec.ts
L4	packages/mermaid/src/rendering-util/layout-algorithms/grid/testMatrix.ddlt.spec.ts
split	packages/mermaid/src/rendering-util/layout-algorithms/grid/types.ts
L2	packages/mermaid/src/rendering-util/layout-algorithms/layout-utils/geometry.ts
split	packages/mermaid/src/rendering-util/layout-algorithms/layout-utils/helpers.spec.ts
split	packages/mermaid/src/rendering-util/layout-algorithms/layout-utils/helpers.ts
L3	packages/mermaid/src/rendering-util/layout-algorithms/layout-utils/validateLayout.ts
L3	packages/mermaid/src/rendering-util/layout-algorithms/swimlanes/adjustLayout.ts
L4	packages/mermaid/src/rendering-util/layoutFallback.spec.ts
L4	packages/mermaid/src/rendering-util/render.ts
split	packages/mermaid/src/rendering-util/rendering-elements/edges.js
split	packages/mermaid/src/rendering-util/rendering-elements/edges.spec.js
L3	packages/mermaid/src/rendering-util/rendering-elements/lineJump.spec.ts
L3	packages/mermaid/src/rendering-util/rendering-elements/lineJump.ts
L3	packages/mermaid/src/rendering-util/rendering-elements/orthogonalEdgeClipping.js
split	packages/mermaid/src/rendering-util/types.ts
L4	packages/mermaid/src/schemas/config.schema.yaml
L4	packages/mermaid/src/types.ts
L4	packages/mermaid/src/utils/gridPlacement.spec.ts
L4	packages/mermaid/src/utils/gridPlacement.ts
L4	packages/mermaid/src/utils/sanitizeDirective.spec.ts
L4	packages/mermaid/src/utils/sanitizeDirective.ts
```

## Final-tree policy

The lower-layer internal config types are deliberate temporary seams. Layer 2 restores routing
types, layer 3 restores rendering defaults and generic renderer contracts, and layer 4 restores the
public type/config projection. The final branch matches the source snapshot byte-for-byte for every
path in `exact-snapshot-paths.txt`. Running `pnpm --filter mermaid docs:build` with the current
checked-in toolchain regenerated 36 TypeDoc files: five source-diff paths and 31 additional generated
paths. Those deterministic generator differences are the only source-snapshot content divergence
from generated files and are enumerated in `generated-doc-divergences.txt`. The only hand-authored
source divergence is the browser readiness wait described above. The other additional final-tree
paths are this ledger and its verification lists. The three `grid-look-*` visual snapshots were
regenerated with the current Playwright/browser environment, reviewed through the focused look
tests, and are enumerated in `visual-snapshot-paths.txt`.
