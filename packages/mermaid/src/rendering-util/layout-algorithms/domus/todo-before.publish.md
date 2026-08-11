# Things todo

- Double check the corner handling for the orthogonal lines. It seems like sometimes they're not straight. See Company-simp.md, for instance.
- In Company-simp.md, the edge key K and expenses are not on top of each other. This might or might not be a blocker. Check theory.
- In Company.mmd: The nodex Income and Tax are not horizontally aligned. Tax, USCompany and Expenses are not vertically alignment.
- we see artifacts when using classic, why. It should render good regardless

- layout-tests/domus/decoupled-subgraph.mmd
  - subgraph title”hello” spacing is not correct, Node “D” is overlapping parts of the subgraph
  - should subgraph and other A —> B behorintally aligned as per the docs?

- layout-tests/domus/deploy-pipeline.mmd
  - Should “notify Developer” and “Start build” horizontally align with other nodes likes “deploy to Production” or “Tests Passe?” According to the papers?

- layout-tests/domus/edge-types.mmd
  - E3 should vertically align with E5, R2 & R1
  - E1, L1 & L2 should also align vertically

- layout-tests/domus/incremental-editing.mmd
  - broken edges for doimond shape “Overlap or invalid geometry>”
  - top three needs must align vertically
  - lots of alignment issues, needs more orthogonalization

- layout-tests/domus/life-choices.mmd
  - Bring back cable jumps? (Optional)
- layout-tests/domus/self-loop.mmd
  - self loop is broken

- layout-tests/domus/subgraph-variation-2.mmd
  - broken link between subgraph

- layout-tests/domus/subgraph-variation.mmd
  - P2 P3 not aligning
  - A is hanging in the air

- Performance
- Make the architecture fixture work

## Scoring / validator

- Crossing penalty is a flat 3 points per crossing event, summed globally. The
  literature's per-edge measure is the **local crossing number** — the maximum
  number of crossings on any single edge (2510.00331v3, 2025) — and it is
  provably a different objective from the global sum: local crossing
  minimization is separately NP-hard and the median heuristic's approximation
  ratio changes to 3 (tight). Optimising the total does not optimise the
  per-edge worst case.
  - Proposal: keep the global count and **add** a max-per-edge term, mirroring
    how DOMUS's own paper reports "total Bends … Max Bends" side by side.
  - Consider making the first crossing on an edge free and charging from the
    second ("one crossing is fine").
  - Consider lowering the per-crossing constant. DOMUS routes orthogonally and
    LIPIcs.GD.2025.35 argues "orthogonal crossings ... have minimal impact on
    readability". Contradicted by 2008.10583v4, so this is a live disagreement.
  - No published quality metric scores crossings per edge; the local crossing
    number appears only as a combinatorial target. Any curve we pick is an
    engineering choice to validate on our own fixtures, not a literature
    default. There is no crossings-vs-bends exchange rate anywhere in the corpus.

- **Floor-avoidance scoring instead of a linear sum out of 1000.** Pupyrev 2026
  (2607.23356v1) is the only post-2020 composite drawing-quality score in the
  corpus. Its open Problem 1 argues a good method "should avoid weak scores on
  individual aesthetics rather than merely maximize an aggregate score", and it
  warns that the aggregation choice is itself the metric design decision: "a
  worst-case edge-length ratio penalizes one outlier, whereas average or
  percentile measures describe global behavior". Our current scorer is exactly
  the aggregate-maximising shape that argument is against. Deciding this is a
  bigger change than retuning the crossing weight and is deliberately parked.
  - Caution: HOLA's is the only primary human-subject data in the corpus, and it
    puts compactness (+0.69..+0.87, significant on all 8 graphs) _above_
    crossings (-0.25..-0.66, significant on 5 of 7) as a predictor of human
    preference. Our scorer has no compactness term at all.

- **Algorithm-specific validation.** `validateLayout` is shared by domus,
  swimlanes and cose-bilkent, so any scoring change affects all of them. Add an
  optional `extensions` parameter (per-algorithm hard checks + graded penalties)
  and make `domus/validateLayoutProxy.ts` the real per-algorithm entry point.
  Today that proxy is a bare re-export and only 6 of 20 domus files use it, the
  other 14 import `layout-utils/validateLayout` directly — those must be
  switched, or half the passes would score under core rules and half under
  domus rules. The DDLT sweep needs the matching per-profile change, and note
  that the aggregate stops being comparable across algorithms once scoring
  diverges.
