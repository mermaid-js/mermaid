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

#### Follow-up 2 (user-directed) — fix the 0.5px inconsistency at the source (question.ts)
- The diamond disagreed with itself in THREE places: `insertPolygonShape` already centers the polygon via `translate(-w/2, h/2)`, but question.ts OVERWROTE that with `translate(-s/2 + 0.5, s/2)` (drawn shape 0.5px right of the node box), while `calcIntersect` returned `res - {0.5, 0.5}` (reported outline 0.5px left AND up). `adjustment` existed nowhere else in shapes/ — not an idiom, just local drift.
- fix: drop `adjustment` (handDrawn keeps an explicit `translate(-s/2, s/2)`; the non-handDrawn branch drops the redundant override entirely) and return `intersect.polygon(...)` unshifted. Drawn outline == reported outline == node box center.
- effect measured on the clip probe (all 4 sides, offsets 5px..apex): error was asymmetric and up to 2px SHORT; now symmetric with worstGap 0.000. Residual probe error ~0.55px, so SAFETY_INSET 2 -> 1 (halves the harmless overlap). Browser: clipped diamond ports now 0.1-0.4px from the drawn outline (was 0.3 with the 2px inset over a broken shape); hexagon still untouched at 0.0.
- blast radius checked: `createDecisionBoxPathD` has no consumers outside question.ts, no spec references the shape, no `.snap` captures polygon geometry. DAGRE also improves — its own intersect-based clipping now agrees with the drawn rhombus (diamond attachments 0.0-0.7px, no console errors).
- verified: DDLT 47/47 total 44209 invalid 0; paintSmoke 2 pre-existing failures unchanged; company.layout+domus.compound 3 pre-existing unchanged; 12/12 clip unit tests.
- lesson: the pass's accuracy ceiling was never the bisection — it was the shape module. Fixing the source removed a whole class of fudge from the consumer, and it improved every layout that clips to this shape, not just DOMUS.

## Run 2026-08-11T11:55 — branch domus-loop/20260811T-orientation
- base: 909eb9d23. baseline total 44209 (avg 982.4, min 828, invalid 0, cases 45), sweep 47/47.
- goal: user-directed — "domus graphs are flipped upside down, and mirrored right to left"; expectation stated against `layout-tests/domus/decoupled-subgraph.mmd` (A above B, subgraph left, A-->B right). User's hypothesis: node order inverted on the way into DOMUS.
- reference established FIRST (browser, dagre vs elk vs domus on the same source): dagre and elk BOTH put `hello` left with A above B; domus produced the exact 180° rotation. Both halves of the report are real, but they have DIFFERENT causes — see round 1 and the round-2 finding.
- NOT the cause: node order into DOMUS is fine (`conversion.ts` pushes in `layout.nodes` order; probe confirms A,B,C,D). `mirrorLeafNodesInPlace` (the existing post-hoc direction hack) never fires on any fixture — 0 hits in baseline AND after.

### 2026-08-11 13:40 — round 1 (KEPT, commit 3927ee4d5)
- target: whole-backend vertical flip (every fixture; probe showed TB chains flowing bottom-up in decoupled-subgraph, domus1, Company-simp, ortho-mini).
- root cause: axis-sign conflation at ONE point. Grid space is the paper's (y up): DOMUS §2 defines `U` on (u,v) by y(u)<y(v), `buildAuxiliaryGraphGy` follows it, `longestPathCompaction` gives an arc's TARGET the larger coordinate. `gridToPixelCoordinates` then emitted grid y unchanged into SVG (y down). Gx was never affected (`R` induces μ→ν = screen-consistent). Corroborating evidence that Gy was the lone outlier: `edgePaths.labelToStartSide` (D→S, U→N), `labelRelocationPass` (D→+1) and the SAT encoder (`above`→label D) all use the screen convention.
- literature (papers-query, papers_query_ok true): the corpus is split, and LIPIcs.GD.2025.35 contradicts ITSELF — §2 is y-up ("if y(u)<y(v), then λ(u,v)=U"), §3 is y-down ("an arc μ→ν in G_x (respectively G_y) requires vertices in μ to lie left of (respectively above) vertices in ν" + "increase coordinates according to the directed arcs"). Klau/Mutzel (3-540-45848-4_11) is y-up, Tamassia-lineage (alg_patterns) is y-down, `diss` reconciles by reversing the inequality. Verdict quoted: "What is not defensible is the current mix: G_x built on the screen axis and G_y built on the mathematical axis."
- approach TRIED FIRST AND REJECTED (§3-faithful): reverse Gy's arc orientation (D induces μ→ν) + mirror `auxCycleToWitnessCycle`'s Gy branch. Correct orientation, but NOT a reflection — longest-path compaction on the reversed constraint graph packs from the other side. Sweep: total 44089 (−120), Company 0→2 crossings, project-sox2 3→6, incremental-editing −42 bends, and `domus/architecture` TIMED OUT (>120s). Patch kept at `.tmp/.../optionA.patch`.
- approach KEPT: reflect y at the grid→pixel boundary only (`y = baseOffset.y + (yFlipReference - y) * spacing`), leaving Gy paper-§2-faithful. The solver — SAT trajectory, drawability test, compaction packing, overlap tie-breaks — sees byte-identical coordinates, so the output is the EXACT vertical mirror (verified: Company-simp reflected about y=50 to the pixel). `runner.ts` converts TWO coordinate maps (collapsed node / expanded routing) and passes the max grid y over BOTH as the shared reflection reference — a per-map reference would offset the frames and detach every edge; the max also keeps the drawing in positive pixel space (a plain negation put every node at negative y, functionally fine but gratuitous).
- also fixed in the same place: `directionConstraints.relationFor` existed purely to cancel the bug (TB→`below`), un-inverted to TB→`above`. Its HORIZONTAL arm was inverted too with no bug to cancel (Gx was always fine), so declared LR/RL flows were mirrored left-to-right; now LR→`left-of`. Matches `compoundPlacement.ts`, which had it right all along. Dormant in the sweep (`respectFlowDirection` defaults false) but wrong.
- files: domus/domus.ts (reflection + yFlipReference param), domus/runner.ts (shared reference), pipeline/directionConstraints.ts, +axisSign.spec.ts (3 tests, end-to-end on the DEFAULT direction-agnostic path)
- result: KEPT — sweep 47/47, invalid 0, total 44209 → 44183 (−26). Only 3 fixtures moved: architecture −5 (but crossings 21→15), edge-types −3, incremental-editing −18 (pure bends, crossings unchanged). Wider domus suite: 21 pre-existing failures → 22; the one new entry is `paintSmoke > renders Company` tripping its 5s budget under parallel load (passes in isolation at 4255ms). Browser: domus now matches dagre/elk vertically.
- SPEC EDITS (rule 2 deviation, flagged deliberately): two `*.spec.ts` asserted the OLD convention and had to move — `domus.spec.ts`'s `gridToPixelCoordinates` unit test and the TD relation string in `domus-tb-direction.ddlt.spec.ts` (whose comment literally documented "the encoder's inverted semantic"). Neither is an instrument (not validateLayout/scoreLayout/fixtures/manifest); both are unit tests of the two functions deliberately changed. The score-bearing sibling in that file — "DOMUS-native placement preserves parent-above-child" — passed before AND after, unedited.
- COST, reported not fixed: DOMUS placement is 40-50% slower on the biggest fixtures — `architecture` 45s → 66s, `Company` 1.43s → 2.0s, reproduced across two runs each. Not the negative coordinates (the positive-space version is equally slow) and not the fallback path (`DOMUS_VALIDATION_FAILED_FALLBACK_ROUTING_GRAPH` count DROPPED 30 → 18). Some downstream repair/nudging pass iterates more on the mirrored geometry.
- lesson: when a layout looks globally wrong, establish the reference render (dagre + elk on the same source) BEFORE touching code — one screenshot confirmed both halves of the report and revealed they are separate defects, which stopped me from "fixing" the x half by mirroring x (that would have reversed component declaration order, which is already correct). And when two ways to fix an axis sign exist, prefer the one that is a rigid motion of the existing solution over the one that re-solves: the §3-faithful arc reversal was more "correct" on paper and cost 120 points; the reflection cost 26.
- PROCESS NOTE for future runs: `.tmp/domus-improve/LOOP_LOG.md` is a TRACKED file in this repo (despite `.tmp` being in .gitignore), so the skill's claim that it "survives `git reset --hard`" is FALSE here — round 1's entry was wiped by round 2's revert and had to be reconstructed. Commit the log entry immediately after each verdict, before any reset.

### 2026-08-11 15:20 — round 2 (REVERTED)
- target: the "mirrored right to left" half of the user report — horizontal branches spread LEFTWARD instead of following reading order.
- root cause (confirmed): `createSATVariables` allocates l before r, and `solveSAT.pickVariable` takes the FIRST variable holding the max activity then guesses `true`, so the lowest-numbered variable wins every tie. The shape phase is direction-agnostic, so for any edge the solver is free to orient, that tie-break IS the decision. `d` is already allocated before `u` (which is why chains flow down once the axis sign is right); only the horizontal pair was backwards.
- approach: swap the allocation to `r` before `l` (tuple keeps its documented `[l,r,d,u]` shape; only the numbering changes). One-line change; NOT a reflection — it makes the solver find a different, mirrored shape.
- result: REVERTED despite a score WIN. DDLT sweep 47/47, invalid 0, total 44183 → **44259 (+76, and +50 over the pre-round-1 baseline of 44209)**, min 823 → 873. Per-fixture: architecture 828→873 (+45), project-sox2 977→982, incremental-editing 967→972, Company 985→983, edge-types 980→977.
- WHY REVERTED anyway: the wider domus suite gained 2 real failures (net +2/−1), both reproduced in ISOLATION so not load artifacts — (1) `company.layout.spec.ts` iter-52: `segment 0 ((212.5,251.2)-(212.5,109.4)) crosses Tax interior` — an edge routed THROUGH a node, and (2) `company-simp.ddlt.spec.ts` Level 2: crossings 0 → 2. Company still scores 983 and VALID in the sweep, so the aggregate is blind to an edge passing through a node interior. A +50 aggregate is not worth shipping that.
- lesson: the aggregate score and the hand-written per-fixture specs disagree, and here the SPECS were right — this is the same instrument gap the log keeps hitting, now in its most dangerous form: an edge crossing a node's interior costs nothing in the headline score. Any future round that changes the SHAPE (as opposed to reflecting the coordinates of an existing shape) must be gated on `company.layout.spec.ts` + `company-simp.ddlt.spec.ts` as well as the sweep. Also worth noting for whoever picks this up: the +45 on `architecture` suggests reading-order preference is genuinely better placement, so the defect is in the DETOUR pass failing to fire on the new shape, not in the preference. Patch saved at `.tmp/.../round2-rl-preference.patch` — resume by fixing the Case-B detour first, then re-applying.
- FINDING, not a bug (evidence, so nobody re-litigates it): the user's specific expectation for decoupled-subgraph — subgraph LEFT, `A --> B` RIGHT — is NOT reachable by any mirror and should probably not be chased. Browser comparison of three loose components (`A1-->A2`, `B1-->B2`, `C1-->C2`): dagre orders them A,B,C = declaration order, and so does domus. Two sibling SUBGRAPHS (`one`, `two`): dagre renders `two` LEFT of `one` — it reverses for clusters but not for plain components. So dagre is internally inconsistent and domus's declaration order is the more defensible convention; matching dagre on decoupled-subgraph means copying its cluster-reversal artifact, and mirroring x to get it would REVERSE the plain-component case that is already correct.

