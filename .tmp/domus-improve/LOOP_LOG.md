# DOMUS Improve Loop — round log

## Run 2026-08-07T13:21 — branch domus-loop/20260807T1321-self-loop
- base: reset onto feature/domus-layout (67575efbe); this worktree branch had domus stubbed out
- baseline total: 44214 (avg 982.5, min 828, invalid 0, cases 45), sweep 47/47 pass
- goal: fix the self-loop render (user-directed target: domus/self-loop U-bend), not a score delta
- time_budget_sec: default

### 2026-08-07 13:21 — round 1 (run 2026-08-07T13:21)
- target: domus/self-loop (DDLT score 1000/valid, but VISUALLY broken — arrow pokes out, no U-bend; dedicated selfLoop.layout.spec.ts was failing "expected 2 to be 4")
- root cause: straightenParallelZsWhenScoreImproves read the self-loop's 4-pt U-turn as a parallel-side Z between two nodes; start===end means rS===rE, so port-slide collapsed it to a zero-length segment [(60,0),(60,0)]. Isolated via per-pass point logging in runLateQualityPasses (only this pass mutated it 4→2).
- approach: guard `String(e.start) === String(e.end)` → skip, matching portSideReselect / directionConstraints self-loop guards. Literature (papers-query): 2309.01671v2 same-side U-bend ports; diss §5.5 removes self-loops from bend-reduction entirely.
- files: domus/pipeline/flaggedEdgeRemediation.ts (+8 lines)
- result: KEPT (commit 57b73875b) — sweep 47/47 pass, invalid 0. domus/self-loop 1000→995, aggregate total 44214→44209 (−5). selfLoop.layout.spec.ts FAIL→PASS. Wider domus suite 22→20 failing (0 new; remaining 20 pre-existing, unrelated to self-loops).
- lesson: KEPT despite −5 total because the scorer is the wrong ruler here — validateLayout rewards the DEGENERATE collapsed self-loop 5 pts ABOVE the correct U-bend (no length/bends). Pure hill-climb would revert a correct, spec-passing, literature-backed fix. Instrument gap: validateLayout does not penalize zero-length / collapsed self-loops. Any generic route-simplifier that can touch start===end edges is unsafe until the scorer flags degenerate self-loops.

run ended: user-directed target achieved (self-loop U-bend restored, dedicated spec green) — total 44214 → 44209 (−5, scorer-artifact; render corrected)

## Follow-up (user-directed, post-loop) — instrument change
- User explicitly authorized editing the scorer (normally off-limits) to penalise a non-rendering self-loop.
- change: new HARD core check `edge-self-loop-not-rendered` in layout-utils/validateLayout.ts — a self-loop (start===end) must reach ≥ EPS_SELF_LOOP_EXTENT (4px) outside its node, else invalid. +3 unit tests in validateLayout.spec.ts.
- commit: cf4d19ca3
- effect: collapsed self-loop now scores 0/invalid (was 1000); correct U-bend stays 995. DDLT aggregate unchanged (44209) since the fixture already renders the U-bend after 57b73875b. Instrument gap from round 1 lesson is now closed — a future self-loop collapse trips the DDLT validity floor.
- verified: browser render of self-loop.mmd (layout: domus) shows the U-bend; screenshot shared with user.

## Run 2026-08-10T09:23 — branch domus-loop/20260810T0923-subgraph-edge
- base: 62bc3c950 (self-loop routing + scorer commits). baseline total 44209, invalid 0, 47/47 pass.
- goal: user-directed — fix the broken three-->two subgraph-to-subgraph edge in subgraph-variation-2 ("ends somewhere in between").

### 2026-08-10 09:23 — round 1
- target: domus/subgraph-variation-2 (DDLT 1000/valid, but three-->two renders as a stub ending mid-gap; rendered path 'd' contains NaN).
- root cause: remediateFlaggedEdgesWhenMonotone accepted a compound reroute candidate ending in a coincident-point tail [start,end,end] (zero-length final segment). validateLayout's normalizePolyline collapses the dup before scoring, so it scores identically to the clean route and passes the monotone gate; the renderer feeds RAW points to curve interpolation → divide-by-zero → NaN in path → truncated edge. Isolated via per-pass point logging: clean 2-pt survives RP1 + routeAndRepair; dup appears only in compound-placement polish (remediateFlaggedEdges).
- approach: dropConsecutiveDuplicatePoints() sanitizes each remediation candidate before the monotone test. Deduped route [start,end] validates identically → still accepted, no NaN tail. (Literature not consulted: zero-length-segment rendering degeneracy is a renderer-hygiene issue outside the graph-drawing corpus's scope; strong code evidence from the trace.)
- files: domus/pipeline/flaggedEdgeRemediation.ts (+dedupe helper, applied in candidate loop)
- result: KEPT (commit b675c001d) — sweep 47/47, invalid 0, total 44209 UNCHANGED (scorer normalizes dups → blind to the fix). Wider domus suite: identical failure set with/without (0 new). Browser render of subgraph-variation-2 now shows three-->two reaching the two boundary.
- lesson: SAME instrument gap as the self-loop, generalized: validateLayout's normalizePolyline hides ALL coincident-consecutive-point degeneracies from the score, but the renderer NaNs on them. A raw-polyline "no zero-length segment" check in the scorer would catch this whole class (recommended follow-up, like edge-self-loop-not-rendered). Any candidate-generating pass can emit such a tail; a final raw-polyline sanitize in layout() would be the fully robust guard.

run ended: user-directed target achieved (three-->two edge reaches the two boundary; NaN gone) — total 44209 → 44209 (scorer-blind; render corrected)

## Follow-up (user-directed, post-round) — robustness checks for zero-length edge segments
- User authorized two instrument/layout guards against the coincident-point degeneracy behind the subgraph-variation-2 bug.
- (1) PREVENT: stripDegenerateEdgePoints() at end of domus layout() — drops consecutive coincident points from every edge before the renderer.
- (2) DETECT: edgeZeroLengthSegmentExtension (HARD, edge-zero-length-segment) wired via validateLayoutProxy — flags any raw coincident-point pair; also lets score-gated passes reject degenerate candidates at the source.
- scope lesson: FIRST cut put the check in CORE validateLayout → invalidated 23 SWIMLANES fixtures (that backend emits coincident points its renderer tolerates; the domus sanitize doesn't reach it). Moved to the DOMUS extension → swimlanes untouched. Core only gains the shared issue-type name. This is exactly what validateLayoutProxy/extensions exist for.
- commit: def3808c9. DDLT sweep 47/47, invalid 0, total 44209 unchanged (sanitize keeps domus clean → check is a dormant backstop). +4 extension unit tests; wider domus suite 0 new failures.
