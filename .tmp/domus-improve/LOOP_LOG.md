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

## Run 2026-08-10T10:05 — branch domus-loop/20260810T-diamond-intersect
- base: 1afb81f67. baseline total 44209 (avg 982.4, min 828, invalid 0, cases 45), sweep 47/47 pass.
- goal: user-directed — diamond (decision) nodes: edge endpoints stop short of the drawn rhombus face (incremental-editing and other domus fixtures).
- probe data: node box for a diamond is a SQUARE s×s (s = w+h of the label box); the drawn rhombus is inscribed, touching the box only at the 4 side midpoints (apexes). DOMUS places ports anywhere along a box side -> gap = distance from apex. incremental-editing: overlap.left ports at dy=+57.5 and +82.2 -> 57.5px and 82.2px OUTSIDE the rhombus; compare.left ports at dy=±1.8 -> ~1.8px out. Incoming top/bottom ports sit at dx=0 -> exactly on an apex (correct today).
- instrument note: layout-side inward clipping to the true face is BLOCKED — `edge-endpoint-inside-node` is a HARD check (rect model, shape-blind), so any endpoint moved inside the square box invalidates the fixture.

### 2026-08-10 11:35 — round 1
- target: domus/incremental-editing (DDLT 967/valid) — user-reported: edges to/from `diamond` nodes stop short of the drawn rhombus. Class defect, not fixture-specific.
- root cause: a `diamond` is drawn as a rhombus INSCRIBED in a square box (question.ts: s = labelW+labelH, so w==h), touching the box only at the 4 side midpoints. DOMUS routes/validates on the BOX and paints DOMUS polylines verbatim (skipLayoutAdjustments=true), so any port not at a side midpoint terminates in empty space. Measured: overlap.left ports rhombT 1.500 / 1.715 (57.5px / 82.2px outside the face), compare.left 1.020 / 1.020.
- literature (papers-query, papers_query_ok true): corpus NEVER models non-rect vertices — "boxes whose shape is restricted to a rectangle" (1405.2300v1); libavoid/EditLens both substitute the bounding box. Shape enters only at the end: dot "the spline is clipped to endpoint node shapes" (TSE93 §5); ordered bundles keep a box obstacle for routing + "the node boundary curve" as the hub where drawn paths terminate (1209.4227v1 §5.1). Apex-only ports appear NOWHERE and equal one-port-per-side = degree-4 Tamassia (bekos-kaufmann), which `overlap` (2 edges on one side) already violates → rejected.
- approach: clip ONLY the painted terminal points onto the drawn outline, in DOMUS's own paint (adjustLayout), leaving LayoutData as the validated box-terminated geometry (the two-representation split). Walks inward along the terminal segment's OWN axis (paint's center-ray intersect would tilt the segment off-axis), bracketing the crossing between the endpoint and the box center line, then bisecting on an inside/outside test built from the shape's own `node.intersect`. Generic: box-filling shapes report the endpoint as already on the outline → no-op; works for hexagon/trapezoid/circle too.
- files: domus/pipeline/paintShapeClip.ts (new, +10 unit tests), domus/adjustLayout.ts (clip + line-hop geometry uses painted points), .cspell/code-terms.txt (Tamassia)
- result: KEPT — DDLT sweep 47/47, total 44209 UNCHANGED, invalid 0 (paint-only; the scorer measures layout geometry and is structurally blind to this defect). Browser (dev-explorer, layout=domus): overlap rhombT 1.500/1.715 -> 0.989/0.989, compare 1.020/1.020 -> 0.985/0.985; before/after screenshots confirm the edges now meet the face. No new test failures: paintSmoke 2 failed pre AND post (architecture timeout, mindmap parse — pre-existing); company.layout+domus.compound (the only other render-path specs) 3 failed pre AND post, same names. The +1 in the full-suite parallel run was a load-induced timeout, not a regression.
- lesson: THIRD instance of the same instrument gap, and the widest: validateLayout models every node as its rect, so it cannot express "endpoint on a non-rectangular outline" — worse, `edge-endpoint-inside-node` is HARD, so it actively FORBIDS the literature-backed fix inside the layout stage. That is why this had to land in paint. Probe accuracy is capped by mermaid's own shape code: question.ts translates the polygon it DRAWS by +0.5x while the calcIntersect it installs subtracts 0.5 from BOTH coords, so the probe lands up to 2px short (always short, never deep) — hence SAFETY_INSET=2. Any future scorer work here should validate against a shape outline, not the rect.

run ended: user-directed target achieved (diamond edge attachment lands on the drawn face) — total 44209 → 44209 (scorer-blind; render corrected)

#### Follow-up within round 1 — guard fix found by cross-fixture check
- Checked the generic claim on domus/life-choices (hexagon). Its 4 ports on `B` sat EXACTLY on the drawn outline before the pass, and the pass moved 2 of them ~2px inward: the accept guard was `travelled + inset >= MIN_CLIP`, so the safety inset alone could satisfy it and a correct endpoint got nudged.
- fix: require a real gap first — `travelled >= MIN_CLIP` — and only then spend the inset. +2 unit tests built on hexagon.ts's real geometry (flat side on the box boundary → no-op; slanted end → still clips).
- re-verified: life-choices hexagon ports back to 0.0px from the outline; incremental-editing diamonds still attached (0.3px, the two apex-entering ends unchanged at 1.1px = the pre-existing arrowhead marker allowance). DDLT sweep 47/47, total 44209, invalid 0 (exit code 1 from the known `[vitest-worker] Timeout calling "onTaskUpdate"` flake, not a fixture failure).
- lesson: a "no-op when already correct" claim needs a fixture that IS already correct. The diamond fixture could not have caught this — only a shape whose outline touches the box side could.