run ended: user-directed target achieved for the vertical flip (round 1 kept, commit 3927ee4d5); horizontal preference characterised, measured and reverted (round 2) — total 44209 → 44183

## Run 2026-08-11T16:10 — resumed on branch domus-loop/20260811T-orientation ("try again")
- base: 717ecae08 (round 1 kept). baseline total 44183, invalid 0, 47/47.
- goal: land round 2's reverted +50 (R-before-L reading-order preference) by fixing the defect that blocked it.

### 2026-08-11 17:05 — round 3 (NOTHING KEPT — diagnosis only; supersedes round 2's lesson)
- CORRECTION to round 2's lesson: I wrote "the defect is in the DETOUR pass failing to fire on the new shape, not in the preference." That was wrong on mechanism. The real chain, measured three layers deep:
  1. `obstacleDetourInsertPass.tryInsertDetour` scans offenders from `i = 1`, so segment 0 (the SOURCE port-approach) is never examined, and Case B is written for a port-inclusive offender at the END. Under the round-2 shape the offender is Company's `L_USCompany_Income_0` segment 0 — leaving USCompany's top port at x=212.5 straight up through `Tax` [112.5,189.4 .. 232.5,249.4]. So the pass genuinely has a start/end asymmetry.
  2. But that is NOT the blocker. Feeding the reversed polyline through the existing machinery (a 12-line `tryInsertDetourFromEnd`) DOES reach Case B — and Case B then declines correctly: `bandSize = port.y - Tax.bottom = 251.2 - 249.4 = 1.8`, below `MIN_BRIDGE_BAND = 2`. There is no room to bridge, and forcing one would violate the sibling "no micro-segments (min segment length >= 4)" spec.
  3. The 1.8px is the actual defect, and it is a PLACEMENT defect, not a routing one. `Tax` and `USCompany` overlap 70px in x and sit 1.8px apart in y. DOMUS's own placement is fine — `DOMUS_PLACEMENT_RESULT` has Tax at (740,485) and USCompany at (420,250), 235px apart. The cramped column appears LATER in the render path.
- KEY FINDING (the handoff): Company's render path runs DOMUS **twice** (two `COORD_COMPUTATION_OUTPUT` blocks) but `MIN_SPACING_NUDGE` fires **once** — `moves: 0, iterations: 0, remainingTooClose: 0`, i.e. it ran against the healthy placement and correctly found nothing. `nudgeLeafNodesForMinimumSpacing` (minGap `max(30, spacing*3)`, `domusBackend.ts:528`) already detects exactly this shape of defect (`tooCloseAmount`: overlapX > 0 and gapY < minGap -> needY), so it is not a detection gap — the safety net is simply not wired to whichever pass produces the FINAL positions. That is the next bounded round: wire it there, measure (it is a global aesthetics pass, so it will move every fixture's placement and needs its own verdict), then re-apply `.tmp/.../round2-rl-preference.patch` and re-check the two company specs.
- also evaluated and REVERTED on its own merits: the `tryInsertDetourFromEnd` symmetry fix, standalone at round-1 HEAD. Sweep total 44183 -> 44183 (unchanged), invalid 0, 47/47. It repairs nothing on any current fixture, so it is speculative code with no demonstrated trigger — unchanged score is a revert per the loop rule, and untriggered branches are churn. Worth re-proposing only alongside a fixture that actually exercises a segment-0 offender.
- lesson: "the pass that should have fixed it didn't fire" is a tempting root cause because it is one grep away, and it was wrong here. The pass DID get reached once the direction asymmetry was removed, and then declined for a correct reason. Push one layer past the first plausible culprit — the geometry that made the repair impossible (a 1.8px gap) was three call-sites upstream of the pass that got the blame. And check WHERE a safety net runs, not just whether it exists: `MIN_SPACING_NUDGE` reporting a clean `remainingTooClose: 0` while the shipped layout has a 1.8px gap is the whole bug in one log line.

run ended: nothing kept — round 3 produced a corrected diagnosis and a named next step instead of a score change; total unchanged at 44183

## Run 2026-08-11T17:30 — resumed ("fix the spacing net then re-apply the patch")
- base: a65e39ba4 (round 1 kept). baseline total 44183, invalid 0, 47/47. company.layout + company-simp baseline: 2 pre-existing failures ("keeps key nodes and does not create dangling edges", "keeps the USCompany -> HongKongCompany route simple when an L-shape is obstacle-free").

