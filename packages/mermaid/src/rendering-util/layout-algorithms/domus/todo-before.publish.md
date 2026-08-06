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