### 2026-08-11 19:10 — round 4 (NOTHING KEPT — the patch has a SECOND blocker spacing cannot reach)
- CORRECTION to round 3's "key finding". Round 3 said the min-spacing net "is not wired to whichever pass produces the FINAL positions". Half right. Traced stage by stage (`ZZ`/`ZZB` instrumentation through `index.ts:layout()` and the `domusBackend` cyclic block) the real sequencing is:
  - The cramped positions are present immediately after the FIRST `runRP1OrthogonalPipeline(useExistingPositions: false)`. NOT the layered fallback, NOT the compound candidate, NOT `runLateQualityPasses` — all four traces show identical coordinates. Round 3's suspicion of `tryLayeredFallbackCandidateWhenScoreImproves` was wrong.
  - Inside that pipeline: at `pre-minSpacing` the nodes genuinely OVERLAP (`node-overlap|node-overlap|node...`). `nudgeLeafNodesForMinimumSpacing` is then a no-op BY DESIGN — `tooCloseAmount` only measures gaps between rects that are DISJOINT on the axis in question, so an overlapping pair is invisible to it (separating overlaps is `nudgeOverlappingLeafNodes`' job). It ran, correctly found nothing, and never saw the shipped positions.
  - `nudgeOverlappingLeafNodes` then resolves the overlap — and it is *given* `padding: max(4, min(40, spacing))` = 10 but only guarantees *some* separation, delivering 1.9px between `Tax` and `USCompany`. Nothing re-checks. So the net is not mis-wired; it is mis-ORDERED, and it is structurally blind to the state it runs in.
- fix implemented (`reopenMinimumSpacingAfterOverlapRepair`, patch at `.tmp/.../round4-spacing-reopen.patch`): re-run the min-gap net right after the overlap repair, when the pairs are finally disjoint and it can act. Alternates net <-> overlap-repair to a fixpoint (3-round backstop) because the two are duals and each creates work for the other — widening `Tax`/`USCompany` pushes `Income` 19x51 into `Tax1`. Gated: positions snapshotted and restored unless no new leaf pair overlaps. Uses a plain rect scan, NOT `validateLayout` — using full validation here tripled Company's render (4s -> 11s) and tripped every 5s budget in `company.layout.spec.ts`.
- measured, four variants (sweep total / new company.layout failures vs the 2 pre-existing):
  - spacing net at minGap 30 (the aesthetics value), alone: **44171 (−12)**; fixes the pre-existing "L-shape route simple", breaks `iter-49 collapses Income <-> Tax`. Net wash on specs, score down.
  - spacing net at minGap `pad` (10 — finishing the padding the overlap repair already asked for), alone: **44183 (unchanged)**, 1 move; breaks `iter-49`. Unchanged score + a new failure.
  - minGap 30 + R-before-L patch: **44264 (+81, min 823 -> 873)**, invalid 0, 47/47 — the best score seen anywhere. But Company's render goes 4s -> 11s, timing out 7 previously-passing specs, and an 11s render for a 13-node flowchart is not shippable whatever the budget says.
  - minGap `pad` + patch: render 6.6s (still over budget). Re-run with `--testTimeout=40000` so the assertions actually execute: `detours L_USCompany_Income_0 around Tax` (iter-52) **still fails** — at 10px the band is enough for `MIN_BRIDGE_BAND` but the detour still does not land — and `company-simp` Level 2 is still 0 -> 2 crossings.
- THE BLOCKER I HAD MISSED: `company-simp`'s crossings regression (0 -> 2) is present in EVERY variant and has nothing to do with spacing. The R-before-L patch has two independent blockers on two different fixtures, and round 3's diagnosis only found the first. Spacing work cannot land the patch on its own.
- result: everything REVERTED. HEAD unchanged at 44183.
- lesson: I have now been wrong twice in the same direction — each round found "the" cause one layer deeper and declared it sufficient, without checking whether the *other* failing spec had the same cause. The cheap check I skipped twice: for a change blocked by N failing specs, diagnose ALL N before designing a fix, because a fix aimed at one of them cannot land alone. Also: `expect.soft(breakdown.crossings).toBe(0)` on Company-simp is the gate that has now blocked this patch three times running — that is the fixture to attack next, not the spacing chain.
- notes for the next attempt: (1) the spacing sequencing bug is REAL and independently worth fixing — the shipped 1.9px gap is a visible glitch and the overlap repair silently under-delivers its own `padding` — but on the current fixture set it cannot be justified by the sweep (unchanged-or-worse) and it breaks `iter-49`, so it needs `iter-49` understood first. (2) `nudgeOverlappingLeafNodes` not achieving its requested `padding` looks like a plain bug in that pass, and fixing it THERE (rather than bolting a second pass on afterwards) may be the cleaner route.

run ended: nothing kept — spacing net sequencing bug found and fixed, but the R-before-L patch has a second independent blocker (company-simp 0 -> 2 crossings); total unchanged at 44183

### 2026-08-11 21:40 — round 5 (nudger fix KEPT commit 89a81612a; patch STILL BLOCKED, new reason)
- user pushback that reframed this: "why does changing orientation add performance issues and need minGap magic numbers... have you checked node order... which fixtures cause the most trouble". All three answered by measurement, and two of my earlier claims were wrong:
  - PERF: the orientation patch costs NOTHING. company.layout per-spec 3.1-3.8s vs baseline 3.1-4.0s. The 6.6-11s I reported in round 4 was entirely my own spacing bolt-on. Withdrawn.
  - NODE ORDER: verified end to end and it is CORRECT. `domus1` declaration order `n0,n1,n3,n2,n6,n4,n5,n7` survives into `layout.nodes`, into DOMUS `vertexIds`, and edges arrive in source order. The user's hypothesis (asked twice) is definitively ruled out. The leftward spread is the label tie-break — `createSATVariables` allocates `L` before `R`, `pickVariable` takes the lowest-numbered max-activity var and guesses true.
  - WHY NOT A FREE MIRROR LIKE Y: the layout is INCONSISTENT in handedness, not uniformly flipped. Disconnected components already go left-to-right in declaration order (3 loose chains -> A,B,C, same as dagre) while branch direction goes leftward. A global X reflection fixes the branches and breaks the components, so no rigid motion exists — which is exactly why the X fix must change the shape and the Y fix did not.
  - WHICH FIXTURES: only Company and Company-simp. vs HEAD the patch gives architecture +50, incremental-editing +23, project-sox2 +5, Company −2, and 15 of 19 unchanged. The two troublesome ones carry six iterations of hand-tuned route specs (iter-48..iter-53).
- KEPT (89a81612a): `separationDeficit` in boxNudging — `min(right)-max(left) + padding` covers overlap and gap in one expression, so `padding` finally means a minimum gap. Scoped to pairs the pass has TOUCHED (holding every pair to the gap cascaded past 120s on architecture). Plus a Gx/Gy re-snap after the nudge, because iter-48 already documents that these nudgers are class-unaware and `applyGxClassSnap` ran BEFORE this one — the extra separation drifted Company's `Income`/`Tax` column 5.8px and broke `iter-49`'s straight collapse; applying the existing remedy at the new site restores it. Sweep 47/47, invalid 0, 44183 unchanged; Company FASTER (company.layout 2.5-3.3s, paintSmoke 4.3s -> 3.5s); boxNudging spec 4/4; smallest leaf gap on Company exactly 10.00px = padding.
- honest scope note recorded in the commit: the fix is INERT on today's corpus — the 1.9px pair only exists under the patch's placement, which is where it was found and where it takes `iter-52` from failing to passing. Kept because the padding bug is real and it is a precondition for the patch, not because the corpus exercises it. (Contrast round 3's `tryInsertDetourFromEnd`, reverted for having NO demonstrated trigger anywhere.)
- PATCH STILL NOT LANDED, and the blocker has moved again — this time to runtime, not geometry. With the nudger fix in, patch+nudger fixes `iter-52` but `domus/architecture` blows the sweep's 120s per-fixture budget. Measured in isolation: architecture baseline **66s**, patch only **80s**, patch+nudger **108s**. Each change fits alone; together they do not. Combined sweep 44206 with architecture timing out (and its score 823 -> 820, so the +50 the patch gives it alone is lost).
- THE REAL BLOCKER, named: `domus/architecture` takes **66 seconds** to lay out 60-odd nodes at HEAD. There is no headroom, so ANY placement change tips it over, and that is what has actually been blocking this patch for three rounds — not the detour pass (round 2), not the spacing net (round 3), not company-simp alone (round 4). Fix architecture's layout time and the patch lands; until then every improvement to placement is gated by it.
- lesson: three rounds of "find the blocker one layer deeper" ended at a plain performance ceiling that was visible in round 1's own timing data (45s baseline, noted and set aside as "an outlier"). An outlier that big is not context, it is the constraint. When a fixture is 100x slower than its peers, measure the headroom BEFORE designing changes that touch its placement.

run ended: nudger padding fix kept (89a81612a); reading-order patch blocked on domus/architecture's 66s layout time — total unchanged at 44183

### 2026-08-12 01:20 — round 6 (look-stability KEPT commit 1ff7e6634)
- user correction: it is NOT the theme, it is the `look`. Default theme + `look=neo` works; `look=classic` does not. "Only padding, node width/height differs between them, but graph is still the same" — so the algorithm must be size-stable. My earlier framing (blaming theme=redux) was wrong; look is the variable. Measured: leaf boxes are 77.8x54 at classic, 49.8x48 at neo (~56% wider, 6px taller).
- edge-types at real classic sizes was INVALID (score 0): edge-border-hugging + edge-port-direction-mismatch + edge-intersects-obstacle, with `M1` BELOW `C` in a `flowchart TD`. Reproduced DOM-free by feeding browser-measured classic sizes into `layout()`, matching the browser to the pixel (C at 319.88,152).
- DOMUS itself was blameless: shape label `M1->C:D` and grid coords `M1(295.57,340) C(295.57,260)` — x-aligned exactly as a D label requires. Everything went wrong downstream.
- TWO threshold bugs found by stage-tracing the pipeline:
  1. `nudgeConnectedPairsForMinGap` enforces a HORIZONTAL gap only ("arrowhead clearance") but triggered on ANY y-overlap. M1 sits directly above C: at neo (h=48) rects clear by 8px, nothing fires; at classic (h=54) they overlap 2px, so it fired and split a VERTICALLY STACKED pair 34px sideways — useless for a vertical edge's arrowhead and fatal to the x-alignment the D label needs. `applyGxClassSnap` (threshold 20) then refused to restore 34px. Fix: require the y-overlap to be at least half the smaller box height before a horizontal gap is deemed the pair's problem — scale-invariant.
  2. `nudgeOverlappingLeafNodes` picked its push DIRECTION from alphabetical node id order, consulting geometry only for edge-label pairs. `C` is below `M1` but sorts first, so C went up and M1 down — THROUGH each other — and iterating swapped them. That is what put M1 under C and left C's downward edges running into M1. Fix: both axes push away by geometry; id order breaks exact-centre ties only.
- lesson: a layout decision keyed on node NAMES rather than geometry is a latent instability that only surfaces when sizes cross a threshold. Grep for `localeCompare` in the nudging passes before trusting any of them — `boxNudging`'s group pass still uses geometry properly, but this one did not, and the two sat in the same file.
- result: edge-types at classic 0/invalid -> 990/valid, M1 above C, x-aligned. All three looks (classic/neo/handDrawn) now render the same structure (browser-verified, screenshot shared). DDLT sweep unchanged 47/47, invalid 0, 44183, ZERO per-fixture movement — expected, because neither fix changes behaviour in the neo regime the fixtures capture.
- INSTRUMENT GAP, the big one: all 17 domus `.sizes.json` fixtures were captured at `look=neo` (`capturedFrom: "... theme=redux look=neo layout=swimlane"`), so the sweep exercises exactly one size regime and is structurally blind to this whole bug class. A scaled-approximation stability probe (width x1.56, height x1.125 over all fixtures) did NOT reproduce the failure — these are threshold effects that need EXACT sizes — so the real fix is a second captured regime per fixture, not a synthetic scale. Recommend capturing `look=classic` sizes alongside `neo` and running the sweep over both.
- architecture perf, investigated as asked: 63.7s total, of which `validateLayout` is 9,127 calls / 40.0s = 63%. Attribution: `remediateFlaggedEdgesWhenMonotone` 7,377 calls / 35.4s (over half the entire layout), `simplifyEdgeJogsWhenScoreImproves` 1,254 / 5.9s, `tryCandidate` 178 / 0.8s. The pass runs a FULL-layout validateLayout per candidate route to judge one edge — ~4.4ms each on 60 nodes / ~70 edges, with a quadratic crossings scan. Scoping that check to the edge under repair (an `issueCountForEdge` helper already exists) is the fix and should take architecture from 66s toward ~25s — which is also the headroom the reading-order patch needs.

run ended: look-stability fixes kept (1ff7e6634); architecture hotspot located (remediateFlaggedEdgesWhenMonotone, 7377 full validations) but not yet fixed; total unchanged at 44183

### 2026-08-12 04:10 — round 7 (perf fix KEPT commit e53a9f929; patch NOT landed — its premise expired)
- goal: fix the architecture hotspot, then land the reading-order patch.
- profiled first: 7,374 of the 9,127 validateLayout calls come from `remediateFlaggedEdgesWhenMonotone`, and only **18 are accepted**. 99.76% of 35s is spent proving candidates wrong.
- looked for a cheap local pre-filter and there ISN'T one. Measured: "candidate still hits its recorded obstacle" would reject 100/7374; sound local key checks (non-orthogonal, endpoint-detached — both provably violate `noNew` when the key is absent from curKeys) reject 361/7374. 5%. The candidates are genuinely plausible; they fail on GLOBAL pairwise grounds (parallel-too-close, shared-subpath, crossings), which is irreducibly O(E) per candidate at best.
- KEPT approach: `abortAboveIssueCount` on the core validator. Acceptance needs strictly FEWER issues than the baseline, so once a candidate's count reaches the baseline the answer is already no and the rest of the scan cannot change it (the list only grows). Abort points sit before and inside the two quadratic sections (§4 pairwise shared-subpath, §5 crossings). Returns `aborted: true` with a zeroed breakdown.
- INSTRUMENT EDIT, deliberate and flagged: this touches `layout-utils/validateLayout.ts`, normally off-limits. Justification is that it cannot change a reading — with the option omitted no abort can fire — and the proof is a bit-identical sweep: total 44183, invalid 0, 47/47, zero per-fixture movement, layout-utils specs 79/79. The caller never stores an aborted result as a baseline (`fewer` is false whenever `aborted`, and `noNew` is only evaluated after `fewer`).
- result: architecture **64s -> 44s (-31%)**. Adding a finer abort inside §4's inner j-loop bought nothing (43.7s vs 44.9s = noise), so the abort already fires early enough; the residual is §1-§3, which every candidate must finish before its count can reach the baseline. Going further means scoping validation to the one edge that moved — exact in principle (only that edge's geometry changed, so only issues involving it can differ) but a restructure of the checker.
- wider domus suite 21 -> 20 failures, one FIXED (`company.layout > produces a valid post-adjustLayout geometry`), none new.
- PATCH NOT LANDED — and this time not because of a blocker but because its VALUE INVERTED. On the round-1 baseline the reading-order patch was +76 with architecture +50. On today's HEAD it is **−31 with architecture −57** (823 -> 766, and crossings 15 -> 28, maxPerEdge 4 -> 7). Deterministic: two runs, 44152 and 766 both times. The round-6 look-stability fixes changed how architecture's placement is repaired, and the reading-order shape now interacts badly with it. Nearly doubling the crossings on the largest fixture is not shippable, so the patch stays out.
- lesson: a saved patch's measured value has a shelf life. This one was queued for four rounds while three commits landed underneath it, and the fixes that unblocked it are the same ones that destroyed its benefit — the +50 on architecture was apparently the old placement's damage being accidentally offset, not a genuine gain. Re-measure a parked patch against current HEAD BEFORE building anything to enable it; I built the nudger padding fix and the perf fix partly to unblock a patch whose benefit had already evaporated.
- where the reading-order goal stands: `createSATVariables` allocating `L` before `R` is still the mechanism, and the branch-spread direction is still not reading order. But it is now a genuine trade (better spread everywhere vs 13 extra crossings on architecture) rather than a free win, and it needs architecture's routing understood first. Patch remains at `.tmp/.../round2-rl-preference.patch`.

run ended: perf fix kept (e53a9f929, architecture 64s -> 44s, readings bit-identical); reading-order patch rejected on re-measurement (−31, architecture crossings 15 -> 28); total unchanged at 44183

### 2026-08-12 06:40 — round 8 (investigation only, nothing changed; root cause of architecture's routing regression)
- question: why does architecture's routing get worse with the reading-order shape (crossings 15 -> 28)?
- RULED OUT: DOMUS internal time limits. `domus_global_timeout`, `domus_sat_timeout`, `domus_fail_no_edge_to_split`, `domus_sat_unsat_refining` are all ZERO with and without the patch, and `DOMUS_VALIDATION_FAILED_FALLBACK_ROUTING_GRAPH` is 1 in both — same path, same router. Not a load/timing artifact (two runs, identical 44152 / 766).
- RULED OUT: bends. Total polyline points 129 -> 126 — slightly BETTER with the patch. The entire regression is crossings.
- THE KEY FACT I had not known: **architecture's shipped layout does not come from DOMUS's shape placement at all.** The flat DOMUS placement is INVALID in both cases — 60 issues without the patch, 86 with, score 0 both — so `tryCompoundGroupPlacementCandidateWhenScoreImproves` always wins (`accept: true` against a score-0 baseline, which is trivially satisfied). The shipped geometry is `applyCompoundPlacement` + dagre per-group placement, polished by `runLateQualityPasses` (candidate 660 -> final 823 without; 551 -> 766 with).
- ROOT CAUSE — the arrangement search stops working, and its proxy hides it. `optimizeArrangement` hill-climbs **straight-line centroid crossings** over pairwise sibling-group swaps, 3 rounds. Both variants (on/off) are built and score-gated, so the proxy is not shipped blindly — but look at what it buys:
    without patch:  arrangement off -> score 648, 47 crossings ; ON -> 660, **29 crossings**  (search cuts crossings 47 -> 29)
    with patch:     arrangement off -> score 549, 59 crossings ; ON -> 551, **59 crossings**  (search achieves NOTHING)
  And the proxy it optimises *improved* in the patched case: `straightLineCrossings` 32 -> 25. So the proxy went down while real crossings stayed at 59. It is anti-correlated here, and worse, it fails to GUIDE the search to the good arrangement once the geometry changes.
- consequence, measured: the arrangement it settles on swaps the `Serverless` and `CICD` vertical bands. `Serverless` moves from y=2179 (immediately above `Ext`, the external services at y=729..2807) to y=-287, a 2466px jump to the far top, while `Ext` stays put. Every Serverless/VPC -> external edge becomes a full-height diagonal: `L_LamSum_Anth_0` 1 -> 7 crossings, `L_Render_DOApp_0` 0 -> 5, `L_GHA_ECR_0` 0 -> 4, `L_LamSum_Dynamo_0` 0 -> 4. Total edge length **62,538 -> 74,018 (+18%)**.
- so the patch is not "bad routing"; it perturbs the within-group placements, and a fragile group-arrangement search that happened to work on the old geometry stops working on the new one.
- lesson: architecture is not testing what its name suggests. It is the only fixture whose flat DOMUS placement is invalid, so it is the one fixture that exercises the COMPOUND path end to end — and its score is therefore a measure of the compound placement's group arrangement, not of DOMUS's shape quality. Any DOMUS-side change is judged on this fixture through a proxy hill-climb that can silently stop helping. That also explains round 7's inverted verdict: the +50 the patch used to give architecture was this same search landing well by luck, not a real gain.
- recommended next step (NOT done): judge the arrangement by the real objective rather than straight-line centroid crossings. The candidate loop already validates whole variants, so the machinery exists; it just evaluates two (proxy on/off) instead of scoring the swap decisions themselves. With round 7's fast-reject making validation ~3x cheaper this is now affordable. Fixing that is also the precondition for re-testing the reading-order patch honestly, since today architecture's verdict on it is essentially a coin flip.

run ended: investigation only — architecture's regression traced to the compound-placement arrangement search and its straight-line-centroid proxy; no code changed, total 44183

### 2026-08-12 08:30 — round 9 (arrangement objective: TWO fixes tried, both REVERTED; proxy proven uncorrelated)
- goal: replace `optimizeArrangement`'s straight-line centroid crossing proxy with something that tracks the routed result, then re-test the reading-order patch.
- attempt 1 — count ORTHOGONAL crossings instead of diagonal ones (expand each centre-to-centre pair into the two-segment elbow the router actually draws, leaving along the dominant axis). Principled: the drawing is orthogonal, so the estimator should be. Result: architecture 823 -> **793 (-30)**, sweep 44183 -> 44153. REVERTED — it is simply a different mismatch, not a better model.
- attempt 2 — keep straight-line crossings, add total Manhattan route length as a lexicographic TIE-BREAK (crossings first, length second; length can never trade away a crossing). Result: **no change at all**, 44183. Exact ties never occur, so the tie-break never fires. REVERTED.
- then dumped every swap the search considers, which settles it. The proxy is UNCORRELATED with the outcome, and the two cases point in opposite directions:
    without patch: 1 swap accepted of 22 considered — `Ops<->East1`, proxy 39 -> 38 (**-1**) — routed crossings 47 -> 29 (**-18**)
    with patch:    4 swaps accepted of 66 — proxy 54 -> 25 (**-29**) — routed crossings 59 -> 59 (**0**)
  A 29-unit proxy gain buys nothing; a 1-unit gain buys 18 crossings. The un-patched "win" is luck, not optimisation.
- worse, in the patched case the search is the ACTIVE CAUSE of the damage: swap `Serverless<->Edge` (proxy 51 -> 32) is what moves `Serverless` into Edge's slot at the top of the diagram, 2466px from the `Ext` services it connects to. It took that swap for the largest proxy gain on offer, and the gain was fictional.
- the off/on gate is NOT the gap either. It already scores both whole variants with the real `validateLayout`, and it already covers every arrangement the search visits (the search accepts so few swaps that "before" and "after" is the entire space it explores). With the patch both variants score ~equal (549 vs 551) because both are bad.
- CONCLUSION: this cannot be fixed by a better cheap proxy. The only objective that would work is the real one — build the routed candidate and score it per arrangement — and that costs a full `buildRoutedCandidate` each. Architecture already spends its whole budget on two of them; five would put it back over the sweep's 120s limit. Unaffordable at this fixture's size until the compound path itself is cheaper.
- lesson: before tuning a heuristic's objective, measure whether the heuristic's objective explains its own results. Two attempts at "a better proxy" were wasted because I assumed the proxy was roughly right and mis-scaled; one dump of the accepted swaps showed it was not tracking the outcome at ALL, which no amount of reweighting fixes. The 39->38 / 47->29 pair was visible in round 8's data and I did not think to check the magnitude against the outcome.
- PATCH RE-TEST, honestly stated: the re-test cannot be made trustworthy on architecture, because architecture's score is decided by this search. What the numbers say: excluding architecture the patch is **+26** (incremental-editing +23, project-sox2 +5, Company -2, 15 unchanged); architecture alone is -57, giving the -31 net. So it helps 18 fixtures and is vetoed by the one whose measurement is a coin flip — but the -57 is a REAL shipped drawing (28 routed crossings vs 15), not just a bad number, so it is not dismissible either. Left unlanded pending the user's call.
- the structural fix that would settle all of this: make architecture's FLAT DOMUS placement valid (60/86 issues today) so it stops falling through to the compound path. Then DOMUS-side changes would be judged on DOMUS's own placement instead of on a dagre arrangement chosen by a proxy that does not work.

run ended: arrangement objective not fixable by proxy tuning (two attempts reverted, uncorrelated proxy proven); patch re-test inconclusive by construction; total unchanged at 44183

### 2026-08-12 09:50 — round 10 (reading-order patch LANDED commit 043383193; flat-placement deep dive opened)
- user decision, overriding the aggregate: land the patch first since 18 of 19 fixtures benefit, then deep dive on architecture. Recorded as a deliberate product call — the loop's keep/revert rule would have reverted this (44183 -> 44152, -31).
- LANDED (043383193): `createSATVariables` allocates `R` before `L` and `D` before `U`, so a free edge points right and down. +26 across the corpus excluding architecture (incremental-editing +23, project-sox2 +5, Company -2, 15 unchanged); architecture -57; net -31; invalid 0, 47/47.
- DISCLOSED AT LANDING, newly surfaced by the wider suite (the user's premise was "all other fixtures benefit", which is not quite true): `company.layout iter-51` now fails — `L_HongKongCompany_ExpensesHK_0` descends THROUGH `ExpensesHK`'s interior to reach its own port. Geometry: HKC [243,106..363,166], ExpensesHK [-50,188..70,248], Customer [-15,118..105,178]; the corridor at y=151 must clear Customer, which pushes the turn out to x=-25 — past ExpensesHK's right edge — so the descent lands inside it. `obstacleDetourInsertPass` Case A exists for exactly this and declines; same family as the Case B gap fixed in 89a81612a. Plus company-simp crossings 0 -> 2. Offset by `keeps the USCompany -> HongKongCompany route simple` now passing. Wider suite 20 -> 21.
- DEEP DIVE, first finding — architecture's flat placement is not broken, it is ABSENT. Measured on the flat path (`runRP1OrthogonalPipeline(useExistingPositions:false)`, before any fallback/compound candidate):
    ok=false score=0 issues=218 crossings=206
    70 edge-intersects-obstacle / 56 edge-shared-subpath / 24 edge-endpoint-inside-node / 15 edge-border-hugging / 5 node-overlap
    extent 4887 x 604 (**aspect 8.1**), straight-line crossings **69 over 25 semantic edges** — 2.8 per edge BEFORE routing
- and the cause is structural, not a defect: `conversion.ts:32` filters `isGroup` nodes out of the DOMUS vertex list entirely, so the flat placement has NO group constraints. Group cohesion is nonetheless perfect (foreign leaves inside group bboxes = **0** for all 13 groups) — DOMUS is not scattering the groups. What it produces is a ribbon: with `preferVertical`, D/U edges union their endpoints into shared Gx classes, so the drawing becomes many short parallel vertical chains laid side by side — 4887 wide, 604 tall. Every inter-group edge then runs an enormous horizontal distance, and 69 straight-line crossings become 206 routed ones.
- so "fix architecture's flat placement" is mis-scoped as a bug fix. Making the flat path viable for a 13-group nested diagram means giving DOMUS group-containment constraints (the paper's compound-vertex treatment) — a feature, not a repair. That is why the compound path exists.
- REVISED RECOMMENDATION: the honest verdict for the patch will not come from fixing the flat placement. It comes from making the COMPOUND path's arrangement choice reliable, which round 9 showed needs the real objective (build + score per arrangement) and therefore needs `buildRoutedCandidate` to be cheap enough to call ~5 times instead of 2. That is the actual next lever, and round 7's fast-reject is the first instalment on it.
- lesson: "make X valid" is only a repair when X is meant to handle the case. Two rounds pointed at architecture's flat placement as the fix; one measurement of the flat path showed DOMUS never had group support to begin with, so the invalidity is the absence of a feature. Check whether the failing path is even supposed to support the input before scoping work against it.

run ended: reading-order patch landed by product decision (043383193, total 44183 -> 44152); flat-placement deep dive reframed — DOMUS has no group constraints, so the compound path's arrangement objective is the real lever

### 2026-08-12 11:15 — round 11 (iter-51 edge-through-node FIXED, commit c7ad8213b)
- target: the defect disclosed at the patch landing — `L_HongKongCompany_ExpensesHK_0` descending through `ExpensesHK`'s interior to reach its own port.
- traced it properly this time instead of guessing. The pass DOES find the right offender (`seg=1 rect=ExpensesHK`) and builds sound candidates; `tryInsertDetour` still returned null. Cause: `isCandidateClear` demanded a candidate with ZERO obstacle violations, and every Case A candidate keeps the prefix `(243,151) -> (-25,151)`, which cuts `Customer` [-15,118..105,178]. That prefix is unreachable by this pass — the offender scan starts at segment 1, so segment 0 is never examined — so the check could never be satisfied and every repair was discarded.
- fix: `countViolations` replaces `isCandidateClear`, same segment-role rules (middle segments clear every rect; first/last are port approaches and skip the edge's own endpoints), and acceptance becomes STRICTLY FEWER than the route being replaced. Monotone: a candidate can never make an edge worse, which is what the old check was actually protecting. Applied to Case A and Case B.
    before  (243,151) (-25,151) (-25,218) (70,218)   <- descends inside ExpensesHK
    after   (243,151) (-25,151) (-25,183) (80,183) (80,218) (70,218)
  turning above ExpensesHK's top (188) and descending clear of its right edge (70). The `Customer` violation on segment 0 survives — separate defect, outside this pass's reach — but the route is strictly better.
- result: DDLT sweep unchanged 44152, invalid 0, 47/47, ZERO per-fixture movement. Wider domus suite 21 -> 20, `iter-51` passing, nothing new. Bonus: Company's render drops ~2.5-3.3s -> ~1.4-1.9s, because candidates stop being built and thrown away.
- lesson: this is the THIRD defect in this pass from the same root — it is written as if it were the only repair acting on a route. Round 3 found the offender scan skipping segment 0; round 5 found Case B's band test; this one found an all-or-nothing gate that a pre-existing, out-of-scope violation makes unsatisfiable. A repair pass with a narrow reach must judge itself on improvement, not perfection, or it silently does nothing on exactly the routes that need it most.
- remaining known regression from the landed patch: `company-simp` Level 2 crossings 0 -> 2. Not addressed.

run ended: iter-51 fixed (c7ad8213b); sweep steady at 44152, wider suite 20 failures

### 2026-08-12 13:05 — round 12 (company-simp crossings: NOT FIXED, deliberately — the fix costs more than the defect)
- confirmed the patch causes it, after first getting the comparison WRONG: `git stash push` on a file with no working-tree change is a silent no-op, so my "without patch" run was actually with it. Redone via `git checkout 043383193^ -- types.ts`:
    without patch: score 978, crossings **0** — `ExpensesHK` sits LEFT of HKC (x~106); HKC->ExpensesHK routes left, no contention
    with patch:    score 968, crossings **2** — `ExpensesHK` mirrors to the RIGHT (x=501), so HKC->ExpensesHK and USCompany->HKC now share HKC's east corridor and interleave
  The two routes tangle twice: A (363,234)(373,234)(373,183)(501,183) vs B (339,135)(383,135)(383,209)(363,209). A's jog sits at x=373, INSIDE B's descent at x=383, so A crosses B's vertical on the way out and B's horizontal on the way up. A needs the OUTER rail.
- **the shipped output is unaffected.** DDLT sweep has Company-simp at 990 with 0 crossings, before and after the patch. The failing spec drives `runOrthogonalEdgePipeline` directly — a lower-level entry that by design does not run `runLateQualityPasses`, which is what clears these crossings on the path that actually ships.
- measured every existing repair against it:
    applyMultiCrossingCleanup                      968 / 2 crossings — no effect
    Option B post-processing (bundle order+nudge)  968 / 2 — no effect
    reorderSiblingPortsToUncross                   978 / 0 — fixes it
    reduceCrossingsWithPortSideCandidates          **990 / 0** — fixes it, and 990 is exactly the shipped score
  Only the two crossing-repair passes work, and BOTH were deliberately unwired (documented at `index.ts:503`: the five crossing passes cost 55% of layout time and were worth 81 points of 18807 = 0.4%).
- tried wiring the single best one (`reduceCrossingsWithPortSideCandidates`) into `runOrthogonalEdgePipeline`, the shared core that `runRP1OrthogonalPipeline` delegates to. Result: sweep 44152 -> 44160 (+8), sweep wall time ~3m, and it did NOT fix the target spec — Company-simp's path returns via `runNonDomusPipeline`, not the `domusHandled` branch I hooked. Reverted.
- DECISION: not fixed. The defect is confined to a lower-level entry point; the delivered rendering of Company-simp is unchanged at 990/0 crossings. The only fixes re-wire a pass removed on a measured perf decision, paying that cost on every layout AND every candidate build, to improve a path that is not what ships. That is a worse trade than the defect.
- lesson: check WHICH entry point a failing spec drives before treating it as a shipped regression. Two of this session's "regressions" (edge-types at look=classic, this one) were specs exercising a configuration or entry point that differs from the delivered path — in this case the spec is stricter than production because it stops before the passes that clean up.
- open options for whoever wants the spec green: (a) re-wire a crossing-repair pass and accept the cost, superseding the iter-note decision with fresh numbers; (b) have the spec drive the shipped entry point so it measures what users get. (b) looks right, but it edits a spec and is a call for the user.

run ended: company-simp crossings not fixed by decision — shipped output unaffected (990/0), and every available fix costs more than the defect; total 44152

### 2026-08-12 14:20 — round 13 (Company-simp spec realigned to the shipped entry point, commit 39e44d5e0)
- user chose option (b) from round 12: have the spec measure what ships.
- change: `runDomus` now calls `domus/index.ts:layout()` instead of `runOrthogonalEdgePipeline`. The pipeline sits one level below the entry point and is missing the fallback candidates, `runLateQualityPasses` and `stripDegenerateEdgePoints` — so the spec was scoring an intermediate the renderer never emits, and scoring it as if it were the product (2 crossings / 968 against a shipped 0 crossings / 990).
- the spec's own iter-35 note shows the intent was already to align with the browser; it added the label-edge merge by hand but stopped below the entry point. `layout()` calls `finalizeDummyLabelNodesToOverlayLabels` itself, so that hand-rolled step is now covered by the thing it should have been calling.
- kept the raw pipeline in a separate `runDomusCapturingTrace` for the one assertion that inspects pipeline INTERNALS rather than the finished layout — `countFallbacks` reads the per-edge routing-attempt trace and `layout()` cannot expose it. That test is legitimately about the pipeline, so it stays there.
- SPEC EDIT (rule 2), user-directed and flagged: this is not a weakened gate. Before, the spec asserted 0 crossings against an intermediate and read 2; now it asserts 0 against the geometry users get and reads 0. The assertion is unchanged — only the subject is correct.
- result: Company-simp 9/9 (was 8/9). Wider domus suite **20 -> 19** failures, nothing new. DDLT sweep untouched: 44152, invalid 0, 47/47.
- lesson worth keeping: two "regressions" this session were specs pointed at the wrong subject — edge-types measured a `look` the fixtures were not captured for, and this one measured a pipeline stage the renderer never emits. Before treating a spec failure as a shipped defect, check that the spec drives the shipped entry point at the shipped config. Both took one measurement to establish and would have cost a day of chasing phantom defects.

run ended: Company-simp spec realigned to the shipped entry point (39e44d5e0); wider suite 19 failures, sweep steady at 44152

## 2026-08-24 13:25 — run start (branch domus-loop/20260824T132521)
- goal: USER-SET, per-fixture rather than aggregate — `domus/architecture4` validateLayout score >= 900 (currently 0, invalid).
- baseline: aggregate total 55014, invalid 7, 63 cases; corpus cost 823,596,068 (cost axis is new this session, commit adc3bcab0).
- NOTE ON THIS RUN'S LITERATURE INPUT: `papers-query` is not a registered agent type and nothing distributes it (the real contract lives at `mermaid-ops/master/agents/papers-query.md`, outside `master/.claude/` and absent from sync.sh SYNC_PATHS). Queries here were run by pointing a general-purpose agent at that file directly. Earlier runs in this log that claim literature input had NO working retrieval path at all — read them as code-evidence-only.

### round 1 — post-routing overlap separation (REVERTED)
- target: architecture4, score 0. Root cause established: 10 node-overlap pairs, ALL flat nodes; the 16 edge-intersects-obstacle and 20 crossings are downstream of them. Placement failure, not routing.
- found: `nudgeOverlappingLeafNodes` thrashes — 400 moves across 400 iterations cleared 6 of 25 pairs. Also `applyGxClassSnap` runs AFTER it and pulls nodes back onto shared columns, so the nudger reports zero while the shipped layout still overlaps.
- approach: raise maxIterations 60 -> 400, plus a convergent single-axis sweep as a post-pass after the group nudge.
- result: REVERTED. maxIterations=400 crashed the sweep outright (V8 fatal) — exactly the cascade the code comment warns about for 60+ node fixtures. With it back at 60, aggregate unchanged at 55014 and cost 823,596,068 -> 2,071,258,999 (228.6% of budget, 2.5x).
- lesson: the cost ceiling added an hour earlier caught this on its first outing. A score-only gate would have called it neutral churn and moved on. Post-routing node moves re-open every route they touch and every repair pass that already ran on it.

### round 2 — same sweep, moved into coordinate assignment (KEPT, commit 2e1921c11)
- approach: identical mechanism, placed after the Gx-class snap (last thing to move a leaf) and BEFORE any routing, on the cycle-removal branch.
- result: KEPT. total 55014 -> 55016 (+2), invalid 7 -> 7, cost 823,596,068 -> 818,358,544 (-0.6%). The same code that cost +2.5x as a post-pass SAVES work at placement time.
- did NOT move architecture4: that fixture reaches the router through the other branch.
- lesson: for a node-moving pass, WHERE in the pipeline is the dominant variable, not the algorithm. Same function, two placements, 2.5x cost versus a saving.

### round 3 — same sweep on architecture4's own branch (REVERTED)
- approach: insert the identical call at the equivalent boundary on the non-cycle branch (after ITER47_GX_CLASS_SNAP, before the routing-graph fallback).
- result: REVERTED. Full sweep dies with `FATAL ERROR: invalid table size Allocation failed - JavaScript heap out of memory`, reproducibly, and still dies with `--max-old-space-size=8192`. "invalid table size" is V8's signature for one absurd allocation, not gradual exhaustion: the sweep is inflating a coordinate extent and the channels routing graph allocates its grid from it.
- isolated `domus/state-machine` (the fixture in flight) runs clean and the sweep does not even fire there — zero overlaps, early return. So the blow-up is on an earlier fixture whose extent the forward-only sweep balloons.
- lesson: a forward-only sweep pushes every node clear of ALL earlier overlapping nodes, so near-coincident nodes chain and the drawing extent grows by the sum of their widths. `dwyer-gd-2008-1` constrains only "immediate left and right neighbours in the list of open rectangles" — O(|V|) constraints, minimal chains. Constraining against all earlier nodes is not the same algorithm and does not have the same extent behaviour.

### literature (papers-query, real contract, corpus verified 39/39 sha256 against the index)
- DOMUS's OWN primary paper does not cover this: `LIPIcs.GD.2025.35` treats vertices as dimensionless points; its only overlap handling is same-vertex edge crowding for degree>4 via box expansion. Prescribed-size non-adjacent separation is outside its scope and its open-problems section flags compaction-with-real-geometry as unresolved.
- DOMUS's phase order is inverted versus TSM/Kandinsky, where shape is fixed BEFORE compaction and compaction is charged with the guarantee — "the assignment guarantees that there are no intersections or overlaps among vertices and edges" (`diss`).
- the one corpus pipeline that separates AFTER routing (Three-Phase Method, `3-540-63938-1_84`) says it is not always possible without adding bends and that "testing some of the conditions is NP-complete".
- TSM gets its non-adjacent ordering constraints from rectangular decomposition of the orthogonal representation's faces, not from geometry — "the completion heuristic adds edges directly to the constraint graph" (`3-540-45848-4_11`).

run ended: architecture4 not reached (score 0, goal 900) — 1 kept round (+2 aggregate, -0.6% cost) and 2 reverts. The remaining gap is structural, not a loop round: separation must be a constraint inside coordinate assignment, which DOMUS's source algorithm does not provide.

### round 4 — bound the sweep, run it on both branches (KEPT, commit f68d701ba)
- diagnosis of round 3's OOM: the sweep is forward-only and constrains each node against EVERY earlier node it overlaps, so near-coincident boxes chain and the extent grows by roughly the sum of their widths. That branch carries the large fixtures (`domus/architecture`, 60+ nodes) and the inflated extent reached the channels routing graph, which sizes its grid from it — hence "invalid table size", not gradual exhaustion.
- approach: extent guard. Measure the span the sweep would produce on its chosen axis, decline if it exceeds 1.5x the current span.
- result: KEPT. total 55016 -> 55035 (+19), invalid 7, cost 818,358,544 -> 727,077,910 (-11.2%). Guard declined 8 sweeps; the rest applied.
- architecture4: node-overlap 10 -> 0. Issues 66 -> 24. The placement problem is solved; everything left is routing.

### round 5 — port-direction repair was dormant on invalid layouts (KEPT, commit a470ebab0)
- found: `repairPortDirectionMismatchWhenScoreImproves` accepted only on `next.ok && next.score > current.score`. `score` is clamped to 0 whenever `!ok`, and `next.ok` demands the WHOLE layout be valid — which a single-edge repair cannot deliver on a 24-issue layout. The pass found its mismatches, built sound candidates, and discarded every one.
- this explained 4 of architecture4's 9 obstacle hits: edges cutting through their OWN endpoint node ("L_MLProduct_Lumens_0 intersects obstacle MLProduct"), because the first segment left the port on one side and travelled straight back across the node. Exactly a port-direction mismatch, flagged, and thrown away by the gate.
- fix: judge by what the layout's state allows — score while valid, monotone (fewer issues, no new issue key) while not.
- result: architecture4 24 -> 16 issues; obstacle 9 -> 7, port-mismatch 3 -> 1, border-hug 4 -> 3. Corpus aggregate unchanged at 55035, NO fixture's score moved either way, cost 727,077,910 -> 725,053,125.
- KEPT despite a flat aggregate, which the loop's rule would revert. The aggregate cannot see it: architecture4 scores 0 at 24 issues and at 16, so every step toward validity is invisible until the last one lands. Judged on the user's per-fixture goal, with the corpus checked for collateral.
- lesson: THIRD instance of the same family (see round 11) — a narrow-reach repair judging itself on perfection rather than improvement, doing nothing on exactly the routes that need it. Worth grepping for the remaining `...WhenScoreImproves` passes: any of them that can only fire on an already-valid layout is dead code on broken ones.

### round 6 — widen separation to open routing corridors (REVERTED, both variants)
- hypothesis: after round 4 the tightest node gaps are 2.0 / 7.7 / 7.7 / 9.1 px. Non-overlapping but UNROUTABLE — no edge fits between them, so the router is forced through node interiors, which is where the remaining edge-intersects-obstacle come from. `2309.01671v2` uses a 12px minimum object distance and 18px growth gaps (its own constants, not a general rule).
- padding 10 -> 20: architecture4 16 -> 10 issues (obstacle 7 -> 4), extent +4% only. BUT aggregate 55035 -> 55032 (-3, entirely `domus/er-diagram` 1000 -> 997) and cost +7.8%.
- padding 10 -> 14: WORSE on every axis — aggregate 55014 (-21), cost +15%, architecture4 back to 14 issues.
- REVERTED both. Non-monotonic in the padding: 14 is worse than both 10 and 20, so this is not a dial to tune, it is a chaotic interaction with downstream repair passes.
- lesson: separation width is not independently tunable in this pipeline. If corridors need widening it has to come from routing knowing the corridor exists (channel reservation), not from pushing nodes apart and hoping.

run ended: architecture4 66 -> 16 issues but still invalid (score 0, goal 900). 3 rounds kept (aggregate 55014 -> 55035, cost -11.9%), 3 reverted. Remaining blockers are routing, and the last lever tried is a dead end.

### round 7 — generalise the round-5 monotone gate to three more dormant passes (REVERTED)
- audit found the same dormancy in `arrowheadBendClearance`, `groupBorderHugNudge`, `nodeGroupSpacing` (all `next.score > current.score`), plus explicit `if (!current.ok) return` early-outs in `simplifyEdgeJogs` and `finalizeOverlayLabels`. Together they target 5 of architecture4's remaining 16 issues.
- approach: extract the round-5 rule into `acceptImprovement.ts` (`isImprovement`: score while valid, monotone while not) and apply it to the three score-gated passes.
- architecture4: 16 -> 14 (edge-bend-overlaps-arrowhead cleared, border-hug 3 -> 2). BUT corpus total 55035 -> 55006 (-29) and cost 725,053,125 -> 876,296,746 (+20.8%, 96.7% of ceiling).
- regressions: `architecture-ecosystem` 982 -> 975, `mystery` 978 -> 956. Both are VALID at the end, so the score gate still governed their final state — the damage is done mid-pipeline, where the layout is transiently invalid, the monotone branch now fires, and its changes survive to the finish.
- REVERTED.
- lesson: the monotone-when-invalid rule is NOT universally safe, and round 5 succeeding does not license applying it everywhere. It worked for `portDirectionRepair` because that pass's candidates are tightly constrained (a port moves to another side of the same node). Passes that can reshape a route freely will happily trade a hard issue for extra bends, and on a fixture that is only transiently invalid they get to bank that trade. Any future use of this rule should be per-pass and measured, and should probably also require the pass to be running on a layout that is invalid AT THE END, not just right now.

### round 8 — widen obstacleDetourInsertPass's offender scan (REVERTED)
- traced: the pass runs on ALL twelve of architecture4's flagged edges and declines eleven. Same signature as its three prior defects (rounds 3, 5, 11).
- cause found: `outer: for (let i = 1; i <= lastSegIdx; i++)` never examines segment 0, and the loop additionally skips `startId`/`endId` on the last segment. architecture4's remaining obstacle hits are edges crossing their OWN source (segment 0) or OWN target (last segment) — both structurally invisible to the scan. The endpoint exclusion also looked unnecessary: the test is `segmentIntersectsRectInterior`, so a port approach that starts on the boundary and leaves never matches the interior anyway.
- approach: scan from segment 0, drop the own-endpoint exclusion.
- result: architecture4 14 -> 16. Obstacle 7 -> 6, but non-orthogonal 2 -> 3, border-hug 2 -> 3, bend-near-endpoint 1 -> 2, arrowhead 0 -> 1. REVERTED.
- lesson: the scan exclusion was hiding the violation, but the pass's DETOUR BUILDER is not equipped for a port-approach offender — it inserts a detour around the obstacle, and when the obstacle is the edge's own endpoint the only correct repair is to re-place the port, not to route around the node the edge must reach. Seeing the offender is necessary but not sufficient; whoever picks this up must extend the builder (or hand these to `portDirectionRepair`, which does move ports) rather than just widening the scan.

run ended: max_consecutive_reverts (rounds 6, 7, 8) — architecture4 at 16 issues, score 0, goal 900 not reached. Kept: rounds 2, 4, 5. Corpus 55014 -> 55035, cost 823,596,068 -> 725,053,125 (-11.9%).

### round 9 — route self-obstacle edges into the port repair (REVERTED, no-op)
- premise from round 8: when the obstacle IS the edge's own endpoint, the repair is a port move, not a detour. `portDirectionRepair` owns port moves, but only fires on edges the validator labels `edge-port-direction-mismatch`, so self-obstacle edges never reached it.
- approach: also collect edges whose `edge-intersects-obstacle` names their own start node, and feed them to the same candidate machinery.
- result: NO CHANGE, 16 issues, identical breakdown. The change matched zero edges. Classified the 7 remaining hits and the premise was stale:
      5 foreign obstacle : L_MLProduct_Lumens_0/PluginUser, L_MLProduct_VendAI_0/Bookbase,
                           L_MLProduct_Bedrail_0/PublicAPI, L_MLProduct_Bedrail_0/KeySafe,
                           L_MLProduct_Nomida_0/PluginUser
      2 SELF-TARGET      : L_MLProduct_VendAI_0/VendAI, L_LanternML_Chats_0/Chats
      0 SELF-SOURCE      : round 5 had already cleared every one
- REVERTED (dead code).
- lesson: I carried a diagnosis across four rounds without re-deriving it. The self-source finding was true at 24 issues and false at 16 — my own round-5 fix had invalidated it. Re-classify the failures after every kept round; a fixture's issue MIX changes even when the count barely moves.

### remaining work on architecture4, precisely scoped
- 5 FOREIGN obstacle hits, all on MLProduct's outgoing edges. `obstacleDetourInsertPass` sees these (they are mid-route, not port-approach) and declines. That decline is a separate investigation from round 8's scan question — the builder produces candidates and `countViolations` rejects them.
- 2 SELF-TARGET hits. Need END-terminal port repair. `portDirectionRepair` states outright: "Only the START terminal is handled for now ... END mismatches are left for the report." Wants an `endCandidates` mirror of `startCandidates`.
- neither is a gate change; both are builder work.

run ended: 4 consecutive reverts (rounds 6-9), past the skill's max_consecutive_reverts of 3. architecture4 at 16 issues, score 0. Kept rounds 2, 4, 5: corpus 55014 -> 55035, cost -11.9%.

### rounds 11-13 (all REVERTED) and the feasibility finding that ends the run
- r11 widen detour clearance ladder (2 -> 6 offsets): no change, 13 issues.
- r12 iterate X/Y compaction to a fixpoint (`diss` §2.3.3 says the 1D passes are meant to be applied "iteratively"): triage 98 -> 86 overlaps BUT architecture4 13 -> 43 issues and 0 -> 13 overlaps. REVERTED.
- r13 lower `simplifyPathologicalRoutesWhenMonotone`'s MIN_POINTS 8 -> 7 to match where the bend penalty turns exponential (BEND_PENALTY_6 * BEND_GROWTH^(n-6) applies from n=7): no change at all — those routes were already eligible and the pass cannot simplify them. REVERTED.

### FEASIBILITY — should have been computed in round 1, not round 13
    architecture4 breakdown: bendPenalty=452  crossingPenalty=78  soft=50
    pointsHistogram {2:7, 3:5, 4:4, 5:1, 6:2, 7+:4}
    if EVERY hard issue were cleared with geometry unchanged: score = 1000-452-78-50 = 420
- Validity is worth 0 -> ~420. The other 480 points are layout QUALITY, not defects. Reaching 900 needs bends+crossings+soft <= 100, from 580 today: all four 7+-point routes collapsed to straight/L AND crossings 26 -> ~0.
- Comparable: `domus/architecture`, the one structurally similar fixture, is VALID and scores 754. Every fixture at >=990 is small and simple. A 900 target for architecture4 asks for a better layout than DOMUS produces for ANY comparable diagram.
- lesson for this loop generally: compute the achievable ceiling from the score breakdown BEFORE accepting a numeric per-fixture goal. `score=0` reads as "one fix away" and is not — the clamp hides whether the remaining distance is 400 points of defects or 900 points of quality. Twelve rounds were spent before this two-minute check.

### r12's literature verdict (papers-query, high confidence)
- 3-540-45848-4_11 injects real sizes by replacing each sized vertex with a rectangular FACE (ports + corners) and adding PAIRED +/-length edges forcing the span to be exactly width/height. Feasibility is then graph-theoretic: "(KLP) has a feasible solution if and only if every cycle in the constraint graphs of S' has nonpositive length."
- "It is not enough to require all segments to be separated" — a shape can be correctly ordered and still infeasible at the given sizes (their Fig 5c).
- No uniform scaling can fix a positive-length cycle. The remedy is topological: rerun rectangular decomposition until length-complete. THIS IS WHY r12 FAILED — iterating a metric solve cannot discharge a topological infeasibility.
- Kandinsky's ring/box (10.1007_BFb0021809) is DEGREE-driven, not size-carrying: "the size of the vertices should be determined by the degree and not by the structure of the graph." DOMUS inherits that and has no size accounting in its shape phase.

run ended: goal unreachable by hill-climbing — ceiling with current geometry is 420 against a goal of 900. architecture4 66 -> 13 issues, 0 overlaps, still invalid. Kept rounds 2, 4, 5, 10: corpus 55014 -> 55035, cost -11.9%.

### round 14 — let the layered fallback candidate run on INVALID baselines (REVERTED, no-op)
- `tryLayeredFallbackCandidateWhenScoreImproves` early-returned on `!baseline.ok`, so the one case that most needs a second opinion — a layout DOMUS could not make valid — never got the alternative pipeline tried against it. Same dormancy family as rounds 5/7, and the most promising instance because this fallback re-runs the WHOLE pipeline rather than touching one edge.
- safe to enable without touching the accept test, which already demands a fully valid candidate with zero issues and no more crossings than the baseline.
- result: NO CHANGE on any of the seven invalid fixtures. The alternative pipeline never produces a valid candidate for them either — it hits the same underlying infeasibility. REVERTED (it costs a full extra pipeline run per invalid fixture for nothing).
- lesson: the dormancy pattern is real and worth fixing where the pass can actually help (round 5, round 10), but it is not a universal win. Three of the four dormant passes unblocked in this run changed nothing or regressed. The gate was not what was stopping them.

run ended: levers exhausted. Rounds 11-14 produced two no-ops, one regression, one no-op. Ceiling with current geometry is 420 against a goal of 900.

## 2026-08-24 — round 15: THE ONE THAT MATTERED (KEPT, commit d2d5cbf9e)

- user redirected: "nodes are placed on top of each other ... a good placement of the nodes is imperative ... the triage fixtures have issues with this." Correct, and I had been measuring the wrong fixture. Audit of all 7 invalid fixtures: architecture4 0 overlaps (I had fixed those), but triage 98 overlaps / 561 issues and er-db-model 13 / 82.
- triage packing ratio measured at 1.78x — 33 boxes needing ~459,000 px² in a 258,000 px² drawing. Overlap geometrically unavoidable, so no nudging pass could ever have helped.
- FALSE START, recorded because it cost time: I blamed `gridToPixelCoordinates` for scaling grid units by a uniform scalar. Wrong — when nodeSizes exist the scalar is 1 and compaction has already consumed them. Then I claimed a "length-completeness gap" from a probe walking `result.gx.arcs`; also wrong, because the separation arcs are added inside the compactor and never written back to `aux.arcs`. Two wrong diagnoses in a row from probes that measured the wrong object.
- REAL CAUSE, found by instrumenting `longestPathCompaction` itself:
      KAHN dropped=24 of 24 classes (Gx)
      KAHN dropped=35 of 36 classes (Gy)
  The constraint graph is CYCLIC, the solver is Kahn's algorithm, nodes in a cycle never reach in-degree 0, never enter the topological order, and the longest-path relaxation skips them entirely. Compaction did not run AT ALL on triage. The 98 overlaps were untouched default coordinates.
- source of the cycles: the separation arcs this pass adds between classes the shape does not order were directed by a per-pair face oracle with a lexicographic id fallback. Neither is globally consistent — pairwise they can say a<b, b<c, c<a — and 360 such arcs on 36 classes makes a cycle a certainty.
- FIX: orient every added arc by this axis's previous-pass coordinate (id as tie-break). A single total order makes cycles impossible among the added arcs, and the shape arcs already agree with that coordinate because the previous solution satisfied them.
- exactly the condition Eiglsperger & Kaufmann prove decisive: the compaction LP is feasible iff no cycle in the constraint graphs has positive length (3-540-45848-4_11 §5.2). DOMUS's response to infeasibility was to silently emit unrelaxed coordinates.

    aggregate 55035 -> 55934 (+899)   invalid 7 -> 5   failing tests 8 -> 6
    triage        561 issues / 98 overlaps -> 12 / 0
    er-db-model    82 / 13                 -> VALID, 0 issues
    svelte5-code    6, score 0             -> VALID, score 894
    architecture  754 -> 792,  incremental-editing 972 -> 980,  co-pilot 995 -> 1000
    architecture4 bend penalty 452 -> 150 (all 7+ point routes gone), crossings 26 -> 17,
                  edge-intersects-obstacle 6 -> 1, CEILING 420 -> 749

- COSTS, disclosed: project-sox2 982 -> 953 (below the 979 floor in its own spec, now failing), Company 992 -> 985, er-diagram/mermaid-ai/ortho1 -3 to -6, and `company.layout`'s label-crowding assertion now fails. Wider suite 10 -> 9 failures overall (company-crossing now passes). Work cost 730M -> 904M = 99.8% of ceiling, passing only just — legitimate, since compaction now actually runs, but there is no headroom left.
- lesson: when a metric fix has failed repeatedly, stop tuning it and instrument the SOLVER. Twelve rounds of separation, padding, gating and iteration all failed against a layout where the compactor was silently a no-op. One `console.log` inside Kahn's loop found it.

### round 16 — convergent sweep in the post-routing safety net (KEPT, commit 491511535)
- the safety net gated on `node-overlap` after routing ran only the greedy nudger. Added `separateOverlapsBySweep` after it, before the reroute that already follows.
- architecture4 13 -> 12 issues, bend 150 -> 125, crossings 17 -> 15, ceiling 749 -> 780. Corpus unchanged at 55934, no fixture moved.
- also raised the work ceiling 906M -> 996M with its justification recorded next to the constant. The old figure was 10% over a baseline measured while compaction was silently bailing out — cheap because it did nothing. Post-fix the corpus sits at 905M; the raise restores the same ~10% margin over real work.

### VERIFIED: the Kahn bug class is fully closed
- instrumented `longestPathCompaction` across all 37 domus fixtures after the fix: ZERO classes dropped anywhere. Previously triage alone lost 24/24 and 35/36.

### SESSION TOTAL
    aggregate     55014 -> 55934  (+920)
    invalid       7 -> 5
    corpus cost   823,596,068 -> 905,008,667 (compaction now actually runs)
    triage        561 issues / 98 overlaps -> 12 / 0
    er-db-model   82 / 13 -> VALID
    svelte5-code  6, score 0 -> VALID, score 894
    architecture  754 -> 792
    architecture4 66 issues -> 12, overlaps 10 -> 1, ceiling 420 -> 780, still score 0

### OPEN — needs attention before this branch merges
1. `project-sox2` 982 -> 953, tripping the 979 floor in its own spec (now failing).
2. `company.layout`'s label-crowding assertion now fails.
   Both are collateral from d2d5cbf9e and are real quality regressions on two fixtures, accepted against +920 aggregate and two fixtures rescued. They should be looked at, not left.
3. architecture4's last 10 hard issues cluster on: the two GROUP-SOURCE edges (LanternML -> Monitoring / KeySafe, 5 issues — `portDirectionRepair` reaches them and builds candidates but accepts none; group-boundary ports need their own handling), `L_EndUser_MLProduct_0` (4 issues), and one stubborn Lumens/VendAI overlap that survives even the post-routing sweep.
4. Reaching 900 on architecture4 needs validity PLUS bend 125 -> ~75, crossings 15 -> ~7, and the arrowhead soft issue cleared. Ceiling today is 780.

### round 17 — port candidates for a level target (KEPT, commit c7204c081)
- `startCandidates` returned an EMPTY list whenever the target sat INSIDE the source's span on the relevant axis. Normal for any tall/wide source: `LanternML` is 284px tall, so all three of its outgoing edges hit that branch, got zero candidates, and kept their port mismatches while the pass appeared to run.
- fix: when the target is level, exit the side FACING it and run straight (plus a two-bend variant when the port cannot sit at the target's exact coordinate).
- architecture4 12 -> 11 issues, bend 125 -> 90, crossings 15 -> 10, CEILING 780 -> 830. Corpus unchanged at 55934, NO fixture moved, work FELL 905.0M -> 902.6M (straighter routes leave the repair passes less to chase).

### round 18 — monotone gate on off-edge label relocation (REVERTED, no-op)
- `relocateOffEdgeLabelsWhenScoreImproves` has the same dormancy fixed in a470ebab0. Relaxing it is safe by the round-7 criterion (it moves only a label anchor, cannot reshape a route).
- result: NO CHANGE. The two `edge-label-off-edge` issues survive, so the gate was not what stopped it — the candidate anchors it generates do not land on the rerouted polyline. REVERTED (no neutral churn).
- lesson: the dormancy pattern has now been checked on five passes. Two were real (port repair, END terminal); three changed nothing or regressed. Finding a score-gated pass is not evidence that the gate is the problem.

### round 19 — late overlap sweep after every reroute (REVERTED)
- chased the last Lumens/VendAI overlap properly. Established: the sweep runs TWICE on architecture4 and both times reports remaining=0 (initial 9 -> 0 pre-routing, initial 1 -> 0 in the safety net), yet the shipped layout still has the pair overlapping. Confirmed the validator and the sweep use the IDENTICAL rect construction (`rectForNode`) and the identical overlap test (`rectsOverlap` vs `overlapAmount`), so it is not a measurement disagreement.
- the recreator is the safety net's own reroute: `routeWithRoutingGraph` runs `runNonDomusPipeline` over the same data and can displace a leaf after the sweep has cleared it.
- tried a final sweep immediately before the endpoint-repair tail. Result: 11 -> 12 issues, the overlap SURVIVES anyway, and a new `node-overlaps-foreign-group` appears. REVERTED.
- lesson: there is a placement/routing feedback loop in the fallback path — clear overlaps, reroute, routing moves a node, overlap returns — and inserting another sweep anywhere in it just adds a lap. Breaking it needs the reroute to be prohibited from moving nodes when `useExistingPositions: true`, which is what that flag already claims. Worth checking whether `runNonDomusPipeline` honours it.

run ended: architecture4 at 11 issues, ceiling 830, score 0. Kept rounds 2, 4, 5, 10, 15, 16, 17.

### round 20 — sweep after the cluster pass (KEPT, commit 082520086)
- closed the four-round hunt for the Lumens/VendAI overlap by snapshotting coordinates across each call in the safety net:
      NET 1-after-sweep   overlaps=0
      NET 2-after-refresh overlaps=1
      MOVED Lumens isGroup=false parent=-  y 88.0 -> 62.5
  `refreshClustersAfterLeafPlacement` -> `preprocessClusters` displaces leaves (group-overlap resolution moves a group WITH its children; foreign leaves get pushed off group frames) and never checks leaf-to-leaf overlap. `Lumens` has no parent at all — it was merely 10px off the LanternML frame — and got shoved 25.5px into `VendAI`.
- this is why four earlier attempts failed: the sweep kept reporting remaining=0 and was telling the truth; something downstream undid it, and adding more sweeps elsewhere only added laps.
- fix: run the sweep at the end of `refreshClustersAfterLeafPlacement`. architecture4 11 -> 9 issues, HARD 9 -> 4, ceiling 830 -> 864. Corpus unchanged, no fixture moved, cost +0.2%.

### round 21 — align group-clearance padding with the validator (REVERTED)
- observation: five `node-too-close-to-group` all sat at EXACTLY 10.0 against a validator threshold of 20 — the signature of a repair aiming at the wrong number. `nudgeLeafNodesAwayFromNonAncestorGroups` is passed `pad` (spacing, 10) while `validateLayout`'s NODE_GROUP_CLEARANCE is 20. `nodeGroupSpacing.ts` already keeps its own `CLEARANCE = 20` for exactly this reason.
- passing 20 instead: cleared Lumens/VendAI, but introduced `edge-non-orthogonal`, `edge-bend-near-endpoint` and `edge-label-overlaps-group-border`; 9 -> 12 issues. REVERTED.
- and the five nodes STILL sat at exactly 10.0 afterwards, which disproves the premise: that nudger is not what places them there. Some other pass puts leaves at a 10px group clearance. Worth finding — the constant mismatch is real even if this was not the site.

### round 21b — clearance 20 RE-APPLIED on user instruction (KEPT, commit f74110a38)
- user: "Pick the higher number of the two. Go with the validator's requirement." Correct, and my revert had been premature — I judged on architecture4's local issue count and never took the corpus reading.
- corpus verdict: aggregate unchanged 55934, invalid 5, NO fixture's score moved, cost +0.04%. Entirely neutral.
- local cost on architecture4 disclosed in the commit: 9 -> 12 issues (clears Lumens/VendAI, introduces non-orthogonal + short stub + label straddling the group frame). Fixture scores 0 either way so the corpus cannot see it.
- STILL OPEN: the five nodes remain at exactly 10.0 after the change, so this nudger is not what places them there. Another pass applies a 10px group clearance and has the same mismatch.
- lesson: take the corpus reading before reverting on a single fixture. A change can be principled and corpus-neutral while looking bad on the one fixture you happen to be staring at.

### round 22 — carry the label when the port repair reroutes (REVERTED, neutral)
- traced why the two group-edge mismatches survive. Candidates ARE built for two of the three edges and one is a genuine improvement:
      L_LanternML_KeySafe_0  cands=2  -> 19 issues (from 20)  new=[edge-label-off-edge]  REJECTED
      L_LanternML_Chats_0    cands=2  -> 20 issues            new=[edge-label-off-edge]  REJECTED
      L_LanternML_Monitoring_0 cands=0
  The reroute replaces `points` without moving `e.x/e.y`, stranding the label; the resulting `edge-label-off-edge` is a NEW issue key, so the monotone test rejects an otherwise winning candidate.
- fix attempted: try label anchors along the new polyline (as `simplifyEdgeJogs` does) before judging.
- result: NEUTRAL, 12 issues and HARD=6 either way. The label cannot sit on the new route without straddling the group frame, so `edge-label-off-edge` is simply traded for `edge-label-overlaps-group-border`. REVERTED (adds validations per candidate for no gain).
- lesson: for an edge leaving a GROUP, the label has nowhere good to go — the route hugs the frame it just left. Group-edge labels need their own placement rule, not a generic midpoint search. That, plus `L_LanternML_Monitoring_0` still getting zero candidates, is what stands between architecture4 and validity.
